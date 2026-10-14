"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight, Sparkles } from "lucide-react";
import { ModuleTab } from "./NavigationTabs";
import { MODULE_REGISTRY } from "@/config/modules";

interface WorkflowBannerProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  selectedTicker?: string;
}

const TAB_MAP: Record<string, ModuleTab> = {
  hub: "01_HUB",
  ledger: "02_STATEMENTS",
  health: "03_HEALTH",
  vulnerability: "04_VULNERABILITY",
  stress: "05_SIMULATOR",
  ic: "06_MEMO",
};

export function WorkflowBanner({ activeTab, onSelectTab, selectedTicker }: WorkflowBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4 bg-[#0D111A] border border-[#1E2536] overflow-hidden font-mono text-xs select-none no-print rounded">
      <div className="px-3.5 py-2 flex items-center justify-between border-b border-[#1E2536] bg-[#111622]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="font-bold text-[#F8FAFC] tracking-wider text-[11px] uppercase">
            INSTITUTIONAL UNDERWRITING WORKFLOW
          </span>
          {selectedTicker && (
            <span className="text-[10px] text-[#94A3B8]">
              &bull; Active Subject: <strong className="text-[#38BDF8]">{selectedTicker}</strong>
            </span>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1 transition-colors"
        >
          <span>{isExpanded ? "Collapse Guide" : "Expand Guide"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#090D14]">
          {MODULE_REGISTRY.map((mod, idx) => {
            const targetTab = TAB_MAP[mod.id];
            const isCurrent = activeTab === targetTab;
            return (
              <button
                key={mod.id}
                onClick={() => onSelectTab(targetTab)}
                className={`p-2.5 text-left border transition-all rounded ${
                  isCurrent
                    ? "bg-[#162033] border-[#38BDF8] shadow-sm text-[#F8FAFC]"
                    : "bg-[#0D111A] border-[#1E2536] hover:border-[#2A364F] text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9.5px] font-bold ${isCurrent ? "text-[#38BDF8]" : "text-[#64748B]"}`}>
                    {mod.deskTag || `STAGE 0${idx + 1}`}
                  </span>
                  {idx < MODULE_REGISTRY.length - 1 && <ArrowRight className="w-3 h-3 text-[#475569] hidden lg:block" />}
                </div>

                <div className="text-xs font-semibold mt-0.5 truncate text-[#F8FAFC]">
                  {mod.name}
                </div>

                <div className="text-[9.5px] text-[#64748B] mt-0.5 truncate leading-tight">
                  {mod.shortDesc}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
