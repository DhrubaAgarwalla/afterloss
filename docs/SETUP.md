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

## 8b. Connect Gmail (optional, about 10 minutes)

Lets the family connect **one or more** Gmail accounts (the deceased's, or a family member's who received their
mail) in step 5, "Investments & policies". The app then searches for CAMS/KFintech statements, demat and broker
mails, insurance premiums, EPFO/NPS mails, dividends, FDs, cards and loans, and lists what it finds with an "Add"
button. Until this is set up, the app shows one-tap Gmail searches instead, which need no setup.

How it stays private: it runs **only in the browser** with Google's read-only permission. Emails never reach our
servers; only the sender, subject and date are read; access lasts about an hour and ends on "Disconnect"; and only
what the family taps "Add" on is saved.

1. Open https://console.cloud.google.com and sign in with your Google account.
2. **Create a project**: project picker (top bar) → **New project** → name `AfterLoss` → Create. Select it.
3. **Turn on the Gmail API**: menu → **APIs & Services → Library** → search "Gmail API" → **Enable**.
4. **Set up the consent screen**: menu → **Google Auth Platform** (older consoles: APIs & Services → OAuth consent
   screen) → **Get started**:
   - App name `AfterLoss`, user support email: yours → Next
   - Audience: **External** → Next
   - Contact email: yours → Next → agree → **Create**
5. **Add the Gmail permission**: Google Auth Platform → **Data access** → **Add or remove scopes** → filter
   `gmail.readonly` → tick `.../auth/gmail.readonly` ("View your email messages and settings") → Update → **Save**.
6. **Add test users**: Google Auth Platform → **Audience** → Test users → **Add users** → enter **every Gmail address
   that will be connected** (yours and the demo accounts; up to 100) → Save. While the app is in "Testing", only these
   addresses can connect.
7. **Create the client**: Google Auth Platform → **Clients** → **Create client**:
   - Application type: **Web application**, name `AfterLoss web`
   - **Authorized JavaScript origins** → Add URI:
     - `https://d30k8rjq3ol5ah.cloudfront.net`
     - `http://localhost:5173`
   - No redirect URIs needed → **Create**
8. Copy the **Client ID** (it ends in `.apps.googleusercontent.com`) and send it to me, or paste it into
   `config/integrations.json` as `"googleClientId"`. It is public by design: it shows in the page source anyway. **Do
   not** send the client secret; this flow doesn't use one.

I then rebuild the website, and "Connect Gmail (read-only)" appears in step 5. Tap it, pick an account, allow
"Read your email"; for another account tap **Add another Gmail account** and pick the next one. Results from all
accounts are merged into one list (for example, "LIC · about 12 emails · latest 3 Jul 2026 · a@gmail.com, b@gmail.com").

What you will see while the app is in Testing:
- Google shows **"Google hasn't verified this app"**. For a test user that's expected: tap **Continue**.
- On the permission screen, keep the **"Read your email"** box ticked.
- Making it public for anyone would need Google's verification of the `gmail.readonly` scope (a security assessment
  that takes weeks), so for the hackathon it stays in Testing with named test users.

## 9. Reply to me with

- `setup done, profile afterloss`
- your GitHub username
- the email for notifications
- a monthly budget alert amount (suggest **$20**). I'll create the alert so you never get a surprise bill.
- (optional) the Google **Client ID** from step 8b, for "Connect Gmail"

---

## What I will do on my own after this

Create all AWS resources with one SAM template, deploy, run tests against the live stack, fix what breaks, push to GitHub, and keep `docs/PROGRESS.md` updated after every change.

## What I will never do

- Type or store your passwords, keys or OTPs.
- Buy anything, submit the hackathon form, or upload the video. Those are yours.
- Search a real person's accounts on a government portal. The demo uses made-up data.

## Note about OneDrive

This project folder is inside OneDrive. OneDrive isn't running right now, but if you turn it on it would upload thousands of dependency files. So I keep heavy folders (Python environment, build output, `node_modules`) in `C:\Users\dhrub\.afterloss\` instead, outside OneDrive.
