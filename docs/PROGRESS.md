# Progress log

Newest entry first. After every change: **what** was done, **why**, and **what's left**.

## Status board

| Area | Status |
|---|---|
| Research and idea | ✅ Done |
| Docs (hackathon, PRD, architecture, setup) | ✅ Done |
| Repo and GitHub | ✅ https://github.com/DhrubaAgarwalla/afterloss |
| Rules engine (RBI Directions 2025) + tests | ✅ 36 tests pass; 27 citations verified against the hashed RBI text |
| Discovery (statement → leads) + tests | ✅ 16/16 planted leads found, 0 false positives |
| Privacy (Aadhaar masking, PII firewall) | ✅ |
| Forms and packs (RBI Annex I-A to I-E) + tests | ✅ printed on the **official RBI form pages** (overlay), letters, Ombudsman draft; pre-filled claim letters for every other asset |
| Guided flow v2 (`docs/FLOW.md`) | ✅ 7-step setup, claim plan per asset, guides for missing documents |
| Infrastructure (SAM template) | ✅ stack `afterloss` live in ap-south-1 |
| Lambda handlers | ✅ 24/24 live end-to-end checks · 132 unit tests |
| Frontend (React, EN/HI) | ✅ 8 screens, Hindi + English, PWA-ready, Capacitor config |
| Deploy to AWS | ✅ Backend + website: https://d30k8rjq3ol5ah.cloudfront.net |
| Assistant | ✅ Explain on **gpt-oss-120b in Mumbai** (live 19 Sep), web search on Nova 2 Lite + Web Grounding; async jobs, no 30 s timeout |
| Demo data, README, video script | ✅ sample statement, README, `docs/DEMO_SCRIPT.md` · ⏳ video |

## Needs from you

- [x] AWS account, admin user, CLI, `aws login` (done)
- [x] Signed in on the live app in Claude's browser pane (done 18 Sep)
- [x] Alert email set (dhrubagarwala67@gmail.com): **confirm the SNS subscription email** AWS sent, or the budget / error alarms stay silent
- [x] Official form formats: used SBI's published blank copy of RBI's standard Annex I-A to I-H (no bank branding)
- [x] `aws login` renewed (19 Sep)
- [x] Google Client ID set (`config/integrations.json`); Google accepts it for the live site origin
- [ ] **Try "Connect Gmail"** with a Gmail address you added as a test user (step 5 of a case)
- [ ] Decide the final product name whenever you're ready (one-line change in `config/brand.json`)
- [ ] Record the video (script in `docs/DEMO_SCRIPT.md`) and submit before Sunday's deadline

---

## Log

### 2026-09-19 18:45 IST: Correctness and email-evidence updates reviewed, fixed and deployed
**What**
- Reviewed the new updates (slices 1–3 and 6 of `docs/PRODUCT_REVIEW_AND_EMAIL_AI_PLAN.md`) and deployed them:
  - **People per claim:** each claim chooses its own claimants or nominee, the heirs who sign Annex I-D and the I-E declarant, and its pack uses only them. Older claims fall back to the family roles.
  - **Honest statuses:** changing anything a pack depends on (the claim's people, amount, family, the deceased's details, a newly masked ID) marks the old pack **outdated**. It can't be downloaded any more (409) and the claim asks for a fresh one. The checklist counts a form as ready only when the current pack contains it.
  - **Complaint follow-up:** the 30-day reply period starts from the date the family confirms the letter was **sent** (a new Step Functions step; a drafted letter starts nothing). "Paid" records the date the money actually arrived. The last stage reads "Ombudsman draft ready", not "Escalated".
  - **Privacy:** helpers no longer receive addresses, ID digits, phone numbers or payee accounts. Gmail connections belong to the current case and user and are revoked when you leave the screen.
  - **Every page:** multi-page PDF IDs and death certificates are masked and attached page by page (up to 25), and anything left out is listed.
  - **Gmail evidence:**
    - Each finding keeps its message IDs and a sample subject.
    - Marketing mail is marked "needs review".
    - HDFC Bank, HDFC Life and HDFC Securities stay separate.
    - A failed search is reported without losing the rest.
  - **Flow:**
    - "Open a case" asks what to do first: find assets, prepare a known claim, or follow up.
    - Demo speed is off by default, under "Advanced testing settings".
    - The mobile bar shows Today, Find, Claims and Docs, plus a More menu with sign-out.
