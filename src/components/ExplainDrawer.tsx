"use client";

import React, { useEffect } from "react";
import { X, BookOpen, Scale, HelpCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { getTermDefinition, GlossaryTerm } from "@/lib/glossary";
import { CompanyEntity, FinancialPeriodData } from "@/lib/types";
import { formatFinancialValue } from "@/lib/formatters";

export interface ExplainMetricContext {
  termId: string;
  metricLabel: string;
  currentValue: number | string | null;
  unit?: string;
  formulaSubstitution?: string;
  hurdleText?: string;
  isBreached?: boolean;
}

interface ExplainDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context: ExplainMetricContext | null;
  company?: CompanyEntity;
  period?: FinancialPeriodData;
  onOpenFullGlossary?: (termId: string) => void;
}

export function ExplainDrawer({
  isOpen,
  onClose,
  context,
  company,
  onOpenFullGlossary,
}: ExplainDrawerProps) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !context) return null;

  const term: GlossaryTerm | undefined = getTermDefinition(context.termId);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-mono text-xs select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0A0E18] border-l border-[#1E293B] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-[#1E293B] bg-[#070A10] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#38BDF8]" />
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                ANALYST EXPLAIN DRAWER
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[#64748B] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Metric Title & Value Banner */}
            <div className="p-3 bg-[#0D1424] border border-[#2563EB]/40 rounded-xl space-y-1">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">
                {company ? `${company.name} (${company.symbol})` : "TARGET ISSUER"}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-white">{context.metricLabel}</span>
                <span className="text-xl font-black font-mono text-[#38BDF8]">
                  {context.currentValue !== null && context.currentValue !== undefined
                    ? `${context.currentValue}${context.unit ? ` ${context.unit}` : ""}`
                    : "N/D"}
                </span>
              </div>
              {context.hurdleText && (
                <div className="text-[10px] text-[#94A3B8] flex items-center gap-1.5 pt-1 border-t border-[#1E293B]">
                  <Scale className="w-3 h-3 text-[#38BDF8]" />
                  <span>Institutional Reference: {context.hurdleText}</span>
                </div>
              )}
            </div>

            {/* Formula & Live Input Substitution */}
            {term?.formula && (
              <div className="p-3 bg-[#05070B] border border-[#182337] rounded-xl space-y-2">
                <span className="text-[10px] text-[#64748B] uppercase font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>MATHEMATICAL FORMULATION</span>
                </span>
                <div className="p-2 bg-[#0A0E18] border border-[#1E293B] rounded text-[11px] text-[#F59E0B] font-mono break-words">
                  {term.formula}
                </div>
                {context.formulaSubstitution && (
                  <div className="text-[10px] text-[#94A3B8] space-y-0.5 pt-1">
                    <span className="text-[#38BDF8] font-bold block">Substituted Filing Inputs:</span>
                    <div className="p-2 bg-[#0A0E18] border border-[#1E293B] rounded text-white font-mono break-words">
                      {context.formulaSubstitution}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plain English Summary */}
            <div className="p-3 bg-[#05070B] border border-[#182337] rounded-xl space-y-1.5">
              <span className="text-[10px] text-[#38BDF8] uppercase font-bold block">
                WHAT THIS MEANS IN BUSINESS REALITY
              </span>
              <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
                {term?.plainEnglishSummary || "Standard financial health indicator."}
              </p>
            </div>

            {/* Examiner / Credit Committee View */}
            <div className="p-3 bg-[#05070B] border border-[#182337] rounded-xl space-y-1.5">
              <span className="text-[10px] text-[#10B981] uppercase font-bold block">
                CREDIT APPRAISAL &amp; VIVA EXAMINER CONTEXT
              </span>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                {term?.examinerExplanation || "Used by risk committees to assess debt capacity and solvency."}
              </p>
            </div>

            {/* Pitfalls & Caveats */}
            {term?.pitfallsAndCaveats && (
              <div className="p-3 bg-[#180A0E] border border-[#EF4444]/30 rounded-xl space-y-1.5">
                <span className="text-[10px] text-[#EF4444] uppercase font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>ANALYTICAL PITFALLS &amp; CAVEATS</span>
                </span>
                <p className="text-[11px] text-[#E2E8F0] leading-relaxed">
                  {term.pitfallsAndCaveats}
                </p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 border-t border-[#1E293B] bg-[#070A10]">
            {onOpenFullGlossary && term && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFullGlossary(term.id);
                }}
                className="w-full py-2 bg-[#101A2E] hover:bg-[#1E293B] border border-[#2563EB]/40 text-[#38BDF8] hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                View Full Glossary Entry ({term.name})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
