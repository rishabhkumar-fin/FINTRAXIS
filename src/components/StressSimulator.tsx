"use client";

import React, { useState } from "react";
import { Cpu, RotateCcw } from "lucide-react";
import { CompanyRiskProfile, StressSimulationInputs } from "@/lib/types";
import { runStressSimulation } from "@/lib/financialEngine";
import { formatFinancialValue, formatRatio, formatPct } from "@/lib/formatters";

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

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Simulation Control Header */}
      <div className="p-3 bg-[#0E131A] border border-[#1E2638] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#C5A880]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#E1E7EC] tracking-wider uppercase">
                DETERMINISTIC STRESS SIMULATOR // PRO-FORMA IMPACT MODEL
              </span>
              <span className="px-2 py-0.2 bg-[#EF4444]/20 border border-[#EF4444] text-[#EF4444] text-[10px] font-bold">
                [SIMULATED - HYPOTHETICAL]
              </span>
            </div>
            <div className="text-[10px] text-[#5A687D]">
              Baseline: {latest?.period || "FY2024"} Filings &bull; Native Currency: {company.currency} ({company.scaleUnit})
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#5A687D] uppercase">PRESETS:</span>
          <button
            onClick={() => handlePreset(0, 0, 0)}
            className="px-2 py-1 bg-[#07090E] hover:bg-[#12161F] border border-[#1E2638] text-[10px] text-[#9BA8B8]"
          >
            Base Zero
          </button>
          <button
            onClick={() => handlePreset(0, 3, 150)}
            className="px-2 py-1 bg-[#07090E] hover:bg-[#12161F] border border-[#1E2638] text-[10px] text-[#9BA8B8]"
          >
            Tightening (+150bps)
          </button>
          <button
            onClick={() => handlePreset(-15, 10, 350)}
            className="px-2 py-1 bg-[#07090E] hover:bg-[#12161F] border border-[#EF4444]/40 text-[10px] text-[#EF4444]"
          >
            Stagflation (-15% / +350bps)
          </button>
          <button
            onClick={() => handlePreset(-25, -5, 200)}
            className="px-2 py-1 bg-[#07090E] hover:bg-[#12161F] border border-[#EF4444]/40 text-[10px] text-[#EF4444]"
          >
            Recession (-25%)
          </button>
          <button
            onClick={() => handlePreset(-10, 5, 200)}
            className="p-1 bg-[#12161F] border border-[#232B3A] text-[#C5A880]"
            title="Reset to default stress test"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Parameter Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-[#12161F] border border-[#232B3A]">
        {/* Slider 1: Revenue Shock */}
        <div className="space-y-2 p-2 bg-[#07090E] border border-[#1E2638]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#5A687D] uppercase">REVENUE SHOCK</span>
            <span
              className={`font-bold font-mono-numbers text-sm ${
                inputs.revenueShockPct < 0 ? "text-[#EF4444]" : "text-[#10B981]"
              }`}
            >
              {inputs.revenueShockPct > 0 ? `+${inputs.revenueShockPct}%` : `${inputs.revenueShockPct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            step="1"
            value={inputs.revenueShockPct}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, revenueShockPct: Number(e.target.value) }))
            }
            className="w-full accent-[#C5A880] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#5A687D]">
            <span>-30% (Demand Crash)</span>
            <span>0%</span>
            <span>+30% (Expansion)</span>
          </div>
        </div>

        {/* Slider 2: COGS Inflation */}
        <div className="space-y-2 p-2 bg-[#07090E] border border-[#1E2638]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#5A687D] uppercase">COGS INFLATION SHOCK</span>
            <span
              className={`font-bold font-mono-numbers text-sm ${
                inputs.cogsInflationPct > 0 ? "text-[#EF4444]" : "text-[#10B981]"
              }`}
            >
              {inputs.cogsInflationPct > 0 ? `+${inputs.cogsInflationPct}%` : `${inputs.cogsInflationPct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-15"
            max="15"
            step="1"
            value={inputs.cogsInflationPct}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, cogsInflationPct: Number(e.target.value) }))
            }
            className="w-full accent-[#C5A880] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#5A687D]">
            <span>-15% (Deflation)</span>
            <span>0%</span>
            <span>+15% (Input Surge)</span>
          </div>
        </div>

        {/* Slider 3: Interest Rate Shock */}
        <div className="space-y-2 p-2 bg-[#07090E] border border-[#1E2638]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#5A687D] uppercase">BENCHMARK RATE SHOCK</span>
            <span className="font-bold font-mono-numbers text-sm text-[#EF4444]">
              +{inputs.rateShockBps} bps
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            step="25"
            value={inputs.rateShockBps}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, rateShockBps: Number(e.target.value) }))
            }
            className="w-full accent-[#C5A880] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#5A687D]">
            <span>0 bps</span>
            <span>+250 bps</span>
            <span>+500 bps (Volcker Hike)</span>
          </div>
        </div>
      </div>

      {/* Pro-Forma Comparison Ledger */}
      <div className="border border-[#1E2638] bg-[#07090E] overflow-hidden">
        <div className="p-3 bg-[#0A0D12] border-b border-[#1E2638] flex items-center justify-between">
          <span className="font-bold text-[#E1E7EC] tracking-wider uppercase text-xs">
            PRO-FORMA FINANCIAL STATEMENT IMPACT LEDGER
          </span>
          <span className="text-[#EF4444] text-[10px] font-bold">
            [SIMULATED - HYPOTHETICAL FORECAST]
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2638] bg-[#0E131A] text-[#5A687D] text-[11px]">
                <th className="py-2.5 px-3 text-left">LINE ITEM / METRIC</th>
                <th className="py-2.5 px-3 text-right">REPORTED BASE</th>
                <th className="py-2.5 px-3 text-right">PRO-FORMA STRESSED</th>
                <th className="py-2.5 px-3 text-right">DELTA</th>
                <th className="py-2.5 px-3 text-right">IMPACT DIAGNOSIS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638]/50">
              {/* Revenue */}
              <tr className="hover:bg-[#12161F]">
                <td className="py-2.5 px-3 text-left font-bold text-[#E1E7EC]">Total Net Revenue</td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#E1E7EC]">
                  {formatCurr(latest?.revenue)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-[#C5A880]">
                  {formatCurr(simulation.simulatedRevenue)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#EF4444]">
                  {inputs.revenueShockPct >= 0 ? `+${inputs.revenueShockPct}%` : `${inputs.revenueShockPct}%`}
                </td>
                <td className="py-2.5 px-3 text-right text-[10px] text-[#5A687D]">
                  Stressed Topline
                </td>
              </tr>

              {/* COGS */}
              <tr className="hover:bg-[#12161F]">
                <td className="py-2.5 px-3 text-left text-[#9BA8B8] pl-6">Cost of Goods Sold (COGS)</td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#9BA8B8]">
                  {formatCurr(latest?.cogs)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers font-semibold text-[#EF4444]">
                  {formatCurr(simulation.simulatedCogs)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#EF4444]">
                  {inputs.cogsInflationPct >= 0 ? `+${inputs.cogsInflationPct}%` : `${inputs.cogsInflationPct}%`}
                </td>
                <td className="py-2.5 px-3 text-right text-[10px] text-[#5A687D]">
                  Input Inflation
                </td>
              </tr>

              {/* Gross Margin */}
              <tr className="hover:bg-[#12161F] bg-[#0A0D12]">
                <td className="py-2.5 px-3 text-left font-semibold text-[#C5A880]">Gross Margin %</td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#C5A880]">
                  {formatPct(profile.latestRatios.grossMarginPct)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-[#C5A880]">
                  {formatPct(simulation.simulatedGrossMarginPct)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#EF4444]">
                  {(
                    simulation.simulatedGrossMarginPct -
                    (profile.latestRatios.grossMarginPct ?? 0)
                  ).toFixed(1)}
                  %
                </td>
                <td className="py-2.5 px-3 text-right text-[10px] text-[#5A687D]">
                  Spread Compression
                </td>
              </tr>

              {/* Operating Income / EBIT */}
              <tr className="hover:bg-[#12161F]">
                <td className="py-2.5 px-3 text-left font-bold text-[#E1E7EC]">Operating Income (EBIT)</td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#E1E7EC]">
                  {formatCurr(latest?.ebit)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-[#C5A880]">
                  {formatCurr(simulation.simulatedEbit)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#EF4444]">
                  {formatCurr(simulation.simulatedEbit - (latest?.ebit ?? 0))}
                </td>
                <td className="py-2.5 px-3 text-right text-[10px] text-[#5A687D]">
                  EBIT Delta
                </td>
              </tr>

              {/* Interest Expense */}
              <tr className="hover:bg-[#12161F]">
                <td className="py-2.5 px-3 text-left text-[#EF4444] pl-6">Interest Expense</td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#9BA8B8]">
                  {formatCurr(latest?.interestExpense)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-[#EF4444]">
                  {formatCurr(simulation.simulatedInterestExpense)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#EF4444]">
                  +{formatCurr(simulation.incrementalInterestExpense)}
                </td>
                <td className="py-2.5 px-3 text-right text-[10px] text-[#EF4444]">
                  Rate shock pass-through
                </td>
              </tr>

              {/* EBITDA */}
              <tr className="hover:bg-[#12161F] bg-[#0E131A]">
                <td className="py-2.5 px-3 text-left font-bold text-[#10B981]">Pro-Forma EBITDA</td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#10B981]">
                  {formatCurr(latest?.ebitda)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-[#10B981]">
                  {formatCurr(simulation.simulatedEbitda)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#EF4444]">
                  {formatCurr(simulation.simulatedEbitda - (latest?.ebitda ?? 0))}
                </td>
                <td className="py-2.5 px-3 text-right text-[10px] text-[#5A687D]">
                  Cash Flow Proxy
                </td>
              </tr>

              {/* Stressed Interest Coverage */}
              <tr className="hover:bg-[#12161F] bg-[#12161F]">
                <td className="py-2.5 px-3 text-left font-extrabold text-[#C5A880]">
                  EBIT Interest Coverage
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#E1E7EC]">
                  {formatRatio(profile.latestRatios.interestCoverage)}
                </td>
                <td
                  className={`py-2.5 px-3 text-right font-mono-numbers font-bold ${
                    (simulation.simulatedInterestCoverage ?? 0) < 2.0
                      ? "text-[#EF4444]"
                      : "text-[#C5A880]"
                  }`}
                >
                  {formatRatio(simulation.simulatedInterestCoverage)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#EF4444]">
                  {(
                    (simulation.simulatedInterestCoverage ?? 0) -
                    (profile.latestRatios.interestCoverage ?? 0)
                  ).toFixed(2)}
                  x
                </td>
                <td className="py-2.5 px-3 text-right text-[10px]">
                  {(simulation.simulatedInterestCoverage ?? 0) < 1.5 ? (
                    <span className="text-[#EF4444] font-bold">DEFAULT RISK</span>
                  ) : (simulation.simulatedInterestCoverage ?? 0) < 3.0 ? (
                    <span className="text-[#F59E0B]">COMPRESSED BUFFER</span>
                  ) : (
                    <span className="text-[#10B981]">ADEQUATE</span>
                  )}
                </td>
              </tr>

              {/* Stressed Cash Runway */}
              <tr className="hover:bg-[#12161F]">
                <td className="py-2.5 px-3 text-left font-bold text-[#E1E7EC]">
                  Stressed Liquidity Runway
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#10B981]">
                  SELF-SUSTAINING
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-[#E1E7EC]">
                  {simulation.cashBurnRunwayMonths !== null
                    ? `${simulation.cashBurnRunwayMonths.toFixed(1)} Months`
                    : "POSITIVE FCF"}
                </td>
                <td className="py-2.5 px-3 text-right font-mono-numbers text-[#9BA8B8]">
                  {simulation.runwayStatus}
                </td>
                <td className="py-2.5 px-3 text-right text-[10px]">
                  {simulation.runwayStatus === "CRITICAL_BURN" ? (
                    <span className="text-[#EF4444] font-bold">CRITICAL BURN (&lt; 6M)</span>
                  ) : (
                    <span className="text-[#10B981]">SOLVENT</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
