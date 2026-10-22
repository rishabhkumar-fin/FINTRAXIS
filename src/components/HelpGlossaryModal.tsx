"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  BookOpen,
  HelpCircle,
  Compass,
  Keyboard,
  AlertTriangle,
  Layers,
} from "lucide-react";

import {
  GlossaryConcept,
  GLOSSARY_CONCEPTS,
  SOURCE_BADGES_LEGEND,
} from "@/lib/conceptGuideData";

export type { GlossaryConcept };
export { GLOSSARY_CONCEPTS, SOURCE_BADGES_LEGEND };

interface HelpGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConceptId?: string | null;
  onOpenTour?: () => void;
}

export function HelpGlossaryModal({
  isOpen,
  onClose,
  initialConceptId,
  onOpenTour,
}: HelpGlossaryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [highlightedId, setHighlightedId] = useState<string | null>(initialConceptId || null);

  useEffect(() => {
    if (initialConceptId) {
      setHighlightedId(initialConceptId);
      // Auto-scroll to concept
      setTimeout(() => {
        const el = document.getElementById(`concept-${initialConceptId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [initialConceptId, isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredConcepts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return GLOSSARY_CONCEPTS.filter((c) => {
      const matchesCategory = selectedCategory === "ALL" || c.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        c.term.toLowerCase().includes(query) ||
        c.plainMeaning.toLowerCase().includes(query) ||
        c.doesNotTellYou.toLowerCase().includes(query) ||
        (c.formula && c.formula.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-glossary-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 font-mono select-none animate-in fade-in duration-200"
    >
      <div
        className="bg-[#090D16] border border-[#2563EB]/40 max-w-4xl w-full max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#182337] bg-[#0C1220] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2563EB]/15 border border-[#2563EB]/40 rounded-xl text-[#38BDF8]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="help-glossary-title" className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Help, Financial Glossary &amp; Concept Guide</span>
              </h2>
              <p className="text-[11px] text-[#94A3B8]">
                Institutional credit formulas, disclosure standards, and platform usage principles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTour && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTour();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B] hover:bg-[#2563EB] text-[#38BDF8] hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Re-Open Tour</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Help & Glossary"
              className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="p-3 sm:p-4 bg-[#0A0E18] border-b border-[#182337] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, ratios, formulas, or 'What it does NOT tell you'..."
              className="w-full pl-9 pr-4 py-2 bg-[#101625] border border-[#1E293B] focus:border-[#38BDF8] text-white text-xs rounded-xl focus:outline-none placeholder-[#64748B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10.5px]">
            {[
              { id: "ALL", label: "All Concepts" },
              { id: "RATIOS", label: "Credit Ratios" },
              { id: "INDIAN_APPRAISAL", label: "Indian Banking" },
              { id: "SCREENING_MODELS", label: "Distress Models" },
              { id: "STRESS_TESTING", label: "Stress Testing" },
              { id: "DATA_TRUST", label: "Data Integrity & N/D" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#2563EB] text-white font-bold"
                    : "bg-[#101625] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-[#CBD5E1]">
          {/* Source Badges Plain Guide (Always visible at top) */}
          <div className="p-4 bg-[#0E1524] border border-[#1E293B] rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Layers className="w-4 h-4 text-[#38BDF8]" />
              <span>How to Read FINTRAXIS Source Badges</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Every financial figure displays its provenance. Look for the small badge next to a number to know how it was obtained:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SOURCE_BADGES_LEGEND.map((sb, idx) => (
                <div key={idx} className="p-2.5 bg-[#080B12] border border-[#182337] rounded-lg space-y-1">
                  <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded border ${sb.color}`}>
                    {sb.badge}
                  </span>
                  <p className="text-[10px] text-[#94A3B8] leading-relaxed">
                    {sb.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Concepts List */}
          <div className="space-y-4">
            <div className="text-[11px] text-[#64748B] uppercase font-bold tracking-wider flex items-center justify-between border-b border-[#182337] pb-1.5">
              <span>FINANCIAL TERMS &amp; APPRAISAL STANDARDS ({filteredConcepts.length})</span>
              <span>SORTED ALPHABETICALLY</span>
            </div>

            {filteredConcepts.length === 0 ? (
              <div className="p-8 text-center bg-[#0C1220] border border-[#182337] rounded-xl text-[#94A3B8] space-y-2">
                <HelpCircle className="w-6 h-6 text-[#64748B] mx-auto" />
                <p>No concepts matching &ldquo;{searchQuery}&rdquo;.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("ALL");
                  }}
                  className="text-xs text-[#38BDF8] hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConcepts.map((c) => {
                  const isHighlighted = highlightedId === c.id;
                  return (
                    <div
                      key={c.id}
                      id={`concept-${c.id}`}
                      className={`p-4 rounded-xl border transition-all ${
                        isHighlighted
                          ? "bg-[#101C33] border-[#38BDF8] ring-1 ring-[#38BDF8]"
                          : "bg-[#0C1220] border-[#182337] hover:border-[#2563EB]/50"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#182337]/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{c.term}</span>
                          {c.regulatoryStandard && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] rounded">
                              {c.regulatoryStandard}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] px-2 py-0.5 bg-[#182337] text-[#38BDF8] rounded self-start sm:self-auto font-mono">
                          {c.category.replace(/_/g, " ")}
                        </span>
                      </div>

                      {c.formula && (
                        <div className="mt-2.5 p-2 bg-[#06080F] border border-[#1E293B] rounded font-mono text-[11px] text-[#38BDF8]">
                          <strong className="text-[#94A3B8]">Formula: </strong>
                          <span>{c.formula}</span>
                        </div>
                      )}

                      <p className="mt-2 text-xs text-[#CBD5E1] leading-relaxed">
                        {c.plainMeaning}
                      </p>

                      {c.inputs && (
                        <div className="mt-2 text-[11px] text-[#94A3B8]">
                          <strong className="text-white">Inputs used: </strong>
                          <span>{c.inputs}</span>
                        </div>
                      )}

                      {c.thresholds && (
                        <div className="mt-1.5 text-[11px] text-[#94A3B8]">
                          <strong className="text-white">Thresholds &amp; Cut-offs: </strong>
                          <span>{c.thresholds}</span>
                        </div>
                      )}

                      {/* Explicit "What this does NOT tell you" */}
                      <div className="mt-2.5 p-2 bg-[#1F1316] border border-[#F43F5E]/30 rounded text-[11px] text-[#FECDD3] flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#F43F5E] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#F43F5E]">What this does NOT tell you: </strong>
                          <span>{c.doesNotTellYou.replace(/^Does NOT /i, "")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Terminal Keyboard Shortcuts Card */}
          <div className="p-4 bg-[#0C1220] border border-[#182337] rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Keyboard className="w-4 h-4 text-[#38BDF8]" />
              <span>Terminal Keyboard Shortcuts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex justify-between p-2 bg-[#080B12] border border-[#182337] rounded">
                <span className="text-[#94A3B8]">Command Palette</span>
                <span className="font-bold text-[#38BDF8]">Ctrl + K / Cmd + K</span>
              </div>
              <div className="flex justify-between p-2 bg-[#080B12] border border-[#182337] rounded">
                <span className="text-[#94A3B8]">Help &amp; Glossary</span>
                <span className="font-bold text-[#38BDF8]">?</span>
              </div>
              <div className="flex justify-between p-2 bg-[#080B12] border border-[#182337] rounded">
                <span className="text-[#94A3B8]">AI Risk Assistant</span>
                <span className="font-bold text-[#38BDF8]">Ctrl + J</span>
              </div>
              <div className="flex justify-between p-2 bg-[#080B12] border border-[#182337] rounded">
                <span className="text-[#94A3B8]">Methodology Modal</span>
                <span className="font-bold text-[#38BDF8]">Ctrl + M</span>
              </div>
              <div className="flex justify-between p-2 bg-[#080B12] border border-[#182337] rounded">
                <span className="text-[#94A3B8]">Jump to Modules</span>
                <span className="font-bold text-[#38BDF8]">Keys 1 through 7</span>
              </div>
              <div className="flex justify-between p-2 bg-[#080B12] border border-[#182337] rounded">
                <span className="text-[#94A3B8]">Lock Terminal</span>
                <span className="font-bold text-[#F43F5E]">Ctrl + Shift + L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#182337] bg-[#0A0E18] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>FINTRAXIS Institutional Reference &bull; No investment advice</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
