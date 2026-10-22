# FINTRAXIS Institutional Fix-and-Finish Changelog

This changelog documents the complete systematic remediation and verification pass across FINTRAXIS for Wall Street analysts, Mumbai finance professionals, external academic examiners, and IIM credit appraisal committees.

---

## 1. Single Source of Truth & Financial Consistency
- **Cross-Screen Consistency:** Created `src/lib/finance/financeMaster.ts` and `quoteResolver.ts` establishing unified typed metrics across Company Directory, Overview Workstation, Health Ratios, Scenario Simulator, Copilot, and Exports.
- **Net Cash Multiples:** Eliminated misleading `0.0x` and `0.00x` clamping for net-cash surplus firms. Unified output as `${val}x (Net Cash)` (e.g. `-0.62x (Net Cash)` on TCS.NS).
- **Ind AS 116 Lease Explanations:** Resolved user confusion regarding ₹0 bank debt vs ₹812 Cr finance charges by explicitly explaining lease liabilities (Ind AS 116 / ASC 842 Right-of-Use capitalization) across all workstations.
- **Consistent Market Quotes:** Enforced that price, day change, day range, and 52-week corridor are mathematically consistent (`dayLow <= price <= dayHigh`). Corrected the Yahoo Finance endpoint bug that computed day change against 30-day-old previous close.

---

## 2. Authentication, Governance & Security
- **Eliminated Hardcoded Passwords:** Removed all visible `Default: analyst123 / admin123` labels from `AuthGate.tsx`.
- **Streamlined Demo Access:** Replaced multi-role fake 1-click buttons with a single, clear `Explore with demo access` button operating in sandbox mode.
- **System Policy Flag:** Implemented `DEMO_ACCESS_ENABLED` environment toggle.
- **Removed Implementation Leaks:** Replaced `PORT 3001 OK`, `SQLITE WAL OK`, and internal server states with calm status badges (`SYSTEM OPERATIONAL | TERMINAL READY`).
- **Cryptographic Security:** Strengthened timing-safe PBKDF2 hash verification, added rate-limit cooldown (429), and enforced role-based clearance denying demo users access to administrative write paths (403).

---

## 3. Deterministic Stress Simulator Rebuild
- **Operating Leverage & Variable Cost Decomposition:** Replaced arbitrary flat revenue haircuts with exact cost decomposition:
  $$\text{Operating Costs} = \text{Revenue} - \text{EBIT}$$
  $$\text{Variable Costs} = \text{Operating Costs} \times v, \quad \text{Fixed Costs} = \text{Operating Costs} \times (1 - v)$$
- **Sector Default Variable Cost Shares:** Technology (35%), Manufacturing (65%), Retail (75%), Telecom (30%), Energy (70%), with interactive 0%–100% slider.
- **Cost Inflation & Volume Pass-Through:**
  $$\text{VariableCosts}' = \text{VariableCosts} \times (1 + s) \times (1 + c)$$
  $$\text{FixedCosts}' = \text{FixedCosts} \times (1 + c)$$
- **Exact Visual EBIT Bridge:** Implemented interactive waterfall bridge reconciling Baseline EBIT, Revenue Shock, Variable Cost Relief, Cost Inflation Headwinds, and Stressed EBIT down to $\pm 0.00$ exact equality.
- **Honest What-If Wording:** Replaced all claims of "covenant breach" and "syndicate line freezes" with:
  > *"Reference threshold breached in this scenario. This is a what-if calculation, not a prediction."*

---

## 4. Regulatory & Identifier Correctness & Overclaims Removal
- **Corrected Corporate Identifiers:**
  - Cleared US SEC CIK from non-SEC Indian companies (`TCS.NS`, `RELIANCE.NS`, `HAL.NS`, `TATASTEEL.NS`).
  - Added MCA Corporate Identification Numbers (CIN):
    - TCS: `L22210MH1995PLC084781`
    - Reliance: `L17110MH1973PLC019786`
    - HAL: `L35301KA1963GOI001622`
    - Tata Steel: `L27100MH1907PLC000260`
  - Preserved official SEC CIKs for US registrants (`AAPL`, `MSFT`, `NVDA`, `GOOGL`).
- **Eliminated Banned Buzzwords & Overclaims:**
  - Removed "Zero Hallucination", "Sovereign Clearance", "Node MUM-01", "CRO sign-off", "Power BI", "Groww-style", "Wall Street Charging Bull", and fake New York phone numbers (`+1 (212)...`).
  - Replaced "Fortress" with "Net Cash Surplus" or "Prime Solvency".
  - Restricted Basel III terminology strictly to banking institutions.

---

## 5. Peer Grouping & Ticker Tape Transparency
- **Sample Size Declaration:** Peer comparisons in `HealthRatios.tsx` now compute real medians from the registered issuer universe and display explicit sample sizes: `Peer (n=5 Technology peers)`.
- **Transparent Macro Ticker:** Labeled benchmark yields and central bank rates honestly as `"REFERENCE BENCHMARKS (OCT 2026)"`.

---

## 6. Financial Education Layer
- **Comprehensive Glossary (`src/lib/glossary.ts`):** Authored definitions, formulas, examiner explanations, rules of thumb, and analytical pitfalls for 34 financial metrics.
- **Interactive `<InfoTip>` Component (`src/components/InfoTip.tsx`):** Added reusable popover rendering formulas, summaries, and hurdles on hover/click.
- **Analyst Explain Drawer (`src/components/ExplainDrawer.tsx`):** Interactive slide-over showing substituted filing numbers, credit committee context, and caveats.
- **Searchable Help & Concept Guide:** Fully functional from the fixed status footer (`HELP & GLOSSARY (?)`).

---

## 7. UI Defect Corrections
- **AI Copilot Markdown Renderer:** Replaced raw `whitespace-pre-wrap` with a dedicated markdown parser rendering headers, bold text, bulleted lists, and code blocks.
- **Responsive Floating Button:** Converted the wide floating AI pill into an uncluttered, responsive button that avoids overlapping content on mobile devices.
- **Scroll-to-Top Navigation:** Preserved automatic scroll restoration on every module switch.
- **Session Restoration:** URL search parameters (`?tab=...&company=...`) deterministically restore active workspace on page refresh.

---

## 8. Automated Test Suite Expansion
- Added `tests/consistency.test.ts` (Stage 2 consistency checks).
- Added `tests/authStage3.test.ts` (Stage 3 authentication, rate limiting, and RBAC checks).
- Added `tests/stressSimulator.test.ts` (Stage 4 operating leverage, variable cost extremes, zero interest, and negative EBIT checks).
- Total test suite: **119 passing tests across 35 test suites, 0 failures, 0 skips, 0 lint warnings**.
