"""RBI standard claim formats (Annex I-A to I-E of RBI/2025-26/82), pre-filled.

The layouts follow what each Annex is for under the Directions (paras 9, 10(a),
18, 23(b)): who signs, which facts are declared, and which documents go with
it. The bank's own printed copy of the same standard form carries the same
content, so families can copy from this if a branch insists on its own sheet.
"""
from __future__ import annotations

from .doc import AMBER, AMBER_TINT, Doc, rupees

RBI_REF = "RBI (Settlement of Claims in respect of Deceased Customers of Banks) Directions, 2025 (RBI/2025-26/82)"


def _addressee(d: Doc, ctx: dict) -> None:
    a = ctx["asset"]
    d.text("To,", size=9.5)
    d.text("The Branch Manager", size=9.5)
    d.text(f"{a.get('institution') or '[Bank name]'}", size=9.5, bold=True)
    d.text(f"{a.get('branch') or '[Branch]'}", size=9.5)
    d.space(6)


def _deceased(d: Doc, ctx: dict) -> None:
    c, a = ctx["case"], ctx["asset"]
    d.heading("Details of the deceased customer")
    d.field("Name (as in bank records)", a.get("nameAsPerBank") or c.get("deceasedName"))
    d.field("Date of death", c.get("dod"))
    kind = "Safe deposit locker" if a.get("assetType") == "locker" else (
        "Articles in safe custody" if a.get("assetType") == "safe_custody" else "Deposit account(s)")
    d.field(kind, ", ".join(a.get("accountNumbers") or []) or "[Account / locker number]")
    if a.get("accountType"):
        d.field("Type of account", a.get("accountType"))
    if a.get("amount") not in (None, ""):
        d.field("Approximate balance (incl. interest)", rupees(a.get("amount")))


def _person_rows(people: list[dict]) -> list[list[str]]:
    rows = []
    for i, p in enumerate(people, 1):
        idv = f"{p.get('idType') or ''} XXXX{p.get('idLast4')}" if p.get("idLast4") else (p.get("idType") or "")
        rows.append([str(i), p.get("fullName", ""), p.get("relation", ""), str(p.get("age") or ""),
                     p.get("address", ""), idv.strip()])
    return rows


def annex_I_A(d: Doc, ctx: dict) -> None:
    """Claim by nominee(s)/survivor(s): paras 9 and 18."""
    d.title("Annex I-A: Claim form (nominee / survivor)",
            f"Format as per {RBI_REF}, paras 9 and 18")
    _addressee(d, ctx)
    d.para("Sub: Claim for settlement of the account(s) / locker of the deceased customer as nominee(s) / survivor(s)")
    _deceased(d, ctx)
    nominees = ctx.get("nominees") or ctx.get("claimants") or []
    d.heading("Details of the nominee(s) / survivor(s) making this claim")
    d.table(["#", "Name", "Relationship", "Age", "Address", "ID (OVD)"], _person_rows(nominees),
            [22, 110, 70, 34, 175, 88])
    d.heading("Declaration")
    d.para("I/We, the nominee(s)/survivor(s) named above, claim the balance / contents standing in the name of the "
           "deceased. I/We understand that the payment / access is given to me/us as trustee(s) of the legal heir(s) "
           "of the deceased, and that it does not affect any right or claim which any person may have against me/us "
           "(para 8(iii) / para 19). To the best of my/our knowledge, no court order restrains this payment.")
    d.heading("Documents enclosed")
    for label in ["Death certificate of the deceased", "Officially Valid Document (ID and address proof) of each nominee/survivor"]:
        d.checkbox_line(label, checked=True)
    _payment(d, ctx)
    d.heading("Signature(s) of nominee(s) / survivor(s)", keep_with=80)
    d.signature_boxes([{**p, "role": p.get("relation") or "Nominee"} for p in nominees])


