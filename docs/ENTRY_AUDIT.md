# FINTRAXIS — Phase 0 Entry Architecture & Flow Audit

**Document:** `docs/ENTRY_AUDIT.md`  
**Evaluation Target:** Next.js App Router (15.5.27), React (19.1.0), Tailwind (4), SQLite with Drizzle ORM, Vercel Serverless Production Deployment.  
**Auditor:** Principal Full-Stack Engineer & Institutional UX Lead  

---

## 1. What does `/` render today? Behavior across link entries

### File & Line Reference: `src/app/page.tsx` (Lines 118–205, 399–424)

- **Root Rendering Structure:**  
  `src/app/page.tsx` is a `"use client"` component containing an initial hydration/verification state (`isVerifyingAuth: true`, `mounted: false`). While verifying, it renders the peacock mark and a splash loading banner (`VERIFYING TERMINAL CLEARANCE • FINTRAXIS SOVEREIGN` at lines 400–407).
  
- **Scenario A: No session (Incognito or Cold Browser)**  
  1. `fetch("/api/auth/me")` returns HTTP 401 (`extractSessionFromRequest` finds no cookie).
  2. Fallback check on `localStorage.getItem("fintraxis_session")` returns `null`.
  3. `setSession(null)` executes, `isVerifyingAuth` becomes `false`.
  4. The page renders `<AuthGate />` (`src/components/AuthGate.tsx`).

- **Scenario B: Valid session cookie exists in browser**  
  1. `fetch("/api/auth/me")` succeeds (HTTP 200) with verified `user` payload from the HMAC-signed cookie.
  2. `setSession(verifiedSession)` sets state, writes to `localStorage`, resolves role (`00_ADMIN` if admin, `overview` if analyst), and mounts the full terminal workstation canvas immediately.
  3. **Identified Defect:** Opening a **new tab** or **new window** in the same browser automatically loads the authenticated terminal canvas because the cookie is sent automatically and `localStorage` is accessible. It does **not** force the user to land on the Login page first.

- **Scenario C: Expired or Revoked Session**  
  1. `verifySignedSessionToken` detects `exp < now` and returns `null`.
  2. `/api/auth/me` returns HTTP 401 with `{ success: false, error: "Your session ended or is invalid. Please sign in again." }`.
  3. If stale data remains in `localStorage`, the previous implementation fell back to `localStorage` without server re-validation.
  4. **Identified Defect:** A client-side localStorage fallback can mask server session expiry until an API call fails later.

- **Deep Links (`/admin` or `/?tab=04_DEPENDENCIES`):**  
  - `/admin` (`src/app/admin/page.tsx` line 11) calls `router.replace("/?tab=00_ADMIN")`.
  - For unauthenticated users with a deep link, the URL query parameter (`tab=04_DEPENDENCIES`) is preserved in `window.location.search`, but if they sign in, `AuthGate.tsx` line 418 redirects to `initialTab` or defaults without a disciplined role landing policy.

---

## 2. Session Storage, Verification & Serverless Lifetime

### File & Line References: `src/lib/sessionToken.ts` (Lines 18–106), `src/app/api/auth/login/route.ts` (Lines 40–50, 202–211), `src/app/api/auth/me/route.ts` (Lines 5–101)

- **Storage Medium:**  
  1. **Primary Authority:** `httpOnly` signed cookie named `fintraxis_session`.
  2. **Format:** Stateless `HMAC-SHA256` token (`b64Payload.signature`) signed with `SESSION_SECRET`.
  3. **Secondary Cache:** `localStorage.getItem("fintraxis_session")` (used for fast client hydration).
  4. **Session-Check Endpoint:** `GET /api/auth/me` verifies signature, expiration timestamp, and queries SQLite database for non-demo users to confirm `status !== "DEACTIVATED"`.
  
- **Vercel Serverless Compatibility:**  
  Because the token is signed with a deterministic secret (`SESSION_SECRET`) and self-contained (`HMAC-SHA256`), validation does **not** rely on in-memory server state. It functions seamlessly across ephemeral Vercel lambdas.
  
- **Session Duration:**  
  Currently set to `86400` seconds (24 hours). There is no active idle inactivity timeout (e.g. 30 minutes of no user interactions).

---

## 3. Routing Architecture, Middleware & Server Authority

### File & Line References: `src/app/page.tsx` (Lines 530–610), `src/app/api/admin/*`

- **Routing Type:**  
  Single Page Application (SPA) workstation switching inside `src/app/page.tsx` controlled by React state (`activeTab`) synchronized with browser URL parameters (`?tab=...&company=...&view=...`).
  
- **Middleware Presence:**  
  `src/middleware.ts` is currently **absent**. Next.js App Router requests are routed directly to handlers without gateway interception.

