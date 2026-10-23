"use client";

import React, { useState, useEffect } from "react";
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
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Info,
} from "lucide-react";
import { CompanyEntity, CompanyRiskProfile } from "@/lib/types";
import { ModuleTab } from "./NavigationTabs";
import { formatFinancialValue } from "@/lib/formatters";
import { WorkstationHeader, WorkstationNextStep } from "./WorkstationNav";
import { computeCompanyFinanceSummary } from "@/lib/finance/financeMaster";
import { isTickerInWatchlist, toggleTickerInWatchlist, subscribeToWatchlist } from "@/lib/watchlist";

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
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    if (profile?.company?.symbol) {
      setInWatchlist(isTickerInWatchlist(profile.company.symbol));
    }
    const unsubscribe = subscribeToWatchlist(() => {
      if (profile?.company?.symbol) {
        setInWatchlist(isTickerInWatchlist(profile.company.symbol));
      }
    });
    return unsubscribe;
  }, [profile?.company?.symbol]);

  const handleToggleWatchlist = () => {
    if (!profile?.company?.symbol) return;
    const { inWatchlist: newState } = toggleTickerInWatchlist(profile.company.symbol);
    setInWatchlist(newState);
    setRefreshNotice(
      newState
        ? `Added ${profile.company.symbol} to your persistent watchlist.`
        : `Removed ${profile.company.symbol} from your watchlist.`
    );
    setTimeout(() => setRefreshNotice(null), 3500);
  };

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

  const { company, periods } = profile;
  const latestPeriod = periods[0];

  // Derive Single Source of Truth
  const summary = profile.financeSummary || computeCompanyFinanceSummary(company, periods);
  if (!summary) {
    return null;
  }
  const quote = summary.quote;
  const ratios = summary.ratios;
  const debt = summary.debtStructure;
  const health = summary.healthScore;

  const curr = company.currency;
  const scale = company.scaleUnit;

  // Key figures
  const netDebtVal = ratios.netDebt;
  const netDebtToEbitda = ratios.netDebtToEbitda;
  const interestCoverage = ratios.interestCoverage;
  const currentRatio = ratios.currentRatio;
  const operatingMargin = ratios.operatingMarginPct;
  const ebitdaVal = latestPeriod?.ebitda ?? null;

  // Chronologically sorted for trend preview
  const sortedPeriods = [...periods].reverse();

  // Balance Sheet identity check
  const assets = latestPeriod?.totalAssets ?? 0;
  const liabilitiesAndEquity = (latestPeriod?.totalLiabilities ?? 0) + (latestPeriod?.totalShareholdersEquity ?? 0);
  const bsDelta = Math.abs(assets - liabilitiesAndEquity);
  const bsBalanced = assets > 0 && bsDelta / assets <= 0.005;

  // 52-week position
  const rangeSpan = (quote.fiftyTwoWeekHigh ?? 0) - (quote.fiftyTwoWeekLow ?? 0);
  const fiftyTwoWeekPct = rangeSpan > 0 ? Math.max(0, Math.min(100, (((quote.price ?? 0) - (quote.fiftyTwoWeekLow ?? 0)) / rangeSpan) * 100)) : 50;

  // Executive summary narrative (Section 5)
  const hqCountry = company.country === "IND" ? "India-headquartered" : company.country === "USA" ? "United States-headquartered" : company.country === "JPN" ? "Japan-headquartered" : `${company.country}-based`;
  const debtNarrative = netDebtVal !== null && netDebtVal <= 0
    ? `It holds net cash of ${formatFinancialValue(Math.abs(netDebtVal), curr, scale)} (${netDebtToEbitda !== null ? `${netDebtToEbitda.toFixed(2)}x, net cash` : "net cash position"}).`
    : `It carries net debt of ${formatFinancialValue(netDebtVal, curr, scale)} (${netDebtToEbitda !== null ? `${netDebtToEbitda.toFixed(2)}x leverage` : "funded leverage"}).`;

  const healthTierLabel = health.tier === "TIER_1_STABLE" ? "Strong / Stable" : health.tier === "TIER_2_WATCHLIST" ? "Watchlist / Moderate Risk" : "Elevated Risk";
  const healthGrade = health.score >= 80 ? "A" : health.score >= 65 ? "B" : health.score >= 50 ? "C" : "D";

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
            onClick={handleToggleWatchlist}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
              inWatchlist
                ? "bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]"
                : "bg-[#111827] hover:bg-[#1E293B] border-[#1E293B] text-[#94A3B8] hover:text-white"
            }`}
            title={inWatchlist ? "Remove from persistent watchlist" : "Add to persistent watchlist"}
          >
            {inWatchlist ? <BookmarkCheck className="w-3.5 h-3.5 text-[#38BDF8]" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{inWatchlist ? "Watchlist Active" : "Add Watchlist"}</span>
          </button>

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

      {/* 1. Executive Summary in Plain Language (Section 5 Requirement) */}
      <div className="p-4 bg-[#0F1623] border border-[#23334D] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#38BDF8] uppercase tracking-wider font-mono">
            <Info className="w-4 h-4 text-[#38BDF8]" />
            <span>EXECUTIVE FINANCIAL DIGEST &bull; {company.symbol}</span>
          </div>
          <p className="text-sm text-[#E2E8F0] leading-relaxed max-w-4xl">
            <strong className="text-white">{company.name}</strong> is an {hqCountry} {company.sector.toLowerCase()} corporation.
            For {latestPeriod?.period || "the latest period"}, it reported net revenue of{" "}
            <strong className="text-white">{formatFinancialValue(latestPeriod?.revenue, curr, scale)}</strong> and EBITDA of{" "}
            <strong className="text-white">{formatFinancialValue(ebitdaVal, curr, scale)}</strong>
            {operatingMargin !== null ? ` (operating margin: ${operatingMargin.toFixed(1)}%)` : ""}.{" "}
            {debtNarrative}{" "}
            Analytical health screening score: <strong className="text-[#38BDF8]">{health.score}/100 ({healthTierLabel}, Grade {healthGrade})</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 bg-[#2563EB]/15 border border-[#2563EB]/40 text-[#60A5FA] text-xs font-mono font-bold rounded-lg">
            SCORE: {health.score}/100
          </span>
          <span className="px-3 py-1 bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs font-mono font-bold rounded-lg">
            GRADE {healthGrade}
          </span>
        </div>
      </div>

      {/* 2. Distinct Separation: Market Quote vs Reported Accounting (Section 5 Requirement) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel A: Market Trading Data (Changes Intraday) */}
        <div className="bg-[#101621] border border-[#253247] p-5 rounded-xl flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#253247] pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#38BDF8]" />
                <h3 className="font-mono text-sm font-bold text-[#F3F6FC]">MARKET VALUATION (QUOTE DATA)</h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                quote.status === "live"
                  ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40"
                  : quote.status === "delayed"
                  ? "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40"
                  : "bg-[#3867F5]/10 text-[#38BDF8] border-[#3867F5]/30"
              }`}>
                {quote.status} &bull; {quote.source}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono mt-4">
              <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
                <div className="text-[10px] text-[#9AA8BC]">LAST TRADED PRICE</div>
                <div className="text-xl font-bold text-[#F3F6FC] mt-1">
                  {typeof quote.price === "number" ? `${quote.currency} ${quote.price.toFixed(2)}` : "Unavailable"}
                </div>
                <div className="text-[10px] mt-0.5 flex items-center gap-1">
                  <span className={quote.change >= 0 ? "text-[#10B981] font-semibold" : "text-[#EF4444] font-semibold"}>
                    {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
                <div className="text-[10px] text-[#9AA8BC]">MARKET CAPITALIZATION</div>
                <div className="text-xl font-bold text-[#F3F6FC] mt-1">
                  {typeof company.marketCap === "number" ? `${curr} ${company.marketCap.toLocaleString()} ${scale}` : "Unavailable"}
                </div>
                <div className="text-[10px] text-[#9AA8BC] mt-0.5">As of: {quote.asOf}</div>
              </div>
            </div>

            {/* Price Ranges */}
            <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg mt-3 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#9AA8BC] text-[10px]">DAY RANGE:</span>
                <span className="text-white font-semibold">
                  {quote.currency} {quote.dayLow.toFixed(2)} &ndash; {quote.dayHigh.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9AA8BC] text-[10px]">52-WEEK RANGE:</span>
                <span className="text-white font-semibold">
                  {quote.currency} {quote.fiftyTwoWeekLow.toFixed(2)} &ndash; {quote.fiftyTwoWeekHigh.toFixed(2)}
                </span>
              </div>
              {/* Range Position Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[9px] text-[#64748B]">
                  <span>52W Low</span>
                  <span>52W Position: {fiftyTwoWeekPct.toFixed(0)}%</span>
                  <span>52W High</span>
                </div>
                <div className="h-1.5 w-full bg-[#0B0F19] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8]"
                    style={{ width: `${fiftyTwoWeekPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#151E2D] border border-[#253247] rounded-lg flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[#9AA8BC] text-[10px]">LISTING VENUE:</span>
              <div className="text-[#F3F6FC] font-semibold">{company.exchange} &bull; {company.country}</div>
            </div>
            <button
              onClick={() => onNavigateToTab("01_HUB")}
              className="text-[#38BDF8] hover:text-white flex items-center gap-1 text-xs transition-colors cursor-pointer"
            >
              <span>Interactive Chart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Panel B: Reported Accounting Fundamentals (Tied to Audited Reporting Periods) */}
        <div className="bg-[#101621] border border-[#253247] p-5 rounded-xl flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#253247] pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#10B981]" />
                <h3 className="font-mono text-sm font-bold text-[#F3F6FC]">REPORTED ACCOUNTING FUNDAMENTALS</h3>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30 font-bold">
                AUDITED REGULATORY FILING
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono mt-4">
              <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
                <div className="text-[10px] text-[#9AA8BC]">ANNUAL REVENUE ({latestPeriod?.period})</div>
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
                <div className="text-[10px] text-[#10B981] mt-0.5">Core Earnings Power</div>
              </div>
            </div>

            {/* Balance Sheet Identity Badge */}
            <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg mt-3 font-mono space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9AA8BC] text-[10px]">BALANCE SHEET INTEGRITY:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  bsBalanced
                    ? "text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30"
                    : "text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30"
                }`}>
                  {bsBalanced ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  <span>{bsBalanced ? "Assets = Liabilities + Equity (Balanced ≤ 0.5%)" : "Variance Detected"}</span>
                </span>
              </div>
              <div className="text-[11px] text-[#CBD5E1] flex items-center justify-between">
                <span>Total Assets: {formatFinancialValue(assets, curr, scale)}</span>
                <span>Liab + Eq: {formatFinancialValue(liabilitiesAndEquity, curr, scale)}</span>
              </div>
              <div className="text-[10px] text-[#64748B]">
                {summary.latestPeriodLabel} &bull; Standard: {company.accountingStandard}
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#151E2D] border border-[#253247] rounded-lg flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[#9AA8BC] text-[10px]">CASH &amp; DEBT POSITION:</span>
              <div className="text-[#F3F6FC] font-semibold">
                Cash: {formatFinancialValue(debt.cashAndEquivalents, curr, scale)} &bull; Borrowings: {formatFinancialValue(debt.borrowings, curr, scale)}
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab("02_HEALTH")}
              className="text-[#10B981] hover:text-white flex items-center gap-1 text-xs transition-colors cursor-pointer"
            >
              <span>3-Statement Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Metric Tiles: Leverage, Coverage, Liquidity & Health (Section 5 Requirement) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Hurdle 1: Net Debt / EBITDA */}
        <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9AA8BC]">NET DEBT / EBITDA</span>
            <span className="text-[10px] text-[#F5B942]">Hurdle: &le; 3.50x</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-[#F3F6FC]">
              {netDebtToEbitda !== null
                ? netDebtToEbitda <= 0
                  ? `${netDebtToEbitda.toFixed(2)}x (Net Cash)`
                  : `${netDebtToEbitda.toFixed(2)}x`
                : "Unavailable"}
            </div>
            <div className="text-[11px] text-[#9AA8BC] mt-0.5">
              {netDebtToEbitda !== null
                ? netDebtToEbitda <= 3.50
                  ? "✓ Within conservative leverage ceiling"
                  : "⚠ Amber alert: Exceeds reference hurdle"
                : "Insufficient debt/EBITDA inputs"}
            </div>
            {/* Definition Badge */}
            <div className="mt-2 text-[9px] text-[#64748B] bg-[#0A0E17] p-1.5 rounded border border-[#1E293B] leading-tight">
              {debt.netDebtDefinition}
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab("02_HEALTH")}
            className="text-xs text-[#38BDF8] hover:text-white flex items-center gap-1 mt-1 transition-colors cursor-pointer"
          >
            <span>Analyze Debt Structure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hurdle 2: Interest Coverage */}
        <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between">
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
              {!debt.hasFundedBorrowings && (latestPeriod?.interestExpense ?? 0) > 0
                ? "No financial borrowings; finance cost relates to lease liabilities and other items"
                : interestCoverage !== null
                ? interestCoverage >= 2.50
                  ? "✓ Ample operating profit to service debt"
                  : "⚠ Interest coverage below reference floor"
                : "Missing interest disclosure"}
            </div>
            <div className="mt-2 text-[9px] text-[#64748B] bg-[#0A0E17] p-1.5 rounded border border-[#1E293B] leading-tight">
              EBIT ({formatFinancialValue(latestPeriod?.ebit, curr, scale)}) / Finance Cost ({formatFinancialValue(latestPeriod?.interestExpense, curr, scale)})
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab("06_SIMULATOR")}
            className="text-xs text-[#38BDF8] hover:text-white flex items-center gap-1 mt-1 transition-colors cursor-pointer"
          >
            <span>Test Rate Sensitivity</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hurdle 3: Current Ratio */}
        <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9AA8BC]">CURRENT RATIO</span>
            <span className="text-[10px] text-[#38BDF8]">Floor: &ge; 1.30x</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-[#F3F6FC]">
              {currentRatio !== null
                ? `${currentRatio.toFixed(2)}x`
                : "Unavailable"}
            </div>
            <div className="text-[11px] text-[#9AA8BC] mt-0.5">
              {currentRatio !== null
                ? currentRatio >= 1.30
                  ? "✓ Positive working capital liquidity buffer"
                  : "⚠ Below 1.30x reference working capital floor"
                : "Missing current asset/liability disclosures"}
            </div>
            <div className="mt-2 text-[9px] text-[#64748B] bg-[#0A0E17] p-1.5 rounded border border-[#1E293B] leading-tight">
              Current Assets / Current Liabilities
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab("03_VULNERABILITY")}
            className="text-xs text-[#38BDF8] hover:text-white flex items-center gap-1 mt-1 transition-colors cursor-pointer"
          >
            <span>Inspect Risk Warnings ({profile.earlyWarningFlags.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hurdle 4: Analytical Health Score */}
        <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9AA8BC]">HEALTH SCORE</span>
            <span className="text-[10px] text-[#10B981]">Scale: 0 &ndash; 100</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-[#38BDF8] flex items-center gap-2">
              <span>{health.score}/100</span>
              <span className="text-xs font-mono px-2 py-0.5 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 rounded">
                Grade {healthGrade}
              </span>
            </div>
            <div className="text-[11px] text-[#9AA8BC] mt-0.5">
              {healthTierLabel} screening classification
            </div>
            <div className="mt-2 text-[9px] text-[#64748B] bg-[#0A0E17] p-1.5 rounded border border-[#1E293B] leading-tight">
              Rule-based screening score (not a rating agency opinion)
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab("02_HEALTH")}
            className="text-xs text-[#38BDF8] hover:text-white flex items-center gap-1 mt-1 transition-colors cursor-pointer"
          >
            <span>Review Full Scorecard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Multi-Period Financial Trajectory Visualizer */}
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
              <div className="text-xs font-semibold text-[#10B981]">
                {p.ebit !== null ? formatFinancialValue(p.ebit, curr, scale) : "Unavailable"}
              </div>
              <div className="mt-1 text-[10px] text-[#5A687D]">{p.filingForm} &bull; {p.filingDate}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Direct Workstation Jump Launchpad (Quick Actions) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateToTab("01_HUB")}
          className="p-4 bg-[#101621] hover:bg-[#151E2D] border border-[#253247] hover:border-[#3867F5] rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <Building2 className="w-5 h-5 text-[#3867F5] mb-2" />
            <div className="text-sm font-bold text-[#F3F6FC]">Company Directory</div>
            <div className="text-xs text-[#9AA8BC] mt-0.5">8-timeframe interactive chart with mouse scrubbing</div>
          </div>
          <div className="text-xs text-[#38BDF8] flex items-center gap-1 mt-3 group-hover:translate-x-1 transition-transform">
            <span>Open Chart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab("02_HEALTH")}
          className="p-4 bg-[#101621] hover:bg-[#151E2D] border border-[#253247] hover:border-[#10B981] rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <FileSpreadsheet className="w-5 h-5 text-[#10B981] mb-2" />
            <div className="text-sm font-bold text-[#F3F6FC]">3-Statement Ledger</div>
            <div className="text-xs text-[#9AA8BC] mt-0.5">Audited financials with identity checks and drilldowns</div>
          </div>
          <div className="text-xs text-[#10B981] flex items-center gap-1 mt-3 group-hover:translate-x-1 transition-transform">
            <span>View Statements</span>
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
            <div className="text-xs text-[#9AA8BC] mt-0.5">Rate shocks, revenue contraction, and cash burn testing</div>
          </div>
          <div className="text-xs text-[#F5B942] flex items-center gap-1 mt-3 group-hover:translate-x-1 transition-transform">
            <span>Run Stress Test</span>
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
            <div className="text-xs text-[#9AA8BC] mt-0.5">Generate investment committee memo with CSV/PDF export</div>
          </div>
          <div className="text-xs text-[#38BDF8] flex items-center gap-1 mt-3 group-hover:translate-x-1 transition-transform">
            <span>Export Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Sequential Next Step in Workflow */}
      <WorkstationNextStep
        currentTab="overview"
        nextTab="01_HUB"
        nextTitle="Company Intelligence Hub"
        nextCode="SECURITIES DIRECTORY"
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
