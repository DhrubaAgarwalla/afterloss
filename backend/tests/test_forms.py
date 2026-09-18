import io

from PIL import Image, ImageDraw
from pypdf import PdfReader

from afterloss.forms import build_bank_delay_letter, build_ombudsman_draft, build_pack
from afterloss.rules import deposit_compensation, evaluate_asset

CASE = {"deceasedName": "Ramesh Kumar Sharma", "dod": "2026-07-02"}
CLAIMANTS = [
    {"fullName": "Sunita Sharma", "relation": "Wife", "age": 48, "address": "12, 4th Cross, Koramangala, Bengaluru 560034",
     "idType": "Aadhaar", "idLast4": "4821", "phone": "98XXXXXX10"},
    {"fullName": "Riya Sharma", "relation": "Daughter", "age": 20, "address": "12, 4th Cross, Koramangala, Bengaluru 560034",
     "idType": "PAN", "idLast4": "341K"},
]
NON_CLAIMANTS = [{"fullName": "Arjun Sharma", "relation": "Son", "age": 26, "address": "Flat 9B, Baner, Pune 411045"}]
DECLARANT = {"fullName": "K. Venkatesh Rao", "address": "14, 5th Cross, Koramangala, Bengaluru", "yearsKnown": 22}


def ctx_for(route, asset_extra=None):
    asset = {"institution": "Nandini Sahakari Bank", "branch": "Koramangala", "assetType": "term_deposit",
             "accountNumbers": ["FD 00231"], "amount": 320000, "route": route.route}
    asset.update(asset_extra or {})
    return {"case": CASE, "asset": asset, "route": route.to_dict(), "claimants": CLAIMANTS,
            "nonClaimants": NON_CLAIMANTS, "declarant": DECLARANT,
            "payment": {"accountHolder": "Sunita Sharma", "accountNumber": "XXXXXX2210", "ifsc": "DEMO0001234"},
            "brand": {"appName": "AfterLoss", "disclaimer": "Not legal advice."}, "generatedAt": "2026-09-18"}


def pdf_text(data: bytes) -> str:
    return "\n".join(p.extract_text() or "" for p in PdfReader(io.BytesIO(data)).pages)


def test_simplified_pack_contains_all_forms_and_attachments():
    route = evaluate_asset({"asset_type": "term_deposit", "nomination": "none", "bank_type": "cooperative",
                            "amount": 320000, "non_claimant_heirs": 1})
    img = Image.new("RGB", (800, 500), "white")
    ImageDraw.Draw(img).text((40, 40), "SAMPLE DEATH CERTIFICATE (test)", fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    pdf = build_pack(ctx_for(route), [{"label": "Death certificate", "image": buf.getvalue()}])
    assert pdf[:5] == b"%PDF-"
    text = pdf_text(pdf)
    for needle in ["Claim pack: Nandini Sahakari Bank", "Annex I-B", "Annex I-C", "Annex I-D", "Annex I-E",
                   "para 10(a)", "Arjun Sharma", "without any penal charge", "Death certificate", "Page 1 of"]:
        assert needle in text, needle
    assert "Annex I-A" not in text
    reader = PdfReader(io.BytesIO(pdf))
    assert len(reader.pages) >= 6


def test_nominee_pack_is_only_I_A():
    route = evaluate_asset({"asset_type": "bank_deposit", "nomination": "nominee"})
    pdf = build_pack({**ctx_for(route), "nominees": CLAIMANTS[:1], "claimants": CLAIMANTS[:1], "nonClaimants": []})
    text = pdf_text(pdf)
    assert "Annex I-A" in text and "trustee" in text
    assert "Annex I-B" not in text


def test_delay_letter_and_ombudsman_draft_quote_the_numbers():
    route = evaluate_asset({"asset_type": "term_deposit", "nomination": "none", "bank_type": "cooperative", "amount": 320000})
    comp = deposit_compensation(320000, "2026-08-01", today="2026-08-26")
    letter = pdf_text(build_bank_delay_letter(ctx_for(route), comp, today="2026-08-26"))
    assert "para 33" in letter and "9.50%" in letter and "Rs. 832.88" in letter and "2026-08-16" in letter
    draft = pdf_text(build_ombudsman_draft(ctx_for(route), comp, bank_letter_date="2026-08-26", today="2026-09-26"))
    assert "cms.rbi.org.in" in draft and "Nandini Sahakari Bank" in draft
