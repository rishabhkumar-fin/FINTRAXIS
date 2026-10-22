# FINTRAXIS — Session, Navigation & Module-Flow Audit (Phase 0 Deliverable)

**Date of Audit:** October 2026  
**Auditor:** Principal Full-Stack Engineer & UX Lead  
**Scope:** Root-cause investigation of session persistence, navigation state, scrolling behavior, and cross-workstation analytical flow.  
**Codebase:** Next.js 15.5.27 (App Router), React 19.1.0, TypeScript 5, SQLite WAL via `better-sqlite3` and Drizzle ORM.

---

## 1. Section A: Session and Login Architecture

### A.1 Session Storage & Client Startup Verification
- **Where is the session stored after login?**
  - **Server:** In `src/app/api/auth/login/route.ts` (lines 24-32 and 172-180), the server issues an httpOnly cookie named `fintraxis_session` with value `sessionToken` (e.g. `SOV-XXXXXXXXXXXX` or `DEMO-XXXX`). However, this `sessionToken` is generated on the fly via `crypto.randomBytes(12)` and is **never written to any SQLite table or server-side session registry**.
  - **Client:** In `src/components/AuthGate.tsx` (lines 96 and 180), upon receiving the JSON response from `/api/auth/login`, the client serializes the full user object into `localStorage.setItem("fintraxis_session", JSON.stringify(session))`.
  - **First Load Client Logic:** In `src/app/page.tsx` (lines 52-82), a client-side `useEffect` reads `localStorage.getItem("fintraxis_session")`. If present, it sets React state `setSession(parsed)`.
  - **Root Cause of Session Breakage:** **There is currently NO server-side session-verification endpoint (such as `GET /api/auth/me`).** If `localStorage` is cleared, or if the user opens a new incognito window, or if the server cookie expires, the client and server fall out of sync. Furthermore, the client cannot verify if the token is valid, forged, or expired without a server endpoint.

### A.2 Vercel Serverless & In-Memory Rate Limiting
- **Rate Limiter Location:** In `src/lib/authRateLimit.ts` (line 13), rate limiting is implemented via an in-memory `Map`:
  ```typescript
  const rateLimitStore = new Map<string, RateLimitRecord>();
  ```
- **Serverless Failure Analysis:** On Vercel, serverless instances execute as stateless AWS Lambda functions. Memory is isolated to an individual instance and is destroyed when the lambda goes cold. Consequently:
  1. Rate-limiting counts are not shared between concurrent lambdas or regions.
  2. A malicious actor hitting different edges may bypass the 5-attempt threshold.
  3. Conversely, legitimate users hitting an already-warm instance with previous state may experience unexpected timing artifacts.
- **Remediation:** For production serverless, authentication session tokens must be signed (HMAC with a server secret like `SESSION_SECRET` or `NEXTAUTH_SECRET`), so any lambda instance can verify the token statelessly without needing shared server memory.

### A.3 Vercel Ephemeral Database (`/tmp/fintraxis.db`)
- **Database Initialization:** In `src/db/index.ts` (lines 10-28), on Vercel (`process.env.VERCEL`), the filesystem outside `/tmp` is read-only. The system copies the static seed file `data/fintraxis.db` to `/tmp/fintraxis.db`.
- **Honest Persistence Audit:** Every feature that writes to SQLite writes solely to the instance's ephemeral `/tmp` storage:
  1. User registration (`POST /api/auth/register`)
  2. Custom user hurdle calibrations (`POST /api/auth/settings`)
  3. Admin user creation / deactivation / deletion (`POST/PATCH/DELETE /api/admin/users`)
  4. Manual company enrollment (`POST /api/admin/companies`)
  5. Company deletion (`DELETE /api/admin/companies`)
  6. Financial statement line-item editing (`POST /api/admin/periods`)
  7. Global risk policy updates (`POST /api/admin/config`)
  8. Administrative audit journal entries (`POST /api/admin/logs`)
  9. System maintenance jobs execution (`POST /api/admin/jobs`)
  10. Ticker ingestion (`POST /api/companies/ingest`)
- **Impact in Production:** On Vercel, when a lambda container is recycled (after minutes of inactivity) or when a request hits a different container, `/tmp` is recreated from the static `data/fintraxis.db`. **All runtime writes on Vercel are ephemeral.**
- **Remediation:** Display an honest, transparent diagnostic notice in the Admin Console: *"Notice: Running on Vercel Serverless. Modifications persist within the active container runtime (/tmp). For permanent multi-session persistence, run locally on localhost or connect a persistent SQLite volume / Turso DB."*

### A.4 Auth Gate Flash & Logout Cleanliness
- **Flicker on Refresh:** In `src/app/page.tsx` (lines 248-266), `mounted` is initialized to `false` and renders a blank black div (`<div className="min-h-screen bg-[#070A0F]" />`). `useEffect` then runs synchronously and sets the session from `localStorage`. While this avoids flashing `AuthGate` to a logged-in user, it causes a momentary black screen while mounting. If session verification is moved to an async server check (`/api/auth/me`), an unmanaged delay would flash `AuthGate` unless a dedicated branded loading state is shown.
- **Logout Completeness:** In `src/app/page.tsx` (lines 133-136):
  ```typescript
  const handleLockSession = () => {
    localStorage.removeItem("fintraxis_session");
    setSession(null);
  };
  ```
  `handleLockSession` only removes `localStorage` and sets React state to `null`. It **does not call `/api/auth/logout`**, does not clear the `fintraxis_session` httpOnly cookie, and does not reset URL query parameters (`?tab=...&company=...`). If a user locks the terminal and clicks the browser's Back button, cached pages or state could be exposed.

