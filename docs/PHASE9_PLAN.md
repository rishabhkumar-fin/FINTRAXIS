# FINTRAXIS Phase 9: Discovery & Architecture Plan

Date: October 22, 2026  
Branch: `phase9`  
Status: Discovery Phase (Section 1)

---

## 1. Existing Help & Glossary Architecture

The primary financial glossary and concept reference in FINTRAXIS was unified in Phase 8:
- **Data Source File:** [`src/lib/conceptGuideData.ts`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/lib/conceptGuideData.ts)
  - Exports `GLOSSARY_CONCEPTS`: Array of `GlossaryConcept` items (id, term, category, formula, plainMeaning, inputs, thresholds, doesNotTellYou, regulatoryStandard).
  - Exports `SOURCE_BADGES_LEGEND`: The 5 standardized provenance badges (`Disclosed in filing`, `Calculated`, `Estimated`, `Simulated`, `Demonstration/seed data`).
  - Exports `MODULE_ABOUT_MAP`: 3-line structured "About this module" cards.
- **UI Consumers:**
  - [`src/components/HelpGlossaryModal.tsx`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/components/HelpGlossaryModal.tsx): Searchable modal triggered via `?`, `Ctrl+K`, or footer buttons.
  - [`src/components/ConceptTooltip.tsx`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/components/ConceptTooltip.tsx): Inline hover/tap popover referencing concepts.
  - [`src/components/AboutModulePanel.tsx`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/components/AboutModulePanel.tsx): Collapsible 3-line summaries embedded on each workstation.
- **Rule for Phase 9:** Extend `src/lib/conceptGuideData.ts` directly. Do **not** create a secondary glossary file.

---

## 2. Current Schema Analysis

**File Reference:** [`src/db/schema.ts`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/db/schema.ts)

### A. Ownership & Promoter Fields
- **Current State:** The `companies` table has basic metadata (`id`, `symbol`, `name`, `exchange`, `country`, `currency`, `scaleUnit`, `isin`, `cik`, `sector`, `industry`, `fiscalYearEnd`, `accountingStandard`, `fxRateToUsd`, `fxTimestamp`, `marketCap`, `sharePrice`).
- **Missing Fields:**
  - `promoterHoldingPct`: real ("promoter_holding_pct")
  - `promoterPledgedPct`: real ("promoter_pledged_pct") — % of promoter holding pledged
  - `promoterPledgedCapitalPct`: real ("promoter_pledged_capital_pct") — % of total equity capital
  - `promoterPledgeQuarter`: text ("promoter_pledge_quarter") — e.g., "Q4 FY2024" or as-of date
  - `promoterPledgeSourceUrl`: text ("promoter_pledge_source_url")
  - `promoterPledgeVerification`: text ("promoter_pledge_verification") — "VERIFIED_BY_AGENT" | "SUPPLIED_BY_USER" | "NOT_INDEPENDENTLY_VERIFIED"
  - `hasPromoterGroup`: real ("has_promoter_group") — 1 if disclosed promoter group exists, 0 if dispersed/none.

### B. Balance Sheet & Working Capital Items in `financialPeriods`
- **Existing & Populated Fields:**
  - `inventories`: Populated for AAPL and RELIANCE across FY2024, FY2023, FY2022.
  - `accountsReceivable`: Populated for AAPL and RELIANCE.
  - `accountsPayable`: Populated for AAPL and RELIANCE.
  - `shortTermDebt`, `longTermDebt`, `totalDebt`: Populated for AAPL and RELIANCE.
  - `totalLiabilities`, `totalShareholdersEquity`: Populated for AAPL and RELIANCE.
- **Missing Working Capital / Appraisal Fields:**
  - `intangibles`: Not in schema (defaults to 0 in `calculateTolToTnw`).
  - `receivablesAgeingUnder90Days`: Missing. Required for true bank Drawing Power (DP).
  - `contingentLiabilitiesTotal`: Missing in schema.
  - `contingentLiabilitiesTax`: Disputed tax claims missing.
  - `contingentLiabilitiesGuarantees`: Corporate guarantees missing.
  - `contingentLiabilitiesClaims`: Other claims missing.
  - `contingentLiabilitiesSourceUrl`: Missing.
  - `contingentLiabilitiesVerification`: Missing.

