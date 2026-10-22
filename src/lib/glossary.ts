/**
 * FINTRAXIS Institutional Financial Glossary
 * Unified knowledge base of financial ratios, credit appraisal standards,
 * mathematical formulas, institutional rules of thumb, and analytical pitfalls.
 */

export interface GlossaryTerm {
  id: string;
  name: string;
  category: "LEVERAGE" | "LIQUIDITY" | "PROFITABILITY" | "CREDIT_RISK" | "INDIAN_APPRAISAL" | "ACCOUNTING" | "MACRO_STRESS";
  formula?: string;
  plainEnglishSummary: string;
  examinerExplanation: string;
  benchmarkRuleOfThumb: string;
  pitfallsAndCaveats: string;
  xbrlOrFilingSource?: string;
  relatedTerms?: string[];
}

export const FINANCIAL_GLOSSARY: GlossaryTerm[] = [
  {
    id: "net-debt",
    name: "Net Debt",
    category: "LEVERAGE",
    formula: "Total Debt (Short + Long Term) − Cash & Cash Equivalents − Marketable Securities",
    plainEnglishSummary: "How much debt would remain if the company used all its bank cash and liquid investments to pay off lenders immediately.",
    examinerExplanation: "A measure of net funded gearing. If cash exceeds debt, Net Debt is negative, representing a 'Net Cash' surplus where the enterprise has zero net funded indebtedness.",
    benchmarkRuleOfThumb: "Net Cash position is safest; Net Debt > 0 indicates leveraged structure.",
    pitfallsAndCaveats: "Ind AS 116 / ASC 842 lease liabilities are often included in total debt on balance sheets even when bank borrowings are zero (e.g. TCS). Always distinguish funded financial borrowings from lease commitments.",
    xbrlOrFilingSource: "Balance Sheet — Current + Non-Current Borrowings less Cash & Cash Equivalents",
    relatedTerms: ["net-debt-ebitda", "lease-liabilities", "cash-ratio"],
  },
  {
    id: "net-debt-ebitda",
    name: "Net Debt / EBITDA",
    category: "LEVERAGE",
    formula: "Net Debt ÷ Operating EBITDA",
    plainEnglishSummary: "How many years of normal operating cash profit it would take to pay off all net debt.",
    examinerExplanation: "The primary leverage metric utilized by commercial bank syndicates, rating agencies (CRISIL, Moody's, S&P), and credit committees.",
    benchmarkRuleOfThumb: "≤ 2.0x Prime; 2.0x–3.5x Acceptable; > 3.5x Elevated leverage; > 4.5x High credit risk.",
    pitfallsAndCaveats: "Fails when EBITDA is negative or near zero. If Net Debt is negative, it must be reported as a Net Cash position, not zero. Does not account for working capital drag.",
    xbrlOrFilingSource: "Computed from Balance Sheet (Net Debt) and Income Statement (EBITDA)",
    relatedTerms: ["net-debt", "interest-coverage", "ebitda"],
  },
  {
    id: "interest-coverage",
    name: "EBIT Interest Coverage",
    category: "CREDIT_RISK",
    formula: "Operating Profit (EBIT) ÷ Gross Interest Expense",
    plainEnglishSummary: "How comfortably operating profit covers the annual interest payments owed to lenders.",
    examinerExplanation: "Assesses immediate debt service headroom. A high coverage ratio indicates that operating earnings can contract substantially before debt service is threatened.",
    benchmarkRuleOfThumb: "≥ 4.0x Excellent buffer; 2.5x–4.0x Investment Grade; < 2.5x Monitored floor; < 1.5x Elevated default risk.",
    pitfallsAndCaveats: "Only covers interest, not principal repayments. If a company has zero debt but pays lease finance charges (Ind AS 116), finance cost exists despite zero bank debt.",
    xbrlOrFilingSource: "Income Statement — Operating Income (EBIT) and Finance Costs",
    relatedTerms: ["dscr", "net-debt-ebitda"],
  },
  {
    id: "current-ratio",
    name: "Current Ratio",
    category: "LIQUIDITY",
    formula: "Total Current Assets ÷ Total Current Liabilities",
    plainEnglishSummary: "Whether the company has enough short-term assets (cash, receivables, stock) to pay bills due within 12 months.",
    examinerExplanation: "Standard short-term liquidity indicator used across global commercial banks and Indian working-capital lending committees.",
    benchmarkRuleOfThumb: "≥ 1.33x Traditional Indian banking norm (Tandon/Nayak); ≥ 1.10x Modern corporate floor; < 1.00x Working capital deficit.",
    pitfallsAndCaveats: "Treats illiquid raw inventory and doubtful slow-moving receivables as equal to cash. Quality of working capital requires checking DSO and receivables ageing.",
    xbrlOrFilingSource: "Balance Sheet — Total Current Assets / Total Current Liabilities",
    relatedTerms: ["quick-ratio", "cash-ratio", "drawing-power"],
  },
  {
    id: "quick-ratio",
    name: "Quick Ratio (Acid Test)",
    category: "LIQUIDITY",
    formula: "(Cash + Marketable Securities + Trade Receivables) ÷ Current Liabilities",
    plainEnglishSummary: "Strict test of whether near-cash assets can cover near-term bills without needing to sell any inventory.",
    examinerExplanation: "Strips inventory and pre-paid expenses from current assets to test immediate liquidity solvency in sudden liquidation scenarios.",
    benchmarkRuleOfThumb: "≥ 1.00x Prime; 0.80x–1.00x Acceptable; < 0.80x Liquidity pressure.",
    pitfallsAndCaveats: "If trade receivables contain overdue or disputed customer balances (>90 days), liquidity is overstated.",
    xbrlOrFilingSource: "Balance Sheet — Cash + Liquid Assets + Receivables",
    relatedTerms: ["current-ratio", "cash-ratio"],
  },
  {
    id: "cash-ratio",
    name: "Cash Ratio",
    category: "LIQUIDITY",
    formula: "(Cash and Cash Equivalents + Short-Term Marketable Securities) ÷ Current Liabilities",
    plainEnglishSummary: "How much cash is sitting in bank accounts relative to bills due this fiscal year.",
    examinerExplanation: "The most conservative liquidity metric, ignoring all customer receivables and warehouse stock.",
    benchmarkRuleOfThumb: "≥ 0.20x–0.50x Considered healthy for non-financial corporates.",
    pitfallsAndCaveats: "Holding excessive non-yielding cash can reduce return on equity (ROE) if not invested productively.",
    xbrlOrFilingSource: "Balance Sheet — Cash & Cash Equivalents / Current Liabilities",
    relatedTerms: ["current-ratio", "quick-ratio"],
  },
  {
    id: "gross-margin",
    name: "Gross Profit Margin",
    category: "PROFITABILITY",
    formula: "((Revenue − COGS) ÷ Revenue) × 100",
    plainEnglishSummary: "Percentage of sales revenue remaining after paying direct factory and production costs.",
    examinerExplanation: "Measures underlying manufacturing/production markup efficiency and direct raw material pass-through ability.",
    benchmarkRuleOfThumb: "Software 60%–85%; Manufacturing 25%–45%; Retail 20%–35%; Refining 8%–15%.",
    pitfallsAndCaveats: "Different accounting standards (US GAAP vs Ind AS) may classify delivery labor or depreciation differently within COGS vs OPEX.",
    xbrlOrFilingSource: "Income Statement — Gross Profit / Total Revenue",
    relatedTerms: ["operating-margin", "net-margin"],
  },
  {
    id: "operating-margin",
    name: "Operating Margin (EBIT Margin)",
    category: "PROFITABILITY",
    formula: "(EBIT ÷ Revenue) × 100",
    plainEnglishSummary: "What percentage of sales turns into operating profit after paying all production and operating overhead expenses.",
    examinerExplanation: "Reflects operating efficiency before capital structure decisions (interest) and taxes. A core driver of enterprise credit strength.",
    benchmarkRuleOfThumb: "≥ 15% Strong pricing power; 8%–15% Average industrial; < 5% Thin margin vulnerable to commodity spikes.",
    pitfallsAndCaveats: "Excludes non-operating income (like treasury interest on cash reserves) and foreign exchange hedging gains.",
    xbrlOrFilingSource: "Income Statement — Operating Income (EBIT) / Total Revenue",
    relatedTerms: ["gross-margin", "net-margin"],
  },
  {
    id: "net-margin",
    name: "Net Profit Margin",
    category: "PROFITABILITY",
    formula: "(Net Income ÷ Revenue) × 100",
    plainEnglishSummary: "The bottom-line percentage of sales that belongs to shareholders after all expenses, interest, and taxes are paid.",
    examinerExplanation: "Bottom-line profitability indicator. Drives equity accretion and retained earnings growth on the balance sheet.",
    benchmarkRuleOfThumb: "Tech 15%–25%; Industrials 6%–12%; Grocery/Retail 2%–4%.",
    pitfallsAndCaveats: "Subject to one-off extraordinary gains, tax credits, and restructuring charges that distort underlying earnings power.",
    xbrlOrFilingSource: "Income Statement — Net Income / Total Revenue",
    relatedTerms: ["operating-margin", "cfo-to-net-income"],
  },
  {
    id: "free-cash-flow",
    name: "Free Cash Flow (FCF)",
    category: "PROFITABILITY",
    formula: "Operating Cash Flow (CFO) − Capital Expenditures (CapEx)",
    plainEnglishSummary: "Real cash generated from operations after paying to maintain and upgrade factories, equipment, and technology.",
    examinerExplanation: "The cash pool available to service principal debt repayments, pay dividends, or execute buybacks without external debt financing.",
    benchmarkRuleOfThumb: "Consistently positive FCF indicates self-funding capacity; negative FCF requires debt or equity market issuance.",
    pitfallsAndCaveats: "Can be cyclically depressed during heavy multi-year industrial capex cycles (e.g. Reliance 5G/Refining rollout).",
    xbrlOrFilingSource: "Cash Flow Statement — Net Cash from Operating Activities less Purchase of Property, Plant & Equipment",
    relatedTerms: ["cfo-to-net-income", "dscr"],
  },
  {
    id: "cfo-to-net-income",
    name: "Earnings Cash Conversion (CFO / NI)",
    category: "ACCOUNTING",
    formula: "Operating Cash Flow ÷ Net Income",
    plainEnglishSummary: "Confirms whether reported accounting net profit is backed by actual cash flowing into company bank accounts.",
    examinerExplanation: "A primary diagnostic for earnings quality and accruals manipulation. A ratio persistently below 0.80x signals aggressive revenue recognition or ballooning receivables.",
    benchmarkRuleOfThumb: "≥ 1.00x High-quality earnings (cash exceeds reported profit); 0.80x–1.00x Normal; < 0.70x Warning flag.",
    pitfallsAndCaveats: "Rapid top-line growth naturally absorbs cash into working capital (inventory & receivables), temporarily depressing conversion.",
    xbrlOrFilingSource: "Cash Flow Statement (CFO) and Income Statement (Net Income)",
    relatedTerms: ["beneish-m", "free-cash-flow"],
  },
  {
    id: "tol-tnw",
    name: "TOL / TNW (Total Outside Liabilities / Tangible Net Worth)",
    category: "INDIAN_APPRAISAL",
    formula: "Total Outside Liabilities (Current + Non-Current) ÷ (Shareholders' Equity − Intangible Assets)",
    plainEnglishSummary: "How many rupees of total outside debt and supplier obligations exist for every rupee of tangible owners' equity.",
    examinerExplanation: "The cornerstone solvency hurdle in Indian commercial bank wholesale credit appraisal and consortium lending.",
    benchmarkRuleOfThumb: "≤ 3.00x Standard Indian commercial banking reference benchmark; ≤ 2.00x Conservative; > 4.00x Severe over-gearing.",
    pitfallsAndCaveats: "Often misstated as an active RBI regulatory ceiling. While widely adopted as a banking rule of thumb, it is an institution-specific credit policy threshold, not a statutory cap. Intangibles and goodwill must be deducted from equity.",
    xbrlOrFilingSource: "Balance Sheet — Total Liabilities less Equity; Tangible Net Worth = Equity less Intangibles",
    relatedTerms: ["tangible-net-worth", "net-debt-ebitda"],
  },
  {
    id: "dscr",
    name: "Debt Service Coverage Ratio (DSCR)",
    category: "CREDIT_RISK",
    formula: "(PAT + Depreciation + Interest) ÷ (Annual Scheduled Principal Repayments + Interest Expense)",
    plainEnglishSummary: "Can the company's operating cash flow cover both loan interest AND required loan principal paydowns this year?",
    examinerExplanation: "Standard project finance and term-loan covenant metric. Unlike simple interest coverage, DSCR measures full debt amortization capacity.",
    benchmarkRuleOfThumb: "≥ 1.50x Comfortable; 1.25x–1.50x Standard bank sanction hurdle; < 1.15x Distress / restructuring alert.",
    pitfallsAndCaveats: "Requires disclosed scheduled debt maturity tranches. When debt maturity notes omit scheduled principal amortization, FINTRAXIS marks DSCR as 'N/D (Missing Scheduled Principal)' rather than fabricating zero debt.",
    xbrlOrFilingSource: "Computed from P&L, Cash Flow, and Footnote Debt Maturity Schedules",
    relatedTerms: ["interest-coverage", "dscr-proxy"],
  },
  {
    id: "dscr-proxy",
    name: "Debt Service Analytical Proxy",
    category: "CREDIT_RISK",
    formula: "(EBITDA − Maintenance CapEx) ÷ (Reported Interest Expense + Short-Term Borrowings)",
    plainEnglishSummary: "A transparent credit analyst proxy used when primary annual reports do not itemize multi-year principal repayments.",
    examinerExplanation: "Treats short-term borrowings as the annual debt repayment burden requiring rollover or operational cash retirement.",
    benchmarkRuleOfThumb: "≥ 1.30x Adequate; < 1.00x Refinancing dependency.",
    pitfallsAndCaveats: "Clearly labeled as an analytical proxy in FINTRAXIS to preserve methodology transparency.",
    xbrlOrFilingSource: "Balance Sheet Short-Term Debt + P&L Interest Expense",
    relatedTerms: ["dscr"],
  },
  {
    id: "altman-z",
    name: "Altman Z-Score (Manufacturing 1968)",
    category: "CREDIT_RISK",
    formula: "1.2·X1 + 1.4·X2 + 3.3·X3 + 0.6·X4 + 0.999·X5",
    plainEnglishSummary: "A classic mathematical formula created by NYU Professor Edward Altman to predict corporate insolvency within 2 years.",
    examinerExplanation: "X1 = Working Capital/Total Assets, X2 = Retained Earnings/Total Assets, X3 = EBIT/Total Assets, X4 = Market Value Equity/Total Liabilities, X5 = Sales/Total Assets.",
    benchmarkRuleOfThumb: "> 2.99 Safe Zone; 1.81–2.99 Grey Zone; < 1.81 Distress Zone (high bankruptcy probability).",
    pitfallsAndCaveats: "Strictly calibrated for public manufacturing companies. Must NOT be applied to banks, NBFCs, or pure software firms without model adjustments.",
    xbrlOrFilingSource: "Formula weights across Balance Sheet, P&L, and Market Capitalization",
    relatedTerms: ["altman-z-double-prime"],
  },
  {
    id: "altman-z-double-prime",
    name: "Altman Z''-Score (Emerging Markets & Non-Manufacturing)",
    category: "CREDIT_RISK",
    formula: "6.56·X1 + 3.26·X2 + 6.72·X3 + 1.05·X4",
    plainEnglishSummary: "Adapted insolvency model for non-manufacturing corporations and emerging market issuers.",
    examinerExplanation: "Removes asset turnover (X5) to avoid penalizing capital-light service firms (like TCS) and substitutes Book Value of Equity in X4.",
    benchmarkRuleOfThumb: "> 2.60 Safe Zone; 1.10–2.60 Grey Zone; < 1.10 Distress Zone.",
    pitfallsAndCaveats: "Not applicable to financial institutions (banks, insurers, NBFCs) due to their unique regulatory capital requirements.",
    xbrlOrFilingSource: "Balance Sheet & P&L ratios without market equity dependence",
    relatedTerms: ["altman-z"],
  },
  {
    id: "beneish-m",
    name: "Beneish M-Score (Earnings Manipulation Diagnostic)",
    category: "ACCOUNTING",
    formula: "8-variable probabilistic regression model (DSRI, GMI, AQI, SGI, DEPI, SGAI, LVGI, TATA)",
    plainEnglishSummary: "A mathematical lie-detector for corporate balance sheets created by Professor Messod Beneish to spot aggressive accounting tricks.",
    examinerExplanation: "Identifies whether revenue acceleration, asset capitalization, or gross margin trends resemble past fraudulent manipulation cases (like Enron).",
    benchmarkRuleOfThumb: "M-Score > -1.78 Indicates elevated probability of earnings manipulation; M-Score ≤ -1.78 Normal reporting.",
    pitfallsAndCaveats: "Requires 2 consecutive comparable fiscal year filings. High growth companies can sometimes show temporary false positives due to surging receivables.",
    xbrlOrFilingSource: "Comparative two-year balance sheet and income statement reconciliations",
    relatedTerms: ["cfo-to-net-income"],
  },
  {
    id: "hhi",
    name: "Herfindahl-Hirschman Index (HHI - Concentration)",
    category: "CREDIT_RISK",
    formula: "Sum of squares of customer or segment market share percentages: Σ(s_i²)",
    plainEnglishSummary: "Measures whether a company relies on too few customers or business segments for its revenue.",
    examinerExplanation: "Used by antitrust regulators (US DOJ) and credit rating agencies to quantify portfolio and customer concentration risk.",
    benchmarkRuleOfThumb: "< 1,500 Diversified / Low concentration; 1,500–2,500 Moderately concentrated; > 2,500 High concentration.",
    pitfallsAndCaveats: "Subject to filing granularity. Corporates only disclose customers accounting for >10% of revenue under Ind AS 108 / IFRS 8.",
    xbrlOrFilingSource: "Segment & Counterparty Concentration Footnotes (Ind AS 108 / ASC 280)",
    relatedTerms: [],
  },
  {
    id: "promoter-pledge",
    name: "Promoter Share Pledging",
    category: "INDIAN_APPRAISAL",
    formula: "(Promoter Shares Pledged ÷ Total Promoter Shares Held) × 100",
    plainEnglishSummary: "The percentage of company shares owned by the founders/promoters that have been pledged as collateral for personal or corporate bank loans.",
    examinerExplanation: "A unique and critical risk vector in Indian corporate credit. If the company share price drops sharply, lenders may trigger margin calls and dump pledged shares, causing sudden insolvency.",
    benchmarkRuleOfThumb: "< 10% Low risk; 10%–30% Medium watchlist; > 30% Elevated margin call danger; > 50% Critical distress alert.",
    pitfallsAndCaveats: "Must be sourced from quarterly SEBI shareholding pattern filings under SEBI (LODR) Reg 31. Not applicable to companies without an identifiable promoter group (e.g. US widely held firms like Apple).",
    xbrlOrFilingSource: "BSE/NSE SEBI LODR Regulation 31 Quarterly Shareholding Pattern Disclosures",
    relatedTerms: ["tol-tnw"],
  },
  {
    id: "drawing-power",
    name: "Drawing Power (DP - Bank Working Capital)",
    category: "INDIAN_APPRAISAL",
    formula: "(Eligible Receivables < 90 days × (1 − Margin)) + (Paid Inventory × (1 − Margin))",
    plainEnglishSummary: "The maximum cash credit overdraft a commercial bank allows a business to draw based on verified stock and customer bills.",
    examinerExplanation: "The fundamental operational borrowing ceiling in Indian working-capital lending consortiums. Ensures working-capital loans are backed by real, unencumbered current assets.",
    benchmarkRuleOfThumb: "Standard bank margins: 25% on paid inventory, 30%–40% on eligible receivables under 90 days.",
    pitfallsAndCaveats: "In software companies with zero inventory and negligible borrowings (like TCS), Drawing Power is functionally not applicable or surplus.",
    xbrlOrFilingSource: "Bank Sanction Letter & Monthly Stock and Debtor Statements",
    relatedTerms: ["current-ratio", "tol-tnw"],
  },
  {
    id: "contingent-liabilities",
    name: "Contingent Liabilities Exposure",
    category: "CREDIT_RISK",
    formula: "(Total Contingent Liabilities ÷ Tangible Net Worth) × 100",
    plainEnglishSummary: "Off-balance-sheet potential liabilities (tax disputes, pending court cases, loan guarantees) that might have to be paid if court rulings go against the firm.",
    examinerExplanation: "Assesses potential capital erosion from unbooked claims under dispute with tax authorities, customs, or commercial counterparties.",
    benchmarkRuleOfThumb: "≤ 30% TNW Manageable; 30%–50% Elevated watchlist; > 50% Severe litigation/tax exposure.",
    pitfallsAndCaveats: "Disputed tax demands are contested claims, not certain debts. Many tax disputes in India take decades to resolve or settle at fractions of initial demands.",
    xbrlOrFilingSource: "Annual Report Footnote: 'Contingent Liabilities and Commitments' (Ind AS 37 / ASC 450)",
    relatedTerms: ["tangible-net-worth", "tol-tnw"],
  },
  {
    id: "lease-liabilities",
    name: "Ind AS 116 / ASC 842 Lease Liabilities",
    category: "ACCOUNTING",
    formula: "Present Value of Future Contractual Lease Commitments",
    plainEnglishSummary: "Accounting requirement to show office, server, and retail store rental leases on the balance sheet as liabilities.",
    examinerExplanation: "Under modern accounting standards (Ind AS 116, IFRS 16, ASC 842), all operating leases are capitalized as Right-of-Use (ROU) assets with offsetting lease liabilities.",
    benchmarkRuleOfThumb: "Lease debt is operational, not bank debt. A company can have ₹0 bank borrowings but ₹8,000 Cr in lease liabilities (e.g. TCS office campuses).",
    pitfallsAndCaveats: "Lease finance costs appear under 'Finance Costs' in P&L, confusing analysts who wonder why a 'debt-free' company reports interest expense.",
    xbrlOrFilingSource: "Balance Sheet Non-Current and Current Lease Liabilities; Note on Leases",
    relatedTerms: ["net-debt", "interest-coverage"],
  },
  {
    id: "variable-cost-share",
    name: "Variable Cost Share (v) & Operating Leverage",
    category: "MACRO_STRESS",
    formula: "v = Variable Operating Costs ÷ Total Operating Costs",
    plainEnglishSummary: "What portion of total operating expenses automatically drops when sales volume falls.",
    examinerExplanation: "Determines operating leverage. When variable cost share is high (e.g. 70%), cost savings cushion revenue drops. When fixed costs dominate (e.g. 70% fixed), any revenue drop hits operating profit severely.",
    benchmarkRuleOfThumb: "Tech/Software ~35% variable; Manufacturing ~65%; Retail ~75%; Telecom/Utilities ~30%.",
    pitfallsAndCaveats: "Assuming 100% variable costs understates bankruptcy risk; assuming 100% fixed costs overstates distress in scalable businesses.",
    xbrlOrFilingSource: "Income Statement COGS vs SG&A decomposition",
    relatedTerms: ["revenue-shock", "cost-inflation"],
  },
  {
    id: "floating-rate-debt",
    name: "Floating-Rate Debt Exposure",
    category: "MACRO_STRESS",
    formula: "Floating-Rate Borrowings ÷ Total Debt × 100",
    plainEnglishSummary: "The portion of company debt where interest rates automatically go up when the central bank hikes benchmark rates.",
    examinerExplanation: "Measures sensitivity to monetary tightening cycles. Fixed-rate corporate bond tranches are immune to near-term rate hikes until maturity.",
    benchmarkRuleOfThumb: "< 30% Low rate sensitivity; 30%–60% Moderate; > 60% Highly sensitive to central bank policy shifts.",
    pitfallsAndCaveats: "Disclosed in borrowing footnotes. Indian rupee bank loans are typically MCLR/EBLR floating; US corporate bonds are typically fixed-coupon.",
    xbrlOrFilingSource: "Annual Report Footnote — Interest Rate Risk Sensitivity & Tranche Terms",
    relatedTerms: ["interest-coverage"],
  },
];

/**
 * Helper to retrieve a term definition by id or partial name.
 */
export function getTermDefinition(termId: string): GlossaryTerm | undefined {
  const clean = termId.toLowerCase().trim();
  return FINANCIAL_GLOSSARY.find((t) => t.id === clean || t.name.toLowerCase() === clean);
}

/**
 * Searches the glossary by keyword across name, summary, and formula.
 */
export function searchGlossary(query: string): GlossaryTerm[] {
  if (!query || query.trim() === "") return FINANCIAL_GLOSSARY;
  const q = query.toLowerCase().trim();
  return FINANCIAL_GLOSSARY.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.plainEnglishSummary.toLowerCase().includes(q) ||
      t.examinerExplanation.toLowerCase().includes(q) ||
      (t.formula && t.formula.toLowerCase().includes(q))
  );
}
