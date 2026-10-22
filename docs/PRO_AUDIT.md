# FINTRAXIS — PROFESSIONAL CREDIT TERMINAL AUDIT (PRO_AUDIT)

**Audit Date:** 2026-10-22  
**Auditor:** Principal Full-Stack Engineer & Senior Credit Intelligence Specialist  
**Standard:** Institutional Credit Appraisal & Academic Viva Verification Accord  
**Scope:** `src/lib/financialCalculations.ts`, `src/lib/financialEngine.ts`, `src/lib/securityMaster.ts`, `src/lib/businessDisclosures.ts`, `src/db/schema.ts`, `data/fintraxis.db`, and UI Workstations.

---

## SECTION A: METHODOLOGY AUDIT

### 1. Existing Formulas in `financialCalculations.ts` & `financialEngine.ts`

| Metric | Implemented Formula | Inputs Read | Verdict | File & Line Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Balance Sheet Identity** | $\|Assets - (Liabilities + Equity)\| / Assets \le 0.01\%$ | `totalAssets`, `totalLiabilities`, `totalShareholdersEquity` | **SOUND** | `financialCalculations.ts#L39-86` |
| **Net Debt** | $TotalFundedDebt - (Cash + MarketableSecurities)$ | `totalDebt`, `cashAndEquivalents`, `marketableSecurities` | **SOUND** | `financialCalculations.ts#L92-118` |
| **Working Capital** | $TotalCurrentAssets - TotalCurrentLiabilities$ | `totalCurrentAssets`, `totalCurrentLiabilities` | **SOUND** | `financialCalculations.ts#L124-146` |
| **Current Ratio** | $TotalCurrentAssets / TotalCurrentLiabilities$ | `totalCurrentAssets`, `totalCurrentLiabilities` | **SOUND** | `financialCalculations.ts#L152-184` |
| **Quick Ratio** | $(Cash + MarketableSecurities + Receivables) / CurrentLiabilities$ | `cash`, `marketableSecurities`, `accountsReceivable`, `currentLiabilities` | **SOUND** | `financialEngine.ts#L20-27` |
| **Cash Ratio** | $CashAndEquivalents / TotalCurrentLiabilities$ | `cashAndEquivalents`, `totalCurrentLiabilities` | **SOUND** | `financialEngine.ts#L29-35` |
| **Net Debt / EBITDA** | $NetDebt / EBITDA$ (Returns 0.0 for net cash surplus) | `netDebt`, `ebitda` | **SOUND** | `financialCalculations.ts#L190-232` |
| **EBIT Interest Coverage** | $EBIT / \|InterestExpense\|$ | `ebit`, `interestExpense` | **SOUND** | `financialCalculations.ts#L238-270` |
| **Free Cash Flow (FCF)** | $OperatingCashFlow - \|CapEx\|$ | `operatingCashFlow`, `capitalExpenditures` | **SOUND** | `financialCalculations.ts#L276-298` |
| **Operating Margin** | $(OperatingProfit / TotalRevenue) \times 100$ | `ebit`, `revenue` | **SOUND** | `financialCalculations.ts#L303-336` |
| **Gross Margin** | $(GrossProfit / TotalRevenue) \times 100$ | `grossProfit`, `revenue` | **SOUND** | `financialCalculations.ts#L303-336` |
| **Net Margin** | $(NetIncome / TotalRevenue) \times 100$ | `netIncome`, `revenue` | **SOUND** | `financialEngine.ts#L87-93` |
| **ROE & ROA** | $NetIncome / Equity \times 100$, $NetIncome / Assets \times 100$ | `netIncome`, `totalShareholdersEquity`, `totalAssets` | **SOUND** | `financialEngine.ts#L95-109` |
| **HHI (Concentration)** | $\sum (\text{Segment Share } \%)^2$ | `businessSegments.percentageOfTotal`, `geographicSegments.percentageOfTotal` | **SOUND** | `businessDisclosures.ts#L710-730` |
| **Altman Z-Score** | Discussed in AI Copilot & Guide; formula not codified in calculation engine | Missing function in `financialCalculations.ts` | **NEEDS FIX** | `financialCalculations.ts` (Omission) |
| **Beneish M-Score** | Referenced in knowledge base; formula not codified in calculation engine | Missing function in `financialCalculations.ts` | **NEEDS FIX** | `financialCalculations.ts` (Omission) |
| **DSCR** | Referenced in guide; explicit debt service formula not codified in calculation engine | Missing function in `financialCalculations.ts` | **NEEDS FIX** | `financialCalculations.ts` (Omission) |
| **Composite Health Score** | Deductive penalty engine starting from 100; described as weighted linear pillars | `latestRatios`, early warning flags | **NEEDS FIX** | `financialEngine.ts#L130-300`, `MethodologyModal.tsx#L249` |

