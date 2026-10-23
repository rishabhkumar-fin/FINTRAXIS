# FINTRAXIS Master Remediation & Enhancement Changelog

This changelog records the complete systematic remediation, stabilization, and verification pass across FINTRAXIS. The platform is calibrated for review by Mumbai University external examiners, Mumbai corporate finance desks, Wall Street credit analysts, and IIM Calcutta academic committees.

---

## Stage 1: Baseline Verification
- Verified all 44 baseline tests passed across 13 suites.
- Confirmed database schema integrity in `data/fintraxis.db` without resets.
- Created immutable git baseline tag `baseline-v1`.

---

## Stage 2: Single Source of Truth
- Created `src/lib/finance/financeMaster.ts` and `src/lib/finance/types.ts` establishing one canonical server module that computes all ratios, leverage multiples, Ind AS 116 lease breakdowns, and health scores once per company and period.
- Standardized `netDebtDefinition`, `includeLeases`, and `includeLiquidInvestments` across all views.
- Eliminated all `0.0x` / `0.00x` clamping for net-cash surplus entities; verified output displays honest values such as `-0.62x (Net Cash)`.
- Split bank borrowings from Ind AS 116 lease liabilities with explanatory notes when funded debt is zero but finance charges exist.
- Dynamic period labels: replaced hardcoded "FY2024" with data-driven labels ("Audited ledger (N periods available). Latest period in dataset: FYxxxx").
- Market Quote Resolver (`src/lib/finance/quoteResolver.ts`): guarantees price, day change, day range, and 52-week range are mathematically consistent. Resolved the 3,920 vs 2,506.90 divergence between Overview and Directory.
- Created `tests/consistency.test.ts` verifying identical metrics across all workstations.

---

## Stage 3: Login, Registration, Guest & Security
- Completely redesigned entry page (`src/components/AuthGate.tsx`): 2-column calm dark theme, left brand panel with headline *"Understand the numbers behind the risk"*, restrained line chart graphic, and 3 feature lines (Financial health, Risk monitoring, Stress testing).
- Removed printed credentials (`analyst123 / admin123`), 1-click admin bypass buttons, and developer text (`SQLITE WAL MODE`, `PORT 3001 OK`).
- Implemented `ADMIN_BOOTSTRAP_PASSWORD` server environment variable support.
- User registration (`src/app/api/auth/register/route.ts`): enforces minimum 8 characters with letters and numbers, defaults role to `ANALYST`, validates email uniqueness.
- Guest Access (`GUEST_ACCESS_ENABLED` / `DEMO_ACCESS_ENABLED`): creates an explicitly labeled `GUEST / DEMO (READ-ONLY)` session; blocks writes, user management, and admin routes with HTTP 403.
- First-time welcome card (`src/components/FirstTimeWelcomeCard.tsx`): dismissible welcome flow with quick actions (Explore sample company TCS.NS, Search company, Take 1-minute tour).
- Created `tests/authStage3.test.ts` (6 automated test cases).

---

## Stage 4: Admin Panel & Period Import
- Enforced strict admin authorization: guests and analysts are blocked from `/admin` and `/api/admin/*` endpoints (HTTP 403). Hidden from main sidebar navigation (`00_ADMIN`) for non-admins.
- Redesigned `src/components/AdminConsoleView.tsx` with 7 canonical tabs, each with a one-line "What you can do here" banner:
  1. *Overview*: Live DB counts, coverage summary, and quick actions.
  2. *Users & Access*: Role changes, force password reset, prevents removing the last active admin.
  3. *Companies & Data*: Coverage matrix table and period import.
  4. *Data Quality*: Automated checks (balance sheet mismatch, missing units, stale periods) with severity and suggested fixes.
  5. *Risk Settings (Hurdles)*: Configurable reference benchmarks with version history and reset-to-default.
  6. *Activity Log*: Searchable audit trail with CSV export.
  7. *Settings / System*: Diagnostics and demonstration environment notes.
- Period Import: created `src/lib/periodImport.ts` and `src/components/PeriodImportModal.tsx` supporting CSV/JSON upload and manual entry with 0.5% balance sheet identity tolerance enforcement and idempotent upsert. Created `docs/period-import.md` and template files in `/public/templates/`.
- Created `tests/admin.test.ts` (10 automated test cases).

---

