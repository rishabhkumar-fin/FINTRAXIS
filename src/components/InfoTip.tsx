"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, X, ExternalLink, HelpCircle } from "lucide-react";
import { getTermDefinition, GlossaryTerm } from "@/lib/glossary";

interface InfoTipProps {
  termId: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  onOpenGlossary?: (termId: string) => void;
  className?: string;
}

export function InfoTip({
  termId,
  children,
  showIcon = true,
  onOpenGlossary,
  className = "",
}: InfoTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const term: GlossaryTerm | undefined = getTermDefinition(termId);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  if (!term) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span ref={containerRef} className="relative inline-flex items-center gap-1">
      {/* Clickable Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-0.5 cursor-pointer text-inherit hover:text-[#38BDF8] transition-colors ${
          children ? "border-b border-dotted border-[#38BDF8]/60" : ""
        } ${className}`}
        title={`Click for formula & explanation: ${term.name}`}
      >
        {children || <span className="font-medium">{term.name}</span>}
        {showIcon && <HelpCircle className="w-3 h-3 text-[#38BDF8]/70 hover:text-[#38BDF8] inline shrink-0" />}
      </button>

      {/* Floating Popover / Educational Card */}
      {isOpen && (
        <div
          className="absolute z-50 bottom-full left-0 mb-2 w-72 sm:w-80 p-3 bg-[#0D1424] border border-[#2563EB]/40 rounded-xl shadow-2xl text-xs font-mono text-[#F8FAFC] select-none animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-[#38BDF8]">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{term.name}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#64748B] hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Formula */}
          {term.formula && (
            <div className="mb-2 p-1.5 bg-[#05070B] border border-[#182337] rounded text-[10px] text-[#F59E0B] font-mono break-words">
              <span className="text-[#64748B] block text-[9px] uppercase font-bold">Mathematical Formula:</span>
              {term.formula}
            </div>
          )}

          {/* Plain English Summary */}
          <div className="mb-2 text-[10.5px] text-[#CBD5E1] leading-relaxed">
            <span className="text-[#38BDF8] font-bold block text-[9.5px] uppercase">Plain-English Takeaway:</span>
            {term.plainEnglishSummary}
          </div>

          {/* Institutional Benchmark */}
          <div className="mb-2 text-[10px] text-[#10B981] bg-[#10B981]/10 p-1.5 rounded border border-[#10B981]/20">
            <span className="font-bold block text-[9px] uppercase">Institutional Hurdle:</span>
            {term.benchmarkRuleOfThumb}
          </div>

          {/* Full Glossary Link */}
          {onOpenGlossary && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenGlossary(term.id);
              }}
              className="w-full mt-1 py-1 text-[10px] text-[#38BDF8] hover:text-white bg-[#101A2E] hover:bg-[#1E293B] border border-[#2563EB]/30 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer font-bold"
            >
              <span>Open in Full Glossary</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </span>
  );
}
