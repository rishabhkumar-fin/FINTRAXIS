"use client";

import React from "react";
import { Layers, ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { formatRatio, formatPct } from "@/lib/formatters";

interface HealthRatiosProps {
  profile: CompanyRiskProfile;
  onAuditMetric: (metricKey: string, period: string, label: string, value?: number | null) => void;
}

export function HealthRatios({ profile, onAuditMetric }: HealthRatiosProps) {
  const { latestRatios, periods, company, riskTier, riskScore } = profile;
  const latestPeriod = periods[0]?.period || "LATEST";

  const ratioCards = [
    {
      group: "LIQUIDITY RUNWAY & WORKING CAPITAL",
      items: [
        {
          key: "currentRatio",
          label: "Current Ratio",
          value: formatRatio(latestRatios.currentRatio),
          formula: "Total Current Assets / Total Current Liabilities",
          explanation: "Measures whether short-term assets cover all bills due within 1 year.",
          status:
            latestRatios.currentRatio !== null && latestRatios.currentRatio >= 1.2
              ? "TIER_1"
              : latestRatios.currentRatio !== null && latestRatios.currentRatio >= 1.0
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Hurdle: > 1.20x",
          progressPct: Math.min(100, Math.max(10, ((latestRatios.currentRatio ?? 1) / 2.0) * 100)),
        },
        {
          key: "quickRatio",
          label: "Quick Acid-Test Ratio",
          value: formatRatio(latestRatios.quickRatio),
          formula: "(Cash + Marketable Securities + Receivables) / Current Liabilities",
          explanation: "Excludes hard-to-sell inventory; tests instant emergency liquidity buffer.",
          status:
            latestRatios.quickRatio !== null && latestRatios.quickRatio >= 1.0
              ? "TIER_1"
              : latestRatios.quickRatio !== null && latestRatios.quickRatio >= 0.8
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Hurdle: > 1.00x",
          progressPct: Math.min(100, Math.max(10, ((latestRatios.quickRatio ?? 1) / 1.8) * 100)),
        },
        {
          key: "cashRatio",
          label: "Cash Ratio",
          value: formatRatio(latestRatios.cashRatio),
          formula: "Cash & Cash Equivalents / Total Current Liabilities",
          explanation: "Pure cold-hard cash reserves versus near-term payment obligations.",
          status:
            latestRatios.cashRatio !== null && latestRatios.cashRatio >= 0.25
              ? "TIER_1"
              : "TIER_2",
          benchmark: "Buffer: > 0.20x",
          progressPct: Math.min(100, Math.max(10, ((latestRatios.cashRatio ?? 0.2) / 0.8) * 100)),
        },
      ],
    },
    {
      group: "SOLVENCY, LEVERAGE & GEARING",
      items: [
        {
          key: "interestCoverage",
          label: "EBIT Interest Coverage",
          value: formatRatio(latestRatios.interestCoverage),
          formula: "Operating Income (EBIT) / Interest Expense",
          explanation: "Operating profits available to service bank debt interest.",
          status:
            latestRatios.interestCoverage !== null && latestRatios.interestCoverage >= 4.0
              ? "TIER_1"
              : latestRatios.interestCoverage !== null && latestRatios.interestCoverage >= 2.0
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Inv-Grade: > 3.00x",
          progressPct: Math.min(100, Math.max(10, ((latestRatios.interestCoverage ?? 2) / 10) * 100)),
        },
        {
          key: "netDebtToEbitda",
          label: "Net Debt / EBITDA",
          value: formatRatio(latestRatios.netDebtToEbitda),
          formula: "(Total Debt - Cash & Liquid Assets) / EBITDA",
          explanation: "Years of operating cash flow needed to pay off debt (negative = net cash!).",
          status:
            latestRatios.netDebtToEbitda !== null && latestRatios.netDebtToEbitda <= 2.5
              ? "TIER_1"
              : latestRatios.netDebtToEbitda !== null && latestRatios.netDebtToEbitda <= 4.0
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Ceiling: < 3.00x",
          progressPct: Math.max(10, Math.min(100, 100 - ((latestRatios.netDebtToEbitda ?? 1) / 5) * 100)),
        },
        {
          key: "debtToEquity",
          label: "Debt-to-Equity (D/E)",
          value: formatRatio(latestRatios.debtToEquity),
          formula: "Total Debt / Total Shareholders Equity",
          explanation: "Total borrowing leverage relative to shareholder net worth.",
          status:
            latestRatios.debtToEquity !== null && latestRatios.debtToEquity <= 1.5
              ? "TIER_1"
              : "TIER_2",
          benchmark: "Prudent: < 1.50x",
          progressPct: Math.max(10, Math.min(100, 100 - ((latestRatios.debtToEquity ?? 0.5) / 3) * 100)),
        },
      ],
    },
    {
      group: "EARNINGS QUALITY & CONVERSION",
      items: [
        {
          key: "cfoToNetIncome",
          label: "CFO / Net Income Conversion",
          value: formatRatio(latestRatios.cfoToNetIncome),
          formula: "Cash from Operations (CFO) / Reported Net Income",
          explanation: "Quality of earnings: converts accounting profits into real bankable cash.",
          status:
            latestRatios.cfoToNetIncome !== null && latestRatios.cfoToNetIncome >= 0.9
              ? "TIER_1"
              : latestRatios.cfoToNetIncome !== null && latestRatios.cfoToNetIncome >= 0.6
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Target: > 0.85x",
          progressPct: Math.min(100, Math.max(10, ((latestRatios.cfoToNetIncome ?? 0.8) / 1.5) * 100)),
        },
        {
          key: "grossMarginPct",
          label: "Gross Profit Margin",
          value: formatPct(latestRatios.grossMarginPct),
          formula: "Gross Profit / Total Revenue * 100",
          explanation: "Profitability remaining after direct manufacturing or service delivery costs.",
          status: "TIER_1",
          benchmark: "Pricing Power",
          progressPct: Math.min(100, Math.max(10, (latestRatios.grossMarginPct ?? 30) * 1.5)),
        },
        {
          key: "operatingMarginPct",
          label: "Operating (EBIT) Margin",
          value: formatPct(latestRatios.operatingMarginPct),
          formula: "EBIT / Total Revenue * 100",
          explanation: "Core operational efficiency before deducting financing costs and taxes.",
          status: "TIER_1",
          benchmark: "Efficiency",
          progressPct: Math.min(100, Math.max(10, (latestRatios.operatingMarginPct ?? 15) * 2.5)),
        },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TIER_1":
        return "border-[#10B981]/50 bg-[#10B981]/5 text-[#10B981]";
      case "TIER_2":
        return "border-[#F59E0B]/50 bg-[#F59E0B]/5 text-[#F59E0B]";
      case "TIER_3":
        return "border-[#EF4444]/50 bg-[#EF4444]/5 text-[#EF4444]";
      default:
        return "border-[#1E2638] text-[#9BA8B8]";
    }
  };

  const isTier1 = riskTier === "TIER_1_STABLE";
  const isTier2 = riskTier === "TIER_2_WATCHLIST";

  return (
    <div className="space-y-4">
      {/* Executive Solvency Verdict Banner */}
      <div className="p-4 bg-[#0E131A] border border-[#1E2638] rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded border ${isTier1 ? "bg-[#10B981]/10 border-[#10B981] text-[#10B981]" : isTier2 ? "bg-[#F59E0B]/10 border-[#F59E0B] text-[#F59E0B]" : "bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]"}`}>
            {isTier1 ? <ShieldCheck className="w-5 h-5" /> : isTier2 ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#E1E7EC] tracking-wider uppercase">
                {company.name} ({company.symbol})
              </span>
              <span className={`text-[10px] px-2 py-0.5 border font-bold font-mono rounded ${isTier1 ? "border-[#10B981] text-[#10B981] bg-[#10B981]/10" : isTier2 ? "border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10" : "border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10"}`}>
                {riskTier.replace("_", " ")} &bull; {riskScore}/100
              </span>
            </div>
            <div className="text-[11px] text-[#9BA8B8] font-mono mt-0.5">
              {isTier1
                ? "Prime Solvency: Fortress liquidity runway, comfortable interest debt service buffers, and high operational cash conversion."
                : isTier2
                ? "Watchlist Surveillance: Moderate leverage gearing or margin pressure detected. Quarterly covenant monitoring recommended."
                : "Critical Distress: Significant leverage breach or cash runway constriction. Immediate debt restructuring analysis required."}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-[#5A687D] self-end md:self-auto">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span> TIER 1 STABLE
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> TIER 2 WATCHLIST
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span> TIER 3 CRITICAL
          </span>
        </div>
      </div>

      {/* Grid of Formula DAG Cards with Plain-English Interpretations */}
      <div className="space-y-4">
        {ratioCards.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-[#5A687D] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3 h-3 text-[#C5A880]" />
              <span>{group.group}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {group.items.map((item) => (
                <div
                  key={item.key}
                  onClick={() => onAuditMetric(item.key, latestPeriod, item.label, null)}
                  className={`p-3.5 bg-[#12161F] border border-[#232B3A] hover:border-[#C5A880] cursor-pointer transition-all space-y-2 relative group rounded-sm`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-mono font-semibold text-[#E1E7EC] group-hover:text-[#C5A880] transition-colors">
                      {item.label}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 border ${getStatusColor(
                        item.status
                      )} rounded`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-xl font-bold font-mono font-mono-numbers text-[#E1E7EC]">
                      {item.value}
                    </span>
                    <span className="text-[10px] font-mono text-[#C5A880]">
                      {item.benchmark}
                    </span>
                  </div>

                  {/* Visual Strength Meter Bar */}
                  <div className="w-full bg-[#080B10] h-1.5 rounded-full overflow-hidden border border-[#1E2536]">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.status === "TIER_1" ? "bg-[#10B981]" : item.status === "TIER_2" ? "bg-[#F59E0B]" : "bg-[#EF4444]"
                      }`}
                      style={{ width: `${item.progressPct}%` }}
                    ></div>
                  </div>

                  <p className="text-[10.5px] font-mono text-[#9BA8B8] leading-tight pt-1">
                    {item.explanation}
                  </p>

                  <div className="text-[9.5px] font-mono text-[#5A687D] truncate pt-1 border-t border-[#1E2638]">
                    DAG: {item.formula}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
