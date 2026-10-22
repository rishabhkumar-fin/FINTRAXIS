"use client";

import React from "react";
import { Building2, FileSpreadsheet, Activity, AlertTriangle, Cpu, FileText } from "lucide-react";

export type ModuleTab =
  | "00_ADMIN"
  | "overview"
  | "01_HUB"
  | "02_HEALTH"
  | "02_STATEMENTS"
  | "03_HEALTH"
  | "03_VULNERABILITY"
  | "04_VULNERABILITY"
  | "04_DEPENDENCIES"
  | "05_CONCENTRATION"
  | "05_SIMULATOR"
  | "06_SIMULATOR"
  | "06_MEMO"
  | "07_REPORTS";

interface NavigationTabsProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  earlyWarningCount?: number;
  riskTier?: string;
}

export function NavigationTabs({
  activeTab,
  onSelectTab,
  earlyWarningCount = 0,
  riskTier,
}: NavigationTabsProps) {
  const tabs = [
    {
      id: "01_HUB" as ModuleTab,
      label: "Securities Directory",
      hotkey: "[1]",
      icon: Building2,
      badge: "MASTER",
    },
    {
      id: "02_STATEMENTS" as ModuleTab,
      label: "Financial Statements",
      hotkey: "[2]",
      icon: FileSpreadsheet,
      badge: "XBRL",
    },
    {
      id: "03_HEALTH" as ModuleTab,
      label: "Credit Risk & Solvency",
      hotkey: "[3]",
      icon: Activity,
      badge: riskTier ? riskTier.replace("TIER_", "T").replace(/_/g, " ") : "HEALTH",
    },
    {
      id: "04_VULNERABILITY" as ModuleTab,
      label: "Early Warning Surveillance",
      hotkey: "[4]",
      icon: AlertTriangle,
      badge: earlyWarningCount > 0 ? `${earlyWarningCount} FLAGS` : "0 FLAGS",
      badgeColor: earlyWarningCount > 0 ? "text-[#EF4444] border-[#EF4444]/40" : "text-[#10B981] border-[#10B981]/40",
    },
    {
      id: "05_SIMULATOR" as ModuleTab,
      label: "Macro Stress Testing",
      hotkey: "[5]",
      icon: Cpu,
      badge: "SIMULATION",
    },
    {
      id: "06_MEMO" as ModuleTab,
      label: "IC Credit Memo & PDF",
      hotkey: "[6]",
      icon: FileText,
      badge: "DECK",
    },
  ];

  return (
    <nav className="border-b border-[#1E2638] bg-[#0A0D12] px-4 flex items-center overflow-x-auto select-none no-print">
      <div className="flex space-x-1 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono transition-colors border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-[#2563EB] text-[#38BDF8] bg-[#0E1524] font-bold"
                  : "border-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0B111E]/40"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#38BDF8]" : "text-[#64748B]"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 border bg-[#07090E] ${
                    tab.badgeColor ? tab.badgeColor : "text-[#718096] border-[#1E2638]"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
