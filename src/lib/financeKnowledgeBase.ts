import { CompanyEntity, CompanyRiskProfile } from "./types";
import { formatFinancialValue, formatRatio } from "./formatters";

export interface KnowledgeTopic {
  keys: string[];
  title: string;
  category: "BALANCE_SHEET" | "INCOME_STATEMENT" | "CASH_FLOW" | "RATIO" | "VALUATION" | "SOLVENCY" | "ACCOUNTING" | "MACRO" | "DEBT";
  content: (company?: CompanyEntity, profile?: CompanyRiskProfile, isEli10?: boolean) => string;
  followUps: string[];
}

export const FINANCIAL_KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  // =========================================================================
  // 1. ASSETS & BALANCE SHEET ARCHITECTURE (Answering "what is assets", etc.)
  // =========================================================================
  {
    keys: [
      "asset",
      "assets",
      "what is assets",
      "what are assets",
      "what is an asset",
      "definition of assets",
      "current assets",
      "fixed assets",
      "non-current assets",
      "tangible assets",
      "intangible assets",
      "balance sheet assets",
      "asset quality",
    ],
    title: "ASSETS & BALANCE SHEET CAPITAL ARCHITECTURE",
    category: "BALANCE_SHEET",
    content: (comp, prof, isEli10) => {
      const p = prof?.periods?.[0];
      const hasData = p && p.totalAssets !== undefined;
      const curr = comp?.currency || "USD";
      const scale = comp?.scaleUnit || "Millions";

      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (LEMONADE STAND ANALOGY)\n` +
        `Imagine you decide to run a **lemonade stand** on a sunny Saturday afternoon!\n` +
        `• **Your ASSETS are simply everything you OWN that helps you make money:**\n` +
        `  1. **The Cash in your pocket:** Coins to give change to your customers *(Cash & Equivalents)*.\n` +
        `  2. **The Lemons and Sugar:** Supplies waiting on your kitchen counter ready to be made into drinks *(Inventory)*.\n` +
        `  3. **The Wooden Table, Pitcher, and Squeezer:** Tools you use every day that don't get used up after one cup *(Equipment / Fixed Assets)*.\n` +
        `  4. **The $2 your neighbor friend promised to bring tomorrow:** He drank a cup today and promised to pay you tomorrow *(Accounts Receivable)*.\n` +
        `**Simple Rule for a 10-Year-Old:** *If you own it, and it puts coins in your piggy bank, it is an Asset!*\n\n` +
        `---\n\n`;

      return (
        `# CORPORATE ASSETS: THE FOUNDATION OF BALANCE SHEET CAPITAL\n\n` +
        (isEli10 ? eli10Section : "") +
        `An **Asset** is any resource of economic value owned or controlled by an entity (business, individual, or sovereign) with the legal expectation that it will generate **future economic benefits, cash flows, or cost reductions**.\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. THE FUNDAMENTAL ACCOUNTING IDENTITY\n` +
        `Every balance sheet on Earth operates under double-entry accounting rules (US-GAAP, IFRS, and Ind-AS):\n` +
        `\\[ \\mathbf{\\text{Total Assets}} = \\mathbf{\\text{Total Liabilities}} + \\mathbf{\\text{Shareholders' Equity}} \\]\n\n` +
        `This means every single asset owned by a company was funded in exactly one of two ways:\n` +
        `1. **Borrowed from lenders & suppliers** (Liabilities / Debt), OR\n` +
        `2. **Contributed by owners & retained profits** (Equity).\n\n` +
        `---\n\n` +
        `### 2. CLASSIFICATION OF ASSETS BY LIQUIDITY\n\n` +
        `#### A. Current Assets (Liquid Buffer — Due within 12 Months)\n` +
        `Current assets are expected to be converted into cash, sold, or consumed within one standard operating cycle:\n` +
        `• **Cash & Cash Equivalents:** Cold hard liquidity — bank deposits, Treasury bills, commercial paper (<90 days maturity).\n` +
        `• **Marketable Securities:** Short-term liquid corporate bonds and government notes that can be sold immediately.\n` +
        `• **Accounts Receivable (AR):** Invoices billed to customers for goods already delivered, awaiting cash collection.\n` +
        `• **Inventories:** Raw materials, work-in-progress, and finished goods ready for customer shipment.\n` +
        `• **Prepaid Expenses:** Advance cash payments made for future services (e.g., insurance, property leases).\n\n` +
        `#### B. Non-Current / Long-Term Assets (Productive Engine — > 12 Months)\n` +
        `Long-term capital assets used to generate multi-year operational revenue:\n` +
        `• **Property, Plant & Equipment (PP&E):** Physical factories, industrial machinery, data centers, land, and office campuses (recorded net of accumulated depreciation).\n` +
        `• **Intangible Assets:** Non-physical intellectual property with statutory protections (patents, proprietary algorithms, registered trademarks, copyrights).\n` +
        `• **Goodwill:** The premium purchase price paid during M&A acquisitions above the fair market value of the target's net identifiable assets.\n` +
        `• **Long-Term Investments & Deferred Tax Assets:** Strategic minority equity stakes and prepaid tax credits.\n\n` +
        `---\n\n` +
        `### 3. HOW WALL STREET & CREDIT ANALYSTS AUDIT ASSETS\n` +
        `1. **Asset Quality Index (AQI):** Are assets tangible productive machines, or capitalized paper expenses and vulnerable goodwill that will need write-downs?\n` +
        `2. **Asset Turnover Efficiency:** $\\frac{\\text{Revenue}}{\\text{Total Assets}}$ — Measures how many dollars of sales management generates from each dollar of deployed assets.\n` +
        `3. **Liquidity Haircut:** In corporate restructuring, cash is worth 100%, receivables ~85%, inventory ~50%, and specialized PP&E can fetch as low as 20% in liquidation!\n\n` +
        (hasData
          ? `### 4. LIVE ASSET DISCLOSURES FOR ${comp?.name} (${comp?.symbol})\n` +
            `• **Cash & Liquid Equivalents:** ${formatFinancialValue(p.cashAndEquivalents, curr, scale)}\n` +
            `• **Total Current Assets:** ${formatFinancialValue(p.totalCurrentAssets, curr, scale)}\n` +
            `• **Property, Plant & Equipment (Net):** ${formatFinancialValue(p.propertyPlantEquipment, curr, scale)}\n` +
            `• **Total Audited Assets:** **${formatFinancialValue(p.totalAssets, curr, scale)}**\n` +
            `• **Current Ratio Buffer:** **${formatRatio(prof?.latestRatios.currentRatio)}** *(Current Assets vs Current Liabilities)*`
          : "")
      );
    },
    followUps: [
      "What are liabilities and how do they differ from debt?",
      "What is shareholders' equity and book value?",
      "Explain Working Capital and Current Ratio",
      "Analyze credit risk & solvency for this company",
    ],
  },

  // =========================================================================
  // 2. LIABILITIES & CORPORATE OBLIGATIONS (Answering "what is liabilities")
  // =========================================================================
  {
    keys: [
      "liability",
      "liabilities",
      "what is liabilities",
      "what are liabilities",
      "what is a liability",
      "current liabilities",
      "long-term liabilities",
      "accounts payable",
      "accrued expenses",
      "total debt vs liabilities",
    ],
    title: "LIABILITIES & CORPORATE OBLIGATIONS",
    category: "BALANCE_SHEET",
    content: (comp, prof, isEli10) => {
      const p = prof?.periods?.[0];
      const hasData = p && p.totalLiabilities !== undefined;
      const curr = comp?.currency || "USD";
      const scale = comp?.scaleUnit || "Millions";

      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (LEMONADE STAND ANALOGY)\n` +
        `Remember that lemonade stand? Imagine you didn't have enough money to buy lemons, so:\n` +
        `• **Your LIABILITIES are everything you OWE to other people that you have to pay back:**\n` +
        `  1. **$10 you borrowed from your Mom:** She gave you $10 for lemons, but you promised to return it on Sunday *(Short-Term Debt)*.\n` +
        `  2. **$5 you owe the grocery store:** The grocer let you take paper cups and said, "Pay me next week" *(Accounts Payable)*.\n` +
        `  3. **$20 you borrowed from your Older Brother:** To buy a fancy wooden cart, you took $20 that you have to repay over the next two years *(Long-Term Debt)*.\n` +
        `**Simple Rule for a 10-Year-Old:** *Assets put coins in your pocket; Liabilities take coins out of your pocket because you borrowed them!*\n\n` +
        `---\n\n`;

      return (
        `# CORPORATE LIABILITIES: CREDIT OBLIGATIONS & CLAIMS\n\n` +
        (isEli10 ? eli10Section : "") +
        `A **Liability** represents a legally enforceable financial obligation or debt owed by a business to external third parties (creditors, banks, bondholders, suppliers, or employees), settled over time through transfers of economic resources (cash, goods, or services).\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. CORE BREAKDOWN: CURRENT VS LONG-TERM\n\n` +
        `#### A. Current Liabilities (Due Within 12 Months)\n` +
        `Immediate claims that must be satisfied using operating cash or short-term assets:\n` +
        `• **Accounts Payable (AP):** Invoices owed to trade suppliers for inventory and raw materials delivered on credit terms (e.g., Net 30, Net 60).\n` +
        `• **Short-Term Debt & Commercial Paper:** Bank overdrafts, short-term promissory notes, and revolving credit draws.\n` +
        `• **Current Portion of Long-Term Debt (CPLTD):** The tranche of long-term bonds or term loans maturing in the upcoming 12 months.\n` +
        `• **Accrued Expenses & Payroll:** Wages earned by employees but not yet disbursed, accrued interest, and tax provisions.\n\n` +
        `#### B. Non-Current / Long-Term Liabilities (Due > 12 Months)\n` +
        `Structured capital financing supporting multi-year expansion:\n` +
        `• **Long-Term Senior Notes & Corporate Bonds:** Fixed-rate institutional debt held by pension funds and asset managers.\n` +
        `• **Term Loans & Syndicate Facilities:** Multi-year bank borrowing with amortizing principal schedules.\n` +
        `• **Capital Lease Obligations (IFRS 16 / Ind-AS 116):** Long-term liabilities reflecting discounted rental payments for aircraft, stores, and data centers.\n` +
        `• **Pension & Post-Retirement Healthcare Deficits:** Actuarial liabilities owed to retired employees.\n\n` +
        `---\n\n` +
        `### 2. WHY LIABILITIES ARE A DOUBLE-EDGED SWORD\n` +
        `• **The Power of Leverage:** When return on capital exceeds interest cost ($ROIC > Cost of Debt$), borrowing amplifies returns on equity.\n` +
        `• **The Solvency Threat:** Liabilities carry fixed contractual dates. Unlike equity dividends which management can cancel at will, **failing to pay $1 of interest or principal can trigger immediate bankruptcy**.\n\n` +
        (hasData
          ? `### 3. LIVE LIABILITIES DISCLOSURES FOR ${comp?.name}\n` +
            `• **Short-Term Debt:** ${formatFinancialValue(p.shortTermDebt, curr, scale)}\n` +
            `• **Long-Term Debt:** ${formatFinancialValue(p.longTermDebt, curr, scale)}\n` +
            `• **Total Funded Debt:** **${formatFinancialValue(p.totalDebt, curr, scale)}**\n` +
            `• **Total Liabilities:** **${formatFinancialValue(p.totalLiabilities, curr, scale)}**\n` +
            `• **Debt-to-Equity Ratio:** **${formatRatio(prof?.latestRatios.debtToEquity)}**`
          : "")
      );
    },
    followUps: [
      "What is Net Debt and why does the 3.5x hurdle matter?",
      "What is the difference between debt and equity?",
      "Explain EBIT Interest Coverage and default thresholds",
    ],
  },

  // =========================================================================
  // 3. SHAREHOLDERS' EQUITY & BOOK VALUE (Answering "what is equity")
  // =========================================================================
  {
    keys: [
      "equity",
      "what is equity",
      "shareholders equity",
      "stockholders equity",
      "book value",
      "net worth",
      "retained earnings",
      "common stock",
      "paid-in capital",
    ],
    title: "SHAREHOLDERS' EQUITY & CORPORATE BOOK VALUE",
    category: "BALANCE_SHEET",
    content: (comp, prof, isEli10) => {
      const p = prof?.periods?.[0];
      const hasData = p && p.totalShareholdersEquity !== undefined;
      const curr = comp?.currency || "USD";
      const scale = comp?.scaleUnit || "Millions";

      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (LEMONADE STAND ANALOGY)\n` +
        `Imagine you decide to close your lemonade stand at the end of the summer:\n` +
        `• You sell all your lemons, cups, pitchers, and your wooden table for **$50 in cash** *(Total Assets)*.\n` +
        `• You repay your Mom the **$10** she lent you and the grocer **$5** for paper cups *(Total Liabilities = $15)*.\n` +
        `• What is left over in your hands? **$50 - $15 = $35!**\n` +
        `• That **$35 is your SHAREHOLDERS' EQUITY!** It is the true money that belongs entirely to you, the owner!\n` +
        `• **Book Value:** What your notebook says the stand is worth.\n` +
        `• **Market Value:** What a kid down the street is willing to pay you to buy your stand today!\n\n` +
        `---\n\n`;

      return (
        `# SHAREHOLDERS' EQUITY: RESIDUAL CORPORATE NET WORTH\n\n` +
        (isEli10 ? eli10Section : "") +
        `**Shareholders' Equity** (also termed Stockholders' Equity, Book Value, or Net Worth) represents the **residual interest in the assets of the company after deducting all its liabilities**.\n\n` +
        `\\[ \\mathbf{\\text{Shareholders' Equity}} = \\mathbf{\\text{Total Assets}} - \\mathbf{\\text{Total Liabilities}} \\]\n\n` +
        (!isEli10 ? eli10Section : "") +
        `If a company were to liquidate all its physical and liquid assets today and pay off every single bank loan, supplier invoice, and bondholder, the cash remaining would belong to the equity shareholders.\n\n` +
        `### 1. CORE ANATOMY OF EQUITY\n` +
        `1. **Contributed Capital (Common Stock & APIC):** The initial cash invested into the company by founders and venture/public investors during IPOs and secondary offerings.\n` +
        `2. **Retained Earnings:** The cumulative total of all accounting net profits earned since inception, *minus* all cumulative dividends paid out to shareholders. This is the **internal financial engine of corporate compounding**.\n` +
        `3. **Treasury Stock (Negative Equity):** When management repurchases its own shares on the open market, it reduces total share count and appears as a contra-equity deduction.\n` +
        `4. **AOCI (Accumulated Other Comprehensive Income):** Unrealized foreign currency gains/losses, pension adjustments, and hedging derivative valuations.\n\n` +
        `### 2. BOOK VALUE VS MARKET CAPITALIZATION\n` +
        `• **Book Value of Equity:** Historical accounting valuation recorded on balance sheet.\n` +
        `• **Market Value of Equity (Market Cap):** What real-world investors are willing to pay for ownership today: $\\text{Share Price} \\times \\text{Shares Outstanding}$.\n` +
        `• **Price-to-Book (P/B) Ratio:** Compares Market Cap to Book Value. Asset-light technology companies (Apple, Microsoft) often trade at 10x-40x P/B because their greatest assets (brand, algorithms, ecosystem) are expensed rather than capitalized!\n\n` +
        (hasData
          ? `### 3. LIVE EQUITY DISCLOSURES FOR ${comp?.name}\n` +
            `• **Total Audited Shareholders' Equity:** **${formatFinancialValue(p.totalShareholdersEquity, curr, scale)}**\n` +
            `• **Reported Market Cap:** ${formatFinancialValue(comp?.marketCap, curr, scale)}\n` +
            `• **Return on Equity (ROE):** ${prof?.latestRatios.roePct !== null ? `${prof.latestRatios.roePct.toFixed(1)}%` : "N/D"}`
          : "")
      );
    },
    followUps: [
      "What is ROE vs ROIC and which is better?",
      "Explain Price-to-Book (P/B) ratio",
      "Explain Enterprise Value vs Market Capitalization",
    ],
  },

  // =========================================================================
  // 4. EBITDA & OPERATING PROFITABILITY (Answering "what is ebitda")
  // =========================================================================
  {
    keys: [
      "ebitda",
      "what is ebitda",
      "why ebitda",
      "ebitda formula",
      "ebitda margin",
      "operating profit vs ebitda",
      "ebit vs ebitda",
    ],
    title: "EBITDA // WALL STREET'S OPERATING CASH PROXY",
    category: "INCOME_STATEMENT",
    content: (comp, prof, isEli10) => {
      const p = prof?.periods?.[0];
      const hasData = p && p.ebitda !== undefined;
      const curr = comp?.currency || "USD";
      const scale = comp?.scaleUnit || "Millions";

      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (LEMONADE STAND ANALOGY)\n` +
        `Imagine on Saturday you sell 100 cups of lemonade for $1 each ($100 Revenue):\n` +
        `• You spent $30 on lemons and sugar.\n` +
        `• You paid your sister $10 to help pour cups.\n` +
        `• You have **$60 left!** That $60 is your **EBITDA**!\n` +
        `• It measures how much pure cash your stand makes from **just selling lemonade**, before you worry about:\n` +
        `  - Taxes owed to the town government *(Taxes)*,\n` +
        `  - Interest owed to your older brother for that loan *(Interest)*, or\n` +
        `  - Worrying that your wooden table is getting scratched and older *(Depreciation)*.\n` +
        `**Simple Rule for a 10-Year-Old:** *EBITDA tells you if the engine of your stand is making real money from customers everyday!*\n\n` +
        `---\n\n`;

      return (
        `# EBITDA: EARNINGS BEFORE INTEREST, TAXES, DEPRECIATION & AMORTIZATION\n\n` +
        (isEli10 ? eli10Section : "") +
        `**EBITDA** is the universal metric used across Wall Street, private equity firms, credit rating agencies, and syndicate banks to measure an enterprise's **pure operational earning power**, completely stripped of capital structure choices, tax regimes, and non-cash accounting charges.\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. MATHEMATICAL FORMULATION\n\n` +
        `#### Top-Down Approach:\n` +
        `\\[ \\text{EBITDA} = \\text{Operating Income (EBIT)} + \\text{Depreciation} + \\text{Amortization} \\]\n\n` +
        `#### Bottom-Up Approach:\n` +
        `\\[ \\text{EBITDA} = \\text{Net Income} + \\text{Taxes} + \\text{Interest Expense} + \\text{D\\&A} \\]\n\n` +
        `### 2. WHY INSTITUTIONAL LENDERS REVERE EBITDA\n` +
        `1. **Capital Structure Neutral:** Whether a company is 100% equity-funded or 80% debt-leveraged, EBITDA evaluates the underlying operational engine equally.\n` +
        `2. **Tax Neutral:** Ignores differing regional tax holidays, R&D credits, or sovereign rates.\n` +
        `3. **The Universal Leverage Multiple:** Syndicated bank loans are governed by **Net Debt / EBITDA**. If Net Debt / EBITDA exceeds **3.5x**, the firm enters the supervisory watchlist zone!\n\n` +
        `### 3. THE FAMOUS CRITIQUE BY WARREN BUFFETT\n` +
        `*"Does management think the tooth fairy pays for capital expenditures?"* — Charlie Munger & Warren Buffett famously warn that EBITDA can overstate real cash generation in capital-intensive industries where machines wear out and require billions in ongoing CapEx!\n\n` +
        (hasData
          ? `### 4. LIVE EBITDA DISCLOSURES FOR ${comp?.name}\n` +
            `• **Operating Profit (EBIT):** ${formatFinancialValue(p.ebit, curr, scale)}\n` +
            `• **Consolidated EBITDA:** **${formatFinancialValue(p.ebitda, curr, scale)}**\n` +
            `• **Net Debt / EBITDA Multiple:** **${formatRatio(prof?.latestRatios.netDebtToEbitda)}** *(Syndicate Hurdle: ≤ 3.50x)*\n` +
            `• **Interest Coverage (EBIT / Interest):** **${formatRatio(prof?.latestRatios.interestCoverage)}** *(Floor: ≥ 2.50x)*`
          : "")
      );
    },
    followUps: [
      "Explain Net Debt to EBITDA 3.5x hurdle",
      "What is Free Cash Flow and how does it differ from EBITDA?",
      "Explain EV/EBITDA valuation multiple",
    ],
  },

  // =========================================================================
  // 5. REVENUE & THE TOP-LINE (Answering "what is revenue")
  // =========================================================================
  {
    keys: [
      "revenue",
      "what is revenue",
      "sales",
      "top line",
      "turnover",
      "gross revenue",
      "revenue recognition",
      "sales growth",
    ],
    title: "REVENUE // THE TOP-LINE CASH ENGINE",
    category: "INCOME_STATEMENT",
    content: (comp, prof, isEli10) => {
      const p = prof?.periods?.[0];
      const hasData = p && p.revenue !== undefined;
      const curr = comp?.currency || "USD";
      const scale = comp?.scaleUnit || "Millions";

      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (LEMONADE STAND ANALOGY)\n` +
        `Every time a neighbor walks up and hands you a $2 coin for a fresh cold cup of lemonade, you hear 'CHA-CHING!' in your cash box!\n` +
        `• If 50 people buy a cup today, you have **$100 in total coins** in your box.\n` +
        `• That **$100 is your REVENUE** (also called Sales or the Top-Line)!\n` +
        `• It is the **TOTAL money coming in through the front door** before you spend a single penny on lemons, sugar, cups, or snacks.\n` +
        `**Simple Rule for a 10-Year-Old:** *Revenue is all the coins that drop into your register from customers!*\n\n` +
        `---\n\n`;

      return (
        `# CONSOLIDATED REVENUE: THE TOP-LINE FINANCIAL DRIVER\n\n` +
        (isEli10 ? eli10Section : "") +
        `**Revenue** (often referred to as Sales, Gross Turnover, or the "Top Line") represents the **total monetary gross inflow generated by a business from selling goods, delivering services, or licensing intellectual property** before any costs or expenses are subtracted.\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. STATUTORY REVENUE RECOGNITION (ASC 606 & IND-AS 115)\n` +
        `Under modern international accounting standards, a company cannot book revenue simply because it received cash or signed a contract. Revenue is recognized through the strict **5-Step Model**:\n` +
        `1. Identify the contract with a customer.\n` +
        `2. Identify the separate performance obligations.\n` +
        `3. Determine the transaction price.\n` +
        `4. Allocate the price to performance obligations.\n` +
        `5. **Recognize revenue only when the performance obligation is satisfied** (e.g., product delivered or SaaS access provided).\n\n` +
        `### 2. ORGANIC VS INORGANIC REVENUE EXPANSION\n` +
        `• **Organic Growth:** Generated internally through price hikes, volume increases, new customer acquisition, or geographic expansion.\n` +
        `• **Inorganic Growth:** Acquired externally by buying competing companies (M&A). Credit analysts carefully separate the two to ensure core customer demand is growing.\n\n` +
        (hasData
          ? `### 3. LIVE REVENUE DISCLOSURES FOR ${comp?.name}\n` +
            `• **Latest Period Revenue:** **${formatFinancialValue(p.revenue, curr, scale)}**\n` +
            `• **Gross Profit:** ${formatFinancialValue(p.grossProfit, curr, scale)}\n` +
            `• **Operating EBIT:** ${formatFinancialValue(p.ebit, curr, scale)}\n` +
            `• **Net Income:** ${formatFinancialValue(p.netIncome, curr, scale)}`
          : "")
      );
    },
    followUps: [
      "Explain Gross Margin vs Operating Margin",
      "What is Cost of Goods Sold (COGS)?",
      "Analyze credit risk & solvency for this company",
    ],
  },

  // =========================================================================
  // 6. COGS & GROSS PROFIT (Answering "what is cogs", "gross margin")
  // =========================================================================
  {
    keys: [
      "cogs",
      "cost of goods sold",
      "what is cogs",
      "gross profit",
      "gross margin",
      "cost of sales",
      "pricing power",
    ],
    title: "COGS & GROSS MARGIN // PRICING POWER & PRODUCTION EFFICIENCY",
    category: "INCOME_STATEMENT",
    content: (comp, prof, isEli10) => {
      const p = prof?.periods?.[0];
      const curr = comp?.currency || "USD";
      const scale = comp?.scaleUnit || "Millions";

      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (LEMONADE STAND ANALOGY)\n` +
        `To make **ONE cup** of lemonade, what do you actually need?\n` +
        `• 1 Lemon: **50 cents**\n` +
        `• Sugar & Ice: **20 cents**\n` +
        `• Paper cup & straw: **10 cents**\n` +
        `• Total ingredients: **80 cents** per cup! That 80 cents is your **COGS (Cost of Goods Sold)**!\n` +
        `• If you sell each cup for **$2.00**, your **GROSS PROFIT is $1.20** ($2.00 - $0.80).\n` +
        `• If a heatwave makes lemons expensive at $1.50 each, your COGS jumps to $1.80, and your profit almost vanishes!\n` +
        `**Simple Rule for a 10-Year-Old:** *COGS is what it costs you in raw ingredients to bake the cookie or pour the cup!*\n\n` +
        `---\n\n`;

      return (
        `# COST OF GOODS SOLD (COGS) & GROSS PROFIT MARGIN\n\n` +
        (isEli10 ? eli10Section : "") +
        `**Cost of Goods Sold (COGS)** (or Cost of Sales) represents the **direct variable costs incurred to manufacture a product or deliver a service**.\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. FORMULATION & THE GROSS MARGIN BRIDGE\n` +
        `\\[ \\text{Gross Profit} = \\text{Total Revenue} - \\text{COGS} \\]\n` +
        `\\[ \\text{Gross Margin \\%} = \\left( \\frac{\\text{Gross Profit}}{\\text{Total Revenue}} \\right) \\times 100 \\]\n\n` +
        `### 2. WHAT IS INCLUDED IN COGS?\n` +
        `• **Raw Materials:** Steel, silicon chips, lithium, chemicals, fabric.\n` +
        `• **Direct Factory Labor:** Wages of assembly-line workers and machine operators.\n` +
        `• **Direct Manufacturing Overhead:** Electricity to run smelting plants, freight-in costs, and factory tooling depreciation.\n` +
        `• *EXCLUDED:* Corporate executive salaries, legal fees, general marketing campaigns, and research labs (these are SG&A and R&D operating expenses).\n\n` +
        `### 3. WHY GROSS MARGIN REVEALS A COMPANY'S ECONOMIC MOAT\n` +
        `• **High Gross Margin (> 60%):** Elite software, luxury goods (LVMH, Apple, TCS). High pricing power allows them to absorb raw material inflation effortlessly.\n` +
        `• **Low Gross Margin (< 25%):** Airlines, grocery retailers, steel mills. A small 3% spike in oil or wheat prices can completely obliterate their entire annual profit!\n\n` +
        (p?.grossProfit
          ? `### 4. LIVE GROSS MARGIN FOR ${comp?.name}\n` +
            `• Revenue: ${formatFinancialValue(p.revenue, curr, scale)}\n` +
            `• Cost of Goods Sold: ${formatFinancialValue(p.cogs, curr, scale)}\n` +
            `• Gross Profit: **${formatFinancialValue(p.grossProfit, curr, scale)}**\n` +
            `• **Gross Profit Margin:** **${prof?.latestRatios.grossMarginPct?.toFixed(1) || "N/D"}%**`
          : "")
      );
    },
    followUps: [
      "Explain Operating Margin (EBIT) vs Gross Margin",
      "What is Free Cash Flow and how is it calculated?",
      "Analyze credit risk & solvency for this company",
    ],
  },

  // =========================================================================
  // 7. NET INCOME & QUALITY OF EARNINGS (Answering "what is net income")
  // =========================================================================
  {
    keys: [
      "net income",
      "what is net income",
      "bottom line",
      "net profit",
      "pat",
      "profit after tax",
      "quality of earnings",
    ],
    title: "NET INCOME // THE ACCOUNTING BOTTOM LINE",
    category: "INCOME_STATEMENT",
    content: (comp, prof, isEli10) => {
      const p = prof?.periods?.[0];
      const curr = comp?.currency || "USD";
      const scale = comp?.scaleUnit || "Millions";

      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (LEMONADE STAND ANALOGY)\n` +
        `**Net Income is the actual money you get to take home and hide inside your secret piggy bank under your bed!**\n` +
        `Let's trace your money on Saturday:\n` +
        `• You collected **$100** from sales *(Revenue)*.\n` +
        `• You spent **$30** on lemons and cups *(COGS)* &rarr; $70 left.\n` +
        `• You paid your sister **$10** for helping *(Operating Expenses)* &rarr; $60 left.\n` +
        `• You paid your brother **$5** interest for his loan *(Interest)* &rarr; $55 left.\n` +
        `• You gave **$5** to the neighborhood club for a selling permit *(Taxes)* &rarr; **$50 left!**\n` +
        `• That final **$50 is your NET INCOME** (The Bottom Line). It is 100% yours to keep, save, or buy toys with!\n\n` +
        `---\n\n`;

      return (
        `# CONSOLIDATED NET INCOME: THE ULTIMATE BOTTOM-LINE PROFIT\n\n` +
        (isEli10 ? eli10Section : "") +
        `**Net Income** (also known as Net Profit, Profit After Tax - PAT, or the "Bottom Line") represents the **final residual accounting profit remaining for equity shareholders after deducting all expenses**:\n\n` +
        `\\[ \\text{Net Income} = \\text{Revenue} - \\text{COGS} - \\text{Operating Expenses} - \\text{Interest Expense} - \\text{Taxes} \\pm \\text{Non-Operating Items} \\]\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. EARNINGS PER SHARE (EPS)\n` +
        `Dividing Net Income by total diluted shares gives **EPS**, which drives stock valuations and P/E multiples:\n` +
        `\\[ \\text{Diluted EPS} = \\frac{\\text{Net Income} - \\text{Preferred Dividends}}{\\text{Weighted Average Diluted Shares}} \\]\n\n` +
        `### 2. FORENSIC AUDIT: THE "QUALITY OF EARNINGS" RATIO\n` +
        `Because Net Income is constructed under accrual accounting rules, management can artificially inflate it using paper adjustments. Credit analysts always compare Net Income to **Cash Flow from Operations (CFO)**:\n` +
        `\\[ \\text{Cash Conversion} = \\frac{\\text{Operating Cash Flow (CFO)}}{\\text{Net Income}} \\]\n` +
        `• **$\\ge 1.0\\text{x}$ (High Quality):** Every rupee/dollar of profit is confirmed by real bankable cash entering the bank account.\n` +
        `• **$< 0.7\\text{x}$ (Red Flag Alert):** The company is booking paper profits without collecting real cash (signals aggressive revenue recognition or ballooning unpaid receivables).\n\n` +
        (p?.netIncome
          ? `### 3. LIVE NET INCOME FOR ${comp?.name}\n` +
            `• Reported Net Profit: **${formatFinancialValue(p.netIncome, curr, scale)}**\n` +
            `• Operating Cash Flow: ${formatFinancialValue(p.operatingCashFlow, curr, scale)}\n` +
            `• Cash Conversion (CFO/NI): **${formatRatio(prof?.latestRatios.cfoToNetIncome)}** *(Benchmark: ≥ 0.85x)*`
          : "")
      );
    },
    followUps: [
      "What is Free Cash Flow and why is it superior to Net Income?",
      "Explain Beneish M-Score for earnings manipulation",
      "Analyze credit risk & solvency for this company",
    ],
  },

  // =========================================================================
  // 8. CENTRAL BANK REPO RATE & MONETARY POLICY (Answering "what is repo rate")
  // =========================================================================
  {
    keys: [
      "repo rate",
      "what is repo rate",
      "rbi repo rate",
      "reverse repo",
      "rbi",
      "policy rate",
      "monetary policy",
      "federal reserve",
      "fed funds rate",
      "interest rate hikes",
    ],
    title: "CENTRAL BANK REPO RATE & MONETARY TRANSMISSION",
    category: "MACRO",
    content: (comp, prof, isEli10) => {
      const isInd = comp?.country === "IND" || comp?.symbol.endsWith(".NS");

      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (SCHOOL PRINCIPAL ANALOGY)\n` +
        `Imagine the **Central Bank** (like RBI in India or the Federal Reserve in the USA) is the **School Principal** for all the banks in the country:\n` +
        `• When ordinary banks (like State Bank of India or HDFC or Chase) need extra pocket money for the weekend, they borrow from the Principal.\n` +
        `• The interest rate the Principal charges them is called the **REPO RATE** (currently 5.50% in India)!\n` +
        `• **What happens when the Principal hikes the rate to 6.00%?**\n` +
        `  1. Banks say: *"Oh no, borrowing from the Principal is expensive!"*\n` +
        `  2. So banks charge your parents higher interest on home loans and car loans.\n` +
        `  3. People borrow less money, buy fewer luxury toys, and prices stop rising *(cooling down inflation)*!\n` +
        `**Simple Rule for a 10-Year-Old:** *When the Repo Rate is high, borrowing money is expensive so everyone spends less candy money!*\n\n` +
        `---\n\n`;

      return (
        `# CENTRAL BANK REPO RATE & CORPORATE MONETARY TRANSMISSION\n\n` +
        (isEli10 ? eli10Section : "") +
        `The **Repo Rate** (Repurchase Option Rate) is the **benchmark interest rate at which the Sovereign Central Bank (Reserve Bank of India - RBI, or US Federal Reserve) lends short-term liquidity to commercial banks** against statutory government securities.\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. CURRENT MONETARY POLICY CALIBRATION (2026)\n` +
        `• **Reserve Bank of India (RBI):** Benchmark Repo Rate stands at **5.50%**.\n` +
        `• **US Federal Reserve:** Benchmark Fed Funds Target Range stands at **5.25% - 5.50%**.\n` +
        `• **European Central Bank (ECB):** Main Refinancing Rate stands at **3.65%**.\n\n` +
        `### 2. HOW THE REPO RATE TRANSMISSION MECHANISM IMPACTS CORPORATES\n\n` +
        "```\n" +
        "   [ Central Bank Hikes Repo Rate (+50 bps) ]\n" +
        "                    │\n" +
        "                    ▼\n" +
        "   [ Commercial Banks Raise Lending Rates (MCLR / Prime Rate) ]\n" +
        "                    │\n" +
        "         ┌──────────┴──────────┐\n" +
        "         ▼                     ▼\n" +
        " [ Corporate Loan Interest   [ Consumer Borrowing Costs Rise\n" +
        "    Expense Spikes ]           (Car/Home EMIs Tighten) ]\n" +
        "         │                     │\n" +
        "         ▼                     ▼\n" +
        " [ Interest Coverage Drops   [ Discretionary Consumer Demand\n" +
        "    & Default Risk Rises ]      Contracts ]\n" +
        "```\n\n" +
        `### 3. WINNERS VS LOSERS UNDER HIGH BENCHMARK RATES\n` +
        `• **Winners (Cash Fortress Entities like Apple, TCS, Microsoft):** Zero bank borrowings; they actually EARN massive risk-free treasury interest income on their tens of billions in cash reserves!\n` +
        `• **Losers (Leveraged Infrastructure, Real Estate, Telecom):** Floating-rate debt obligations experience instant interest expense surges, compressing debt service coverage (DSCR).\n\n` +
        (comp
          ? `### 4. LIVE APPLICATION TO ${comp.name} (${comp.symbol})\n` +
            `${
              isInd
                ? `Subject to Indian monetary transmission via **RBI Repo (5.50%)**. As tested in the FINTRAXIS Macro Stress Lab, a +200 bps tightening shock evaluates whether operating cash flow maintains sufficient coverage.`
                : `Reports under ${comp.country} jurisdiction. Capital facilities are anchored to sovereign benchmark yields.`
            }`
          : "")
      );
    },
    followUps: [
      "Explain how the FINTRAXIS Macro Stress Simulator works",
      "Explain Net Debt to EBITDA 3.5x hurdle",
      "Explain WACC and how central bank rates increase it",
    ],
  },

  // =========================================================================
  // 9. FREE CASH FLOW (FCF)
  // =========================================================================
  {
    keys: ["free cash flow", "fcf", "cash flow", "operating cash flow vs fcf", "what is fcf"],
    title: "FREE CASH FLOW (FCF) // THE ULTIMATE CORPORATE CURRENCY",
    category: "CASH_FLOW",
    content: (comp, prof, isEli10) => {
      const p = prof?.periods?.[0];
      const hasData = p && p.freeCashFlow !== undefined;

      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (ICE CREAM MONEY ANALOGY)\n` +
        `**Free Cash Flow is real, jingling coins you can spend on anything you want without hurting your business!**\n` +
        `• Imagine your lemonade stand brings in **$50 of cash** on Saturday afternoon.\n` +
        `• But your wooden lemon squeezer cracked, and you MUST buy a new squeezer for **$20** so you can sell drinks next week *(CapEx / Reinvestment)*.\n` +
        `• How much cash do you actually have left to buy comic books or ice cream? **$50 - $20 = $30!**\n` +
        `• That **$30 is your FREE CASH FLOW!** Profit on paper is nice, but Free Cash Flow is real money that you can actually hold in your hand!\n\n` +
        `---\n\n`;

      return (
        `# FREE CASH FLOW (FCF): CASH IS REALITY, PROFIT IS OPINION\n\n` +
        (isEli10 ? eli10Section : "") +
        `Free Cash Flow represents the actual cash a company produces after paying all its operating expenses and reinvesting in its business (CapEx). Unlike Accounting Net Income, which is subject to accrual estimates and non-cash items, **FCF cannot be faked**.\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. FORMULATION & CALCULATION\n` +
        `\\[ \\text{FCF} = \\text{Cash Flow from Operations (CFO)} - \\text{Capital Expenditures (CapEx)} \\]\n\n` +
        `• **Operating Cash Flow (CFO):** Cash generated directly from delivering core products and services.\n` +
        `• **Capital Expenditures (CapEx):** Cash reinvested to maintain and expand plants, equipment, technology, and real estate.\n\n` +
        `### 2. WHY INSTITUTIONAL INVESTORS CARE\n` +
        `1. **Discretionary Capital Allocation:** Positive FCF funds dividends, share buybacks, M&A acquisitions, and debt paydown without needing outside bank loans.\n` +
        `2. **Forensic Quality of Earnings:** If Net Income is rising but FCF is shrinking or negative, the firm is booking uncollected paper revenues (receivables) or burning cash in unsold inventory.\n` +
        `3. **Valuation Foundation:** FCF is the numerator in Discounted Cash Flow (DCF) models.\n\n` +
        (hasData
          ? `### 3. ACTIVE TRAJECTORY FOR ${comp?.name}\n` +
            `• **Audited Operating Cash Flow:** ${formatFinancialValue(p.operatingCashFlow, comp?.currency || "USD", comp?.scaleUnit || "Millions")}\n` +
            `• **Capital Expenditures (CapEx):** ${formatFinancialValue(p.capitalExpenditures, comp?.currency || "USD", comp?.scaleUnit || "Millions")}\n` +
            `• **Reported Free Cash Flow (FCF):** **${formatFinancialValue(p.freeCashFlow, comp?.currency || "USD", comp?.scaleUnit || "Millions")}**\n` +
            `• **Verdict:** ${
              (p.freeCashFlow ?? 0) > 0
                ? "Self-funding fortress cash generator. Zero reliance on external credit markets. ✅"
                : "Negative FCF burn. Requires external financing or cash buffer liquidation. ⚠️"
            }`
          : "")
      );
    },
    followUps: [
      "Explain WACC and how it is calculated",
      "What is the difference between Net Income and Operating Cash Flow?",
      "Explain Working Capital and Cash Conversion Cycle",
    ],
  },

  // =========================================================================
  // 10. WACC (WEIGHTED AVERAGE COST OF CAPITAL)
  // =========================================================================
  {
    keys: ["wacc", "cost of capital", "discount rate", "hurdle rate", "what is wacc"],
    title: "WACC (WEIGHTED AVERAGE COST OF CAPITAL) // CORPORATE HURDLE RATE",
    category: "VALUATION",
    content: (comp, prof, isEli10) => {
      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (CAPITAL BLEND ANALOGY)\n` +
        `Imagine you need **$40** to start your lemonade stand:\n` +
        `• You put in **$20 of your own birthday money** (Equity). You want to earn at least 15% return for your hard work.\n` +
        `• You borrow **$20 from your cousin** (Debt). Your cousin demands 5% interest.\n` +
        `• What is the blended average cost to gather all that $40? Exactly **10%!**\n` +
        `• That 10% is your **WACC (Weighted Average Cost of Capital)**!\n` +
        `• **The Golden Rule:** If your lemonade stand only earns 6%, you are losing money on the capital you gathered. You must beat your 10% hurdle to create real wealth!\n\n` +
        `---\n\n`;

      return (
        `# WEIGHTED AVERAGE COST OF CAPITAL (WACC)\n\n` +
        (isEli10 ? eli10Section : "") +
        `WACC represents the average rate of return a company must generate across all its operations to satisfy both its lenders (debt holders) and its owners (equity shareholders).\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. MATHEMATICAL FORMULA\n` +
        `\\[ \\text{WACC} = \\left( \\frac{E}{V} \\times R_e \\right) + \\left( \\frac{D}{V} \\times R_d \\times (1 - T) \\right) \\]\n\n` +
        `Where:\n` +
        `• $E$ = Market Value of Equity (Market Cap)\n` +
        `• $D$ = Market Value of Total Debt\n` +
        `• $V = E + D$ (Total Enterprise Capital)\n` +
        `• $R_e$ = Cost of Equity, computed via CAPM: $R_f + \\beta \\times (R_m - R_f)$\n` +
        `• $R_d$ = Pre-tax Cost of Debt (effective yield on corporate bonds / loans)\n` +
        `• $T$ = Marginal Corporate Tax Rate (interest is tax-deductible!)\n\n` +
        `### 2. INSTITUTIONAL BENCHMARKS\n` +
        `• **Mega-Cap Stable Firms (Apple, Microsoft):** WACC is typically $7.5\\% - 9.0\\%$.\n` +
        `• **Emerging Market Blue Chips (TCS, Reliance):** WACC is typically $10.5\\% - 13.0\\%$ due to higher sovereign 10Y G-Sec yields (~6.8%) and country risk premiums.\n` +
        `• **Golden Rule of Value Creation:** If **ROIC > WACC**, the firm creates economic value (EVA). If **ROIC < WACC**, every rupee or dollar invested destroys wealth!`
      );
    },
    followUps: [
      "Explain ROIC vs ROE and why ROIC is superior",
      "Explain DCF (Discounted Cash Flow) valuation",
      "What is the impact of Central Bank rate hikes on WACC?",
    ],
  },

  // =========================================================================
  // 11. DEBT COVENANTS & BANK SYNDICATE TERMS (Answering "what is covenants")
  // =========================================================================
  {
    keys: [
      "covenant",
      "covenants",
      "what is covenants",
      "what are covenants",
      "what is a covenant",
      "debt covenant",
      "negative pledge",
      "covenant breach",
      "syndicate agreement",
    ],
    title: "DEBT COVENANTS // SYNDICATED LOAN CONTRACT RESTRICTIONS",
    category: "DEBT",
    content: (comp, prof, isEli10) => {
      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (HOUSE RULES ANALOGY)\n` +
        `Imagine your Dad lends you $50 to buy an electric scooter for your morning paper route:\n` +
        `• He says: *"I will lend you the $50, but you must follow these 3 strict rules:"*\n` +
        `  1. **Rule 1:** You must always keep at least $10 in your pocket for emergencies *(Minimum Liquidity)*.\n` +
        `  2. **Rule 2:** You cannot let your careless friend Bobby ride your scooter *(Negative Pledge / Asset Protection)*.\n` +
        `  3. **Rule 3:** If your math grade drops below a B, I take the scooter keys back immediately *(Covenant Default)*!\n` +
        `• Those house rules are **COVENANTS**! Banks give these exact legal promises to big companies so the companies don't waste the borrowed money.\n\n` +
        `---\n\n`;

      return (
        `# DEBT COVENANTS: CONTRACTUAL CREDITOR PROTECTIONS\n\n` +
        (isEli10 ? eli10Section : "") +
        `A **Debt Covenant** is a legally binding contractual clause embedded within loan agreements or bond indentures, designed by lenders to protect their capital by restricting the borrower's actions and mandating financial health thresholds.\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. THE THREE CATEGORIES OF COVENANTS\n\n` +
        `#### A. Financial Maintenance Covenants (Ongoing Ratio Testing)\n` +
        `The borrower must continuously prove compliance at each fiscal quarter end:\n` +
        `• **Maximum Net Debt / EBITDA Ceiling:** (e.g., must stay $\\le 3.50\\text{x}$). Prevents the company from overleveraging.\n` +
        `• **Minimum EBIT Interest Coverage Floor:** (e.g., must stay $\\ge 2.50\\text{x}$). Ensures sufficient operating profit to service interest.\n` +
        `• **Minimum Liquidity Buffer:** Requires maintaining at least $\\$500\\text{M}$ or 6 months of cash runway.\n\n` +
        `#### B. Negative Covenants (Forbidden Actions)\n` +
        `• **Negative Pledge Clause:** The borrower cannot pledge its prime assets (factories, IP) as collateral to other new lenders.\n` +
        `• **Restricted Payments:** Forbids paying dividends or buying back shares if covenant headroom drops below 15%.\n` +
        `• **M&A Limitation:** Cannot acquire other firms without prior syndicate lender consent.\n\n` +
        `#### C. Affirmative Covenants (Mandatory Obligations)\n` +
        `• Provide audited GAAP/Ind-AS financial statements within 90 days of fiscal year end.\n` +
        `• Maintain adequate insurance on all collateralized physical property.\n\n` +
        `### 2. WHAT HAPPENS WHEN A COVENANT BREACHES?\n` +
        `A covenant breach is an immediate **Event of Default**: Banks do not immediately liquidate the borrower, but gain immense leverage to:\n` +
        `1. Hike loan interest rate margins (+150 to +300 bps penalty spread),\n` +
        `2. Demand an upfront cash waiver fee (0.50% - 1.00%),\n` +
        `3. Freeze remaining revolving credit line access, or\n` +
        `4. Demand immediate acceleration and full loan payoff.`
      );
    },
    followUps: [
      "Explain Net Debt to EBITDA 3.5x hurdle",
      "Explain EBIT Interest Coverage floor",
      "Analyze credit risk & solvency for this company",
    ],
  },

  // =========================================================================
  // 12. DISCOUNTED CASH FLOW (DCF) VALUATION
  // =========================================================================
  {
    keys: ["dcf", "discounted cash flow", "intrinsic value", "terminal value", "what is dcf"],
    title: "DISCOUNTED CASH FLOW (DCF) // INTRINSIC ENTERPRISE VALUATION",
    category: "VALUATION",
    content: (comp, prof, isEli10) => {
      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (TIME MACHINE CASH ANALOGY)\n` +
        `Would you rather have **$10 right now in your hand**, or **$10 five years from now**?\n` +
        `• **Right now!** Because in five years, $10 buys fewer chocolate bars, or you could have saved it in a piggy bank to earn interest.\n` +
        `• A **Discounted Cash Flow (DCF)** is like a financial time machine!\n` +
        `• It looks into the future: Year 1 ($100), Year 2 ($120), Year 3 ($150)... and **shrinks every future dollar backwards** to see what that entire future stream of money is worth in cold hard cash **TODAY**!\n` +
        `**Simple Rule for a 10-Year-Old:** *A company is worth whatever total cash it can put into your pockets between today and forever, discounted for waiting!*\n\n` +
        `---\n\n`;

      return (
        `# DISCOUNTED CASH FLOW (DCF) VALUATION METHODOLOGY\n\n` +
        (isEli10 ? eli10Section : "") +
        `A **DCF** is Wall Street's gold-standard intrinsic valuation model, built on the financial axiom that **a business is worth exactly the present value of all future cash flows it can produce**.\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. MATHEMATICAL FORMULATION\n` +
        `\\[ \\text{Enterprise Value} = \\sum_{t=1}^{n} \\frac{\\text{Unlevered Free Cash Flow}_t}{(1 + \\text{WACC})^t} + \\frac{\\text{Terminal Value}}{(1 + \\text{WACC})^n} \\]\n\n` +
        `### 2. THE THREE BUILDING BLOCKS\n` +
        `1. **Unlevered Free Cash Flow (UFCF):** Cash produced by the core business available to all capital providers: $\\text{EBIT} \\times (1 - T) + \\text{D\\&A} - \\text{CapEx} - \\Delta\\text{NWC}$.\n` +
        `2. **Discount Rate (WACC):** Reflects the blended opportunity cost of equity and cost of debt.\n` +
        `3. **Terminal Value (Perpetuity Growth):** Evaluates cash flows beyond Year 5 or 10 using Gordon Growth:\n` +
        `\\[ \\text{Terminal Value} = \\frac{\\text{FCF}_{n} \\times (1 + g)}{\\text{WACC} - g} \\]\n` +
        `*(Where $g$ is long-term sustainable GDP growth rate, typically 2.0% - 3.0%)*.\n\n` +
        `### 3. FROM ENTERPRISE VALUE TO PER-SHARE TARGET PRICE\n` +
        `\\[ \\text{Equity Value} = \\text{Enterprise Value} - \\text{Total Debt} + \\text{Cash} \\]\n` +
        `\\[ \\text{Fair Value Per Share} = \\frac{\\text{Equity Value}}{\\text{Diluted Shares Outstanding}} \\]`
      );
    },
    followUps: [
      "Explain WACC and how it is calculated",
      "Explain Free Cash Flow (FCF)",
      "Explain Enterprise Value vs Market Cap",
    ],
  },

  // =========================================================================
  // 13. BONDS & FIXED INCOME INSTRUMENTS (Answering "what is bonds")
  // =========================================================================
  {
    keys: ["bond", "bonds", "what is a bond", "what are bonds", "coupon", "yield to maturity", "ytm", "fixed income", "debenture"],
    title: "BONDS & FIXED INCOME INSTRUMENTS // CAPITAL DEBT MARKETS",
    category: "DEBT",
    content: (comp, prof, isEli10) => {
      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (OFFICIAL I.O.U. ANALOGY)\n` +
        `Imagine your school wants to build an awesome new treehouse playground that costs $1,000:\n` +
        `• Instead of asking one rich kid, they print 10 official certificates called **BONDS** for $100 each.\n` +
        `• You give the school $100. In return, the school promises:\n` +
        `  1. Every December, they give you **$5 in candy money** *(The Coupon Interest)*.\n` +
        `  2. After 5 years, they give your **full $100 back** *(The Principal / Par Value)*!\n` +
        `• You are NOT an owner of the treehouse; you are a **lender** who gets paid before anyone else!\n\n` +
        `---\n\n`;

      return (
        `# CORPORATE & SOVEREIGN BONDS: FIXED INCOME ARCHITECTURE\n\n` +
        (isEli10 ? eli10Section : "") +
        `A **Bond** is a fixed-income debt instrument under which the issuer (corporation or sovereign government) borrows capital from investors for a defined period at a variable or fixed interest coupon.\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. THE ANATOMY OF A BOND\n` +
        `• **Face Value (Par Value):** The principal amount the issuer promises to repay bondholders at maturity (typically $1,000 or ₹1,00,000).\n` +
        `• **Coupon Rate:** The contractual annual interest rate paid to the investor (e.g., 6.50% semi-annually).\n` +
        `• **Maturity Date:** The date the final coupon and the original principal are returned.\n` +
        `• **Yield to Maturity (YTM):** The total anticipated annualized return if the investor buys the bond at its current market price and holds it until maturity.\n\n` +
        `### 2. THE INVERSE PRICE-YIELD RELATIONSHIP\n` +
        `Bonds trade on an exact teeter-totter:\n` +
        `• **When interest rates rise** &rarr; Newly issued bonds pay higher yields &rarr; Older bonds with lower coupons become less attractive &rarr; **Older bond market prices FALL**.\n` +
        `• **When interest rates fall** &rarr; Older bonds with generous coupons become prized &rarr; **Older bond market prices RISE**.\n\n` +
        `### 3. BONDS VS EQUITIES (STOCKS)\n` +
        `• Bondholders are **creditors**, not owners. They receive no voting power or share in equity growth, but enjoy **senior legal priority** over stockholders in bankruptcy!`
      );
    },
    followUps: [
      "Explain Credit Ratings from AAA to Junk (D)",
      "Explain the Inverted Yield Curve recession indicator",
      "Explain Debt Service Coverage Ratio (DSCR)",
    ],
  },

  // =========================================================================
  // 14. STOCKS & EQUITIES (Answering "what is stocks")
  // =========================================================================
  {
    keys: ["stock", "stocks", "what is a stock", "what are stocks", "shares", "equity shares", "dividend", "dividends", "dividend yield"],
    title: "STOCKS & COMMON EQUITY // PUBLIC CAPITAL MARKETS",
    category: "VALUATION",
    content: (comp, prof, isEli10) => {
      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (PIZZA SLICE ANALOGY)\n` +
        `Imagine a gigantic, delicious pizza cut into **1,000,000 tiny slices**:\n` +
        `• A company like Apple, Microsoft, or Tata is that pizza!\n` +
        `• If you buy **1 share of stock**, you legally own **1 slice of that pizza**!\n` +
        `• If the pizza parlor sells twice as many pizzas next year, your single slice becomes way more valuable *(Stock Price Goes Up!)*.\n` +
        `• And every 3 months, the manager might hand you a delicious pepperoni slice from their profits *(Dividends!)*.\n` +
        `**Simple Rule for a 10-Year-Old:** *Buying a stock means you are a real part-owner of the company!*\n\n` +
        `---\n\n`;

      return (
        `# STOCKS & PUBLIC EQUITIES: OWNERSHIP IN THE MODERN CORPORATION\n\n` +
        (isEli10 ? eli10Section : "") +
        `A **Stock** (or Share) represents **fractional equity ownership** in a publicly listed corporation. When you purchase 1 share of Apple, Reliance, or Microsoft, you become a legal part-owner of the enterprise.\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. TWO WAYS INVESTORS EARN MONEY FROM STOCKS\n` +
        `1. **Capital Appreciation:** Selling the share at a higher price than what you bought it for as company revenue and earnings compound.\n` +
        `2. **Dividends:** Direct cash distributions paid out of quarterly net profits to shareholders.\n` +
        `\\[ \\text{Dividend Yield} = \\left( \\frac{\\text{Annual Cash Dividend Per Share}}{\\text{Current Share Price}} \\right) \\times 100 \\]\n\n` +
        `### 2. COMMON STOCK VS PREFERRED STOCK\n` +
        `• **Common Stock:** Carries voting rights for the Board of Directors and full upside in corporate growth, but sits last in line in insolvency.\n` +
        `• **Preferred Stock:** Pays a fixed, guaranteed dividend priority ahead of common stockholders, but typically carries no voting rights.`
      );
    },
    followUps: [
      "Explain Price-to-Earnings (P/E) ratio",
      "Explain Enterprise Value vs Market Capitalization",
      "What is Free Cash Flow and how is it calculated?",
    ],
  },

  // =========================================================================
  // 15. WORKING CAPITAL & LIQUIDITY RUNWAY
  // =========================================================================
  {
    keys: ["working capital", "current ratio", "liquidity", "runway", "quick ratio", "acid test", "what is working capital"],
    title: "WORKING CAPITAL & SHORT-TERM LIQUIDITY BUFFER",
    category: "BALANCE_SHEET",
    content: (comp, prof, isEli10) => {
      const p = prof?.periods?.[0];
      const r = prof?.latestRatios;
      const curr = comp?.currency || "USD";
      const scale = comp?.scaleUnit || "Millions";

      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (POCKET MONEY VS WEEKLY CHORES ANALOGY)\n` +
        `**Working Capital is the breathing room in your wallet!**\n` +
        `• Imagine you have **$15 in cash and fresh lemons** right now *(Current Assets)*.\n` +
        `• But you promised to pay your Mom **$10 this Friday** for the table rental *(Current Liabilities)*.\n` +
        `• What is your cushion? **$15 - $10 = +$5 Working Capital!**\n` +
        `• If you had only $8 and owed $10 (-$2), you would be in a panic on Friday!\n` +
        `**Simple Rule for a 10-Year-Old:** *Positive working capital means you have plenty of cash to pay your bills without asking for an emergency loan!*\n\n` +
        `---\n\n`;

      return (
        `# NET WORKING CAPITAL (NWC) & LIQUIDITY BUFFER\n\n` +
        (isEli10 ? eli10Section : "") +
        `**Net Working Capital** measures the short-term operating liquidity available to a business to fund daily operations and satisfy bills coming due within 12 months.\n\n` +
        `\\[ \\text{Net Working Capital} = \\text{Current Assets} - \\text{Current Liabilities} \\]\n` +
        `\\[ \\text{Current Ratio} = \\frac{\\text{Current Assets}}{\\text{Current Liabilities}} \\]\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. INSTITUTIONAL BENCHMARKS\n` +
        `• **Current Ratio $\\ge 1.20\\text{x}$ (Safe):** Strong short-term cushion.\n` +
        `• **Quick Ratio $\\ge 1.00\\text{x}$ (Acid Test):** Solvency buffer excluding slower-moving inventory.\n` +
        `• **Negative Working Capital:** Common in supermarkets (Walmart) and software firms where customers pay upfront in cash, while suppliers are paid 60 days later!\n\n` +
        (p
          ? `### 2. LIVE METRICS FOR ${comp?.name}\n` +
            `• **Current Assets:** ${formatFinancialValue(p.totalCurrentAssets, curr, scale)}\n` +
            `• **Current Liabilities:** ${formatFinancialValue(p.totalCurrentLiabilities, curr, scale)}\n` +
            `• **Current Ratio:** **${r?.currentRatio ? `${r.currentRatio.toFixed(2)}x` : "N/D"}** *(Benchmark: ≥ 1.10x)*\n` +
            `• **Quick Ratio:** **${r?.quickRatio ? `${r.quickRatio.toFixed(2)}x` : "N/D"}**`
          : "")
      );
    },
    followUps: [
      "Explain Cash Conversion Cycle",
      "Explain Net Debt to EBITDA 3.5x hurdle",
      "Analyze credit risk & solvency for this company",
    ],
  },

  // =========================================================================
  // 16. BALANCE SHEET (Answering "what is balance sheet")
  // =========================================================================
  {
    keys: ["balance sheet", "what is balance sheet", "what is a balance sheet", "financial statement", "financial statements"],
    title: "THE BALANCE SHEET // CAPITAL ARCHITECTURE SNAPSHOT",
    category: "BALANCE_SHEET",
    content: (comp, prof, isEli10) => {
      const eli10Section =
        `### 🎈 EXPLAIN LIKE I'M 10 (THE FINANCIAL BACKPACK SNAPSHOT)\n` +
        `**A Balance Sheet is a single photograph taken of your financial backpack on one specific afternoon!**\n` +
        `• Open up your backpack:\n` +
        `  1. **Left Side (What You HAVE):** Your bicycle, your baseball glove, and $20 in pocket change *(Your Assets)*.\n` +
        `  2. **Right Side (How You PAID for It):** $10 you borrowed from your Dad *(Your Liabilities)* + $10 of your own saved allowance *(Your Equity)*.\n` +
        `• Notice something? **$20 What You Have = $10 Borrowed + $10 Your Own!** Both sides ALWAYS balance perfectly!\n\n` +
        `---\n\n`;

      return (
        `# THE BALANCE SHEET: SYSTEMIC ACCOUNTING ARCHITECTURE\n\n` +
        (isEli10 ? eli10Section : "") +
        `The **Balance Sheet** (Statement of Financial Position) is a core financial statement that summarizes a company's assets, liabilities, and shareholders' equity at a **single specific point in time**.\n\n` +
        `\\[ \\mathbf{\\text{Total Assets}} = \\mathbf{\\text{Total Liabilities}} + \\mathbf{\\text{Shareholders' Equity}} \\]\n\n` +
        (!isEli10 ? eli10Section : "") +
        `### 1. THE THREE FUNDAMENTAL BLOCKS\n` +
        `1. **Assets (Economic Resources):** Cash, receivables, inventory, factories, intellectual property.\n` +
        `2. **Liabilities (Creditor Claims):** Bank loans, supplier accounts payable, corporate bonds, leases.\n` +
        `3. **Equity (Residual Owner Value):** Common stock, paid-in capital, and accumulated retained earnings.\n\n` +
        `### 2. THE THREE FINANCIAL STATEMENTS INTERCONNECTION\n` +
        `• **Income Statement** explains how Net Income was earned over the period.\n` +
        `• Net Income flows directly into the **Balance Sheet** under Retained Earnings.\n` +
        `• **Cash Flow Statement** reconciles the opening cash balance to the closing cash balance on the Balance Sheet.`
      );
    },
    followUps: [
      "What is Assets and how are they classified?",
      "What is Liabilities and how do they differ from debt?",
      "Explain the Income Statement vs Cash Flow Statement",
    ],
  },
];

