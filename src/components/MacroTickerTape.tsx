"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Database,
  Clock,
  Landmark,
  Settings,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type MacroRegion = "IND" | "USA" | "JPN" | "GLOBAL";

interface MacroTickerTapeProps {
  onOpenCommandPalette?: () => void;
  onOpenSettings?: () => void;
  selectedTicker?: string;
  selectedCurrency?: string;
  selectedCountry?: string;
  userDesk?: string;
}

interface BenchmarkItem {
  id: string;
  label: string;
  value: string;
  delta: string;
  isPositive: boolean;
  region: string;
}

interface PolicyRateItem {
  name: string;
  rate: string;
  note?: string;
  region: string;
}

const ALL_POLICY_RATES: PolicyRateItem[] = [
  { name: "RBI REPO", rate: "5.50%", note: "Policy Benchmark", region: "IND" },
  { name: "REVERSE REPO", rate: "3.35%", note: "Absorption Rate", region: "IND" },
  { name: "SDF RATE", rate: "5.25%", note: "Standing Deposit Facility", region: "IND" },
  { name: "MSF RATE", rate: "5.75%", note: "Marginal Standing Facility", region: "IND" },
  { name: "FED FUNDS", rate: "5.25% - 5.50%", note: "Target Range", region: "USA" },
  { name: "SOFR", rate: "5.31%", note: "Secured Overnight Rate", region: "USA" },
  { name: "DISCOUNT RATE", rate: "5.50%", note: "Primary Credit", region: "USA" },
  { name: "BOJ POLICY", rate: "0.25%", note: "Overnight Call Target", region: "JPN" },
  { name: "ECB MAIN", rate: "3.40%", note: "Main Refinancing Rate", region: "EUR" },
  { name: "BOE BANK RATE", rate: "5.00%", note: "Bank of England Base", region: "UK" },
];

const ALL_BENCHMARKS: BenchmarkItem[] = [
  { id: "NIFTY", label: "NIFTY 50", value: "24,998.45", delta: "-0.28%", isPositive: false, region: "IND" },
  { id: "SENSEX", label: "BSE SENSEX", value: "81,611.41", delta: "-0.24%", isPositive: false, region: "IND" },
  { id: "IN10Y", label: "IN 10Y G-SEC", value: "6.78%", delta: "+1 bp", isPositive: false, region: "IND" },
  { id: "USDINR", label: "USD / INR", value: "₹84.06", delta: "+0.02%", isPositive: false, region: "IND" },
  { id: "SP500", label: "S&P 500", value: "5,864.67", delta: "+0.42%", isPositive: true, region: "USA" },
  { id: "NASDAQ", label: "NASDAQ 100", value: "20,439.12", delta: "+0.65%", isPositive: true, region: "USA" },
  { id: "US10Y", label: "US 10-YR", value: "4.10%", delta: "+3 bps", isPositive: false, region: "USA" },
  { id: "VIX", label: "CBOE VIX", value: "18.24", delta: "-1.12%", isPositive: true, region: "USA" },
  { id: "NIKKEI", label: "NIKKEI 225", value: "39,523.55", delta: "+0.56%", isPositive: true, region: "JPN" },
  { id: "TOPIX", label: "TOPIX", value: "2,740.15", delta: "+0.38%", isPositive: true, region: "JPN" },
  { id: "JP10Y", label: "JP 10Y JGB", value: "0.94%", delta: "+1 bp", isPositive: false, region: "JPN" },
  { id: "USDJPY", label: "USD / JPY", value: "¥149.88", delta: "+0.15%", isPositive: false, region: "JPN" },
  { id: "DAX", label: "DAX 40", value: "19,410.20", delta: "+0.31%", isPositive: true, region: "EUR" },
  { id: "FTSE", label: "FTSE 100", value: "8,245.50", delta: "-0.12%", isPositive: false, region: "UK" },
];

