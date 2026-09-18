# PRD: AfterLoss (working name)

> The display name lives in one place (`config/brand.json`), so renaming is a one-line change.

**One line:** AfterLoss helps an Indian family **find** what a person who died left behind, **fill** the claim forms once, **file** them, and **follow up** with legal deadlines until the money arrives.

Status: MVP for the First Commit hackathon (deadline Sun 20 Sep 2026). Owner: team. Last updated: 18 Sep 2026.

---

## 1. Problem

When a parent dies in India, the family (often a college-going child) faces three problems at once:

1. **They don't know what exists.** Shares, mutual funds, an old FD, a locker, an insurance policy or a PF balance can be invisible to the family. Dormant money piles up: ₹1.82 lakh crore of unclaimed financial assets was the reason the government ran the "Aapki Poonji, Aapka Adhikar" campaign (Oct–Dec 2025) and launched a unified search gateway on 1 June 2026.
2. **Every institution wants different paperwork**, usually revealed one visit at a time. Families are often asked for court papers (succession certificate) even where rules don't require them.
3. **Nobody tracks time.** Families don't know that since RBI's 2025 Directions, banks must settle deposit claims within **15 calendar days** of receiving complete documents (para 31) and pay **interest at Bank Rate + 4%** for delays they cause (para 33).

### Why now

| Change | Effect |
|---|---|
| RBI (Settlement of Claims in respect of Deceased Customers of Banks) Directions, 2025. Issued 26 Sep 2025, in force by 31 Mar 2026. | Standard forms (Annex I-A to I-H), a simplified route without court papers up to ₹15 lakh (₹5 lakh at co-op banks), date-stamped acknowledgements, a 15-day clock and compensation. **The process is now rule-based, so software can apply it.** |
| Banking Laws (Amendment) Act 2025, in effect 1 Nov 2025 | Up to 4 nominees per account, with shares |
| SEBI MITRA (Feb 2025), DigiLocker data-access nominees (Apr 2025) | New ways to discover mutual funds and securities |
| Unified portal "Your Money, Your Right" (1 Jun 2026) | One gateway to UDGAM, MITRA, IEPF, insurers and EPFO. It links out and does not search itself. |

### What official searches can't do

UDGAM, MITRA and IEPF only show money that has been **dormant for 7–10 years**. For a person who died recently, their accounts are still active and won't appear there. **Recent assets must be found from the family's own documents.** That is our discovery engine.

---

## 2. Users and personas

| Persona | Who | Needs |
|---|---|---|
| **Case lead**: Riya, 20, engineering student, Bengaluru | Reads English, has a phone, is doing this between classes | A clear plan, the next action, forms that are already filled |
| **Heir**: Sunita, 48, Riya's mother, Hindi-first | Is the nominee on some accounts, uses WhatsApp, low confidence with forms | Hindi explanations, big text, knowing what to sign |
| **Remote heir**: Arjun, 26, Riya's brother, works in Pune | Needs to sign a no-objection letter, wants to see progress | Visibility without phone calls |
| **Helper**: Mr. Rao, family friend or chartered accountant | Helps with one or two tasks | Access only to assigned tasks, never to original ID documents |

Banks are **not** users; they receive paper, as they do today.

## 3. Goals and non-goals

**Goals**
- G1. Turn the family's documents into a list of **leads** (possible assets) with evidence.
- G2. Give each asset a **route** (nominee, simplified or legal-representation) with the **exact paragraph cited**.
- G3. Produce **print-ready packs**: RBI standard forms pre-filled, attachments masked, and signature boxes.
- G4. Run a **legal clock** per claim, with reminders, compensation maths and escalation letters.
- G5. Answer "where/how" questions with a **web-grounded assistant** that shows its sources.
- G6. Work well on a phone, in **English and Hindi**, and be convertible into an Android app.

**Non-goals (for now)**
- Legal advice, or deciding who the legal heirs are. The family declares that. Disputes mean court, and the app says so.
- Logging into banks or government portals, scraping, or solving captchas.
- Submitting on the family's behalf. The family signs and submits.
- Property mutation, vehicle transfer and court petitions (roadmap).

## 4. Product principles

1. **The model never decides.** Routes, deadlines and money are computed by plain code from rules stored as data. AI only explains, suggests and searches.
2. **Every rule shows its source.** Each output cites a paragraph, and source documents are stored with SHA-256 hashes.
3. **Family in control.** Nothing is filed without the family; every lead needs a human to confirm it.
4. **Privacy by default.** Aadhaar is masked, only the last 4 digits of IDs are stored, helpers never download originals, and personal data never goes into web search.
5. **Calm UX.** This is grief. There is one next action per screen, plain words, and no gamification.

## 5. Main user journey

