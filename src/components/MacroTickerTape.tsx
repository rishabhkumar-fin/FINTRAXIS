"use client";

import React, { useState, useEffect } from "react";
import { Search, Database, Clock, Landmark, Settings, Shield } from "lucide-react";

interface MacroTickerTapeProps {
  onOpenCommandPalette?: () => void;
  onOpenSettings?: () => void;
  selectedTicker?: string;
  selectedCurrency?: string;
  userDesk?: string;
}

interface BenchmarkItem {
  id: string;
  label: string;
  value: string;
  delta: string;
  isPositive: boolean;
}

const BENCHMARKS: BenchmarkItem[] = [
  { id: "SP500", label: "S&P 500", value: "5,864.67", delta: "+0.42%", isPositive: true },
  { id: "NIFTY", label: "NIFTY 50", value: "24,998.45", delta: "-0.28%", isPositive: false },
  { id: "NIKKEI", label: "NIKKEI 225", value: "39,523.55", delta: "+0.56%", isPositive: true },
  { id: "USDINR", label: "USD / INR", value: "84.06", delta: "+0.02%", isPositive: false },
  { id: "US10Y", label: "US 10-YR", value: "4.10%", delta: "+3 bps", isPositive: false },
];

const POLICY_RATES = [
  { name: "RBI REPO", rate: "5.50%" },
  { name: "FED FUNDS", rate: "5.25% - 5.50%" },
  { name: "BOJ POLICY", rate: "0.25%" },
];

export function MacroTickerTape({
  onOpenCommandPalette,
  onOpenSettings,
  selectedTicker,
  selectedCurrency,
  userDesk = "Global Credit Risk & Distressed Debt",
}: MacroTickerTapeProps) {
  const [utcTime, setUtcTime] = useState<string>("");

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

  return (
    <header className="w-full bg-[#0D111A] border-b border-[#1E2536] px-4 py-2 flex items-center justify-between gap-4 font-mono text-xs select-none no-print">
      {/* Left: Active Ticker Badge & Omnibar Search */}
      <div className="flex items-center gap-2.5 min-w-[260px] max-w-sm flex-1">
        {selectedTicker && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111622] border border-[#1E2536] text-[11px] shrink-0 rounded">
            <span className="text-[#94A3B8] text-[10px]">TICKER:</span>
            <span className="font-bold text-[#C5A880]">{selectedTicker}</span>
            {selectedCurrency && <span className="text-[#64748B] text-[10px]">[{selectedCurrency}]</span>}
          </div>
        )}

        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-[#080B10] hover:bg-[#111622] border border-[#1E2536] hover:border-[#C5A880]/50 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors rounded text-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-[#C5A880]" />
            <span className="truncate">Resolve Global Security...</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 bg-[#172033] border border-[#1E2536] text-[#38BDF8] font-semibold">
            CTRL + K
          </span>
        </button>
      </div>

      {/* Center: High-Contrast Macro & Central Bank Ticker Cards */}
      <div className="hidden lg:flex items-center gap-4 overflow-x-auto text-[11px]">
        {/* Central Bank Policy Rates */}
        <div className="flex items-center gap-2.5 border-r border-[#1E2536] pr-3 text-[#94A3B8]">
          <span className="text-[#C5A880] font-bold flex items-center gap-1">
            <Landmark className="w-3 h-3" />
            <span>RATES:</span>
          </span>
          {POLICY_RATES.map((pr) => (
            <div key={pr.name} className="flex items-center gap-1">
              <span className="text-[#64748B] text-[10px]">{pr.name}</span>
              <span className="font-bold font-mono tabular-nums text-[#F8FAFC]">{pr.rate}</span>
            </div>
          ))}
        </div>

        {/* Global Market Benchmarks */}
        <div className="flex items-center gap-3">
          {BENCHMARKS.map((bm) => (
            <div key={bm.id} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[#64748B] text-[10px]">{bm.label}:</span>
              <span className="font-semibold font-mono tabular-nums text-[#F8FAFC]">{bm.value}</span>
              <span
                className={`text-[10px] font-mono tabular-nums ${
                  bm.isPositive ? "text-[#10B981]" : "text-[#F43F5E]"
                }`}
              >
                {bm.delta}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: User Desk, SQLite WAL Status, Live UTC Clock & Settings Gear */}
      <div className="flex items-center gap-2 shrink-0 text-xs">
        {/* User Desk Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 bg-[#111622] border border-[#1E2536] text-[11px] rounded max-w-[210px] truncate">
          <Shield className="w-3 h-3 text-[#C5A880] shrink-0" />
          <span className="text-[#94A3B8] truncate">{userDesk}</span>
        </div>

        {/* SQLite Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-[#111622] border border-[#1E2536] text-[11px] rounded">
          <Database className="w-3 h-3 text-[#10B981]" />
          <span className="text-[#64748B]">SQLITE:</span>
          <span className="text-[#10B981] font-bold">LIVE</span>
        </div>

        {/* Live Monospace UTC Clock */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#080B10] border border-[#1E2536] text-[11px] text-[#F8FAFC] rounded">
          <Clock className="w-3 h-3 text-[#C5A880]" />
          <span className="font-mono font-medium tabular-nums tracking-wider">
            {utcTime || "2026-10-13 09:30:00 UTC"}
          </span>
        </div>

        {/* Settings Gear Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 bg-[#111622] hover:bg-[#1E2536] border border-[#1E2536] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors rounded"
            title="Open Institutional Calibration Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
}