export function MacroTickerTape({
  onOpenCommandPalette,
  onOpenSettings,
  selectedTicker,
  selectedCurrency,
  selectedCountry,
}: MacroTickerTapeProps) {
  const [utcTime, setUtcTime] = useState<string>("");
  const [localTime, setLocalTime] = useState<string>("");
  const [tzName, setTzName] = useState<string>("LOCAL");
  const [showUtcPrimary, setShowUtcPrimary] = useState<boolean>(false);
  const [activeRegion, setActiveRegion] = useState<MacroRegion>("GLOBAL");
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto adapt macro view if company selected
  useEffect(() => {
    if (isManualOverride) return;

    if (!selectedCountry && !selectedTicker) {
      setActiveRegion("GLOBAL");
      return;
    }

    const c = (selectedCountry || "").toUpperCase();
    const t = (selectedTicker || "").toUpperCase();

    if (c === "IND" || c === "INDIA" || t.endsWith(".NS") || t.endsWith(".BO")) {
      setActiveRegion("IND");
    } else if (c === "JPN" || c === "JAPAN" || t.endsWith(".T")) {
      setActiveRegion("JPN");
    } else if (c === "USA" || c === "US" || (!t.includes(".") && c !== "IND" && c !== "JPN")) {
      setActiveRegion("USA");
    } else {
      setActiveRegion("GLOBAL");
    }
  }, [selectedCountry, selectedTicker, isManualOverride]);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const shortTz = new Date().toLocaleTimeString("en-us", { timeZoneName: "short" }).split(" ")[2] || tz;
      setTzName(shortTz);
    } catch {
      setTzName("LOCAL");
    }

    const updateTime = () => {
      const now = new Date();
      const iso = now.toISOString();
      setUtcTime(iso.substring(11, 19) + " UTC");

      const formattedLocal = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setLocalTime(formattedLocal);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualScroll = (direction: "LEFT" | "RIGHT") => {
    if (scrollContainerRef.current) {
      const offset = direction === "LEFT" ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Filter items based on active region
  const filteredRates =
    activeRegion === "GLOBAL"
      ? ALL_POLICY_RATES
      : ALL_POLICY_RATES.filter((r) => r.region === activeRegion);

  const filteredBenchmarks =
    activeRegion === "GLOBAL"
      ? ALL_BENCHMARKS
      : ALL_BENCHMARKS.filter((b) => b.region === activeRegion);

  // Flatten ticker stream
  const tickerItems = [
    ...filteredRates.map((r) => ({
      type: "RATE" as const,
      id: `rate_${r.name}`,
      label: r.name,
      value: r.rate,
      note: r.note,
      isPositive: true,
    })),
    ...filteredBenchmarks.map((b) => ({
      type: "BENCHMARK" as const,
      id: `bm_${b.id}`,
      label: b.label,
      value: b.value,
      note: b.delta,
      isPositive: b.isPositive,
    })),
  ];

  // Double list for seamless 100% infinite loop
  const infiniteTape = [...tickerItems, ...tickerItems];

  return (
    <div className="w-full select-none no-print font-mono text-xs">
      {/* Tier 1: Top Navigation & Utility Controls */}
      <header className="w-full bg-[#0D111A] border-b border-[#1E2536] px-3 sm:px-4 py-2 flex items-center justify-between gap-2.5">
        {/* Left: Active Security Indicator & Quick Omnibar Trigger */}
        <div className="flex items-center gap-2.5 min-w-0 max-w-md flex-1">
          {selectedTicker && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111622] border border-[#C5A880]/30 text-[11px] shrink-0 rounded">
              <span className="text-[#94A3B8] text-[9.5px] uppercase">Active:</span>
              <span className="font-bold text-[#C5A880]">{selectedTicker}</span>
              {selectedCurrency && (
                <span className="text-[#64748B] text-[9.5px]">[{selectedCurrency}]</span>
              )}
            </div>
          )}

          <button
            onClick={onOpenCommandPalette}
            className="flex-1 flex items-center justify-between px-3 py-1.5 bg-[#080B10] hover:bg-[#111622] border border-[#1E2536] hover:border-[#C5A880]/50 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors rounded text-xs truncate"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
              <span className="truncate">Search global security (NSE, NASDAQ, BSE)...</span>
            </div>
            <span className="text-[9.5px] px-1.5 py-0.5 bg-[#172033] border border-[#1E2536] text-[#38BDF8] font-semibold shrink-0 ml-2 rounded hidden sm:inline">
              CTRL + K
            </span>
          </button>
        </div>

        {/* Right: Regional Filter Pills, Marquee Slide Controls, Clock & Calibration */}
        <div className="flex items-center gap-2 shrink-0 text-xs">
          {/* Regional Selector Pills */}
          <div className="hidden sm:flex items-center gap-0.5 bg-[#080B10] border border-[#1E2536] p-0.5 rounded">
            {[
              { id: "GLOBAL", label: "GLOBAL", flag: "🌐" },
              { id: "IND", label: "INDIA", flag: "🇮🇳" },
              { id: "USA", label: "USA", flag: "🇺🇸" },
              { id: "JPN", label: "JAPAN", flag: "🇯🇵" },
            ].map((r) => {
              const isActive = activeRegion === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setActiveRegion(r.id as MacroRegion);
                    setIsManualOverride(true);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${
                    isActive
                      ? "bg-[#172033] text-[#C5A880] border border-[#C5A880]/40 shadow-sm"
                      : "text-[#64748B] hover:text-[#CBD5E1]"
                  }`}
                >
                  <span>{r.flag}</span>
                  <span className="hidden md:inline">{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Marquee Slide Controller (Pause / Play & Step Arrows) */}
          <div className="flex items-center gap-1 bg-[#080B10] border border-[#1E2536] px-1 py-0.5 rounded">
            <button
              onClick={() => handleManualScroll("LEFT")}
              className="p-1 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1E2536] rounded transition-colors"
              title="Slide Left"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded flex items-center gap-1 transition-all ${
                isPaused
                  ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                  : "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
              }`}
              title={isPaused ? "Resume Ticker Glide" : "Pause Ticker Glide"}
            >
              {isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
              <span className="hidden lg:inline">{isPaused ? "PAUSED" : "GLIDING"}</span>
            </button>

            <button
              onClick={() => handleManualScroll("RIGHT")}
              className="p-1 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1E2536] rounded transition-colors"
              title="Slide Right"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* SQLite Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-[#111622] border border-[#1E2536] text-[10.5px] rounded">
            <Database className="w-3 h-3 text-[#10B981]" />
            <span className="text-[#64748B]">SQLITE:</span>
            <span className="text-[#10B981] font-bold">WAL OK</span>
          </div>

          {/* Interactive Clock */}
          <button
            onClick={() => setShowUtcPrimary(!showUtcPrimary)}
            className="flex items-center gap-1.5 px-2 py-1 bg-[#080B10] hover:bg-[#111622] border border-[#1E2536] hover:border-[#C5A880]/50 text-[10.5px] text-[#F8FAFC] rounded transition-colors cursor-pointer"
            title="Click to toggle Local / UTC Time"
          >
            <Clock className="w-3 h-3 text-[#C5A880] shrink-0" />
            <span className="font-mono tabular-nums tracking-wide font-bold">
              {showUtcPrimary ? utcTime : `${localTime || "11:26:41 PM"} (${tzName})`}
            </span>
          </button>

          {/* Settings Modal Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 bg-[#111622] hover:bg-[#1E2536] border border-[#1E2536] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors rounded"
              title="Institutional Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Tier 2: Continuous Silky-Smooth Sliding Ticker Tape (Marquee + Hover Pause) */}
      <div className="w-full bg-[#07090E] border-b border-[#1E2536] py-1 px-2 flex items-center overflow-hidden relative group">
        {/* Left Sticky Label */}
        <div className="shrink-0 flex items-center gap-1.5 bg-[#0D111A] border border-[#C5A880]/30 px-2.5 py-0.5 rounded text-[10px] text-[#C5A880] font-bold z-10 shadow-sm mr-2">
          <Landmark className="w-3 h-3 text-[#C5A880]" />
          <span className="tracking-wider">SOVEREIGN RATES &amp; MARQUEE TAPE:</span>
        </div>

        {/* Continuous Gliding Ticker Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto scrollbar-none flex items-center"
        >
          <div
            className={`flex items-center gap-3.5 ${
              isPaused ? "" : "animate-ticker-slide"
            }`}
            style={isPaused ? { animationPlayState: "paused" } : {}}
          >
            {infiniteTape.map((item, idx) => (
              <div
                key={`${item.id}_${idx}`}
                className="flex items-center gap-2 bg-[#0C1017] px-2.5 py-0.5 border border-[#1B2333] hover:border-[#C5A880]/50 rounded whitespace-nowrap transition-colors shrink-0"
              >
                <span className="text-[#64748B] text-[9.5px] uppercase font-semibold">
                  {item.label}
                </span>
                <span className="font-bold font-mono tabular-nums text-[#F8FAFC] text-[10.5px]">
                  {item.value}
                </span>

                {item.type === "RATE" ? (
                  <span className="text-[8.5px] text-[#C5A880] bg-[#C5A880]/10 px-1 rounded">
                    POLICY
                  </span>
                ) : (
                  <span
                    className={`text-[9.5px] font-mono tabular-nums flex items-center gap-0.5 font-bold ${
                      item.isPositive ? "text-[#10B981]" : "text-[#F43F5E]"
                    }`}
                  >
                    {item.isPositive ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    {item.note}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
