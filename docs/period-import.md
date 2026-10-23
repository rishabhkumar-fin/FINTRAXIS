# FINTRAXIS Reporting Period Import Guide

This document defines the audited reporting period ingestion specification for FINTRAXIS. Administrators and credit analysts can import newly filed fiscal years (e.g., FY2025, FY2026) via manual form entry, CSV batch upload, or JSON ingestion.

---

## 1. Supported Formats & Template Files

Downloadable templates are located in the repository and served at:
- **CSV Template:** `/public/templates/period_import_template.csv`
- **JSON Template:** `/public/templates/period_import_template.json`

---

## 2. Mandatory Identification & Regulatory Metadata

Every reporting period record requires verified statutory provenance:

| Field | Type | Description | Permitted Values / Examples |
| :--- | :--- | :--- | :--- |
| `ticker` | String | Security ticker symbol | `TCS.NS`, `AAPL`, `RELIANCE.NS` |
| `fiscal_year` | String | Fiscal period identifier | `FY2025`, `FY2026` |
| `period_end` | ISO Date | Fiscal period closing date | `2025-03-31`, `2025-09-30` |
| `basis` | Enum | Accounting consolidation | `consolidated`, `standalone` |
| `framework` | Enum | Statutory framework | `Ind AS`, `US-GAAP`, `IFRS` |
| `currency` | Enum | ISO Currency code | `INR`, `USD`, `EUR`, `GBP`, `JPY` |
| `scale_unit` | Enum | Statement scaling denomination | `Crores`, `Millions`, `Lakhs`, `Billions` |
| `source_name` | String | Regulatory archive or agency | `BSE / NSE Annual Filing`, `SEC Form 10-K` |
| `source_url` | URL | Link to primary regulatory filing | `https://www.bseindia.com/...` |
| `filing_date` | ISO Date | Official filing release date | `2025-05-15` |
| `retrieval_date`| ISO Date | Data ingestion date | `2025-05-20` |
| `status` | Enum | Data provenance certification | `reported (user-entered from filing)`, `provider-normalised`, `reference (unverified)` |

> [!IMPORTANT]
> A record is **never** designated as "Audited" unless certified by an administrative operator with the primary statutory filing attached.

---

## 3. Financial Statement Fields

### Income Statement
- `revenue_from_operations`: Top-line turnover excluding other non-operating income.
- `other_income`: Treasury income, dividends, foreign exchange gains.
- `operating_costs`: Total OpEx including raw materials, manufacturing, SG&A.
- `employee_cost`: Personnel and staff welfare expense.
- `depreciation_amortization`: Non-cash D&A reported in P&L.
- `finance_cost`: Gross contractual interest and lease finance charges.
- `ebit`: Operating profit before finance cost and taxation.
- `ebitda`: EBIT plus Depreciation and Amortization.
- `profit_before_tax`: Earnings before tax deduction.
- `tax_expense`: Current and deferred taxation.
- `net_income`: Profit after tax (PAT).

### Balance Sheet
- `cash_and_equivalents`: Cash at bank and short-term liquid deposits.
- `other_liquid_investments`: Marketable securities and treasury bills.
- `current_assets`: Total current assets.
- `current_liabilities`: Total short-term obligations.
- `borrowings_current`: Short-term bank borrowings and commercial paper.
- `borrowings_non_current`: Long-term funded debt and term loans.
- `total_debt`: Funded borrowings (short + long term).
- `lease_liabilities`: Right-of-use lease liabilities under Ind AS 116 / ASC 842.
- `total_assets`: Total balance sheet assets.
- `total_liabilities`: Total balance sheet obligations.
- `total_equity`: Share capital plus reserves and surplus.

### Cash Flow
- `operating_cash_flow`: Cash generated from operations (CFO).
- `capex`: Capital expenditure on PPE and intangibles.
- `free_cash_flow`: CFO minus Capex.

---

## 4. Mathematical Validation Rules (Blocking vs Warning)

1. **Balance Sheet Identity (Strict Blocking):**
   $$\text{Assets} = \text{Liabilities} + \text{Equity}$$
   Total Assets must equal Total Liabilities + Equity within 0.5% tolerance. Mismatches block ingestion and display the exact discrepancy.
2. **EBITDA Consistency (Strict Blocking):**
   $$\text{EBITDA} = \text{EBIT} + \text{D\&A}$$
   If both EBIT and D&A are entered, EBITDA must match within 1%.
3. **Sign Constraints (Strict Blocking):**
   Revenue $\ge 0$, Total Assets $\ge 0$, Cash $\ge 0$.
4. **Year-over-Year Volatility Check (Warning):**
   Any top-line revenue or debt increase exceeding $+50\%$ triggers an administrative confirmation dialog.
5. **Idempotent Upsert (Safe Database Replacement):**
   Importing an existing (company, year, basis) replaces the record within a safe WAL transaction and logs an audit trail event.

---

## 5. Downstream System Recomputations

Once a reporting period is successfully committed:
- **Financial Ratios:** Leverage, coverage, liquidity, and margins update immediately.
- **Credit Health Score:** Graded 0–100 score re-evaluates dynamically.
- **Vulnerability Triggers:** Red flags, breach alerts, and debt maturity schedules update.
- **Stress Simulator Baseline:** Scenario models anchor on the newly ingested fiscal year.
- **Exports & Copilot:** Tearsheets, memos, CSV/PDF files, and AI context read the new numbers.
