"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PeacockLogo } from "./PeacockLogo";
import { Clock, Terminal, Lock, Sliders, UserCheck, AlertTriangle } from "lucide-react";
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

  const isGuest = Boolean(session?.isDemo || session?.role === "DEMO_ANALYST");
  const isAdmin = Boolean(session?.role === "SUPER_ADMIN" || session?.role === "ADMIN");

  return (
    <header className="border-b border-[#253247] bg-[#080B12] text-[#F3F6FC] px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 select-none no-print">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <PeacockLogo size="md" showLockup={true} />
      </div>

      {/* Center Active Context & Command Bar CTA */}
      <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
        {selectedTicker && (
          <div className="flex items-center gap-2 px-2.5 py-1 border border-[#253247] bg-[#101621] rounded-md">
            <span className="text-[#9AA8BC] text-[10px] uppercase">ACTIVE SECURITY:</span>
            <span className="font-bold text-[#38BDF8]">{selectedTicker}</span>
            {selectedCurrency && (
              <span className="text-[#9AA8BC] text-[10px]">[{selectedCurrency}]</span>
            )}
          </div>
        )}

        {/* Global Command Bar Quick Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1 bg-[#151E2D] hover:bg-[#1D293D] border border-[#253247] hover:border-[#3867F5] text-[11px] text-[#9AA8BC] hover:text-[#F3F6FC] transition-colors rounded-md cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>SEARCH / COMMAND</span>
            <span className="text-[9px] px-1 py-0.5 bg-[#080B12] border border-[#253247] text-[#38BDF8] font-bold rounded">
              CTRL + K
            </span>
          </button>
        )}
      </div>

      {/* Right Session Status, Clearance Badge, UTC Clock & Logout */}
      <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
        {/* Guest or Analyst Clearance Badge */}
        {isGuest ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#3867F5]/10 border border-[#3867F5]/40 text-[#38BDF8] text-[11px] font-bold rounded-md">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <span>GUEST / DEMO (READ-ONLY)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#101621] border border-[#253247] text-[11px] rounded-md">
            <UserCheck className="w-3.5 h-3.5 text-[#16A879]" />
            <span className="text-[#F3F6FC] font-semibold">{session?.userName || "Analyst"}</span>
            <span className="text-[#9AA8BC] text-[10px]">({session?.role || "ANALYST"})</span>
          </div>
        )}

        {/* Must change password indicator if set */}
        {session?.mustChangePassword && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 bg-[#F5B942]/15 border border-[#F5B942]/40 text-[#F5B942] text-[10px] rounded"
            title="Account uses default password. Please update in Settings."
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>PASSWORD UPDATE DUE</span>
          </div>
        )}

        {/* UTC Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#101621] border border-[#253247] text-[11px] text-[#38BDF8] rounded-md">
          <Clock className="w-3.5 h-3.5 text-[#3867F5]" />
          <span className="font-mono tabular-nums font-medium tracking-wide">
            {utcTime || "UTC"}
          </span>
        </div>

        {/* Admin Console Entry - Visible strictly to Admins */}
        {isAdmin && (
          <Link
            href="/admin"
            title="System Operational Console"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#3867F5]/20 hover:bg-[#3867F5] border border-[#3867F5]/50 hover:border-[#3867F5] text-[#38BDF8] hover:text-white font-bold text-[10px] transition-colors rounded-md"
          >
            <Sliders className="w-3 h-3" />
            <span>ADMIN CONSOLE</span>
          </Link>
        )}

        {/* Session Termination Button */}
        {onTerminateSession && (
          <button
            onClick={onTerminateSession}
            title="Sign out of active session"
            className="flex items-center gap-1 px-2.5 py-1 bg-[#101621] hover:bg-[#F05252]/20 border border-[#253247] hover:border-[#F05252]/50 text-[#9AA8BC] hover:text-[#F05252] text-[11px] transition-colors rounded-md cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
}
