# Improvement plan

A review of AfterLoss as of September 2026, after the hackathon build. Each item says what the problem is,
where it lives in the code, why it matters to a family using the app, and roughly how much work it is.

Sizes: **S** = an hour or two · **M** = a day · **L** = several days.

Items are ordered by value for effort. The first section is the one to do before anything else, because
the app's whole promise is "every number and rule is verifiable".

---

## 1. Correctness and trust

### 1.1 Verify every Bank Rate the compensation uses — **S**

Delay interest is Bank Rate + 4% (para 33). The rates live in
`backend/src/afterloss/rules/data/bank_rate.json`. Three of the four entries carry `"verified": false`,
and the one verified entry cites a tax website rather than RBI. A family could send a bank a
compensation letter with the wrong interest.

`compensation.py` already returns `bank_rate_verified`, but nothing reads it: the field never reaches the
frontend, and `afterloss.rules.verify` does not check it.

- [ ] Verify each rate against the RBI Monetary Policy press release for that date and record the URL in
      the entry's `source`.
- [ ] Make `python -m afterloss.rules.verify` fail if any entry is unverified or has no `source`.
- [ ] Show a note on the compensation screen and in the letter when `bank_rate_verified` is false
      ("rate not yet confirmed against RBI; check before sending").

### 1.2 Stop the claim clock when its asset is deleted — **S**

`delete_asset` (`backend/src/afterloss/app/service.py`) refuses to delete while the status is
`clock_running` or `late`. In the later stages (`escalated`, `ombudsman_ready`) the Step Functions
execution is still alive, waiting on a callback token, and deleting the asset does not stop it. When the
execution resumes, `handlers/clock.py` loads a case whose asset is gone.

`delete_case` in `handlers/api.py` already does the right thing: it calls `workflow.stop(arn)` for every
asset. Do the same for a single asset, or refuse deletion for every status that has an `executionArn`.

- [ ] Stop the execution in `delete_asset`, or extend the refusal to all running stages.
- [ ] Add a test in `tests/test_service_correctness.py` for deletion in each post-clock status.

### 1.3 Cedar tests must not skip silently — **S**

`tests/test_cedar.py` starts with `pytest.importorskip("cedarpy")`. If `cedarpy` is missing the whole
authorisation matrix is skipped and the run still shows green. The "helpers never download originals"
guarantee is the one the README leads with.

- [ ] Add `cedarpy` to the dev dependencies (see 2.2) and turn the skip into a hard failure in CI.

### 1.4 Test statement parsing against real bank layouts — **M**

`discovery/statement.py` is tested only on the synthetic statement in `samples/`. Real statements from
SBI, HDFC, ICICI, PNB, Canara and Bank of Baroda differ in column order, date format, narration
abbreviations and multi-line rows.

- [ ] Collect anonymised statement fixtures (or build one synthetic file per bank layout).
- [ ] Add a regression test per layout with the expected leads.
- [ ] Record precision and recall in the test output so a change to the dictionary can be judged.

---

## 2. Engineering foundations

### 2.1 Continuous integration — **S**

There is no `.github/workflows/` directory. The 132 unit tests, the 27-citation check and the TypeScript
type check run only when someone remembers. One workflow on every push and pull request:

```yaml
# .github/workflows/ci.yml (outline)
- backend: pip install -r requirements.txt -r requirements-dev.txt
           PYTHONPATH=src python -m pytest tests
           PYTHONPATH=src python -m afterloss.rules.verify
- frontend: npm ci && npm run typecheck && node tests/gmailScan.test.ts
```

### 2.2 Declare the development dependencies — **S**

`backend/requirements.txt` lists only the Lambda layer. `pytest`, `cedarpy` and `moto` (if used) are not
recorded anywhere, so a fresh checkout cannot run the tests. Add `backend/requirements-dev.txt`, or a
`pyproject.toml` with an optional `dev` group, and reference it in the README.

### 2.3 Frontend tests — **M**

The only frontend test is `tests/gmailScan.test.ts`, run directly with `node`. The screens a family uses
most have none.

- [ ] Add Vitest and React Testing Library.
- [ ] Cover `lib/validate.ts` (PAN, IFSC, UAN, PRAN, demat) and `lib/format.ts`.
- [ ] Cover the setup flow: step order, validation blocking "Next", data surviving a reload.
- [ ] Cover `ClaimDetail` state transitions (pack ready → clock running → late → complaint sent).

### 2.4 Split the two largest screens — **M**

`pages/ClaimDetail.tsx` (about 1,000 lines) and `pages/SetupPage.tsx` (about 760 lines) each hold several
independent panels. Splitting them into one component per panel makes the tests in 2.3 possible and makes
changes reviewable.

