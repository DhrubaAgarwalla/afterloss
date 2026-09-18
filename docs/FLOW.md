# User flow v2: one guided path from "someone died" to "money received"

Written 19 Sep 2026 after testing v1 end to end. v1 had the right engine (rules, forms, clock, AI) but made the
family jump between tabs and guess what to do next. v2 asks for each fact once, in the order the official
forms need them, then turns everything into a step-by-step plan per asset.

## The path

```
Open case ─▶ 1 About them ─▶ 2 Family ─▶ 3 Who gets paid ─▶ 4 Their bank accounts ─▶ 5 Investments & policies
                                                                                              │
             8 Track every claim ◀── 7 Choose what to claim ◀── 6 Find what nobody knew about ◀┘
                  │
                  └─▶ per claim: documents → forms → sign & stamp → submit → 15-day clock → escalate
```

Every step saves on "Continue", can be skipped and resumed, and shows a progress bar. The home screen always
says which step is next.

## Steps

| # | Screen | What we ask | Why (where it's used) |
|---|---|---|---|
| 0 | **Open a case** | Name, date of death, date of birth, your relation, your name, their PAN (device only) | Case header; PAN only for official searches |
| 1 | **About them** | Place of death; death certificate no., date, issuing authority; marital status; address split as on the form (address, city/district, PIN, state); religion and law of succession (suggested from religion); did they leave a will? | Annex I-B section 2, I-E. A will changes the route (RBI para 11) |
| 2 | **Family** | Each legal heir: name, relation, age or DOB, address ("same as theirs" shortcut), mobile, email, ID type and last 4. Then: who is claiming, who isn't (they sign the no-objection), minors (guardian). Optional: an independent person who knows the family (declaration) | I-B heirs table (g) and (h), I-C, I-D, I-E |
| 3 | **Who gets paid** | For each claimant: bank, account number, IFSC (auto-fills bank and branch), branch | I-A 4.1 and I-B 5.1 payment tables |
| 4 | **Their bank accounts** | One card per bank. Three ways to add: type it · photo of the passbook first page (Textract reads bank, branch, IFSC, account no.) · upload a statement (we also scan it for hidden assets). Per account: type (savings, current, FD, RD, locker, safe custody), nominee (yes / joint either-or-survivor / no / don't know), approximate balance | Each account becomes a claim with its RBI route |
| 5 | **Investments & policies they had** | Quick-add by category: fixed deposits, mutual funds, shares / demat (Zerodha, Groww, Upstox…), life insurance, PF / pension / gratuity, PPF / post office / NPS, credit cards and loans (to inform, not claim), other. Each asks only its own identifier (folio, BO ID, policy no., UAN, PRAN…) with format checks. **Search their email**: one-tap Gmail searches for CAMS/KFintech statements, contract notes, premium receipts, dividend mails | Claims for non-bank assets |
| 6 | **Find what nobody knew about** | Upload bank statements → leads (dividends = shares, SIP = mutual funds, premiums = insurance…). Official searches: UDGAM, MITRA, IEPF, EPFO, unclaimed-assets portal, with the family's details ready to copy | Leads the family confirms or dismisses |
| 7 | **Choose what to claim** | One list of everything added or found, with a toggle each: claim / not relevant / track only (loans, cards) | Builds the plan |
| 8 | **Your claim plan** | Per asset, in order: ① documents (have / missing, with "how to get it") ② forms (pre-filled official formats to print) ③ sign and stamp (who signs what, stamp paper, notary) ④ where to submit ⑤ track the clock, compensation, letters, Ombudsman | Everything after this is tracking |

## Checks while typing

PAN (`AAAAA9999A`, 4th letter P for a person, 5th letter usually the surname's first letter) · IFSC (`AAAA0XXXXXX`, then live lookup) ·
mobile (10 digits, starts 6-9) · PIN (6 digits) · Aadhaar (only last 4 kept) · demat BO ID (16 digits CDSL, `IN` + 14 NSDL) ·
UAN (12 digits) · PRAN (12 digits) · dates (death after birth, certificate after death, not in the future).

## Forms: the official format, not a look-alike

RBI Annex I-A to I-H are printed from the **official standard format** (blank copy published by SBI, identical to
RBI's annex, no bank branding). We print the family's details onto the original pages, so layout, fonts, tables
and wording match what the bank expects. Blank positions are measured once from the template
(`scripts/map_form_blanks.py`) and stored as data. Assets outside RBI's Directions get a pre-filled request letter
plus the official form link.

## Missing a document? Guides

Death certificate (and late registration) · legal heir certificate (state names differ) · succession certificate
(civil court) · probate / letters of administration · stamp paper and e-stamping · notary · indemnity bond and
affidavit · claimant KYC. Each guide: who issues it, where to apply, documents, typical time, cost notes, official
link. State-specific stamp duty goes to the web-grounded assistant with sources, because rates change by state.

## What changes in the code

| Area | Change |
|---|---|
| Data | Case: address parts, will, setup progress. Person: own bank details, DOB, guardian (minors). Asset: account type, IFSC, nominee name, source, identifiers, include flag |
| API | Passbook OCR (`kind: passbook`), async assistant jobs (done), setup progress on the case |
| Rules as data | `playbooks.json` for non-bank assets (steps, documents, where, timelines, sources); `guides.json` for missing documents |
| Forms | `forms/official.py`: overlay on the official template; pack = cover + official forms + attachments |
| Web | `/cases/:id/setup/:step` wizard; home becomes a progress view; claim page becomes a numbered plan; guides page; validators |

## Build order (each ends deployed and committed)

1. Data fields + wizard steps 1-3 (about, family, who gets paid) + validators
2. Steps 4-5 (bank accounts with passbook OCR and statements, investments, email search)
3. Steps 6-7 (discovery inside the wizard, choose) + progress home
4. Official-format forms (overlay) in the claim pack
5. Claim plan per asset + playbooks + guides
6. Hindi for all new screens, browser test on phone size, docs, video notes
