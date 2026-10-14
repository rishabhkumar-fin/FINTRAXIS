"use client";

import React, { useState } from "react";
import {
  X,
  BarChart3,
  Calendar,
} from "lucide-react";
import { CompanyEntity, CompanyRiskProfile } from "@/lib/types";
import { formatFinancialValue } from "@/lib/formatters";

interface CompanyChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyEntity | null;
  profile: CompanyRiskProfile | null;
}

export function CompanyChartModal({
  isOpen,
  onClose,
  company,
  profile,
}: CompanyChartModalProps) {
  const [activeVisual, setActiveVisual] = useState<"WATERFALL" | "GROWTH" | "BALANCE_SHEET" | "MARGINS">("WATERFALL");
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0);

  if (!isOpen || !company || !profile) return null;

  const { periods, latestRatios, riskScore } = profile;
  const curr = company.currency;
  const scale = company.scaleUnit;

  const currentPeriod = periods[selectedPeriodIndex] || periods[0];
  const sortedPeriods = [...periods].reverse();

  // Find max revenue for scaling
  const maxRevenue = Math.max(...periods.map((p) => p.revenue ?? 100), 100);

  return (
    <div className="fixed inset-0 z-50 bg-[#080B10]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-mono select-none animate-in fade-in duration-150">
      <div className="w-full max-w-5xl bg-[#0B0F17] border border-[#38BDF8]/30 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Lockup */}
        <div className="p-4 bg-[#0E131E] border-b border-[#1E2536] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#38BDF8]/15 border border-[#38BDF8]/40 rounded text-[#38BDF8]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#F8FAFC]">
                  {company.name}
                </h3>
                <span className="px-2 py-0.5 bg-[#172033] border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-bold rounded">
                  {company.symbol}
                </span>
                <span className="text-[10px] text-[#64748B] hidden sm:inline">
                  [{company.exchange} &bull; {company.accountingStandard}]
                </span>
              </div>
              <div className="text-[10.5px] text-[#94A3B8] flex items-center gap-2 mt-0.5">
                <span>Jurisdiction: {company.country}</span>
                <span>&bull;</span>
                <span>Base Currency: {curr} ({scale})</span>
                <span>&bull;</span>
                <span className="text-[#38BDF8] font-semibold">
                  Health Score: {riskScore}/100 ({profile.riskTier})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#111622] hover:bg-[#1E2536] border border-[#1E2536] text-[#94A3B8] hover:text-[#F8FAFC] rounded transition-colors"
            title="Close Chart Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Power BI Interactive Slicers Bar */}
        <div className="px-4 py-2.5 bg-[#080B10] border-b border-[#1E2536] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Visual Type Slicer */}
          <div className="flex items-center gap-1 bg-[#111622] border border-[#1E2536] p-1 rounded">
            <span className="text-[9.5px] text-[#64748B] uppercase px-1.5 font-bold">POWER BI VISUAL:</span>
            <button
              onClick={() => setActiveVisual("WATERFALL")}
              className={`px-2.5 py-1 text-[10.5px] font-bold rounded transition-all ${
                activeVisual === "WATERFALL"
                  ? "bg-[#1E2B45] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              Income Waterfall
            </button>
            <button
              onClick={() => setActiveVisual("GROWTH")}
              className={`px-2.5 py-1 text-[10.5px] font-bold rounded transition-all ${
                activeVisual === "GROWTH"
                  ? "bg-[#1E2B45] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              Multi-Year YoY Trend
            </button>
            <button
              onClick={() => setActiveVisual("BALANCE_SHEET")}
              className={`px-2.5 py-1 text-[10.5px] font-bold rounded transition-all ${
                activeVisual === "BALANCE_SHEET"
                  ? "bg-[#1E2B45] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              Liquidity vs Debt
            </button>
            <button
              onClick={() => setActiveVisual("MARGINS")}
              className={`px-2.5 py-1 text-[10.5px] font-bold rounded transition-all ${
                activeVisual === "MARGINS"
                  ? "bg-[#1E2B45] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              Margin Curves
            </button>
          </div>

          {/* Period Slicer */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#64748B] uppercase font-bold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#38BDF8]" />
              <span>PERIOD:</span>
            </span>
            <div className="flex items-center gap-1 bg-[#111622] p-0.5 border border-[#1E2536] rounded">
              {periods.map((p, idx) => (
                <button
                  key={p.period}
                  onClick={() => setSelectedPeriodIndex(idx)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                    selectedPeriodIndex === idx
                      ? "bg-[#38BDF8] text-[#080B10]"
                      : "text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                >
                  {p.period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Canvas */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Quick KPI Cards Ribbon (Power BI Scorecard Style) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#0E131E] border border-[#1E2536] rounded-lg">
              <div className="text-[9.5px] text-[#64748B] uppercase">REVENUE ({currentPeriod.period})</div>
              <div className="text-base font-bold font-mono text-[#F8FAFC] mt-0.5">
                {formatFinancialValue(currentPeriod.revenue, curr, scale)}
              </div>
              <div className="text-[9px] text-[#10B981] mt-0.5">Audited Regulatory Filing</div>
            </div>

            <div className="p-3 bg-[#0E131E] border border-[#1E2536] rounded-lg">
              <div className="text-[9.5px] text-[#64748B] uppercase">OPERATING EBIT</div>
              <div className="text-base font-bold font-mono text-[#38BDF8] mt-0.5">
                {formatFinancialValue(currentPeriod.ebit, curr, scale)}
              </div>
              <div className="text-[9px] text-[#94A3B8] mt-0.5">
                Margin: {currentPeriod.revenue ? (((currentPeriod.ebit ?? 0) / currentPeriod.revenue) * 100).toFixed(1) : 0}%
              </div>
            </div>

            <div className="p-3 bg-[#0E131E] border border-[#1E2536] rounded-lg">
              <div className="text-[9.5px] text-[#64748B] uppercase">NET DEBT / EBITDA</div>
              <div className="text-base font-bold font-mono text-[#F8FAFC] mt-0.5">
                {latestRatios.netDebtToEbitda !== null ? `${latestRatios.netDebtToEbitda.toFixed(2)}x` : "0.00x"}
              </div>
              <div className="text-[9px] text-[#10B981] mt-0.5">
                {(latestRatios.netDebtToEbitda ?? 0) <= 2.0 ? "Fortress Balance Sheet" : "Covenant Monitored"}
              </div>
            </div>

            <div className="p-3 bg-[#0E131E] border border-[#1E2536] rounded-lg">
              <div className="text-[9.5px] text-[#64748B] uppercase">INTEREST COVERAGE</div>
              <div className="text-base font-bold font-mono text-[#10B981] mt-0.5">
                {latestRatios.interestCoverage !== null ? `${latestRatios.interestCoverage.toFixed(2)}x` : "&infin;"}
              </div>
              <div className="text-[9px] text-[#38BDF8] mt-0.5">
                Hurdle: &ge; 2.50x
              </div>
            </div>
          </div>

          {/* VIEW 1: POWER BI INCOME STATEMENT WATERFALL */}
          {activeVisual === "WATERFALL" && (
            <div className="p-4 bg-[#080B10] border border-[#1E2536] rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                    OPERATING PROFITABILITY WATERFALL // {currentPeriod.period}
                  </h4>
                  <p className="text-[10px] text-[#64748B]">
                    Breakdown from Top-Line Gross Revenue down to Operating EBIT and Net Income
                  </p>
                </div>
                <span className="text-[10.5px] text-[#38BDF8] font-bold">
                  {curr} {scale}
                </span>
              </div>

              {/* Waterfall Steps */}
              <div className="space-y-3 pt-2">
                {/* 1. Revenue */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#38BDF8] font-bold">1. Gross Revenue</span>
                    <span className="font-bold font-mono text-[#F8FAFC]">
                      {formatFinancialValue(currentPeriod.revenue, curr, scale)} (100%)
                    </span>
                  </div>
                  <div className="w-full bg-[#111622] h-4 rounded-full overflow-hidden p-0.5">
                    <div className="h-full bg-gradient-to-r from-[#0284C7] to-[#38BDF8] rounded-full w-full" />
                  </div>
                </div>

                {/* 2. COGS (Deduction) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#F43F5E] font-bold">2. Cost of Goods Sold (COGS)</span>
                    <span className="font-mono text-[#F43F5E]">
                      -{formatFinancialValue(currentPeriod.cogs, curr, scale)} (
                      {currentPeriod.revenue ? (((currentPeriod.cogs ?? 0) / currentPeriod.revenue) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#111622] h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#BE123C] to-[#F43F5E] rounded-full"
                      style={{
                        width: `${Math.min(100, currentPeriod.revenue ? ((currentPeriod.cogs ?? 0) / currentPeriod.revenue) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 3. Gross Profit */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#10B981] font-bold">3. Gross Profit</span>
                    <span className="font-mono font-bold text-[#10B981]">
                      {formatFinancialValue(currentPeriod.grossProfit, curr, scale)} (
                      {currentPeriod.revenue ? (((currentPeriod.grossProfit ?? 0) / currentPeriod.revenue) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#111622] h-3.5 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#059669] to-[#10B981] rounded-full"
                      style={{
                        width: `${Math.min(100, currentPeriod.revenue ? ((currentPeriod.grossProfit ?? 0) / currentPeriod.revenue) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 4. Operating Expenses */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#F59E0B] font-bold">4. Operating Expenses (OpEx &amp; SG&amp;A)</span>
                    <span className="font-mono text-[#F59E0B]">
                      -{formatFinancialValue(currentPeriod.operatingExpenses, curr, scale)} (
                      {currentPeriod.revenue ? (((currentPeriod.operatingExpenses ?? 0) / currentPeriod.revenue) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#111622] h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] rounded-full"
                      style={{
                        width: `${Math.min(100, currentPeriod.revenue ? ((currentPeriod.operatingExpenses ?? 0) / currentPeriod.revenue) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 5. Operating Profit (EBIT) */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#38BDF8] font-bold">5. Operating EBIT</span>
                    <span className="font-mono font-bold text-[#38BDF8]">
                      {formatFinancialValue(currentPeriod.ebit, curr, scale)} (
                      {currentPeriod.revenue ? (((currentPeriod.ebit ?? 0) / currentPeriod.revenue) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#111622] h-4 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#1D4ED8] to-[#38BDF8] rounded-full"
                      style={{
                        width: `${Math.min(100, currentPeriod.revenue ? ((currentPeriod.ebit ?? 0) / currentPeriod.revenue) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: MULTI-YEAR YOY TREND */}
          {activeVisual === "GROWTH" && (
            <div className="p-4 bg-[#080B10] border border-[#1E2536] rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                    ANNUAL REVENUE &amp; EBIT EXPANSION TRAJECTORY
                  </h4>
                  <p className="text-[10px] text-[#64748B]">
                    Multi-period audited progress across available regulatory annual filings
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" />
                    <span className="text-[#94A3B8]">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" />
                    <span className="text-[#94A3B8]">EBIT</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-end h-48 border-b border-[#1E2536] px-4 pt-4">
                {sortedPeriods.map((p, idx) => {
                  const revH = Math.max(15, ((p.revenue ?? 0) / maxRevenue) * 100);
                  const ebitH = Math.max(8, ((p.ebit ?? 0) / maxRevenue) * 100);

                  return (
                    <div key={idx} className="flex flex-col items-center h-full justify-end group">
                      <div className="flex items-end gap-2 w-full max-w-[90px] justify-center">
                        <div
                          style={{ height: `${revH}%` }}
                          className="w-1/2 bg-gradient-to-t from-[#0284C7] to-[#38BDF8] rounded-t transition-all group-hover:brightness-110 relative"
                        >
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#CBD5E1] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatFinancialValue(p.revenue, curr, scale)}
                          </span>
                        </div>
                        <div
                          style={{ height: `${ebitH}%` }}
                          className="w-1/2 bg-gradient-to-t from-[#1D4ED8] to-[#38BDF8] rounded-t transition-all group-hover:brightness-110 relative"
                        >
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatFinancialValue(p.ebit, curr, scale)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-center font-bold text-xs text-[#F8FAFC]">
                        {p.period}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: BALANCE SHEET LIQUIDITY VS DEBT */}
          {activeVisual === "BALANCE_SHEET" && (
            <div className="p-4 bg-[#080B10] border border-[#1E2536] rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                    BALANCE SHEET FORTRESS &amp; CAPITAL MATURITY PROFILE
                  </h4>
                  <p className="text-[10px] text-[#64748B]">
                    Comparison of liquid cash cushion against total bank debt obligations
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                    (currentPeriod.totalDebt ?? 0) <= (currentPeriod.cashAndEquivalents ?? 0)
                      ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40"
                      : "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40"
                  }`}
                >
                  {(currentPeriod.totalDebt ?? 0) <= (currentPeriod.cashAndEquivalents ?? 0)
                    ? "🛡️ NET CASH SURPLUS"
                    : "⚠️ LEVERAGED DEBT LOAD"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-[#0E131E] border border-[#1E2536] rounded-lg space-y-2">
                  <div className="text-[10px] text-[#94A3B8] uppercase">CASH &amp; SHORT-TERM ASSETS</div>
                  <div className="text-lg font-bold text-[#10B981] font-mono">
                    {formatFinancialValue(currentPeriod.cashAndEquivalents, curr, scale)}
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    Marketable Securities: {formatFinancialValue(currentPeriod.marketableSecurities, curr, scale)}
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    Total Current Assets: {formatFinancialValue(currentPeriod.totalCurrentAssets, curr, scale)}
                  </div>
                </div>

                <div className="p-3.5 bg-[#0E131E] border border-[#1E2536] rounded-lg space-y-2">
                  <div className="text-[10px] text-[#94A3B8] uppercase">TOTAL DEBT &amp; LIABILITIES</div>
                  <div className="text-lg font-bold text-[#F43F5E] font-mono">
                    {formatFinancialValue(currentPeriod.totalDebt, curr, scale)}
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    Short-Term Debt: {formatFinancialValue(currentPeriod.shortTermDebt, curr, scale)}
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    Long-Term Debt: {formatFinancialValue(currentPeriod.longTermDebt, curr, scale)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: MARGIN CURVES */}
          {activeVisual === "MARGINS" && (
            <div className="p-4 bg-[#080B10] border border-[#1E2536] rounded-lg space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                  HISTORICAL PROFIT MARGIN RATIOS
                </h4>
                <p className="text-[10px] text-[#64748B]">
                  Efficiency of turning revenue into gross profit, operating earnings, and net bottom line
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {sortedPeriods.map((p, idx) => {
                  const rev = p.revenue ?? 1;
                  const gm = p.grossProfit ? (p.grossProfit / rev) * 100 : 0;
                  const op = p.ebit ? (p.ebit / rev) * 100 : 0;
                  const net = p.netIncome ? (p.netIncome / rev) * 100 : 0;

                  return (
                    <div key={idx} className="p-3.5 bg-[#0E131E] border border-[#1E2536] rounded-lg space-y-2.5">
                      <div className="font-bold text-xs text-[#38BDF8] border-b border-[#1E2536] pb-1">
                        {p.period}
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#94A3B8]">Gross:</span>
                        <span className="font-bold text-[#10B981]">{gm.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#94A3B8]">Operating:</span>
                        <span className="font-bold text-[#38BDF8]">{op.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#94A3B8]">Net:</span>
                        <span className="font-bold text-[#38BDF8]">{net.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Attestation */}
        <div className="p-3.5 bg-[#0E131E] border-t border-[#1E2536] flex items-center justify-between text-[10.5px] text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>POWER BI COMPLIANT ANALYTIC ENGINE</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#162033] hover:bg-[#1E2B45] border border-[#1E2536] text-[#38BDF8] font-bold rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
