"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  Send,
  BookOpen,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  relatedTerms?: string[];
}

interface FinancialAiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: CompanyRiskProfile | null;
}

const KNOWLEDGE_BASE: Record<
  string,
  {
    title: string;
    category: string;
    summary: string;
    formula?: string;
    benchmark?: string;
    details: string;
  }
> = {
  "altman-z": {
    title: "Altman Z-Score (Distress Prediction)",
    category: "Solvency & Default Risk",
    summary:
      "A quantitative scoring formula developed by NYU Professor Edward Altman to predict the probability that a company will enter bankruptcy within two years.",
    formula: "Z = 1.2*(Working Cap/Assets) + 1.4*(Retained Earnings/Assets) + 3.3*(EBIT/Assets) + 0.6*(Market Cap/Total Liab) + 1.0*(Sales/Assets)",
    benchmark: "Safe Zone: > 2.99 | Grey Zone: 1.81 - 2.99 | Distress Zone: < 1.81",
    details:
      "A score below 1.81 signals high insolvency risk. The model heavily penalizes depleted working capital and operational losses (negative EBIT).",
  },
  "beneish-m": {
    title: "Beneish M-Score (Earnings Manipulation)",
    category: "Accounting Forensics",
    summary:
      "A mathematical composite of 8 financial ratios designed to detect whether a corporation has manipulated its reported financial statements.",
    formula: "M = -4.84 + 0.920*DSRI + 0.528*GMI + 0.404*AQI + 0.892*SGI + 0.115*DEPI - 0.172*SGAI + 4.037*TATA + 0.0327*LVGI",
    benchmark: "Normal / Unmanipulated: < -1.78 | Probability of Manipulation: > -1.78",
    details:
      "Scores greater than -1.78 suggest aggressive revenue recognition, capitalized expenses, or artificial accruals that warrant immediate audit review.",
  },
  "repo-rate": {
    title: "RBI Repo Rate (5.50%) & Central Bank Impact",
    category: "Macroeconomic Policy",
    summary:
      "The rate at which the Reserve Bank of India lends liquidity to commercial banks against government securities. Sets the benchmark cost of capital across India.",
    benchmark: "Current RBI Repo Rate: 5.50% | Reverse Repo: 3.35% | SDF: 5.25%",
    details:
      "Higher repo rates increase marginal cost of lending (MCLR) and external benchmark lending rates (EBLR). For levered Indian corporates, every 50 bps repo hike translates into increased working capital interest expenses and tighter debt service coverage.",
  },
  "fed-funds": {
    title: "US Federal Funds Rate (5.25% - 5.50%)",
    category: "Macroeconomic Policy",
    summary:
      "The target overnight interest rate at which US depository institutions trade federal funds with each other. Governed by the US Federal Open Market Committee (FOMC).",
    benchmark: "Target Range: 5.25% - 5.50% | SOFR: ~5.31%",
    details:
      "Anchors dollar borrowing costs globally. Elevated Fed funds rates strengthen the US dollar against emerging market currencies (e.g. INR, JPY) and raise floating-rate Term Loan B and SOFR debt servicing costs.",
  },
  "net-debt-ebitda": {
    title: "Net Debt / EBITDA (Leverage Multiple)",
    category: "Credit & Solvency",
    summary:
      "Measures how many years of cash generation a company would need to pay off all debt if debt and EBITDA remain constant.",
    formula: "Net Debt / EBITDA = (Short-Term Debt + Long-Term Debt - Cash & Cash Equivalents) / EBITDA",
    benchmark: "Institutional Hurdle: < 3.50x | Caution: 3.50x - 5.00x | Distressed: > 5.00x",
    details:
      "A Net Debt/EBITDA multiple above 3.5x signals that the firm carries substantial debt relative to its operational earning power, making it vulnerable to rate hikes and demand shocks.",
  },
  "interest-coverage": {
    title: "Interest Coverage Ratio (Times Interest Earned)",
    category: "Debt Service Capacity",
    summary:
      "Measures how comfortably a company can pay the interest due on its outstanding loans with its operating earnings.",
    formula: "Interest Coverage = Operating Income (EBIT) / Total Interest Expense",
    benchmark: "Investment Grade: > 4.0x | Minimum Covenant: 2.5x | Default Risk: < 1.5x",
    details:
      "An interest coverage ratio below 1.5x indicates that the corporate is dangerously close to operating cash shortfall, risking syndicated loan covenant breaches.",
  },
  "current-ratio": {
    title: "Current Ratio & Quick Ratio",
    category: "Liquidity",
    summary:
      "Measures short-term liquidity: the company's ability to cover obligations maturing within 12 months using current assets.",
    formula: "Current Ratio = Total Current Assets / Total Current Liabilities | Quick Ratio = (Cash + Marketable Sec + Receivables) / Current Liabilities",
    benchmark: "Healthy: > 1.20x | Tight: 1.00x - 1.20x | Liquidity Deficit: < 1.00x",
    details:
      "A current ratio below 1.0x means short-term liabilities exceed short-term assets, requiring immediate revolving credit drawdown or asset sales.",
  },
  "xbrl": {
    title: "XBRL Digital Line-Item Provenance",
    category: "Regulatory Auditing",
    summary:
      "eXtensible Business Reporting Language — the international digital standard for exchanging audited business and financial data.",
    details:
      "FINTRAXIS embeds cryptographic XBRL tags (such as us-gaap:Revenues or ifrs:OperatingProfit) for every single line item in the financial ledger, linking numbers directly to audited statutory regulatory filings.",
  },
  "ind-as": {
    title: "Ind-AS vs US-GAAP vs IFRS Accounting",
    category: "Accounting Regimes",
    summary:
      "Indian Accounting Standards (Ind-AS) converge with IFRS, whereas US-GAAP governs SEC registrants.",
    details:
      "Under Ind-AS 116 and IFRS 16, virtually all leases must be capitalized onto the balance sheet as Right-of-Use (ROU) assets and lease liabilities. In Indian financial statements, numbers are reported in Crores (10,000,000) or Lakhs (100,000), which FINTRAXIS normalizes automatically.",
  },
  "basel-iii": {
    title: "Basel III Early Warning System (EWS)",
    category: "Institutional Surveillance",
    summary:
      "International regulatory framework developed by the Basel Committee on Banking Supervision to enforce minimum bank capital adequacy and corporate credit risk controls.",
    details:
      "Monitors systemic credit risk triggers: liquidity coverage degradation, negative CFO despite positive net income (earnings quality warning), and excessive funded debt to equity.",
  },
};

