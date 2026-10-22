# FINTRAXIS — Technical, Operational & Multi-Audience Audit Report (Phase 0)

**Date of Audit:** October 2026  
**Auditor Role:** Principal Full-Stack Engineer, Institutional Product Designer & Credit Reviewer  
**Evaluation Benchmark:** Mumbai University External Examiners, Mumbai Finance Professionals (Ind-AS/BSE/NSE), Wall Street Analysts (US-GAAP/SEC), IIM Calcutta Faculty, and Introductory Learners.  
**Workspace:** `c:/Users/Rishabh Kumar Yadav/Documents/FINTRAXIS` (Localhost: `http://localhost:3000` & Production: `https://fintraxis.vercel.app`)  
**Repository Branch:** `main`  
**Current Test Baseline:** 48 / 48 Passing Tests (13 Suites) &bull; ESLint: 0 Errors / 0 Warnings &bull; Next.js 15 Build: Clean (24 Routes)  

---

## 1. Concrete Architecture & Stack Confirmation

The stack has been inspected directly from `package.json` and active source files:

| Layer | Concrete Technology | Version | Source File Reference |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `15.5.27` | `package.json#L9`, `src/app/page.tsx` |
| **Frontend Engine** | React (Concurrent) | `19.1.0` | `package.json#L10` |
| **Styling** | Tailwind CSS (Native PostCSS 4) | `4.x` | `package.json#L21`, `src/app/globals.css` |
| **Icons** | Lucide React | `1.56.0` | `package.json#L8` |
| **Database Engine** | better-sqlite3 | `13.0.3` | `package.json#L5`, `src/db/index.ts` |
| **ORM & Schemas** | Drizzle ORM | `0.45.4` | `package.json#L7`, `src/db/schema.ts` |
| **Session Security** | HMAC-SHA256 Signed Tokens | Custom zero-dep | `src/lib/sessionToken.ts` |
| **Testing** | Node.js Native Test Runner | Node `24.x` | `tests/*.test.ts` |

### Architectural Findings

1. **Scrolling Container:**  
   The page does **NOT** scroll on `window`. The root `<div className="min-h-screen ... flex">` and HTML body are set to fixed viewport bounds. The actual scroll container is:  
   `<main ref={mainScrollRef} className="flex-1 p-4 lg:p-6 max-w-[1720px] w-full mx-auto relative pb-20 overflow-y-auto">` (line 482 of `src/app/page.tsx`).  
   *Requirement:* Any scroll-to-top logic must operate directly on `mainScrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })`.

2. **Active Module Tracking:**  
   The active module is synchronized bi-directionally with the browser URL: `?tab=01_HUB` via `window.history.pushState` and `window.addEventListener("popstate", ...)`. When `tab` is omitted in the URL, the terminal defaults based on role: `00_ADMIN` for Super Admins/Admins and `overview` for Credit Analysts.

3. **Session Storage & Verification:**  
   Session state is secured via `httpOnly`, `SameSite=Lax`, `Path=/` cookie `fintraxis_session` containing an HMAC-SHA256 signed stateless payload (`createSignedSessionToken`).  
   On application startup, `GET /api/auth/me` validates the token against the active database to ensure the operator is not deactivated. A branded splash prevents content flashing during verification.

4. **Company Selection & State Propagation:**  
   Selected corporate issuer is tracked via URL search param `&company=AAPL`. State changes invoke `handleSelectCompany(ticker)` which cancels in-flight fetches via `AbortController`, scrolls to top, updates URL history, and broadcasts profile data down to active workstations.

5. **Vercel Ephemeral Storage & Rate Limiting Risks:**  
   - **Database Persistence:** On Vercel serverless, SQLite runs from `/tmp/fintraxis.db`, which is ephemeral across container instances. The Admin Console (`00_ADMIN`) displays a prominent diagnostic banner informing operators and examiners of this serverless storage topology.
   - **Login Rate Limiter:** `src/lib/authRateLimit.ts` stores failed login attempts in an in-memory `Map`. On Vercel, requests may hit different serverless instances. The rate limiter serves as local instance defense, and a transparent notice is disclosed in the Admin Security view.

---

## 2. Comprehensive Control Inventory

Every interactive element in the terminal was tested against the running server on `http://localhost:3000`:

