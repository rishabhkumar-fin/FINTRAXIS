# FINTRAXIS: Corporate Financial Intelligence & Credit Terminal

An auditable corporate financial intelligence and credit risk screening terminal built with Next.js, TypeScript, and SQLite, supporting US-GAAP, Ind-AS, and Japanese FSA accounting disclosures.

---

## 1. Prerequisites & Environment
- **Operating System:** Windows 10/11 or Linux
- **Shell:** PowerShell 5.1+ / PowerShell 7+
- **Node.js:** `v24.x` (or `>= 20.x`)
- **Package Manager:** `npm 11.x`

---

## 2. Setup Instructions (PowerShell)

```powershell
# 1. Clone or navigate to the repository
cd "c:\Users\Rishabh Kumar Yadav\Documents\FINTRAXIS"

# 2. Configure environment variables
Copy-Item .env.example .env.local

# 3. Install dependencies
npm install

# 4. Run automated test suite
npm test

# 5. Build for production
npm run build

# 6. Start the local server
npm run dev
```

The terminal will be accessible at: `http://localhost:3000`.

---

## 3. Architecture & Tech Stack
- **Framework:** Next.js 15 (App Router, Server Components & Route Handlers), React 19, TypeScript 5.
- **Styling & Design System:** Tailwind CSS 4 with custom `FINTRAXIS Sapphire` design tokens (`#080B12`, `#101621`, `#151E2D`, `#253247`, `#3867F5`, `#38BDF8`, `#16A879`, `#F05252`, `#F5B942`).
- **Database & Persistence:** SQLite with `better-sqlite3` and `drizzle-orm` (stored in `./data/fintraxis.db`, with `/tmp` serverless fallback).
- **Security Master:** Seeded with global coverage (`HAL.NS`, `RELIANCE.NS`, `TCS.NS`, `SBIN.NS`, `AAPL`, `MSFT`, `NVDA`, `7203.T`).
- **Data Provider Layer:** Formal `DataProvider` interface with `YahooFinanceAdapter` and `SecEdgarAdapter`. Strict data integrity rule: missing financial items remain `N/D`, never 0 or estimated.
- **Testing:** Node.js native test runner (`node --test`) covering financial consistency, authentication timing-safety, rate limiting, deterministic stress simulation, and idempotent ingestion.

---

## 4. Key Documentation
- [Institutional Methodology & Quantitative Specification](docs/methodology.md)
- [Financial Glossary & Concept Guide](docs/CONCEPT_GUIDE.md)
- [Data Sources & Coverage Evaluation](docs/data-sources.md)
- [Institutional Fix-and-Finish Changelog](docs/CHANGELOG.md)
- [Environment Configuration Template](.env.example)