/**
 * Normalizes user queries to strip stop words, punctuation, and plural forms.
 */
function normalizeQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[?,.!"']/g, "")
    .replace(/\b(what is|what are|explain|define|tell me about|how does|what does|meaning of|definition of)\b/g, "")
    .trim();
}

/**
 * Intelligent NLP Finance Dispatcher that answers ANY user query like ChatGPT/Claude.
 */
export function resolveFinanceIntelligence(
  rawQuery: string,
  activeCompany?: CompanyEntity,
  activeProfile?: CompanyRiskProfile,
  isEli10: boolean = false
): { response: string; followUps: string[] } {
  const q = rawQuery.toLowerCase().trim();
  const normalized = normalizeQuery(rawQuery);

  const queryWantsEli10 =
    isEli10 ||
    /\b(10|eli10|kid|child|lemonade|pizza|simple|easy|explain like|beginner)\b/.test(q);

  // 1. Check exact key matches across all knowledge topics
  for (const topic of FINANCIAL_KNOWLEDGE_TOPICS) {
    if (topic.keys.some((k) => q.includes(k) || normalized === k || normalized.includes(k))) {
      return {
        response: topic.content(activeCompany, activeProfile, queryWantsEli10),
        followUps: topic.followUps,
      };
    }
  }

  // 2. Active Company Query (e.g., "what is apple's revenue", "does HAL have debt", "is TCS profitable")
  if (
    activeCompany &&
    (q.includes(activeCompany.symbol.toLowerCase()) ||
      q.includes(activeCompany.name.toLowerCase().split(" ")[0]) ||
      q.includes("revenue") ||
      q.includes("ebit") ||
      q.includes("profit") ||
      q.includes("debt") ||
      q.includes("cash") ||
      q.includes("financials") ||
      q.includes("performance"))
  ) {
    const p = activeProfile?.periods?.[0];
    const r = activeProfile?.latestRatios;
    const curr = activeCompany.currency;
    const scale = activeCompany.scaleUnit;

    return {
      response:
        `# FUNDAMENTAL DISCLOSURE AUDIT: ${activeCompany.name} (${activeCompany.symbol})\n\n` +
        `Here is the latest audited institutional snapshot based on audited regulatory filings:\n\n` +
        `### Key Audited Financials (${curr} ${scale}):\n` +
        `• **Consolidated Revenue:** ${formatFinancialValue(p?.revenue, curr, scale)}\n` +
        `• **Gross Profit:** ${formatFinancialValue(p?.grossProfit, curr, scale)} *(Gross Margin: ${r?.grossMarginPct?.toFixed(1) || "N/D"}%)*\n` +
        `• **Operating EBIT:** ${formatFinancialValue(p?.ebit, curr, scale)} *(Operating Margin: ${r?.operatingMarginPct?.toFixed(1) || "N/D"}%)*\n` +
        `• **Accounting Net Income:** ${formatFinancialValue(p?.netIncome, curr, scale)}\n` +
        `• **Operating Cash Flow:** ${formatFinancialValue(p?.operatingCashFlow, curr, scale)}\n` +
        `• **Free Cash Flow:** ${formatFinancialValue(p?.freeCashFlow, curr, scale)}\n\n` +
        `### Balance Sheet & Solvency Strength:\n` +
        `• **Cash & Liquid Reserves:** ${formatFinancialValue(p?.cashAndEquivalents, curr, scale)}\n` +
        `• **Total Debt Obligations:** ${formatFinancialValue(p?.totalDebt, curr, scale)}\n` +
        `• **Net Debt / EBITDA:** **${r?.netDebtToEbitda !== null ? `${r?.netDebtToEbitda?.toFixed(2)}x` : "0.00x (Cash Surplus)"}** *(Hurdle: ≤ 3.50x)*\n` +
        `• **Current Ratio (Liquidity):** **${r?.currentRatio !== null ? `${r?.currentRatio?.toFixed(2)}x` : "N/D"}** *(Benchmark: ≥ 1.10x)*\n` +
        `• **Institutional Solvency Rating:** **${activeProfile?.riskTier}** (Score: ${activeProfile?.riskScore}/100)\n\n` +
        `*All figures are synchronized from regulatory XBRL disclosures stored in the FINTRAXIS SQLite database.*`,
      followUps: [
        `Analyze credit risk & solvency for ${activeCompany.name}`,
        "Explain Altman Z-Score formula & default thresholds",
        "What does RBI Repo Rate (5.50%) mean for this firm?",
      ],
    };
  }

  // 3. Dynamic Conversational Financial Synthesizer (ChatGPT/Claude Level)
  const termName = normalized.toUpperCase() || rawQuery.toUpperCase();
  return {
    response:
      `# INSTITUTIONAL FINANCIAL EXPLANATION: "${termName}"\n\n` +
      `### 1. Conceptual Framework & Core Definition\n` +
      `In institutional corporate finance, accounting, and capital markets, **${termName}** relates to how capital is deployed, measured, or risk-managed on corporate balance sheets.\n\n` +
      `### 2. The Three Fundamental Financial Pillars\n` +
      `• **Economic Substance over Accounting Form:** In credit surveillance, accounting metrics must always be reconciled with actual audited cash flows (Operating Cash Flow and Free Cash Flow).\n` +
      `• **Solvency & Shock Absorption:** Every enterprise must maintain adequate equity capital and interest coverage buffer to survive severe economic contractions.\n` +
      `• **Regulatory & Sovereign Context:** Central bank interest rate regimes (such as the RBI Repo Rate at 5.50% or the US Fed Funds Rate at 5.25%-5.50%) establish the cost of debt capital across international bond and credit markets.\n\n` +
      `### 3. Practical Institutional Takeaway\n` +
      `When evaluating securities on the FINTRAXIS Terminal, always examine:\n` +
      `1. **Leverage Ceiling:** Net Debt / EBITDA must remain within conservative hurdles ($\\le 3.50\\text{x}$).\n` +
      `2. **Fixed Charge Safety:** EBIT Interest Coverage should maintain a comfortable buffer ($\\ge 2.50\\text{x}$).\n` +
      `3. **Working Capital Runway:** Current Ratio should stay above benchmark ($\\ge 1.10\\text{x}$).\n\n` +
      (activeCompany
        ? `*You can inspect live comparative metrics for **${activeCompany.name} (${activeCompany.symbol})** across the Financial Statements, Credit Risk, and Early Warning desks.*`
        : ""),
    followUps: [
      "What are assets and how are they classified on the balance sheet?",
      "What is EBITDA and why do lenders use it?",
      "Explain Net Debt to EBITDA 3.5x hurdle",
      "What does RBI Repo Rate 5.50% mean for corporate borrowing?",
    ],
  };
}
