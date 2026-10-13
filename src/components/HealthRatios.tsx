"use client";

import React from "react";
import { Activity, Layers } from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { formatRatio, formatPct } from "@/lib/formatters";

interface HealthRatiosProps {
  profile: CompanyRiskProfile;
  onAuditMetric: (metricKey: string, period: string, label: string, value: number | null) => void;
}

export function HealthRatios({ profile, onAuditMetric }: HealthRatiosProps) {
  const { latestRatios, periods, company } = profile;
  const latestPeriod = periods[0]?.period || "LATEST";

  const ratioCards = [
    {
      group: "LIQUIDITY RUNWAY",
      items: [
        {
          key: "currentRatio",
          label: "Current Ratio",
          value: formatRatio(latestRatios.currentRatio),
          formula: "Total Current Assets / Total Current Liabilities",
          status:
            latestRatios.currentRatio !== null && latestRatios.currentRatio >= 1.2
              ? "TIER_1"
              : latestRatios.currentRatio !== null && latestRatios.currentRatio >= 1.0
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Hurdle: > 1.20x",
        },
        {
          key: "quickRatio",
          label: "Quick Acid-Test Ratio",
          value: formatRatio(latestRatios.quickRatio),
          formula: "(Cash + Marketable Securities + Receivables) / Current Liabilities",
          status:
            latestRatios.quickRatio !== null && latestRatios.quickRatio >= 1.0
              ? "TIER_1"
              : latestRatios.quickRatio !== null && latestRatios.quickRatio >= 0.8
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Hurdle: > 1.00x",
        },
        {
          key: "cashRatio",
          label: "Cash Ratio",
          value: formatRatio(latestRatios.cashRatio),
          formula: "Cash & Cash Equivalents / Total Current Liabilities",
          status:
            latestRatios.cashRatio !== null && latestRatios.cashRatio >= 0.25
              ? "TIER_1"
              : "TIER_2",
          benchmark: "Buffer: > 0.20x",
        },
      ],
    },
    {
      group: "SOLVENCY & GEARING",
      items: [
        {
          key: "interestCoverage",
          label: "EBIT Interest Coverage",
          value: formatRatio(latestRatios.interestCoverage),
          formula: "Operating Income (EBIT) / Interest Expense",
          status:
            latestRatios.interestCoverage !== null && latestRatios.interestCoverage >= 4.0
              ? "TIER_1"
              : latestRatios.interestCoverage !== null && latestRatios.interestCoverage >= 2.0
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Inv-Grade: > 3.00x",
        },
        {
          key: "netDebtToEbitda",
          label: "Net Debt / EBITDA",
          value: formatRatio(latestRatios.netDebtToEbitda),
          formula: "(Total Debt - Cash & Liquid Assets) / EBITDA",
          status:
            latestRatios.netDebtToEbitda !== null && latestRatios.netDebtToEbitda <= 2.5
              ? "TIER_1"
              : latestRatios.netDebtToEbitda !== null && latestRatios.netDebtToEbitda <= 4.0
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Ceiling: < 3.00x",
        },
        {
          key: "debtToEquity",
          label: "Debt-to-Equity (D/E)",
          value: formatRatio(latestRatios.debtToEquity),
          formula: "Total Debt / Total Shareholders Equity",
          status:
            latestRatios.debtToEquity !== null && latestRatios.debtToEquity <= 1.5
              ? "TIER_1"
              : "TIER_2",
          benchmark: "Prudent: < 1.50x",
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
          status:
            latestRatios.cfoToNetIncome !== null && latestRatios.cfoToNetIncome >= 0.9
              ? "TIER_1"
              : latestRatios.cfoToNetIncome !== null && latestRatios.cfoToNetIncome >= 0.6
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Target: > 0.85x",
        },
        {
          key: "grossMarginPct",
          label: "Gross Margin",
          value: formatPct(latestRatios.grossMarginPct),
          formula: "Gross Profit / Total Revenue * 100",
          status: "TIER_1",
          benchmark: "Base margin",
        },
        {
          key: "operatingMarginPct",
          label: "Operating (EBIT) Margin",
          value: formatPct(latestRatios.operatingMarginPct),
          formula: "EBIT / Total Revenue * 100",
          status: "TIER_1",
          benchmark: "Base margin",
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-3 bg-[#0E131A] border border-[#1E2638] flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#C5A880]" />
          <div>
            <div className="font-mono text-xs font-bold text-[#E1E7EC] tracking-wider uppercase">
              DETERMINISTIC FORMULA DAG // HEALTH RATIO MATRIX
            </div>
            <div className="text-[10px] text-[#5A687D] font-mono">
              Evaluated on {latestPeriod} as-reported regulatory filings for {company.symbol}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#5A687D]">
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

      {/* Grid of Formula DAG Cards */}
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
                  className={`p-3 bg-[#12161F] border border-[#232B3A] hover:border-[#C5A880] cursor-pointer transition-all space-y-2 relative group`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-mono font-semibold text-[#E1E7EC] group-hover:text-[#C5A880] transition-colors">
                      {item.label}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 border ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xl font-bold font-mono font-mono-numbers text-[#E1E7EC]">
                      {item.value}
                    </span>
                    <span className="text-[10px] font-mono text-[#5A687D]">
                      {item.benchmark}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-[#5A687D] truncate pt-1 border-t border-[#1E2638]">
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