def annex_I_B(d: Doc, ctx: dict) -> None:
    """Claim by legal heirs where there is no nominee: paras 10(a) and 23(b)."""
    d.title("Annex I-B: Claim form (legal heirs, no nominee)",
            f"Format as per {RBI_REF}, paras 10(a) and 23(b)")
    _addressee(d, ctx)
    d.para("Sub: Claim for settlement of the account(s) / locker of the deceased customer by legal heir(s)")
    _deceased(d, ctx)
    claimants, others = ctx.get("claimants") or [], ctx.get("nonClaimants") or []
    d.heading("All legal heirs of the deceased")
    rows = _person_rows(claimants) + [[str(len(claimants) + i), p.get("fullName", ""), p.get("relation", ""),
                                       str(p.get("age") or ""), p.get("address", ""), "Not claiming (Annex I-D)"]
                                      for i, p in enumerate(others, 1)]
    d.table(["#", "Name", "Relationship", "Age", "Address", "ID (OVD) / status"], rows, [22, 110, 70, 34, 170, 93])
    d.heading("Declaration by the claimant(s)")
    for line in [
        "The deceased did not make a nomination, and the account was not held with a survivorship clause.",
        "The deceased did not leave a Will, to the best of our knowledge.",
        "There is no dispute or contesting claim among the legal heirs.",
        "There is no court order restraining the bank from making this payment, to our knowledge.",
    ]:
        d.checkbox_line(line, checked=True)
    if ctx["asset"].get("assetType") == "term_deposit":
        d.note_box("Term deposit: please close it before maturity without any penal charge, as allowed on the "
                   "depositor's death (para 13).")
    d.heading("Documents enclosed")
    docs = ["Death certificate of the deceased", "Officially Valid Document of each claimant",
            "Bond of indemnity (Annex I-C) signed by the claimant(s)"]
    if others:
        docs.append("Letter(s) of disclaimer / no objection (Annex I-D) from non-claimant legal heir(s)")
    docs.append("Legal Heir Certificate, or Declaration / Affidavit regarding legal heirs (Annex I-E)")
    for label in docs:
        d.checkbox_line(label, checked=True)
    _payment(d, ctx)
    d.heading("Signature(s) of claimant legal heir(s)", keep_with=80)
    d.signature_boxes([{**p, "role": p.get("relation") or "Claimant"} for p in claimants])


def annex_I_C(d: Doc, ctx: dict) -> None:
    """Bond of indemnity: para 10(a)(iv)."""
    a = ctx["asset"]
    claimants = ctx.get("claimants") or []
    d.title("Annex I-C: Bond of indemnity", f"Format as per {RBI_REF}, para 10(a)")
    names = ", ".join(p.get("fullName", "") for p in claimants) or "[claimant names]"
    d.para(f"This bond of indemnity is executed by {names} (the claimant(s)) in favour of "
           f"{a.get('institution') or '[Bank]'}, {a.get('branch') or '[Branch]'} (the Bank).")
    d.para(f"Whereas the late {ctx['case'].get('deceasedName')} held the account(s) / locker "
           f"{', '.join(a.get('accountNumbers') or []) or '[numbers]'} with the Bank and died on "
           f"{ctx['case'].get('dod')}; and whereas the claimant(s) have applied to the Bank to pay the balance "
           f"{('of about ' + rupees(a.get('amount'))) if a.get('amount') else ''} standing to the credit of the deceased "
           "without production of a succession certificate, letter of administration or probate:")
    d.para("Now, in consideration of the Bank paying the said amount to the claimant(s), the claimant(s) jointly and "
           "severally agree to indemnify and keep the Bank indemnified against all claims, demands, proceedings, losses, "
           "costs and expenses that the Bank may suffer or incur by reason of making such payment.")
    if (a.get("route") or "") == "SIMPLIFIED":
        d.note_box("Up to the threshold limit, the bank shall not ask for a bond of surety from a third party "
                   "(para 10(a)). Only the claimant(s) sign this bond.")
    d.note_box("Stamp duty: some banks ask for this bond on stamp paper as per state law. Check with the branch "
               "before signing.", color=AMBER, fill=AMBER_TINT)
    d.heading("Signed by the claimant(s)", keep_with=80)
    d.signature_boxes([{**p, "role": p.get("relation") or "Claimant"} for p in claimants])
    d.heading("Witnesses", keep_with=80)
    d.signature_boxes([{"fullName": "", "role": "Witness 1: name and address"},
                       {"fullName": "", "role": "Witness 2: name and address"}], place_date=False)