### 2.5 Deploy from any operating system — **S**

`scripts/deploy-backend.ps1` and `scripts/deploy-web.ps1` are PowerShell only. Either add Bash
equivalents or move deployment into a GitHub Actions workflow with OIDC to AWS, so the scripts become the
single path and contributors on Linux or macOS can deploy.

### 2.6 Lint and format — **S**

Add `ruff` for the backend and `eslint` + `prettier` for the frontend, both wired into 2.1. This costs
little now and prevents drift once more than one person commits.

---

## 3. What families need next

### 3.1 Reminders that arrive — **M**

SES is in sandbox, so the day-10 and day-14 reminders reach only verified addresses. For a real family the
reminders are the point of the clock.

- [ ] Request SES production access for the region.
- [ ] Add a bounce and complaint handler (SNS topic → Lambda) so a bad address is marked in the case.
- [ ] Longer term: WhatsApp through AWS End User Messaging, as the architecture notes already plan.

### 3.2 A guided search of the public portals — **M**

The app links to RBI UDGAM, IEPF, the unclaimed assets portal and CRS. Most families never open them.
Turn the links into a checklist per case: which portal, what to enter (PAN, name, date of birth), a
status per portal (not started / searched / found), and a "found" result recorded as a lead with the
portal as its evidence.

### 3.3 Legal-heir and succession certificate guide — **L**

Claims above ₹15 lakh, or with no nominee and no will, stop here. The process varies by state (tehsildar,
district court, e-district portal), and it is where families lose months. A state-by-state guide in
`rules/data/guides.json`: which office, which documents, fee, typical time, and the portal URL where one
exists. Start with the five most populous states.

### 3.4 Offline and low-bandwidth use — **M**

The app is already a PWA. Cache the case data and guides with a service worker so a family in a small
town can read their claim plan and document list without a connection, and queue an upload until one
returns.

### 3.5 Accessibility — **M**

Older relatives will use this on phones. There are about 40 ARIA attributes across the frontend, and no
automated check. Run axe and Lighthouse, then fix labels on the form fields, focus order in the setup
steps, contrast in the status badges, and the language attribute on mixed EN/HI text.

### 3.6 Track a claim submitted on paper — **S**

Many families hand the pack to the branch in person. The clock needs the acknowledgement date; make
"I submitted at the branch on <date>" a first-class action rather than something inferred from an
upload.

### 3.7 More languages — **M each**

Hindi coverage is complete (the only key the audit flagged is a false positive). The i18next setup makes
another language a single JSON file plus a font. Bengali, Marathi, Tamil and Telugu cover most of the
remaining families; do the claim-plan and document screens first, since those are what gets printed.

---

## 4. Privacy and compliance

### 4.1 DPDP Act, 2023 obligations — **M**

The app holds sensitive data about the deceased and their heirs. Record consent at case creation, offer
a one-click export of everything in a case (JSON plus the documents), and delete closed cases after a set
period. The DynamoDB table already has TTL enabled (`template.yaml`), so expiry is a matter of setting
`ttl` on a case's items when it is marked resolved, plus an S3 lifecycle rule on `cases/<id>/`.

### 4.2 Per-user limits on OCR spend — **S**

Uploads are capped at 15 MB (`service.py`) and masking at 25 pages (`handlers/scan.py`), and the API is
throttled at 25 requests per second, but nothing limits how many statements one account can run through
Textract and Comprehend. Add a per-case and per-day scan count in DynamoDB and refuse above it; the demo
case should have a lower limit than a signed-in family.

### 4.3 Audit trail visible to the family — **S**

Every change to a case is already recorded for the clock. Show a "history" panel on the case: who added
which asset, when the pack was generated, when reminders were sent. It helps a family that is sharing the
case with a helper, and it is what a regulator would ask to see.

---

## 5. Reach

- **Demo video** in the README, walking the sample case from statement to Ombudsman draft. — S
- **Google Play listing** for the Capacitor build, once 3.1 and 3.5 are done. — M
- **Feedback link** on every screen (a form, not email), so problems with a specific bank's forms come
  back with the page they were seen on. — S

---

## Suggested order

| Sprint | Items | Why first |
|---|---|---|
| 1 | 1.1, 1.2, 1.3, 2.1, 2.2 | Correctness of what the app already claims, and a safety net for everything after |
| 2 | 2.6, 2.3, 2.4, 2.5 | Makes the codebase safe for a second contributor |
| 3 | 3.1, 3.6, 4.2 | The follow-up loop works for a real family, without surprise cost |
| 4 | 3.2, 3.5, 4.1, 4.3 | Discovery, accessibility, compliance |
| 5 | 1.4, 3.3, 3.4, 3.7 | Depth: real bank formats, succession guidance, offline, languages |
