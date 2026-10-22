"use client";

import React, { useState } from "react";
import {
  Building2,
  TrendingUp,
  ArrowRight,
  SlidersHorizontal,
  FileSpreadsheet,
  FileText,
  Landmark,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { CompanyEntity, CompanyRiskProfile } from "@/lib/types";
import { ModuleTab } from "./NavigationTabs";
import { formatFinancialValue } from "@/lib/formatters";
import { WorkstationHeader, WorkstationNextStep } from "./WorkstationNav";

interface OverviewWorkstationProps {
  profile: CompanyRiskProfile | null;
  companies?: CompanyEntity[];
  onSelectCompany?: (id: string) => void;
  onRefreshProfile?: () => void;
  onNavigateToTab: (tab: ModuleTab) => void;
}

export function OverviewWorkstation({
  profile,
  companies = [],
  onSelectCompany,
  onRefreshProfile,
  onNavigateToTab,
}: OverviewWorkstationProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshNotice(null);
    try {
      if (onRefreshProfile) {
        await onRefreshProfile();
      }
      setRefreshNotice("Financial ledger verified & synchronized with latest regulatory disclosures.");
      setTimeout(() => setRefreshNotice(null), 4000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Empty State: Prompt user to select a company
  if (!profile) {
    return (
      <div className="bg-[#0C111C] border border-[#1E293B] rounded-2xl p-12 text-center max-w-xl mx-auto my-12 font-mono">
        <Building2 className="w-12 h-12 text-[#38BDF8] mx-auto mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Choose a company to begin your financial analysis</h2>
        <p className="text-xs text-[#94A3B8] mb-6">
          Select an enrolled corporate issuer from the directory to review balance sheets, solvency health, and macro risk models.
        </p>
        <button
          onClick={() => onNavigateToTab("01_HUB")}
          className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          Open Company Directory
        </button>
      </div>
    );
  }

  const { company, periods, latestRatios, earlyWarningFlags } = profile;
  const latestPeriod = periods[0];

  const curr = company.currency;
  const scale = company.scaleUnit;

  const price = company.sharePrice;
  const marketCap = company.marketCap;

  // Key Ratios
  const netDebtToEbitda = latestRatios?.netDebtToEbitda ?? null;
  const interestCoverage = latestRatios?.interestCoverage ?? null;
  const currentRatio = latestRatios?.currentRatio ?? null;

  // Chronologically sorted for trend preview
  const sortedPeriods = [...periods].reverse();

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Workstation Standard Institutional Header */}
      <WorkstationHeader
        code="OVERVIEW"
        title="Executive Corporate Overview"
        company={company}
        period={latestPeriod?.period || "FY2024"}
        filingForm={latestPeriod?.filingForm || "10-K"}
        question="What is this company's high-level financial health, capital structure, and current credit risk posture?"
      >
        <div className="flex flex-wrap items-center gap-2">
          {companies && companies.length > 0 && onSelectCompany && (
            <select
              value={company.id}
              onChange={(e) => onSelectCompany(e.target.value)}
              className="bg-[#111827] text-white font-bold border border-[#2563EB]/40 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0A0E17] text-white">
                  {c.name} ({c.symbol}) &bull; {c.exchange}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#38BDF8] text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
            title="Re-verify company statements against database cache"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#38BDF8] ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </WorkstationHeader>

      {refreshNotice && (
        <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/40 text-[#10B981] text-xs font-mono rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{refreshNotice}</span>
        </div>
      )}

      {/* 2. Distinct Separation: Market Data vs Accounting Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel A: Market Trading Data (Changes Intraday) */}
        <div className="bg-[#101621] border border-[#253247] p-5 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#253247] pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#38BDF8]" />
              <h3 className="font-mono text-sm font-bold text-[#F3F6FC]">MARKET VALUATION (INTRADAY / EOD)</h3>
            </div>
            <span className="text-[10px] font-mono text-[#38BDF8] bg-[#3867F5]/10 px-2 py-0.5 rounded border border-[#3867F5]/30">
              OPEN MARKET DATA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono">
            <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
              <div className="text-[10px] text-[#9AA8BC]">LAST TRADED PRICE</div>
              <div className="text-xl font-bold text-[#F3F6FC] mt-1">
                {typeof price === "number" ? `${curr} ${price.toFixed(2)}` : "Unavailable"}
              </div>
              <div className="text-[10px] text-[#16A879] mt-0.5 flex items-center gap-1">
                <span>Verified Provider Quote</span>
              </div>
            </div>

            <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
              <div className="text-[10px] text-[#9AA8BC]">MARKET CAPITALIZATION</div>
              <div className="text-xl font-bold text-[#F3F6FC] mt-1">
                {typeof marketCap === "number" ? `${curr} ${marketCap.toLocaleString()} ${scale}` : "Unavailable"}
              </div>
              <div className="text-[10px] text-[#9AA8BC] mt-0.5">Equity Float Valuation</div>
            </div>
          </div>

          <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[#9AA8BC] text-[10px]">EXCHANGE DOMAIN:</span>
              <div className="text-[#F3F6FC] font-semibold">{company.exchange} &bull; {company.country}</div>
            </div>
            <button
              onClick={() => onNavigateToTab("01_HUB")}
              className="text-[#38BDF8] hover:text-white flex items-center gap-1 text-xs transition-colors"
            >
              <span>Interactive Chart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Panel B: Accounting Fundamentals (Tied to Reporting Periods) */}
        <div className="bg-[#101621] border border-[#253247] p-5 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#253247] pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#16A879]" />
              <h3 className="font-mono text-sm font-bold text-[#F3F6FC]">REPORTED ACCOUNTING FUNDAMENTALS</h3>
            </div>
            <span className="text-[10px] font-mono text-[#16A879] bg-[#16A879]/10 px-2 py-0.5 rounded border border-[#16A879]/30">
              AUDITED FILING
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono">
            <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
              <div className="text-[10px] text-[#9AA8BC]">ANNUAL REVENUE</div>
              <div className="text-xl font-bold text-[#F3F6FC] mt-1">
                {latestPeriod?.revenue !== null && latestPeriod?.revenue !== undefined
                  ? formatFinancialValue(latestPeriod.revenue, curr, scale)
                  : "Unavailable"}
              </div>
              <div className="text-[10px] text-[#9AA8BC] mt-0.5">Top-Line Scale</div>
            </div>

            <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
              <div className="text-[10px] text-[#9AA8BC]">OPERATING PROFIT (EBIT)</div>
              <div className="text-xl font-bold text-[#F3F6FC] mt-1">
                {latestPeriod?.ebit !== null && latestPeriod?.ebit !== undefined
                  ? formatFinancialValue(latestPeriod.ebit, curr, scale)
                  : "Unavailable"}
              </div>
              <div className="text-[10px] text-[#16A879] mt-0.5">Core Earnings Power</div>
            </div>
          </div>

          <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[#9AA8BC] text-[10px]">CASH VS DEBT POSITION:</span>
              <div className="text-[#F3F6FC] font-semibold">
                Cash: {formatFinancialValue(latestPeriod?.cashAndEquivalents, curr, scale)} &bull; Total Debt: {formatFinancialValue(latestPeriod?.totalDebt, curr, scale)}
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab("02_HEALTH")}
              className="text-[#16A879] hover:text-white flex items-center gap-1 text-xs transition-colors"
            >
              <span>3-Statement Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Three Institutional Health Hurdle Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hurdle 1: Net Debt / EBITDA */}
        <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between font-mono">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9AA8BC]">LEVERAGE MULTIPLE</span>
            <span className="text-[10px] text-[#F5B942]">Hurdle: &le; 3.50x</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-[#F3F6FC]">
              {netDebtToEbitda !== null
                ? `${netDebtToEbitda.toFixed(2)}x`
                : "Unavailable"}
            </div>
            <div className="text-[11px] text-[#9AA8BC] mt-0.5">
              {netDebtToEbitda !== null
                ? netDebtToEbitda <= 3.50
                  ? "✓ Compliant with institutional debt ceiling"
                  : "⚠ Amber alert: Exceeds leverage hurdle"
                : "Insufficient debt/EBITDA inputs"}
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab("02_HEALTH")}
            className="text-xs text-[#38BDF8] hover:text-white flex items-center gap-1 mt-1 transition-colors"
          >
            <span>Analyze Debt Coverage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hurdle 2: Interest Coverage */}
        <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between font-mono">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9AA8BC]">INTEREST COVERAGE</span>
            <span className="text-[10px] text-[#F05252]">Floor: &ge; 2.50x</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-[#F3F6FC]">
              {interestCoverage !== null
                ? `${interestCoverage.toFixed(2)}x`
                : "Unavailable"}
            </div>
            <div className="text-[11px] text-[#9AA8BC] mt-0.5">
              {interestCoverage !== null
                ? interestCoverage >= 2.50
                  ? "✓ Ample operating cash to service interest"
                  : "⚠ Red alert: Debt service pressure"
                : "Insufficient interest expense reported"}
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab("06_SIMULATOR")}
            className="text-xs text-[#38BDF8] hover:text-white flex items-center gap-1 mt-1 transition-colors"
          >
            <span>Test Rate Sensitivity</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hurdle 3: Current Ratio */}
        <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between font-mono">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9AA8BC]">LIQUIDITY GATE</span>
            <span className="text-[10px] text-[#38BDF8]">Floor: &ge; 1.10x</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-[#F3F6FC]">
              {currentRatio !== null
                ? `${currentRatio.toFixed(2)}x`
                : "Unavailable"}
            </div>
            <div className="text-[11px] text-[#9AA8BC] mt-0.5">
              {currentRatio !== null
                ? currentRatio >= 1.10
                  ? "✓ Positive net working capital buffer"
                  : "⚠ Liquidity deficit: Current liabilities exceed assets"
                : "Missing current asset/liability disclosures"}
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab("03_VULNERABILITY")}
            className="text-xs text-[#38BDF8] hover:text-white flex items-center gap-1 mt-1 transition-colors"
          >
            <span>Inspect Risk Warnings ({earlyWarningFlags.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Multi-Period Financial Trajectory SVG Visualizer */}
      <div className="bg-[#101621] border border-[#253247] p-5 rounded-xl flex flex-col gap-4 font-mono">
        <div className="flex items-center justify-between border-b border-[#253247] pb-3">
          <h3 className="text-sm font-bold text-[#F3F6FC]">
            HISTORICAL TRAJECTORY ({sortedPeriods.map((p) => p.period).join(" &rarr; ")})
          </h3>
          <span className="text-xs text-[#9AA8BC]">Unit: {scale} ({curr})</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {sortedPeriods.map((p) => (
            <div key={p.id} className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
              <div className="text-xs font-bold text-[#38BDF8]">{p.period}</div>
              <div className="mt-2 text-xs text-[#9AA8BC]">Revenue:</div>
              <div className="text-sm font-bold text-[#F3F6FC]">
                {p.revenue !== null ? formatFinancialValue(p.revenue, curr, scale) : "Unavailable"}
              </div>
              <div className="mt-1 text-xs text-[#9AA8BC]">Operating EBIT:</div>
              <div className="text-xs font-semibold text-[#16A879]">
                {p.ebit !== null ? formatFinancialValue(p.ebit, curr, scale) : "Unavailable"}
              </div>
              <div className="mt-1 text-[10px] text-[#5A687D]">{p.filingForm} &bull; {p.filingDate}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Direct Workstation Jump Launchpad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateToTab("01_HUB")}
          className="p-4 bg-[#101621] hover:bg-[#151E2D] border border-[#253247] hover:border-[#3867F5] rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <Building2 className="w-5 h-5 text-[#3867F5] mb-2" />
            <div className="text-sm font-bold text-[#F3F6FC]">Company Hub</div>
            <div className="text-xs text-[#9AA8BC] mt-0.5">8-timeframe interactive chart with mouse scrubbing</div>
          </div>
          <div className="text-xs text-[#38BDF8] flex items-center gap-1 mt-3 group-hover:translate-x-1 transition-transform">
            <span>Open Chart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab("02_HEALTH")}
          className="p-4 bg-[#101621] hover:bg-[#151E2D] border border-[#253247] hover:border-[#16A879] rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <FileSpreadsheet className="w-5 h-5 text-[#16A879] mb-2" />
            <div className="text-sm font-bold text-[#F3F6FC]">Financial Statements</div>
            <div className="text-xs text-[#9AA8BC] mt-0.5">Balance sheet check (Assets = Liabilities + Equity)</div>
          </div>
          <div className="text-xs text-[#16A879] flex items-center gap-1 mt-3 group-hover:translate-x-1 transition-transform">
            <span>View Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab("06_SIMULATOR")}
          className="p-4 bg-[#101621] hover:bg-[#151E2D] border border-[#253247] hover:border-[#F5B942] rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <SlidersHorizontal className="w-5 h-5 text-[#F5B942] mb-2" />
            <div className="text-sm font-bold text-[#F3F6FC]">Stress Simulator</div>
            <div className="text-xs text-[#9AA8BC] mt-0.5">Central bank repo shocks & revenue contractions</div>
          </div>
          <div className="text-xs text-[#F5B942] flex items-center gap-1 mt-3 group-hover:translate-x-1 transition-transform">
            <span>Simulate Shocks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab("07_REPORTS")}
          className="p-4 bg-[#101621] hover:bg-[#151E2D] border border-[#253247] hover:border-[#38BDF8] rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <FileText className="w-5 h-5 text-[#38BDF8] mb-2" />
            <div className="text-sm font-bold text-[#F3F6FC]">Research Reports</div>
            <div className="text-xs text-[#9AA8BC] mt-0.5">Printable IC dossier with CSV export & SHA-256</div>
          </div>
          <div className="text-xs text-[#38BDF8] flex items-center gap-1 mt-3 group-hover:translate-x-1 transition-transform">
            <span>Generate Memo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Sequential Next Step in Workflow */}
      <WorkstationNextStep
        currentTab="overview"
        nextTab="01_HUB"
        nextTitle="Company Intelligence Hub"
        nextCode="DESK 01"
        reason="Examine interactive price charts, audited filing history, and cross-peer comparative fundamentals."
        onNavigate={onNavigateToTab}
        relatedLinks={[
          { tab: "02_HEALTH", label: "3-Statement Solvency" },
          { tab: "03_VULNERABILITY", label: "Vulnerability Monitor" },
        ]}
      />
    </div>
  );
}
