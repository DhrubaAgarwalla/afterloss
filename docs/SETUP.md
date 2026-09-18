# Setup: what you do once, so I can build and deploy on my own

Time needed: about 20 minutes. Do these in order. **Never paste passwords, secret keys or OTPs into the chat.** Everything below is done in your own browser or terminal, and I only use the logged-in session afterwards.

---

## 1. AWS account (needed for the Ship It track)

- If you don't have one: create it at https://aws.amazon.com (debit/RuPay card works; the verification charge is about ₹2).
- Claim the hackathon's $100 team credits on the organisers' form (team leader only): https://forms.gle/v1fMc8YboFvERz8j6

## 2. Make an admin user (don't use the root login day to day)

1. AWS Console → **IAM** → **Users** → **Create user**.
2. Name: `afterloss-admin`. Tick **Provide user access to the AWS Management Console**, set a password.
3. Permissions: **Attach policies directly** → `AdministratorAccess`.
   - Why admin: the deploy tool (SAM) creates IAM roles, Step Functions, Cognito, S3 buckets and so on. After the hackathon, delete this user.
4. Sign out of root, sign in as `afterloss-admin`, and turn on **MFA** for it (IAM → your user → Security credentials).

## 3. Install the AWS CLI and SAM CLI

Open **PowerShell** and run (approve the Windows prompts):

```powershell
winget install -e --id Amazon.AWSCLI
```

```powershell
winget install -e --id Amazon.SAM-CLI
```

Close that PowerShell window and open a **new** one so the commands are found.

## 4. Log the CLI in (no secret keys needed)

```powershell
aws configure set region ap-south-1 --profile afterloss
```

```powershell
aws login --profile afterloss
```

A browser opens. Sign in as `afterloss-admin`. Then check it worked:

```powershell
aws sts get-caller-identity --profile afterloss
```

You should see your account number and `user/afterloss-admin`.
The login lasts up to 12 hours. If I tell you it expired, just run `aws login --profile afterloss` again.

## 5. Bedrock (the AI model)

Nothing to click. Since Oct 2025, AWS enables Amazon Nova models automatically. We use **Amazon Nova 2 Lite** with its built-in **Web Grounding** tool, which runs in the US regions. I call it from the app with personal data removed from the question.

## 6. GitHub (the rules require a public repo)

```powershell
gh auth login
```

Choose: GitHub.com → HTTPS → Login with a web browser. Then tell me your GitHub username.

## 7. Email for notifications and budget alerts

Tell me which email to use. AWS will send you a verification email from Amazon SES; click the link in it.

## 8. Download RBI's 8 official claim forms (2 minutes)

RBI's website blocks automated downloads, so please save these yourself. Open each link in your normal browser and save it into
`bharat-build\sources\rbi-2025-deceased-claims\` with the name shown:

| Save as | Link |
|---|---|
| `annex_I-A.pdf` | https://rbidocs.rbi.org.in/rdocs/content/pdfs/82NT26092025A_A.pdf |
| `annex_I-B.pdf` | https://rbidocs.rbi.org.in/rdocs/content/pdfs/82NT26092025A_B.pdf |
| `annex_I-C.pdf` | https://rbidocs.rbi.org.in/rdocs/content/pdfs/82NT26092025A_C.pdf |
| `annex_I-D.pdf` | https://rbidocs.rbi.org.in/rdocs/content/pdfs/82NT26092025A_D.pdf |
| `annex_I-E.pdf` | https://rbidocs.rbi.org.in/rdocs/content/pdfs/82NT26092025A_E.pdf |
| `annex_I-F.pdf` | https://rbidocs.rbi.org.in/rdocs/content/pdfs/82NT26092025A_F.pdf |
| `annex_I-G.pdf` | https://rbidocs.rbi.org.in/rdocs/content/pdfs/82NT26092025A_G.pdf |
| `annex_I-H.pdf` | https://rbidocs.rbi.org.in/rdocs/content/pdfs/82NT26092025A_H.pdf |
| `directions_2025.pdf` | https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NT82880281BD5EB444BFAE554F1C816B3376.PDF |

I use them to make our auto-filled forms match the official wording, and I record each file's SHA-256 hash so every citation in the app can be checked.

## 9. Reply to me with

- `setup done, profile afterloss`
- your GitHub username
- the email for notifications
- a monthly budget alert amount (suggest **$20**). I'll create the alert so you never get a surprise bill.

---

## What I will do on my own after this

Create all AWS resources with one SAM template, deploy, run tests against the live stack, fix what breaks, push to GitHub, and keep `docs/PROGRESS.md` updated after every change.

## What I will never do

- Type or store your passwords, keys or OTPs.
- Buy anything, submit the hackathon form, or upload the video. Those are yours.
- Search a real person's accounts on a government portal. The demo uses made-up data.

## Note about OneDrive

This project folder is inside OneDrive. OneDrive isn't running right now, but if you turn it on it would upload thousands of dependency files. So I keep heavy folders (Python environment, build output, `node_modules`) in `C:\Users\dhrub\.afterloss\` instead, outside OneDrive.
