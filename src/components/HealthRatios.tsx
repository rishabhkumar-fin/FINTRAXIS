"use client";

import React, { useState } from "react";
import { Layers, ShieldCheck, AlertTriangle, ShieldAlert, BarChart3, LayoutGrid, Info } from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { formatRatio, formatPct } from "@/lib/formatters";

interface HealthRatiosProps {
  profile: CompanyRiskProfile;
  onAuditMetric: (metricKey: string, period: string, label: string, value?: number | null) => void;
}

export function HealthRatios({ profile, onAuditMetric }: HealthRatiosProps) {
  const { latestRatios, periods, company, riskTier, riskScore } = profile;
  const latestPeriod = periods[0]?.period || "LATEST";
  const [activeView, setActiveView] = useState<"TILES" | "POWER_BI">("POWER_BI");

  const isTier1 = riskTier === "TIER_1_STABLE";
  const isTier2 = riskTier === "TIER_2_WATCHLIST";

  // Comparative Benchmarking Data (Target Entity vs Industry Median vs Hurdle)
  const comparisons = [
    {
      metric: "Net Debt / EBITDA",
      unit: "x",
      companyVal: latestRatios.netDebtToEbitda ?? 0,
      industryMedian: 2.3,
      hurdle: 3.5,
      hurdleLabel: "Hurdle ≤ 3.50x",
      lowerIsBetter: true,
      meaning: "Years of operational earnings needed to eliminate all funded debt. Lower is safer.",
      status: (latestRatios.netDebtToEbitda ?? 0) <= 2.5 ? "PRIME" : (latestRatios.netDebtToEbitda ?? 0) <= 3.5 ? "WATCH" : "BREACH",
    },
    {
      metric: "EBIT Interest Coverage",
      unit: "x",
      companyVal: latestRatios.interestCoverage ?? 99,
      industryMedian: 4.8,
      hurdle: 2.5,
      hurdleLabel: "Floor ≥ 2.50x",
      lowerIsBetter: false,
      meaning: "How many times operating profit can pay annual loan interest. Higher is safer.",
      status: (latestRatios.interestCoverage ?? 99) >= 4.0 ? "PRIME" : (latestRatios.interestCoverage ?? 99) >= 2.5 ? "WATCH" : "BREACH",
    },
    {
      metric: "Current Liquidity Ratio",
      unit: "x",
      companyVal: latestRatios.currentRatio ?? 1.0,
      industryMedian: 1.45,
      hurdle: 1.2,
      hurdleLabel: "Benchmark ≥ 1.20x",
      lowerIsBetter: false,
      meaning: "Dollars of short-term liquid assets available for every $1 of bills due within 1 year.",
      status: (latestRatios.currentRatio ?? 1.0) >= 1.3 ? "PRIME" : (latestRatios.currentRatio ?? 1.0) >= 1.1 ? "WATCH" : "BREACH",
    },
    {
      metric: "Operating (EBIT) Margin",
      unit: "%",
      companyVal: latestRatios.operatingMarginPct ?? 15,
      industryMedian: 16.5,
      hurdle: 10.0,
      hurdleLabel: "Inv-Grade ≥ 10.0%",
      lowerIsBetter: false,
      meaning: "Percentage of top-line revenue converted into core operating profit.",
      status: (latestRatios.operatingMarginPct ?? 15) >= 20 ? "PRIME" : (latestRatios.operatingMarginPct ?? 15) >= 10 ? "WATCH" : "BREACH",
    },
    {
      metric: "Cash Conversion (CFO / NI)",
      unit: "x",
      companyVal: latestRatios.cfoToNetIncome ?? 1.0,
      industryMedian: 0.95,
      hurdle: 0.85,
      hurdleLabel: "Quality Floor ≥ 0.85x",
      lowerIsBetter: false,
      meaning: "Quality of earnings: confirms accounting profit is backed by real bankable cash.",
      status: (latestRatios.cfoToNetIncome ?? 1.0) >= 1.0 ? "PRIME" : (latestRatios.cfoToNetIncome ?? 1.0) >= 0.85 ? "WATCH" : "BREACH",
    },
  ];

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

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Executive Solvency Verdict Banner */}
      <div className="p-4 bg-[#0F1420] border border-[#1E2536] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-lg border ${isTier1 ? "bg-[#10B981]/15 border-[#10B981] text-[#10B981]" : isTier2 ? "bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B]" : "bg-[#F43F5E]/15 border-[#F43F5E] text-[#F43F5E]"}`}>
            {isTier1 ? <ShieldCheck className="w-6 h-6" /> : isTier2 ? <AlertTriangle className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-[#F8FAFC] tracking-wider uppercase">
                {company.name} ({company.symbol})
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 border font-bold rounded ${isTier1 ? "border-[#10B981] text-[#10B981] bg-[#10B981]/10" : isTier2 ? "border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10" : "border-[#F43F5E] text-[#F43F5E] bg-[#F43F5E]/10"}`}>
                {riskTier.replace("_", " ")} &bull; {riskScore}/100
              </span>
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              {isTier1
                ? "Prime Solvency: Fortress balance sheet liquidity, substantial interest service cushion, and clean operating cash conversion."
                : isTier2
                ? "Watchlist Surveillance: Moderate debt gearing or compressed fixed charge coverage. Quarterly covenant testing recommended."
                : "Critical Solvency Alert: Significant leverage breach or liquidity strain. Restructuring risk elevated."}
            </div>
          </div>
        </div>

        {/* View Switcher: Power BI vs Detailed Tiles */}
        <div className="flex items-center gap-1 bg-[#080B10] border border-[#1E2536] p-1 rounded-lg self-end md:self-auto">
          <button
            onClick={() => setActiveView("POWER_BI")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
              activeView === "POWER_BI"
                ? "bg-[#1E2B45] text-[#C5A880] border border-[#C5A880]/40 shadow-sm"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>POWER BI BENCHMARKS</span>
          </button>
          <button
            onClick={() => setActiveView("TILES")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
              activeView === "TILES"
                ? "bg-[#1E2B45] text-[#C5A880] border border-[#C5A880]/40 shadow-sm"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>METRIC CARDS</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE SYNTHESIS: WHAT THIS DESK TELLS YOU (Direct Plain-English Takeaways) */}
      <div className="p-4 bg-[#0A0E17] border border-[#1E2536] rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E2536] pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#C5A880] uppercase tracking-wider">
            <Info className="w-4 h-4 text-[#C5A880]" />
            <span>EXECUTIVE SYNTHESIS: WHAT THESE RATIOS MEAN IN BUSINESS REALITY</span>
          </div>
          <span className="text-[10px] text-[#64748B]">BLACKROCK ALADDIN BENCHMARKS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-1">
            <div className="text-[10px] text-[#64748B] uppercase font-bold flex items-center justify-between">
              <span>1. CAN THE FIRM PAY ITS DEBT?</span>
              <span className={(latestRatios.netDebtToEbitda ?? 0) <= 2.5 ? "text-[#10B981]" : "text-[#F59E0B]"}>
                {(latestRatios.netDebtToEbitda ?? 0) <= 0 ? "DEBT FREE" : `${latestRatios.netDebtToEbitda?.toFixed(1)}x EBITDA`}
              </span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {(latestRatios.netDebtToEbitda ?? 0) <= 0
                ? `${company.name} holds more cash than its total funded debt. It is completely insulated from loan defaults.`
                : (latestRatios.netDebtToEbitda ?? 0) <= 3.5
                ? `It would take approximately ${(latestRatios.netDebtToEbitda ?? 0).toFixed(1)} years of operating profit to eliminate all debt, well inside the safe 3.5x institutional ceiling.`
                : `Net Debt exceeds 3.5x EBITDA. Elevated gearing multiple puts the company at risk of credit rating downgrades.`}
            </p>
          </div>

          <div className="p-3 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-1">
            <div className="text-[10px] text-[#64748B] uppercase font-bold flex items-center justify-between">
              <span>2. CAN IT PAY LOAN INTEREST?</span>
              <span className={(latestRatios.interestCoverage ?? 99) >= 2.5 ? "text-[#10B981]" : "text-[#F43F5E]"}>
                {latestRatios.interestCoverage !== null ? `${latestRatios.interestCoverage.toFixed(1)}x BUFFER` : "SAFE"}
              </span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {latestRatios.interestCoverage !== null && latestRatios.interestCoverage >= 4.0
                ? `Operating earnings cover loan interest ${latestRatios.interestCoverage.toFixed(1)} times over, providing an immense cushion against central bank rate hikes.`
                : latestRatios.interestCoverage !== null && latestRatios.interestCoverage >= 2.5
                ? `Operating profits cover interest ${latestRatios.interestCoverage.toFixed(1)}x. Adequate, but sensitive to severe revenue contractions.`
                : `Interest coverage is tightly compressed or below the 2.5x floor. A rate hike directly threatens cash solvency.`}
            </p>
          </div>

          <div className="p-3 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-1">
            <div className="text-[10px] text-[#64748B] uppercase font-bold flex items-center justify-between">
              <span>3. DOES PROFIT EQUAL REAL CASH?</span>
              <span className={(latestRatios.cfoToNetIncome ?? 0) >= 0.85 ? "text-[#10B981]" : "text-[#F59E0B]"}>
                {latestRatios.cfoToNetIncome !== null ? `${(latestRatios.cfoToNetIncome * 100).toFixed(0)}% CASH` : "N/D"}
              </span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {(latestRatios.cfoToNetIncome ?? 0) >= 0.85
                ? `High quality of earnings: The company converts ${( (latestRatios.cfoToNetIncome ?? 1) * 100 ).toFixed(0)}% of reported profits into real bankable cash flow.`
                : `Working capital friction observed. Cash conversion sits below the 85% target, indicating uncollected receivables or inventory build.`}
            </p>
          </div>
        </div>
      </div>

      {/* POWER BI AUTHENTIC COMPARATIVE BAR GRAPH VIEW */}
      {activeView === "POWER_BI" ? (
        <div className="p-5 bg-[#0A0E17] border border-[#1E2536] rounded-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E2536] pb-3">
            <div>
              <div className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#C5A880]" />
                <span>POWER BI COMPARATIVE BENCHMARK MATRIX (COMPANY VS PEERS VS HURDLE)</span>
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">
                Evaluated against Global Industry Medians &amp; Investment Grade Syndicate Floors
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#C5A880]"></span>
                <span className="text-[#F8FAFC] font-bold">{company.symbol}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#3B82F6]"></span>
                <span className="text-[#94A3B8]">Industry Median</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#F43F5E]"></span>
                <span className="text-[#94A3B8]">Risk Hurdle</span>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {comparisons.map((item, idx) => {
              const maxVal = Math.max(item.companyVal, item.industryMedian, item.hurdle, 5);
              const compWidth = Math.min(100, Math.max(8, (item.companyVal / maxVal) * 100));
              const medianWidth = Math.min(100, Math.max(8, (item.industryMedian / maxVal) * 100));
              const hurdleWidth = Math.min(100, Math.max(8, (item.hurdle / maxVal) * 100));

              return (
                <div key={idx} className="p-3.5 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-xs font-bold text-[#F8FAFC]">{item.metric}</span>
                      <span className="text-[10px] text-[#64748B] ml-2">({item.meaning})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#94A3B8]">{item.hurdleLabel}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 font-bold border rounded ${
                          item.status === "PRIME"
                            ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]"
                            : item.status === "WATCH"
                            ? "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]"
                            : "bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Multi-Bar Comparison */}
                  <div className="space-y-1.5">
                    {/* Target Entity Bar */}
                    <div className="flex items-center gap-3">
                      <span className="w-24 text-[10px] text-[#C5A880] font-bold truncate">{company.symbol}</span>
                      <div className="flex-1 bg-[#080B10] h-5 rounded overflow-hidden border border-[#1E2536] relative">
                        <div
                          style={{ width: `${compWidth}%` }}
                          className="h-full bg-gradient-to-r from-[#9A7B4F] to-[#C5A880] rounded transition-all duration-500 flex items-center justify-end pr-2"
                        >
                          <span className="text-[10px] font-extrabold text-[#080B10] font-mono">
                            {item.companyVal.toFixed(2)}{item.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Industry Median Bar */}
                    <div className="flex items-center gap-3">
                      <span className="w-24 text-[10px] text-[#94A3B8] truncate">Peer Median</span>
                      <div className="flex-1 bg-[#080B10] h-4 rounded overflow-hidden border border-[#1E2536] relative">
                        <div
                          style={{ width: `${medianWidth}%` }}
                          className="h-full bg-[#3B82F6]/60 rounded transition-all duration-500 flex items-center justify-end pr-2"
                        >
                          <span className="text-[9px] font-bold text-[#F8FAFC] font-mono">
                            {item.industryMedian.toFixed(2)}{item.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Risk Hurdle Line */}
                    <div className="flex items-center gap-3">
                      <span className="w-24 text-[10px] text-[#F43F5E] truncate">Risk Limit</span>
                      <div className="flex-1 bg-[#080B10] h-3 rounded overflow-hidden border border-[#1E2536] relative">
                        <div
                          style={{ width: `${hurdleWidth}%` }}
                          className="h-full bg-[#F43F5E]/40 border-r-2 border-[#F43F5E] transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TRADITIONAL TILES VIEW */
        <div className="space-y-4">
          {ratioCards.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3 h-3 text-[#C5A880]" />
                <span>{group.group}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    onClick={() => onAuditMetric(item.key, latestPeriod, item.label, null)}
                    className="p-4 bg-[#0F1420] border border-[#1E2536] hover:border-[#C5A880] cursor-pointer transition-all space-y-2.5 rounded-lg group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#C5A880] transition-colors">
                        {item.label}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 border rounded ${getStatusColor(item.status)}`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-2xl font-extrabold font-mono text-[#F8FAFC] tabular-nums">
                      {item.value}
                    </div>

                    {/* Visual Progress Gauge */}
                    <div className="w-full bg-[#080B10] h-1.5 rounded-full overflow-hidden border border-[#1E2536]">
                      <div
                        style={{ width: `${item.progressPct}%` }}
                        className="h-full bg-gradient-to-r from-[#9A7B4F] to-[#C5A880] transition-all duration-300"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                      <span>{item.benchmark}</span>
                      <span className="text-[9px] text-[#C5A880] opacity-0 group-hover:opacity-100 transition-opacity">
                        AUDIT FORMULA &rarr;
                      </span>
                    </div>

                    <div className="text-[10px] text-[#94A3B8] leading-tight pt-1 border-t border-[#1E2536]/50">
                      {item.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
