"""Pack Lambda: build the pre-filled claim pack PDF for one asset."""
from __future__ import annotations

import io
from datetime import datetime, timezone

from afterloss.app import service as svc
from afterloss.app.service import ApiError
from afterloss.aws import files
from afterloss.forms import build_claim_letter_pack, build_pack
from afterloss.rules.engine import BANK_ASSETS, LOCKER_ASSETS

from .api import deps
from .http import api, email_of, params

LABELS = {"death_certificate": "Death certificate (copy)", "id_proof": "ID proof (Aadhaar masked)"}


def _image_for(doc: dict) -> bytes | None:
    key = doc.get("maskedKey")
    if key:
        return files.get_bytes(key)
    if doc.get("kind") == "id_proof":
        return None  # never attach an unmasked ID; the family can run masking first
    data = files.get_bytes(doc["s3Key"])
    if data[:5] == b"%PDF-":
        import pypdfium2 as pdfium

        buf = io.BytesIO()
        pdfium.PdfDocument(data)[0].render(scale=2).to_pil().convert("RGB").save(buf, format="PNG")
        return buf.getvalue()
    if (doc.get("contentType") or "").startswith("image/"):
        return data
    return None


def build(event):
    store, authz = deps()
    email = email_of(event)
    cd = svc.load_case(store, params(event)["caseId"])
    svc.require(authz, email, "EditCase", cd)
    asset = cd.asset(params(event)["assetId"])
    route = asset.get("route") or {}
    bank = asset.get("assetType") in BANK_ASSETS | LOCKER_ASSETS
    if route.get("route") == "NEEDS_INFO":
        raise ApiError(400, "Answer the open questions for this claim first.", "not_ready")
    if not any(p.get("isClaimant") or p.get("isNominee") for p in cd.people):
        raise ApiError(400, "Add at least one claimant or nominee under Family first.", "no_people")
    attachments = []
    skipped = []
    for d in cd.docs:
        if d.get("kind") in LABELS and d.get("assetId") in ("", asset["assetId"]):
            img = _image_for(d)
            if img:
                attachments.append({"label": f"{LABELS[d['kind']]}: {d.get('filename')}", "image": img})
            else:
                skipped.append(d.get("filename"))
    ctx = svc.pack_context(cd, asset)
    pdf = build_pack(ctx, attachments) if bank else build_claim_letter_pack(ctx, attachments)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    inst = (asset.get("institution") or "bank").replace(" ", "-")[:40]
    key = f"cases/{cd.case_id}/packs/{asset['assetId']}-{ts}.pdf"
    files.put_bytes(key, pdf, "application/pdf")
    doc = svc.record_generated_doc(store, cd.case_id, "pack", key, f"claim-pack-{inst}.pdf", asset["assetId"])
    fields = {"packDocId": doc["docId"]}
    if asset.get("status") in {"ready", "draft"}:
        fields["status"] = "pack_ready"
    store.update(svc.pk(cd.case_id), asset["SK"], fields)
    what = f"{len(route.get('forms') or [])} RBI form(s) on the official format" if bank else "plan and pre-filled claim letter"
    svc.add_event(store, cd.case_id, "pack", f"Claim pack ready for {asset.get('institution')} "
                  f"({what}, {len(attachments)} attachment(s)).", email,
                  asset["assetId"], text_hi=f"{asset.get('institution')} के लिए दावा पैक तैयार।")
    from pypdf import PdfReader

    pages = len(PdfReader(io.BytesIO(pdf)).pages)
    return 201, {"docId": doc["docId"], "url": files.presign_get(key, doc["filename"]), "pages": pages,
                 "skippedUnmasked": skipped}


@api
def handler(event, context):
    if event.get("routeKey", "").endswith("/pack"):
        return build(event)
    raise ApiError(404, "No such route.", "not_found")
