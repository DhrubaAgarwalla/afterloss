# Third-party materials

The MIT license in [LICENSE](LICENSE) covers the software in this repository. The following material is
included under the terms of its own issuer or license.

## Official documents

| Item | Location | Note |
|---|---|---|
| RBI, Settlement of Claims in respect of Deceased Customers of Banks Directions, 2025 (RBI/2025-26/82) | `sources/rbi-2025-deceased-claims/directions_2025.txt` and the saved notification page | Property of the Reserve Bank of India. Stored with its SHA-256 in `backend/src/afterloss/rules/data/sources.json` so every quotation in the application can be verified against it. Included for citation only. |
| Blank copy of RBI's standard Annex I-A to I-H claim forms, as published by State Bank of India | `sources/rbi-2025-deceased-claims/bank-copies/` and `backend/src/afterloss/forms/templates/rbi_annex_forms.pdf` | Used unmodified as the printing template so generated paperwork matches the official format. No bank branding is added or removed. |

Links to every other rule, circular and portal the application cites are listed in the References section
of [README.md](README.md), and machine-readable in `backend/src/afterloss/rules/data/`.

## Software and assets

| Component | License |
|---|---|
| Noto Sans | SIL Open Font License 1.1 |
| Lucide icons | ISC License |
| React, Vite, Tailwind CSS, i18next, AWS Amplify, boto3, ReportLab, pypdf, pypdfium2, rapidfuzz, pdfplumber | MIT, Apache-2.0 or BSD, per each project |

## Sample data

The bank statement, passbook photograph and identity document in `samples/` and
`frontend/public/samples/` are **synthetic**, generated for testing and demonstration. They contain no
real person's data, and no real account, policy or identity number.
