"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Building2,
  Activity,
  SlidersHorizontal,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { ModuleTab } from "./NavigationTabs";

interface WalkthroughStep {
  title: string;
  subtitle: string;
  targetTab?: ModuleTab;
  description: string;
  keyTakeaway: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOUR_STEPS: WalkthroughStep[] = [
  {
    title: "1. Institutional Credit Terminal Architecture",
    subtitle: "End-to-End Auditable Financial Intelligence",
    targetTab: "overview",
    icon: ShieldCheck,
    description:
      "Welcome to FINTRAXIS. The terminal automates institutional credit underwriting across a disciplined 8-step linear workflow, replacing error-prone manual spreadsheets with deterministic financial ratios and regulatory audit trails.",
    keyTakeaway: "Designed for banking credit officers, rating analysts, and academic examiners.",
  },
  {
    title: "2. Global Securities Master & Issuer Directory",
    subtitle: "US-GAAP, Ind-AS & FSA Japan Coverage",
    targetTab: "01_HUB",
    icon: Building2,
    description:
      "Select pre-seeded issuers (e.g., Apple, Reliance Industries, TCS, Microsoft) or ingest global symbols. Indian entities report in INR Crores (₹ Cr) under Ind-AS; US entities report in USD Millions ($M) under US-GAAP.",
    keyTakeaway: "Switching issuers carries the active entity across all 8 analytical workstations.",
  },
  {
    title: "3. Solvency & 3-Statement Balance Identity",
    subtitle: "Assets = Liabilities + Stockholders' Equity",
    targetTab: "02_HEALTH",
    icon: Activity,
    description:
      "Verify the 3-statement XBRL ledger. A real-time mathematical identity badge verifies that Total Assets equal Liabilities + Equity within a strict ±0.01% statutory rounding tolerance. Click any cell to open the audited disclosure sidecar.",
    keyTakeaway: "Zero division and missing line items are handled with typed, transparent disclosures.",
  },
  {
    title: "4. Deterministic Macro Stress Simulator",
    subtitle: "Revenue Contraction & Central Bank Rate Shocks",
    targetTab: "06_SIMULATOR",
    icon: SlidersHorizontal,
    description:
      "Test how adverse macroeconomic scenarios impact debt covenants. Adjust sales contractions, COGS inflation, and policy rate hikes (+bps). The pro-forma engine calculates stressed Net Debt/EBITDA, interest coverage, and cash runway.",
    keyTakeaway: "Pure deterministic sensitivity mathematics, not black-box machine learning.",
  },
  {
    title: "5. Investment Committee Dossier & Verification",
    subtitle: "Cryptographic SHA-256 Provenance Stamp",
    targetTab: "07_REPORTS",
    icon: FileText,
    description:
      "Synthesize your analysis into an executive credit memo. Present via the interactive slide deck or review the complete dossier. Export directly to A4 PDF or download RFC 4180 CSV with immutable SHA-256 audit digests.",
    keyTakeaway: "Ready for supervisory sign-off and university viva evaluation.",
  },
];

interface TerminalWalkthroughTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: ModuleTab) => void;
}

export function TerminalWalkthroughTour({
  isOpen,
  onClose,
  onNavigateToTab,
}: TerminalWalkthroughTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem("fintraxis_tour_completed", "true");
      onClose();
    } else {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const nextTab = TOUR_STEPS[nextIndex].targetTab;
      if (nextTab) onNavigateToTab(nextTab);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      const prevTab = TOUR_STEPS[prevIndex].targetTab;
      if (prevTab) onNavigateToTab(prevTab);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("fintraxis_tour_completed", "true");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none animate-in fade-in duration-200"
    >
      <div
        className="bg-[#0B1220] border border-[#2563EB]/50 max-w-xl w-full rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#10B981]" />

        {/* Top Meta Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#38BDF8] text-[10px] font-bold rounded">
              GUIDED WALKTHROUGH
            </span>
            <span className="text-[10px] text-[#64748B]">
              Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-[11px] text-[#94A3B8] hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>Skip Tour</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Header */}
        <div className="flex items-start gap-3 mt-1">
          <div className="p-2.5 bg-[#101A2E] border border-[#2563EB]/40 rounded-xl text-[#38BDF8] shrink-0 mt-0.5">
            <StepIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#38BDF8] font-bold uppercase tracking-wider block">
              {currentStep.subtitle}
            </span>
            <h3 id="tour-step-title" className="text-base sm:text-lg font-bold text-white mt-0.5">
              {currentStep.title}
            </h3>
          </div>
        </div>

        {/* Step Body */}
        <p className="text-xs text-[#CBD5E1] leading-relaxed">
          {currentStep.description}
        </p>

        {/* Key Takeaway Box */}
        <div className="p-3 bg-[#070A0F] border border-[#182337] rounded-xl flex items-center gap-2.5 text-xs text-[#94A3B8]">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>
            <strong className="text-white">Institutional Value:</strong> {currentStep.keyTakeaway}
          </span>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentStepIndex(idx);
                const t = TOUR_STEPS[idx].targetTab;
                if (t) onNavigateToTab(t);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStepIndex
                  ? "w-8 bg-[#38BDF8]"
                  : idx < currentStepIndex
                  ? "w-3 bg-[#2563EB]"
                  : "w-3 bg-[#1E293B]"
              }`}
              aria-label={`Jump to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#182337] mt-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="px-3.5 py-2 bg-[#101A2E] hover:bg-[#1E293B] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-[#94A3B8] hover:text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-[#2563EB]/40 cursor-pointer"
          >
            <span>{isLast ? "Complete Tour & Enter Terminal" : "Next Station"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
