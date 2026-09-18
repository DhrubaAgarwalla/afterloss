# Demo video (under 3:00): script and shot list

Rules to remember: the video is **all the judges see**, **AWS must be visible on screen**, keep it **under 3 minutes**, upload to YouTube as **unlisted**, and **open the link in a signed-out browser** before submitting.

Setup before recording:
- Create a new case with **demo speed ON** (1 day = 4 s).
- Add family (Sunita = wife, claimant; Riya = daughter, claimant; Arjun = son, not claiming; K. Venkatesh Rao = declarant).
- Upload a sample ID in Documents (it gets masked).
- Keep two browser tabs ready: the app, and the AWS console (Step Functions, DynamoDB, Verified Permissions, CloudWatch).
- Record at 1080p. Zoom the browser to 110% so text is readable.

| Time | Screen | Say (roughly) |
|---|---|---|
| 0:00–0:15 | App home page | "When a parent dies in India, the family has to find what exists, fill the same details into many forms, and wait on banks. RBI's 2025 rules made this standard: 15 days to settle, interest if the bank is late. Almost nobody knows. This is AfterLoss." |
| 0:15–0:45 | **Find** → Try the sample statement → leads appear | "We read the father's bank statement. Dividends mean ITC and Infosys shares. SIPs mean two mutual funds. And this ₹436 debit is PMJJBY: ₹2 lakh of life cover the family didn't know about. Every lead shows the lines it came from." |
| 0:45–1:10 | Official searches tab | "Government portals only show money untouched for years, so we prepare those searches with every spelling of the name and the right inputs. The family runs them; we never scrape." |
| 1:10–1:40 | Add the co-op FD (no nominee, ₹3,20,000, co-operative) → claim page | "The rules engine, not the AI, picks the route: simplified, because ₹3.2 lakh is under the ₹5 lakh co-op threshold. Here's the exact RBI paragraph, quoted word for word from the hashed official text." → **Generate claim pack** → show 2 pages: pre-filled Annex I-B, and the masked Aadhaar. |
| 1:40–2:10 | Submit (date) → clock runs → "Not yet" → compensation card | "The bank confirms documents are complete, and a Step Functions clock starts. At demo speed a day is 4 seconds. Day 15: not paid. The app works out compensation at Bank Rate plus 4% and drafts the letter to the bank." |
| 2:10–2:30 | AWS console: Step Functions execution graph → Verified Permissions policies → (switch to helper account) denied download | "Under the hood: Step Functions waits on the family with callback tokens. Cedar policies in Verified Permissions mean a helper can see masked copies but never download originals." |
| 2:30–2:50 | **Ask** → Search the web: "How do we claim unpaid ITC dividends from IEPF?" | "Amazon Nova 2 Lite with Web Grounding answers with sources. Before the question leaves India, names, PAN and Aadhaar are removed: see the chips." Toggle **हिंदी** for 2 seconds. |
| 2:50–3:00 | Architecture slide (README diagram) | "Cognito, API Gateway, Lambda, DynamoDB, S3, Step Functions, Verified Permissions, Textract, Comprehend, Bedrock. One SAM template, under $5. We learned a lot this weekend: it's all in LEARNINGS.md." |

Recording tools: Windows **Game Bar** (Win+Alt+R) or **OBS**. Cut with Clipchamp (built into Windows 11).

Writeup checklist (paste into the submission form):
- Problem (3 lines), what it does (5 bullets), where AWS fits (the service list with each one's role).
- **What we learned** (from `docs/LEARNINGS.md`).
- **AI tools used:** Claude Code (Anthropic, Claude Opus 5); Amazon Nova 2 Lite in the product.
- Links: live URL, GitHub repo, YouTube video.
