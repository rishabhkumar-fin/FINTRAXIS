# FINTRAXIS — Hand-Computed Test Fixtures & Mathematical Reconciliation

*Notice: All values in this document are synthetic test fixtures designed to verify algorithm arithmetic, edge cases, and rounding precision. They do NOT represent real company figures.*

---

## Fixture 1: Indicative Drawing Power (Normal Case & Floored Stock)

### Scenario A: Normal Solvency Case (Positive Paid Stock)
- **Inputs (Test Fixture A):**
  - Inventory: $500.00$
  - Trade Creditors (Accounts Payable): $200.00$
  - Eligible Receivables ($< 90$ days): $300.00$
  - Inventory Margin ($M_{\text{inv}}$): $25\%$ ($0.25$)
  - Receivables Margin ($M_{\text{rec}}$): $40\%$ ($0.40$)
  - Working Capital Borrowings: $250.00$
- **Step-by-Step Hand Calculation:**
  1. $\text{Unfloored Paid Stock} = \text{Inventory} - \text{Trade Creditors} = 500.00 - 200.00 = 300.00$
  2. $\text{Floored Paid Stock} = \max(0, 300.00) = 300.00$
  3. $\text{Stock Contribution} = 300.00 \times (1 - 0.25) = 300.00 \times 0.75 = 225.00$
  4. $\text{Receivables Contribution} = 300.00 \times (1 - 0.40) = 300.00 \times 0.60 = 180.00$
  5. $\text{Indicative Drawing Power} = 225.00 + 180.00 = 405.00$
  6. $\text{Borrowings Utilization} = \frac{250.00}{405.00} \times 100 = 61.73\% \approx 61.7\%$
- **Expected Algorithm Output:**
  - `status`: `"VALID"`
  - `unflooredPaidStock`: `300.00`
  - `flooredPaidStock`: `300.00`
  - `stockContribution`: `225.00`
  - `receivablesContribution`: `180.00`
  - `value`: `405.00`
  - `utilizationPct`: `61.7`

### Scenario B: Negative Paid Stock Case (Creditors Exceed Inventory)
- **Inputs (Test Fixture B):**
  - Inventory: $150.00$
  - Trade Creditors (Accounts Payable): $250.00$
  - Eligible Receivables ($< 90$ days): $400.00$
  - Inventory Margin ($M_{\text{inv}}$): $25\%$
  - Receivables Margin ($M_{\text{rec}}$): $40\%$
- **Step-by-Step Hand Calculation:**
  1. $\text{Unfloored Paid Stock} = 150.00 - 250.00 = -100.00$
  2. $\text{Floored Paid Stock} = \max(0, -100.00) = 0.00$
  3. $\text{Stock Contribution} = 0.00 \times 0.75 = 0.00$
  4. $\text{Receivables Contribution} = 400.00 \times (1 - 0.40) = 240.00$
  5. $\text{Indicative Drawing Power} = 0.00 + 240.00 = 240.00$
- **Expected Algorithm Output:**
  - `status`: `"VALID"`
  - `unflooredPaidStock`: `-100.00`
  - `flooredPaidStock`: `0.00`
  - `stockContribution`: `0.00`
  - `receivablesContribution`: `240.00`
  - `value`: `240.00`

---

## Fixture 2: Debt Tranche Reconciliation (Variance Decomposition)

### Scenario A: Fully Reconciled Tranche Set
- **Inputs (Test Fixture C):**
  - Tranche 1: $1.250\%$ Senior Notes due 2026 = $1,500.00$
  - Tranche 2: $2.100\%$ Senior Notes due 2028 = $2,500.00$
  - Tranche 3: $3.000\%$ Institutional Bonds due 2031 = $4,000.00$
  - Disclosed Total Debt on Balance Sheet = $8,000.00$
- **Step-by-Step Hand Calculation:**
  1. $\sum \text{Principal Tranches} = 1,500.00 + 2,500.00 + 4,000.00 = 8,000.00$
  2. $\text{Variance} = 8,000.00 - 8,000.00 = 0.00$
  3. $\text{Variance } \% = 0.00\%$ ($\le 0.5\%$ tolerance)
- **Expected Algorithm Output:**
  - `isReconciled`: `true`
  - `status`: `"RECONCILED"`
  - `difference`: `0.00`
  - `totalPrincipalSum`: `8,000.00`

### Scenario B: Variance Explained (Unamortized Discount & Leases)
- **Inputs (Test Fixture D):**
  - Tranches Sum = $7,850.00$
  - Disclosed Total Debt on Balance Sheet = $8,000.00$
- **Step-by-Step Hand Calculation:**
  1. $\sum \text{Principal Tranches} = 7,850.00$
  2. $\text{Variance} = 8,000.00 - 7,850.00 = 150.00$
  3. $\text{Variance } \% = \frac{150.00}{8,000.00} \times 100 = 1.875\% \approx 1.88\%$
- **Expected Algorithm Output:**
  - `isReconciled`: `false`
  - `status`: `"VARIANCE_EXPLAINED"`
  - `difference`: `150.00`
  - `differencePct`: `1.88`