### C. Debt Instruments / Tranche Structure
- **Current State:** No table exists in schema for itemized debt instruments.
- **Required Additive Table:** `debt_instruments`
  - `id`: text primary key
  - `companyId`: references `companies.id`
  - `period`: text (e.g. "FY2024")
  - `instrumentName`: text
  - `coupon`: real (or text for floating/zero)
  - `couponType`: text ("FIXED" | "FLOATING" | "ZERO_COUPON" | "HIRE_PURCHASE")
  - `currency`: text
  - `maturityYear`: real / text
  - `principalAmount`: real (in filing's scale)
  - `sourceForm`: text (e.g. "Form 10-K", "Annual Report")
  - `filingDate`: text
  - `sectionOrPage`: text (e.g. "Note 8: Term Debt", "Note 18: Borrowings")
  - `verificationFlag`: text ("VERIFIED_BY_AGENT" | "SUPPLIED_BY_USER" | "NOT_INDEPENDENTLY_VERIFIED")

---

## 3. Debt Maturity Schedule Production

- **Current Implementation:**
  - In [`src/components/VulnerabilityMonitor.tsx`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/components/VulnerabilityMonitor.tsx#L90-L98) and [`src/components/ICDossier.tsx`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/components/ICDossier.tsx#L1135-L1160):
    ```ts
    const totalDebt = latest?.totalDebt ?? 0;
    const maturityBuckets = [
      { label: "< 1 Year (Near-Term Rollover)", pct: 0.18, amount: totalDebt * 0.18, ... },
      { label: "1 - 3 Years (Medium Notes)", pct: 0.32, amount: totalDebt * 0.32, ... },
      { label: "3 - 5 Years (Syndicate Facilities)", pct: 0.28, amount: totalDebt * 0.28, ... },
      { label: "> 5 Years (Institutional Bonds)", pct: 0.22, amount: totalDebt * 0.22, ... },
    ];
    ```
  - **Origin of figures:** Pure mathematical proxy ($18\%, 32\%, 28\%, 22\%$) multiplied by `totalDebt`.
  - **Status:** Relabeled in Phase 8 as "Demonstration / Illustrative".
  - **Phase 9 Requirement:** Support itemized debt tranches with real filing citations and sum-versus-total reconciliation. If unverified against filing in this session, keep explicit "Illustrative, not from filing" label and add missing items to `docs/MANUAL_VERIFICATION_CHECKLIST.md`.

---

## 4. Export & Display Data Flow

1. **CSV Export:**
   - Handled in [`src/components/ICDossier.tsx`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/components/ICDossier.tsx#L266) via `handleExportCsv`. Builds a structured CSV string using reported metrics and ratios.
2. **Excel XML Export (`.xls`):**
   - Handled in [`src/components/ICDossier.tsx`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/components/ICDossier.tsx#L324) via `handleExportExcel`. Generates SpreadsheetML XML with `<Row>` and `<Cell>` elements.
3. **Print Export:**
   - Handled in [`src/components/ICDossier.tsx`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/components/ICDossier.tsx#L550) via `window.print()` rendering 6 A4 slide decks.
4. **IC Memo:**
   - Handled in [`src/components/ICBriefingMemo.tsx`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/components/ICBriefingMemo.tsx). Formats executive markdown summary and computes SHA-256 integrity hash.
5. **Methodology Page:**
   - Handled in [`src/components/MethodologyModal.tsx`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/components/MethodologyModal.tsx). Displays mathematical formulas, standard tolerances, and regulatory standards across tabs.
6. **Vulnerability Monitor:**
   - Handled in [`src/components/VulnerabilityMonitor.tsx`](file:///c:/Users/Rishabh%20Kumar%20Yadav/Documents/FINTRAXIS/src/components/VulnerabilityMonitor.tsx). Displays early warning thresholds, liquidity coverage, and stress indicators.

---

## 5. Execution Strategy

Proceed sequentially through Sections 2 through 10 of Phase 9 without destructive operations:
- Step 2: Implement Promoter Share Pledging (`financialCalculations.ts`, schema, UI, glossary).
- Step 3: Implement Working Capital Indicative Drawing Power (`financialCalculations.ts`, UI, glossary).
- Step 4: Implement Contingent Liabilities to Tangible Net Worth (`financialCalculations.ts`, UI, glossary).
- Step 5: Implement Sourced Debt Structure & Reconciliation.
- Step 6: Safe, optional SEC EDGAR search architecture with User-Agent and timeout controls.
- Step 7: Wire up exports, IC Memo, Methodology, tooltips, and source badges.
- Step 8: Author `docs/DEFENSE_AND_ARCHITECTURE.md` and `docs/MANUAL_VERIFICATION_CHECKLIST.md`.
- Step 9: Author comprehensive `tests/phase9Metrics.test.ts` and verify.
- Step 10: Run full test suite, lint, and build.