- Fixed during the review:
  - Reconnecting the same Gmail account no longer revokes the live connection (Google's revoke removes the whole grant).
  - Short names (SBI, LIC, PNB) now match and merge across inboxes.
  - The "other heirs signing I-D" choice no longer disappears once cleared (before, there was no way back).
  - The date money arrived is validated on the server; a bad or future date would have failed the claim clock's execution.
  - `deploy-backend.ps1` now passes the model settings explicitly. SAM keeps a stack's previous parameter values, so the first deploy still ran Explain on Nova; it now runs on **gpt-oss-120b in ap-south-1**.
- Checks:
  - Locally: 132 backend tests, the Gmail classifier, the typecheck and the build all pass.
  - Live end-to-end: **24/24**. New checks cover helper redaction, the outdated-pack 409, the complaint-sent step and "Ombudsman draft ready".
  - Live Explain on gpt-oss: **5/5 trap questions right** (stamp paper, who may sign I-E, "not given here" for Karnataka stamp duty, Hindi terms), about 2 s each.

**Why**
- You asked to check the new updates and deploy them.

**Left**
- The signed-in screens (new home, mobile More menu, "People on this claim") are verified by the build and the live API only, because the browser pane is signed out. Worth a quick look on a phone.
- Slices 4–5 of the plan (reading email bodies with a model, with consent) are deliberately not started.
- Video and submission.

### 2026-09-19 08:30 IST: Explanations move to gpt-oss-120b in Mumbai; AI prompt fixes
**What**
- Compared models on our real prompts with AWS's own prices (Price List API). Web search stays on **Nova 2 Lite + Web Grounding** (the only Bedrock option with built-in web search; it answered the EPF question correctly with sources). **Explain** moves to **OpenAI gpt-oss-120b in ap-south-1**: accurate on our rule text, about 1-2 s, cheapest (~$0.18 / $0.71 per 1M tokens), and explanation requests stay in India.
- Fixed two issues the test exposed (they affect every model): the explain context now carries the official form facts (which annexes need stamp paper, who may sign Annex I-E, the threshold) and the prompt forbids unsupported claims; Hindi answers get a glossary (a model wrote RBI as "रबी").
- 110 tests pass.

**Why**
- You asked how good our AI is and for better options with pricing, and chose gpt-oss-120b in Mumbai.

**Left**
- Needs a fresh `aws login` to deploy and to run the live re-check.

### 2026-09-19 06:30 IST: Connect Gmail, with more than one account
**What**
- Step 5 ("Investments & policies") can connect **any number of Gmail accounts** (the deceased's, or a family member's who got their mail). For each account the browser runs ~27 read-only searches (CAMS/KFintech/MF Central, NSDL/CDSL and brokers, LIC and private insurers, EPFO, NPS, India Post, dividends, FDs, cards, loans), reads only From / Subject / Date, and merges the results across accounts ("LIC · about 12 emails · latest … · a@gmail.com, b@gmail.com") with an **Add** button.
- Privacy: Google Identity Services token flow in the browser only; tokens in memory, about 1 hour, revoked on Disconnect; emails never reach our servers; only tapped items are saved (institution, type, count, date).
- Rate-limit safe: limited concurrency and backoff on Gmail 429s. Classifier covered by `frontend/tests/gmailScan.test.ts`.
- Hidden until a Google OAuth client ID is set in `config/integrations.json`; setup steps in `docs/SETUP.md` 8b.
- Deploy scripts now stop with "run aws login" when the AWS session has expired, instead of failing halfway.

**Why**
- You asked for email connect with more than one Gmail account.

**Left**
- Your Google Client ID and a fresh `aws login`, then I publish the website and test connect with two accounts.

### 2026-09-19 04:00 IST: Flow v2: guided setup, claim plans, official-format forms, AI fixed
**What**
- **AI fixed.** Two bugs: (1) the Ask screen crashed the whole app on new Chrome (an effect returned `scrollIntoView()`'s Promise, which React called as a cleanup); (2) web-grounded answers sometimes took over 30 s, API Gateway's hard limit. The assistant now runs as an **async job** (POST starts it, the Lambda re-invokes itself, the app polls `GET /assistant/{jobId}`), with fallbacks: web search fails → plain Nova answer marked "no live sources" → rule text. An error boundary now contains any screen crash.
- **Guided setup** (`/setup/:step`), 7 steps in the order the forms need facts: about them (place of death, certificate, address split as on the form, religion → law of succession, will) → family (relation list, DOB → age, "same address", guardian for minors, who claims / who signs the no-objection, independent declarant) → **who gets paid** (each claimant's own account, IFSC lookup, re-enter check) → their **bank accounts** (type it, **passbook photo read by Textract**, or statement) → **investments** (MF, demat, insurance, PF, NPS, PPF, post office, cards, loans; each asks only its own number) with **one-tap Gmail searches** → find unknown assets (statements + official searches) → **choose what to claim**.
- **Format checks while typing**: PAN (4th letter P, 5th = surname initial), IFSC, mobile, PIN, demat BO ID, UAN, PRAN, date order.
- **Claim plan per asset**, numbered: what applies → documents (tick what you have; "how to get it" for the rest) → forms filled for you → sign, stamp and submit (who signs, which annexes need stamp paper, ask the stamp value for your state) → track (RBI clock for banks; submitted / received for others).
- **Rules as data for every asset type** (`rules/data/other_assets.json`): variants by nominee and amount, from primary sources: SEBI FAQs Jan 2026 (demat ₹15 lakh / physical ₹5 lakh per company), AMFI BPG circular 110 (MF ₹5 lakh / ₹10 lakh slabs, Form T3), Government Savings Promotion General Rules 2018 rule 15 (Form-11, ₹5 lakh after 6 months), IRDAI 2024 (15 / 45 days, Bank Rate + 2%), EPF Scheme para 72(7) (30 days), Gratuity Act s.7(3).
- **Guides** (`rules/data/guides.json`, public `GET /guides`): death certificate (incl. late registration, RBD Act s.13), legal heir certificate, succession certificate, probate, stamp paper / e-stamp, notary, indemnity, affidavit, no-objection, KYC, bank proof, UAN/PRAN, CML, policy, medical records, FIR.
- **Official form pages**: the RBI annexes are now printed on the official blank forms themselves (`forms/official.py` + `templates/rbi_annex_forms.pdf`, SHA-256 checked), using positions measured once by `scripts/build_form_layout.py`: values in blue ink on the lines, tick boxes ticked, non-applicable options struck through, amount in words (lakh/crore), dates DD-MM-YYYY.
- **Claim letter pack** for non-bank assets: plan sheet + pre-filled death intimation and claim letter with every identifier; liabilities get a statement-and-insurance request instead.
- Other fixes from testing: clearer lead evidence text, Indian number format in compensation, dates in Indian format and no longer wrapping, day count matches the server when it asks, asset delete, per-claimant bank details in the forms, 144 new Hindi strings.

**Why**
- Your feedback: the flow was hard to follow, forms should look exactly like the official ones, every asset type needs a full step-by-step with missing-document help, and the AI didn't work.

**Left**
- Test the new flow end to end on the live site (phone size), then commit, and record the video.

### 2026-09-18 20:15 IST: Frontend built and live on CloudFront
**What**
- React 19 + Vite 8 + TypeScript 7 + Tailwind 4, with Amplify Auth (Cognito) and i18next (**English + Hindi**, 190+ strings translated).
- Screens:
  - **Sign in / create account**
  - **Cases**
  - **Case home**: stats, next actions, timeline
  - **Find**: statement upload or the sample; leads board with evidence lines and confidence; add-as-claim questions; **official search kit** with name variants, copy buttons, portal links and "record what you found"
  - **Claims**: list, and detail with route plus citation, questions, documents, pack, submit, and a **live clock** (day bar, the "has money arrived?" question, compensation card, letters)
  - **Family**: people with roles, payment account, members and invites
  - **Documents**: masked copies; helpers get Cedar's denial message
  - **Ask**: explain or web mode, PII-removed chips, sources marked official
- Mobile-first layout: bottom navigation on phones, sidebar on desktop. Noto Sans / Noto Sans Devanagari are bundled, so fonts work offline for the future APK.
- PWA manifest and icons; `capacitor.config.ts` is ready for `npx cap add android`.
- Website stack `afterloss-web` (`infra/web.yaml`): private S3 behind **CloudFront with Origin Access Control**, HTTPS only, SPA fallback, security headers (HSTS, frame-deny, nosniff). Published with `scripts/deploy-web.ps1` (hashed assets are cached for a year; `index.html` is no-cache).
- Checked on the live URL: the page renders, the Hindi toggle works, no console errors.

**Why**
- Ship It needs a URL the judges can open. Best UI rewards a calm, bilingual, phone-first design.

**Left**
- Test the signed-in flow in the browser (needs you to sign in once; I don't type passwords), README and demo script, then the video.

### 2026-09-18 20:00 IST: Backend live on AWS, full flow passes end to end
**What**
- **Deployed** stack `afterloss` (ap-south-1) with SAM (`scripts/deploy-backend.ps1`):
  - Cognito and HTTP API (JWT authorizer, throttled)
  - 5 Lambdas: api, scan, pack, assistant, clock
  - DynamoDB (single table + GSI1, point-in-time recovery), S3 (private, TLS-only)
  - Step Functions claim clock
  - Verified Permissions policy store with 7 Cedar policies (STRICT schema)
  - IAM with only the permissions each function needs
- **Service layer** (`afterloss/app/service.py`) and **handlers** (`src/handlers/*`) for cases, family and people, statement scan → leads, lead → asset → route, uploads through presigned URLs, masked previews, packs, clock start/answer, search kit and findings.
- **Claim clock state machine** (`statemachines/claim_clock.asl.json`): schedule → day 10/14 reminders → day 15 callback question → settled, or late (compensation + bank letter PDF) → 30-day wait → resolved, or Ombudsman draft PDF. Demo speed compresses days into seconds.
- **Assistant:** Nova 2 Lite for explanations; Nova Web Grounding for web answers with citations; PII firewall (regex + checksum + known names + Comprehend); daily quota.
- **Cedar:** policies in `backend/policies/` validated with `cedarpy`; a 28-case matrix matches the app's local authorization; a test keeps `template.yaml` in sync.
- **Tests:** 86 unit tests plus **18/18 live end-to-end checks** (`scripts/e2e.py`): 16 leads in 4.1 s; SIMPLIFIED route; Aadhaar masked through Textract; helper denied originals (403); 7-page pack in 3.5 s; clock → late letter (₹166.58 at 9.5%) → Ombudsman draft; grounded answer with citations and the PAN and name removed.
- `docs/LEARNINGS.md` started.

**Why**
- Ship It is judged on a live, working architecture, so the whole backend flow had to run on AWS, not just in tests.

**Left**
- Frontend screens (claims, family, documents, ask), Hindi strings, website hosting (S3 + CloudFront), README, demo script, video.
- From you: notification email (turns on the budget alert, error alarm and SES reminders).

### 2026-09-18 18:23 IST: Discovery engine (statement → leads)
**What**
- `discovery/statement.py`: parsers for **CSV**, **digital PDF** (pdfplumber; maps amounts to the Withdrawal/Deposit/Balance columns by x-position; ignores watermarks; reads bank, holder and last 4 digits from the header only) and **OCR text lines** (fallback for scans, fixes direction from the running balance).
- `discovery/detectors.py`: ordered, explainable rules → **leads**, each with evidence lines, count, total, confidence, next steps and which official portals to try. Types: shares (dividends), mutual funds (SIP/AMC/CAMS/KFintech/BSE StAR), life and health insurance, **PMJJBY/PMSBY**, NPS/PPF/APY/post office, FD/RD (including other banks such as co-ops), employer (PF, gratuity, group insurance), broker/demat, loans and credit cards.
- `discovery/data/dictionary.json`: 75 listed companies (with RTA), 26 AMCs, 22 insurers, 16 lenders, 16 brokers, 28 banks, co-op markers. Fuzzy matching with `rapidfuzz`.
- `discovery/names.py`: name variants for official searches (R K SHARMA, SHARMA RAMESH KUMAR, K RAMESH ↔ RAMESH K).
- `discovery/searchkit.py`: prefilled kits for the unified portal, UDGAM, MITRA, IEPF, insurers, EPFO, DigiLocker and income tax (AIS). Each is marked if it only shows dormant money.
- `samples/make_statement.py` → `samples/data/sample_statement.{pdf,csv}`: a **synthetic** 12-month statement (watermarked SAMPLE) with 16 planted assets and a lot of noise.
- Tests (8 new): both formats find all 16 planted leads with **zero false positives**; LIC Housing loan ≠ LIC insurance; dates and amounts; OCR fallback; name variants; search kit. **44/44 pass.**

**Why**
- UDGAM, MITRA and IEPF only show money dormant for 7–10+ years, so a recent death's assets must be found from the family's own documents.
- The PMJJBY ₹436 debit is a good demo moment: ₹2 lakh of life cover families usually never hear about.

**Left**
- Privacy (Aadhaar masking, PII firewall), forms and packs, infrastructure, handlers, frontend, deploy.

### 2026-09-18 18:15 IST: Rules engine, with every citation proven
**What**
- Saved RBI's official notification (RBI/2025-26/82) in `sources/rbi-2025-deceased-claims/` as HTML plus a clean text copy, and recorded its SHA-256 in `backend/src/afterloss/rules/data/sources.json`.
- Encoded the rules as data (`rules/data/rbi_deceased_2025.json`):
  - routes: nominee (paras 8–9), simplified (10(a)), above threshold (10(b)), will (11(a)), dispute (11(b)), court order, lockers and safe custody (16–26)
  - thresholds (7(h)) and document lists that map to the Annex I-A to I-H forms
  - notes: trustee (8(iii)), joint accounts, fixed deposits can close early without penalty (13), submit at any branch (29)
- Clocks and compensation (`clocks.json`, `compensation.py`): 15 days (paras 31/32), Bank Rate + 4% using the rate on the documents-complete date (para 33), ₹5,000/day for lockers (para 34), RBI Ombudsman escalation. Bank Rate history is in `bank_rate.json`.
- Non-bank assets as checklists (`other_assets.json`): EPF (Forms 20/10D/5IF), life insurance, **PMJJBY/PMSBY** (a ₹436 or ₹20 yearly debit reveals ₹2 lakh of cover), mutual funds, shares/IEPF, PPF/NPS/APY, loans.
- `engine.py` evaluates rules in order with three values (true / false / unknown). When a fact is unknown it **asks a question instead of guessing**.
- `verify.py` (`python -m afterloss.rules.verify`) re-hashes the source and checks that every quote appears word for word: 27/27 pass.
- Tests (36): every route, both threshold boundaries (₹5 lakh inclusive / ₹5,00,001), all combinations of facts, and the compensation maths (₹3.2 lakh, 10 days late → ₹832.88 at 9.5%).

**Why**
- Judges and families both need to trust the output. Rules as data plus exact quotes plus a hash is the pattern the organisers recommend. The model never decides.

**Left**
- Discovery engine, forms and packs, infrastructure, handlers, frontend, deploy.

### 2026-09-18 18:05 IST: Project docs and plan
**What**
- `docs/HACKATHON.md`: every rule, prize, criterion, judge and deadline, plus a submission checklist and our strategy.
- `docs/PRD.md`: problem, personas, principles, the main journey, functional requirements (P0/P1/P2), non-functional requirements, MVP vs roadmap, risks.
- `docs/ARCHITECTURE.md`: system diagram, AWS services with reasons (including what we skipped for cost), flows, DynamoDB model, API, Step Functions clock, security, cost, Build It mapping.
- `docs/SETUP.md`: exactly what you set up (AWS `aws login`, CLI install, RBI PDF download).

**Why**
- The rules require a public repo whose history matches the event dates, so docs and code go in from the start.
- The judges (AWS architects) score architecture and cost in Ship It; writing the design down first keeps the build consistent.

**Decisions made**
- The AI model is **Amazon Nova 2 Lite**, AWS's own small model. Its built-in **Web Grounding** gives web search with citations but runs only in US regions, so web questions are stripped of personal data first.
- Everything else lives in **ap-south-1 (Mumbai)**.
- **No OpenSearch Serverless** (always-on minimum cost); we use `rapidfuzz` in Lambda for name matching.
- **Email/in-app reminders instead of SMS**, because Indian SMS needs TRAI DLT registration.
- Web first, with Android later through **Capacitor** from the same build.
- Languages: **English and Hindi**. The product name stays configurable in one place.

**Left**
- Everything in the status board marked ⏳.
