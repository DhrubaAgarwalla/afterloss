# Deployment

AfterLoss deploys as two CloudFormation stacks in **ap-south-1 (Mumbai)**: `afterloss` (API, compute,
data, workflow, authorisation) and `afterloss-web` (CloudFront and S3 for the website).

## Prerequisites

| Requirement | Notes |
|---|---|
| AWS account | An IAM user with `AdministratorAccess` for the deployment; SAM creates IAM roles, Cognito, Step Functions and S3 buckets |
| AWS CLI v2 | `winget install -e --id Amazon.AWSCLI` |
| AWS SAM CLI | `winget install -e --id Amazon.SAM-CLI` |
| Python 3.13 | For the Lambda layer build and the test suite |
| Node.js 20+ | For the web application |
| Bedrock model access | `openai.gpt-oss-120b-1:0` in ap-south-1 and `us.amazon.nova-2-lite-v1:0` in us-east-1 |

Sign in to the CLI (short-lived credentials, no access keys to store):

```powershell
aws configure set region ap-south-1 --profile afterloss
aws login --profile afterloss
aws sts get-caller-identity --profile afterloss
```

## 1. Backend

```powershell
powershell -File scripts/deploy-backend.ps1 -AlertEmail you@example.com
```

The script verifies the session, builds the Lambda layer if it is missing, deploys `backend/template.yaml`
and writes the stack outputs to `backend/stack-outputs.json`. The alert address receives the SES and
budget notifications; confirm the subscription email AWS sends, or the alarms stay silent.

Model choice is a template parameter, so a change to `ModelIdExplain` or `ModelRegionExplain` in
`template.yaml` takes effect on the next deployment.

## 2. Website

Create the hosting stack once (private S3 bucket behind CloudFront with origin access control):

```powershell
aws cloudformation deploy --template-file infra/web.yaml --stack-name afterloss-web `
  --profile afterloss --region ap-south-1
```

Copy `frontend/.env.example` to `frontend/.env.production` and fill in the API URL, Cognito user pool and
client IDs from the backend stack outputs, then build and publish:

```powershell
powershell -File scripts/deploy-web.ps1
```

The script builds the frontend, uploads it to the bucket and invalidates the CloudFront distribution.

## 3. Verify

```powershell
cd backend; $env:PYTHONPATH="src"; python -m pytest tests   # unit tests
python -m afterloss.rules.verify                            # citation check
python scripts/e2e.py                                       # live checks against the deployed stack
```

`e2e.py` uses throwaway `example.com` users created in the deployed Cognito pool and reads its endpoints
from `backend/stack-outputs.json`.

## Optional: Gmail discovery

Email discovery is hidden until a Google OAuth client ID is present in `config/integrations.json`. The
flow runs entirely in the browser with the read-only `gmail.readonly` scope; no token or message ever
reaches the server.

1. In the Google Cloud console, create a project and enable the **Gmail API**.
2. Configure the OAuth consent screen (External) and add the `.../auth/gmail.readonly` scope.
3. While the app is unverified, add each address that will connect as a **test user**.
4. Create an **OAuth client ID** of type *Web application*, with authorised JavaScript origins for the
   CloudFront URL and `http://localhost:5173`. No redirect URI is required.
5. Put the client ID in `config/integrations.json` and redeploy the website. The client ID is public by
   design; there is no client secret in this flow.

Publishing the app to all Google users would require a security assessment of the restricted
`gmail.readonly` scope, so it remains in testing mode with named test users.

## Local development

```bash
npm --prefix frontend install
npm --prefix frontend run dev     # runs against the deployed API
```

## Source documents

Citation verification reads the official documents in `sources/`. RBI's site blocks automated downloads,
so if a source needs to be refreshed, save it from a browser into
`sources/rbi-2025-deceased-claims/` and update its SHA-256 in
`backend/src/afterloss/rules/data/sources.json`.

## Teardown

```powershell
aws cloudformation delete-stack --stack-name afterloss-web --profile afterloss --region ap-south-1
aws cloudformation delete-stack --stack-name afterloss     --profile afterloss --region ap-south-1
```

Empty the S3 buckets first; CloudFormation will not delete a bucket that still has objects.
