"use client";

import React, { useState, useEffect } from "react";
import { Search, Globe2, ArrowRight, Loader2, Database, PlusCircle } from "lucide-react";
import { CompanyEntity, CompanyRiskProfile } from "@/lib/types";
import { ModuleTab } from "./NavigationTabs";
import { NormalizedMarketQuote } from "@/app/api/market/quote/[ticker]/route";
import { NormalizedMarketSearchItem } from "@/app/api/market/search/route";

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
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);

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

  // Ingest new entity into local SQLite
  const handleIngestEntity = async (item: NormalizedMarketSearchItem) => {
    setIngestStatus("INGESTING...");
    try {
      const res = await fetch("/api/companies/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: item.symbol,
          name: item.name,
          exchange: item.exchange,
          country: item.country,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIngestStatus("INGESTED!");
        onRefreshMaster();
        onSelectCompany(item.symbol);
        setTimeout(() => setIngestStatus(null), 2000);
      } else {
        setIngestStatus("FAILED");
      }
    } catch (e) {
      console.error("Ingest error:", e);
      setIngestStatus("FAILED");
    }
  };

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
      {/* Omnibar Global Market Search */}
      <div className="p-3 bg-[#0E131A] border border-[#1E2638] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5A687D]">
            {isSearchingMarket ? <Loader2 className="w-4 h-4 animate-spin text-[#C5A880]" /> : <Search className="w-4 h-4" />}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Resolve any global ticker (NVDA, TSLA, TCS.NS, HDFCBANK.NS, 7203.T, ASML)..."
            className="w-full pl-9 pr-4 py-2 bg-[#07090E] border border-[#232B3A] text-xs font-mono text-[#E1E7EC] placeholder-[#5A687D] focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]"
          />
        </div>

        {/* Quick Institutional Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          <span className="text-[10px] text-[#5A687D] uppercase mr-1 whitespace-nowrap">QUICK RESOLVE:</span>
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCompany(c.id)}
              className={`px-2 py-1 border text-[11px] whitespace-nowrap transition-colors ${
                selected?.id === c.id
                  ? "bg-[#181F2B] border-[#C5A880] text-[#C5A880] font-bold"
                  : "bg-[#07090E] border-[#1E2638] text-[#9BA8B8] hover:text-[#E1E7EC] hover:border-[#232B3A]"
              }`}
            >
              {c.symbol} ({c.country})
            </button>
          ))}
        </div>
      </div>

      {/* Global Live Omnichannel Search Dropdown Results */}
      {liveSearchResults.length > 0 && searchQuery.trim().length >= 2 && (
        <div className="border border-[#C5A880]/50 bg-[#0A0D12] p-3 space-y-2 shadow-2xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px] text-[#C5A880] uppercase font-bold border-b border-[#1E2638] pb-1">
            <span>LIVE GLOBAL RESOLUTIONS FOR &quot;{searchQuery}&quot;</span>
            <span>CLICK TO INGEST DIRECTLY INTO SQLITE MASTER</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {liveSearchResults.map((item) => {
              const isAlreadyInDb = companies.some((c) => c.symbol === item.symbol);
              return (
                <div
                  key={item.symbol}
                  className="p-2.5 bg-[#12161F] border border-[#232B3A] hover:border-[#C5A880] flex items-center justify-between transition-colors"
                >
                  <div className="truncate mr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#C5A880]">{item.symbol}</span>
                      <span className="text-[9px] px-1 bg-[#07090E] border border-[#1E2638] text-[#9BA8B8]">
                        {item.country}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-[#E1E7EC] truncate">{item.name}</div>
                    <div className="text-[9.5px] text-[#5A687D]">{item.exchange}</div>
                  </div>

                  {isAlreadyInDb ? (
                    <button
                      onClick={() => onSelectCompany(item.symbol)}
                      className="px-2 py-1 bg-[#07090E] border border-[#10B981] text-[#10B981] text-[10px] font-bold hover:bg-[#10B981] hover:text-[#07090E] transition-colors whitespace-nowrap"
                    >
                      VIEW
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {ingestStatus && <span className="text-[9px] text-[#C5A880]">{ingestStatus}</span>}
                      <button
                        onClick={() => handleIngestEntity(item)}
                        className="px-2 py-1 bg-[#C5A880] hover:bg-[#F3E5AB] text-[#07090E] text-[10px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>INGEST</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Entity Institutional Banner & Real-Time Market HUD */}
      {selected && (
        <div className="bg-[#12161F] border border-[#232B3A] p-4 relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/5 blur-3xl pointer-events-none"></div>

          {/* Top Identity Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl font-bold font-mono tracking-wider text-[#E1E7EC] flex items-center gap-2">
                  {selected.name}
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A880]" />}
                </span>
                <span className="px-2 py-0.5 bg-[#07090E] border border-[#C5A880] text-[#C5A880] text-xs font-mono font-bold">
                  {selected.symbol}
                </span>
                <span className="px-2 py-0.5 bg-[#07090E] border border-[#1E2638] text-[#9BA8B8] text-[11px] font-mono">
                  {selected.exchange}
                </span>
                <span className="px-2 py-0.5 bg-[#07090E] border border-[#1E2638] text-[#9BA8B8] text-[11px] font-mono">
                  {selected.accountingStandard}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-[#5A687D] flex-wrap">
                <span>SECTOR: <span className="text-[#9BA8B8]">{selected.sector}</span></span>
                <span>&bull;</span>
                <span>INDUSTRY: <span className="text-[#9BA8B8]">{selected.industry}</span></span>
                <span>&bull;</span>
                <span>CIK / CODE: <span className="text-[#C5A880]">{selected.cik || selected.symbol}</span></span>
                <span>&bull;</span>
                <span>ISIN: <span className="text-[#9BA8B8]">{selected.isin || "N/D"}</span></span>
              </div>
            </div>

            {/* As-Reported Currency & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="p-2.5 bg-[#07090E] border border-[#1E2638] font-mono text-xs">
                <div className="text-[10px] text-[#5A687D] uppercase">NATIVE REPORTING CURRENCY</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-base text-[#C5A880]">
                    {selected.currency} ({selected.scaleUnit})
                  </span>
                  <span className="text-[10px] text-[#10B981] border border-[#10B981]/30 px-1 py-0.2">
                    AS-REPORTED
                  </span>
                </div>
                <div className="text-[10px] text-[#5A687D] mt-1">
                  AUDITED FX REF: <span className="text-[#9BA8B8]">{selected.fxTimestamp}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab("02_STATEMENTS")}
                className="flex items-center gap-2 px-4 py-3 bg-[#C5A880] hover:bg-[#F3E5AB] text-[#07090E] font-mono font-bold text-xs transition-colors shadow-[0_0_12px_rgba(212,175,55,0.25)]"
              >
                <span>OPEN STATEMENTS LEDGER</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-Time Market HUD */}
          {quote && (
            <div className="pt-3 border-t border-[#1E2638] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0A0D12] p-3 border border-[#1E2638]">
              {/* Live Ticking Price */}
              <div className="space-y-1">
                <span className="text-[9.5px] text-[#5A687D] uppercase flex items-center gap-1.5">
                  REAL-TIME MARKET PRICE
                  {isQuoteLoading && <Loader2 className="w-2.5 h-2.5 animate-spin text-[#C5A880]" />}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono-numbers text-[#E1E7EC]">
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
                <span className="text-[9.5px] text-[#5A687D] uppercase">DAY SESSION RANGE</span>
                <div className="flex justify-between items-baseline font-mono-numbers text-xs pt-1">
                  <span className="text-[#9BA8B8]">{quote.currencySymbol}{quote.dayLow.toLocaleString()}</span>
                  <span className="text-[#5A687D] text-[9.5px]">TO</span>
                  <span className="text-[#9BA8B8]">{quote.currencySymbol}{quote.dayHigh.toLocaleString()}</span>
                </div>
              </div>

              {/* 52-Week Range Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9.5px] text-[#5A687D] uppercase">
                  <span>52-WK LOW</span>
                  <span>POSITION</span>
                  <span>52-WK HIGH</span>
                </div>
                <div className="w-full bg-[#12161F] h-2 border border-[#1E2638] relative overflow-hidden mt-1">
                  <div
                    className="h-full bg-[#C5A880] transition-all duration-300"
                    style={{ width: `${rangeRatio * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] font-mono-numbers text-[#5A687D]">
                  <span>{quote.currencySymbol}{quote.fiftyTwoWeekLow.toFixed(0)}</span>
                  <span className="text-[#C5A880] font-bold">{(rangeRatio * 100).toFixed(0)}%</span>
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
          )}
        </div>
      )}

      {/* Global Security Master Table */}
      <div className="border border-[#1E2638] bg-[#07090E] overflow-hidden">
        <div className="p-3 bg-[#0A0D12] border-b border-[#1E2638] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#C5A880]" />
            <span className="font-mono text-xs font-bold text-[#E1E7EC] tracking-wider uppercase">
              GLOBAL MULTI-CURRENCY SECURITY MASTER // CROSS-BORDER REGISTER
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#5A687D]">
            REGISTERED ENTITIES: {filteredLocal.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2638] bg-[#0E131A] text-[#5A687D] text-[11px]">
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
            <tbody className="divide-y divide-[#1E2638]/50">
              {filteredLocal.map((c) => {
                const isSelected = selected?.id === c.id;
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCompany(c.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#181F2B]/90 hover:bg-[#181F2B]"
                        : "hover:bg-[#12161F]"
                    }`}
                  >
                    <td className="py-3 px-3 text-left font-bold text-[#C5A880]">
                      <div className="flex items-center gap-1.5">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]"></span>}
                        <span>{c.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-left text-[#E1E7EC]">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-[#5A687D]">{c.sector}</div>
                    </td>
                    <td className="py-3 px-3 text-left text-[#9BA8B8]">{c.exchange}</td>
                    <td className="py-3 px-3 text-left text-[#9BA8B8]">{c.accountingStandard}</td>
                    <td className="py-3 px-3 text-left">
                      <span className="font-semibold text-[#E1E7EC]">{c.currency}</span>{" "}
                      <span className="text-[#5A687D] text-[10px]">({c.scaleUnit})</span>
                    </td>
                    <td className="py-3 px-3 text-left text-[#5A687D]">
                      <div>ISIN: {c.isin || "N/D"}</div>
                      <div>CIK: {c.cik || "N/D"}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-[#9BA8B8]">
                      {c.fxRateToUsd.toFixed(5)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCompany(c.id);
                          onNavigateToTab("02_STATEMENTS");
                        }}
                        className="px-2.5 py-1 bg-[#12161F] hover:bg-[#1E2638] border border-[#232B3A] hover:border-[#C5A880] text-[10px] text-[#C5A880] font-bold transition-colors"
                      >
                        LOAD LEDGER
                      </button>
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
    </div>
  );
}
