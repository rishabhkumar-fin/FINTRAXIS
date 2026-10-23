"use client";

import React, { useState, useEffect } from "react";
import { Building2, Search, Compass, X, ArrowRight } from "lucide-react";
import { PeacockLogo } from "./PeacockLogo";

interface FirstTimeWelcomeCardProps {
  onExploreSample: () => void;
  onSearchCompany: () => void;
  onTakeTour: () => void;
}

export function FirstTimeWelcomeCard({
  onExploreSample,
  onSearchCompany,
  onTakeTour,
}: FirstTimeWelcomeCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("fintraxis_welcome_dismissed") === "true";
      if (!dismissed) {
        setIsOpen(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fintraxis_welcome_dismissed", "true");
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-fade-in no-print">
      <div className="bg-[#101621] border border-[#253247] shadow-2xl rounded-2xl max-w-lg w-full p-6 sm:p-7 relative flex flex-col gap-5 text-[#F3F6FC]">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 text-[#9AA8BC] hover:text-white rounded-lg hover:bg-[#151E2D] transition-colors cursor-pointer"
          aria-label="Dismiss welcome card"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand & Header */}
        <div className="flex items-center gap-3">
          <PeacockLogo size="md" showLockup={false} />
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Welcome to FINTRAXIS</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#3867F5]/20 text-[#38BDF8] border border-[#3867F5]/40 rounded-full font-bold">
                READY
              </span>
            </h2>
            <p className="text-xs text-[#9AA8BC] mt-0.5">
              Corporate financial intelligence, solvency health, and stress testing.
            </p>
          </div>
        </div>

        {/* 3 Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Action 1: Explore a sample company */}
          <button
            onClick={() => {
              handleDismiss();
              onExploreSample();
            }}
            className="p-3 bg-[#151E2D] hover:bg-[#1D293D] border border-[#253247] hover:border-[#38BDF8] rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#3867F5]/20 flex items-center justify-center text-[#38BDF8] shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#38BDF8] transition-colors">
                  Explore a sample company
                </div>
                <div className="text-[11px] text-[#9AA8BC]">
                  Load Tata Consultancy Services (TCS) to inspect 3-statement health and solvency.
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9AA8BC] group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Action 2: Search a company */}
          <button
            onClick={() => {
              handleDismiss();
              onSearchCompany();
            }}
            className="p-3 bg-[#151E2D] hover:bg-[#1D293D] border border-[#253247] hover:border-[#38BDF8] rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#16A879]/20 flex items-center justify-center text-[#16A879] shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#16A879] transition-colors">
                  Search a company
                </div>
                <div className="text-[11px] text-[#9AA8BC]">
                  Find enrolled issuers by ticker, ISIN, company name, or exchange.
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9AA8BC] group-hover:text-[#16A879] group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Action 3: Take a 1-minute tour */}
          <button
            onClick={() => {
              handleDismiss();
              onTakeTour();
            }}
            className="p-3 bg-[#151E2D] hover:bg-[#1D293D] border border-[#253247] hover:border-[#F5B942] rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5B942]/20 flex items-center justify-center text-[#F5B942] shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#F5B942] transition-colors">
                  Take a 1-minute tour
                </div>
                <div className="text-[11px] text-[#9AA8BC]">
                  Walk through the 6 key terminal workstations and learn how to interpret risk signals.
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9AA8BC] group-hover:text-[#F5B942] group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>

        {/* Footer with skip option */}
        <div className="pt-2 border-t border-[#253247] flex items-center justify-between text-xs font-mono">
          <span className="text-[#9AA8BC] text-[11px]">This welcome appears only once.</span>
          <button
            onClick={handleDismiss}
            className="text-xs font-bold text-[#38BDF8] hover:text-white transition-colors cursor-pointer"
          >
            Skip &amp; Start Analysis &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
