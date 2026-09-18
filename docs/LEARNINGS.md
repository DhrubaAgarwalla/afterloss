# What we learned (for the "Learning" criterion)

Things we didn't know on Thursday, written down as we hit them.

## AWS

1. **Nova Web Grounding runs only in US regions.** Amazon Nova 2 Lite's built-in `nova_grounding` tool (Bedrock Converse `toolConfig.tools=[{systemTool:{name:"nova_grounding"}}]`) is available only through US cross-region inference profiles such as `us.amazon.nova-2-lite-v1:0`. Our data lives in Mumbai, so every web question first goes through a PII firewall (regex + Aadhaar checksum + known family names → roles + Amazon Comprehend). Only then does it leave the region. The response returns `citationsContent`, and AWS requires us to show those citations.
2. **New AWS accounts go through a verification period.** For the first hours, Bedrock calls through the APAC profile in Mumbai returned "Your account is currently being verified". The US profile worked. The model ID and region are template parameters, so switching back is a one-line change.
3. **Presigned S3 PUTs to a brand-new bucket got a 307 redirect.** The global endpoint `bucket.s3.amazonaws.com` redirects until DNS catches up, and browsers won't follow a redirect for a signed PUT. The fix was to sign against the regional endpoint `s3.ap-south-1.amazonaws.com` with SigV4.
4. **Step Functions callback tokens are the right tool for waiting on humans.** A `.waitForTaskToken` task stores its token in DynamoDB. When the family taps "not paid yet", the API calls `SendTaskSuccess`. Wait states with `TimestampPath` let us compress 15 days into 60 seconds for the demo, without changing the production path.
5. **Verified Permissions + Cedar:** `forbid` always beats `permit`. "Helpers never download originals" is a single forbid rule that no later permit can undo. We validate the policies locally with the open-source Cedar engine (`cedarpy`) in CI, and a test checks that the policies in `template.yaml` match the files in `backend/policies/`.
6. **SAM without Docker on Windows.** Installing Linux wheels with `pip install --platform manylinux2014_x86_64 --only-binary=:all:` into a layer folder avoids the "Windows binaries in Lambda" trap. `sam deploy` packages local paths directly.
7. **`aws login` (CLI 2.32+)** gives short-lived console credentials with no access keys. SAM reads them after `aws configure export-credentials --format powershell`.
8. **YAML flow mappings and braces.** `Path: /cases/{caseId}` inside `{...}` breaks YAML parsing. Paths must be quoted.
9. **SMS in India needs TRAI DLT registration** (entity ID + template ID) before AWS can deliver it, which takes days. That's why reminders are in-app plus SES email.
10. **API Gateway HTTP APIs stop at 30 seconds.** Web-grounded answers sometimes took 32 s, so the user saw an error while the Lambda finished fine. Long model calls now run as async jobs (the Lambda re-invokes itself with `InvocationType=Event`) and the app polls.
11. **Textract reads key-value layouts column by column.** On a passbook it returned "Branch", "IFSC", "MICR" and then the values. Rebuilding rows from word bounding boxes (same vertical centre → same row) fixed parsing.
12. **Cost choices:**
    - No OpenSearch Serverless: it has an always-on minimum, and our company dictionary is about 200 rows, so rapidfuzz in Lambda is enough.
    - HTTP API instead of REST API.
    - Throttling on the API stage, and a per-user daily assistant quota.

## Web

1. **New Chrome returns a Promise from `scrollIntoView()`.** `useEffect(() => ref.current?.scrollIntoView())` returned it, React treated it as the cleanup function, and the whole app unmounted ("l is not a function"). Effects need braces; an error boundary now contains any screen crash.
2. **PDF glyph boxes lie.** The official form's font reports glyph boxes about 4pt below where it draws, so text placed from pdfplumber's top/bottom landed on the rules. Reading the baseline from each glyph's text matrix put every value exactly on its line.

## Domain

1. **RBI's 2025 deceased-claims Directions** turned a messy process into rules: standard forms (Annex I-A to I-H), a simplified route up to ₹15 lakh (₹5 lakh for co-op banks), settlement in 15 days (para 31), and interest at Bank Rate + 4% for delays (para 33). The Bank Rate is taken as on the date all documents were received.
2. **UDGAM, MITRA and IEPF only find dormant money** (7–10+ years untouched). A parent who died last month has active accounts, so those have to be found from the family's own statements.
3. **Small yearly debits hide big cover.** A ₹436 PMJJBY debit means ₹2 lakh of life cover; a ₹20 PMSBY debit means ₹2 lakh of accident cover. Families rarely know to claim them.
4. **A nominee is a trustee** (para 8(iii)). Payment to the nominee discharges the bank, but the money belongs to the legal heirs.
5. **Every asset class has its own "no court papers" limit**, from primary sources: demat ₹15 lakh per account and physical shares ₹5 lakh per company (SEBI FAQs, Jan 2026); mutual funds ₹5 lakh, then ₹5–10 lakh with notarised documents, above ₹10 lakh a succession certificate (AMFI circular 110); post office savings ₹5 lakh, only six months after the death (Form-11, rule 15). Insurers must settle in 15 days (45 with investigation), or pay Bank Rate + 2%.