| Workstation / Area | Control Element | Type | Target Action / Pure Function | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Auth Gate** | Login Form Submit | Form | `POST /api/auth/login` (PBKDF2) | **WORKS** | 200 OK & Sets signed cookie |
| **Auth Gate** | Demo Analyst Login | Button | `POST /api/auth/login` (`isDemo: true`) | **WORKS** | Instant clearance without password |
| **Auth Gate** | Demo Admin Login | Button | `POST /api/auth/login` (`admin@fintraxis.local`) | **WORKS** | Instant `SUPER_ADMIN` clearance |
| **Sidebar Navigation** | Desk Selector Tabs | Button/Link | `handleSelectTab(id)` &rarr; URL `?tab=` | **WORKS** | URL updates, scroll resets to top |
| **Sidebar Navigation** | Issuer Quick-Switcher | Dropdown | `handleSelectCompany(id)` &rarr; URL `&company=` | **WORKS** | Cancels in-flight, updates data |
| **Sidebar Navigation** | Lock Terminal (Logout) | Button | `POST /api/auth/logout` | **WORKS** | Drops cookie (`Max-Age=0`), redirects |
| **Sidebar Navigation** | Settings Modal Trigger | Button | Opens `SettingsModal.tsx` | **WORKS** | Allows hurdle personalization |
| **Sidebar Navigation** | AI Copilot Trigger | Button | Opens `AiCopilotDrawer.tsx` | **WORKS** | Ctrl+J hotkey also supported |
| **Macro Ticker Tape** | Command Palette Button | Button | Opens `CommandPalette.tsx` | **WORKS** | Ctrl+K hotkey supported |
| **Command Palette** | Securities & Tab Jump | Input/List | Keyboard navigation (`Enter` to select) | **WORKS** | Instant workstation routing |
| **Overview Desk** | Active Issuer Selector | Dropdown | `onSelectCompany(id)` | **WORKS** | In-context issuer switching |
| **Overview Desk** | Refresh Ledger Data | Button | `loadProfile(id)` | **WORKS** | Re-verifies XBRL filings |
| **Overview Desk** | Workstation Launchpads | 4 Cards | `onNavigateToTab(tab)` | **WORKS** | Deep links to Hub, Health, Sim, Reports |
| **Overview Desk** | Recommended Next Step | Button | Navigates to `01_HUB` | **WORKS** | Smooth forward progression |
| **Desk 01: Hub** | Omnibar Market Search | Input | `GET /api/market/search?q=...` | **WORKS** | Debounced at 280ms |
| **Desk 01: Hub** | Interactive Stock Chart | Canvas/SVG | Timeframe toggle (`1D`, `1M`, `1Y`, `5Y`, `ALL`)| **WORKS** | Mouse/touch scrubbing |
| **Desk 01: Hub** | Power BI Modal Trigger | Button | Opens `CompanyChartModal.tsx` | **WORKS** | Deep visual analytics modal |
| **Desk 01: Hub** | Recommended Next Step | Button | Navigates to `02_HEALTH` | **WORKS** | Carries active company forward |
| **Desk 02: Health** | View Slicer | Tabs | `RATIOS` vs `STATEMENTS` | **WORKS** | Toggles solvency vs XBRL ledger |
| **Desk 02: Health** | Balance Sheet Identity | Badge | `auditBalanceSheetIdentity` | **WORKS** | Shows Assets = Liab + Equity |
| **Desk 02: Health** | XBRL Audit Sidecar Cell | Table Cell | `GET /api/audit` | **WORKS** | Opens audited disclosure drawer |
| **Desk 02: Health** | Recommended Next Step | Button | Navigates to `03_VULNERABILITY` | **WORKS** | Carries active company forward |
| **Desk 03: Vulnerability** | Category Filter | Tabs | `ALL`, `SOLVENCY`, `LIQUIDITY`, `DEPENDENCIES` | **WORKS** | Filters surveillance flags |
| **Desk 03: Vulnerability** | Maturity Wall Schedule | Table | Sourced from statutory 10-K notes | **WORKS** | Displays principal rollover |
| **Desk 03: Vulnerability** | Recommended Next Step | Button | Navigates to `04_DEPENDENCIES` | **WORKS** | Carries active company forward |
| **Desk 04: Dependencies** | Relationship Type Filter | Tabs | `ALL`, `SUPPLIER`, `CUSTOMER`, `CRITICAL` | **WORKS** | Real disclosed counterparties |
| **Desk 04: Dependencies** | Analyst Note Modal | Button | Form submit &rarr; state update | **WORKS** | Appends research observation |
| **Desk 04: Dependencies** | Recommended Next Step | Button | Navigates to `05_CONCENTRATION` | **WORKS** | Carries active company forward |
| **Desk 05: Concentration** | Dimension Slicer | Tabs | `BUSINESS` vs `GEOGRAPHIC` segments | **WORKS** | Calculates HHI dynamically |
| **Desk 05: Concentration** | Recommended Next Step | Button | Navigates to `06_SIMULATOR` | **WORKS** | Carries active company forward |
| **Desk 06: Simulator** | Wall St Presets | 4 Buttons | `Base`, `Basel III`, `2008 GFC`, `Stagflation` | **WORKS** | Instant scenario loading |
| **Desk 06: Simulator** | Staged Shock Sliders | Sliders | Revenue shock, COGS, Rate bps | **WORKS** | Updates pending inputs |
| **Desk 06: Simulator** | Run Simulation Button | Button | `runStressSimulation` | **WORKS** | Deterministic pro-forma engine |
| **Desk 06: Simulator** | Recommended Next Step | Button | Navigates to `07_REPORTS` | **WORKS** | Carries active company forward |
| **Desk 07: Reports** | Presentation Slicer | Tabs | `SLIDE DECK` vs `FULL DOSSIER` | **WORKS** | Toggles presentation views |
| **Desk 07: Reports** | Markdown Thesis Editor | Textarea | Auto-saves to `localStorage` | **WORKS** | Persistent analyst underwriting |
| **Desk 07: Reports** | Print / PDF Export | Button | `window.print()` with `@media print` | **WORKS** | Clean A4 boardroom formatting |
| **Desk 07: Reports** | CSV Export | Button | RFC 4180 CSV export | **WORKS** | Unaltered exact figures |
| **Desk 07: Reports** | SHA-256 Digest | Block | Deterministic cryptographic hash | **WORKS** | Provenance verification |
| **Desk 00: Admin** | 7 Sub-Navigation Tabs | Tabs | `Overview`, `Users`, `Sources`, `Quality`, etc.| **WORKS** | Full supervisory plane |
| **Desk 00: Admin** | Provision User Modal | Form | `POST /api/admin/users` | **WORKS** | Adds operator with PBKDF2 |
| **Desk 00: Admin** | Toggle User Status | Button | `PATCH /api/admin/users` | **WORKS** | Deactivate / reactivate |
| **Desk 00: Admin** | Provider Ping | Button | `POST /api/admin/providers` | **WORKS** | Tests API latency |
| **Desk 00: Admin** | Add Company & Statements | Form | `POST /api/admin/companies`, `/periods` | **WORKS** | SQLite mutations |
| **Desk 00: Admin** | Global Policy Hurdles | Form | `POST /api/admin/config` | **WORKS** | Updates `system_config` |