---

### 2. Input Availability for Distress & Diagnostic Models

* **Altman Z-Score (1968 / Z'' 1995 variant):**
  * $X_1$ Working Capital / Total Assets: **Available** (`totalCurrentAssets`, `totalCurrentLiabilities`, `totalAssets`).
  * $X_2$ Retained Earnings / Total Assets: **UNAVAILABLE** in current schema table `financial_periods` (`retained_earnings` line item is not separately stored). In public filings, retained earnings is a sub-line of shareholders' equity. If not populated, computing Altman Z-Score produces an approximation or must yield `N/D` with explicit reason.
  * $X_3$ EBIT / Total Assets: **Available** (`ebit`, `totalAssets`).
  * $X_4$ Book Equity / Total Liabilities (Z'') or Market Cap / Total Liabilities (1968): **Available** (`totalShareholdersEquity`, `totalLiabilities`, `marketCap`).
  * $X_5$ Sales / Total Assets: **Available** (`revenue`, `totalAssets`).
  * **Verdict:** Non-manufacturing / emerging-market variant ($Z''$) is appropriate for diversified conglomerates (Reliance) and service/tech firms (Infosys/Apple). Where `retained_earnings` is missing, the engine must return typed `ComputableResult` status `"MISSING_INPUT"` rather than faking an approximation.

* **Beneish M-Score (8-variable model):**
  * `accountsReceivable`, `revenue`, `grossProfit`, `propertyPlantEquipment`, `totalAssets`, `operatingCashFlow`, `netIncome`, `shortTermDebt`, `longTermDebt`: **Available across 2 consecutive years**.
  * `sga` (SG&A separate from general operating expenses): **Partially Available** (reported aggregated as `operating_expenses`).
  * `depreciation` separate line item: Derived as $EBITDA - EBIT$ where both exist.
  * **Verdict:** Compute strictly when two consecutive comparable fiscal years exist. If SG&A or depreciation is unsegregated, state the exact input limitation or return `N/D` for the specific index.

---

### 3. Definitions & Accounting Treatments

* **EBITDA:** Currently stored in database or derived as Operating Profit ($EBIT$) + Depreciation & Amortization ($D\&A$). In `src/db/schema.ts`, `ebitda` and `ebitdaFormula` exist as dedicated columns.
* **Lease Liabilities:** Under IFRS 16 / US-GAAP ASC 842 / Ind-AS 116, operating leases are recognized on balance sheet. In our data, leases are incorporated inside `total_debt` and `total_liabilities` as reported by issuers.
* **Funded Indebtedness:** `totalDebt` in schema strictly reflects `shortTermDebt + longTermDebt`.
* **Zero Denominators:** Handled cleanly in `financialCalculations.ts` returning `ComputableResult` with status `"ZERO_DENOMINATOR"`.

---

### 4. Period & Timing Consistency

* **Balance Sheet vs. Market Capitalization:**  
  * `market_cap` in `companies` is a snapshot figure from market trading, whereas balance sheets are as of fiscal year-end (`FY2024`, `FY2023`).
  * **Verdict (NEEDS FIX):** The UI must visibly label market-cap-based multiples as "Mixed Date: Balance Sheet as of [Period Date] vs. Market Cap as of [Market Timestamp]".
