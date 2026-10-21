"use client";

import React, { useState } from "react";
import { Cpu, RotateCcw, BarChart3, Info, ArrowRight } from "lucide-react";
import { CompanyRiskProfile, StressSimulationInputs } from "@/lib/types";
import { runStressSimulation } from "@/lib/financialEngine";
import { formatFinancialValue, formatRatio } from "@/lib/formatters";
import { ModuleTab } from "./NavigationTabs";

interface StressSimulatorProps {
  profile: CompanyRiskProfile;
  onNavigateToTab?: (tab: ModuleTab) => void;
}

export function StressSimulator({ profile, onNavigateToTab }: StressSimulatorProps) {
  const { company, periods } = profile;
  const latest = periods[0];

  const [inputs, setInputs] = useState<StressSimulationInputs>({
    revenueShockPct: -10,
    cogsInflationPct: 5,
    rateShockBps: 200,
  });

  const [committedInputs, setCommittedInputs] = useState<StressSimulationInputs>({
    revenueShockPct: -10,
    cogsInflationPct: 5,
    rateShockBps: 200,
  });

  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setCommittedInputs(inputs);
      setHasPendingChanges(false);
      setIsSimulating(false);
    }, 150);
  };

  const handlePreset = (rev: number, cogs: number, rate: number) => {
    const next = { revenueShockPct: rev, cogsInflationPct: cogs, rateShockBps: rate };
    setInputs(next);
    setCommittedInputs(next);
    setHasPendingChanges(false);
  };

  const simulation = latest ? runStressSimulation(latest, committedInputs) : profile.simulation;

  const formatCurr = (val: number | null | undefined) =>
    formatFinancialValue(val, company.currency, company.scaleUnit);

  const isSolventUnderStress = (simulation.simulatedInterestCoverage ?? 0) >= 2.0 && simulation.runwayStatus !== "CRITICAL_BURN";
  const isCovenantBreached = (simulation.simulatedInterestCoverage ?? 0) < 2.0;

  // Exact Client Money Impacts
  const revenueLoss = latest?.revenue ? Math.abs((latest.revenue * inputs.revenueShockPct) / 100) : 0;
  const cogsExtraCost = latest?.cogs ? Math.abs((latest.cogs * inputs.cogsInflationPct) / 100) : 0;
  const extraInterestPaid = simulation.incrementalInterestExpense;

  // Power BI Bar Comparisons
  const stressBars = [
    {
      metric: "Consolidated Revenue",
      baseline: latest?.revenue ?? 0,
      stressed: simulation.simulatedRevenue,
      unit: company.currency,
      delta: `${inputs.revenueShockPct >= 0 ? "+" : ""}${inputs.revenueShockPct}%`,
      clientExplanation: inputs.revenueShockPct < 0 
        ? `Sales contract by ${Math.abs(inputs.revenueShockPct)}%. Client loses ${formatCurr(revenueLoss)} in top-line cash.`
        : `Sales expand by ${inputs.revenueShockPct}%. Adds ${formatCurr(revenueLoss)} in extra revenue.`,
    },
    {
      metric: "Cost of Goods Sold (COGS)",
      baseline: latest?.cogs ?? 0,
      stressed: simulation.simulatedCogs,
      unit: company.currency,
      delta: `+${inputs.cogsInflationPct}%`,
      clientExplanation: `Supplier & labor costs rise by ${inputs.cogsInflationPct}%, adding ${formatCurr(cogsExtraCost)} in extra out-of-pocket production costs.`,
    },
    {
      metric: "Operating Profit (EBIT)",
      baseline: latest?.ebit ?? 0,
      stressed: simulation.simulatedEbit,
      unit: company.currency,
      delta: latest?.ebit ? `${(((simulation.simulatedEbit - latest.ebit) / Math.abs(latest.ebit)) * 100).toFixed(1)}%` : "N/D",
      clientExplanation: `Earnings after paying production and overhead. Drops by ${formatCurr(Math.abs((latest?.ebit ?? 0) - simulation.simulatedEbit))}.`,
    },
    {
      metric: "Interest Expense",
      baseline: latest?.interestExpense ?? 0,
      stressed: simulation.simulatedInterestExpense,
      unit: company.currency,
      delta: `+${inputs.rateShockBps} bps`,
      clientExplanation: (latest?.totalDebt ?? 0) === 0
        ? "Entity has zero bank debt. Central bank rate hikes cause zero damage and increase bank deposit interest!"
        : `Central bank raises benchmark rates by +${inputs.rateShockBps} bps (+${(inputs.rateShockBps / 100).toFixed(2)}%), costing an additional ${formatCurr(extraInterestPaid)} in bank interest.`,
    },
  ];

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Simulation Header */}
      <div className="p-4 bg-[#090E17] border border-[#1E293B] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#101A2E] border border-[#2563EB]/40 rounded-lg text-[#38BDF8]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#F8FAFC] tracking-wider uppercase text-xs">
                MACRO STRESS TESTING &amp; CLIENT SIMULATION LAB
              </span>
              <span className="px-2 py-0.5 bg-[#2563EB]/20 border border-[#2563EB] text-[#38BDF8] text-[10px] font-bold rounded">
                DETERMINISTIC SENSITIVITY
              </span>
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">
              Subject: {company.name} ({company.symbol}) &bull; Base Reporting: {company.currency} ({company.scaleUnit})
            </div>
          </div>
        </div>

        {/* Wall Street Institutional Scenario Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#38BDF8] uppercase font-bold tracking-wider">WALL ST PRESETS:</span>
          <button
            onClick={() => handlePreset(0, 0, 0)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors border cursor-pointer ${
              inputs.revenueShockPct === 0 && inputs.cogsInflationPct === 0 && inputs.rateShockBps === 0
                ? "bg-[#2563EB] text-white border-[#38BDF8]"
                : "bg-[#05070B] hover:bg-[#101A2E] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            Base Zero (Reported)
          </button>
          <button
            onClick={() => handlePreset(-10, 5, 200)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors border cursor-pointer ${
              inputs.revenueShockPct === -10 && inputs.cogsInflationPct === 5 && inputs.rateShockBps === 200
                ? "bg-[#2563EB] text-white border-[#38BDF8]"
                : "bg-[#05070B] hover:bg-[#101A2E] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            Basel III Adverse (-10% / +200bps)
          </button>
          <button
            onClick={() => handlePreset(-25, 10, 350)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors border cursor-pointer ${
              inputs.revenueShockPct === -25 && inputs.cogsInflationPct === 10 && inputs.rateShockBps === 350
                ? "bg-[#EF4444] text-white border-[#EF4444]"
                : "bg-[#180A0E] hover:bg-[#250E14] border-[#EF4444]/40 text-[#EF4444]"
            }`}
          >
            2008 GFC Freeze (-25% / +350bps)
          </button>
          <button
            onClick={() => handlePreset(-15, 12, 250)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors border cursor-pointer ${
              inputs.revenueShockPct === -15 && inputs.cogsInflationPct === 12 && inputs.rateShockBps === 250
                ? "bg-[#F59E0B] text-black border-[#F59E0B]"
                : "bg-[#191308] hover:bg-[#2A1F0D] border-[#F59E0B]/40 text-[#F59E0B]"
            }`}
          >
            Stagflation Squeeze (-15% / +250bps)
          </button>
          <button
            onClick={() => handlePreset(10, 0, -50)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors border cursor-pointer ${
              inputs.revenueShockPct === 10 && inputs.cogsInflationPct === 0 && inputs.rateShockBps === -50
                ? "bg-[#10B981] text-white border-[#10B981]"
                : "bg-[#091811] hover:bg-[#0E241A] border-[#10B981]/40 text-[#10B981]"
            }`}
          >
            Soft Landing (+10% / -50bps)
          </button>
          <button
            onClick={() => handlePreset(-10, 5, 200)}
            className="p-1.5 bg-[#101A2E] hover:bg-[#1E293B] border border-[#2563EB]/40 text-[#38BDF8] rounded transition-colors cursor-pointer"
            title="Reset to default Basel III stress scenario"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* EXECUTIVE CLIENT VERDICT: CAN THIS FIRM SURVIVE ADVERSE MACRO SHOCKS? */}
      <div className="p-4 bg-[#0B111E] border border-[#2563EB]/40 rounded-xl space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#38BDF8] uppercase tracking-wider">
            <Info className="w-4 h-4 text-[#38BDF8]" />
            <span>CLIENT VERDICT: WHAT THIS STRESS TEST PROVES TO YOUR CLIENT</span>
          </div>
          <span className="text-[10px] text-[#10B981] font-bold">PRO-FORMA SURVIVABILITY TEST</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Question 1: Survivability */}
          <div className="p-3 bg-[#05070B] border border-[#1E293B] rounded-lg space-y-1.5">
            <div className="text-[10px] text-[#64748B] uppercase font-bold flex items-center justify-between">
              <span>1. CAN THE FIRM SURVIVE THIS SHOCK?</span>
              <span className={isSolventUnderStress ? "text-[#10B981] font-bold" : "text-[#EF4444] font-bold"}>
                {isSolventUnderStress ? "YES // RESILIENT" : "DEFAULT RISK"}
              </span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {isSolventUnderStress
                ? `${company.name} remains operationally profitable under this shock with stressed EBIT of ${formatCurr(simulation.simulatedEbit)}. Core operations generate ample cash to prevent bankruptcy.`
                : `Stressed earnings collapse into dangerous territory. EBIT is severely compressed, threatening the firm's ability to stay afloat without emergency loans.`}
            </p>
          </div>

          {/* Question 2: Cash Runway */}
          <div className="p-3 bg-[#070A0F] border border-[#182337] rounded-lg space-y-1.5">
            <div className="text-[10px] text-[#64748B] uppercase font-bold flex items-center justify-between">
              <span>2. WILL IT RUN OUT OF CASH?</span>
              <span className={simulation.runwayStatus === "CRITICAL_BURN" ? "text-[#EF4444] font-bold" : "text-[#10B981] font-bold"}>
                {simulation.cashBurnRunwayMonths ? `${simulation.cashBurnRunwayMonths.toFixed(1)} MO RUNWAY` : "SELF-SUSTAINING"}
              </span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {simulation.cashBurnRunwayMonths !== null
                ? `Under this shock, the firm experiences a monthly cash deficit of ${formatCurr(simulation.projectedMonthlyBurn)}, leaving an estimated ${simulation.cashBurnRunwayMonths.toFixed(1)} months of cash buffer remaining.`
                : `Operational cash flow remains strongly positive. The business self-funds its operations and has infinite runway under this scenario.`}
            </p>
          </div>

          {/* Question 3: Debt Covenants */}
          <div className="p-3 bg-[#070A0F] border border-[#182337] rounded-lg space-y-1.5">
            <div className="text-[10px] text-[#64748B] uppercase font-bold flex items-center justify-between">
              <span>3. DO BANK COVENANTS BREAK?</span>
              <span className={isCovenantBreached ? "text-[#EF4444] font-bold" : "text-[#10B981] font-bold"}>
                {isCovenantBreached ? "COVENANT BREACH" : "COVENANTS SAFE"}
              </span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {isCovenantBreached
                ? `Stressed interest coverage drops to ${formatRatio(simulation.simulatedInterestCoverage)}, falling below the 2.0x bank covenant floor. Syndicates can freeze revolving lines!`
                : `Stressed interest coverage holds at ${formatRatio(simulation.simulatedInterestCoverage)}, well above the required 2.5x covenant floor.`}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Parameter Sliders with Exact Client Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-[#090D17] border border-[#182337] rounded-xl shadow-lg">
        {/* Slider 1: Revenue Shock */}
        <div className="space-y-2 p-3 bg-[#070A0F] border border-[#182337] rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#64748B] uppercase font-bold">REVENUE CONTRACTION</span>
            <span
              className={`font-bold font-mono text-xs ${
                inputs.revenueShockPct < 0 ? "text-[#EF4444]" : "text-[#10B981]"
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
            onChange={(e) => {
              setInputs((prev) => ({
                ...prev,
                revenueShockPct: parseFloat(e.target.value),
              }));
              setHasPendingChanges(true);
            }}
            className="w-full accent-[#2563EB] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#64748B]">
            <span>-30% (Severe)</span>
            <span>0%</span>
            <span>+15% (Growth)</span>
          </div>
          <div className="text-[10px] text-[#94A3B8] pt-1 border-t border-[#182337]">
            <strong className="text-[#38BDF8]">Client Impact:</strong> {inputs.revenueShockPct < 0 ? `Company loses ${formatCurr(revenueLoss)} in gross sales.` : `Company gains ${formatCurr(revenueLoss)} in extra sales.`}
          </div>
        </div>

        {/* Slider 2: Input Cost Inflation */}
        <div className="space-y-2 p-3 bg-[#070A0F] border border-[#182337] rounded-lg">
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
            onChange={(e) => {
              setInputs((prev) => ({
                ...prev,
                cogsInflationPct: parseFloat(e.target.value),
              }));
              setHasPendingChanges(true);
            }}
            className="w-full accent-[#2563EB] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#64748B]">
            <span>-10% (Deflation)</span>
            <span>0%</span>
            <span>+20% (Spike)</span>
          </div>
          <div className="text-[10px] text-[#94A3B8] pt-1 border-t border-[#182337]">
            <strong className="text-[#F59E0B]">Client Impact:</strong> Adds {formatCurr(cogsExtraCost)} in direct factory &amp; material expenses.
          </div>
        </div>

        {/* Slider 3: Benchmark Rate Shock */}
        <div className="space-y-2 p-3 bg-[#070A0F] border border-[#182337] rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#64748B] uppercase font-bold">INTEREST RATE TIGHTENING</span>
            <span className="font-bold font-mono text-xs text-[#38BDF8]">
              +{inputs.rateShockBps} bps (+{(inputs.rateShockBps / 100).toFixed(2)}%)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            step="25"
            value={inputs.rateShockBps}
            onChange={(e) => {
              setInputs((prev) => ({
                ...prev,
                rateShockBps: parseFloat(e.target.value),
              }));
              setHasPendingChanges(true);
            }}
            className="w-full accent-[#2563EB] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#64748B]">
            <span>+0 bps (Neutral)</span>
            <span>+200 bps (Repo Shift)</span>
            <span>+500 bps (Severe)</span>
          </div>
          <div className="text-[10px] text-[#94A3B8] pt-1 border-t border-[#182337]">
            <strong className="text-[#38BDF8]">Client Impact:</strong> {(latest?.totalDebt ?? 0) === 0 ? "Immune (zero funded debt)." : `Extra bank interest cost of ${formatCurr(extraInterestPaid)}.`}
          </div>
        </div>
      </div>

      {/* Explicit Run Simulation Trigger (Section 11 Requirement) */}
      <div className="p-4 bg-[#0B1220] border border-[#1E293B] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${hasPendingChanges ? "bg-[#F59E0B] animate-ping" : "bg-[#10B981]"}`} />
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>{hasPendingChanges ? "Assumptions modified — ready to simulate" : "Simulation active & verified"}</span>
              {hasPendingChanges && (
                <span className="px-1.5 py-0.2 bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] text-[10px] rounded">
                  Pending Recalculation
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-0.5">
              {hasPendingChanges
                ? "Click 'Run Simulation' to compute deterministic stress outcomes on debt service and covenants."
                : `Active Model: Revenue: ${committedInputs.revenueShockPct}%, COGS: +${committedInputs.cogsInflationPct}%, Rates: +${committedInputs.rateShockBps} bps.`}
            </div>
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#2563EB]/30 shrink-0"
        >
          {isSimulating ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Computing...</span>
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4" />
              <span>Run Simulation</span>
            </>
          )}
        </button>
      </div>

      {/* POWER BI VISUAL COMPARISON BARS (BASELINE VS STRESSED) */}
      <div className="p-4 bg-[#090E17] border border-[#1E293B] rounded-xl space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
            <BarChart3 className="w-4 h-4 text-[#38BDF8]" />
            <span>POWER BI STRESS IMPACT VISUALIZER (BASELINE VS PRO-FORMA)</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#2563EB]"></span>
              <span className="text-[#94A3B8]">Baseline As-Reported</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#EF4444]"></span>
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
              <div key={idx} className="p-3 bg-[#05070B] border border-[#1E293B] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F8FAFC]">{bar.metric}</span>
                  <span className="text-[10px] text-[#38BDF8] font-bold">{bar.delta}</span>
                </div>

                <div className="space-y-1">
                  {/* Baseline */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-16 text-[#64748B]">Baseline:</span>
                    <div className="flex-1 bg-[#090E17] h-4 rounded overflow-hidden border border-[#1E293B]">
                      <div
                        style={{ width: `${basePct}%` }}
                        className="h-full bg-[#2563EB]/80 rounded flex items-center justify-end pr-1.5 text-[9px] font-bold text-white"
                      >
                        {formatCurr(bar.baseline)}
                      </div>
                    </div>
                  </div>

                  {/* Stressed */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-16 text-[#EF4444] font-bold">Stressed:</span>
                    <div className="flex-1 bg-[#090E17] h-4 rounded overflow-hidden border border-[#1E293B]">
                      <div
                        style={{ width: `${stressPct}%` }}
                        className="h-full bg-gradient-to-r from-[#DC2626] to-[#EF4444] rounded flex items-center justify-end pr-1.5 text-[9px] font-bold text-white"
                      >
                        {formatCurr(bar.stressed)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[9.5px] text-[#94A3B8] leading-tight">{bar.clientExplanation}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL FINANCIAL STATEMENT RECONCILIATION TABLE */}
      <div className="border border-[#1E293B] bg-[#05070B] rounded-xl overflow-x-auto shadow-lg">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1E293B] bg-[#090E17] text-[#64748B] text-[10px]">
              <th className="py-2.5 px-3 text-left">FINANCIAL METRIC</th>
              <th className="py-2.5 px-3 text-right">BASELINE AS-REPORTED</th>
              <th className="py-2.5 px-3 text-right text-[#EF4444] font-bold">PRO-FORMA STRESSED</th>
              <th className="py-2.5 px-3 text-right">DELTA</th>
              <th className="py-2.5 px-3 text-right">COVENANT STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/40">
            <tr>
              <td className="py-2.5 px-3 text-left font-bold text-[#F8FAFC]">Total Net Revenue</td>
              <td className="py-2.5 px-3 text-right text-[#94A3B8]">{formatCurr(latest?.revenue)}</td>
              <td className="py-2.5 px-3 text-right font-bold text-[#38BDF8]">{formatCurr(simulation.simulatedRevenue)}</td>
              <td className="py-2.5 px-3 text-right text-[#EF4444]">{inputs.revenueShockPct >= 0 ? `+${inputs.revenueShockPct}%` : `${inputs.revenueShockPct}%`}</td>
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
              <td className="py-2.5 px-3 text-right font-bold text-[#EF4444]">{formatCurr(simulation.simulatedEbit)}</td>
              <td className="py-2.5 px-3 text-right text-[#EF4444]">{formatCurr(simulation.simulatedEbit - (latest?.ebit ?? 0))}</td>
              <td className="py-2.5 px-3 text-right">
                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${simulation.simulatedEbit > 0 ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]" : "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]"}`}>
                  {simulation.simulatedEbit > 0 ? "EBIT POSITIVE" : "EBIT NEGATIVE"}
                </span>
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-3 text-left text-[#94A3B8] pl-6">Interest Expense (+{inputs.rateShockBps} bps)</td>
              <td className="py-2.5 px-3 text-right text-[#94A3B8]">{formatCurr(latest?.interestExpense)}</td>
              <td className="py-2.5 px-3 text-right font-bold text-[#EF4444]">{formatCurr(simulation.simulatedInterestExpense)}</td>
              <td className="py-2.5 px-3 text-right text-[#EF4444]">+{formatCurr(simulation.incrementalInterestExpense)}</td>
              <td className="py-2.5 px-3 text-right text-[#94A3B8]">Rate Pass-Through</td>
            </tr>

            <tr>
              <td className="py-2.5 px-3 text-left font-extrabold text-[#38BDF8]">EBIT Interest Coverage</td>
              <td className="py-2.5 px-3 text-right font-bold text-[#10B981]">{formatRatio(profile.latestRatios.interestCoverage)}</td>
              <td className="py-2.5 px-3 text-right font-bold text-[#38BDF8]">{formatRatio(simulation.simulatedInterestCoverage)}</td>
              <td className="py-2.5 px-3 text-right text-[#EF4444]">
                {profile.latestRatios.interestCoverage && simulation.simulatedInterestCoverage
                  ? `${(simulation.simulatedInterestCoverage - profile.latestRatios.interestCoverage).toFixed(2)}x`
                  : "N/A"}
              </td>
              <td className="py-2.5 px-3 text-right">
                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${isCovenantBreached ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]" : "bg-[#10B981]/15 text-[#10B981] border-[#10B981]"}`}>
                  {isCovenantBreached ? "Reference threshold breached in this scenario (< 2.50x)" : "Complies with analytical benchmark"}
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
                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${simulation.runwayStatus === "CRITICAL_BURN" ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]" : "bg-[#10B981]/15 text-[#10B981] border-[#10B981]"}`}>
                  {simulation.runwayStatus === "CRITICAL_BURN" ? "CRITICAL BURN" : "SOLVENT"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sequential Next Step Recommendation Card */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-[#38BDF8]/30 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4 font-mono mt-6">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#38BDF8] font-bold">
            RESEARCH WORKFLOW CONCLUSION
          </div>
          <div className="text-sm font-bold text-white mt-1">
            Next: Generate Evidence-Backed Research Report & Boardroom Deck
          </div>
          <div className="text-xs text-[#94A3B8] mt-0.5">
            Assemble analytical conclusions from all 6 core modules into an Investment Committee Credit Memo with cryptographic SHA-256 verification and PDF/CSV export.
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab?.("07_REPORTS")}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded transition-colors shadow-lg shadow-[#2563EB]/30 shrink-0 cursor-pointer"
        >
          <span>Generate 1-Click Executive Credit Memo</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
