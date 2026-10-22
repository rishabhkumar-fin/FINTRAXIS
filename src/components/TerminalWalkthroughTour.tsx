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
    title: "Login & Session Gate",
    subtitle: "Identity Verification & Clearance",
    targetTab: "overview",
    icon: ShieldCheck,
    description:
      "Access begins with secure authentication or Quick Demo Entry. Sessions auto-lock after 30 minutes of inactivity to protect analysis confidentiality.",
    keyTakeaway: "Enforces role-based clearance before accessing corporate financial records.",
  },
  {
    title: "Choose Corporate Issuer",
    subtitle: "Securities Directory & Master",
    targetTab: "01_HUB",
    icon: Building2,
    description:
      "Search and resolve global entities (e.g. Apple, Reliance Industries, Microsoft, TCS, Toyota). Selecting an issuer synchronizes historical disclosures across all analytical modules.",
    keyTakeaway: "Multi-exchange coverage across US-GAAP, Ind-AS, and global accounting regimes.",
  },
  {
    title: "Read As-Of Dates & Currencies",
    subtitle: "Reporting Period Horizon",
    targetTab: "02_HEALTH",
    icon: Activity,
    description:
      "Financial statement numbers reflect audited fiscal period-end dates (e.g. 31-Mar-2025). Indian entities report in INR Crores (₹ Cr), US entities in USD Millions ($M). Real-time market prices carry distinct delayed timestamps.",
    keyTakeaway: "Never confuse as-of fiscal filing dates with intraday trading quotes.",
  },
  {
    title: "Inspect Figure Provenance",
    subtitle: "Audit Sidecar & Lineage",
    targetTab: "02_HEALTH",
    icon: SlidersHorizontal,
    description:
      "Click or tap any financial figure marked with an audit badge to open the Audit Sidecar. Inspect the exact statutory filing form, filing date, XBRL tag, and deterministic calculation formula.",
    keyTakeaway: "Missing disclosures are shown as N/D, never guessed or replaced with zero.",
  },
  {
    title: "Export Research & Credit Dossier",
    subtitle: "Investment Committee Output",
    targetTab: "07_REPORTS",
    icon: FileText,
    description:
      "Synthesize findings into an institutional Investment Committee memo. Export to A4 PDF, RFC 4180 CSV, or Excel XML spreadsheet with cryptographic SHA-256 data transit digest.",
    keyTakeaway: "Print-ready, auditable underwriting documentation.",
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
      try {
        localStorage.setItem("fintraxis_tour_completed", "true");
      } catch {}
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
    try {
      localStorage.setItem("fintraxis_tour_completed", "true");
    } catch {}
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
