"use client";

import React, { useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  Activity,
  ShieldAlert,
  MoreHorizontal,
  Network,
  PieChart,
  SlidersHorizontal,
  FileText,
  ShieldCheck,
  Settings,
  BookOpen,
  LogOut,
  X,
  Sparkles,
} from "lucide-react";
import { ModuleTab } from "./NavigationTabs";
import { SessionClearance } from "./AuthGate";

interface MobileBottomNavProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  earlyWarningCount?: number;
  session: SessionClearance | null;
  onOpenSettings: () => void;
  onOpenMethodology: () => void;
  onOpenHelp?: () => void;
  onOpenAi: () => void;
  onLogout: () => void;
  isMoreOpen: boolean;
  setIsMoreOpen: (open: boolean) => void;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  earlyWarningCount = 0,
  session,
  onOpenSettings,
  onOpenMethodology,
  onOpenHelp,
  onOpenAi,
  onLogout,
  isMoreOpen,
  setIsMoreOpen,
}: MobileBottomNavProps) {
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  // Close sheet on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMoreOpen) {
        setIsMoreOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMoreOpen, setIsMoreOpen]);

  const handleNavClick = (tab: ModuleTab) => {
    onSelectTab(tab);
    setIsMoreOpen(false);
  };

  const isPrimary =
    activeTab === "overview" ||
    activeTab === "01_HUB" ||
    activeTab === "02_HEALTH" ||
    activeTab === "03_VULNERABILITY";

  return (
    <>
      {/* 1. Mobile Bottom Navigation Bar (< lg screens, fixed to bottom with safe-area padding) */}
      <nav
        aria-label="Mobile Terminal Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D17]/95 backdrop-blur-md border-t border-[#182337] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] font-mono select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
      >
        <div className="grid grid-cols-5 items-center justify-around gap-1 max-w-md mx-auto">
          {/* Item 1: Overview */}
          <button
            type="button"
            onClick={() => handleNavClick("overview")}
            className={`min-h-[44px] flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "text-[#38BDF8] bg-[#101A2E] border border-[#2563EB]/40"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span className="text-[9.5px] font-bold tracking-tight">Overview</span>
          </button>

          {/* Item 2: Hub */}
          <button
            type="button"
            onClick={() => handleNavClick("01_HUB")}
            className={`min-h-[44px] flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "01_HUB"
                ? "text-[#38BDF8] bg-[#101A2E] border border-[#2563EB]/40"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4 mb-0.5" />
            <span className="text-[9.5px] font-bold tracking-tight">Hub</span>
          </button>

          {/* Item 3: Health */}
          <button
            type="button"
            onClick={() => handleNavClick("02_HEALTH")}
            className={`min-h-[44px] flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "02_HEALTH" || activeTab === "02_STATEMENTS" || activeTab === "03_HEALTH"
                ? "text-[#38BDF8] bg-[#101A2E] border border-[#2563EB]/40"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4 mb-0.5" />
            <span className="text-[9.5px] font-bold tracking-tight">Health</span>
          </button>

          {/* Item 4: Warnings */}
          <button
            type="button"
            onClick={() => handleNavClick("03_VULNERABILITY")}
            className={`min-h-[44px] flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors relative cursor-pointer ${
              activeTab === "03_VULNERABILITY" || activeTab === "04_VULNERABILITY"
                ? "text-[#38BDF8] bg-[#101A2E] border border-[#2563EB]/40"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4 mb-0.5" />
            <span className="text-[9.5px] font-bold tracking-tight">Warnings</span>
            {earlyWarningCount > 0 && (
              <span className="absolute top-1 right-2 px-1 py-0.2 bg-[#EF4444] text-white text-[8px] font-bold rounded-full">
                {earlyWarningCount}
              </span>
            )}
          </button>

          {/* Item 5: More (Expands Sheet) */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`min-h-[44px] flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors cursor-pointer ${
              !isPrimary || isMoreOpen
                ? "text-[#38BDF8] bg-[#101A2E] border border-[#2563EB]/40"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <MoreHorizontal className="w-4 h-4 mb-0.5" />
            <span className="text-[9.5px] font-bold tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* 2. Slide-Up "More" Sheet Overlay */}
      {isMoreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Additional Workstations and Terminal Actions"
          className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="bg-[#0B1220] border-t border-[#1E293B] rounded-t-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[85dvh] overflow-y-auto space-y-4 font-mono text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#182337]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
                <span className="font-bold text-white tracking-wider text-xs uppercase">
                  Extended Workstations & Tools
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-white bg-[#101A2E] rounded-lg border border-[#1E293B] cursor-pointer"
                aria-label="Close extended menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Workstation Grid */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider mb-1">
                ADDITIONAL WORKSTATIONS
              </div>

              {/* Desk 04: Dependencies */}
              <button
                type="button"
                onClick={() => handleNavClick("04_DEPENDENCIES")}
                className={`w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  activeTab === "04_DEPENDENCIES"
                    ? "bg-[#101A2E] border-[#38BDF8] text-[#38BDF8]"
                    : "bg-[#090D17] border-[#182337] text-slate-200 hover:border-[#2563EB]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Network className="w-4 h-4 text-[#38BDF8]" />
                  <div>
                    <div className="font-bold text-xs text-white">Business Dependencies</div>
                    <div className="text-[10px] text-[#94A3B8]">Single-source suppliers & counterparty ties</div>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#182337] rounded text-[#38BDF8]">SUPPLY</span>
              </button>

              {/* Desk 05: Concentration */}
              <button
                type="button"
                onClick={() => handleNavClick("05_CONCENTRATION")}
                className={`w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  activeTab === "05_CONCENTRATION"
                    ? "bg-[#101A2E] border-[#38BDF8] text-[#38BDF8]"
                    : "bg-[#090D17] border-[#182337] text-slate-200 hover:border-[#2563EB]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PieChart className="w-4 h-4 text-[#38BDF8]" />
                  <div>
                    <div className="font-bold text-xs text-white">Concentration & Exposure</div>
                    <div className="text-[10px] text-[#94A3B8]">Herfindahl-Hirschman (HHI) segment risk</div>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#182337] rounded text-[#38BDF8]">EXPOSURE</span>
              </button>

              {/* Desk 06: Simulator */}
              <button
                type="button"
                onClick={() => handleNavClick("06_SIMULATOR")}
                className={`w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  activeTab === "06_SIMULATOR" || activeTab === "05_SIMULATOR"
                    ? "bg-[#101A2E] border-[#38BDF8] text-[#38BDF8]"
                    : "bg-[#090D17] border-[#182337] text-slate-200 hover:border-[#2563EB]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-4 h-4 text-[#F5B942]" />
                  <div>
                    <div className="font-bold text-xs text-white">Scenario Simulator</div>
                    <div className="text-[10px] text-[#94A3B8]">Macro stress tests & covenant shock models</div>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#182337] rounded text-[#F5B942]">SIMULATOR</span>
              </button>

              {/* Desk 07: Research Credit Memo */}
              <button
                type="button"
                onClick={() => handleNavClick("07_REPORTS")}
                className={`w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  activeTab === "07_REPORTS" || activeTab === "06_MEMO"
                    ? "bg-[#101A2E] border-[#38BDF8] text-[#38BDF8]"
                    : "bg-[#090D17] border-[#182337] text-slate-200 hover:border-[#2563EB]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#38BDF8]" />
                  <div>
                    <div className="font-bold text-xs text-white">Executive Credit Memo</div>
                    <div className="text-[10px] text-[#94A3B8]">Underwriting tearsheet & PDF/CSV export</div>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#182337] rounded text-[#38BDF8]">MEMO</span>
              </button>

              {/* Desk 00: Admin Panel (Clearance Gated) */}
              <button
                type="button"
                onClick={() => handleNavClick("00_ADMIN")}
                className={`w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  activeTab === "00_ADMIN"
                    ? "bg-[#101A2E] border-[#38BDF8] text-[#38BDF8]"
                    : "bg-[#090D17] border-[#182337] text-slate-200 hover:border-[#2563EB]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>Administration Console</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-[#2563EB]/20 text-[#38BDF8] rounded border border-[#2563EB]/40">
                        {isAdmin ? "ADMIN" : "READ-ONLY"}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">Users, audit log, data feeds & hurdles</div>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#182337] rounded text-[#10B981]">CONTROL</span>
              </button>
            </div>

            {/* Utility Actions & Knowledge */}
            <div className="pt-2 border-t border-[#182337] space-y-1.5">
              <div className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider mb-1">
                KNOWLEDGE & TERMINAL CONTROLS
              </div>

              {/* Help & Concept Glossary Trigger */}
              {onOpenHelp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenHelp();
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2.5 p-3 rounded-xl bg-[#090D17] border border-[#2563EB]/40 hover:border-[#38BDF8] text-left transition-colors cursor-pointer text-slate-200"
                >
                  <BookOpen className="w-4 h-4 text-[#38BDF8]" />
                  <div>
                    <div className="font-bold text-xs text-white">Help &amp; Concept Glossary (?)</div>
                    <div className="text-[10px] text-[#94A3B8]">Plain-language ratios, source badges &amp; limits</div>
                  </div>
                </button>
              )}

              {/* Methodology Guide Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenMethodology();
                }}
                className="w-full min-h-[44px] flex items-center gap-2.5 p-3 rounded-xl bg-[#090D17] border border-[#182337] hover:border-[#38BDF8] text-left transition-colors cursor-pointer text-slate-200"
              >
                <BookOpen className="w-4 h-4 text-[#38BDF8]" />
                <div>
                  <div className="font-bold text-xs text-white">Methodology & Data Sources</div>
                  <div className="text-[10px] text-[#94A3B8]">All 12 formulas, derivation math & limits</div>
                </div>
              </button>

              {/* AI Risk Copilot */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenAi();
                }}
                className="w-full min-h-[44px] flex items-center gap-2.5 p-3 rounded-xl bg-[#090D17] border border-[#182337] hover:border-[#38BDF8] text-left transition-colors cursor-pointer text-slate-200"
              >
                <Sparkles className="w-4 h-4 text-[#38BDF8]" />
                <div>
                  <div className="font-bold text-xs text-white">AI Financial Copilot (Ctrl+J)</div>
                  <div className="text-[10px] text-[#94A3B8]">Grounded credit queries & ratio guidance</div>
                </div>
              </button>

              {/* Operator Settings */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenSettings();
                }}
                className="w-full min-h-[44px] flex items-center gap-2.5 p-3 rounded-xl bg-[#090D17] border border-[#182337] hover:border-[#38BDF8] text-left transition-colors cursor-pointer text-slate-200"
              >
                <Settings className="w-4 h-4 text-[#94A3B8]" />
                <div>
                  <div className="font-bold text-xs text-white">Calibrate Risk Hurdles</div>
                  <div className="text-[10px] text-[#94A3B8]">Set leverage ceiling & coverage floor</div>
                </div>
              </button>

              {/* Lock Terminal / Logout */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onLogout();
                }}
                className="w-full min-h-[44px] flex items-center gap-2.5 p-3 rounded-xl bg-[#180A0E] border border-[#EF4444]/30 hover:border-[#EF4444] text-left transition-colors cursor-pointer text-[#EF4444]"
              >
                <LogOut className="w-4 h-4 text-[#EF4444]" />
                <div>
                  <div className="font-bold text-xs">Lock Terminal & Exit Session</div>
                  <div className="text-[10px] text-[#EF4444]/70">Invalidate session token & clear clearance</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