export function FinancialAiAssistant({ isOpen, onClose, activeProfile }: FinancialAiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      sender: "ai",
      text: activeProfile
        ? `Hello! I am your **FINTRAXIS Risk & Financial Intelligence Copilot**. I have loaded live data for **${activeProfile.company.name} (${activeProfile.company.symbol})** [${activeProfile.company.country} • ${activeProfile.company.currency}]. You can ask me to explain any financial metric, ratio, macro rate, or calculate risk implications.`
        : "Hello! I am your **FINTRAXIS Risk & Financial Intelligence Copilot**. I can explain institutional financial terms, bankruptcy formulas (Altman Z, Beneish M), central bank rates (RBI Repo 5.50%, US Fed Funds), and analyze credit risks.",
      timestamp: "Just now",
      relatedTerms: ["altman-z", "repo-rate", "net-debt-ebitda", "interest-coverage"],
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [selectedTermKey, setSelectedTermKey] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const company = activeProfile?.company;
  const ratios = activeProfile?.latestRatios;
  const isIndianCompany = company?.country === "IND" || company?.symbol.endsWith(".NS") || company?.symbol.endsWith(".BO");

  const handleSendQuery = (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");

    // Analyze query and produce intelligent institutional response
    setTimeout(() => {
      const lower = text.toLowerCase();
      let aiResponseText = "";
      let foundTerms: string[] = [];

      if (lower.includes("altman") || lower.includes("z-score") || lower.includes("bankruptcy") || lower.includes("insolvency")) {
        const kb = KNOWLEDGE_BASE["altman-z"];
        foundTerms.push("altman-z");
        aiResponseText = `### ${kb.title}\n\n${kb.summary}\n\n**Mathematical Formula:**\n\`${kb.formula}\`\n\n**Institutional Benchmark:**\n${kb.benchmark}\n\n${kb.details}`;
        if (company) {
          aiResponseText += `\n\n**Analysis for ${company.name}:**\nWith an Altman Z score evaluated within our Solvency Matrix, early warning indicators show the risk tier is **${activeProfile?.riskTier}** (Score: ${activeProfile?.riskScore}/100).`;
        }
      } else if (lower.includes("repo") || lower.includes("rbi") || lower.includes("india rate") || lower.includes("interest rate")) {
        const kb = KNOWLEDGE_BASE["repo-rate"];
        foundTerms.push("repo-rate");
        aiResponseText = `### ${kb.title}\n\n${kb.summary}\n\n**Current Benchmark Rates:**\n${kb.benchmark}\n\n${kb.details}`;
        if (isIndianCompany) {
          aiResponseText += `\n\n**Impact on ${company?.name}:**\nBecause ${company?.name} operates in India under **${company?.currency} (${company?.scaleUnit})**, a 50 bps shift in the RBI Repo Rate directly affects their short-term borrowing and commercial paper discount rates.`;
        }
      } else if (lower.includes("fed") || lower.includes("us rate") || lower.includes("sofr") || lower.includes("fomc")) {
        const kb = KNOWLEDGE_BASE["fed-funds"];
        foundTerms.push("fed-funds");
        aiResponseText = `### ${kb.title}\n\n${kb.summary}\n\n**Benchmark:**\n${kb.benchmark}\n\n${kb.details}`;
      } else if (lower.includes("ebitda") || lower.includes("net debt") || lower.includes("leverage")) {
        const kb = KNOWLEDGE_BASE["net-debt-ebitda"];
        foundTerms.push("net-debt-ebitda");
        aiResponseText = `### ${kb.title}\n\n${kb.summary}\n\n**Formula:**\n\`${kb.formula}\`\n\n**Hurdle:**\n${kb.benchmark}\n\n${kb.details}`;
        if (ratios?.netDebtToEbitda !== undefined && ratios?.netDebtToEbitda !== null) {
          aiResponseText += `\n\n**Active Metric for ${company?.name}:**\nReported Net Debt / EBITDA is **${ratios.netDebtToEbitda.toFixed(2)}x** against an institutional hurdle of **3.50x**. Status: ${ratios.netDebtToEbitda <= 3.5 ? "COMPLIANT ✅" : "BREACH / HIGH LEVERAGE ⚠️"}.`;
        }
      } else if (lower.includes("coverage") || lower.includes("interest coverage") || lower.includes("dscr")) {
        const kb = KNOWLEDGE_BASE["interest-coverage"];
        foundTerms.push("interest-coverage");
        aiResponseText = `### ${kb.title}\n\n${kb.summary}\n\n**Formula:**\n\`${kb.formula}\`\n\n**Benchmark:**\n${kb.benchmark}\n\n${kb.details}`;
        if (ratios?.interestCoverage !== undefined && ratios?.interestCoverage !== null) {
          aiResponseText += `\n\n**Active Metric for ${company?.name}:**\nReported Interest Coverage is **${ratios.interestCoverage.toFixed(2)}x**.`;
        }
      } else if (lower.includes("current ratio") || lower.includes("quick ratio") || lower.includes("liquidity")) {
        const kb = KNOWLEDGE_BASE["current-ratio"];
        foundTerms.push("current-ratio");
        aiResponseText = `### ${kb.title}\n\n${kb.summary}\n\n**Formula:**\n\`${kb.formula}\`\n\n**Benchmark:**\n${kb.benchmark}\n\n${kb.details}`;
        if (ratios?.currentRatio) {
          aiResponseText += `\n\n**Active Metric for ${company?.name}:**\nCurrent Ratio: **${ratios.currentRatio.toFixed(2)}x** | Quick Ratio: **${ratios.quickRatio?.toFixed(2) || "N/D"}x**.`;
        }
      } else if (lower.includes("beneish") || lower.includes("m-score") || lower.includes("fraud") || lower.includes("manipulation")) {
        const kb = KNOWLEDGE_BASE["beneish-m"];
        foundTerms.push("beneish-m");
        aiResponseText = `### ${kb.title}\n\n${kb.summary}\n\n**Formula:**\n\`${kb.formula}\`\n\n**Benchmark:**\n${kb.benchmark}\n\n${kb.details}`;
      } else if (lower.includes("xbrl") || lower.includes("provenance") || lower.includes("filing")) {
        const kb = KNOWLEDGE_BASE["xbrl"];
        foundTerms.push("xbrl");
        aiResponseText = `### ${kb.title}\n\n${kb.summary}\n\n${kb.details}`;
      } else if (lower.includes("ind-as") || lower.includes("ifrs") || lower.includes("gaap") || lower.includes("crore") || lower.includes("lakh")) {
        const kb = KNOWLEDGE_BASE["ind-as"];
        foundTerms.push("ind-as");
        aiResponseText = `### ${kb.title}\n\n${kb.summary}\n\n${kb.details}`;
      } else if (lower.includes("analyze") || lower.includes("company") || lower.includes("summary") || lower.includes("overview")) {
        if (company) {
          aiResponseText = `### Institutional Risk Executive Briefing: ${company.name} (${company.symbol})\n\n` +
            `• **Country & Regime:** ${company.country} (${company.accountingStandard})\n` +
            `• **Reporting Currency:** ${company.currency} (${company.scaleUnit})\n` +
            `• **Market Capitalization:** ${company.currency} ${company.marketCap?.toLocaleString() || "N/D"} ${company.scaleUnit}\n` +
            `• **Risk Tier:** **${activeProfile?.riskTier || "LOW"}** (Composite Risk Score: ${activeProfile?.riskScore || 0}/100)\n` +
            `• **Net Debt / EBITDA:** ${ratios?.netDebtToEbitda !== null ? ratios?.netDebtToEbitda?.toFixed(2) + "x" : "N/D"} (Hurdle: 3.50x)\n` +
            `• **Interest Coverage:** ${ratios?.interestCoverage !== null ? ratios?.interestCoverage?.toFixed(2) + "x" : "N/D"} (Hurdle: 2.50x)\n` +
            `• **Current Ratio:** ${ratios?.currentRatio !== null ? ratios?.currentRatio?.toFixed(2) + "x" : "N/D"} (Hurdle: 1.10x)\n\n` +
            `**Key Takeaway:** The company's balance sheet exhibits ${
              (activeProfile?.riskScore || 0) < 30
                ? "strong investment-grade solvency with low refinancing vulnerabilities."
                : (activeProfile?.riskScore || 0) < 60
                ? "moderate leverage requiring close covenant surveillance under rising interest rates."
                : "heightened default risk requiring urgent debt restructuring analysis."
            }`;
          foundTerms.push("net-debt-ebitda", "interest-coverage");
        } else {
          aiResponseText = "Select any company using the search bar or Security Master table, and I will generate an executive risk brief!";
        }
      } else {
        aiResponseText = `I analyzed your question regarding **"${text}"**:\n\n` +
          `In institutional credit risk analysis, financial metrics are interpreted relative to corporate cash flow predictability, asset tangibility, and macro liquidity conditions.\n\n` +
          `Would you like me to elaborate on one of these related institutional topics?`;
        foundTerms = ["altman-z", "net-debt-ebitda", "repo-rate", "current-ratio"];
      }

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        relatedTerms: foundTerms,
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 350);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-0 bottom-0 right-0 z-50 bg-[#0A0E17] border-l border-[#1E2536] shadow-2xl flex flex-col font-mono text-xs transition-all duration-200 ${
        isExpanded ? "w-full md:w-[680px]" : "w-full sm:w-[460px]"
      }`}
    >
      {/* Top Header */}
      <div className="p-3.5 bg-[#0D111A] border-b border-[#1E2536] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#C5A880]/10 border border-[#C5A880]/30 flex items-center justify-center text-[#C5A880]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[#F8FAFC] flex items-center gap-2 text-xs">
              <span>FINANCIAL AI RISK COPILOT</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#10B981]/10 border border-[#10B981]/40 text-[#10B981] font-normal rounded">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-[#64748B]">
              {company ? `Context: ${company.name} (${company.symbol})` : "General Institutional Intelligence"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
        <span className="text-[#64748B] text-[9.5px] uppercase whitespace-nowrap mr-1">QUICK PROMPTS:</span>
        <button
          onClick={() => handleSendQuery(`Analyze credit risk for ${company?.name || "current company"}`)}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] text-[#C5A880] rounded whitespace-nowrap transition-colors"
        >
          🔍 Analyze Risk Profile
        </button>
        <button
          onClick={() => handleSendQuery("Explain Altman Z-Score formula and default thresholds")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          📉 Altman Z-Score
        </button>
        <button
          onClick={() => handleSendQuery("What does RBI Repo Rate 5.50% mean for Indian corporate debt?")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          🇮🇳 RBI Repo Rate
        </button>
        <button
          onClick={() => handleSendQuery("Explain Net Debt to EBITDA 3.5x hurdle")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          📊 Net Debt/EBITDA
        </button>
        <button
          onClick={() => handleSendQuery("Explain Ind-AS 116 vs US-GAAP lease accounting")}
          className="px-2 py-1 bg-[#12161F] hover:bg-[#1E2536] border border-[#232B3A] text-[#94A3B8] hover:text-[#F8FAFC] rounded whitespace-nowrap transition-colors"
        >
          📑 Ind-AS vs US-GAAP
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
              <span>{m.sender === "user" ? "OPERATOR" : "FINTRAXIS AI"}</span>
              <span>&bull;</span>
              <span>{m.timestamp}</span>
            </div>

            <div
              className={`p-3.5 rounded-lg max-w-[92%] leading-relaxed text-xs ${
                m.sender === "user"
                  ? "bg-[#C5A880] text-[#080B10] font-medium"
                  : "bg-[#0E131A] border border-[#1E2536] text-[#E2E8F0]"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* Related Knowledge Base Term Pills */}
              {m.relatedTerms && m.relatedTerms.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#1E2536] flex flex-wrap gap-1.5 items-center">
                  <span className="text-[9.5px] text-[#64748B] uppercase">Deep Dive:</span>
                  {m.relatedTerms.map((tKey) => {
                    const item = KNOWLEDGE_BASE[tKey];
                    if (!item) return null;
                    return (
                      <button
                        key={tKey}
                        onClick={() => setSelectedTermKey(tKey)}
                        className="px-2 py-0.5 bg-[#172033] hover:bg-[#1E2D4A] border border-[#C5A880]/30 text-[#C5A880] text-[10px] rounded flex items-center gap-1 transition-colors"
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        <span>{item.title.split("(")[0].trim()}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Selected Term Detail Modal Card inside assistant */}
        {selectedTermKey && KNOWLEDGE_BASE[selectedTermKey] && (
          <div className="p-4 bg-[#111622] border border-[#C5A880] rounded-lg space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-[#C5A880] font-bold text-xs">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{KNOWLEDGE_BASE[selectedTermKey].title}</span>
              </div>
              <button
                onClick={() => setSelectedTermKey(null)}
                className="text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-[#CBD5E1]">
              {KNOWLEDGE_BASE[selectedTermKey].summary}
            </div>

            {KNOWLEDGE_BASE[selectedTermKey].formula && (
              <div className="p-2 bg-[#080B10] border border-[#1E2536] text-[10px] text-[#38BDF8] rounded">
                <span className="text-[#64748B] block text-[9px] uppercase">Formula:</span>
                <code>{KNOWLEDGE_BASE[selectedTermKey].formula}</code>
              </div>
            )}

            {KNOWLEDGE_BASE[selectedTermKey].benchmark && (
              <div className="text-[10.5px] text-[#10B981] font-semibold">
                Benchmark: {KNOWLEDGE_BASE[selectedTermKey].benchmark}
              </div>
            )}

            <div className="text-[11px] text-[#94A3B8] leading-snug">
              {KNOWLEDGE_BASE[selectedTermKey].details}
            </div>
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuery(inputQuery);
        }}
        className="p-3 bg-[#0D111A] border-t border-[#1E2536] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask anything (e.g. 'What is Altman Z?', 'Explain Repo Rate', 'Analyze HAL')..."
          className="flex-1 px-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] placeholder-[#475569] text-xs font-mono rounded focus:border-[#C5A880] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim()}
          className="px-3 py-2 bg-[#C5A880] hover:bg-[#D4B996] text-[#080B10] font-bold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <span>Ask</span>
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
}
