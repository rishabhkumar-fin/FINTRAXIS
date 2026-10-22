"use client";

import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp, Database, Eye, Compass } from "lucide-react";
import {
  AboutModuleData,
  MODULE_ABOUT_MAP,
} from "@/lib/conceptGuideData";

export type { AboutModuleData };
export { MODULE_ABOUT_MAP };

interface AboutModulePanelProps {
  moduleKey: string;
  customData?: AboutModuleData;
  onOpenGlossary?: () => void;
}

export function AboutModulePanel({
  moduleKey,
  customData,
  onOpenGlossary,
}: AboutModulePanelProps) {
  const data = customData || MODULE_ABOUT_MAP[moduleKey] || {
    title: "Terminal Analytical Module",
    whatItShows: "Credit analysis and financial statement surveillance data.",
    whereDataComesFrom: "Statutory company regulatory filings and calculation engines.",
    howToReadIt: "Review metrics against calibrated credit policy hurdles and examine data provenance.",
  };

  const storageKey = `fintraxis_about_${moduleKey}`;

  // Collapsed by default, remembered per user in localStorage (wrapped in try/catch)
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === "true";
    } catch {
      return false;
    }
  });

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    try {
      localStorage.setItem(storageKey, String(next));
    } catch {}
  };

  return (
    <div className="mb-4 bg-[#0A0E17] border border-[#182337] rounded-xl overflow-hidden font-mono text-xs select-none">
      {/* Collapsed Bar Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-3.5 py-2 flex items-center justify-between bg-[#0B101C] hover:bg-[#101726] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="font-bold tracking-wider text-[#38BDF8] text-[11px] uppercase">
            About this module
          </span>
          <span className="text-[#334155]">&bull;</span>
          <span className="text-[10.5px] text-[#CBD5E1] hidden sm:inline">{data.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-semibold">
            {isOpen ? "[Collapse info]" : "[Expand info]"}
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </div>
      </button>

      {/* Expanded 3-Line Institutional Panel */}
      {isOpen && (
        <div className="p-4 bg-[#070A10] border-t border-[#182337] grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-150">
          {/* Line 1: What it shows */}
          <div className="p-3 bg-[#0C1220] border border-[#182337] rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#38BDF8] text-[10.5px] font-bold uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>What it shows</span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {data.whatItShows}
            </p>
          </div>

          {/* Line 2: Where the data comes from */}
          <div className="p-3 bg-[#0C1220] border border-[#182337] rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#10B981] text-[10.5px] font-bold uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Where the data comes from</span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {data.whereDataComesFrom}
            </p>
          </div>

          {/* Line 3: How to read it */}
          <div className="p-3 bg-[#0C1220] border border-[#182337] rounded-lg space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[#F59E0B] text-[10.5px] font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>How to read it</span>
              </div>
              <p className="text-[11px] text-[#CBD5E1] leading-relaxed mt-1">
                {data.howToReadIt}
              </p>
            </div>
            {onOpenGlossary && (
              <button
                type="button"
                onClick={onOpenGlossary}
                className="mt-2 text-[10px] text-[#38BDF8] hover:text-white hover:underline flex items-center gap-1 self-start cursor-pointer"
              >
                <span>Open full concept guide &rarr;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
