"use client";

import React, { useState } from "react";
import { Layers, BarChart3, LayoutGrid, Info, ArrowRight, Scale } from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { INSTITUTIONAL_COMPANIES } from "@/lib/institutionalDatabase";
import { formatRatio, formatPct, formatFinancialValue } from "@/lib/formatters";
import { ModuleTab } from "./NavigationTabs";
import { DrawingPowerCard } from "./DrawingPowerCard";

interface HealthRatiosProps {
  profile: CompanyRiskProfile;
  onAuditMetric: (metricKey: string, period: string, label: string, value?: number | null) => void;
  onNavigateToTab?: (tab: ModuleTab) => void;
}

export function HealthRatios({ profile, onAuditMetric, onNavigateToTab }: HealthRatiosProps) {
  const { latestRatios, periods, company, riskTier, riskScore } = profile;
  const latestPeriod = periods[0]?.period || "LATEST";
  const [activeView, setActiveView] = useState<"TILES" | "POWER_BI">("POWER_BI");

  const isTier1 = riskTier === "TIER_1_STABLE";
  const isTier2 = riskTier === "TIER_2_WATCHLIST";

  
  // Dynamic Peer Median Calculation with explicit sample size n
  const sectorPeers = Object.values(INSTITUTIONAL_COMPANIES).filter(
    (c) => c.company.sector.toLowerCase() === company.sector.toLowerCase()
  );
  const hasSufficientPeers = sectorPeers.length >= 3;
  const activePeerGroup = hasSufficientPeers ? sectorPeers : Object.values(INSTITUTIONAL_COMPANIES);
  const peerSampleSize = sectorPeers.length;
  const peerGroupLabel = hasSufficientPeers ? `${company.sector} (n=${peerSampleSize})` : `Insufficient peer data (n=${peerSampleSize} < 3)`;

  // Compute medians
  const computeMedian = (getter: (p: (typeof activePeerGroup)[number]) => number | null): number => {
    const vals = activePeerGroup.map(getter).filter((v): v is number => v !== null && !isNaN(v)).sort((a, b) => a - b);
    if (vals.length === 0) return 0;
    const mid = Math.floor(vals.length / 2);
    return vals.length % 2 !== 0 ? vals[mid] : Number(((vals[mid - 1] + vals[mid]) / 2).toFixed(2));
  };

  const medianLeverage = computeMedian((p) => {
    const latest = p.periods[0];
    if (!latest || !latest.ebitda || latest.ebitda <= 0) return null;
    const netDebt = (latest.totalDebt ?? 0) - (latest.cashAndEquivalents ?? 0);
    return Number((netDebt / latest.ebitda).toFixed(2));
  });

  const medianCoverage = computeMedian((p) => {
    const latest = p.periods[0];
    if (!latest || !latest.interestExpense || latest.interestExpense <= 0) return 20.0;
    return Number(((latest.ebit ?? 0) / latest.interestExpense).toFixed(2));
  });

  const medianCurrentRatio = computeMedian((p) => {
    const latest = p.periods[0];
    if (!latest || !latest.totalCurrentLiabilities || latest.totalCurrentLiabilities <= 0) return null;
    return Number(((latest.totalCurrentAssets ?? 0) / latest.totalCurrentLiabilities).toFixed(2));
  });

  const medianOperatingMargin = computeMedian((p) => {
    const latest = p.periods[0];
    if (!latest || !latest.revenue || latest.revenue <= 0) return null;
    return Number((((latest.ebit ?? 0) / latest.revenue) * 100).toFixed(1));
  });

  const medianCfoToNi = computeMedian((p) => {
    const latest = p.periods[0];
    if (!latest || !latest.netIncome || latest.netIncome <= 0) return null;
    return Number(((latest.operatingCashFlow ?? 0) / latest.netIncome).toFixed(2));
  });

  // Comparative Benchmarking Data (Target Entity vs Industry Median vs Hurdle)
  const comparisons = [
    {
      metric: "Net Debt / EBITDA",
      unit: "x",
      companyVal: latestRatios.netDebtToEbitda ?? 0,
      industryMedian: medianLeverage || 2.3,
      sampleSize: peerSampleSize,
      peerLabel: peerGroupLabel,
      hasSufficientPeers,
      hurdle: 3.5,
      hurdleLabel: "Reference ≤ 3.50x",
      lowerIsBetter: true,
      meaning: "Years of operational earnings needed to eliminate all funded debt. Lower is safer.",
      status: (latestRatios.netDebtToEbitda ?? 0) <= 2.5 ? "STRONG" : (latestRatios.netDebtToEbitda ?? 0) <= 3.5 ? "MONITOR" : "ALERT",
    },
    {
      metric: "EBIT Interest Coverage",
      unit: "x",
      companyVal: latestRatios.interestCoverage ?? 99,
      industryMedian: medianCoverage || 4.8,
      sampleSize: peerSampleSize,
      peerLabel: peerGroupLabel,
      hasSufficientPeers,
      hurdle: 2.5,
      hurdleLabel: "Reference ≥ 2.50x",
      lowerIsBetter: false,
      meaning: "How many times operating profit can pay annual loan interest. Higher is safer.",
      status: (latestRatios.interestCoverage ?? 99) >= 4.0 ? "STRONG" : (latestRatios.interestCoverage ?? 99) >= 2.5 ? "MONITOR" : "ALERT",
    },
    {
      metric: "Current Liquidity Ratio",
      unit: "x",
      companyVal: latestRatios.currentRatio ?? 1.0,
      industryMedian: medianCurrentRatio || 1.45,
      sampleSize: peerSampleSize,
      peerLabel: peerGroupLabel,
      hasSufficientPeers,
      hurdle: 1.3,
      hurdleLabel: "Reference ≥ 1.30x",
      lowerIsBetter: false,
      meaning: "Liquid short-term assets available for every 1.00 unit of bills due within 1 year.",
      status: (latestRatios.currentRatio ?? 1.0) >= 1.3 ? "STRONG" : (latestRatios.currentRatio ?? 1.0) >= 1.1 ? "MONITOR" : "ALERT",
    },
    {
      metric: "Operating (EBIT) Margin",
      unit: "%",
      companyVal: latestRatios.operatingMarginPct ?? 15,
      industryMedian: medianOperatingMargin || 16.5,
      sampleSize: peerSampleSize,
      peerLabel: peerGroupLabel,
      hasSufficientPeers,
      hurdle: 10.0,
      hurdleLabel: "Reference ≥ 10.0%",
      lowerIsBetter: false,
      meaning: "Percentage of top-line revenue converted into core operating profit.",
      status: (latestRatios.operatingMarginPct ?? 15) >= 20 ? "STRONG" : (latestRatios.operatingMarginPct ?? 15) >= 10 ? "MONITOR" : "ALERT",
    },
    {
      metric: "Cash Conversion (CFO / NI)",
      unit: "x",
      companyVal: latestRatios.cfoToNetIncome ?? 1.0,
      industryMedian: medianCfoToNi || 0.95,
      sampleSize: peerSampleSize,
      peerLabel: peerGroupLabel,
      hasSufficientPeers,
      hurdle: 0.85,
      hurdleLabel: "Reference ≥ 0.85x",
      lowerIsBetter: false,
      meaning: "Quality of earnings: confirms accounting profit is backed by real bankable cash.",
      status: (latestRatios.cfoToNetIncome ?? 1.0) >= 1.0 ? "STRONG" : (latestRatios.cfoToNetIncome ?? 1.0) >= 0.85 ? "MONITOR" : "ALERT",
    },
  ];

  const ratioCards = [
    {
      group: "1. LIQUIDITY & WORKING CAPITAL",
      items: [
        {
          key: "currentRatio",
          label: "Current Ratio",
          value: formatRatio(latestRatios.currentRatio),
          formula: "Total Current Assets / Total Current Liabilities",
          explanation: `What it means: The company reports ${latestRatios.currentRatio?.toFixed(2) ?? "1.00"} ${company.currency} of current assets for every 1.00 ${company.currency} of current liabilities.`,
          status:
            latestRatios.currentRatio !== null && latestRatios.currentRatio >= 1.2
              ? "TIER_1"
              : latestRatios.currentRatio !== null && latestRatios.currentRatio >= 1.0
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Hurdle: > 1.10x",
          progressPct: Math.min(100, Math.max(10, ((latestRatios.currentRatio ?? 1) / 2.0) * 100)),
        },
        {
          key: "quickRatio",
          label: "Quick Acid-Test Ratio",
          value: formatRatio(latestRatios.quickRatio),
          formula: "(Cash + Marketable Securities + Receivables) / Current Liabilities",
          explanation: "Excludes hard-to-sell inventory; verifies instant emergency liquidity buffer.",
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
          explanation: "Pure liquid cash reserves available to pay near-term obligations immediately.",
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
      group: "2. DEBT, LEVERAGE & CASH FLOW",
      items: [
        {
          key: "netDebtToEbitda",
          label: "Net Debt / EBITDA",
          value: formatRatio(latestRatios.netDebtToEbitda),
          formula: "(Total Debt - Cash & Liquid Assets) / EBITDA",
          explanation: "What it means: It would take " + (latestRatios.netDebtToEbitda?.toFixed(2) ?? "N/A") + " years of operating profits to extinguish all net debt (negative = net cash surplus!).",
          status:
            latestRatios.netDebtToEbitda !== null && latestRatios.netDebtToEbitda <= 2.5
              ? "TIER_1"
              : latestRatios.netDebtToEbitda !== null && latestRatios.netDebtToEbitda <= 3.5
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Ceiling: ≤ 3.50x",
          progressPct: Math.max(10, Math.min(100, 100 - ((latestRatios.netDebtToEbitda ?? 1) / 5) * 100)),
        },
        {
          key: "interestCoverage",
          label: "EBIT Interest Coverage",
          value: formatRatio(latestRatios.interestCoverage),
          formula: "Operating Income (EBIT) / Interest Expense",
          explanation: "What it means: The company can pay its annual financing interest charges " + (latestRatios.interestCoverage?.toFixed(2) ?? "N/A") + " times from operating earnings.",
          status:
            latestRatios.interestCoverage !== null && latestRatios.interestCoverage >= 4.0
              ? "TIER_1"
              : latestRatios.interestCoverage !== null && latestRatios.interestCoverage >= 2.5
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Floor: ≥ 2.50x",
          progressPct: Math.min(100, Math.max(10, ((latestRatios.interestCoverage ?? 2) / 10) * 100)),
        },
        {
          key: "debtToEquity",
          label: "Debt-to-Equity (D/E)",
          value: formatRatio(latestRatios.debtToEquity),
          formula: "Total Debt / Total Shareholders Equity",
          explanation: "Total bank borrowing leverage relative to shareholder net worth.",
          status:
            latestRatios.debtToEquity !== null && latestRatios.debtToEquity <= 1.5
              ? "TIER_1"
              : "TIER_2",
          benchmark: "Prudent: ≤ 1.50x",
          progressPct: Math.max(10, Math.min(100, 100 - ((latestRatios.debtToEquity ?? 0.5) / 3) * 100)),
        },
      ],
    },
    {
      group: "3. PROFITABILITY MARGINS",
      items: [
        {
          key: "grossMarginPct",
          label: "Gross Profit Margin",
          value: formatPct(latestRatios.grossMarginPct),
          formula: "Gross Profit / Total Revenue * 100",
          explanation: "Profitability remaining after direct production and product delivery costs.",
          status: "TIER_1",
          benchmark: "Pricing Power",
          progressPct: Math.min(100, Math.max(10, (latestRatios.grossMarginPct ?? 30) * 1.5)),
        },
        {
          key: "operatingMarginPct",
          label: "Operating (EBIT) Margin",
          value: formatPct(latestRatios.operatingMarginPct),
          formula: "EBIT / Total Revenue * 100",
          explanation: "Core operational earnings margin before deducting interest expenses and corporate taxes.",
          status: "TIER_1",
          benchmark: "Efficiency",
          progressPct: Math.min(100, Math.max(10, (latestRatios.operatingMarginPct ?? 15) * 2.5)),
        },
        {
          key: "cfoToNetIncome",
          label: "CFO / Net Income Cash Conversion",
          value: formatRatio(latestRatios.cfoToNetIncome),
          formula: "Cash from Operations (CFO) / Reported Net Income",
          explanation: "Quality of earnings: verifies that reported book profits are backed by actual bankable cash.",
          status:
            latestRatios.cfoToNetIncome !== null && latestRatios.cfoToNetIncome >= 0.9
              ? "TIER_1"
              : latestRatios.cfoToNetIncome !== null && latestRatios.cfoToNetIncome >= 0.6
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Quality: ≥ 0.85x",
          progressPct: Math.min(100, Math.max(10, ((latestRatios.cfoToNetIncome ?? 0.8) / 1.5) * 100)),
        },
      ],
    },
    {
      group: "4. CAPITAL RETURNS & ASSET EFFICIENCY",
      items: [
        {
          key: "roePct",
          label: "Return on Equity (ROE)",
          value: formatPct(latestRatios.roePct),
          formula: "Net Income / Shareholders' Equity * 100",
          explanation: "Return generated per unit of net shareholder equity invested in the corporate vehicle.",
          status:
            latestRatios.roePct !== null && latestRatios.roePct >= 15
              ? "TIER_1"
              : latestRatios.roePct !== null && latestRatios.roePct >= 8
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Prime: ≥ 15.0%",
          progressPct: Math.min(100, Math.max(10, (latestRatios.roePct ?? 10) * 2.5)),
        },
        {
          key: "roaPct",
          label: "Return on Assets (ROA)",
          value: formatPct(latestRatios.roaPct),
          formula: "Net Income / Total Audited Assets * 100",
          explanation: "Operating productivity: how efficiently management converts assets into net returns.",
          status:
            latestRatios.roaPct !== null && latestRatios.roaPct >= 7
              ? "TIER_1"
              : latestRatios.roaPct !== null && latestRatios.roaPct >= 3
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Solid: ≥ 5.0%",
          progressPct: Math.min(100, Math.max(10, (latestRatios.roaPct ?? 5) * 5)),
        },
        {
          key: "netMarginPct",
          label: "Net Profit Margin",
          value: formatPct(latestRatios.netMarginPct),
          formula: "Net Income / Total Revenue * 100",
          explanation: "Bottom-line profitability retained after accounting for all operating and financing costs.",
          status:
            latestRatios.netMarginPct !== null && latestRatios.netMarginPct >= 10
              ? "TIER_1"
              : latestRatios.netMarginPct !== null && latestRatios.netMarginPct >= 5
              ? "TIER_2"
              : "TIER_3",
          benchmark: "Sound: ≥ 8.0%",
          progressPct: Math.min(100, Math.max(10, (latestRatios.netMarginPct ?? 5) * 4)),
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
      {/* 1. Big Visual Health Score Banner & Company Solvency Header */}
      <div className="p-5 bg-[#0C111C] border border-[#1E293B] rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-xl">
        <div className="flex items-center gap-4">
          {/* Big Visual Health Score */}
          <div
            className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border font-mono shrink-0 shadow-lg ${
              riskScore >= 80
                ? "bg-[#10B981]/15 border-[#10B981] text-[#10B981]"
                : riskScore >= 50
                ? "bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B]"
                : "bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444]"
            }`}
          >
            <span className="text-2xl font-black">{riskScore}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-lg font-bold text-white tracking-wide uppercase font-mono">
                {company.name} ({company.symbol})
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 border font-bold rounded-full font-mono ${
                  isTier1
                    ? "border-[#10B981] text-[#10B981] bg-[#10B981]/10"
                    : isTier2
                    ? "border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10"
                    : "border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10"
                }`}
              >
                {riskScore >= 80 ? "TIER 1 // LOW RISK" : riskScore >= 50 ? "TIER 2 // WATCHLIST" : "TIER 3 // ELEVATED RISK"}
              </span>
            </div>
            <div className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              {isTier1
                ? "Strong Solvency: Substantial liquid reserves, conservative debt service cushion, and clean operating cash conversion."
                : isTier2
                ? "Watchlist Surveillance: Moderate debt gearing or compressed fixed charge coverage. Quarterly covenant testing recommended."
                : "Critical Solvency Alert: Significant leverage breach or liquidity strain. Restructuring risk elevated."}
            </div>
          </div>
        </div>

        {/* View Switcher & Proceed to Macro Simulator Shortcut */}
        <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
          <div className="flex items-center gap-1 bg-[#070A0F] border border-[#1E293B] p-1 rounded-xl">
            <button
              onClick={() => setActiveView("POWER_BI")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "POWER_BI"
                  ? "bg-[#1E293B] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>BENCHMARKS</span>
            </button>
            <button
              onClick={() => setActiveView("TILES")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "TILES"
                  ? "bg-[#1E293B] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>METRIC CARDS</span>
            </button>
          </div>

          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab("06_SIMULATOR")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
            >
              <span>Stress Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Core 3-Statement Summary Table (Across Last 3 Fiscal Years) */}
      <div className="bg-[#0C111C] border border-[#1E293B] rounded-2xl overflow-hidden shadow-lg">
        <div className="p-3.5 bg-[#0F1626] border-b border-[#1E293B] flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#38BDF8]" />
            <span>Core 3-Statement Summary &bull; Audited Ledger ({periods.length} {periods.length === 1 ? "period" : "periods"} available)</span>
          </span>
          <span className="text-[10px] text-[#64748B] font-mono">
            Reporting: {company.currency} ({company.scaleUnit})
          </span>
        </div>
        <div className="sm:hidden px-3 py-1.5 bg-[#0A0E18] border-b border-[#1E293B] text-[10px] text-[#94A3B8] flex items-center justify-between">
          <span>← Swipe to inspect multi-year filings</span>
          <span className="text-[#38BDF8] font-bold">Historical →</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#070A0F] text-[#94A3B8] uppercase text-[10px] border-b border-[#1E293B]">
              <tr>
                <th className="px-4 py-2.5 sticky left-0 bg-[#070A0F] z-20 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">Fiscal Period</th>
                <th className="px-4 py-2.5 text-right min-w-[140px]">Consolidated Revenue</th>
                <th className="px-4 py-2.5 text-right min-w-[140px]">Operating Profit (EBITDA)</th>
                <th className="px-4 py-2.5 text-right min-w-[130px]">Total Debt</th>
                <th className="px-4 py-2.5 text-right min-w-[130px]">Cash Reserves</th>
                <th className="px-4 py-2.5 text-center min-w-[140px]">Filing Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/70">
              {periods.slice(0, 3).map((p) => (
                <tr key={p.id} className="hover:bg-[#111827]/60 transition-colors group">
                  <td className="px-4 py-3 font-bold text-[#38BDF8] sticky left-0 bg-[#0C111C] group-hover:bg-[#111827] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)] border-r border-[#1E293B]/50">{p.period}</td>
                  <td className="px-4 py-3 text-right text-white font-semibold">
                    {formatFinancialValue(p.revenue, company.currency, company.scaleUnit)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#10B981] font-semibold">
                    {formatFinancialValue(p.ebitda, company.currency, company.scaleUnit)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#F59E0B]">
                    {p.totalDebt === 0 || p.totalDebt === null
                      ? "Zero Debt"
                      : formatFinancialValue(p.totalDebt, company.currency, company.scaleUnit)}
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {formatFinancialValue(p.cashAndEquivalents, company.currency, company.scaleUnit)}
                  </td>
                  <td className="px-4 py-3 text-center text-[#64748B] text-[11px]">
                    {p.filingForm} ({p.filingDate})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. 3 Solvency Cards with Plain-English Tooltips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Net Debt / EBITDA (Leverage) */}
        <div className="p-4 bg-[#0C111C] border border-[#1E293B] rounded-2xl flex flex-col justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
                1. LEVERAGE
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  (latestRatios.netDebtToEbitda ?? 0) <= 2.5
                    ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                    : (latestRatios.netDebtToEbitda ?? 0) <= 3.5
                    ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                    : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                }`}
              >
                {(latestRatios.netDebtToEbitda ?? 0) <= 3.5 ? "COMPLIANT" : "BREACH"}
              </span>
            </div>
            <div className="font-bold text-sm text-white mt-1">
              Net Debt / EBITDA
            </div>
            <div className="text-2xl font-black font-mono text-[#38BDF8] mt-1">
              {(latestRatios.netDebtToEbitda ?? 0) <= 0
                ? `${latestRatios.netDebtToEbitda !== null ? `${latestRatios.netDebtToEbitda.toFixed(2)}x` : "N/D"} (Net Cash)`
                : `${latestRatios.netDebtToEbitda?.toFixed(2)}x`}
            </div>
          </div>
          <div className="pt-2 border-t border-[#1E293B]/70">
            <div className="text-[11px] text-[#94A3B8] leading-relaxed">
              <span className="text-white font-semibold">Can it pay off debt with profits?</span>{" "}
              {(latestRatios.netDebtToEbitda ?? 0) <= 0
                ? "Yes. Cash reserves exceed total debt, rendering the company debt-free."
                : `Takes ~${latestRatios.netDebtToEbitda?.toFixed(1)} years of operating profit to eliminate debt, well below the 3.50x bank hurdle.`}
            </div>
            <div className="text-[10px] font-mono text-[#64748B] mt-1.5">
              Institutional Hurdle: &le; 3.50x
            </div>
          </div>
        </div>

        {/* Card 2: Interest Coverage (Debt Service) */}
        <div className="p-4 bg-[#0C111C] border border-[#1E293B] rounded-2xl flex flex-col justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
                2. DEBT SERVICE
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  (latestRatios.interestCoverage ?? 99) >= 2.5
                    ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                    : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                }`}
              >
                {(latestRatios.interestCoverage ?? 99) >= 2.5 ? "COMPLIANT" : "AT RISK"}
              </span>
            </div>
            <div className="font-bold text-sm text-white mt-1">
              Interest Coverage
            </div>
            <div className="text-2xl font-black font-mono text-[#10B981] mt-1">
              {latestRatios.interestCoverage !== null ? `${latestRatios.interestCoverage.toFixed(1)}x` : "N/A: No debt interest cost"}
            </div>
          </div>
          <div className="pt-2 border-t border-[#1E293B]/70">
            <div className="text-[11px] text-[#94A3B8] leading-relaxed">
              <span className="text-white font-semibold">Can it afford annual interest?</span>{" "}
              {(periods[0]?.totalDebt ?? 0) === 0 && (periods[0]?.interestExpense ?? 0) > 0 ? "No financial borrowings; finance cost relates to lease liabilities and other items." : latestRatios.interestCoverage !== null && latestRatios.interestCoverage >= 4.0
                ? `Operating earnings cover loan interest ${latestRatios.interestCoverage.toFixed(1)}x over, insulating against rate shocks.`
                : "Operating earnings comfortably exceed borrowing costs."}
            </div>
            <div className="text-[10px] font-mono text-[#64748B] mt-1.5">
              Institutional Hurdle: &ge; 2.50x
            </div>
          </div>
        </div>

        {/* Card 3: Current Ratio (Liquidity) */}
        <div className="p-4 bg-[#0C111C] border border-[#1E293B] rounded-2xl flex flex-col justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
                3. LIQUIDITY
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  (latestRatios.currentRatio ?? 1) >= 1.10
                    ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                    : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                }`}
              >
                {(latestRatios.currentRatio ?? 1) >= 1.10 ? "COMPLIANT" : "WATCHLIST"}
              </span>
            </div>
            <div className="font-bold text-sm text-white mt-1">
              Current Ratio
            </div>
            <div className="text-2xl font-black font-mono text-[#F59E0B] mt-1">
              {latestRatios.currentRatio !== null ? `${latestRatios.currentRatio.toFixed(2)}x` : "1.00x"}
            </div>
          </div>
          <div className="pt-2 border-t border-[#1E293B]/70">
            <div className="text-[11px] text-[#94A3B8] leading-relaxed">
              <span className="text-white font-semibold">Can it pay bills over the next 12 months?</span>{" "}
              Holds {latestRatios.currentRatio?.toFixed(2) || "1.00"} in liquid short-term assets for every 1.00 in upcoming liabilities.
            </div>
            <div className="text-[10px] font-mono text-[#64748B] mt-1.5">
              Institutional Hurdle: &ge; 1.10x
            </div>
          </div>
        </div>
      </div>

      {/* EXECUTIVE SYNTHESIS: WHAT THIS DESK TELLS YOU (Direct Plain-English Takeaways) */}
      <div className="p-4 bg-[#090D17] border border-[#182337] rounded-xl space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#182337] pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#38BDF8] uppercase tracking-wider">
            <Info className="w-4 h-4 text-[#38BDF8]" />
            <span>EXECUTIVE SYNTHESIS: WHAT THESE RATIOS MEAN IN BUSINESS REALITY</span>
          </div>
          <span className="text-[10px] text-[#64748B]">INSTITUTIONAL SCREENING ACCORD</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#0D131F] border border-[#182337] rounded-lg space-y-1">
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
              {(periods[0]?.totalDebt ?? 0) === 0 && (periods[0]?.interestExpense ?? 0) > 0 ? "No financial borrowings; finance cost relates to lease liabilities and other items." : latestRatios.interestCoverage !== null && latestRatios.interestCoverage >= 4.0
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
                <BarChart3 className="w-4 h-4 text-[#38BDF8]" />
                <span>COMPARATIVE BENCHMARK MATRIX (COMPANY VS PEERS VS HURDLE)</span>
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">
                Evaluated against Illustrative Screening Reference Levels &amp; Calibrated Hurdles
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#38BDF8]"></span>
                <span className="text-[#F8FAFC] font-bold">{company.symbol}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#3B82F6]"></span>
                <span className="text-[#94A3B8]">Illustrative Reference Level</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#F43F5E]"></span>
                <span className="text-[#94A3B8]">Screening Hurdle</span>
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
                      <span className="w-24 text-[10px] text-[#38BDF8] font-bold truncate">{company.symbol}</span>
                      <div className="flex-1 bg-[#080B10] h-5 rounded overflow-hidden border border-[#1E2536] relative">
                        <div
                          style={{ width: `${compWidth}%` }}
                          className="h-full bg-gradient-to-r from-[#9A7B4F] to-[#38BDF8] rounded transition-all duration-500 flex items-center justify-end pr-2"
                        >
                          <span className="text-[10px] font-extrabold text-[#080B10] font-mono">
                            {item.companyVal.toFixed(2)}{item.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Industry Median Bar or Insufficient Data Notice */}
                    <div className="flex items-center gap-3">
                      <span className="w-24 text-[10px] text-[#94A3B8] truncate" title={`Sector: ${company.sector}`}>
                        Peer Median
                      </span>
                      {item.hasSufficientPeers ? (
                        <div className="flex-1 bg-[#080B10] h-4 rounded overflow-hidden border border-[#1E2536] relative">
                          <div
                            style={{ width: `${medianWidth}%` }}
                            className="h-full bg-[#3B82F6]/60 rounded transition-all duration-500 flex items-center justify-end pr-2"
                          >
                            <span className="text-[9px] font-bold text-[#F8FAFC] font-mono">
                              {item.industryMedian.toFixed(2)}{item.unit} (n={item.sampleSize})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 text-[10px] font-mono text-[#64748B] italic bg-[#080B10] px-2.5 py-1 rounded border border-[#1E2536]">
                          Insufficient peer data (n = {item.sampleSize} &lt; 3 in sector)
                        </div>
                      )}
                    </div>

                    {/* Reference Threshold (Configurable) */}
                    <div className="flex items-center gap-3">
                      <span className="w-24 text-[10px] text-[#F43F5E] truncate" title="Analytical reference hurdle (configurable)">
                        Ref. Threshold
                      </span>
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
                <Layers className="w-3 h-3 text-[#38BDF8]" />
                <span>{group.group}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    onClick={() => onAuditMetric(item.key, latestPeriod, item.label, null)}
                    className="p-4 bg-[#0F1420] border border-[#1E2536] hover:border-[#38BDF8] cursor-pointer transition-all space-y-2.5 rounded-lg group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors">
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
                        className="h-full bg-gradient-to-r from-[#9A7B4F] to-[#38BDF8] transition-all duration-300"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                      <span>{item.benchmark}</span>
                      <span className="text-[9px] text-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity">
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

      {/* INDIAN BANKING APPRAISAL & ADVANCED DIAGNOSTIC FRAMEWORK */}
      <div className="p-4 bg-[#0A0E17] border border-[#1E2536] rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E2536] pb-2 gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
            <Scale className="w-4 h-4 text-[#38BDF8]" />
            <span>INDIAN BANKING APPRAISAL &amp; MULTIVARIATE DIAGNOSTIC ACCORD</span>
          </div>
          <span className="text-[10px] text-[#94A3B8]">
            Indian Banking Consortium / Ind-AS / US-GAAP Appraisal Standards
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Metric 1: TOL / TNW */}
          <div className="p-3 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-[#64748B] uppercase font-bold">
              <span>TOL / TNW (Gearing)</span>
              <span className="text-[#38BDF8]">Ref Level: &lt; 3.00x</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {latestRatios.tolToTnw !== null && latestRatios.tolToTnw !== undefined
                ? `${latestRatios.tolToTnw.toFixed(2)}x`
                : "N/D"}
            </div>
            <p className="text-[10px] text-[#94A3B8] leading-tight">
              Total Outside Liabilities to Tangible Net Worth. Illustrative reference level: &lt; 3.00x (user-adjustable, not a regulatory limit).
            </p>
          </div>

          {/* Metric 2: Debt Service Rollover Proxy */}
          <div className="p-3 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-[#64748B] uppercase font-bold">
              <span>Debt Service Proxy</span>
              <span className="text-[#10B981]">&ge; 1.50x</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {latestRatios.debtServiceProxy !== null && latestRatios.debtServiceProxy !== undefined
                ? `${latestRatios.debtServiceProxy.toFixed(2)}x`
                : "N/D"}
            </div>
            <p className="text-[10px] text-[#94A3B8] leading-tight">
              EBITDA / (Interest + ST Debt). Rollover buffer proxy (not certified statutory DSCR).
            </p>
          </div>

          {/* Metric 3: Statutory DSCR Status */}
          <div className="p-3 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-[#64748B] uppercase font-bold">
              <span>Certified DSCR</span>
              <span className="text-[#F59E0B]">Footnote Audit</span>
            </div>
            <div className="text-base font-bold font-mono text-[#F59E0B]">
              N/D (Footnote Note)
            </div>
            <p className="text-[10px] text-[#94A3B8] leading-tight">
              Requires scheduled principal repayments from debt maturity footnotes; no estimated figures.
            </p>
          </div>

          {/* Metric 4: Altman Z'' Diagnostic */}
          <div className="p-3 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-[#64748B] uppercase font-bold">
              <span>Altman Z&apos;&apos; Diagnostic</span>
              <span className="text-[#94A3B8]">&gt; 2.60 Safe</span>
            </div>
            <div className="text-base font-bold font-mono text-[#94A3B8]">
              {latestRatios.altmanZDoublePrime !== null && latestRatios.altmanZDoublePrime !== undefined
                ? `${latestRatios.altmanZDoublePrime.toFixed(2)} (${latestRatios.altmanZZone})`
                : "N/D (Unsegregated)"}
            </div>
            <p className="text-[10px] text-[#94A3B8] leading-tight">
              Requires retained earnings breakout from balance sheet. Returns N/D rather than approximation.
            </p>
          </div>
        </div>

        {/* Screening Indicator Disclaimer */}
        <div className="p-2.5 bg-[#080B10] border border-[#1E2536] rounded text-[10px] text-[#64748B] flex items-center justify-between">
          <span>
            <strong>Screening Notice:</strong> Health scores ({riskScore}/100) and screening tiers ({riskTier}) are deterministic internal indicators and do not represent credit ratings from CRISIL, ICRA, S&amp;P, or Moody&apos;s.
          </span>
          <span className="text-[#38BDF8] ml-2 shrink-0">Standard Accord</span>
        </div>
      </div>

      {/* Indicative Working Capital Drawing Power Card */}
      <DrawingPowerCard company={company} period={periods[0]} />
    </div>
  );
}
