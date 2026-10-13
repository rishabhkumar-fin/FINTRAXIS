"use client";

import React, { useState, useEffect } from "react";
import { Search, Database, Clock, Landmark, Settings, TrendingUp, TrendingDown } from "lucide-react";

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
}

interface PolicyRateItem {
  name: string;
  rate: string;
  note?: string;
}

const REGIONAL_DATA: Record<
  MacroRegion,
  {
    flag: string;
    label: string;
    rates: PolicyRateItem[];
    benchmarks: BenchmarkItem[];
  }
> = {
  IND: {
    flag: "🇮🇳",
    label: "INDIA MACRO",
    rates: [
      { name: "RBI REPO", rate: "5.50%", note: "Policy Repo" },
      { name: "REVERSE REPO", rate: "3.35%" },
      { name: "SDF RATE", rate: "5.25%" },
      { name: "MSF RATE", rate: "5.75%" },
    ],
    benchmarks: [
      { id: "NIFTY", label: "NIFTY 50", value: "24,998.45", delta: "-0.28%", isPositive: false },
      { id: "SENSEX", label: "BSE SENSEX", value: "81,611.41", delta: "-0.24%", isPositive: false },
      { id: "IN10Y", label: "IN 10Y G-SEC", value: "6.78%", delta: "+1 bp", isPositive: false },
      { id: "USDINR", label: "USD / INR", value: "₹84.06", delta: "+0.02%", isPositive: false },
    ],
  },
  USA: {
    flag: "🇺🇸",
    label: "UNITED STATES MACRO",
    rates: [
      { name: "FED FUNDS", rate: "5.25% - 5.50%", note: "Target Range" },
      { name: "DISCOUNT RATE", rate: "5.50%" },
      { name: "SOFR BENCHMARK", rate: "5.31%" },
    ],
    benchmarks: [
      { id: "SP500", label: "S&P 500", value: "5,864.67", delta: "+0.42%", isPositive: true },
      { id: "NASDAQ", label: "NASDAQ 100", value: "20,439.12", delta: "+0.65%", isPositive: true },
      { id: "US10Y", label: "US 10-YR", value: "4.10%", delta: "+3 bps", isPositive: false },
      { id: "VIX", label: "CBOE VIX", value: "18.24", delta: "-1.12%", isPositive: true },
    ],
  },
  JPN: {
    flag: "🇯🇵",
    label: "JAPAN MACRO",
    rates: [
      { name: "BOJ POLICY", rate: "0.25%", note: "Overnight Call" },
      { name: "COMPLEMENTARY DEPOSIT", rate: "0.25%" },
    ],
    benchmarks: [
      { id: "NIKKEI", label: "NIKKEI 225", value: "39,523.55", delta: "+0.56%", isPositive: true },
      { id: "TOPIX", label: "TOPIX", value: "2,740.15", delta: "+0.38%", isPositive: true },
      { id: "JP10Y", label: "JP 10Y JGB", value: "0.94%", delta: "+1 bp", isPositive: false },
      { id: "USDJPY", label: "USD / JPY", value: "¥149.88", delta: "+0.15%", isPositive: false },
    ],
  },
  GLOBAL: {
    flag: "🌐",
    label: "GLOBAL CROSS-BORDER",
    rates: [
      { name: "RBI REPO", rate: "5.50%" },
      { name: "FED FUNDS", rate: "5.25% - 5.50%" },
      { name: "BOJ POLICY", rate: "0.25%" },
      { name: "ECB MAIN", rate: "3.40%" },
    ],
    benchmarks: [
      { id: "SP500", label: "S&P 500", value: "5,864.67", delta: "+0.42%", isPositive: true },
      { id: "NIFTY", label: "NIFTY 50", value: "24,998.45", delta: "-0.28%", isPositive: false },
      { id: "NIKKEI", label: "NIKKEI 225", value: "39,523.55", delta: "+0.56%", isPositive: true },
      { id: "USDINR", label: "USD/INR", value: "₹84.06", delta: "+0.02%", isPositive: false },
    ],
  },
};

