# FINTRAXIS Data Sources & Coverage Evaluation (Phase 1)

## 1. Provider Evaluation & Architecture Decision

FINTRAXIS implements a decoupled `DataProvider` interface with adapters to guarantee provider independence, data honesty, and resilient failover.

### Data Provider Assessment

| Provider | Purpose | Status / Tier | Rate Limits & Constraints | Terms & Licensing Note |
|---|---|---|---|---|
| **Yahoo Finance (Open Web API)** | Quotes, Historical OHLCV, Multi-period financial statements | NON_CONTRACTUAL (Default Active Adapter) | ~2000 req/hour, 250ms spacing enforced in adapter | Unofficial open endpoints. Must be displayed as **DELAYED / EOD** with explicit retrieval timestamps. Non-contractual; subject to format changes without notice. |
| **SEC EDGAR API** | US Regulatory Filings & XBRL Facts (10-K, 10-Q) | OFFICIAL_REGULATORY (Phase 2 Target) | Strict 10 requests/second limit. Requires descriptive User-Agent (`AdminContact@domain.com`). | Public domain US federal government repository. Unrestricted for public use with compliant User-Agent header. |
| **BSE / NSE / MCA (India)** | Indian Disclosures & Audited Annual Reports | REGULATORY_RESTRICTED | No public open REST API without paid licensed exchange feeds (e.g. NSE Data & Analytics / BSE Real-time). | Automated direct web scraping violates portal terms. Normalized statements are sourced via verified provider or direct user-supplied audited annual PDF uploads. |
| **TDnet / EDINET (Japan)** | Japanese Securities (Yuho filings) | OFFICIAL_REGULATORY | Periodic disclosure cycles, Japanese XBRL taxonomy. | Open access via FSA EDINET API; normalized provider feed used for core metrics. |
| **Manual / CSV Audit Import** | Institutional User Audited Entries | USER_SUPPLIED | None (local SQLite ingestion) | Explicitly marked as **USER_SUPPLIED** with hash and verification audit trail. |

---

## 2. Seed Ticker Coverage Matrix (Discovery Targets)

Each seeded security is evaluated against obtainable datasets. Per Rule 3.2, missing values are never fabricated or defaulted to zero; they display as **"Unavailable from current source"**.

| Ticker | Entity Name | Exchange / Country | Price & Quotes | Price History (OHLCV) | 3-Statement Multi-Period Financials | Statutory Filings & XBRL |
|---|---|---|---|---|---|---|
| **AAPL** | Apple Inc. | NASDAQ (USA) | Available (Delayed 15m) | Available (1D to 5Y) | Available (4 Fiscal Years) | Available via SEC EDGAR (10-K / 10-Q XBRL) |
| **MSFT** | Microsoft Corp. | NASDAQ (USA) | Available (Delayed 15m) | Available (1D to 5Y) | Available (4 Fiscal Years) | Available via SEC EDGAR (10-K / 10-Q XBRL) |
| **NVDA** | NVIDIA Corp. | NASDAQ (USA) | Available (Delayed 15m) | Available (1D to 5Y) | Available (4 Fiscal Years) | Available via SEC EDGAR (10-K / 10-Q XBRL) |
| **HAL.NS** | Hindustan Aeronautics Ltd. | NSE (IND) | Available (Delayed 15m) | Available (1D to 5Y) | Available (Normalized 4 Fiscal Years in INR Crores) | BSE/NSE Statutory Annual Report Link |
| **RELIANCE.NS**| Reliance Industries Ltd. | NSE (IND) | Available (Delayed 15m) | Available (1D to 5Y) | Available (Normalized 4 Fiscal Years in INR Crores) | BSE/NSE Statutory Annual Report Link |
| **TCS.NS** | Tata Consultancy Services | NSE (IND) | Available (Delayed 15m) | Available (1D to 5Y) | Available (Normalized 4 Fiscal Years in INR Crores) | BSE/NSE Statutory Annual Report Link |
| **SBIN.NS** | State Bank of India | NSE (IND) | Available (Delayed 15m) | Available (1D to 5Y) | Available (Banking format requires specialized NII/NPA ledger) | BSE/NSE Statutory Annual Report Link |
| **7203.T** | Toyota Motor Corp. | TSE (JPN) | Available (Delayed 20m, JPY) | Available (1D to 5Y) | Available (Normalized 4 Fiscal Years in JPY Billions) | FSA EDINET Yuho Report Link |

---

## 3. Data Honesty Rules Enforced
1. **Zero Fabrication:** If an accounting item (e.g., Short-term Debt or Free Cash Flow) is not disclosed in the provider's statement, it is stored as `null`, never guessed using revenue multipliers.
2. **Provenance Tagging:** Every record carries `sourceKind` (`REPORTED`, `PROVIDER_NORMALIZED`, `DERIVED_CALCULATION`, `ANALYST_ASSUMPTION`), `providerName`, and `retrievalTimestamp`.
3. **Data Freshness:** Real-time labels are reserved exclusively for live WebSocket/direct feeds; all market data is labelled **DELAYED** or **END_OF_DAY** with the observed quote timestamp.
