# FINTRAXIS Methodology & Quantitative Specification (v1.0.0)

This document provides the mathematical specifications, accounting identities, tolerance thresholds, and stress testing models implemented in the FINTRAXIS platform.

---

## 1. Accounting Identities & Audit Checks

### 1.1 Balance Sheet Accounting Identity
Every balance sheet disclosure is evaluated against double-entry accounting identity:
$$\text{Total Assets} = \text{Total Liabilities} + \text{Shareholders' Equity}$$

- **Documented Tolerance:** $\pm 0.01\%$ (0.0001).
- **Rule:** If the discrepancy between $\text{Total Assets}$ and $(\text{Total Liabilities} + \text{Shareholders' Equity})$ exceeds $0.01\%$, an **IMBALANCE WARNING** is rendered with the exact deviation. Figures are displayed strictly as reported without silent adjustments.

---

## 2. Quantitative Solvency & Liquidity Ratios

### 2.1 Net Funded Debt
$$\text{Net Debt} = \text{Total Funded Debt} - (\text{Cash} + \text{Cash Equivalents} + \text{Marketable Securities})$$
- When $\text{Net Debt} \le 0$, the entity is designated as **Net-Cash Positive (Fortress Balance Sheet)**.

### 2.2 Working Capital & Current Ratio
$$\text{Working Capital} = \text{Current Assets} - \text{Current Liabilities}$$
$$\text{Current Ratio} = \frac{\text{Current Assets}}{\text{Current Liabilities}}$$
- **Analytical Benchmark:** $\ge 1.30\text{x}$.
- **Edge Case:** If $\text{Current Liabilities} = 0$, the ratio is marked **NOT COMPUTABLE (ZERO DENOMINATOR)**.

### 2.3 Net Debt / EBITDA (Leverage Hurdle)
$$\text{Leverage Multiple} = \frac{\text{Net Debt}}{\text{EBITDA}}$$
- **Analytical Benchmark:** $\le 3.50\text{x}$.
- **Edge Cases:**
  - If $\text{Net Debt} \le 0$: Evaluated as $0.00\text{x}$ (Compliant / Net-Cash Buffer).
  - If $\text{EBITDA} \le 0$: Marked **NOT COMPUTABLE (NEGATIVE BASE)**.

### 2.4 EBIT Interest Coverage
$$\text{Interest Coverage} = \frac{\text{Operating Profit (EBIT)}}{\text{Gross Interest Expense}}$$
- **Analytical Benchmark:** $\ge 2.50\text{x}$.
- **Edge Case:** If $\text{Interest Expense} = 0$, marked **NOT COMPUTABLE (ZERO INTEREST DRAW)**.

### 2.5 Free Cash Flow (FCF)
$$\text{FCF} = \text{Cash Flow from Operations (CFO)} - |\text{Capital Expenditures (CapEx)}|$$

---

## 3. Macro Stress Simulator & Transmission Logic

### 3.1 Topline Contraction
$$\text{Stressed Revenue} = \text{Baseline Revenue} \times (1 + \Delta_{\text{Rev}}\%)$$

### 3.2 Operating Cost Inflation
$$\text{Stressed COGS} = \text{Baseline COGS} \times (1 + \Delta_{\text{COGS}}\%)$$
$$\text{Stressed EBIT} = \text{Stressed Revenue} - \text{Stressed COGS} - \text{Baseline OpEx}$$

### 3.3 Monetary Policy Transmission (Rate Shock)
Central bank policy rate increases (e.g. RBI Repo Rate or US Fed Funds) are transmitted across floating-rate obligations:
$$\Delta_{\text{Interest}} = \text{Total Funded Debt} \times \text{Floating Debt Proportion} \times \left(\frac{\Delta_{\text{Rate}}\text{ bps}}{10,000}\right)$$
$$\text{Stressed Interest Expense} = \text{Baseline Interest} + \Delta_{\text{Interest}}$$

### 3.4 Breach Wording
When stressed coverage falls below $2.50\text{x}$:
- **Required Display:** *"Reference threshold breached in this scenario (< 2.50x)"*.
- **Data Honesty Standard:** Never described as a certainty, a forecast, or a confirmed contractual breach.

---

## 4. Benchmark Versioning
- **Current Model Version:** `v1.0.0-PRO-CREDIT`
- **Default Reference Hurdles:**
  - Net Debt / EBITDA: $3.50\text{x}$
  - Interest Coverage Floor: $2.50\text{x}$
  - Current Ratio Floor: $1.30\text{x}$
  - Balance Sheet Tolerance: $0.01\%$