### A.5 Demo Buttons vs Normal Form
- **Form Login:** Submits `POST /api/auth/login` with `{ email, password }`, performs PBKDF2 verification, receives a session payload, saves it to `localStorage`, and triggers `onAuthenticated`.
- **Demo Buttons:** In `src/components/AuthGate.tsx` (lines 63-125), `handleQuickRoleLogin` calls `POST /api/auth/login` with seeded credentials (`analyst@fintraxis.local` / `analyst123` or `admin@fintraxis.local` / `admin123`). However, if the server route fails or takes too long, it falls back to an unverified local object (`fallbackSession`).
- **Conclusion:** Both paths achieve the same client state, but the fallback allows an unauthenticated client to bypass server validation if the API fails. Both must be unified under real server-trusted session issuance.

---

## 2. Section B: Navigation and Refresh Architecture

### B.6 Active Workstation Tracking
- **State vs URL:** In `src/app/page.tsx` (lines 34 and 52-82):
  - `activeTab` is tracked as a local React `useState<ModuleTab>("00_ADMIN")`.
  - On first load, `useEffect` reads `searchParams.get("tab")`.
  - **However, when the user clicks workstation buttons in `SidebarNavigation.tsx` or `OverviewWorkstation.tsx`, it only invokes `setActiveTab(tab)`. It NEVER calls `window.history.pushState` or `router.replace`!**
- **Browser Behavior:**
  - **Browser Refresh (F5):** The URL in the address bar is still `http://localhost:3000/` without query params. The app re-reads empty params and resets back to `overview` (or `00_ADMIN` for admins), losing where the user was!
  - **Back / Forward Buttons:** Completely non-functional because no history entries are pushed when switching workstations.
  - **Shared Links:** A user cannot share a direct link to `02_HEALTH` or `06_SIMULATOR` because the address bar never updates.

### B.7 Selected Company Tracking
- **State Tracking:** In `src/app/page.tsx` (line 36):
  - `selectedCompanyId` is tracked as `useState<string>("AAPL")`.
  - When the user selects another company in `SidebarNavigation` or `OverviewWorkstation`, it calls `setSelectedCompanyId(id)` and fetches `/api/companies/[id]`.
  - **The URL is never updated with `?company=TICKER`.**
- **Browser Behavior:**
  - On page refresh, `selectedCompanyId` resets back to `"AAPL"`!
  - If a user switches to `RELIANCE.NS`, navigates through 3 workstations, and hits refresh, they are kicked back to `AAPL`.
  - Furthermore, in-flight requests are not cancelled: if a user clicks `TCS.NS` and quickly clicks `HAL.NS`, a delayed `TCS.NS` response could overwrite `HAL.NS` data.

---

## 3. Section C: Scroll and Layout Investigation

### C.8 The Scrolling Element Root Cause
- **Code Inspection:** In `src/app/page.tsx` (lines 287-340):
  ```tsx
  <div className="flex-1 flex flex-col min-w-0 pl-0 lg:pl-64 transition-all duration-200">
    ...
    {/* Scrollable Workstation Canvas */}
    <main className="flex-1 p-4 lg:p-6 max-w-[1720px] w-full mx-auto relative pb-20 overflow-y-auto">
  ```
- **Root Cause Confirmed:**
  - The browser `window` DOES NOT scroll (`overflow: hidden` on viewport parent).
  - **The `<main>` element with `overflow-y-auto` is the actual scrolling container.**
  - When a user scrolls to the bottom of Financial Health (`scrollTop = 1200px`) and clicks `Vulnerability Monitor`, React swaps the component inside `<main>`, but **the `<main>` DOM element retains `scrollTop = 1200px`**!
  - The user lands at the bottom of Vulnerability Monitor, missing the header, surveillance grade, and health score.
  - Standard `window.scrollTo(0, 0)` fails because the window has scroll height 0.
- **Remediation:** Create a `mainScrollRef = useRef<HTMLElement>(null)` attached to `<main>`. Whenever `activeTab` or `selectedCompanyId` changes, execute `mainScrollRef.current?.scrollTo({ top: 0, behavior: "instant" })` and shift focus to the workstation's main header for accessibility.

---

## 4. Section D: Module Flow & Workstation Inventory

The table below audits all 9 workstations, identifying their primary purpose, actions, redundancies, clutter, and operational status:

| Workstation | Key | Purpose | Primary Action | Redundancies & Overlap | Friction / Clutter Points | Operational Status |
|---|---|---|---|---|---|---|
| **Corporate Overview** | `overview` | High-level executive snapshot before deep research. | Switch company, view headline metrics, launch workstation. | Summarizes Net Debt/EBITDA, Interest Coverage, and Current Ratio. | Needs consistent institutional page header, explicit Next Step footer ("Begin in-depth analysis: Company Intelligence Hub →"). | **WORKS** |
| **Company Intelligence Hub** | `01_HUB` | Securities directory, live quote, OHLCV history & enrollment. | Search ticker, scrub interactive 8-timeframe chart, ingest security. | Displays price and market cap (also on Overview). | Dual search concept (local vs live) can confuse; needs unified search input and Next Step ("Next: Financial Health →"). | **WORKS** |
| **Financial Health Analysis** | `02_HEALTH` | 3-statement multi-period XBRL ledger + 4 credit ratio groups. | Toggle Ratios vs Statements; click cell to open Audit Sidecar. | Calculates leverage multiples also seen on Overview and Vulnerability. | Table is dense; needs clear progressive disclosure and Next Step ("Next: Vulnerability Monitor →"). | **WORKS** |
| **Financial Vulnerability** | `03_VULNERABILITY` | Early warning surveillance, Basel III flags, debt maturity wall. | Filter risk category (`[All]`, `[Solvency]`, `[Liquidity]`, `[Dependencies]`). | Re-evaluates leverage and debt metrics from Health. | Needs Next Step footer ("Next: Business Dependencies →"). | **WORKS** |
| **Business Dependencies** | `04_DEPENDENCIES` | Counterparty risk (suppliers, customers, technology, regulatory). | Review counterparty disclosures, relationship types, and citations. | Qualitative points previously echoed in Vulnerability cards. | Issuers with exempt disclosures need clear disclaimer with no empty cards. Next Step ("Next: Concentration Exposure →"). | **WORKS** |
| **Concentration Exposure** | `05_CONCENTRATION` | ASC 280 / IFRS 8 business & geographic segment revenue + HHI. | Inspect segment distribution and antitrust HHI scores. | None (highly specialized). | Needs Next Step footer ("Next: Macro Scenario Simulator →"). | **WORKS** |
| **Scenario Simulator** | `06_SIMULATOR` | Macro rate shock, revenue contraction, and cost inflation testing. | Stage inputs, click `[▶ Run Simulation]`, test presets. | References baseline revenue/EBIT. | Staged inputs must remain clean; Next Step ("Next: Research Reports & Memo →"). | **WORKS** |
| **Research Reports & Dossier**| `07_REPORTS` | Investment Committee credit memo, printable tearsheet, CSV, hash. | Edit thesis commentary, print A4 tearsheet (`window.print()`), export CSV. | Consolidates all prior modules. | Mode switcher (`DECK` vs `SCROLL`) needs clear indicators; clean print styling. | **WORKS** |
| **Admin Console** | `00_ADMIN` | Supervisory governance across 7 operational sub-sections. | Manage users, calibrate global hurdles, enroll issuers, run jobs. | Displays company master. | Needs per-section status summary ("Nothing needs attention"), confirmation dialogs, and Vercel ephemeral DB notice. | **WORKS** |

---

## 5. Ordered Architectural Fix Plan

1. **Phase 1: Reliable Login and Session**
   - Implement stateless signed session tokens (HMAC-SHA256 with server-side secret) stored in httpOnly, SameSite=Lax cookie `fintraxis_session`.
   - Implement `GET /api/auth/me` returning current authenticated operator profile and role (or 401).
   - Implement `POST /api/auth/logout` clearing cookie and server session.
   - Update `AuthGate.tsx` and `page.tsx`: show neutral branded loading splash while `/api/auth/me` checks session; prevent auth flicker.
   - Unify demo buttons to call real server session endpoint with authentic session issuance.
   - Enforce server-side role validation in all `/api/admin/*` routes via `authGuard.ts`.

2. **Phase 2: Navigation, Refresh and Scroll Behavior**
   - Synchronize URL with active workstation, selected company, and sub-view via `window.history.pushState` / query parameters (`?tab=...&company=...&subView=...`).
   - Implement automatic scroll reset to top on `<main>` element whenever `activeTab`, `selectedCompanyId`, or sub-view changes.
   - Implement `AbortController` in profile and market queries to prevent slow previous requests from overwriting newer company data.
   - Add honest feedback to `[Refresh Data]` with real timestamp and failure fallback.

3. **Phase 3: One Clear Flow Across All Workstations**
   - Standardize page headers across all workstations with plain-English title, code badge, active company badge, audited period, and "What this page answers".
   - Standardize "Next Step" footer on every workstation guiding the user along the linear workflow:
     *Overview &rarr; Company Hub &rarr; Financial Health &rarr; Vulnerability Monitor &rarr; Business Dependencies &rarr; Concentration &rarr; Scenario Simulator &rarr; Reports*
   - Add transparent Vercel Serverless `/tmp` diagnostic notice in Admin Console.

4. **Phase 4: Automated Testing & Verification**
   - Add tests for session signing, `/api/auth/me`, 401 unauthorized, 403 admin forbidden for analysts, URL parameter parsing, and scroll reset.
   - Run `npm test`, `npm run lint`, and `npm run build` to confirm zero regressions.