1. Riya signs up and creates a case (name of the deceased, date of death, relationship).
2. She invites her mother and brother as heirs, and Mr. Rao as a helper.
3. **Find:** she uploads 12 months of her father's bank statement. The app finds leads: ITC and Infosys dividends (shares), an HDFC MF SIP (mutual fund), an LIC premium (insurance), a home-loan EMI (a liability; check the bundled insurance), and FD interest from a co-op bank.
4. **Search kit:** the app prepares searches on the unified portal, UDGAM, MITRA and IEPF with the right name spellings, PAN, date of birth and a bank shortlist. Riya runs them, finds old unclaimed ITC dividends in IEPF, and records the result.
5. **Assets and routes:** confirmed leads become assets. The co-op FD of ₹3.2 lakh with no nominee → **simplified route** (below ₹5 lakh, para 7(h) and 10(a)) → documents: Annex I-B, I-C, I-D (brother), I-E, death certificate, IDs.
6. **Pack:** one tap produces a PDF: cover checklist, filled forms, masked ID copies, signature boxes. She prints, the family signs, and she submits at any branch (para 29).
7. **Clock:** she uploads the dated acknowledgement confirming documents are complete, and a 15-day clock starts. Reminders go out on day 10 and day 14.
8. **Late?** On day 16 the app calculates the interest owed (Bank Rate + 4%, with the rate taken as on the documents-complete date, para 33) and drafts a letter. If there's no reply in 30 days, it drafts an RBI Ombudsman complaint for the CMS portal.
9. **Dashboard:** every asset's status and the money received against what's expected, visible to the whole family.

## 6. Functional requirements

Priority: **P0** = must work in the hackathon demo · **P1** = if time allows · **P2** = roadmap.

### M1. Account and case
- P0: Sign up and sign in with email + password (email verification code).
- P0: Create a case: deceased name, date of birth (optional), date of death, PAN (optional, stored masked except for use in the search kit), relationship.
- P0: Case list; case dashboard.

### M2. Family and roles
- P0: Roles: `lead`, `heir`, `helper`. The lead can invite by email; invitees see the case after signing up with that email.
- P0: Authorization with Cedar policies (Amazon Verified Permissions):
  - heirs can read and act on the whole case
  - helpers see only assigned tasks
  - helpers can **never** download original documents (a forbid rule)
  - only the lead manages members
- P0: **People** (claimants and heirs used in forms) are separate from app users, because not every heir uses the app.

### M3. Discovery
- P0: Upload a **bank statement** (digital PDF or CSV) → parse transactions → detect leads (shares/dividends, mutual funds/SIP, insurance premiums, loans/EMIs, other deposits/interest, government schemes like PPF/NPS, salary → PF/employer insurance, broker/demat).
- P0: A **leads board** where each lead shows its type, institution, evidence line, confidence and next step. Confirm → becomes an asset. Dismiss.
- P0: **Search kit** for the unified portal, UDGAM, MITRA, IEPF and insurers' unclaimed searches, with prefilled name variants, identifiers, a bank shortlist, links and copy buttons. The family runs each search and records findings.
- P1: CAS statement parsing (NSDL/CDSL/CAMS/KFintech), AIS/26AS parsing, scanned images via Textract.
- P2: DigiLocker data-access-nominee guidance, email scanning.

### M4. Assets and routes (rules engine)
- P0: Asset types `bank_deposit`, `term_deposit`, `locker`, `epf`, `life_insurance`, `mutual_fund`, `shares`, `other`.
- P0: Route engine (deterministic):
  - bank deposit with nominee or survivor clause → `NOMINEE` (para 8–9)
  - no nominee, amount below the threshold (₹15 lakh commercial / ₹5 lakh co-op, para 7(h)), no will, no dispute → `SIMPLIFIED` (para 10(a))
  - above the threshold → `ABOVE_THRESHOLD` (para 10(b))
  - will or dispute → `LEGAL_REPRESENTATION` (para 11)
  - lockers → para 16–26
  - EPF → composite death claim (Forms 20, 10D, 5IF)
  - life insurance → insurer claim
  - mutual funds and shares → transmission (checklist)
- P0: Each route returns its document checklist, the forms to generate, the rule quote and paragraph, and warnings. For example: "Nominee receives payment as a trustee of the legal heirs (para 8(iii))". "Term deposits can be closed early without a penalty (para 13)".

### M5. Documents vault
- P0: Upload by kind: death certificate, ID proof, statement, acknowledgement, other. Uploads go straight to S3 with short-lived links.
- P0: **Aadhaar masking** on ID images: first 8 digits blacked out, found with Textract word boxes plus a checksum check, and Comprehend's `IN_AADHAAR` detection as a second signal.
- P1: Watermarked previews for helpers.

### M6. Forms and packs
- P0: One family profile feeds every form: deceased details, claimants, relationships, and the name as recorded at each institution.
- P0: Generate a **claim pack PDF** per asset: cover sheet (checklist, where to submit, originals to carry, the para 29 acknowledgement request), the RBI Annex forms for the route (I-A / I-B / I-C / I-D / I-E) pre-filled, masked attachments with "self-attest here" boxes, signature boxes, and page numbers.
- P1: Locker inventory forms (I-F, I-H), EPF composite form guidance, IEPF indemnity.
- Honesty notes on the cover sheet: stamp paper or notarisation may be needed (Annex I-E affidavit); a branch may insist on its own printed copy of the same standard form.