* **Currency & Scale Consistency:**  
  * Ingested companies strictly preserve their sovereign filing reporting unit (`AAPL`: USD Millions; `RELIANCE.NS`: INR Crores; `7203.T`: JPY Billions).
  * No silent conversion or mixed currency operations occur without explicit conversion notes.

---

### 5. Composite Health Score Architecture

* In `src/lib/financialEngine.ts` (`evaluateEarlyWarnings`), the score is built as:
  * Starts at **100**.
  * **Deductions:**
    * Gross Margin Decay (>300 bps YoY): -20 pts
    * CFO-to-Net Income Divergence (<0.7x): -15 to -25 pts
    * Cash-Burn Runway (<6 months): -35 pts; (<12 months): -15 pts
    * Interest Coverage Fragility (<1.5x): -30 pts; (<3.0x): -15 pts
    * Net Debt / EBITDA Gearing (>4.5x): -25 pts; (>3.0x): -10 pts
    * Working Capital Inversion (Current Ratio <1.0x): -15 pts
  * Clamped to $[10, 100]$.
  * **Tier Mapping:**
    * $\ge 80$ without Amber/Critical flags: `TIER_1_STABLE`
    * $50 - 79$ or any Amber flag: `TIER_2_WATCHLIST`
    * $< 50$ or any Critical flag: `TIER_3_CRITICAL`
* **Verdict (NEEDS FIX):** The deductive calculation itself is sound, but `MethodologyModal.tsx` claimed it was a 4-pillar weighted model (35% Solvency, 25% Liquidity, 20% Accrual, 20% Margins) and referenced "Aladdin". This must be aligned to reflect the true deterministic deductive penalty formula, relabeled as an "Internal Screening Indicator", and stripped of third-party proprietary trade names.

---

### 6. Scenario Simulator Assumptions

* In `src/lib/financialEngine.ts#L335`:
  `const incrementalInterestExpense = baseTotalDebt * rateShockDecimal;`
* **Verdict (NEEDS FIX):** This silently assumes that **100% of total debt is floating-rate**. In real corporate finance, debt is a mix of fixed-rate institutional bonds and floating bank facilities. We must add an explicit user input for **Floating-Rate Debt Share (%)** (default 40%, user-adjustable, with a clear disclaimer that exact fixed/floating mix requires footnote inspection).

---

## SECTION B: DATA AUDIT

### 7. Seeded Company Coverage Matrix

| Company ID | Symbol | Currency / Scale | Accounting Standard | Available Periods | Balance Sheet Identity | Source Filing Citation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AAPL` | AAPL | USD Millions | US-GAAP | FY2024, FY2023, FY2022 | **BALANCED (0.00% diff)** | SEC 10-K (CIK 0000320193) |
| `RELIANCE.NS` | RELIANCE.NS | INR Crores | Ind-AS / IFRS | FY2024, FY2023, FY2022 | **BALANCED (0.00% diff)** | BSE/NSE Annual Report (Scrip 500325) |
| `7203.T` | 7203.T | JPY Billions | IFRS / J-GAAP | FY2024, FY2023, FY2022 | **BALANCED (0.00% diff)** | Form 20-F / EDINET Yuho |
| `MSFT` | MSFT | USD Millions | US-GAAP | FY2024 | **BALANCED (0.00% diff)** | SEC 10-K (CIK 0000789019) |
| `TCS.NS` | TCS.NS | INR Crores | Ind-AS / IFRS | FY2024, FY2023, FY2022 | **BALANCED (0.00% diff)** | BSE/NSE Annual Report (Scrip 532540) |
| `TATASTEEL.NS`| TATASTEEL.NS | INR Crores | Ind-AS / IFRS | FY2024, FY2023, FY2022 | **BALANCED (0.00% diff)** | BSE/NSE Annual Report (Scrip 500470) |
| `JPM` | JPM | USD Millions | US-GAAP | FY2024 | **BALANCED (0.00% diff)** | SEC 10-K (CIK 0000019617) |

---

### 8. Benchmark Provenance

* In `HealthRatios.tsx#L29-73`, values like `industryMedian: 2.3` and `industryMedian: 4.8` are hardcoded static numbers.
* **Verdict (NEEDS FIX):** Relabel these from "Industry Median" to **"Illustrative Reference Level (User-Adjustable Screening Hurdle)"** to avoid misleading analysts into believing they are dynamic live FactSet/Bloomberg universe medians.

