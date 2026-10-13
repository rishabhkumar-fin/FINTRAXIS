"use client";

import React, { useState, useEffect } from "react";
import { Search, Database, Clock, Landmark, Settings, TrendingUp, TrendingDown } from "lucide-react";

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

        {/* Right: System Health, Live UTC Clock & Calibration */}
        <div className="flex items-center gap-2.5 shrink-0 text-xs">
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

      {/* Tier 2: Dedicated, Non-Overlapping Macroeconomic & Benchmark Ribbon */}
      <div className="w-full bg-[#080B10] border-b border-[#1E2536] px-4 py-1.5 flex items-center justify-between gap-4 overflow-x-auto text-[11px] scrollbar-none">
        {/* Central Bank Policy Rates */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-[#C5A880] font-bold text-[10px] tracking-wider uppercase">
            <Landmark className="w-3 h-3" />
            <span>CENTRAL BANK RATES:</span>
          </div>
          <div className="flex items-center gap-3">
            {POLICY_RATES.map((pr) => (
              <div key={pr.name} className="flex items-center gap-1.5 bg-[#0D111A] px-2 py-0.5 border border-[#1E2536] rounded">
                <span className="text-[#64748B] text-[10px]">{pr.name}</span>
                <span className="font-bold font-mono tabular-nums text-[#F8FAFC]">{pr.rate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Market Benchmarks */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[#64748B] text-[10px] uppercase font-medium">BENCHMARKS:</span>
          <div className="flex items-center gap-3">
            {BENCHMARKS.map((bm) => (
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
