# FINTRAXIS — Manual Verification Checklist

*Date: October 22, 2026*  
*Standard: Zero Unverified Claims. Every figure stored in the terminal without an independent session reading is catalogued below.*

---

## 1. Statutory Disclosure Checklist

| Entity | Metric / Figure | Disclosure Form | Section / Note to Read | Stored Value in SQLite | Verification Status | Primary Source Link |
|---|---|---|---|---|---|---|
| **Reliance Industries (RELIANCE.NS)** | Promoter Holding % | SEBI (LODR) Reg. 31 Quarterly Filing | Table I: Summary Statement of Promoter & Promoter Group Shareholding | `N/D` | Not independently verified | [BSE Shareholding Pattern (500325)](https://www.bseindia.com/corporates/shpSecurities.aspx?scripcd=500325) |
| **Reliance Industries (RELIANCE.NS)** | Promoter Pledged Shares % of Holding | SEBI (LODR) Reg. 31 Quarterly Filing | Table II: Shares pledged or otherwise encumbered | `N/D` | Not independently verified | [BSE Shareholding Pattern (500325)](https://www.bseindia.com/corporates/shpSecurities.aspx?scripcd=500325) |
| **Reliance Industries (RELIANCE.NS)** | Trade Receivables Ageing (&lt; 90 Days) | Annual Report FY2024 (Ind-AS) | Note on Financial Assets: Trade Receivables Ageing Schedule | `N/D` | Not independently verified | [BSE Annual Report Filing](https://www.bseindia.com/stock-share-price/reliance-industries-ltd/reliance/500325/) |
| **Reliance Industries (RELIANCE.NS)** | Contingent Liabilities (Tax + Guarantees) | Annual Report FY2024 (Ind-AS) | Note on Contingent Liabilities & Commitments (Ind-AS 37) | `N/D` | Not independently verified | [BSE Annual Report Filing](https://www.bseindia.com/stock-share-price/reliance-industries-ltd/reliance/500325/) |
| **Reliance Industries (RELIANCE.NS)** | Debt Tranches & Repayment Schedule | Annual Report FY2024 (Ind-AS) | Note on Non-Current Borrowings (NCDs, Rupee Loans, ECBs) | `Illustrative, not from filing` | Demonstration / Seed data | [BSE Annual Report Filing](https://www.bseindia.com/stock-share-price/reliance-industries-ltd/reliance/500325/) |
| **Apple Inc. (AAPL)** | Promoter Group Shareholding | SEC Form 10-K & DEF 14A (Proxy) | Security Ownership of Certain Beneficial Owners | `NOT_APPLICABLE` | Structural check: No controlling promoter group | [SEC EDGAR CIK 0000320193](https://www.sec.gov/edgar/browse/?CIK=0000320193) |
| **Apple Inc. (AAPL)** | Trade Receivables Ageing (&lt; 90 Days) | SEC Form 10-K (US-GAAP) | Consolidated Balance Sheets & Note 1 | `N/D` | Unavailable: US-GAAP does not mandate 90-day aging on face | [SEC EDGAR Form 10-K](https://www.sec.gov/edgar/browse/?CIK=0000320193) |
| **Apple Inc. (AAPL)** | Itemized Term Debt Indentures | SEC Form 10-K (US-GAAP) | Term Debt Note (Notes to Consolidated Financial Statements) | `Illustrative, not from filing` | Demonstration / Seed data | [SEC EDGAR Form 10-K](https://www.sec.gov/edgar/browse/?CIK=0000320193) |
| **Apple Inc. (AAPL)** | Contingent Commitments & Legal Claims | SEC Form 10-K (US-GAAP) | Commitments and Contingencies Note (ASC 450) | `N/D` | Not independently verified | [SEC EDGAR Form 10-K](https://www.sec.gov/edgar/browse/?CIK=0000320193) |

---

## 2. Instructions for the Analyst Before Viva or Boardroom Presentation

1. **Promoter Pledge Check:**
   - Open the BSE link above for Reliance Industries.
   - Look under **Table II (Promoter & Promoter Group)** $\rightarrow$ Column **"Number of equity shares held in dematerialized form"** and **"Shares pledged or otherwise encumbered"**.
   - Note the percentage for the latest quarter (historically $0.00\%$ unencumbered).
   - Only when you have read that filing cell should you update the SQLite record to `VERIFIED_BY_AGENT`.
2. **Receivables Ageing Check:**
   - Download the Reliance Industries standalone and consolidated Annual Report PDF.
   - Search for "Trade Receivables ageing schedule" under Balance Sheet Notes (mandated by Schedule III amendments).
   - Sum the column: **"Undisputed Trade Receivables — considered good: Less than 6 months"**.
3. **Debt Indenture Notes Check:**
   - In Apple Inc.'s latest 10-K, locate the **Term Debt** note.
   - Check the outstanding principal for each tranche (e.g. Fixed Rate Notes maturing across 2026-2051).
   - Confirm that the sum of principal matches reported Long-Term Debt plus current portion, minus unamortized discounts.
