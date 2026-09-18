# Progress log

Newest entry first. After every change: **what** was done, **why**, and **what's left**.

## Status board

| Area | Status |
|---|---|
| Research and idea | ✅ Done |
| Docs (hackathon, PRD, architecture, setup) | ✅ Done |
| Repo and GitHub | ✅ https://github.com/DhrubaAgarwalla/afterloss |
| Rules engine (RBI Directions 2025) + tests | ✅ 36 tests pass; 27 citations verified against the hashed RBI text |
| Discovery (statement → leads) + tests | 🔄 Next |
| Forms and packs (RBI Annex I-A to I-E) + tests | ⏳ |
| Infrastructure (SAM template) | ⏳ |
| Lambda handlers | ⏳ |
| Frontend (React, EN/HI) | ⏳ |
| Deploy to AWS | ⏳ Waiting for you: `aws login --profile afterloss` (see `docs/SETUP.md`) |
| Assistant (Nova 2 Lite + Web Grounding) | ⏳ |
| Demo data, README, video script | ⏳ |

## Needs from you

- [ ] Finish `docs/SETUP.md` steps 1–4 (AWS account, admin user, CLI install, `aws login`)
- [ ] Download the 9 RBI PDFs (SETUP step 8)
- [ ] Tell me the email for notifications and the budget alert amount
- [ ] Decide the final product name whenever you're ready (one-line change in `config/brand.json`)

---

## Log

### 2026-09-18 18:40 IST: Rules engine, with every citation proven
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
