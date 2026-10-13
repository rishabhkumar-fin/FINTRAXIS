"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  Send,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
} from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { INSTITUTIONAL_COMPANIES } from "@/lib/institutionalDatabase";
import { resolveFinanceIntelligence } from "@/lib/financeKnowledgeBase";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  relatedTerms?: string[];
  followUps?: string[];
}

interface FinancialAiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: CompanyRiskProfile | null;
}

export function FinancialAiAssistant({ isOpen, onClose, activeProfile }: FinancialAiAssistantProps) {
  const company = activeProfile?.company;
  const ratios = activeProfile?.latestRatios;
  const latestPeriod = activeProfile?.periods?.[0];
  const isIndianCompany =
    company?.country === "IND" ||
    company?.symbol.endsWith(".NS") ||
    company?.symbol.endsWith(".BO");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      sender: "ai",
      text: activeProfile
        ? `### 🏛️ Wall Street & Institutional Risk Intelligence Copilot\n\nI have loaded active surveillance data for **${company?.name} (${company?.symbol})**:\n\n• **Country & Currency:** ${company?.country} (${company?.currency} ${company?.scaleUnit})\n• **Accounting Regime:** ${company?.accountingStandard}\n• **Solvency Tier:** **${activeProfile.riskTier}** (Score: ${activeProfile.riskScore}/100)\n• **Net Debt / EBITDA:** ${ratios?.netDebtToEbitda !== null ? `${ratios?.netDebtToEbitda?.toFixed(2)}x` : "0.00x (Debt-Free)"}\n• **Interest Coverage:** ${ratios?.interestCoverage !== null ? `${ratios?.interestCoverage?.toFixed(2)}x` : "N/D"}\n\nI can analyze this company's creditworthiness, compute bankruptcy models, explain complex financial terms, or assess the impact of central bank interest rate hikes. What would you like to explore?`
        : "### 🏛️ Wall Street & Institutional Risk Intelligence Copilot\n\nWelcome to **FINTRAXIS Institutional Intelligence**. I provide deep credit underwriting memos, forensic accounting diagnostics (Altman Z-Score, Beneish M-Score), macro interest rate evaluations (RBI Repo 5.50%, US Fed Funds), and 3-statement financial analyses.\n\nAsk me any question or pick a suggested topic below to begin!",
      timestamp: "Just now",
      followUps: [
        "Analyze credit risk & solvency for this company",
        "Explain Altman Z-Score formula & default thresholds",
        "What does RBI Repo Rate (5.50%) mean for this firm?",
        "Explain Net Debt to EBITDA 3.5x hurdle",
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "intro_reset",
        sender: "ai",
        text: "Conversation cleared. Ready for your next institutional analysis or financial question!",
        timestamp: "Just now",
        followUps: [
          "Analyze credit risk & solvency for this company",
          "Explain Altman Z-Score formula & default thresholds",
          "What does RBI Repo Rate (5.50%) mean for this firm?",
        ],
      },
    ]);
  };

  const generateInstitutionalResponse = (query: string): { response: string; followUps: string[] } => {
    const q = query.toLowerCase().trim();

    // 1. SPECIFIC NAMED COMPANY LOOKUP OR ACTIVE COMPANY ANALYSIS
    const companyKeys = Object.keys(INSTITUTIONAL_COMPANIES);
    const matchedKey = companyKeys.find(
      (k) =>
        q.includes(k.toLowerCase()) ||
        q.includes(k.replace(".ns", "").replace(".t", "").toLowerCase()) ||
        q.includes(INSTITUTIONAL_COMPANIES[k].company.name.toLowerCase().split(" ")[0])
    );

    if (
      matchedKey ||
      q.includes("analyze") ||
      q.includes("credit risk") ||
      q.includes("solvency") ||
      q.includes("underwrite") ||
      q.includes("underwriting") ||
      q.includes("memo") ||
      q.includes("this company") ||
      q.includes("this firm")
    ) {
      const targetProfile = matchedKey ? INSTITUTIONAL_COMPANIES[matchedKey] : null;
      const targetCompany = targetProfile ? targetProfile.company : company;
      const targetPeriods = targetProfile ? targetProfile.periods : activeProfile?.periods;
      const targetLatest = targetPeriods?.[0];

      if (targetCompany && targetLatest) {
        const rev = targetLatest.revenue ?? 0;
        const ebit = targetLatest.ebit ?? 0;
        const netInc = targetLatest.netIncome ?? 0;
        const cash = targetLatest.cashAndEquivalents ?? 0;
        const debt = targetLatest.totalDebt ?? 0;
        const ocf = targetLatest.operatingCashFlow ?? 0;
        const scale = targetCompany.scaleUnit;
        const curr = targetCompany.currency;

        const netDebt = debt - cash;
        const ebitda = targetLatest.ebitda ?? ebit * 1.15;
        const leverage = ebitda > 0 ? netDebt / ebitda : 0;
        const interestExp = targetLatest.interestExpense ?? 0;
        const coverage = interestExp > 0 ? ebit / interestExp : null;
        const opMargin = rev > 0 ? (ebit / rev) * 100 : 0;

        const isDebtFree = debt === 0 || netDebt <= 0;
        const isSafeLeverage = leverage <= 3.5;
        const isSafeCoverage = coverage === null || coverage >= 2.5;

        return {
          response:
            `# INSTITUTIONAL CREDIT UNDERWRITING MEMORANDUM\n` +
            `**TARGET ENTITY:** ${targetCompany.name} (${targetCompany.symbol})\n` +
            `**JURISDICTION:** ${targetCompany.country} • **REGULATORY STANDARD:** ${targetCompany.accountingStandard}\n` +
            `**AUDIT PERIOD:** ${targetLatest.period} (${targetLatest.filingForm} Filed: ${targetLatest.filingDate})\n\n` +
            `---\n\n` +
            `### 1. EXECUTIVE SOLVENCY VERDICT\n` +
            `• **Underwriting Classification:** ${
              isDebtFree
                ? "**TIER 1 // PRIME INVESTMENT GRADE (FORTRESS BALANCE SHEET)**. The entity operates in a net-cash position with substantial liquidity reserves and superior operating cash conversion."
                : isSafeLeverage && isSafeCoverage
                ? "**TIER 1 // SOLVENT & COMPLIANT**. Leverage resides comfortably within standard syndicate hurdles with sufficient interest coverage."
                : "**TIER 2 / TIER 3 // WATCHLIST / DISTRESS**. Elevated gearing multiple or compressed fixed charge coverage requires structured monitoring."
            }\n\n` +
            `### 2. AUDITED FINANCIAL DISCLOSURES (${curr} ${scale})\n` +
            `• **Consolidated Revenue:** ${curr} ${rev.toLocaleString()} ${scale}\n` +
            `• **Operating Income (EBIT):** ${curr} ${ebit.toLocaleString()} ${scale} *(Operating Margin: ${opMargin.toFixed(1)}%)*\n` +
            `• **Reported Net Profit:** ${curr} ${netInc.toLocaleString()} ${scale}\n` +
            `• **Cash & Liquid Assets:** ${curr} ${cash.toLocaleString()} ${scale}\n` +
            `• **Total Funded Debt:** ${curr} ${debt.toLocaleString()} ${scale} *(Net Debt: ${curr} ${netDebt.toLocaleString()} ${scale})*\n` +
            `• **Cash Flow from Operations (CFO):** ${curr} ${ocf.toLocaleString()} ${scale}\n\n` +
            `### 3. COVENANT BENCHMARKS & HEALTH MULTIPLES\n` +
            `• **Net Debt / EBITDA:** **${isDebtFree ? "0.00x (Net Cash Positive)" : `${leverage.toFixed(2)}x`}** *(Institutional Hurdle: $\\le 3.50\\text{x}$) — ${isDebtFree || isSafeLeverage ? "Compliant ✅" : "Breach ⚠️"}*\n` +
            `• **EBIT Interest Coverage:** **${coverage !== null ? `${coverage.toFixed(2)}x` : "N/A (Zero Interest Draw)"}** *(Covenant Floor: $\\ge 2.50\\text{x}$) — ${isSafeCoverage ? "Compliant ✅" : "Tight Buffer ⚠️"}*\n\n` +
            `### 4. CENTRAL BANK SENSITIVITY & MACRO TRANSMISSION\n` +
            `${
              targetCompany.country === "IND"
                ? `Operates in India with benchmark funding tied to the **RBI Repo Rate (5.50%)**. ${
                    isDebtFree
                      ? `Because ${targetCompany.name} is debt-free, monetary tightening actually generates accretive interest income on its ${curr} ${cash.toLocaleString()} ${scale} cash reserves!`
                      : `A 100 bps repo rate shift impacts annual interest outlays by approximately ${curr} ${(debt * 0.01).toFixed(1)} ${scale}.`
                  }`
                : `Reports under ${targetCompany.country} monetary regime. Funding is anchored to sovereign benchmark yields and central bank policy rates.`
            }`,
          followUps: [
            `What is the Altman Z-Score for ${targetCompany.name}?`,
            "Explain Beneish M-Score for earnings fraud",
            "What does RBI Repo Rate (5.50%) mean for corporate debt?",
            "Explain Net Debt / EBITDA 3.5x hurdle",
          ],
        };
      }
    }

    // 2. ALTMAN Z-SCORE
    if (q.includes("altman") || q.includes("z-score") || q.includes("bankruptcy") || q.includes("distress model")) {
      return {
        response:
          `# QUANTITATIVE METHODOLOGY: ALTMAN Z-SCORE DISTRESS MODEL\n\n` +
          `Developed by Prof. Edward Altman at NYU Stern, the **Altman Z-Score** is the global standard multi-factor linear discriminant model for predicting corporate bankruptcy within 24 months.\n\n` +
          `### 1. MATHEMATICAL FORMULATION\n` +
          `\\[ Z = 1.2 X_1 + 1.4 X_2 + 3.3 X_3 + 0.6 X_4 + 0.999 X_5 \\]\n\n` +
          `Where the five financial ratios represent:\n` +
          `• **$X_1 = \\frac{\\text{Working Capital}}{\\text{Total Assets}}$:** Short-term net liquidity buffer against unexpected cash burn.\n` +
          `• **$X_2 = \\frac{\\text{Retained Earnings}}{\\text{Total Assets}}$:** Cumulative profitability and enterprise longevity (rewards seasoned operators over debt-funded startups).\n` +
          `• **$X_3 = \\frac{\\text{EBIT}}{\\text{Total Assets}}$:** True asset earning power before interest expense and tax deductions (**heaviest weight: 3.3x**).\n` +
          `• **$X_4 = \\frac{\\text{Market Value of Equity}}{\\text{Total Liabilities}}$:** Market debt capacity; measures how much enterprise value can drop before liabilities exceed assets.\n` +
          `• **$X_5 = \\frac{\\text{Sales}}{\\text{Total Assets}}$:** Asset turnover efficiency; how dynamically management deploys capital to generate turnover.\n\n` +
          `### 2. INSTITUTIONAL RATING THRESHOLDS\n` +
          `• **Safe Zone ($Z > 2.99$):** Probability of default $< 5\\%$. Strong balance sheet, investment grade equivalent (AAA down to BBB).\n` +
          `• **Grey Zone ($1.81 \\le Z \\le 2.99$):** Moderate vulnerability. Placed on institutional watchlist for quarterly covenant review.\n` +
          `• **Distress Zone ($Z < 1.81$):** High insolvency probability ($> 75\\%$ within 2 years). Senior lenders restrict borrowing lines.\n\n` +
          (company
            ? `### 3. LIVE APPLICATION TO ${company.name}\n` +
              `Under the FINTRAXIS Solvency Matrix, ${company.name} is classified in **${activeProfile?.riskTier}** with a composite health score of **${activeProfile?.riskScore}/100**.`
            : ""),
        followUps: [
          "Explain Beneish M-Score for earnings manipulation",
          "Explain Piotroski 9-Point F-Score",
          "Analyze credit risk & solvency for this company",
        ],
      };
    }

    // 3. BENEISH M-SCORE
    if (q.includes("beneish") || q.includes("m-score") || q.includes("manipulation") || q.includes("fraud") || q.includes("forensic")) {
      return {
        response:
          `# FORENSIC ACCOUNTING: BENEISH M-SCORE EARNINGS FRAUD MODEL\n\n` +
          `The **Beneish M-Score** is a mathematical model that uses 8 financial ratios to determine whether a public company has manipulated its recorded earnings (famously flagged Enron prior to collapse).\n\n` +
          `### 1. MATHEMATICAL FORMULATION\n` +
          `\\[ M = -4.84 + 0.920 \\cdot \\text{DSRI} + 0.528 \\cdot \\text{GMI} + 0.404 \\cdot \\text{AQI} + 0.892 \\cdot \\text{SGI} + 0.115 \\cdot \\text{DEPI} - 0.172 \\cdot \\text{SGAI} + 4.037 \\cdot \\text{TATA} + 0.0327 \\cdot \\text{LVGI} \\]\n\n` +
          `### 2. THE 8 FORENSIC VECTORS\n` +
          `1. **DSRI (Days Sales in Receivables Index):** $\\frac{\\text{Receivables}_t / \\text{Sales}_t}{\\text{Receivables}_{t-1} / \\text{Sales}_{t-1}}$ — Flags premature revenue recognition or channel stuffing.\n` +
          `2. **GMI (Gross Margin Index):** $\\frac{\\text{Gross Margin}_{t-1}}{\\text{Gross Margin}_t}$ — Deteriorating margins create incentives to manipulate earnings.\n` +
          `3. **AQI (Asset Quality Index):** $\\frac{1 - (\\text{CA}_t + \\text{PPE}_t) / \\text{TA}_t}{1 - (\\text{CA}_{t-1} + \\text{PPE}_{t-1}) / \\text{TA}_{t-1}}$ — Unusually high intangible asset capitalization.\n` +
          `4. **SGI (Sales Growth Index):** High growth firms face market pressure to maintain unrealistic trajectories.\n` +
          `5. **DEPI (Depreciation Index):** Depreciating assets slower to artificially reduce expenses.\n` +
          `6. **SGAI (Sales, General & Admin Expense Index):** Disproportionate administrative overhead.\n` +
          `7. **LVGI (Leverage Index):** Rising debt ratios increase covenant breach incentives.\n` +
          `8. **TATA (Total Accruals to Total Assets):** $\\frac{\\text{Net Income} - \\text{CFO}}{\\text{Total Assets}}$ — High accruals without real operating cash flow is a cardinal fraud signal!\n\n` +
          `### 3. INTERPRETATION BENCHMARK\n` +
          `• **$M > -1.78$:** High probability of earnings manipulation / aggressive accounting.\n` +
          `• **$M \\le -1.78$:** Low probability of earnings manipulation. Clean audit profile.`,
        followUps: [
          "Explain Altman Z-Score formula & default thresholds",
          "What is CFO / Net Income Cash Conversion ratio?",
          "Analyze credit risk & solvency for this company",
        ],
      };
    }

    // 4. PIOTROSKI F-SCORE
    if (q.includes("piotroski") || q.includes("f-score")) {
      return {
        response:
          `# FUNDAMENTAL SCREENING: PIOTROSKI 9-POINT F-SCORE\n\n` +
          `Devised by Stanford Accounting Professor Joseph Piotroski, the **F-Score** evaluates a company's financial turnaround across 9 binary criteria (score ranges from 0 to 9).\n\n` +
          `### 1. PROFITABILITY SIGNALS (4 Points)\n` +
          `1. **Positive Net Income (ROA > 0)**: 1 point if positive net income in current year.\n` +
          `2. **Positive Operating Cash Flow (CFO > 0)**: 1 point if operating cash flow is positive.\n` +
          `3. **Higher ROA YoY**: 1 point if ROA is higher than prior year.\n` +
          `4. **Quality of Earnings (CFO > Net Income)**: 1 point if cash from operations exceeds reported net income.\n\n` +
          `### 2. LEVERAGE, LIQUIDITY & DILUTION SIGNALS (3 Points)\n` +
          `5. **Lower Long-Term Debt YoY**: 1 point if long-term debt-to-assets decreased.\n` +
          `6. **Higher Current Ratio YoY**: 1 point if liquidity ratio improved.\n` +
          `7. **Zero Equity Dilution**: 1 point if no new common shares were issued.\n\n` +
          `### 3. OPERATING EFFICIENCY SIGNALS (2 Points)\n` +
          `8. **Higher Gross Margin YoY**: 1 point if gross margin expanded.\n` +
          `9. **Higher Asset Turnover YoY**: 1 point if Sales / Total Assets increased.\n\n` +
          `### 4. GRADING SCALE\n` +
          `• **8 - 9 Points:** Exceptional fundamental health. Pristine investment candidate.\n` +
          `• **5 - 7 Points:** Stable median corporate performer.\n` +
          `• **0 - 4 Points:** Financially fragile, value trap or severe structural distress.`,
        followUps: [
          "Explain DuPont 3-part & 5-part decomposition",
          "Explain Altman Z-Score formula & default thresholds",
          "Analyze credit risk & solvency for this company",
        ],
      };
    }

    // 5. CURRENT RATIO & QUICK RATIO & LIQUIDITY
    if (
      q.includes("current ratio") ||
      q.includes("quick ratio") ||
      q.includes("acid test") ||
      q.includes("liquidity") ||
      q.includes("cash ratio")
    ) {
      return {
        response:
          `# BALANCE SHEET LIQUIDITY RUNWAY & SHORT-TERM SOLVENCY\n\n` +
          `Liquidity ratios measure whether a firm can satisfy its short-term debt obligations (due within 12 months) without needing external emergency financing.\n\n` +
          `### 1. CURRENT RATIO\n` +
          `\\[ \\text{Current Ratio} = \\frac{\\text{Total Current Assets}}{\\text{Total Current Liabilities}} \\]\n` +
          `• **Benchmark Hurdle:** $\\ge 1.20\\text{x}$ (Safe buffer: 1.50x to 2.00x).\n` +
          `• **Plain-English Meaning:** A current ratio of $1.50\\text{x}$ means the company holds **$1.50 in short-term assets for every $1.00 of bills coming due within a year**.\n\n` +
          `### 2. QUICK (ACID-TEST) RATIO\n` +
          `\\[ \\text{Quick Ratio} = \\frac{\\text{Cash} + \\text{Marketable Securities} + \\text{Accounts Receivable}}{\\text{Total Current Liabilities}} \\]\n` +
          `• **Why Exclude Inventory?** In a liquidity crunch, inventories (raw steel, unsellable inventory) cannot be converted to cash instantly without severe markdown losses.\n` +
          `• **Benchmark Hurdle:** $\\ge 1.00\\text{x}$.\n\n` +
          `### 3. CASH RATIO\n` +
          `\\[ \\text{Cash Ratio} = \\frac{\\text{Cash \\& Equivalents}}{\\text{Total Current Liabilities}} \\]\n` +
          `• The ultimate conservative solvency test. Hurdle: $\\ge 0.20\\text{x}$.\n\n` +
          (company && ratios
            ? `### 4. LIVE NUMBERS FOR ${company.name}\n` +
              `• Current Ratio: **${ratios.currentRatio?.toFixed(2) || "N/D"}x** *(Status: ${(ratios.currentRatio ?? 0) >= 1.2 ? "Healthy ✅" : "Tight ⚠️"})*\n` +
              `• Quick Ratio: **${ratios.quickRatio?.toFixed(2) || "N/D"}x**\n` +
              `• Cash Ratio: **${ratios.cashRatio?.toFixed(2) || "N/D"}x**`
            : ""),
        followUps: [
          "Explain Net Debt to EBITDA 3.5x hurdle",
          "Explain EBIT Interest Coverage & DSCR",
          "Analyze credit risk & solvency for this company",
        ],
      };
    }

    // 6. NET DEBT / EBITDA & LEVERAGE
    if (
      q.includes("ebitda") ||
      q.includes("net debt") ||
      q.includes("leverage") ||
      q.includes("debt-to-equity") ||
      q.includes("gearing")
    ) {
      return {
        response:
          `# CREDIT RISK BENCHMARK: NET DEBT / EBITDA & GEARING MULTIPLES\n\n` +
          `The **Net Debt / EBITDA multiple** is the primary leverage metric used by Wall Street syndicates, rating agencies (S&P, Moody's, CRISIL), and private credit funds to govern borrowing covenants.\n\n` +
          `### 1. MATHEMATICAL FORMULATION\n` +
          `\\[ \\text{Net Debt / EBITDA} = \\frac{(\\text{Short-Term Debt} + \\text{Long-Term Debt}) - \\text{Cash \\& Equivalents}}{\\text{EBITDA}} \\]\n\n` +
          `### 2. INSTITUTIONAL THRESHOLDS & RATINGS\n` +
          `• **$< 1.50\\text{x}$ (Prime Investment Grade / Low Risk):** Highly solvent balance sheet. Rapid debt repayment capacity.\n` +
          `• **$1.50\\text{x} - 3.50\\text{x}$ (Standard Corporate Hurdle):** Manageable leverage. Standard investment-grade threshold.\n` +
          `• **$3.50\\text{x} - 5.00\\text{x}$ (Elevated Leverage / Watchlist):** Syndicate covenant restrictions trigger; cash flow sweeps enforced.\n` +
          `• **$> 5.00\\text{x}$ (Distressed / High Yield):** Severely over-levered. High vulnerability to revenue contractions and interest rate hikes.\n` +
          `• **Negative Multiple:** Company holds **more cash than total debt** (Net Cash Position / Fortress Balance Sheet)!\n\n` +
          `### 3. DEBT-TO-EQUITY (D/E) RATIO\n` +
          `\\[ \\text{D/E} = \\frac{\\text{Total Debt}}{\\text{Total Shareholders' Equity}} \\]\n` +
          `• Prudent ceiling: $\\le 1.50\\text{x}$ for industrial firms, $\\le 0.50\\text{x}$ for tech operators.\n\n` +
          (company && ratios
            ? `### 4. LIVE POSITION FOR ${company.name}\n` +
              `• Net Debt / EBITDA: **${ratios.netDebtToEbitda !== null ? `${ratios.netDebtToEbitda.toFixed(2)}x` : "0.00x"}**\n` +
              `• Debt to Equity: **${ratios.debtToEquity !== null ? `${ratios.debtToEquity.toFixed(2)}x` : "0.00x"}**\n` +
              `• Status: **${(ratios.netDebtToEbitda ?? 0) <= 3.5 ? "COVENANT COMPLIANT ✅" : "ELEVATED RISK ⚠️"}**`
            : ""),
        followUps: [
          "Explain EBIT Interest Coverage & DSCR",
          "What does RBI Repo Rate (5.50%) mean for this firm?",
          "Analyze credit risk & solvency for this company",
        ],
      };
    }

    // 7. INTEREST COVERAGE & DSCR
    if (
      q.includes("interest coverage") ||
      q.includes("tie") ||
      q.includes("dscr") ||
      q.includes("debt service")
    ) {
      return {
        response:
          `# FIXED CHARGE CAPACITY: EBIT INTEREST COVERAGE & DSCR\n\n` +
          `Interest coverage evaluates whether a company generates enough operating profits to pay interest on its bank loans and bonds without burning cash.\n\n` +
          `### 1. EBIT INTEREST COVERAGE (TIMES INTEREST EARNED - TIE)\n` +
          `\\[ \\text{Interest Coverage} = \\frac{\\text{Operating Income (EBIT)}}{\\text{Gross Interest Expense}} \\]\n` +
          `• **Institutional Floor:** $\\ge 2.50\\text{x}$ (Investment Grade: $> 4.00\\text{x}$).\n` +
          `• **Distress Zone:** $< 1.50\\text{x}$ means the company is dangerously close to default if earnings dip even slightly.\n\n` +
          `### 2. DEBT SERVICE COVERAGE RATIO (DSCR)\n` +
          `\\[ \\text{DSCR} = \\frac{\\text{Net Operating Income}}{\\text{Interest Expense} + \\text{Principal Amortization}} \\]\n` +
          `• Unlike simple interest coverage, DSCR factors in **mandatory loan principal repayments**.\n` +
          `• Bank standard minimum: $\\ge 1.25\\text{x}$ to $1.50\\text{x}$.\n\n` +
          (company && ratios
            ? `### 3. LIVE POSITION FOR ${company.name}\n` +
              `• Current EBIT Interest Coverage: **${ratios.interestCoverage !== null ? `${ratios.interestCoverage.toFixed(2)}x` : "N/D (Zero Interest)"}**\n` +
              `• Covenant Tolerance: $\\ge 2.50\\text{x}$ *(Status: ${(ratios.interestCoverage ?? 99) >= 2.5 ? "Ample Debt Service Buffer ✅" : "Tight Buffer ⚠️"})*`
            : ""),
        followUps: [
          "Explain Net Debt to EBITDA 3.5x hurdle",
          "What does RBI Repo Rate (5.50%) mean for this firm?",
          "Explain Cash Burn Runway & Working Capital",
        ],
      };
    }

    // 8. DUPONT ANALYSIS & ROE / ROA
    if (q.includes("dupont") || q.includes("roe") || q.includes("roa") || q.includes("return on equity")) {
      return {
        response:
          `# STRATEGIC CAPITAL DECOMPOSITION: DUPONT ANALYSIS\n\n` +
          `Invented by the DuPont Corporation, this framework decomposes **Return on Equity (ROE)** into underlying operational drivers to reveal whether returns stem from high margins, efficient asset use, or dangerous debt leverage.\n\n` +
          `### 1. THE CLASSIC 3-PART DUPONT EQUATION\n` +
          `\\[ \\text{ROE} = \\underbrace{\\frac{\\text{Net Income}}{\\text{Sales}}}_{\\text{Net Profit Margin}} \\times \\underbrace{\\frac{\\text{Sales}}{\\text{Total Assets}}}_{\\text{Asset Turnover}} \\times \\underbrace{\\frac{\\text{Total Assets}}{\\text{Equity}}}_{\\text{Equity Multiplier (Leverage)}} \\]\n\n` +
          `### 2. KEY ANALYTIC INSIGHTS\n` +
          `• **Margin Driver:** High ROE from Net Margin reflects pricing power and brand moat (e.g. Apple, Nvidia).\n` +
          `• **Turnover Driver:** High ROE from Asset Turnover reflects lean supply chain and inventory velocity (e.g. Costco, Walmart).\n` +
          `• **Leverage Warning:** If ROE is high *only* because Equity Multiplier is 6x or 8x, management is juicing shareholder returns with dangerous balance sheet debt!\n\n` +
          `### 3. RETURN ON ASSETS (ROA)\n` +
          `\\[ \\text{ROA} = \\frac{\\text{Net Income}}{\\text{Total Assets}} \\]\n` +
          `• Unlevered measure of how efficiently every dollar of corporate assets generates profit. Hurdle: $> 8\\%$.`,
        followUps: [
          "Explain Altman Z-Score formula & default thresholds",
          "Explain Net Debt to EBITDA 3.5x hurdle",
          "Analyze credit risk & solvency for this company",
        ],
      };
    }

    // 9. REPO RATE & CENTRAL BANKS (RBI / FED / BOJ)
    if (
      q.includes("repo") ||
      q.includes("rbi") ||
      q.includes("fed") ||
      q.includes("interest rate") ||
      q.includes("boj") ||
      q.includes("central bank") ||
      q.includes("inflation")
    ) {
      return {
        response:
          `# MACROECONOMIC LIQUIDITY & CENTRAL BANK TRANSMISSION\n\n` +
          `Central bank policy rates dictate the price of credit throughout corporate capital markets.\n\n` +
          `### 1. RBI REPO RATE (INDIA: 5.50%)\n` +
          `The **Repo Rate** is the benchmark policy rate at which the Reserve Bank of India lends liquidity to commercial banks against sovereign G-Sec collateral.\n` +
          `• **Current Standing Policy:** Repo Rate: **5.50%** | SDF: **5.25%** | MSF: **5.75%**.\n` +
          `• **Corporate Impact:** Under RBI regulations, all floating-rate corporate credit lines are mandated to benchmark to external benchmarks (EBLR or MCLR). When RBI shifts repo rates:\n` +
          `  1. Corporate working capital borrowing costs adjust immediately.\n` +
          `  2. Commercial Paper (CP) yields and 91-day T-bill yields shift in lockstep.\n` +
          `  3. Companies with high floating-rate debt face contracting Interest Coverage Ratios.\n\n` +
          `### 2. US FEDERAL FUNDS RATE (USA: 5.25% - 5.50%)\n` +
          `• Set by the FOMC, this overnight benchmark anchors global dollar liquidity and SOFR.\n` +
          `• A strong dollar increases cross-border debt servicing costs for emerging market firms with dollar-denominated External Commercial Borrowings (ECBs).\n\n` +
          `### 3. BANK OF JAPAN (BOJ: 0.25%)\n` +
          `• The Bank of Japan's rate normalization shifts the global **Yen Carry Trade**, where hedge funds borrow cheap JPY to invest in higher-yielding global equities and bonds.\n\n` +
          (isIndianCompany && company
            ? `### 4. TRANSMISSION TO ${company.name}\n` +
              `Because ${company.name} reports in **INR Crores**, its funding environment is directly governed by RBI liquidity operations. ${
                (latestPeriod?.totalDebt ?? 0) === 0
                  ? `However, since ${company.name} operates **virtually debt-free**, elevated repo rates **benefit** the firm by boosting yield on its substantial cash reserves!`
                  : `Its floating debt obligations experience higher carrying costs under elevated rates.`
              }`
            : ""),
        followUps: [
          "Explain Net Debt to EBITDA 3.5x hurdle",
          "Explain EBIT Interest Coverage & DSCR",
          "Analyze credit risk & solvency for this company",
        ],
      };
    }

    // 10. ACCOUNTING REGIMES & XBRL (IND-AS vs US-GAAP vs IFRS)
    if (
      q.includes("ind-as") ||
      q.includes("ifrs") ||
      q.includes("gaap") ||
      q.includes("xbrl") ||
      q.includes("crore") ||
      q.includes("lakh")
    ) {
      return {
        response:
          `# STATUTORY ACCOUNTING STANDARDS & XBRL AUDIT TAXONOMY\n\n` +
          `### 1. IND-AS (INDIA) VS US-GAAP (USA) VS IFRS (GLOBAL)\n` +
          `• **Ind-AS 116 / IFRS 16 (Leases):** Requires all operating leases > 12 months to be capitalized on the balance sheet as Right-of-Use (ROU) Assets with matching Lease Liabilities. This inflates recorded EBITDA and gross debt.\n` +
          `• **US-GAAP (ASC 842):** Distinguishes operating leases from finance leases, preserving classical operating lease expense presentation in operating cash flows.\n` +
          `• **Numerical Scaling Units:**\n` +
          `  - **Crore (₹):** $10^7 = 10,000,000$ (Ten Million).\n` +
          `  - **Lakh (₹):** $10^5 = 100,000$ (One Hundred Thousand).\n` +
          `  - FINTRAXIS standardizes Indian filings in **INR Crores** and US filings in **USD Millions** seamlessly.\n\n` +
          `### 2. DIGITAL XBRL AUDIT LINEAGE\n` +
          `**eXtensible Business Reporting Language (XBRL)** is the global standard for machine-readable financial filings:\n` +
          `• Every cell in Module 02 is tagged with its official regulatory taxonomy (e.g. \`us-gaap:Revenues\` or \`ind-as:RevenueFromOperations\`).\n` +
          `• Clicking any cell in the ledger opens the **Audit Drawer**, presenting the original regulatory filing form (10-K, MCA/BSE Annual Report), filing date, and calculation tree.`,
        followUps: [
          "Analyze credit risk & solvency for this company",
          "Explain Altman Z-Score formula & default thresholds",
          "What does RBI Repo Rate (5.50%) mean for this firm?",
        ],
      };
    }

    // 11. PLATFORM GUIDE & DASHBOARD USAGE
    if (
      q.includes("fintraxis") ||
      q.includes("dashboard") ||
      q.includes("how to use") ||
      q.includes("guide") ||
      q.includes("modules") ||
      q.includes("features") ||
      q.includes("terminal")
    ) {
      return {
        response:
          `# FINTRAXIS INSTITUTIONAL TERMINAL ARCHITECTURE\n\n` +
          `FINTRAXIS is an institutional-grade Credit Risk & Solvency Intelligence Terminal designed for investment committees, sovereign wealth analysts, and corporate credit desks.\n\n` +
          `### The 6 Core Modules:\n` +
          `1. **[01] COMPANY HUB:** Global multi-currency search omnibar (\`Ctrl+K\`). Ingests any public equity worldwide (NSE, BSE, NASDAQ, NYSE, TSE) with real-time market pricing.\n` +
          `2. **[02] STATEMENTS LEDGER:** Auditable 3-statement financial ledger (P&L, Balance Sheet, Cash Flow) across 3 fiscal periods with XBRL audit trail drawer.\n` +
          `3. **[03] SOLVENCY & HEALTH DAG:** Deterministic Directed Acyclic Graph (DAG) evaluating 9 critical solvency, liquidity, and capital conversion ratios.\n` +
          `4. **[04] VULNERABILITY MONITOR:** Automated Early Warning System (EWS) flagging covenant breaches, margin contraction, and debt service risks against Basel III standards.\n` +
          `5. **[05] STRESS SIMULATOR:** Real-time pro-forma scenario engine testing revenue shocks (-25%), inflation (+10%), and central bank interest rate hikes (+350 bps).\n` +
          `6. **[06] IC DOSSIER:** Production-grade Investment Committee Underwriting Memorandum ready for 1-click printing, clipboard export, and markdown signoff.`,
        followUps: [
          "Analyze credit risk & solvency for this company",
          "Explain Altman Z-Score formula & default thresholds",
          "Explain how the Stress Simulator works",
        ],
      };
    }

    // 12. COMPREHENSIVE WALL STREET & ACADEMIC FINANCIAL KNOWLEDGE ENGINE (CHATGPT / CLAUDE LEVEL)
    return resolveFinanceIntelligence(query, company, activeProfile || undefined);
  };

  const handleSend = (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const userMessage: Message = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");

    setTimeout(() => {
      const { response, followUps } = generateInstitutionalResponse(cleanText);
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        followUps,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 280);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-0 bottom-0 right-0 z-50 bg-[#0A0E17] border-l border-[#1E2536] shadow-2xl flex flex-col font-mono text-xs transition-all duration-200 ${
        isExpanded ? "w-full md:w-[780px]" : "w-full sm:w-[540px]"
      }`}
    >
      {/* Top Header */}
      <div className="p-3.5 bg-[#0D111A] border-b border-[#1E2536] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[#F8FAFC] flex items-center gap-2 text-xs">
              <span>FINANCIAL AI RISK COPILOT</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#10B981]/10 border border-[#10B981]/40 text-[#10B981] font-semibold rounded">
                SOVEREIGN
              </span>
            </div>
            <div className="text-[10px] text-[#64748B]">
              {company
                ? `Active Context: ${company.name} (${company.symbol})`
                : "Institutional Intelligence Engine"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearChat}
            className="p-1.5 hover:bg-[#1E2536] text-[#94A3B8] hover:text-[#F8FAFC] rounded transition-colors"
            title="Reset Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 hover:bg-[#1E2536] text-[#94A3B8] hover:text-[#F8FAFC] rounded transition-colors"
            title={isExpanded ? "Restore width" : "Expand width"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#1E2536] text-[#94A3B8] hover:text-[#F8FAFC] rounded transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="p-2.5 bg-[#080B10] border-b border-[#1E2536] flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px]">
        <span className="text-[#64748B] text-[9.5px] uppercase whitespace-nowrap mr-1">TOP TOPICS:</span>
        <button
          onClick={() => handleSend(`Analyze credit risk for ${company?.name || "current company"}`)}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] hover:border-[#C5A880] text-[#C5A880] rounded whitespace-nowrap transition-colors"
        >
          🔍 Underwriting Memo
        </button>
        <button
          onClick={() => handleSend("Explain Altman Z-Score formula and default thresholds")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] hover:border-[#C5A880] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          📉 Altman Z-Score
        </button>
        <button
          onClick={() => handleSend("Explain Beneish M-Score for earnings fraud")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] hover:border-[#C5A880] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          🕵️ Beneish M-Score
        </button>
        <button
          onClick={() => handleSend("What does RBI Repo Rate 5.50% mean for corporate borrowing?")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] hover:border-[#C5A880] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          🇮🇳 RBI Repo Rate
        </button>
        <button
          onClick={() => handleSend("Explain Net Debt to EBITDA 3.5x hurdle")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] hover:border-[#C5A880] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          📊 Net Debt/EBITDA
        </button>
        <button
          onClick={() => handleSend("Explain DuPont 3-part and 5-part decomposition")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] hover:border-[#C5A880] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          📈 DuPont Analysis
        </button>
        <button
          onClick={() => handleSend("Explain Free Cash Flow and how it differs from Net Income")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] hover:border-[#C5A880] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          💰 Free Cash Flow (FCF)
        </button>
        <button
          onClick={() => handleSend("Explain WACC and how it is calculated")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] hover:border-[#C5A880] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          ⚖️ WACC &amp; Hurdle
        </button>
        <button
          onClick={() => handleSend("Explain corporate bankruptcy Chapter 11 and creditor priority")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] hover:border-[#C5A880] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          🏛️ Bankruptcy &amp; Restructuring
        </button>
        <button
          onClick={() => handleSend("How does FINTRAXIS work and how to navigate the 6 modules?")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] hover:border-[#C5A880] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          💡 Platform Guide
        </button>
      </div>

      {/* Main Conversation Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#64748B]">
              <span>{m.sender === "user" ? "RISK OPERATOR" : "FINTRAXIS AI"}</span>
              <span>&bull;</span>
              <span>{m.timestamp}</span>
            </div>

            <div
              className={`p-4 rounded-lg max-w-[95%] leading-relaxed text-xs relative group ${
                m.sender === "user"
                  ? "bg-[#C5A880] text-[#080B10] font-semibold"
                  : "bg-[#0E131A] border border-[#1E2536] text-[#E2E8F0]"
              }`}
            >
              {/* Copy message button */}
              {m.sender === "ai" && (
                <button
                  onClick={() => handleCopy(m.id, m.text)}
                  className="absolute top-2.5 right-2.5 p-1 bg-[#12161F] border border-[#1E2536] text-[#94A3B8] hover:text-[#F8FAFC] rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Copy analysis"
                >
                  {copiedId === m.id ? (
                    <Check className="w-3 h-3 text-[#10B981]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}

              <div className="whitespace-pre-wrap font-sans text-xs leading-normal">
                {m.text}
              </div>

              {/* Follow-up Question Chips */}
              {m.followUps && m.followUps.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#1E2536] space-y-1.5">
                  <div className="text-[9.5px] text-[#C5A880] font-bold uppercase flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-[#C5A880]" />
                    <span>RECOMMENDED FOLLOW-UP ANALYSES:</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {m.followUps.map((fu, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(fu)}
                        className="text-left px-2.5 py-1.5 bg-[#12161F] hover:bg-[#1A2233] border border-[#1E2536] hover:border-[#C5A880]/50 text-[#CBD5E1] text-[10.5px] rounded transition-colors flex items-center justify-between"
                      >
                        <span>{fu}</span>
                        <span className="text-[#C5A880] text-[10px]">&rarr;</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputQuery);
        }}
        className="p-3 bg-[#0D111A] border-t border-[#1E2536] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask any question, term, formula, or company analysis..."
          className="flex-1 px-3.5 py-2.5 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] placeholder-[#475569] text-xs font-mono rounded focus:border-[#C5A880] focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim()}
          className="px-4 py-2.5 bg-[#C5A880] hover:bg-[#D4B996] text-[#080B10] font-bold text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-sm"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
