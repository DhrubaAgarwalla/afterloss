# Builds the frontend and publishes it to the S3 bucket behind CloudFront.
param([string]$Profile = "afterloss", [string]$Region = "ap-south-1", [string]$Stack = "afterloss-web")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$aws = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
$out = & $aws cloudformation describe-stacks --stack-name $Stack --region $Region --profile $Profile --query "Stacks[0].Outputs" --output json | ConvertFrom-Json
$bucket = ($out | Where-Object OutputKey -eq "WebBucketName").OutputValue
$dist = ($out | Where-Object OutputKey -eq "DistributionId").OutputValue
Push-Location "$root\frontend"
try { npm run build; if ($LASTEXITCODE -ne 0) { throw "build failed" } } finally { Pop-Location }
& $aws s3 sync "$root\frontend\dist" "s3://$bucket" --delete --profile $Profile --region $Region --exclude "index.html" --cache-control "public,max-age=31536000,immutable"
& $aws s3 cp "$root\frontend\dist\index.html" "s3://$bucket/index.html" --profile $Profile --region $Region --cache-control "no-cache" --content-type "text/html"
& $aws cloudfront create-invalidation --distribution-id $dist --paths "/index.html" "/manifest.webmanifest" --profile $Profile --query "Invalidation.Id" --output text
Write-Host "Published to $(($out | Where-Object OutputKey -eq 'WebUrl').OutputValue)"
