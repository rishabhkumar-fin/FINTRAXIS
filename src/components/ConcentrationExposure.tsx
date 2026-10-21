"use client";

import React, { useState } from "react";
import {
  PieChart,
  Globe2,
  Layers,
  Info,
  ArrowRight,
  TrendingUp,
  BarChart2,
  FileCheck2,
} from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { getConcentrationAnalysis } from "@/lib/businessDisclosures";
import { ModuleTab } from "./NavigationTabs";

interface ConcentrationExposureProps {
  profile: CompanyRiskProfile;
  onNavigateToTab?: (tab: ModuleTab) => void;
}

export function ConcentrationExposure({
  profile,
  onNavigateToTab,
}: ConcentrationExposureProps) {
  const company = profile.company;
  const analysis = getConcentrationAnalysis(company.id, company.currency);

  const [activeView, setActiveView] = useState<"BUSINESS" | "GEOGRAPHIC">("BUSINESS");

  const segments =
    activeView === "BUSINESS" ? analysis.businessSegments : analysis.geographicSegments;
  const hhi =
    activeView === "BUSINESS"
      ? analysis.herfindahlIndexBusiness
      : analysis.herfindahlIndexGeographic;

  // HHI interpretation:
  // <1500: Well Diversified
  // 1500 - 2500: Moderately Concentrated
  // >2500: Highly Concentrated
  const getHhiBadge = (score: number) => {
    if (score < 1500) {
      return {
        label: "DIVERSIFIED (< 1,500)",
        color: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30",
        desc: "Low operational vulnerability to single-market disruption.",
      };
    }
    if (score <= 2500) {
      return {
        label: "MODERATELY CONCENTRATED (1,500 - 2,500)",
        color: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30",
        desc: "Balanced portfolio with notable reliance on lead business segment.",
      };
    }
    return {
      label: "HIGHLY CONCENTRATED (> 2,500)",
      color: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30",
      desc: "Substantial revenue vulnerability if the primary segment undergoes margin compression.",
    };
  };

  const currentHhiBadge = getHhiBadge(hhi);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-[#0D121F] border border-[#1E293B] rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                REVENUE DIVERSIFICATION
              </span>
              <span className="text-xs font-mono text-[#64748B]">
                SEGMENT & GEOGRAPHIC DIVERSIFICATION AUDIT
              </span>
            </div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              <PieChart className="w-5 h-5 text-[#38BDF8]" />
              Concentration & Exposure Analysis
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              Measures where the entity&apos;s commercial revenues and cash flows originate across business
              divisions and geographic jurisdictions. Evaluates revenue vulnerability via the{" "}
              <span className="text-white font-medium">Herfindahl-Hirschman Index (HHI)</span>.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 rounded flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{analysis.regulatoryStandard}</span>
            </span>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1E293B]/70 font-mono text-xs">
          <div className="bg-[#0A0E17] border border-[#1E293B] rounded p-3">
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Top Business Line</div>
            <div className="text-base font-bold text-white mt-1 truncate" title={analysis.topSegmentName}>
              {analysis.topSegmentName}
            </div>
            <div className="text-[10px] text-[#38BDF8] mt-0.5 font-bold">
              {analysis.topSegmentConcentrationPct.toFixed(1)}% of Revenue
            </div>
          </div>

          <div className="bg-[#0A0E17] border border-[#1E293B] rounded p-3">
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Top Geographic Market</div>
            <div className="text-base font-bold text-white mt-1 truncate" title={analysis.topGeographicName}>
              {analysis.topGeographicName}
            </div>
            <div className="text-[10px] text-[#38BDF8] mt-0.5 font-bold">
              {analysis.topGeographicConcentrationPct.toFixed(1)}% of Revenue
            </div>
          </div>

          <div className="bg-[#0A0E17] border border-[#1E293B] rounded p-3">
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Business HHI Index</div>
            <div className="text-base font-bold text-white mt-1">
              {analysis.herfindahlIndexBusiness.toLocaleString()} / 10,000
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">
              {analysis.herfindahlIndexBusiness > 2500 ? "Concentrated" : "Moderate"}
            </div>
          </div>

          <div className="bg-[#0A0E17] border border-[#1E293B] rounded p-3">
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Geographic HHI Index</div>
            <div className="text-base font-bold text-white mt-1">
              {analysis.herfindahlIndexGeographic.toLocaleString()} / 10,000
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">
              {analysis.herfindahlIndexGeographic > 2500 ? "Concentrated" : "Moderate"}
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher: Business vs Geographic */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView("BUSINESS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeView === "BUSINESS"
                ? "bg-[#2563EB] text-white font-bold"
                : "bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Product & Business Segments ({analysis.businessSegments.length})</span>
          </button>
          <button
            onClick={() => setActiveView("GEOGRAPHIC")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeView === "GEOGRAPHIC"
                ? "bg-[#2563EB] text-white font-bold"
                : "bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Geographic Jurisdictions ({analysis.geographicSegments.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#64748B]">HHI REGIME:</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${currentHhiBadge.color}`}>
            {currentHhiBadge.label}
          </span>
        </div>
      </div>

      {/* Visual Breakdown Cards & Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Segment Distribution Table & Progress Bars */}
        <div className="lg:col-span-2 bg-[#0D121F] border border-[#1E293B] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#38BDF8]" />
              {activeView === "BUSINESS"
                ? "Revenue Contribution by Business Product Line"
                : "Revenue Contribution by Operating Geography"}
            </h3>
            <span className="text-[11px] font-mono text-[#64748B]">
              Period: {analysis.period} &bull; Currency: {company.currency} ({company.scaleUnit})
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {segments.map((seg, idx) => (
              <div key={seg.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-[10px] text-[#64748B]">{idx + 1}.</span>
                    <span className="font-semibold text-white">{seg.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {seg.revenueAmount > 0 && (
                      <span className="text-[#94A3B8]">
                        {seg.revenueAmount.toLocaleString()} {seg.currency}
                      </span>
                    )}
                    <span className="font-bold text-[#38BDF8] w-14 text-right">
                      {seg.percentageOfTotal.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Segment Visual Progress Bar */}
                <div className="w-full bg-[#1E293B] h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0
                        ? "bg-[#38BDF8]"
                        : idx === 1
                        ? "bg-[#2563EB]"
                        : idx === 2
                        ? "bg-[#6366F1]"
                        : idx === 3
                        ? "bg-[#8B5CF6]"
                        : "bg-[#A855F7]"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, seg.percentageOfTotal))}%` }}
                  />
                </div>

                <div className="text-[9.5px] text-[#64748B] pl-6">
                  Citation: {seg.filingCitation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Herfindahl Index & Concentration Theory */}
        <div className="space-y-4">
          <div className="bg-[#0D121F] border border-[#1E293B] rounded-lg p-5 font-mono text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#38BDF8]" />
              Herfindahl-Hirschman (HHI)
            </h3>

            <div className="bg-[#0A0E17] border border-[#1E293B] rounded p-3 mb-3">
              <div className="text-[10px] text-[#64748B] uppercase">Calculated Index Value</div>
              <div className="text-2xl font-bold text-white mt-1">
                {hhi.toLocaleString()}
                <span className="text-xs font-normal text-[#64748B]"> / 10,000</span>
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-1">
                Formula: <span className="text-[#38BDF8]">HHI = Σ (s_i)²</span>
              </div>
            </div>

            <div className="space-y-2 text-[11px] text-[#94A3B8] leading-relaxed">
              <div className="p-2 rounded bg-[#0A0E17] border border-[#1E293B]">
                <span className="font-bold text-white block">Regime Interpretation:</span>
                {currentHhiBadge.desc}
              </div>

              <div className="text-[10.5px] text-[#64748B] space-y-1 pt-1">
                <div>&bull; &lt; 1,500: Well Diversified</div>
                <div>&bull; 1,500 – 2,500: Moderately Concentrated</div>
                <div>&bull; &gt; 2,500: Highly Concentrated</div>
              </div>
            </div>
          </div>

          {/* Footnote Disclosures */}
          <div className="bg-[#0D121F] border border-[#1E293B] rounded-lg p-4 font-mono text-xs">
            <div className="text-[10px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Audited Footnote Observations</span>
            </div>
            <ul className="space-y-1.5 text-[10.5px] text-[#94A3B8]">
              {analysis.disclosureNotes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#38BDF8]">&bull;</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Sequential Next Step Recommendation Card */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-[#38BDF8]/30 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#38BDF8] font-bold">
            RECOMMENDED WORKFLOW STEP 6 OF 6
          </div>
          <div className="text-sm font-bold text-white mt-1">
            Next: Test Adverse Macro Shocks in Stress & Resilience Simulator
          </div>
          <div className="text-xs text-[#94A3B8] mt-0.5">
            Subject this entity&apos;s cash flows and debt covenants to modeled interest rate hikes, revenue contraction, and margin compression.
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab?.("06_SIMULATOR")}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded transition-colors shadow-lg shadow-[#2563EB]/30 shrink-0"
        >
          <span>Run Stress Simulation (Module 6)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
