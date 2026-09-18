# Progress log

Newest entry first. After every change: **what** was done, **why**, and **what's left**.

## Status board

| Area | Status |
|---|---|
| Research and idea | ✅ Done |
| Docs (hackathon, PRD, architecture, setup) | ✅ Done |
| Repo and GitHub | 🔄 In progress |
| Rules engine (RBI Directions 2025) + tests | ⏳ Next |
| Discovery (statement → leads) + tests | ⏳ |
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