export function MacroTickerTape({
  onOpenCommandPalette,
  onOpenSettings,
  selectedTicker,
  selectedCurrency,
  selectedCountry,
}: MacroTickerTapeProps) {
  const [utcTime, setUtcTime] = useState<string>("");
  const [activeRegion, setActiveRegion] = useState<MacroRegion>("IND");
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);

  // Automatically adapt macro view based on selected company's country unless user manually picked a region
  useEffect(() => {
    if (isManualOverride) return;

    if (!selectedCountry && !selectedTicker) {
      setActiveRegion("IND");
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
    const updateTime = () => {
      const now = new Date();
      const iso = now.toISOString();
      const formatted = iso.replace("T", " ").substring(0, 19) + " UTC";
      setUtcTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentMacro = REGIONAL_DATA[activeRegion] || REGIONAL_DATA.IND;

  return (
    <div className="w-full select-none no-print font-mono text-xs">
      {/* Tier 1: Top Navigation & Utility Controls */}
      <header className="w-full bg-[#0D111A] border-b border-[#1E2536] px-4 py-2 flex items-center justify-between gap-3">
        {/* Left: Active Security Indicator & Quick Omnibar Trigger */}
        <div className="flex items-center gap-3 min-w-0 max-w-md flex-1">
          {selectedTicker && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111622] border border-[#1E2536] text-[11px] shrink-0 rounded">
              <span className="text-[#94A3B8] text-[10px] uppercase">Active:</span>
              <span className="font-bold text-[#C5A880]">{selectedTicker}</span>
              {selectedCurrency && (
                <span className="text-[#64748B] text-[10px]">[{selectedCurrency}]</span>
              )}
            </div>
          )}

          <button
            onClick={onOpenCommandPalette}
            className="flex-1 flex items-center justify-between px-3 py-1.5 bg-[#080B10] hover:bg-[#111622] border border-[#1E2536] hover:border-[#C5A880]/50 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors rounded text-xs truncate"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
              <span className="truncate">Resolve Global Security...</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#172033] border border-[#1E2536] text-[#38BDF8] font-semibold shrink-0 ml-2 rounded">
              CTRL + K
            </span>
          </button>
        </div>

        {/* Right: Regional Quick Switcher, System Health, Live UTC Clock & Calibration */}
        <div className="flex items-center gap-2.5 shrink-0 text-xs">
          {/* Country Macro Region Switcher Pills */}
          <div className="hidden md:flex items-center gap-1 bg-[#080B10] border border-[#1E2536] p-0.5 rounded">
            {(["IND", "USA", "JPN", "GLOBAL"] as MacroRegion[]).map((region) => {
              const data = REGIONAL_DATA[region];
              const isActive = activeRegion === region;
              return (
                <button
                  key={region}
                  onClick={() => {
                    setActiveRegion(region);
                    setIsManualOverride(true);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${
                    isActive
                      ? "bg-[#172033] text-[#C5A880] border border-[#C5A880]/40 shadow-sm"
                      : "text-[#64748B] hover:text-[#CBD5E1]"
                  }`}
                  title={`View ${data.label} Overview`}
                >
                  <span>{data.flag}</span>
                  <span>{region}</span>
                </button>
              );
            })}
          </div>

          {/* SQLite Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-[#111622] border border-[#1E2536] text-[11px] rounded">
            <Database className="w-3 h-3 text-[#10B981]" />
            <span className="text-[#64748B]">SQLITE:</span>
            <span className="text-[#10B981] font-bold">ONLINE</span>
          </div>

          {/* Live UTC Clock */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#080B10] border border-[#1E2536] text-[11px] text-[#F8FAFC] rounded">
            <Clock className="w-3 h-3 text-[#C5A880] shrink-0" />
            <span className="font-mono font-medium tabular-nums tracking-wider">
              {utcTime || "2026-10-13 09:30:00 UTC"}
            </span>
          </div>

          {/* Settings Calibration */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 bg-[#111622] hover:bg-[#1E2536] border border-[#1E2536] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors rounded"
              title="Calibration Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Tier 2: Dynamic Country-Wise Macroeconomic & Policy Rates Ribbon */}
      <div className="w-full bg-[#080B10] border-b border-[#1E2536] px-4 py-1.5 flex items-center justify-between gap-4 overflow-x-auto text-[11px] scrollbar-none">
        {/* Country Label Badge & Central Bank Rates */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#111622] px-2 py-0.5 border border-[#C5A880]/30 rounded text-[#C5A880] font-bold text-[10px]">
            <span>{currentMacro.flag}</span>
            <span>{currentMacro.label}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#94A3B8] text-[10px] font-bold uppercase border-l border-[#1E2536] pl-2.5">
            <Landmark className="w-3 h-3 text-[#C5A880]" />
            <span>POLICY RATES:</span>
          </div>

          <div className="flex items-center gap-2">
            {currentMacro.rates.map((pr) => (
              <div
                key={pr.name}
                className="flex items-center gap-1.5 bg-[#0D111A] px-2 py-0.5 border border-[#1E2536] rounded"
              >
                <span className="text-[#64748B] text-[10px]">{pr.name}</span>
                <span className="font-bold font-mono tabular-nums text-[#F8FAFC]">{pr.rate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Market Benchmarks for Selected Country */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[#64748B] text-[10px] uppercase font-medium">BENCHMARKS:</span>
          <div className="flex items-center gap-2.5">
            {currentMacro.benchmarks.map((bm) => (
              <div
                key={bm.id}
                className="flex items-center gap-1.5 bg-[#0D111A] px-2 py-0.5 border border-[#1E2536] rounded whitespace-nowrap"
              >
                <span className="text-[#94A3B8] text-[10px]">{bm.label}</span>
                <span className="font-semibold font-mono tabular-nums text-[#F8FAFC]">{bm.value}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums flex items-center gap-0.5 ${
                    bm.isPositive ? "text-[#10B981]" : "text-[#F43F5E]"
                  }`}
                >
                  {bm.isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {bm.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
