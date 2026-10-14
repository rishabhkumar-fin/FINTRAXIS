"use client";

import React, { useState, useEffect } from "react";
import { PeacockLogo } from "./PeacockLogo";
import { ShieldCheck, Database, Clock, Terminal, Lock } from "lucide-react";
import { SessionClearance } from "./AuthGate";

interface TopHeaderProps {
  selectedTicker?: string;
  selectedCurrency?: string;
  session?: SessionClearance | null;
  onOpenCommandPalette?: () => void;
  onTerminateSession?: () => void;
}

export function TopHeader({
  selectedTicker,
  selectedCurrency,
  session,
  onOpenCommandPalette,
  onTerminateSession,
}: TopHeaderProps) {
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
    <header className="border-b border-[#1E2638] bg-[#07090E] text-[#E1E7EC] px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3 select-none no-print">
      {/* Brand & Swiss Sovereign Peacock Crest */}
      <div className="flex items-center gap-4">
        <PeacockLogo size="md" showLockup={true} />
      </div>

      {/* Center Active Context & Command Bar CTA */}
      <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
        {selectedTicker && (
          <div className="flex items-center gap-2 px-2.5 py-1 border border-[#232B3A] bg-[#0E131A]">
            <span className="text-[#5A687D] text-[10px] uppercase">ACTIVE SECURITY:</span>
            <span className="font-bold text-[#2563EB]">{selectedTicker}</span>
            <span className="text-[#5A687D] text-[10px]">[{selectedCurrency}]</span>
          </div>
        )}

        {/* Bloomberg Command Bar Quick Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1 bg-[#12161F] hover:bg-[#181F2B] border border-[#232B3A] hover:border-[#2563EB] text-[11px] text-[#9BA8B8] hover:text-[#E1E7EC] transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>COMMAND LINE</span>
          <span className="text-[9px] px-1 py-0.2 bg-[#07090E] border border-[#1E2638] text-[#2563EB] font-bold">
            CTRL + K
          </span>
        </button>

        <div className="flex items-center gap-1.5 text-[#5A687D] text-[11px]">
          <Database className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>SQLITE WAL: </span>
          <span className="text-[#10B981] font-bold">LIVE</span>
        </div>
      </div>

      {/* Right Clearance, Node, UTC Clock & Logout CTA */}
      <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
        {/* Clearance Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#12161F] border border-[#232B3A] text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="text-[#9BA8B8]">
            {session ? session.analystId : "ANALYST"} &bull; ACTIVE
          </span>
        </div>

        {/* Node Status */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#12161F] border border-[#1E2638] text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
          <span className="text-[#9BA8B8]">FEED: LIVE</span>
          <span className="text-[#5A687D]">|</span>
          <span className="text-[#2563EB] font-semibold">MUM-01</span>
        </div>

        {/* Live Monospace UTC Clock */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#0E131A] border border-[#232B3A] text-[11px] text-[#60A5FA]">
          <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="font-mono font-medium tracking-wider font-mono-numbers">
            {utcTime || "2026-10-13 07:00:00 UTC"}
          </span>
        </div>

        {/* Session Termination Button */}
        {onTerminateSession && (
          <button
            onClick={onTerminateSession}
            title="Terminate Active Session (Ctrl+Shift+L)"
            className="flex items-center gap-1 px-2.5 py-0.5 bg-[#EF4444]/10 hover:bg-[#EF4444] border border-[#EF4444]/40 hover:border-[#EF4444] text-[#EF4444] hover:text-[#07090E] font-bold text-[10px] transition-colors"
          >
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">TERMINATE SESSION</span>
          </button>
        )}
      </div>
    </header>
  );
}