def annex_I_D(d: Doc, ctx: dict) -> None:
    """Letter of disclaimer / no objection from each non-claimant legal heir: para 10(a)(v)."""
    others = ctx.get("nonClaimants") or []
    claimants = ctx.get("claimants") or []
    for i, p in enumerate(others):
        if i:
            d.new_page()
        d.title("Annex I-D: Letter of disclaimer / no objection", f"Format as per {RBI_REF}, para 10(a)")
        _addressee(d, ctx)
        d.field("Name of the non-claimant legal heir", p.get("fullName"))
        d.field("Relationship with the deceased", p.get("relation"))
        d.field("Address", p.get("address"))
        d.space(6)
        names = ", ".join(c.get("fullName", "") for c in claimants) or "[claimant names]"
        d.para(f"I, {p.get('fullName')}, a legal heir of the late {ctx['case'].get('deceasedName')}, declare that I "
               f"have no objection to the Bank settling the claim in respect of the account(s) / locker "
               f"{', '.join(ctx['asset'].get('accountNumbers') or []) or '[numbers]'} in favour of {names}, and I "
               "disclaim my share in this claim with the Bank.")
        d.heading("Signature", keep_with=80)
        d.signature_boxes([{**p, "role": "Non-claimant legal heir"}], cols=1)


def annex_I_E(d: Doc, ctx: dict, affidavit: bool = False) -> None:
    """Declaration (or affidavit) regarding legal heirs by an independent person: paras 10(a), 10(b), 23(b)."""
    kind = "Affidavit" if affidavit else "Declaration"
    dec = ctx.get("declarant") or {}
    d.title(f"Annex I-E: {kind} regarding legal heirs", f"Format as per {RBI_REF}, paras 10(a), 10(b) and 23(b)")
    d.note_box("To be made by an independent person who knows the family well, is not a party to the claim and is "
               "acceptable to the bank." + (" This version must be sworn before a Notary Public / Judge / Judicial "
                                             "Magistrate." if affidavit else ""))
    d.field("Name of the declarant", dec.get("fullName"))
    d.field("Address", dec.get("address"))
    d.field("Known to the family for", f"{dec.get('yearsKnown')} years" if dec.get("yearsKnown") else "")
    d.space(4)
    d.para(f"I, {dec.get('fullName') or '[declarant]'}, solemnly declare that I know the family of the late "
           f"{ctx['case'].get('deceasedName')}, who died on {ctx['case'].get('dod')}, and that the following are "
           "the only legal heirs of the deceased. I am not a party to this claim.")
    heirs = (ctx.get("claimants") or []) + (ctx.get("nonClaimants") or [])
    d.table(["#", "Name of legal heir", "Relationship", "Age", "Address"],
            [[str(i), p.get("fullName", ""), p.get("relation", ""), str(p.get("age") or ""), p.get("address", "")]
             for i, p in enumerate(heirs, 1)], [22, 140, 90, 34, 213])
    d.heading("Signature of the declarant", keep_with=80)
    d.signature_boxes([{**dec, "role": "Declarant"}], cols=1)
    if affidavit:
        d.heading("Attestation", keep_with=80)
        d.signature_boxes([{"fullName": "", "role": "Notary Public / Judge / Judicial Magistrate (seal)"}], cols=1)


def _payment(d: Doc, ctx: dict) -> None:
    p = ctx.get("payment") or {}
    d.heading("Pay the amount to")
    d.field("Account holder", p.get("accountHolder"))
    d.field("Account number", p.get("accountNumber"))
    d.field("IFSC / bank", " / ".join(x for x in [p.get("ifsc"), p.get("bankName")] if x))


RENDERERS = {
    "I-A": annex_I_A,
    "I-B": annex_I_B,
    "I-C": annex_I_C,
    "I-D": annex_I_D,
    "I-E": annex_I_E,
}
