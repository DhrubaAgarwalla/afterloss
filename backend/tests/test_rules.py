import itertools

import pytest

from afterloss.rules import evaluate_asset
from afterloss.rules.verify import verify


def route(**facts):
    return evaluate_asset(facts)


# ---------- deposits ----------

def test_nominee_route_needs_only_I_A_irrespective_of_amount():
    r = route(asset_type="bank_deposit", nomination="nominee", amount=90_00_000, bank_type="commercial")
    assert r.route == "NOMINEE"
    assert r.forms == ["I-A"]
    assert r.citation["para"] == "8–9"
    assert "irrespective of the amount" in r.citation["quote"]


def test_survivor_clause_is_nominee_route():
    assert route(asset_type="bank_deposit", nomination="survivor").route == "NOMINEE"


def test_unknown_nomination_asks_instead_of_guessing():
    r = route(asset_type="bank_deposit", nomination="unknown", amount=100000, bank_type="commercial")
    assert r.route == "NEEDS_INFO"
    assert [q["fact"] for q in r.missing] == ["nomination"]


def test_demo_case_coop_fd_3_2_lakh_is_simplified():
    r = route(asset_type="term_deposit", nomination="none", bank_type="cooperative",
              amount=3_20_000, non_claimant_heirs=1)
    assert r.route == "SIMPLIFIED"
    assert r.citation["para"] == "10(a)"
    assert r.forms == ["I-B", "I-C", "I-D", "I-E"]
    assert r.threshold["limit_inr"] == 5_00_000
    assert r.threshold["citation"]["para"] == "7(h)"
    paras = [n["para"] for n in r.notes]
    assert "13" in paras  # term deposit can be closed early without penalty
    assert "29" in paras  # submit at any branch against acknowledgement


def test_coop_threshold_boundary_is_inclusive():
    assert route(asset_type="bank_deposit", nomination="none", bank_type="cooperative", amount=5_00_000).route == "SIMPLIFIED"
    assert route(asset_type="bank_deposit", nomination="none", bank_type="cooperative", amount=5_00_001).route == "ABOVE_THRESHOLD"


def test_commercial_threshold_is_15_lakh():
    assert route(asset_type="bank_deposit", nomination="none", bank_type="commercial", amount=14_99_999).route == "SIMPLIFIED"
    assert route(asset_type="bank_deposit", nomination="none", bank_type="commercial", amount=15_00_000).route == "SIMPLIFIED"
    above = route(asset_type="bank_deposit", nomination="none", bank_type="commercial", amount=15_50_000)
    assert above.route == "ABOVE_THRESHOLD"
    assert above.citation["para"] == "10(b)"


def test_no_noc_form_when_every_heir_is_claiming():
    r = route(asset_type="bank_deposit", nomination="none", bank_type="commercial", amount=50_000, non_claimant_heirs=0)
    assert "I-D" not in r.forms


def test_legal_heir_certificate_replaces_annex_I_E():
    r = route(asset_type="bank_deposit", nomination="none", bank_type="commercial", amount=50_000, legal_heir_certificate=True)
    assert "I-E" not in r.forms


def test_missing_amount_and_bank_type_are_asked():
    r = route(asset_type="bank_deposit", nomination="none")
    assert r.route == "NEEDS_INFO"
    assert {q["fact"] for q in r.missing} == {"amount", "bank_type"}


def test_court_order_blocks_everything():
    assert route(asset_type="bank_deposit", nomination="nominee", court_order=True).route == "BLOCKED_BY_COURT"


def test_dispute_goes_to_court_but_not_for_nominee_accounts():
    assert route(asset_type="bank_deposit", nomination="none", dispute=True, amount=1000, bank_type="commercial").route == "DISPUTE_COURT"
    # Nominee is paid as trustee; a family dispute is settled among heirs afterwards (paras 8–9).
    assert route(asset_type="bank_deposit", nomination="nominee", dispute=True).route == "NOMINEE"


def test_will_route():
    r = route(asset_type="bank_deposit", nomination="none", will=True, amount=1000, bank_type="commercial")
    assert r.route == "WILL"
    assert r.citation["para"] == "11(a)"


def test_joint_note_only_for_joint_accounts():
    joint = route(asset_type="bank_deposit", nomination="nominee", joint=True)
    solo = route(asset_type="bank_deposit", nomination="nominee", joint=False)
    assert any("all the depositors" in n["quote"] for n in joint.notes)
    assert not any("all the depositors" in n["quote"] for n in solo.notes)


# ---------- lockers ----------

def test_locker_with_nominee():
    r = route(asset_type="locker", nomination="nominee")
    assert r.route == "LOCKER_NOMINEE"
    assert r.forms == ["I-A"]  # I-F inventory happens at the branch
    assert any(d["id"] == "inventory_I_F" for d in r.documents)


def test_safe_custody_uses_I_G_inventory():
    r = route(asset_type="safe_custody", nomination="nominee")
    ids = [d["id"] for d in r.documents]
    assert "inventory_I_G" in ids and "inventory_I_F" not in ids


def test_locker_without_nominee_is_simplified_with_valuation():
    r = route(asset_type="locker", nomination="none", non_claimant_heirs=2)
    assert r.route == "LOCKER_SIMPLIFIED"
    ids = [d["id"] for d in r.documents]
    assert "indemnity_valuation_I_H" in ids
    assert r.forms == ["I-B", "I-D", "I-E"]


def test_locker_will_and_dispute():
    assert route(asset_type="locker", nomination="none", will=True).route == "WILL"
    assert route(asset_type="locker", nomination="none", dispute=True).route == "DISPUTE_COURT"


# ---------- other assets ----------

@pytest.mark.parametrize("asset,expected", [
    ("epf", "EPF_DEATH_CLAIM"),
    ("life_insurance", "INSURANCE_DEATH_CLAIM"),
    ("pmjjby", "PMJJBY_CLAIM"),
    ("pmsby", "PMSBY_CLAIM"),
    ("mutual_fund", "MF_TRANSMISSION"),
    ("shares", "SHARES_TRANSMISSION"),
    ("govt_scheme", "GOVT_SCHEME_CLAIM"),
    ("loan", "LIABILITY_CHECK"),
    ("other", "GENERIC"),
])
def test_checklist_routes(asset, expected):
    r = route(asset_type=asset)
    assert r.route == expected
    assert r.automation == "checklist"
    assert r.checklist


def test_bad_inputs_are_rejected():
    with pytest.raises(ValueError):
        route(asset_type="crypto")
    with pytest.raises(ValueError):
        route(asset_type="bank_deposit", nomination="maybe")
    with pytest.raises(ValueError):
        route(asset_type="bank_deposit", bank_type="payments")


def test_rules_are_exhaustive_for_every_combination():
    combos = itertools.product(
        ["bank_deposit", "term_deposit", "locker", "safe_custody"],
        ["nominee", "survivor", "none", "unknown"],
        [None, "cooperative", "commercial"],
        [None, 0, 4_99_999, 5_00_000, 15_00_001],
        [False, True],  # will
        [False, True],  # dispute
        [False, True],  # court_order
    )
    for asset, nom, bank, amt, will, dispute, court in combos:
        r = route(asset_type=asset, nomination=nom, bank_type=bank, amount=amt,
                  will=will, dispute=dispute, court_order=court)
        assert r.route
        if r.route != "NEEDS_INFO" and r.automation != "checklist":
            assert r.citation and r.citation["quote"]


def test_every_citation_is_verbatim_in_the_hashed_source():
    ok, lines = verify()
    assert ok, "\n".join(lines)
