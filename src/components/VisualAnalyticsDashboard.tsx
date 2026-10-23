"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  BarChart3,
  Percent,
  Wallet,
  Scale,
} from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { formatFinancialValue } from "@/lib/formatters";
import { INSTITUTIONAL_COMPANIES } from "@/lib/institutionalDatabase";

interface VisualAnalyticsDashboardProps {
  profile: CompanyRiskProfile;
}

export function VisualAnalyticsDashboard({ profile }: VisualAnalyticsDashboardProps) {
  const { company, periods, latestRatios, riskScore, simulation } = profile;
  const [activeMetricTab, setActiveMetricTab] = useState<"TRENDS" | "CAPITAL" | "MARGINS" | "PEERS">("TRENDS");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const curr = company.currency;
  const scale = company.scaleUnit;

  // Chronologically sort periods (oldest to newest)
  const sortedPeriods = [...periods].reverse();

  // Create projection period for 2026 using simulation inputs if available
  const periodsWithProjection = [
    ...sortedPeriods,
    {
      period: "2026 (Stressed)",
      isProjection: true,
      revenue: simulation.simulatedRevenue,
      ebit: simulation.simulatedEbit,
      netIncome: (simulation.simulatedEbit ?? 0) * 0.75,
      cash: periods[0]?.cashAndEquivalents ?? 0,
      debt: periods[0]?.totalDebt ?? 0,
      opMargin:
        simulation.simulatedRevenue && simulation.simulatedRevenue > 0
          ? ((simulation.simulatedEbit ?? 0) / simulation.simulatedRevenue) * 100
          : 0,
    },
  ];

  // Maximum revenue for SVG scaling
  const maxRev = Math.max(
    ...periodsWithProjection.map((p) => Math.max(p.revenue ?? 0, 1)),
    100
  );

  // Financial calculations for latest period
  const latestPeriod = periods[0];
  const cash = latestPeriod?.cashAndEquivalents ?? 0;
  const debt = latestPeriod?.totalDebt ?? 0;
  const netDebt = debt - cash;
  const isNetCashPositive = netDebt <= 0;
  const maxCashOrDebt = Math.max(cash, debt, 100);

  // Peer benchmark universe
  const peerList = Object.values(INSTITUTIONAL_COMPANIES)
    .filter((p) => p.company.symbol !== company.symbol)
    .slice(0, 4);

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header and Interactive Metric Switcher */}
      <div className="p-4 bg-[#0B0F17] border border-[#1E2536] rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2536]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded text-[#38BDF8]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#F8FAFC]">
                  VISUAL PERFORMANCE &amp; SOLVENCY DASHBOARD
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-[#172033] border border-[#38BDF8]/30 text-[#38BDF8] font-bold rounded">
                  2022 &ndash; 2026E
                </span>
              </div>
              <p className="text-[10px] text-[#94A3B8]">
                Interactive fundamental trajectories &bull; Audited XBRL financials + Stressed 2026 pro-forma projections
              </p>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex items-center gap-1 bg-[#06080D] border border-[#1E2536] p-1 rounded overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveMetricTab("TRENDS")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeMetricTab === "TRENDS"
                  ? "bg-[#172033] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#64748B] hover:text-[#CBD5E1]"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Revenue &amp; EBIT</span>
            </button>
            <button
              onClick={() => setActiveMetricTab("CAPITAL")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeMetricTab === "CAPITAL"
                  ? "bg-[#172033] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#64748B] hover:text-[#CBD5E1]"
              }`}
            >
              <Wallet className="w-3 h-3" />
              <span>Cash vs Debt</span>
            </button>
            <button
              onClick={() => setActiveMetricTab("MARGINS")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeMetricTab === "MARGINS"
                  ? "bg-[#172033] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#64748B] hover:text-[#CBD5E1]"
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>Margin Trajectory</span>
            </button>
            <button
              onClick={() => setActiveMetricTab("PEERS")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeMetricTab === "PEERS"
                  ? "bg-[#172033] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#64748B] hover:text-[#CBD5E1]"
              }`}
            >
              <Scale className="w-3 h-3" />
              <span>Peer Benchmarks</span>
            </button>
          </div>
        </div>

        {/* 4 Core Solvency Health Gauges (Visual Meters) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          {/* Gauge 1: Net Debt / EBITDA */}
          <div className="p-3 bg-[#080B10] border border-[#1E2536] rounded-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
              <span>NET DEBT / EBITDA</span>
              <span className="text-[#38BDF8]">Hurdle: &le; 3.50x</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-xl font-bold text-[#F8FAFC] tabular-nums">
                {latestRatios.netDebtToEbitda !== null
                  ? `${latestRatios.netDebtToEbitda.toFixed(2)}x`
                  : "0.00x (Cash Rich)"}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  (latestRatios.netDebtToEbitda ?? 0) <= 2.0
                    ? "text-[#10B981]"
                    : (latestRatios.netDebtToEbitda ?? 0) <= 3.5
                    ? "text-[#F59E0B]"
                    : "text-[#F43F5E]"
                }`}
              >
                {(latestRatios.netDebtToEbitda ?? 0) <= 2.0
                  ? "PRIME"
                  : (latestRatios.netDebtToEbitda ?? 0) <= 3.5
                  ? "MODERATE"
                  : "CRITICAL"}
              </span>
            </div>
            {/* Visual Health Bar */}
            <div className="w-full bg-[#111622] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (latestRatios.netDebtToEbitda ?? 0) <= 2.0
                    ? "bg-[#10B981]"
                    : (latestRatios.netDebtToEbitda ?? 0) <= 3.5
                    ? "bg-[#F59E0B]"
                    : "bg-[#F43F5E]"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(10, ((latestRatios.netDebtToEbitda ?? 0) / 5) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Gauge 2: Interest Coverage */}
          <div className="p-3 bg-[#080B10] border border-[#1E2536] rounded-lg">
            <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
              <span>INTEREST COVERAGE</span>
              <span className="text-[#38BDF8]">Hurdle: &ge; 2.50x</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-xl font-bold text-[#F8FAFC] tabular-nums">
                {latestRatios.interestCoverage !== null
                  ? `${latestRatios.interestCoverage.toFixed(2)}x`
                  : "&infin; (Zero Debt)"}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  (latestRatios.interestCoverage ?? 99) >= 4.0
                    ? "text-[#10B981]"
                    : (latestRatios.interestCoverage ?? 99) >= 2.5
                    ? "text-[#F59E0B]"
                    : "text-[#F43F5E]"
                }`}
              >
                {(latestRatios.interestCoverage ?? 99) >= 4.0
                  ? "STRONG"
                  : (latestRatios.interestCoverage ?? 99) >= 2.5
                  ? "ADEQUATE"
                  : "BREACH"}
              </span>
            </div>
            <div className="w-full bg-[#111622] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(15, ((latestRatios.interestCoverage ?? 20) / 15) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Gauge 3: Current Ratio */}
          <div className="p-3 bg-[#080B10] border border-[#1E2536] rounded-lg">
            <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
              <span>CURRENT RATIO</span>
              <span className="text-[#38BDF8]">Hurdle: &ge; 1.10x</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-xl font-bold text-[#F8FAFC] tabular-nums">
                {latestRatios.currentRatio !== null
                  ? `${latestRatios.currentRatio.toFixed(2)}x`
                  : "N/D"}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  (latestRatios.currentRatio ?? 0) >= 1.5
                    ? "text-[#10B981]"
                    : (latestRatios.currentRatio ?? 0) >= 1.1
                    ? "text-[#F59E0B]"
                    : "text-[#F43F5E]"
                }`}
              >
                {(latestRatios.currentRatio ?? 0) >= 1.5
                  ? "SAFE"
                  : (latestRatios.currentRatio ?? 0) >= 1.1
                  ? "TIGHT"
                  : "VULNERABLE"}
              </span>
            </div>
            <div className="w-full bg-[#111622] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (latestRatios.currentRatio ?? 0) >= 1.1 ? "bg-[#10B981]" : "bg-[#F43F5E]"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(10, ((latestRatios.currentRatio ?? 1) / 3) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Gauge 4: Composite Solvency Score */}
          <div className="p-3 bg-[#080B10] border border-[#1E2536] rounded-lg">
            <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
              <span>SOLVENCY HEALTH SCORE</span>
              <span className="text-[#38BDF8]">Scale: 0-100</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-xl font-bold text-[#F8FAFC] tabular-nums">
                {riskScore} <span className="text-xs text-[#64748B]">/ 100</span>
              </span>
              <span
                className={`text-[10px] font-bold ${
                  riskScore >= 80
                    ? "text-[#10B981]"
                    : riskScore >= 50
                    ? "text-[#F59E0B]"
                    : "text-[#F43F5E]"
                }`}
              >
                {riskScore >= 80 ? "TIER 1 PRIME" : riskScore >= 50 ? "WATCHLIST" : "DISTRESS"}
              </span>
            </div>
            <div className="w-full bg-[#111622] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  riskScore >= 80
                    ? "bg-[#10B981]"
                    : riskScore >= 50
                    ? "bg-[#F59E0B]"
                    : "bg-[#F43F5E]"
                }`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Section */}
      <div className="p-5 bg-[#0B0F17] border border-[#1E2536] rounded-lg">
        {/* VIEW 1: REVENUE & OPERATING PROFIT (EBIT) MULTI-YEAR BARS */}
        {activeMetricTab === "TRENDS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                  MULTI-YEAR REVENUE &amp; OPERATING PROFIT (EBIT) TRAJECTORY
                </h4>
                <p className="text-[10px] text-[#64748B]">
                  Values in {curr} {scale} &bull; Projections highlight 2026 Stressed scenario
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#38BDF8] rounded-sm" />
                  <span className="text-[#94A3B8]">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#38BDF8] rounded-sm" />
                  <span className="text-[#94A3B8]">EBIT (Op Profit)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#F43F5E]/60 rounded-sm" />
                  <span className="text-[#94A3B8]">2026 Stressed</span>
                </div>
              </div>
            </div>

            {/* SVG Interactive Bar Chart */}
            <div className="relative pt-6 pb-2">
              <div className="grid grid-cols-4 gap-4 items-end h-56 border-b border-[#1E2536] px-4">
                {periodsWithProjection.map((p, idx) => {
                  const revHeight = Math.max(12, ((p.revenue ?? 0) / maxRev) * 100);
                  const ebitVal = p.ebit ?? 0;
                  const ebitHeight = Math.max(6, (ebitVal / maxRev) * 100);
                  const isStressed = "isProjection" in p && p.isProjection;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                    >
                      {/* Tooltip on hover */}
                      {hoveredIndex === idx && (
                        <div className="absolute -top-16 z-20 bg-[#080B10] border border-[#38BDF8] p-2 rounded shadow-xl text-center whitespace-nowrap min-w-[140px]">
                          <div className="text-[10px] text-[#38BDF8] font-bold">{p.period}</div>
                          <div className="text-[10px] text-[#F8FAFC]">
                            Rev: {formatFinancialValue(p.revenue, curr, scale)}
                          </div>
                          <div className="text-[10px] text-[#10B981]">
                            EBIT: {formatFinancialValue(p.ebit, curr, scale)}
                          </div>
                        </div>
                      )}

                      {/* Bar Pair */}
                      <div className="flex items-end gap-2 w-full max-w-[80px] justify-center">
                        {/* Revenue Bar */}
                        <div
                          style={{ height: `${revHeight}%` }}
                          className={`w-1/2 rounded-t transition-all duration-300 relative ${
                            isStressed
                              ? "bg-gradient-to-t from-[#F43F5E]/40 to-[#F43F5E] border-t border-x border-[#F43F5E]"
                              : "bg-gradient-to-t from-[#0284C7] to-[#38BDF8] hover:brightness-110"
                          }`}
                        >
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#CBD5E1] opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatFinancialValue(p.revenue, curr, scale)}
                          </span>
                        </div>

                        {/* EBIT Bar */}
                        <div
                          style={{ height: `${ebitHeight}%` }}
                          className={`w-1/2 rounded-t transition-all duration-300 relative ${
                            isStressed
                              ? "bg-gradient-to-t from-[#F59E0B]/40 to-[#F59E0B] border-t border-x border-[#F59E0B]"
                              : "bg-gradient-to-t from-[#1D4ED8] to-[#38BDF8] hover:brightness-110"
                          }`}
                        >
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatFinancialValue(p.ebit, curr, scale)}
                          </span>
                        </div>
                      </div>

                      {/* Period Label */}
                      <div className="mt-3 text-center">
                        <div
                          className={`text-[11px] font-bold ${
                            isStressed ? "text-[#F43F5E]" : "text-[#F8FAFC]"
                          }`}
                        >
                          {p.period}
                        </div>
                        {isStressed && (
                          <div className="text-[8.5px] text-[#F43F5E] uppercase font-semibold">
                            HYPOTHETICAL
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CASH VS DEBT LIQUIDITY COMPARISON */}
        {activeMetricTab === "CAPITAL" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                  LIQUIDITY RESERVES VS TOTAL DEBT OBLIGATIONS
                </h4>
                <p className="text-[10px] text-[#64748B]">
                  Balance Sheet Position as of Audited Period {latestPeriod?.period}
                </p>
              </div>

              <div
                className={`px-3 py-1 text-xs font-bold rounded border ${
                  isNetCashPositive
                    ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/40"
                    : "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/40"
                }`}
              >
                {isNetCashPositive
                  ? "🛡️ NET CASH BALANCE SHEET"
                  : "⚠️ LEVERAGED BALANCE SHEET"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
              {/* Cash vs Debt Bar Meter */}
              <div className="p-4 bg-[#080B10] border border-[#1E2536] rounded-lg space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#10B981] font-bold flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5" /> Cash &amp; Liquid Securities
                    </span>
                    <span className="font-bold text-[#F8FAFC] tabular-nums">
                      {formatFinancialValue(cash, curr, scale)}
                    </span>
                  </div>
                  <div className="w-full bg-[#111622] h-4 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#059669] to-[#10B981] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(8, (cash / maxCashOrDebt) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#F43F5E] font-bold flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" /> Total Debt (Short + Long-Term)
                    </span>
                    <span className="font-bold text-[#F8FAFC] tabular-nums">
                      {formatFinancialValue(debt, curr, scale)}
                    </span>
                  </div>
                  <div className="w-full bg-[#111622] h-4 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#BE123C] to-[#F43F5E] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(8, (debt / maxCashOrDebt) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Net Debt Verdict Callout */}
                <div className="p-3 bg-[#111622] border border-[#1E2536] rounded text-[11px] space-y-1">
                  <div className="text-[#94A3B8]">NET POSITION:</div>
                  <div className="text-sm font-bold text-[#F8FAFC]">
                    {isNetCashPositive
                      ? `+${formatFinancialValue(Math.abs(netDebt), curr, scale)} Surplus Cash`
                      : `-${formatFinancialValue(netDebt, curr, scale)} Net Indebtedness`}
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    {isNetCashPositive
                      ? "Zero vulnerability to central bank interest rate hikes. High reinvestment capacity."
                      : "Subject to refinance roll risk and higher debt servicing costs under rate shocks."}
                  </div>
                </div>
              </div>

              {/* Working Capital & Runway Box */}
              <div className="p-4 bg-[#080B10] border border-[#1E2536] rounded-lg space-y-3">
                <div className="text-xs font-bold text-[#38BDF8] uppercase">
                  LIQUIDITY RUNWAY &amp; WORKING CAPITAL
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-[#111622] rounded border border-[#1E2536]">
                    <div className="text-[9.5px] text-[#64748B] uppercase">CURRENT ASSETS</div>
                    <div className="font-bold text-[#F8FAFC] mt-0.5">
                      {formatFinancialValue(latestPeriod?.totalCurrentAssets, curr, scale)}
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#111622] rounded border border-[#1E2536]">
                    <div className="text-[9.5px] text-[#64748B] uppercase">CURRENT LIABILITIES</div>
                    <div className="font-bold text-[#F8FAFC] mt-0.5">
                      {formatFinancialValue(latestPeriod?.totalCurrentLiabilities, curr, scale)}
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#111622] rounded border border-[#1E2536]">
                    <div className="text-[9.5px] text-[#64748B] uppercase">FREE CASH FLOW</div>
                    <div className="font-bold text-[#10B981] mt-0.5">
                      {formatFinancialValue(latestPeriod?.freeCashFlow, curr, scale)}
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#111622] rounded border border-[#1E2536]">
                    <div className="text-[9.5px] text-[#64748B] uppercase">RUNWAY STATUS</div>
                    <div className="font-bold text-[#38BDF8] mt-0.5">
                      {simulation.cashBurnRunwayMonths
                        ? `${simulation.cashBurnRunwayMonths.toFixed(1)} Months`
                        : "SELF-SUSTAINING"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: MARGIN TRAJECTORY (GROSS, OPERATING, NET) */}
        {activeMetricTab === "MARGINS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                  OPERATIONAL MARGIN EXPANSION / COMPRESSION CURVE
                </h4>
                <p className="text-[10px] text-[#64748B]">
                  Percentage conversion of gross revenue across operational expense hurdles
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span className="text-[#94A3B8]">Gross Margin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
                  <span className="text-[#94A3B8]">Operating Margin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
                  <span className="text-[#94A3B8]">Net Profit Margin</span>
                </div>
              </div>
            </div>

            {/* Margin Cards Across Fiscal Periods */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {sortedPeriods.map((p, idx) => {
                const rev = p.revenue ?? 1;
                const gm = p.grossProfit ? (p.grossProfit / rev) * 100 : 0;
                const op = p.ebit ? (p.ebit / rev) * 100 : 0;
                const net = p.netIncome ? (p.netIncome / rev) * 100 : 0;

                return (
                  <div
                    key={idx}
                    className="p-4 bg-[#080B10] border border-[#1E2536] rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#1E2536] pb-2">
                      <span className="font-bold text-[#F8FAFC] text-xs">{p.period}</span>
                      <span className="text-[10px] text-[#38BDF8]">Audited Filing</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#94A3B8]">Gross Margin:</span>
                        <span className="font-bold text-[#10B981] font-mono tabular-nums">
                          {gm.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#111622] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#10B981] rounded-full"
                          style={{ width: `${Math.min(100, gm)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-[#94A3B8]">Operating Margin:</span>
                        <span className="font-bold text-[#38BDF8] font-mono tabular-nums">
                          {op.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#111622] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#38BDF8] rounded-full"
                          style={{ width: `${Math.min(100, op)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-[#94A3B8]">Net Margin:</span>
                        <span className="font-bold text-[#38BDF8] font-mono tabular-nums">
                          {net.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#111622] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#38BDF8] rounded-full"
                          style={{ width: `${Math.min(100, net)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: PEER COMPARISON BENCHMARKS */}
        {activeMetricTab === "PEERS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                  CROSS-BORDER PEER BENCHMARK MATRIX
                </h4>
                <p className="text-[10px] text-[#64748B]">
                  Solvency, Operating Margins, and Leverage relative to institutional industry leaders
                </p>
              </div>
              <span className="text-[10px] text-[#38BDF8] border border-[#38BDF8]/30 px-2.5 py-1 bg-[#111622] rounded">
                Active Benchmark: {company.symbol}
              </span>
            </div>

            <div className="border border-[#1E2536] rounded-lg overflow-x-auto bg-[#080B10]">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1E2536] bg-[#0E131A] text-[#94A3B8] text-[10px]">
                    <th className="py-2.5 px-3 text-left">COMPANY / TICKER</th>
                    <th className="py-2.5 px-3 text-left">SECTOR</th>
                    <th className="py-2.5 px-3 text-left">JURISDICTION</th>
                    <th className="py-2.5 px-3 text-right">NET DEBT/EBITDA</th>
                    <th className="py-2.5 px-3 text-right">OP MARGIN</th>
                    <th className="py-2.5 px-3 text-center">SOLVENCY STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2536]/50">
                  {/* Current Active Company Highlighted */}
                  <tr className="bg-[#172033]/60 font-semibold">
                    <td className="py-3 px-3 text-left text-[#38BDF8] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                      <span>{company.name} ({company.symbol})</span>
                    </td>
                    <td className="py-3 px-3 text-left text-[#F8FAFC]">{company.sector}</td>
                    <td className="py-3 px-3 text-left text-[#94A3B8]">{company.country}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#F8FAFC]">
                      {latestRatios.netDebtToEbitda !== null ? `${latestRatios.netDebtToEbitda.toFixed(2)}x` : "0.00x"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#10B981]">
                      {latestRatios.operatingMarginPct !== null ? `${latestRatios.operatingMarginPct.toFixed(1)}%` : "N/D"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 rounded">
                        ACTIVE TARGET
                      </span>
                    </td>
                  </tr>

                  {/* Benchmark Peers */}
                  {peerList.map((peer) => {
                    const peerLatest = peer.periods[0];
                    const pRev = peerLatest?.revenue ?? 1;
                    const pEbit = peerLatest?.ebit ?? 0;
                    const pMargin = pRev > 0 ? (pEbit / pRev) * 100 : 0;
                    const pCash = peerLatest?.cashAndEquivalents ?? 0;
                    const pDebt = peerLatest?.totalDebt ?? 0;
                    const pEbitda = peerLatest?.ebitda ?? pEbit * 1.15;
                    const pLev = pEbitda > 0 ? (pDebt - pCash) / pEbitda : 0;

                    return (
                      <tr key={peer.company.id} className="hover:bg-[#111622] transition-colors">
                        <td className="py-2.5 px-3 text-left text-[#F8FAFC]">
                          {peer.company.name} ({peer.company.symbol})
                        </td>
                        <td className="py-2.5 px-3 text-left text-[#94A3B8]">{peer.company.sector}</td>
                        <td className="py-2.5 px-3 text-left text-[#64748B]">{peer.company.country}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#94A3B8]">
                          {pLev <= 0 ? "0.00x (Cash)" : `${pLev.toFixed(2)}x`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#38BDF8]">
                          {pMargin.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                              pLev <= 2.5
                                ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30"
                                : "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30"
                            }`}
                          >
                            {pLev <= 2.5 ? "PRIME" : "WATCHLIST"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
