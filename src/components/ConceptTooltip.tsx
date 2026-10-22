"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, X } from "lucide-react";
import { GLOSSARY_CONCEPTS } from "@/lib/conceptGuideData";

export type ConceptId =
  | "net-debt"
  | "net-debt-ebitda"
  | "interest-coverage"
  | "current-ratio"
  | "quick-ratio"
  | "cash-ratio"
  | "free-cash-flow"
  | "margins"
  | "roe-roa"
  | "tol-tnw"
  | "dscr"
  | "altman-z"
  | "beneish-m"
  | "hhi"
  | "covenant-headroom"
  | "floating-debt"
  | "as-of-dates"
  | "nd-explainer"
  | "promoter-pledge"
  | "drawing-power"
  | "contingent-liabilities";

interface ConceptTooltipProps {
  conceptId: ConceptId;
  children?: React.ReactNode;
  missingInput?: string;
  filingSource?: string;
  onOpenGlossary?: (id?: string) => void;
  className?: string;
}

export function ConceptTooltip({
  conceptId,
  children,
  missingInput,
  filingSource,
  onOpenGlossary,
  className = "",
}: ConceptTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const concept = GLOSSARY_CONCEPTS.find((c) => c.id === conceptId);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const plainText = concept?.plainMeaning || "Credit analysis term.";
  const doesNotTellYou = concept?.doesNotTellYou;

  return (
    <span ref={containerRef} className={`relative inline-flex items-center gap-1 ${className}`}>
      {children}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onKeyDown={handleKeyDown}
        aria-label={`About ${concept?.term || conceptId}`}
        aria-expanded={isOpen}
        className="p-0.5 text-[#64748B] hover:text-[#38BDF8] focus:text-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] rounded cursor-pointer transition-colors inline-flex items-center"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {/* Tooltip Popover (Touch & Keyboard accessible) */}
      {isOpen && (
        <span
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3 bg-[#0C1220] border border-[#2563EB]/60 rounded-xl shadow-2xl font-mono text-left animate-in fade-in zoom-in-95 duration-150 select-text"
        >
          {/* Header */}
          <span className="flex items-center justify-between border-b border-[#1E293B] pb-1.5 mb-1.5">
            <span className="font-bold text-white text-[11px] truncate">
              {concept?.term || conceptId}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-[#64748B] hover:text-white p-0.5 cursor-pointer"
              aria-label="Close tooltip"
            >
              <X className="w-3 h-3" />
            </button>
          </span>

          {/* Definition */}
          <span className="block text-[11px] text-[#CBD5E1] leading-relaxed mb-2">
            {plainText}
          </span>

          {/* N/D Explainer Specifics */}
          {conceptId === "nd-explainer" && (missingInput || filingSource) && (
            <span className="block p-2 bg-[#1A130B] border border-[#F59E0B]/30 rounded text-[10.5px] text-[#FDE68A] mb-2 leading-relaxed">
              {missingInput && (
                <span className="block">
                  <strong className="text-white">Missing Input:</strong> {missingInput}
                </span>
              )}
              {filingSource && (
                <span className="block mt-0.5">
                  <strong className="text-white">Filing line item needed:</strong> {filingSource}
                </span>
              )}
            </span>
          )}

          {/* What this does NOT tell you */}
          {doesNotTellYou && conceptId !== "nd-explainer" && (
            <span className="block p-1.5 bg-[#1F1316] border border-[#F43F5E]/30 rounded text-[10px] text-[#FECDD3] leading-relaxed mb-2">
              <strong className="text-[#F43F5E]">What this does NOT tell you: </strong>
              <span>{doesNotTellYou.replace(/^Does NOT /i, "")}</span>
            </span>
          )}

          {/* Learn More in Glossary Link */}
          {onOpenGlossary && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onOpenGlossary(conceptId);
              }}
              className="text-[10px] text-[#38BDF8] hover:text-white hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <span>Learn more in Glossary &rarr;</span>
            </button>
          )}

          {/* Popover Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#0C1220]" />
        </span>
      )}
    </span>
  );
}