---

### 9. Debt Maturity Wall & Dependency Provenance

* In `VulnerabilityMonitor.tsx#L94`, the debt maturity schedule uses fixed illustrative percentage splits (`18% < 1 yr`, `32% 1-3 yrs`, `28% 3-5 yrs`, `22% > 5 yrs`).
* **Verdict (NEEDS FIX):** Label explicitly as **"Illustrative Debt Maturity Distribution (Footnote Disclosure Proxy)"** and provide a note that detailed debt schedules require indenture/note inspection.
* In `businessDisclosures.ts`, AAPL, RELIANCE, TOYOTA, HAL, and TCS cite audited footnote disclosures (Item 1A, Note 38 Ind-AS 108, ASC 280). Uncurated companies fall back to consolidated single-segment representation with `PARTIAL_DISCLOSURE` badge. **SOUND**.

---

## SECTION C: EXPERIENCE AUDIT FOR AN ANALYST

1. **Time-to-first-insight:** From login, the user lands directly on Executive Overview with key solvency indicators in < 1 second.
2. **Click depth:**
   * Key ratios: 1 click (Navigate to `Financial Health & Credit Ratios`).
   * Source of a number: 1 click (Inspect audit trail in Company Hub or Data Quality).
   * Export: 1 click (Print IC Memo / Export CSV in Research Reports).
3. **Speed & Ergonomics:** Fast response times, instant scroll-to-top on tab transitions, keyboard shortcuts (`Cmd+K`, `?`).

---

## PRIORITIZED FIX PLAN

1. **Phase 1 (Methodology Integrity):**
   - Implement pure functions in `src/lib/financialCalculations.ts` returning `ComputableResult` for:
     - `calculateAltmanZScore` (Z'' Non-Manufacturing / Emerging Markets variant; explicitly returns N/D if Retained Earnings is not disclosed, and flags N/A for financial institutions like JPM).
     - `calculateBeneishMScore` (8-factor model; requires 2 consecutive years; returns N/D if inputs missing; flags N/A for financials).
     - `calculateDSCR` and `calculateDebtServiceProxy` (explicitly distinguishing certified DSCR from short-term debt service proxy).
     - Indian appraisal metrics: `calculateTolToTnw` (Total Outside Liabilities to Tangible Net Worth).
     - `calculateCovenantHeadroom` (reverse-stress calculations for leverage, coverage, and liquidity).
   - Write comprehensive unit tests for all new functions (`tests/proMethodology.test.ts`).
2. **Phase 2 (Data Provenance & "As-Of" Discipline):**
   - Add explicit "As-Of" date stamps to module headers.
   - Relabel illustrative benchmarks to "Illustrative Reference Level".
   - Add Data Coverage Matrix in Company Hub.
3. **Phase 3 (Analyst-Grade Features):**
   - Add Floating-Rate Debt Share (%) input to Scenario Simulator.
   - Embed Covenant Headroom & Reverse Stress Analysis in Vulnerability Monitor / Stress Simulator.
   - Format negative numbers with accounting parentheses `(123.45)`.
4. **Phase 4 (Reporting & Export):**
   - Add native `.xlsx` financial statement and ratio export alongside CSV and print layout.
5. **Phase 5 (Tone & Claims Softening):**
   - Soften superlatives across the terminal; replace "Aladdin" with "Institutional Credit Screening".
   - Update `MethodologyModal.tsx` to match the exact deductive penalty formula.
6. **Phase 6 (Security & Ephemeral Storage Notice):**
   - Add clear ephemeral storage banner on admin/save actions.
   - Verify no committed plain-text credentials in documentation.
7. **Phase 7 (Verification & Reconciliation):**
   - Reconcile AAPL, RELIANCE.NS, and MSFT by hand in `docs/RECONCILIATION.md`.
   - Run full test suite, lint, and build.
