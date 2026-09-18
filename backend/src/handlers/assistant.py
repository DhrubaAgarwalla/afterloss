"""Assistant Lambda: 'explain this step' and 'search the web' with Amazon Nova 2 Lite.

Order of operations is the privacy story:
  1. Cedar check (UseAssistant) when a case is involved
  2. daily quota per user (cost guard)
  3. PII firewall: regex + checksum, known family names → roles, Comprehend second pass
  4. model call; web answers keep their citations
  5. deterministic fallback if the model is unavailable
"""
from __future__ import annotations

from datetime import datetime, timezone

from afterloss.app import service as svc
from afterloss.app.service import ApiError
from afterloss.aws import ai
from afterloss.privacy import scrub

from .api import deps
from .http import api, body_of, email_of

DAILY_LIMIT = 40


def _route_context(asset: dict) -> str:
    r = asset.get("route") or {}
    lines = [f"Asset: {asset.get('assetType')} at {asset.get('institution') or 'a bank'}",
             f"Route: {(r.get('title') or {}).get('en', r.get('route', ''))}"]
    cit = r.get("citation") or {}
    if cit:
        lines.append(f"Rule: RBI Directions 2025 para {cit.get('para')}: \"{cit.get('quote')}\"")
    for d in r.get("documents") or []:
        lines.append(f"Document needed: {d.get('en')}")
    for n in r.get("notes") or []:
        lines.append(f"Note (para {n.get('para')}): {n.get('en')}")
    for c in r.get("checklist") or []:
        lines.append(f"Step: {c.get('en')}")
    clock = asset.get("clock") or {}
    if clock.get("dueDate"):
        lines.append(f"Bank must settle by {clock['dueDate']} (para 31); late means interest at Bank Rate + 4% (para 33).")
    return "\n".join(lines)


def _fallback(asset: dict | None, lang: str) -> str:
    if not asset:
        return ("I couldn't reach the AI model right now. Your claim steps and rules are still shown on each asset, "
                "with the RBI paragraph they come from.") if lang != "hi" else "अभी एआई मॉडल उपलब्ध नहीं है।"
    r = asset.get("route") or {}
    title = (r.get("title") or {}).get("hi" if lang == "hi" else "en", "")
    cit = r.get("citation") or {}
    return f"{title}. (RBI para {cit.get('para')})" if cit else title


def ask(event):
    store, authz = deps()
    email = email_of(event)
    body = body_of(event)
    question = (body.get("question") or "").strip()[:1200]
    mode = body.get("mode") or "explain"
    lang = "hi" if body.get("lang") == "hi" else "en"
    if not question:
        raise ApiError(400, "Type a question.", "invalid")

    cd, asset = None, None
    if body.get("caseId"):
        cd = svc.load_case(store, body["caseId"])
        svc.require(authz, email, "UseAssistant", cd)
        if body.get("assetId"):
            asset = cd.asset(body["assetId"])

    day = datetime.now(timezone.utc).strftime("%Y%m%d")
    used = store.add(f"USER#{email}", f"QUOTA#{day}", "n", 1)
    if used > DAILY_LIMIT:
        raise ApiError(429, "Daily limit for the assistant reached. It resets tomorrow.", "quota")

    known = {}
    if cd:
        known[cd.meta.get("deceasedName", "")] = "the deceased" if lang != "hi" else "मृतक"
        for p in cd.people:
            if p.get("fullName"):
                known[p["fullName"]] = f"my {p.get('relation', 'relative').lower()}" if lang != "hi" else "परिवार का सदस्य"
    clean, removed = scrub(question, known)

    try:
        if mode == "web":
            spans = ai.comprehend_pii(clean)
            clean, more = ai.redact_spans(clean, [s for s in spans if s["type"] not in {"DATE_TIME", "AGE", "URL"}])
            removed += more
            res = ai.grounded_answer(clean, lang)
        else:
            context = _route_context(asset) if asset else (
                "General help for families claiming bank deposits, lockers, PF, insurance and investments after a "
                "death in India. RBI Directions 2025: nominee route (paras 8-9), simplified route below Rs 15 lakh or "
                "Rs 5 lakh for co-operative banks (para 10(a)), 15-day settlement (para 31), compensation at Bank Rate "
                "+ 4% for delay (para 33).")
            res = ai.explain(context, clean, lang)
    except Exception:  # noqa: BLE001 - model unavailable → deterministic answer
        res = {"answer": _fallback(asset, lang), "citations": [], "grounded": False, "fallback": True}

    return 200, {**res, "removed": removed, "askedAs": clean, "mode": mode, "lang": lang}


@api
def handler(event, context):
    return ask(event)