### M7. Claim clock and escalation
- P0: The family marks "submitted; bank confirmed documents complete on DATE" and uploads the acknowledgement → a Step Functions execution starts.
- P0: Due date = documents-complete date + 15 calendar days (para 31; lockers para 32). Reminders on day 10 and day 14. On the due date the app asks whether the money has arrived.
- P0: If late, compensation = amount × (Bank Rate as on the documents-complete date + 4%) × days late ÷ 365 (para 33). Lockers: ₹5,000 per day (para 34). The app generates a letter to the bank asking for the payment or the reason for the delay (para 33).
- P0: If there's no resolution after 30 more days → a draft RBI Integrated Ombudsman complaint (CMS portal, cms.rbi.org.in; within 1 year of the bank's reply, or 1 year + 30 days if it never replied).
- P0: **Demo mode**: a per-case time scale (for example 1 day = 4 seconds) so the whole clock can be shown in the video.

### M8. Assistant
- P0: A chat box on every case. Two modes:
  - **Explain**: explains a route or step in English or Hindi. Uses Nova 2 Lite in ap-south-1; falls back to a static explanation if the model fails.
  - **Web**: answers "where/how" questions with Nova 2 Lite **Web Grounding** (US regions) and shows citations. Official domains (rbi.org.in, sebi.gov.in, iepf.gov.in, epfindia.gov.in, irdai.gov.in, incometax.gov.in, unclaimedassetsportal.in) are marked "official"; others "unverified".
- P0: **PII firewall**: before any web question leaves the app, names, PAN, Aadhaar, phone numbers, emails and account numbers are removed (regex + Comprehend). The user sees what was removed.
- P1: Strands Agents SDK orchestration with tools (`web_lookup`, `explain_rule`, `case_summary`).

### M9. Notifications
- P0: In-app timeline of events.
- P1: SES email for reminders, to verified addresses while SES is in sandbox.

### M10. Dashboard
- P0: Totals (leads found, assets, claims in progress, money received), next actions, per-asset status chips, timeline.

### M11. Language
- P0: English and Hindi UI (i18n); the assistant answers in the selected language.

### M12. Mobile
- P0: Responsive, works at 360px width, PWA manifest.
- P1: Capacitor Android project, so an APK can be built from the same code (`npx cap add android`).

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| Security | Cognito JWT on every API; Cedar authorization on every case resource; S3 public access blocked; links expire in 5 minutes; least-privilege IAM per function |
| Privacy | Store only the last 4 digits of Aadhaar and PAN in the database; mask images; no PII in logs; delete a case with all its files on request; web questions are PII-free |
| Performance | Statement scan (3 pages) < 5 s; pack generation < 8 s; page loads < 2 s on 4G |
| Cost | < $5 for the whole hackathon at demo scale; serverless only; a budget alarm is set |
| Accessibility | Base font 16–18px, contrast ≥ 4.5:1, touch targets ≥ 44px, all actions reachable by keyboard |
| Reliability | Rule engine and date maths covered by unit tests; workflows can be retried; timeouts fall back to safe defaults |
| Trust | Disclaimer on every pack and route: "Not legal advice. Verify with your bank." Every rule shows its source and paragraph. |

## 8. Success metrics

**Product (post-hackathon):** time from signup to first filled pack (< 30 min); leads per statement; share of claims settled within 15 days; total money released; share of helpers who needed original documents (should be 0).

**Hackathon:** the full flow works live on AWS; the 3-minute video shows the flow plus AWS in the console; the judges can open the URL.

## 9. Hackathon MVP vs roadmap

| In the MVP (P0) | Roadmap |
|---|---|
| Bank statement scanner, leads, search kit | CAS/AIS parsing, DigiLocker, email scanning |
| Bank deposits + lockers routes, EPF/insurance/MF/shares checklists | Bank-specific form layouts, EPF/IEPF automation |
| RBI Annex I-A to I-E packs with masking | Locker inventory forms (I-F, I-H) |
| Step Functions clock, compensation, letters | WhatsApp reminders (AWS End User Messaging), SMS after DLT registration |
| Assistant: explain + web-grounded | Voice (Polly Hindi), Kannada |
| Web + PWA | Android APK via Capacitor, Play Store |

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Wrong legal output | Rules stored as data with para citations and unit tests; disclaimers; the app stops at disputes and wills |
| Bank formats vary | Parser handles common layouts plus CSV; unmatched lines go to "unclear" for the model to suggest a category and a human to confirm |
| Sensitive data | Masking, minimal storage, encryption, short-lived links, Cedar forbid rules |
| Web answers wrong or unsafe | Citations shown, official domains marked, answers never override rules |
| Out of time | Strict P0 list, feature freeze Sunday morning, demo mode |
| Bank Rate changes | Stored with an effective date; the app shows the rate used and its source |

## 11. Open questions
- Final product name (the team is deciding; one-line change).
- Kannada after the hackathon?
- Partner with legal-aid clinics for the steps that need court papers?