- **Server-Side Protection vs Client-Side Obfuscation:**
  - **Protected on Server:**
    - `POST /api/admin/config`: Enforces `verifyOperatorClearance(request, ["SUPER_ADMIN", "ADMIN"])` (`src/app/api/admin/config/route.ts` line 27).
    - `POST /api/admin/users`: Enforces clearance checks.
    - `POST /api/companies/ingest`: Enforces clearance checks.
  - **Vulnerabilities / Client-Only Guards:**
    - `GET /api/admin/config`: Completely unauthenticated! Any unauthenticated HTTP client can fetch all system configuration parameters (`src/app/api/admin/config/route.ts` line 6).
    - `GET /api/admin/users`: Completely unauthenticated! Any request can dump user emails, roles, and status (`src/app/api/admin/users/route.ts` line 22).
    - `/admin`: Pure client-side redirect (`router.replace`) with no server gateway barrier.

---

## 4. Visual Flash & Transition Analysis

### File & Line References: `src/app/page.tsx` (Lines 398–424)

- **Signed-Out Visitor:**  
  When an unauthenticated user opens `/`, `isVerifyingAuth` displays the full-screen peacock loader for 150–350ms while `/api/auth/me` returns 401, followed by a transition to `AuthGate`. Protected dashboard content does **not** flash, but the loading state is unnecessary on cold tab visits where no tab confirmation exists.
  
- **Signed-In User Refresh:**  
  On page refresh, the peacock loader renders until `/api/auth/me` responds, then mounts the workspace canvas.
  
- **Identified Defect:** A new tab opened by a previously authenticated user flashes the loader and then auto-enters the workspace instead of adhering to the strict **Login-First Entry Contract**.

---

## 5. Session Termination, Cache Headers & Back Button Exposure

### File & Line References: `src/app/page.tsx` (Lines 262–273), `src/app/api/auth/logout/route.ts` (Lines 4–20)

- **Logout Behavior:**  
  `handleLockSession` executes `fetch("/api/auth/logout", { method: "POST" })`, deletes `localStorage.getItem("fintraxis_session")`, resets React state (`setSession(null)`), and resets the URL path.
  
- **The Back Button Defect:**  
  - Neither `src/app/page.tsx` nor the Next.js API routes send HTTP response header `Cache-Control: no-store, no-cache, must-revalidate`.
  - When an operator clicks **Logout**, pressing the browser **Back** button can cause the browser's Back-Forward Cache (bfcache) to render an un-invalidated DOM snapshot of sensitive financial statements and credit metrics.
  - Furthermore, `Ctrl + Shift + L` does not clear tab session flags or trigger a full window replace.

---

## 6. Inventory of Entry Journey: Clutter & Friction Points

From typing the URL to inspecting the first credit analysis:

1. **Cold Visit Splash Screen:** Renders an animated spinner and "VERIFYING TERMINAL CLEARANCE" even when the user has never signed in before.
2. **Registration vs Sign-In Clutter:** `AuthGate.tsx` includes an inline tabbed registration form. In an institutional banking terminal, accounts are provisioned by enterprise administrators; public registration clutter dilutes the institutional atmosphere.
3. **Demo Access Presentation:** Two demo access paths exist (inline guest button vs analyst/admin presets) with inconsistent roles.
4. **Post-Login Orientation:** When an analyst signs in, they are immediately dropped into the canvas without a calm, structured path.

---

## 7. Short Fix Plan

1. **Deploy Next.js Server Authority Middleware (`src/middleware.ts`):**
   - Intercept `/api/admin/:path*`: Return 401 if unauthenticated, 403 if role is not `ADMIN`/`SUPER_ADMIN`.
   - Protect `GET /api/admin/users` and `GET /api/admin/config`.
   - Set `Cache-Control: no-store, no-cache, must-revalidate` on all protected endpoints and page documents.
2. **Enforce the Tab-Confirmation Entry Contract:**
   - Use `sessionStorage.getItem("fintraxis_tab_active")` to track tab-specific active clearance.
   - On cold tab/window visits: Render the Login Page **first, always**, regardless of existing cookies.
   - On within-tab page refresh: Preserve active session, module, company, and sub-view without flash.
   - On logout or `Ctrl + Shift + L`: Clear server session, cookie, `localStorage`, `sessionStorage`, and redirect to `/`.
3. **Implement Idle Inactivity Timeout (30 min):**
   - Track user interaction events (`mousemove`, `keydown`, `click`).
   - Trigger a polite warning at 29 minutes: *"Your session will expire in 1 minute due to inactivity. Stay signed in?"*
   - At 30 minutes: Revoke session, invalidate cookie, and display: *"Your session ended. Please sign in again."*
4. **Refine Login Page & Institutional Meta Standards:**
   - Deep midnight navy, fine background grid, refined financial line animation, inline validation, and clear error banners.
   - Pre-configured, real demo authentication buttons for **Senior Credit Analyst** and **Institutional Administrator**.
   - OpenGraph and Twitter meta tags, favicon, theme-color `#070A0F`, and `noindex, nofollow` in `src/app/layout.tsx`.
   - Branded 404 (`src/app/not-found.tsx`) and Error (`src/app/error.tsx`) pages.
5. **Calm Linear Flow & Scroll Reset:**
   - Ensure module transitions reset scroll container and focus heading.
   - Verify with tests in `tests/entryContract.test.ts`.
