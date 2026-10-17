"use client";

import React, { useState, useEffect } from "react";
import { Search, Globe2, ArrowRight, Loader2, Database, BarChart3 } from "lucide-react";
import { CompanyEntity, CompanyRiskProfile } from "@/lib/types";
import { ModuleTab } from "./NavigationTabs";
import { VisualAnalyticsDashboard } from "./VisualAnalyticsDashboard";
import { CompanyChartModal } from "./CompanyChartModal";
import { NormalizedMarketQuote } from "@/app/api/market/quote/[ticker]/route";
import { NormalizedMarketSearchItem } from "@/app/api/market/search/route";
import { GrowwStockChart } from "./GrowwStockChart";

interface CompanyHubProps {
  companies: CompanyEntity[];
  activeProfile: CompanyRiskProfile | null;
  onSelectCompany: (companyId: string) => void;
  onNavigateToTab: (tabId: ModuleTab) => void;
  onRefreshMaster: () => void;
  isLoading: boolean;
}

export function CompanyHub({
  companies,
  activeProfile,
  onSelectCompany,
  onNavigateToTab,
  onRefreshMaster,
  isLoading,
}: CompanyHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [liveSearchResults, setLiveSearchResults] = useState<NormalizedMarketSearchItem[]>([]);
  const [isSearchingMarket, setIsSearchingMarket] = useState(false);
  const [quote, setQuote] = useState<NormalizedMarketQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  const selected = activeProfile?.company;

  // Live market quote fetch whenever selected ticker changes
  useEffect(() => {
    if (!selected?.symbol) return;
    let isCancelled = false;
    setIsQuoteLoading(true);

    fetch(`/api/market/quote/${encodeURIComponent(selected.symbol)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!isCancelled && json.success && json.data) {
          setQuote(json.data);
        }
      })
      .catch((e) => console.warn("Quote fetch error:", e))
      .finally(() => {
        if (!isCancelled) setIsQuoteLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selected?.symbol]);

  // Debounced omnichannel global search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setLiveSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMarket(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setLiveSearchResults(json.data);
        }
      } catch (e) {
        console.warn("Market search error:", e);
      } finally {
        setIsSearchingMarket(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);



  const filteredLocal = companies.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.symbol.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.exchange.toLowerCase().includes(q)
    );
  });

  // Calculate 52-week price position ratio (0 to 1)
  const rangeRatio = quote
    ? Math.max(
        0,
        Math.min(
          1,
          (quote.regularMarketPrice - quote.fiftyTwoWeekLow) /
            (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow || 1)
        )
      )
    : 0.5;

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Omnibar Global Market Search - Full Width & Clean */}
      <div className="p-3 bg-[#0E131A] border border-[#1E2536] rounded-sm">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A687D]">
            {isSearchingMarket ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
            ) : (
              <Search className="w-4 h-4 text-[#38BDF8]" />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search & resolve any global equity or ticker (e.g. NVDA, AAPL, RELIANCE.NS, TCS.NS, 7203.T, MSFT)..."
            className="w-full pl-10 pr-28 py-2.5 bg-[#070A0F] border border-[#182337] text-xs font-mono text-[#FFFFFF] placeholder-[#5A687D] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] rounded-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-24 flex items-center px-2 text-[#5A687D] hover:text-[#E1E7EC] text-[10px] font-bold"
            >
              CLEAR
            </button>
          )}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-[10px] px-2 py-0.5 bg-[#0F1626] border border-[#182337] text-[#38BDF8] font-semibold rounded">
              GLOBAL SEARCH
            </span>
          </div>
        </div>
      </div>

      {/* Featured Institutional Coverage Quick Selection */}
      <div className="p-3 bg-[#090D17] border border-[#182337] rounded-sm space-y-2">
        <div className="flex items-center justify-between text-[10px] text-[#5A687D]">
          <span className="font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#38BDF8]" />
            FEATURED INSTITUTIONAL COVERAGE // AUDITED REGISTRY
          </span>
          <span className="hidden sm:inline">Click any ticker to inspect distinct audited multi-year statements</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { symbol: "HAL.NS", name: "HAL (Defence)", flag: "🇮🇳" },
            { symbol: "TCS.NS", name: "TCS (Tech)", flag: "🇮🇳" },
            { symbol: "TATASTEEL.NS", name: "Tata Steel", flag: "🇮🇳" },
            { symbol: "RELIANCE.NS", name: "Reliance Ind", flag: "🇮🇳" },
            { symbol: "INFY.NS", name: "Infosys", flag: "🇮🇳" },
            { symbol: "HDFCBANK.NS", name: "HDFC Bank", flag: "🇮🇳" },
            { symbol: "NVDA", name: "NVIDIA", flag: "🇺🇸" },
            { symbol: "MSFT", name: "Microsoft", flag: "🇺🇸" },
            { symbol: "AAPL", name: "Apple", flag: "🇺🇸" },
            { symbol: "GOOGL", name: "Alphabet", flag: "🇺🇸" },
            { symbol: "AMZN", name: "Amazon", flag: "🇺🇸" },
            { symbol: "TSLA", name: "Tesla", flag: "🇺🇸" },
            { symbol: "7203.T", name: "Toyota", flag: "🇯🇵" },
          ].map((item) => {
            const isCurrent = selected?.symbol === item.symbol;
            return (
              <button
                key={item.symbol}
                onClick={() => onSelectCompany(item.symbol)}
                className={`px-2 py-1 border text-[11px] font-mono transition-all flex items-center gap-1.5 rounded-sm ${
                  isCurrent
                    ? "bg-[#2563EB] text-white border-[#38BDF8] font-bold shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                    : "bg-[#070A0F] hover:bg-[#0F1626] text-[#FFFFFF] border-[#182337] hover:border-[#38BDF8]"
                }`}
              >
                <span>{item.flag}</span>
                <span className={isCurrent ? "text-white font-bold" : "text-[#38BDF8] font-semibold"}>
                  {item.symbol}
                </span>
                <span className={isCurrent ? "text-[#CBD5E1] text-[10px]" : "text-[#64748B] text-[10px]"}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Live Omnichannel Search Dropdown Results */}
      {liveSearchResults.length > 0 && searchQuery.trim().length >= 2 && (
        <div className="border border-[#2563EB]/50 bg-[#090D17] p-3 space-y-2 shadow-2xl animate-in fade-in duration-150 rounded-xl">
          <div className="flex items-center justify-between text-[10px] text-[#38BDF8] uppercase font-bold border-b border-[#182337] pb-1">
            <span>LIVE GLOBAL RESOLUTIONS FOR &quot;{searchQuery}&quot;</span>
            <span>CLICK TO INGEST DIRECTLY INTO SQLITE MASTER</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {liveSearchResults.map((item) => (
                <div
                  key={item.symbol}
                  onClick={() => onSelectCompany(item.symbol)}
                  className="p-2.5 bg-[#0D131F] border border-[#182337] hover:border-[#38BDF8] flex items-center justify-between transition-colors cursor-pointer group rounded"
                >
                  <div className="truncate mr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#38BDF8] group-hover:text-white">{item.symbol}</span>
                      <span className="text-[9px] px-1 bg-[#070A0F] border border-[#182337] text-[#94A3B8]">
                        {item.country}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-[#FFFFFF] truncate">{item.name}</div>
                    <div className="text-[9.5px] text-[#64748B]">{item.exchange}</div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCompany(item.symbol);
                    }}
                    className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[10px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap rounded"
                  >
                    <span>ANALYZE</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Selected Entity Institutional Banner & Real-Time Market HUD */}
      {selected && (
        <div className="bg-[#090D17] border border-[#182337] p-4 relative overflow-hidden space-y-4 rounded-xl shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/10 blur-3xl pointer-events-none"></div>

          {/* Top Identity Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl font-bold font-mono tracking-wider text-[#FFFFFF] flex items-center gap-2">
                  {selected.name}
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#38BDF8]" />}
                </span>
                <span className="px-2 py-0.5 bg-[#070A0F] border border-[#38BDF8] text-[#38BDF8] text-xs font-mono font-bold">
                  {selected.symbol}
                </span>
                <span className="px-2 py-0.5 bg-[#070A0F] border border-[#182337] text-[#94A3B8] text-[11px] font-mono">
                  {selected.exchange}
                </span>
                <span className="px-2 py-0.5 bg-[#070A0F] border border-[#182337] text-[#94A3B8] text-[11px] font-mono">
                  {selected.accountingStandard}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-[#64748B] flex-wrap">
                <span>SECTOR: <span className="text-[#CBD5E1]">{selected.sector}</span></span>
                <span>&bull;</span>
                <span>INDUSTRY: <span className="text-[#CBD5E1]">{selected.industry}</span></span>
                <span>&bull;</span>
                <span>CIK / CODE: <span className="text-[#38BDF8]">{selected.cik || selected.symbol}</span></span>
                <span>&bull;</span>
                <span>ISIN: <span className="text-[#CBD5E1]">{selected.isin || "N/D"}</span></span>
              </div>
            </div>

            {/* As-Reported Currency & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="p-2.5 bg-[#070A0F] border border-[#182337] font-mono text-xs rounded">
                <div className="text-[10px] text-[#64748B] uppercase">NATIVE REPORTING CURRENCY</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-base text-[#38BDF8]">
                    {selected.currency} ({selected.scaleUnit})
                  </span>
                  <span className="text-[10px] text-[#10B981] border border-[#10B981]/30 px-1 py-0.2">
                    AS-REPORTED
                  </span>
                </div>
                <div className="text-[10px] text-[#64748B] mt-1">
                  AUDITED FX REF: <span className="text-[#94A3B8]">{selected.fxTimestamp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsChartModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-3 bg-[#0F1626] hover:bg-[#182337] border border-[#38BDF8]/50 text-[#38BDF8] font-mono font-bold text-xs transition-colors rounded shadow-sm cursor-pointer"
                  title="Open Power BI Deep Interactive Chart Explorer"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>DEEP CHARTS</span>
                </button>

                <button
                  onClick={() => onNavigateToTab("02_STATEMENTS")}
                  className="flex items-center gap-2 px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-mono font-bold text-xs transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] rounded cursor-pointer"
                >
                  <span>STATEMENTS LEDGER</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Real-Time Market HUD & Stock Price Line Chart */}
          {quote && (
            <div className="pt-3 border-t border-[#1E293B] space-y-3 bg-[#070B12] p-3.5 border border-[#1E293B] rounded-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Live Ticking Price */}
                <div className="space-y-1">
                  <span className="text-[9.5px] text-[#64748B] uppercase flex items-center gap-1.5">
                    REAL-TIME MARKET PRICE
                    {isQuoteLoading && <Loader2 className="w-2.5 h-2.5 animate-spin text-[#38BDF8]" />}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono-numbers text-[#F8FAFC]">
                      {quote.currencySymbol}{quote.regularMarketPrice.toLocaleString()}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold font-mono-numbers flex items-center border ${
                        quote.change >= 0
                          ? "border-[#10B981] bg-[#10B981]/10 text-[#10B981]"
                          : "border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]"
                      }`}
                    >
                      {quote.change >= 0 ? "+" : ""}
                      {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* Day High / Low */}
                <div className="space-y-1">
                  <span className="text-[9.5px] text-[#64748B] uppercase">DAY SESSION RANGE</span>
                  <div className="flex justify-between items-baseline font-mono-numbers text-xs pt-1">
                    <span className="text-[#CBD5E1]">{quote.currencySymbol}{quote.dayLow.toLocaleString()}</span>
                    <span className="text-[#64748B] text-[9.5px]">TO</span>
                    <span className="text-[#CBD5E1]">{quote.currencySymbol}{quote.dayHigh.toLocaleString()}</span>
                  </div>
                </div>

                {/* 52-Week Range Bar with How this is calculated */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9.5px] text-[#64748B] uppercase">
                    <span>52-WK LOW</span>
                    <span className="flex items-center gap-1">
                      <span>POSITION</span>
                      <span
                        className="text-[8px] px-1 py-0.2 bg-[#101A2E] text-[#38BDF8] rounded cursor-help font-bold"
                        title="Formula: (Price - 52W Low) / (52W High - 52W Low) * 100%"
                      >
                        CALC ?
                      </span>
                    </span>
                    <span>52-WK HIGH</span>
                  </div>
                  <div className="w-full bg-[#05070B] h-2 border border-[#1E293B] relative overflow-hidden mt-1">
                    <div
                      className="h-full bg-[#2563EB] transition-all duration-300"
                      style={{ width: `${rangeRatio * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono-numbers text-[#64748B]">
                    <span>{quote.currencySymbol}{quote.fiftyTwoWeekLow.toFixed(0)}</span>
                    <span className="text-[#38BDF8] font-bold">{(rangeRatio * 100).toFixed(0)}%</span>
                    <span>{quote.currencySymbol}{quote.fiftyTwoWeekHigh.toFixed(0)}</span>
                  </div>
                </div>

                {/* SQLite Cache Attestation */}
                <div className="space-y-1 sm:text-right">
                  <span className="text-[9.5px] text-[#5A687D] uppercase">SQLITE PERSISTENCE</span>
                  <div className="flex items-center sm:justify-end gap-1.5 pt-1 text-[#10B981] font-bold text-xs">
                    <Database className="w-3.5 h-3.5" />
                    <span>COMMITTED TO WAL</span>
                  </div>
                  <div className="text-[9px] text-[#5A687D]">TIMESTAMP: {quote.timestamp.substring(11, 19)} UTC</div>
                </div>
              </div>

              {/* Real Groww-Style Stock Chart with 8 Timeframes & Month Scrubbing */}
              <GrowwStockChart quote={quote} companyName={selected.name} />
            </div>
          )}

          {/* Institutional Credit Vitals & Quick Health Cockpit */}
          {activeProfile && (
            <div className="pt-3 border-t border-[#1E2536] space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-[#94A3B8] font-bold uppercase">INSTITUTIONAL RISK PROFILE:</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                      activeProfile.riskTier === "TIER_1_STABLE"
                        ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/40"
                        : activeProfile.riskTier === "TIER_2_WATCHLIST"
                        ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/40"
                        : "bg-[#F43F5E]/10 text-[#F43F5E] border-[#F43F5E]/40"
                    }`}
                  >
                    {activeProfile.riskTier === "TIER_1_STABLE" ? "STABLE" : activeProfile.riskTier === "TIER_2_WATCHLIST" ? "WATCHLIST" : "CRITICAL"} &bull; COMPOSITE SCORE: {activeProfile.riskScore}/100
                  </span>
                  <span
                    className="text-[9px] text-[#64748B] hover:text-[#38BDF8] cursor-help underline decoration-dotted"
                    title="How Score is Calculated: Weighted composite of Net Debt/EBITDA (30%), Interest Coverage (25%), Current Ratio (20%), and Operating Margin (25%)."
                  >
                    [HOW CALCULATED]
                  </span>
                </div>
                <div className="text-[10px] text-[#64748B]">
                  EARLY WARNING TRIGGERS: <span className="font-bold text-[#F8FAFC]">{activeProfile.earlyWarningFlags.length}</span>
                </div>
              </div>

              {/* 4 Core Financial Vitals */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-[#05070B] border border-[#1E293B] rounded relative group">
                  <div className="flex items-center justify-between text-[9.5px] text-[#64748B] uppercase">
                    <span>NET DEBT / EBITDA</span>
                    <span
                      className="text-[8px] text-[#38BDF8] cursor-help"
                      title="Formula: (Total Debt - Cash & Cash Equivalents) / Operating EBITDA"
                    >
                      CALC ?
                    </span>
                  </div>
                  <div className="text-base font-bold font-mono text-[#F8FAFC] mt-0.5">
                    {activeProfile.latestRatios.netDebtToEbitda !== null ? `${activeProfile.latestRatios.netDebtToEbitda.toFixed(2)}x` : "N/D"}
                  </div>
                  <div className="text-[9px] text-[#94A3B8]">Hurdle: &le; 3.50x</div>
                </div>

                <div className="p-2.5 bg-[#05070B] border border-[#1E293B] rounded relative group">
                  <div className="flex items-center justify-between text-[9.5px] text-[#64748B] uppercase">
                    <span>INTEREST COVERAGE</span>
                    <span
                      className="text-[8px] text-[#38BDF8] cursor-help"
                      title="Formula: Operating EBIT / Gross Interest Expense"
                    >
                      CALC ?
                    </span>
                  </div>
                  <div className="text-base font-bold font-mono text-[#F8FAFC] mt-0.5">
                    {activeProfile.latestRatios.interestCoverage !== null ? `${activeProfile.latestRatios.interestCoverage.toFixed(2)}x` : "N/D"}
                  </div>
                  <div className="text-[9px] text-[#94A3B8]">Covenant: &ge; 2.50x</div>
                </div>

                <div className="p-2.5 bg-[#05070B] border border-[#1E293B] rounded relative group">
                  <div className="flex items-center justify-between text-[9.5px] text-[#64748B] uppercase">
                    <span>CURRENT LIQUIDITY</span>
                    <span
                      className="text-[8px] text-[#38BDF8] cursor-help"
                      title="Formula: Total Current Assets / Total Current Liabilities"
                    >
                      CALC ?
                    </span>
                  </div>
                  <div className="text-base font-bold font-mono text-[#F8FAFC] mt-0.5">
                    {activeProfile.latestRatios.currentRatio !== null ? `${activeProfile.latestRatios.currentRatio.toFixed(2)}x` : "N/D"}
                  </div>
                  <div className="text-[9px] text-[#94A3B8]">Benchmark: &ge; 1.10x</div>
                </div>

                <div className="p-2.5 bg-[#05070B] border border-[#1E293B] rounded relative group">
                  <div className="flex items-center justify-between text-[9.5px] text-[#64748B] uppercase">
                    <span>OPERATING MARGIN</span>
                    <span
                      className="text-[8px] text-[#38BDF8] cursor-help"
                      title="Formula: (Operating EBIT / Total Gross Revenue) * 100%"
                    >
                      CALC ?
                    </span>
                  </div>
                  <div className="text-base font-bold font-mono text-[#F8FAFC] mt-0.5">
                    {activeProfile.latestRatios.operatingMarginPct !== null ? `${activeProfile.latestRatios.operatingMarginPct.toFixed(1)}%` : "N/D"}
                  </div>
                  <div className="text-[9px] text-[#94A3B8]">Gross: {activeProfile.latestRatios.grossMarginPct !== null ? `${activeProfile.latestRatios.grossMarginPct.toFixed(1)}%` : "N/D"}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Analytics Dashboard with Interactive Graphs & 2026 Projections */}
      {activeProfile && (
        <VisualAnalyticsDashboard profile={activeProfile} />
      )}

      {/* Global Security Master Table */}
      <div className="border border-[#1E293B] bg-[#05070B] overflow-hidden rounded-xl">
        <div className="p-3 bg-[#090E17] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#38BDF8]" />
            <span className="font-mono text-xs font-bold text-[#F8FAFC] tracking-wider uppercase">
              GLOBAL MULTI-CURRENCY SECURITY MASTER // CROSS-BORDER REGISTER
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[#64748B]">
              REGISTERED ENTITIES: {filteredLocal.length}
            </span>
            <button
              onClick={onRefreshMaster}
              className="px-2 py-0.5 bg-[#0E1524] hover:bg-[#1E293B] border border-[#1E293B] text-[10px] text-[#38BDF8] rounded transition-colors"
              title="Sync SQLite Security Master"
            >
              SYNC
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0B111E] text-[#64748B] text-[11px]">
                <th className="py-2.5 px-3 text-left">SYMBOL / CODE</th>
                <th className="py-2.5 px-3 text-left">ENTITY NAME</th>
                <th className="py-2.5 px-3 text-left">EXCHANGE</th>
                <th className="py-2.5 px-3 text-left">REGIME</th>
                <th className="py-2.5 px-3 text-left">CURRENCY &amp; SCALE</th>
                <th className="py-2.5 px-3 text-left">ISIN / CIK</th>
                <th className="py-2.5 px-3 text-right">FX TO USD</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/50">
              {filteredLocal.map((c) => {
                const isSelected = selected?.id === c.id;
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCompany(c.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#101A2E] hover:bg-[#13223D]"
                        : "hover:bg-[#0B111E]"
                    }`}
                  >
                    <td className="py-3 px-3 text-left font-bold text-[#38BDF8]">
                      <div className="flex items-center gap-1.5">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></span>}
                        <span>{c.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-left text-[#F8FAFC]">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-[#64748B]">{c.sector}</div>
                    </td>
                    <td className="py-3 px-3 text-left text-[#94A3B8]">{c.exchange}</td>
                    <td className="py-3 px-3 text-left text-[#94A3B8]">{c.accountingStandard}</td>
                    <td className="py-3 px-3 text-left">
                      <span className="font-semibold text-[#F8FAFC]">{c.currency}</span>{" "}
                      <span className="text-[#64748B] text-[10px]">({c.scaleUnit})</span>
                    </td>
                    <td className="py-3 px-3 text-left text-[#64748B]">
                      <div>ISIN: {c.isin || "N/D"}</div>
                      <div>CIK: {c.cik || "N/D"}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-[#94A3B8]">
                      {c.fxRateToUsd.toFixed(5)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCompany(c.id);
                            setIsChartModalOpen(true);
                          }}
                          className="px-2 py-1 bg-[#101A2E] hover:bg-[#1E293B] border border-[#2563EB]/40 text-[10px] text-[#38BDF8] font-bold rounded transition-colors flex items-center gap-1 cursor-pointer"
                          title="View Power BI interactive charts"
                        >
                          <BarChart3 className="w-3 h-3" />
                          <span>CHART</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCompany(c.id);
                            onNavigateToTab("02_STATEMENTS");
                          }}
                          className="px-2 py-1 bg-[#090E17] hover:bg-[#101A2E] border border-[#1E293B] hover:border-[#38BDF8] text-[10px] text-[#94A3B8] hover:text-[#F8FAFC] font-bold transition-colors rounded cursor-pointer"
                        >
                          LEDGER
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLocal.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#5A687D]">
                    No securities resolved for query &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sequential Next Step Recommendation Card */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-[#38BDF8]/30 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#38BDF8] font-bold">
            RECOMMENDED WORKFLOW STEP 2 OF 6
          </div>
          <div className="text-sm font-bold text-white mt-1">
            Next: Assess Financial Health, Statements & Solvency
          </div>
          <div className="text-xs text-[#94A3B8] mt-0.5">
            Review the 3-statement accounting ledger, XBRL line items, working capital, and credit solvency ratios for {selected?.name || "the selected issuer"}.
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab("02_HEALTH")}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded transition-colors shadow-lg shadow-[#2563EB]/30 shrink-0"
        >
          <span>Assess Financial Health (Module 2)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Power BI Deep Interactive Chart Inspector Modal */}
      <CompanyChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        company={selected || null}
        profile={activeProfile}
      />
    </div>
  );
}
