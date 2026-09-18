# AfterLoss

**Find, claim and follow up on what a loved one left behind.** Built during the WeMakeDevs × AWS **First Commit** hackathon (Bharat Builds Tour), 17–20 Sep 2026.

> Work in progress: this repo is being built during the event. See [`docs/PROGRESS.md`](docs/PROGRESS.md) for the live log.

## The problem

When a parent dies in India, the family doesn't know what assets exist, fills the same details into many forms, and waits on banks with no idea of their rights.

Since RBI's **Settlement of Claims in respect of Deceased Customers of Banks Directions, 2025**, the process is standard:
- fixed claim forms (Annex I-A to I-H)
- no court papers needed below ₹15 lakh (₹5 lakh at co-operative banks)
- settlement within **15 days** of complete documents
- interest at **Bank Rate + 4%** if the bank is late

Most families never hear about any of it.

## What it does

1. **Find.** It reads the family's own documents (bank statements first) and finds leads: shares from dividend credits, mutual funds from SIPs, insurance from premiums, loans from EMIs. It also prepares official searches (the "Your Money, Your Right" portal, RBI UDGAM, SEBI MITRA, IEPF) with the right inputs.
2. **Fill.** It picks the right claim route for each asset, citing the RBI paragraph, and produces a print-ready PDF pack: RBI standard forms pre-filled, Aadhaar masked, and signature boxes.
3. **File and follow up.** It starts the 15-day clock when the bank confirms the documents are complete, sends reminders, calculates compensation if the bank is late, and drafts the letter and the RBI Ombudsman complaint.
4. **Ask.** An assistant on Amazon Nova 2 Lite explains every step in English or Hindi, and answers "where/how" questions with web search and citations.

## Built on AWS

Cognito · API Gateway · Lambda · DynamoDB · S3 · CloudFront · Step Functions · Verified Permissions (Cedar) · Textract · Comprehend · Bedrock (Amazon Nova 2 Lite + Web Grounding) · SES · CloudWatch. Everything is defined in one SAM template.

## Docs

- [Product requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Hackathon rules and checklist](docs/HACKATHON.md)
- [Setup](docs/SETUP.md)
- [Progress log](docs/PROGRESS.md)

## AI tools used

Claude Code (Anthropic, Claude Opus 5) for research, planning and code generation, reviewed by the team. Amazon Nova 2 Lite on Amazon Bedrock inside the product.

## Disclaimer

Not legal advice. Rules are cited from official sources. Confirm with the bank or institution before signing.
