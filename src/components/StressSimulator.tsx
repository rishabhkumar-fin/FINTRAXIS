"use client";

import React, { useState } from "react";
import { Cpu, RotateCcw, BarChart3, Info } from "lucide-react";
import { CompanyRiskProfile, StressSimulationInputs } from "@/lib/types";
import { runStressSimulation } from "@/lib/financialEngine";
import { formatFinancialValue, formatRatio } from "@/lib/formatters";

interface StressSimulatorProps {
  profile: CompanyRiskProfile;
}

export function StressSimulator({ profile }: StressSimulatorProps) {
  const { company, periods } = profile;
  const latest = periods[0];

  const [inputs, setInputs] = useState<StressSimulationInputs>({
    revenueShockPct: -10,
    cogsInflationPct: 5,
    rateShockBps: 200,
  });

  const simulation = latest ? runStressSimulation(latest, inputs) : profile.simulation;

  const handlePreset = (rev: number, cogs: number, rate: number) => {
    setInputs({
      revenueShockPct: rev,
      cogsInflationPct: cogs,
      rateShockBps: rate,
    });
  };

  const formatCurr = (val: number | null | undefined) =>
    formatFinancialValue(val, company.currency, company.scaleUnit);

  const isSolventUnderStress = (simulation.simulatedInterestCoverage ?? 0) >= 2.0 && simulation.runwayStatus !== "CRITICAL_BURN";
  const isCovenantBreached = (simulation.simulatedInterestCoverage ?? 0) < 2.0;

  // Power BI Bar Comparisons
  const stressBars = [
    {
      metric: "Consolidated Revenue",
      baseline: latest?.revenue ?? 0,
      stressed: simulation.simulatedRevenue,
      unit: company.currency,
      delta: `${inputs.revenueShockPct >= 0 ? "+" : ""}${inputs.revenueShockPct}%`,
      meaning: "Top-line volume and pricing contraction",
    },
    {
      metric: "Cost of Goods Sold (COGS)",
      baseline: latest?.cogs ?? 0,
      stressed: simulation.simulatedCogs,
      unit: company.currency,
      delta: `+${inputs.cogsInflationPct}%`,
      meaning: "Direct input material and labor inflation",
    },
    {
      metric: "Operating Profit (EBIT)",
      baseline: latest?.ebit ?? 0,
      stressed: simulation.simulatedEbit,
      unit: company.currency,
      delta: latest?.ebit ? `${(((simulation.simulatedEbit - latest.ebit) / Math.abs(latest.ebit)) * 100).toFixed(1)}%` : "N/D",
      meaning: "Core operational profit before interest and taxes",
    },
    {
      metric: "Interest Expense",
      baseline: latest?.interestExpense ?? 0,
      stressed: simulation.simulatedInterestExpense,
      unit: company.currency,
      delta: `+${inputs.rateShockBps} bps`,
      meaning: "Monetary policy rate tightening on funded debt",
    },
  ];

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Simulation Header */}
      <div className="p-4 bg-[#0F1420] border border-[#1E2536] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#C5A880]/15 border border-[#C5A880]/40 rounded-lg text-[#C5A880]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#F8FAFC] tracking-wider uppercase text-xs">
                MACRO STRESS TESTING &amp; CAPITAL SIMULATION LAB
              </span>
              <span className="px-2 py-0.5 bg-[#F43F5E]/20 border border-[#F43F5E] text-[#F43F5E] text-[10px] font-bold rounded">
                DETERMINISTIC SENSITIVITY
              </span>
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">
              Subject: {company.name} ({company.symbol}) &bull; Base Reporting: {company.currency} ({company.scaleUnit})
            </div>
          </div>
        </div>

        {/* Quick Scenario Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#64748B] uppercase font-bold">PRESETS:</span>
          <button
            onClick={() => handlePreset(0, 0, 0)}
            className="px-2.5 py-1 bg-[#111622] hover:bg-[#1A2234] border border-[#1E2536] text-[10px] text-[#94A3B8] hover:text-[#F8FAFC] rounded transition-colors"
          >
            Base Zero
          </button>
          <button
            onClick={() => handlePreset(0, 3, 150)}
            className="px-2.5 py-1 bg-[#111622] hover:bg-[#1A2234] border border-[#1E2536] text-[10px] text-[#94A3B8] hover:text-[#F8FAFC] rounded transition-colors"
          >
            Rate Hike (+150bps)
          </button>
          <button
            onClick={() => handlePreset(-15, 8, 250)}
            className="px-2.5 py-1 bg-[#1A1215] hover:bg-[#2A161B] border border-[#F43F5E]/40 text-[10px] text-[#F43F5E] font-bold rounded transition-colors"
          >
            Stagflation (-15% / +250bps)
          </button>
          <button
            onClick={() => handlePreset(-25, -5, 200)}
            className="px-2.5 py-1 bg-[#1A1215] hover:bg-[#2A161B] border border-[#F43F5E]/40 text-[10px] text-[#F43F5E] font-bold rounded transition-colors"
          >
            Severe Recession (-25%)
          </button>
          <button
            onClick={() => handlePreset(-10, 5, 200)}
            className="p-1.5 bg-[#162033] hover:bg-[#1E2B45] border border-[#C5A880]/40 text-[#C5A880] rounded transition-colors"
            title="Reset to default stress scenario"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* EXECUTIVE VERDICT: WHAT THIS STRESS TEST TELLS YOU */}
      <div className="p-4 bg-[#0A0E17] border border-[#1E2536] rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E2536] pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#C5A880] uppercase tracking-wider">
            <Info className="w-4 h-4 text-[#C5A880]" />
            <span>EXECUTIVE VERDICT: CAN THIS FIRM SURVIVE ADVERSE MACRO SHOCKS?</span>
          </div>
          <span className="text-[10px] text-[#64748B]">PRO-FORMA SURVIVABILITY TEST</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Question 1: Survivability */}
          <div className="p-3 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-1">
            <div className="text-[10px] text-[#64748B] uppercase font-bold flex items-center justify-between">
              <span>1. CAN THE FIRM SURVIVE?</span>
              <span className={isSolventUnderStress ? "text-[#10B981]" : "text-[#F43F5E]"}>
                {isSolventUnderStress ? "YES // RESILIENT" : "DEFAULT RISK"}
              </span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {isSolventUnderStress
                ? `${company.name} remains operationally profitable under this stress test with stressed EBIT of ${formatCurr(simulation.simulatedEbit)}. Core operations generate enough cash to avoid restructuring.`
                : `Stressed earnings collapse. EBIT drops into negative or compressed territory, threatening the company's ability to remain self-funding.`}
            </p>
          </div>

          {/* Question 2: Cash Runway */}
          <div className="p-3 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-1">
            <div className="text-[10px] text-[#64748B] uppercase font-bold flex items-center justify-between">
              <span>2. WILL IT RUN OUT OF CASH?</span>
              <span className={simulation.runwayStatus === "CRITICAL_BURN" ? "text-[#F43F5E]" : "text-[#10B981]"}>
                {simulation.cashBurnRunwayMonths ? `${simulation.cashBurnRunwayMonths.toFixed(1)} MO RUNWAY` : "SELF-SUSTAINING"}
              </span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {simulation.cashBurnRunwayMonths !== null
                ? `Under this shock, the firm experiences an estimated monthly cash burn of ${formatCurr(simulation.projectedMonthlyBurn)}, leaving ${simulation.cashBurnRunwayMonths.toFixed(1)} months of cash buffer.`
                : `Operating cash flow remains positive. The firm produces cash internally and does not require emergency liquidity draws.`}
            </p>
          </div>

          {/* Question 3: Debt Covenants */}
          <div className="p-3 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-1">
            <div className="text-[10px] text-[#64748B] uppercase font-bold flex items-center justify-between">
              <span>3. DO BANK COVENANTS BREAK?</span>
              <span className={isCovenantBreached ? "text-[#F43F5E]" : "text-[#10B981]"}>
                {isCovenantBreached ? "COVENANT BREACH" : "COVENANT SAFE"}
              </span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {isCovenantBreached
                ? `Stressed interest coverage falls to ${formatRatio(simulation.simulatedInterestCoverage)}, breaching the 2.0x/2.5x bank covenant floor. Lenders can freeze revolving credit lines!`
                : `Stressed interest coverage holds at ${formatRatio(simulation.simulatedInterestCoverage)}, remaining safely above the 2.5x covenant floor.`}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Parameter Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-[#0F1420] border border-[#1E2536] rounded-xl">
        {/* Slider 1: Revenue Shock */}
        <div className="space-y-2 p-3 bg-[#080B10] border border-[#1E2536] rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#64748B] uppercase font-bold">REVENUE CONTRACTION</span>
            <span
              className={`font-bold font-mono text-xs ${
                inputs.revenueShockPct < 0 ? "text-[#F43F5E]" : "text-[#10B981]"
              }`}
            >
              {inputs.revenueShockPct > 0 ? `+${inputs.revenueShockPct}%` : `${inputs.revenueShockPct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="15"
            step="1"
            value={inputs.revenueShockPct}
            onChange={(e) =>
              setInputs((prev) => ({
                ...prev,
                revenueShockPct: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-[#C5A880] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#64748B]">
            <span>-30% (Severe)</span>
            <span>0%</span>
            <span>+15% (Growth)</span>
          </div>
        </div>

        {/* Slider 2: Input Cost Inflation */}
        <div className="space-y-2 p-3 bg-[#080B10] border border-[#1E2536] rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#64748B] uppercase font-bold">COGS COST INFLATION</span>
            <span
              className={`font-bold font-mono text-xs ${
                inputs.cogsInflationPct > 0 ? "text-[#F59E0B]" : "text-[#10B981]"
              }`}
            >
              {inputs.cogsInflationPct > 0 ? `+${inputs.cogsInflationPct}%` : `${inputs.cogsInflationPct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="20"
            step="1"
            value={inputs.cogsInflationPct}
            onChange={(e) =>
              setInputs((prev) => ({
                ...prev,
                cogsInflationPct: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-[#C5A880] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#64748B]">
            <span>-10% (Deflation)</span>
            <span>0%</span>
            <span>+20% (Spike)</span>
          </div>
        </div>

        {/* Slider 3: Benchmark Rate Shock */}
        <div className="space-y-2 p-3 bg-[#080B10] border border-[#1E2536] rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#64748B] uppercase font-bold">INTEREST RATE TIGHTENING</span>
            <span className="font-bold font-mono text-xs text-[#3B82F6]">
              +{inputs.rateShockBps} bps (+{(inputs.rateShockBps / 100).toFixed(2)}%)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            step="25"
            value={inputs.rateShockBps}
            onChange={(e) =>
              setInputs((prev) => ({
                ...prev,
                rateShockBps: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-[#C5A880] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#64748B]">
            <span>+0 bps (Neutral)</span>
            <span>+200 bps (Repo Shift)</span>
            <span>+500 bps (Severe)</span>
          </div>
        </div>
      </div>

      {/* POWER BI VISUAL COMPARISON BARS (BASELINE VS STRESSED) */}
      <div className="p-4 bg-[#0A0E17] border border-[#1E2536] rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E2536] pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
            <BarChart3 className="w-4 h-4 text-[#C5A880]" />
            <span>POWER BI STRESS IMPACT VISUALIZER (BASELINE VS PRO-FORMA)</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#3B82F6]"></span>
              <span className="text-[#94A3B8]">Baseline As-Reported</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#F43F5E]"></span>
              <span className="text-[#F8FAFC] font-bold">Stressed Shock</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stressBars.map((bar, idx) => {
            const maxVal = Math.max(Math.abs(bar.baseline), Math.abs(bar.stressed), 10);
            const basePct = Math.min(100, Math.max(6, (Math.abs(bar.baseline) / maxVal) * 100));
            const stressPct = Math.min(100, Math.max(6, (Math.abs(bar.stressed) / maxVal) * 100));

            return (
              <div key={idx} className="p-3 bg-[#0F1420] border border-[#1E2536] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F8FAFC]">{bar.metric}</span>
                  <span className="text-[10px] text-[#C5A880] font-bold">{bar.delta}</span>
                </div>

                <div className="space-y-1">
                  {/* Baseline */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-16 text-[#64748B]">Baseline:</span>
                    <div className="flex-1 bg-[#080B10] h-4 rounded overflow-hidden border border-[#1E2536]">
                      <div
                        style={{ width: `${basePct}%` }}
                        className="h-full bg-[#3B82F6]/70 rounded flex items-center justify-end pr-1.5 text-[9px] font-bold text-white"
                      >
                        {formatCurr(bar.baseline)}
                      </div>
                    </div>
                  </div>

                  {/* Stressed */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-16 text-[#F43F5E] font-bold">Stressed:</span>
                    <div className="flex-1 bg-[#080B10] h-4 rounded overflow-hidden border border-[#1E2536]">
                      <div
                        style={{ width: `${stressPct}%` }}
                        className="h-full bg-gradient-to-r from-[#BE123C] to-[#F43F5E] rounded flex items-center justify-end pr-1.5 text-[9px] font-bold text-white"
                      >
                        {formatCurr(bar.stressed)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[9.5px] text-[#64748B]">{bar.meaning}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL FINANCIAL STATEMENT RECONCILIATION TABLE */}
      <div className="border border-[#1E2536] bg-[#0A0E17] rounded-xl overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1E2536] bg-[#0F1420] text-[#94A3B8] text-[10px]">
              <th className="py-2.5 px-3 text-left">FINANCIAL METRIC</th>
              <th className="py-2.5 px-3 text-right">BASELINE AS-REPORTED</th>
              <th className="py-2.5 px-3 text-right text-[#F43F5E] font-bold">PRO-FORMA STRESSED</th>
              <th className="py-2.5 px-3 text-right">DELTA</th>
              <th className="py-2.5 px-3 text-right">COVENANT STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2536]/40">
            <tr>
              <td className="py-2.5 px-3 text-left font-bold text-[#F8FAFC]">Total Net Revenue</td>
              <td className="py-2.5 px-3 text-right text-[#94A3B8]">{formatCurr(latest?.revenue)}</td>
              <td className="py-2.5 px-3 text-right font-bold text-[#C5A880]">{formatCurr(simulation.simulatedRevenue)}</td>
              <td className="py-2.5 px-3 text-right text-[#F43F5E]">{inputs.revenueShockPct >= 0 ? `+${inputs.revenueShockPct}%` : `${inputs.revenueShockPct}%`}</td>
              <td className="py-2.5 px-3 text-right text-[#10B981]">Topline Shock</td>
            </tr>

            <tr>
              <td className="py-2.5 px-3 text-left text-[#94A3B8] pl-6">Cost of Goods Sold (COGS)</td>
              <td className="py-2.5 px-3 text-right text-[#94A3B8]">{formatCurr(latest?.cogs)}</td>
              <td className="py-2.5 px-3 text-right font-bold text-[#F59E0B]">{formatCurr(simulation.simulatedCogs)}</td>
              <td className="py-2.5 px-3 text-right text-[#F59E0B]">+{inputs.cogsInflationPct}%</td>
              <td className="py-2.5 px-3 text-right text-[#94A3B8]">Input Inflation</td>
            </tr>

            <tr>
              <td className="py-2.5 px-3 text-left font-bold text-[#F8FAFC]">Operating Profit (EBIT)</td>
              <td className="py-2.5 px-3 text-right text-[#94A3B8]">{formatCurr(latest?.ebit)}</td>
              <td className="py-2.5 px-3 text-right font-bold text-[#F43F5E]">{formatCurr(simulation.simulatedEbit)}</td>
              <td className="py-2.5 px-3 text-right text-[#F43F5E]">{formatCurr(simulation.simulatedEbit - (latest?.ebit ?? 0))}</td>
              <td className="py-2.5 px-3 text-right">
                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${simulation.simulatedEbit > 0 ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]" : "bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]"}`}>
                  {simulation.simulatedEbit > 0 ? "EBIT POSITIVE" : "EBIT NEGATIVE"}
                </span>
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-3 text-left text-[#94A3B8] pl-6">Interest Expense (+{inputs.rateShockBps} bps)</td>
              <td className="py-2.5 px-3 text-right text-[#94A3B8]">{formatCurr(latest?.interestExpense)}</td>
              <td className="py-2.5 px-3 text-right font-bold text-[#F43F5E]">{formatCurr(simulation.simulatedInterestExpense)}</td>
              <td className="py-2.5 px-3 text-right text-[#F43F5E]">+{formatCurr(simulation.incrementalInterestExpense)}</td>
              <td className="py-2.5 px-3 text-right text-[#94A3B8]">Rate Pass-Through</td>
            </tr>

            <tr>
              <td className="py-2.5 px-3 text-left font-extrabold text-[#C5A880]">EBIT Interest Coverage</td>
              <td className="py-2.5 px-3 text-right font-bold text-[#10B981]">{formatRatio(profile.latestRatios.interestCoverage)}</td>
              <td className="py-2.5 px-3 text-right font-bold text-[#C5A880]">{formatRatio(simulation.simulatedInterestCoverage)}</td>
              <td className="py-2.5 px-3 text-right text-[#F43F5E]">
                {profile.latestRatios.interestCoverage && simulation.simulatedInterestCoverage
                  ? `${(simulation.simulatedInterestCoverage - profile.latestRatios.interestCoverage).toFixed(2)}x`
                  : "N/A"}
              </td>
              <td className="py-2.5 px-3 text-right">
                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${isCovenantBreached ? "bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]" : "bg-[#10B981]/15 text-[#10B981] border-[#10B981]"}`}>
                  {isCovenantBreached ? "BREACH RISK (< 2.0x)" : "COVENANT MET"}
                </span>
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-3 text-left font-bold text-[#F8FAFC]">Stressed Liquidity Runway</td>
              <td className="py-2.5 px-3 text-right text-[#10B981]">Self-Sustaining</td>
              <td className="py-2.5 px-3 text-right font-bold text-[#10B981]">
                {simulation.cashBurnRunwayMonths !== null ? `${simulation.cashBurnRunwayMonths.toFixed(1)} Months` : "POSITIVE FCF"}
              </td>
              <td className="py-2.5 px-3 text-right text-[#94A3B8]">{simulation.runwayStatus}</td>
              <td className="py-2.5 px-3 text-right">
                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${simulation.runwayStatus === "CRITICAL_BURN" ? "bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]" : "bg-[#10B981]/15 text-[#10B981] border-[#10B981]"}`}>
                  {simulation.runwayStatus === "CRITICAL_BURN" ? "CRITICAL BURN" : "SOLVENT"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
