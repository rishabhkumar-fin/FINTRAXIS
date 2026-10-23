# FINTRAXIS: Corporate Financial Intelligence & Credit Terminal

An institutional corporate financial intelligence, solvency analysis, and deterministic stress testing platform built with Next.js 15, React 19, TypeScript, and SQLite, supporting US-GAAP, Ind-AS, and Japanese FSA accounting disclosures.

Ready for review by Mumbai University external examiners, Mumbai corporate finance desks, Wall Street credit analysts, and IIM Calcutta academic committees.

---

## 1. Quick Start & Setup Instructions (PowerShell)

```powershell
# 1. Clone or navigate to the repository directory
cd "c:\Users\Rishabh Kumar Yadav\Documents\FINTRAXIS"

# 2. Configure environment variables from template
Copy-Item .env.example .env.local

# 3. Install dependencies
npm install

# 4. Run automated test suite (all 35 suites / 124+ tests)
npm test

# 5. Build for production
npm run build

# 6. Start the local production server
npm run start
```

The application will be accessible at: `http://localhost:3000`.

---

## 2. Authentication & Security Policy

- **No Public Credentials:** Default passwords and developer credentials are never printed on login forms.
- **Admin Bootstrap Password:** Administrators authenticate using strong credentials. An initial bootstrap password may be configured via `ADMIN_BOOTSTRAP_PASSWORD` server environment variable.
- **Guest / Read-Only Demo:** Explicitly labeled demo sessions can be launched via **"Continue as Guest"** when `GUEST_ACCESS_ENABLED=true` (or `DEMO_ACCESS_ENABLED=true`). Guests have read-only clearance across all analysis modules and export features; admin routes, user management, and configuration writes return HTTP 403.
- **Password Enforcement:** User registrations enforce minimum 8 characters with a required mix of letters and numbers. Accounts logging in with legacy default credentials receive a prominent `PASSWORD UPDATE DUE` badge.
- **Rate Limiting & Security:** In-memory brute force rate limiting (HTTP 429), timing-safe PBKDF2 hash verification, and httpOnly/SameSite session cookies.

---

## 3. Architecture & Single Source of Truth

- **Unified Financial Engine (`src/lib/finance/`):** A single source of truth (`financeMaster.ts`) computes every financial ratio, leverage multiple, Ind AS 116 lease split, and health score once per company and period. Overview, Financial Statements, Vulnerability Monitor, Scenario Simulator baseline, Copilot, and Exports read from this typed result, guaranteeing zero cross-screen divergence.
- **Market Quote Resolver (`src/lib/finance/quoteResolver.ts`):** Returns `{ price, currency, asOf, source, status }` with status in `live | delayed | end-of-day | reference`. Price, day change, day range, and 52-week corridor are strictly mathematically consistent.
- **Database Engine:** Local SQLite with `better-sqlite3` operating in Write-Ahead Logging (WAL) mode with Drizzle ORM (`data/fintraxis.db`), persisting users, companies, reporting periods, and audit logs across server restarts. On Vercel serverless environments, the database copies to `/tmp/fintraxis.db` automatically at runtime.
- **Data Integrity Pledge:** Zero fabrication. If an accounting item or identifier is not verified in statutory filings, it is explicitly rendered as *"Not available from current source"* or *"Reference data (unverified)"*, never defaulted to zero or fabricated.

---

## 4. Key Platform Modules

| Module Code | Module Name | Primary Analytical Question |
|---|---|---|
| `00_ADMIN` | **Admin Console** | System health, user roles, period coverage matrix, data quality drilldown, and risk hurdles. *(Admin role only)* |
| `overview` | **Executive Overview** | Plain-language executive digest, market quote vs reported accounting, and core health hurdles. |
| `01_HUB` | **Company Directory** | Issuer search, interactive price charts, cross-peer fundamentals, and persistent watchlists. |
| `02_HEALTH` | **3-Statement Ledger** | Audited balance sheet identity checks, cash flow reconciliation, and standardized GAAP/Ind-AS line items. |
| `03_VULNERABILITY` | **Vulnerability Monitor** | Early warning triggers, debt maturity profile, and working capital leak surveillance. |
| `04_DEPENDENCIES` | **Business Dependencies** | Single-source suppliers, critical corporate customers, and public sector backing disclosures. |
| `05_CONCENTRATION` | **Concentration Exposure** | Segment revenue breakdown, 100% reconciliation checks, and Herfindahl-Hirschman Index (HHI) analysis. |
| `06_SIMULATOR` | **Stress Simulator** | Deterministic macroeconomic stress engine: variable-cost operating leverage and floating debt rate shock with exact EBIT waterfall bridge. |
| `07_REPORTS` | **Research Reports** | Investment Committee credit memos, CSV data matrix exports, presentation slides, and SHA-256 tamper-evident hash digests. |

---

## 5. Deployment Guide (Vercel)

To deploy FINTRAXIS to Vercel:

1. Import the repository into your Vercel Dashboard.
2. In **Project Settings → Environment Variables**, configure:
   - `SESSION_SECRET`: A 64-character random cryptographic secret.
   - `ADMIN_BOOTSTRAP_PASSWORD`: Strong password for the initial administrator account.
   - `GUEST_ACCESS_ENABLED`: Set to `true` to allow guest demo evaluation.
   - `GEMINI_API_KEY`: (Optional) Server-only key for enhanced AI Copilot natural language responses.
3. Deploy. The baseline SQLite database (`data/fintraxis.db`) is included in the deployment bundle and initialized in `/tmp` at runtime.

---

## 6. Key Documentation Links

- [Quantitative Methodology & Formulas](docs/methodology.md)
- [Financial Data Sources & Provenance](docs/data-sources.md)
- [Period Filing Import Specification & Templates](docs/period-import.md)
- [Comprehensive Financial Concept Guide](docs/CONCEPT_GUIDE.md)
- [Institutional Fix-and-Finish Changelog](docs/CHANGELOG.md)
