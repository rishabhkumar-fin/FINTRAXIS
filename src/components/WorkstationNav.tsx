"use client";

import React from "react";
import { ArrowRight, Building2, CheckCircle2, HelpCircle } from "lucide-react";
import { CompanyEntity } from "@/lib/types";
import { ModuleTab } from "./NavigationTabs";

interface WorkstationHeaderProps {
  code?: string;
  title: string;
  company?: CompanyEntity | null;
  period?: string | null;
  filingForm?: string | null;
  question: string;
  badgeText?: string;
  children?: React.ReactNode;
}

export function WorkstationHeader({
  code,
  title,
  company,
  period,
  filingForm,
  question,
  badgeText,
  children,
}: WorkstationHeaderProps) {
  // Strip any legacy visible module numbers like "DESK 01"
  const cleanCode = code ? code.replace(/^DESK\s*\d+\s*:?\s*/i, "").trim() : "";

  return (
    <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-4 sm:p-5 font-mono mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {/* Top meta tags */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[10px]">
            {cleanCode && (
              <span className="px-2 py-0.5 bg-[#2563EB]/15 border border-[#2563EB]/40 text-[#38BDF8] font-bold rounded">
                {cleanCode}
              </span>
            )}
            {badgeText && (
              <span className="px-2 py-0.5 bg-[#151E2D] border border-[#253247] text-[#9AA8BC] rounded">
                {badgeText}
              </span>
            )}
            {company && (
              <span className="px-2 py-0.5 bg-[#151E2D] border border-[#253247] text-[#CBD5E1] rounded flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#38BDF8]" />
                <strong className="text-white">{company.name}</strong> ({company.symbol} &bull; {company.exchange})
              </span>
            )}
            {period && (
              <span className="px-2 py-0.5 bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] font-bold rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                <span>Audited: {period} {filingForm ? `(${filingForm})` : ""}</span>
              </span>
            )}
          </div>

          {/* Heading */}
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
          </h1>

          {/* Core Analytical Question */}
          <div className="flex items-start gap-1.5 text-xs text-[#94A3B8] mt-1.5 leading-relaxed max-w-3xl">
            <HelpCircle className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">What this workstation answers:</strong> {question}
            </span>
          </div>
        </div>

        {/* Right slot for primary action or view toggles */}
        {children && (
          <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

interface WorkstationNextStepProps {
  currentTab: ModuleTab;
  nextTab: ModuleTab;
  nextTitle: string;
  nextCode?: string;
  reason: string;
  onNavigate: (tab: ModuleTab) => void;
  relatedLinks?: Array<{
    tab: ModuleTab;
    label: string;
  }>;
}

export function WorkstationNextStep({
  nextTab,
  nextTitle,
  nextCode,
  reason,
  onNavigate,
  relatedLinks = [],
}: WorkstationNextStepProps) {
  const cleanNextCode = nextCode ? nextCode.replace(/^DESK\s*\d+\s*:?\s*/i, "").trim() : "";

  return (
    <div className="mt-8 pt-5 border-t border-[#182337] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
      <div>
        <div className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
          <span>RECOMMENDED NEXT STEP IN ANALYSIS</span>
        </div>
        <p className="text-[11px] text-[#94A3B8] leading-relaxed max-w-xl">
          {reason}
        </p>

        {relatedLinks.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[10px] text-[#64748B]">Also see:</span>
            {relatedLinks.map((link) => (
              <button
                key={link.tab}
                type="button"
                onClick={() => onNavigate(link.tab)}
                className="text-[10px] text-[#38BDF8] hover:text-white hover:underline cursor-pointer"
              >
                {link.label} &rarr;
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onNavigate(nextTab)}
        className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md hover:translate-x-0.5 shrink-0"
      >
        <span>Continue to {nextTitle}</span>
        {cleanNextCode && (
          <span className="text-[10px] px-1.5 py-0.5 bg-black/20 rounded font-normal">
            {cleanNextCode}
          </span>
        )}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