---

## 3. Workstation Audit: Purpose, Clutter & Mobile Challenges

| Workstation | Analytical Purpose | Primary Action | Clutter Points & Redundancies Eliminated | Mobile Challenges (< 768px) & Fix Plan |
| :--- | :--- | :--- | :--- | :--- |
| **Overview** (`overview`) | 5-second corporate executive health briefing | Select company / check hurdles | Removed duplicate profile cards; unified into `WorkstationHeader` | Grid cards stack vertically; quick-jump buttons wrap cleanly |
| **Desk 01: Hub** (`01_HUB`) | Security identification, market valuation, peer comparison | Search ticker or select from master | Replaced redundant search bars with one clean Omnibar | Stock chart needs touch-friendly scrubbing and responsive height |
| **Desk 02: Health** (`02_HEALTH`) | 3-statement ledger integrity & core credit ratio analysis | Audit balance sheet identity & view XBRL tags | Combined separate Statement and Ratio screens into single workspace with view slicer | Wide financial tables overflow; need horizontal scroll with sticky column and stacked card view toggle |
| **Desk 03: Warnings** (`03_VULNERABILITY`) | Early warning signals, debt maturity wall & working capital | Review critical red/amber breach triggers | Filter tabs clean up signal noise; debt maturity separated clearly | Debt schedule table needs responsive card layout on narrow viewports |
| **Desk 04: Dependencies** (`04_DEPENDENCIES`) | Supply chain bottlenecks, sovereign clients & vendor risks | Review disclosed counterparties & citations | Removed duplicate counterparty cards; unified KPI strip | Disclosed counterparty table needs mobile-friendly stacked list |
| **Desk 05: Concentration** (`05_CONCENTRATION`) | Revenue & supplier concentration via HHI index | Compare segment vs geographic exposure | Removed repeated explanatory cards; added collapsible formula guide | Two-column segment breakdown stacks cleanly on small screens |
| **Desk 06: Simulator** (`06_SIMULATOR`) | Macro shock resilience (revenue contraction, rate hikes) | Adjust sliders & click `[Run Simulation]` | Separated pending inputs from executed model to avoid jitter | Sliders need large 44px touch targets; comparison table needs card format |
| **Desk 07: Reports** (`07_REPORTS`) | Investment Committee credit brief & exportable dossier | Export PDF/Print or download CSV | Streamlined 6-slide deck with direct full dossier view | Slide navigation requires swipe/tap controls on phone; A4 print rules preserved |
| **Desk 00: Admin** (`00_ADMIN`) | System governance, telemetry, user clearance & audit log | Monitor system health & configure policies | Grouped into 7 self-contained tabs with active status summaries | Sub-tabs wrap horizontally with horizontal scroll bar on mobile |