## Stage 5: Company Search, Overview, Statements & Regulatory Integrity
- Redesigned `src/components/OverviewWorkstation.tsx`:
  - Executive summary at top in plain language describing company headquarters, sector, revenue, EBITDA, margin, net cash/debt status, and 0-100 screening score.
  - Distinct cards for Market Valuation (quote price, day change, day range, 52-week position) vs Reported Accounting (audited filing numbers from DB).
  - Metric tiles for Net Debt / EBITDA with definition badge, Interest Coverage, Current Ratio, and Health Score.
  - Quick action launchpad: 3-Statement Ledger, Stress Test, Persistent Watchlist, and Reports.
- Fixed price divergence in `src/components/CompanyHub.tsx`: replaced hardcoded quick picks with dynamically resolved cards from `companies` and `resolveMarketQuote`.
- Enhanced `src/components/CommandPalette.tsx` (Ctrl+K): real-time company search by name, ticker, exchange, sector, and ISIN; keyboard navigation; watchlist toggle; empty state.
- Enhanced `src/components/StatementsLedger.tsx`:
  - Dynamic period headers with currency and scale unit on every column header.
  - Balance sheet identity check badge: "Assets = Liabilities + Equity (Balanced ≤ 0.5%)".
  - Cash flow reconciliation: Operating Cash Flow (CFO), Investing Cash Flow (CFI), Financing Cash Flow (CFF), and Net Change in Cash.
- Regulatory Records: Central Index Key (CIK) is displayed only for US SEC registrants; for non-SEC issuers (TCS.NS, RELIANCE.NS, HAL.NS, 7203.T), explicitly displays *"Not applicable, not an SEC registrant"*.

---

## Stage 6: Health, Graded Score, Peer Comparison & Concentration
- Verified 0-100 graded health score weightings (Solvency 35%, Coverage 25%, Liquidity 25%, Cash conversion 15%).
- Peer median benchmark policy in `src/components/HealthRatios.tsx`: if sector peers $n < 3$, explicitly displays *"Insufficient peer data (n < 3 in sector)"* instead of an unrepresentative single-entity benchmark bar. Replaced "Risk Limit" with "Reference Threshold (configurable)".
- Concentration Analysis in `src/components/ConcentrationExposure.tsx`: added 100% segment revenue reconciliation check and detailed explanation of Herfindahl-Hirschman Index (HHI) with benchmark interpretations.

---

## Stage 7: Deterministic Stress Simulator
- Verified operating leverage and variable cost decomposition ($v \in [0, 1]$).
- Reconciled exact 6-step visual EBIT waterfall bridge: Baseline EBIT $\to$ Revenue Shock $\to$ Cost Relief $\to$ Variable Cost Inflation $\to$ Fixed Cost Inflation $\to$ Stressed EBIT ($\pm 0.00$ exact equality).
- Rate shock strictly applied to floating debt tranche ($TotalDebt \times f \times \Delta r$). Zero-borrowing entities confirm zero interest expense increase.
- Enforced honest breach notice: *"Reference threshold breached in this scenario. This is a what-if calculation, not a prediction."*

---

## Stage 8: Reports, Exports, Settings & AI Copilot
- Persistent Watchlist (`src/lib/watchlist.ts`): localStorage persistence with CustomEvent notifications across components.
- Copilot in `src/components/FinancialAiAssistant.tsx`: sanitized markdown parser rendering `### Header`, `**bold**`, `&bull;` bullets, and inline code cleanly.
- Grounded prompt in `/api/ai/chat/route.ts`: anti-fabrication constraints with verified SQLite WAL context.
- Removed fake seals, "CRO sign-off", "Sovereign Clearance", and "Classy Presentation Deck".

---

## Stage 9: Education Layer, Honesty & Responsive Cleanup
- Comprehensive glossary in `src/lib/glossary.ts`: 14+ standardized financial terms with plain English summary, examiner explanation, formula, benchmark, pitfalls, and filing citations.
- Zero banned buzzwords verified: eliminated all occurrences of "FORTRESS", "PRIME SOLVENT", "SOVEREIGN CLEARANCE", "CRO SIGN-OFF", and "COLD HARD CASH".
- Responsive layout verification: zero text truncation on header clock, settings modal tabs, or sidebar at 1280px, 1024px, 768px, and 390px viewports.

---

## Stage 10: Verification & Testing
- Automated test suite passes 100%: **124 tests across 35 test suites** passing with 0 failures, 0 skipped, 0 cancelled.
- Full TypeScript type check and ESLint pass with **0 errors and 0 warnings**.
- Next.js production build (`npm run build`) generates all 25 static and dynamic routes cleanly.
