# First Commit hackathon: everything we must follow

Source pages (checked 18 Sep 2026): [event page](https://www.wemakedevs.org/aws/first-commit) · [rules](https://www.wemakedevs.org/aws/rules) · [schedule](https://www.wemakedevs.org/aws/first-commit/schedule) · [judges](https://www.wemakedevs.org/aws/first-commit/judges)

## 1. The event

| Item | Detail |
|---|---|
| Name | **First Commit**, event 01 of the **Bharat Builds Tour** (WeMakeDevs × AWS Builder Center) |
| Online | Thu 17 Sep → Sun 20 Sep 2026, anywhere in India |
| In person (optional) | Sat 19 Sep, 8 AM–8 PM, Polaris School of Technology, Bengaluru. Attending adds nothing to the score. |
| **Deadline** | **Sunday 20 Sep 2026.** The exact hour is posted on the schedule page. **Check it on Saturday night.** The form closes at the deadline and late entries are impossible. |
| Who can enter | University students in India, 18+. Teams of 1–4; each member registers separately with a WeMakeDevs account plus an AWS Builder Center profile with student status verified (SheerID). |
| Theme | Open: solve a real problem you face, the people around you face, or a clunky process nobody fixed. Any sector. |

## 2. Prizes (one submission competes for all of them)

| Prize | Reward | What decides it |
|---|---|---|
| **Ship It** (first) | ₹2,00,000 + $3,000 AWS credits | Deployed live on AWS with a URL. **Architecture and cost decisions are scored.** |
| **Build It** (second) | ₹1,50,000 + $2,000 AWS credits | Runs locally on the open-source AWS stack (Strands, Cedar, SAM CLI, LocalStack, PartyRock, OpenSearch, Finch, Firecracker, Corretto). |
| **Best UI** (third) | ₹1,00,000 + $1,000 AWS credits | Design and usability, from either track. |
| 4 runners-up | $1,000 AWS credits each | Automatic. |
| Top 5 blogs | Logitech gaming keyboard each | Publish a write-up on AWS Builder Center and link it in the submission. |
| Team credits | $100 AWS credits per team | Team leader fills the organisers' form. |
| Fast-track Amazon interview | 6-month internship or full-time interview | Top students (graduating 2027/2028) from top projects, max 10 per hackathon. **Decided separately from prizes.** Needs a correct registration and a verified Builder Center profile. |

## 3. Judging criteria

1. **Idea and impact.** Does it solve a real problem, and what changes for the people using it? A small problem solved well beats a big one solved vaguely.
2. **Built on AWS.** Using AWS services or AWS open-source projects is mandatory to win anything. Local and deployed projects are judged with the same care.
3. **Learning.** What did you learn in 4 days? Say it explicitly; it counts.
4. **Execution.** Does it work? Working beats polished. One feature that runs beats five that almost do.
5. **Demo video.** 3 minutes, recorded: what it does, who it's for, where AWS fits. There is no live demo; the video is all the judges see.

**Judges** (all AWS): Arkodyuti Saha (Developer Experience Community Manager), Manisha Choudhary (Associate Solutions Architect), Jitesh Udwani (Solutions Architect), Aman Raj (Big Data Consultant), Brijesh Dubey (TAM), Makendran Gunasekaran (TAM India), Jatin Mehrotra (DevOps Consultant and Cloud-Native Architect), Veeramani A (Sr Cloud Database Engineer).
→ Expect close attention to the **data model**, **architecture**, **security** and **cost**.

## 4. Rules we must not break

- [ ] **No pre-event code.** Building started after the clock opened on 17 Sep. Planning and learning before that were allowed.
- [ ] **Repo history must match the event dates.** A mismatch disqualifies the whole team. We commit often.
- [ ] **Open-source libraries and templates are allowed.** Only what we add during the event is judged. Credit anything we didn't write, and it must have a licence that allows use.
- [ ] **AWS must be visible in the demo video.** Naming it only in the writeup doesn't count.
- [ ] **AI coding tools are allowed but must be listed in the writeup.** Ours are listed in section 7.
- [ ] **One submission per team, one team per person.**
- [ ] **Anything shown only in the writeup, and not in the video, doesn't count.**
- [ ] Code of Conduct applies everywhere.

## 5. What we submit

1. **Public GitHub repository.**
2. **Demo video under 3 minutes** on YouTube, public or unlisted. **Open the link in a signed-out browser before submitting.**
3. **Short writeup:** the problem, the build, where AWS fits, what we learned, and the AI tools used.
4. Optional: blog on AWS Builder Center (keyboard prize), linked in the form.

## 6. How our project scores on each criterion

| Criterion | What we show |
|---|---|
| Idea and impact | After a death, families don't know what assets exist, fill the same details into many forms, and wait on banks with no deadline. We find assets from the family's own documents, fill RBI's standard claim forms, and enforce the 15-day settlement rule (RBI Directions 2025, para 31) with compensation (para 33). |
| Built on AWS | Step Functions for weeks-long claim clocks with human pauses, Verified Permissions (Cedar) for family roles, Cognito, API Gateway, Lambda, DynamoDB, S3, Textract, Comprehend (Aadhaar/PAN masking), Bedrock **Amazon Nova 2 Lite with Web Grounding**, CloudFront, SES, CloudWatch, all in one SAM template. |
| Learning | Kept in `docs/LEARNINGS.md` as we go, e.g. India's SMS DLT rules, Nova grounding runs only in US regions, why we skipped OpenSearch Serverless (minimum cost), Step Functions callback tokens. |
| Execution | One flow works end to end: upload statement → leads → confirm → route with citation → filled pack → acknowledgement → clock → compensation letter. |
| Demo video | Script in `docs/DEMO_SCRIPT.md` (written on Saturday). |
| Best UI | Calm, mobile-first design; Hindi + English; big type; one clear next action on every screen. |

## 7. AI tools used (for the writeup)

- **Claude Code** (Anthropic, Claude Opus 5): research, planning, code generation and documentation, with the team reviewing.
- **Amazon Nova 2 Lite on Amazon Bedrock**: inside the product, for explanations, suggesting categories for unclear bank statement lines, and web-grounded answers with citations.

## 8. Submission checklist

- [ ] Final hour of the deadline confirmed on the schedule page
- [ ] Repo public, README complete (problem, architecture diagram, how to run, AWS services, AI tools, licence, credits)
- [ ] Live URL works in a private window
- [ ] Demo video under 3 min, AWS console visible (Step Functions run, DynamoDB items, CloudWatch logs)
- [ ] Video set to unlisted/public, opens signed-out
- [ ] Writeup includes the "What we learned" and "AI tools used" sections
- [ ] Every team member's Builder Center profile is verified
- [ ] Submitted on the official form once, by the team
- [ ] (Optional) Builder Center blog published and linked

## 9. Timeline (IST)

| When | Goal |
|---|---|
| Fri 18 Sep | Docs, repo, core logic with tests (rules, discovery, forms), infrastructure template |
| Sat 19 Sep | Deploy, frontend, end-to-end flow on AWS, assistant, rough video by night |
| Sun 20 Sep, morning | **Feature freeze.** Polish UI, README, writeup, record final video, submit well before the deadline |