---

## 4. Multi-Audience Review & Critique Framework

To ensure the terminal holds up under demanding academic and professional scrutiny, the upgrade will be evaluated against five distinct institutional profiles:

```
+---------------------------------------------------------------------------------------------------+
|                                 5-AUDIENCE EVALUATION MATRIX                                      |
+---------------------------------------------------------------------------------------------------+
| 1. MUMBAI UNIVERSITY EXTERNAL EXAMINERS                                                           |
|    - Academic rigor, balance sheet identity check (Assets = Liab + Equity), XBRL provenance.       |
|    - Clear viva explanation of formulas (Net Debt/EBITDA, Interest Coverage, Altman Z, HHI).       |
|                                                                                                   |
| 2. MUMBAI FINANCE PROFESSIONALS (Banks, NBFCs, Credit Rating Teams)                               |
|    - Ind-AS 108 / Schedule III conventions, INR formatting in Crores (₹ Cr) with Indian grouping. |
|    - NSE/BSE ticker coverage, realistic debt covenant floors, honest data delay disclaimers.      |
|                                                                                                   |
| 3. WALL STREET / GLOBAL CREDIT ANALYSTS                                                           |
|    - US-GAAP, Form 10-K Item 8 consistency, USD in Millions/Billions ($M / $B).                   |
|    - Strict mathematical integrity: no zero fabrication, no silent NaN fallbacks, exact citations.|
|                                                                                                   |
| 4. IIM CALCUTTA FACULTY & POSTGRADUATE RESEARCHERS                                                |
|    - Methodological transparency: deterministic stress testing, HHI economic interpretation.      |
|    - Honest acknowledgment of scope: rule-based screening, not an algorithmic black-box rating.    |
|                                                                                                   |
| 5. COMPLETE BEGINNER / JUNIOR ANALYST                                                             |
|    - Plain English summaries: "What this workstation answers" and "What this ratio means".        |
|    - Clear guided next steps, zero confusing overlapping jargon, interactive methodology guide.   |
+---------------------------------------------------------------------------------------------------+
```

---

## 5. Ordered Implementation Plan

1. **Step 1 (Formatting & Currency Conventions):** Enhance `src/lib/formatters.ts` to support Indian numbering (`₹ Cr`, `₹ L`, Indian comma separators) when currency is `INR` and scale is `Crores`/`Lakhs`. Support unit-level currency formatting for share prices without forcing `M`.
2. **Step 2 (Mobile-First Shell & Responsive Navigation):**
   - Add mobile bottom navigation bar (`<nav className="lg:hidden fixed bottom-0 ...">`) for primary desks.
   - Implement "More" sheet/drawer on mobile for secondary desks, Admin Console, and session management.
   - Use dynamic viewport height `dvh` and safe-area insets (`env(safe-area-inset-*)`).
   - Ensure all touch targets are $\ge 44 \times 44\text{px}$.
3. **Step 3 (Table & Chart Responsiveness):**
   - Add sticky first column with subtle shadow/border on financial tables.
   - Provide a "Card View" toggle for mobile viewports on dense tables.
   - Responsive touch scrubbing for the price chart.
4. **Step 4 (Methodology & Knowledge Modal):**
   - Build a comprehensive `MethodologyModal.tsx` accessible from the top bar, footer, command palette (`Ctrl+M`), and field guides detailing all 12 formulas, tolerance thresholds, HHI boundaries, and limitations.
5. **Step 5 (Interactive Walkthrough Tour):**
   - Build `TerminalWalkthroughTour.tsx` with a clean, skippable 5-step guided spotlight tour across the interface.
6. **Step 6 (Sub-view URL Synchronization):**
   - Synchronize workstation sub-views (e.g. `view=RATIOS` vs `view=STATEMENTS`, `view=DECK` vs `view=SCROLL`) into URL query params.
7. **Step 7 (Audience Review Rounds & Iteration Log):**
   - Conduct Round 1 and Round 2 evaluations, logging 3-5 criticisms per audience in `docs/ITERATION_LOG.md`.
   - Verify with `npm test`, `npm run lint`, and `npm run build`.
   - Deploy to production.
