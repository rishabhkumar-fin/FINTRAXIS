# FINTRAXIS Methodology & Quantitative Specification (v2.0.0-PRO)

This document provides the mathematical specifications, accounting identities, tolerance thresholds, credit appraisal models, and stress testing engines implemented across the FINTRAXIS terminal.

---

## 1. Accounting Identities & Mathematical Integrity

### 1.1 Balance Sheet Identity Audit
Every balance sheet disclosure is evaluated against the foundational double-entry identity:
$$\text{Total Assets} = \text{Total Liabilities} + \text{Total Shareholders' Equity}$$

- **Documented Tolerance:** $\pm 0.01\%$ (0.0001 relative variance).
- **Enforcement Rule:** If the absolute difference between reported $\text{Total Assets}$ and $(\text{Total Liabilities} + \text{Shareholders' Equity})$ exceeds $0.01\%$, the workstation renders a prominent **BALANCE SHEET IMBALANCE** flag detailing the exact discrepancy. No silent balancing or fabricated plugs are permitted.

---

## 2. Quantitative Solvency & Gearing Metrics

### 2.1 Net Funded Indebtedness
$$\text{Net Debt} = \text{Total Debt} - (\text{Cash \& Cash Equivalents} + \text{Marketable Securities})$$

- **Ind AS 116 / ASC 842 Lease Decomposition:** Total debt disclosed on primary balance sheets often combines bank borrowings with capitalized lease liabilities (Right-of-Use leases).
  $$\text{Effective Funded Debt} = \text{Bank / Market Borrowings}$$
  $$\text{Lease Obligations} = \text{Total Balance Sheet Debt} - \text{Funded Borrowings}$$
- **Negative Net Debt Rule:** If liquid cash reserves exceed total debt ($\text{Net Debt} \le 0$), the entity is designated as holding a **Net Cash Surplus** (e.g. `TCS.NS` with ₹9,329 Cr net cash). FINTRAXIS displays the exact negative multiple (e.g. `-0.62x (Net Cash)`), never rounding or suppressing the value to `0.00x`.

### 2.2 Net Debt / EBITDA (Consortium Leverage Multiple)
$$\text{Leverage Multiple} = \frac{\text{Net Debt}}{\text{EBITDA}}$$
- **Institutional Reference Standard:** $\le 3.50\text{x}$.
- **Mathematical Edge Cases:**
  - $\text{Net Debt} \le 0$: Displayed as `${multiple}x (Net Cash position)`.
  - $\text{EBITDA} \le 0$: Labeled as `N/D (Negative Operating Base)`.

### 2.3 EBIT Interest Coverage
$$\text{Interest Coverage} = \frac{\text{Operating Profit (EBIT)}}{\text{Gross Finance Costs / Interest Expense}}$$
- **Institutional Benchmark:** Floor $\ge 2.50\text{x}$; Prime $\ge 4.00\text{x}$.
- **Edge Cases & Disclosures:**
  - If $\text{Interest Expense} = 0$: Displayed as `Not applicable: no interest cost (debt-free)`.
  - If an entity reports ₹0 bank borrowings but has finance charges (e.g. ₹812 Cr in TCS), the system explicitly annotates: *"Finance costs relate to Ind AS 116 lease liabilities, not bank debt service."*

### 2.4 Working Capital & Current Ratio
$$\text{Current Ratio} = \frac{\text{Total Current Assets}}{\text{Total Current Liabilities}}$$
- **Institutional Benchmark:** $\ge 1.33\text{x}$ (Traditional Indian Banking norm) / $\ge 1.10\text{x}$ (Modern Corporate floor).
- **Acid Test / Quick Ratio:**
  $$\text{Quick Ratio} = \frac{\text{Cash} + \text{Marketable Securities} + \text{Trade Receivables}}{\text{Total Current Liabilities}}$$

---

## 3. Indian Commercial Credit Appraisal (Wholesale Banking)

### 3.1 Total Outside Liabilities / Tangible Net Worth (TOL / TNW)
$$\text{TOL / TNW} = \frac{\text{Total Current Liabilities} + \text{Total Non-Current Liabilities}}{\text{Shareholders' Equity} - \text{Intangible Assets} - \text{Capitalized R\&D}}$$
- **Appraisal Hurdle:** $\le 3.00\text{x}$ reference screening benchmark.
- **Regulatory Note:** 3.00x is widely utilized as an Indian bank appraisal rule-of-thumb rather than an active statutory RBI regulation. Intangibles and goodwill must be deducted from equity to measure tangible equity protection.

### 3.2 Drawing Power (DP - Bank Working Capital Appraisal)
$$\text{Paid Inventory} = \text{Inventory} - \text{Trade Payables}$$
$$\text{Drawing Power} = (\text{Eligible Receivables } (<90\text{ days}) \times (1 - M_{\text{debtors}})) + (\text{Paid Inventory} \times (1 - M_{\text{stock}}))$$
- **Standard Bank Margins:** $M_{\text{stock}} = 25\%$, $M_{\text{debtors}} = 30\% - 40\%$.
- **Disclaimer:** Labeled *"Indicative, annual-statement basis, not a bank-sanctioned DP"* since actual bank sanction relies on monthly borrower stock/debtor declarations.

### 3.3 Promoter Share Pledging Risk
$$\text{Promoter Pledge \%} = \frac{\text{Number of Promoter Shares Pledged}}{\text{Total Shares Held by Promoter Group}} \times 100$$
- **Regulatory Sourcing:** Sourced from quarterly SEBI shareholding pattern filings under SEBI (LODR) Regulation 31.
- **Hurdles:** $< 10\%$ Low; $10\%–30\%$ Watchlist; $> 30\%$ Elevated margin call risk; $> 50\%$ Critical distress risk.
- **US / Dispersed Ownership Exception:** Marked `Not Applicable` for companies without a disclosed controlling promoter group (e.g. Apple Inc.).

---

## 4. Insolvency & Earnings Quality Diagnostics

### 4.1 Altman Z-Score & Z''-Score
- **1968 Manufacturing Model (Public US Entities):**
  $$Z = 1.2 X_1 + 1.4 X_2 + 3.3 X_3 + 0.6 X_4 + 0.999 X_5$$
  Safe $> 2.99$, Grey $1.81–2.99$, Distress $< 1.81$.
- **Z''-Score (Emerging Markets & Non-Manufacturing Corporates):**
  $$Z'' = 6.56 X_1 + 3.26 X_2 + 6.72 X_3 + 1.05 X_4$$
  Safe $> 2.60$, Grey $1.10–2.60$, Distress $< 1.10$.
  *Exemption:* Excluded for banking and financial entities.

### 4.2 Beneish M-Score (Earnings Manipulation Detection)
Evaluated across 8 accounting sub-indices comparing two consecutive audited annual periods:
$$M = -4.84 + 0.920 \cdot \text{DSRI} + 0.528 \cdot \text{GMI} + 0.404 \cdot \text{AQI} + 0.892 \cdot \text{SGI} + 0.115 \cdot \text{DEPI} - 0.172 \cdot \text{SGAI} + 4.037 \cdot \text{TATA} + 0.0327 \cdot \text{LVGI}$$
- **Threshold:** $M > -1.78$ indicates elevated probability of earnings manipulation.

---

## 5. Deterministic Scenario Stress Engine

### 5.1 Operating Leverage & Variable Cost Decomposition
$$\text{Total Operating Costs (OC)} = \text{Revenue} - \text{EBIT}$$
$$\text{Variable Costs (VC)} = \text{OC} \times v, \quad \text{Fixed Costs (FC)} = \text{OC} \times (1 - v)$$
- Variable cost share $v \in [0, 1]$ defaults by sector: Technology $35\%$, Manufacturing $65\%$, Retail $75\%$, Telecom/Infrastructure $30\%$, Energy $70\%$.

### 5.2 Top-Line & Cost Inflation Shocks
$$\text{Revenue}' = \text{Revenue} \times (1 + s), \quad s \in [-50\%, +20\%]$$
$$\text{VariableCosts}' = \text{VariableCosts} \times (1 + s) \times (1 + c), \quad c \in [0\%, 30\%]$$
$$\text{FixedCosts}' = \text{FixedCosts} \times (1 + c)$$
$$\text{Stressed EBIT}' = \text{Revenue}' - \text{VariableCosts}' - \text{FixedCosts}'$$

### 5.3 Mathematical EBIT Waterfall Bridge
The visual EBIT bridge reconciles exactly to $\text{Stressed EBIT}'$:
$$\text{Stressed EBIT}' = \text{Baseline EBIT} + (\text{Revenue} \cdot s) - (\text{VC} \cdot s) - [\text{VC} \cdot (1+s) \cdot c] - (\text{FC} \cdot c)$$
- **Revenue Shock Impact:** $\text{Revenue} \times s$ (loss if $s < 0$).
- **Variable Cost Relief:** $-\text{VC} \times s$ (positive volume relief if $s < 0$).
- **Variable Cost Inflation:** $-\text{VC} \times (1+s) \times c$ (cost headwind).
- **Fixed Cost Inflation:** $-\text{FC} \times c$ (overhead headwind).
- **Identity Check:** $\text{Sum of bridge steps} = \text{Stressed EBIT} \quad (\pm 0.00\text{ exact})$.

### 5.4 Floating-Rate Debt Shock
$$\text{Incremental Interest} = (\text{Total Debt} \times f) \times \left(\frac{\Delta r\text{ bps}}{10,000}\right)$$
$$\text{Stressed Interest}' = \text{Base Interest} + \text{Incremental Interest}$$
$$\text{Stressed Interest Coverage}' = \frac{\text{Stressed EBIT}'}{\text{Stressed Interest}'}$$

### 5.5 Threshold Breach Wording Standard
When stressed metrics breach reference hurdles, the application displays:
> *"Reference threshold breached in this scenario. This is a what-if calculation, not a prediction."*
> No statement of contractual loan default or covenant breach is asserted unless bilateral loan indenture agreements are formally loaded.
