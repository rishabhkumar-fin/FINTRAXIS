"use client";

import React, { useState } from "react";
import {
  Activity,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { HealthRatios } from "./HealthRatios";
import { StatementsLedger } from "./StatementsLedger";
import { ModuleTab } from "./NavigationTabs";

interface FinancialHealthWorkspaceProps {
  profile: CompanyRiskProfile;
  onAuditMetric: (
    metricKey: string,
    period: string,
    label: string,
    value?: number | null
  ) => void;
  activeAuditKey?: string | null;
  onNavigateToTab?: (tab: ModuleTab) => void;
}

export function FinancialHealthWorkspace({
  profile,
  onAuditMetric,
  activeAuditKey,
  onNavigateToTab,
}: FinancialHealthWorkspaceProps) {
  const [subView, setSubView] = useState<"RATIOS" | "STATEMENTS">("RATIOS");
  const company = profile.company;

  return (
    <div className="space-y-6">
      {/* Module 2 Header */}
      <div className="bg-[#0D121F] border border-[#1E293B] rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                MODULE 2
              </span>
              <span className="text-xs font-mono text-[#64748B]">
                FINANCIAL HEALTH & 3-STATEMENT ACCOUNTING VERIFICATION
              </span>
            </div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5 font-mono">
              <Activity className="w-5 h-5 text-[#38BDF8]" />
              Financial Health Analysis
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              Examines the solvency, liquidity, profitability margins, and multi-period financial
              statements for <span className="text-white font-medium">{company.name} ({company.symbol})</span>.
              All metrics are computed deterministically from verified regulatory filings.
            </p>
          </div>

          {/* Sub-view switcher buttons */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setSubView("RATIOS")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                subView === "RATIOS"
                  ? "bg-[#2563EB] text-white font-bold"
                  : "bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Solvency & Health Ratios</span>
            </button>
            <button
              onClick={() => setSubView("STATEMENTS")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                subView === "STATEMENTS"
                  ? "bg-[#2563EB] text-white font-bold"
                  : "bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>3-Statement Ledger (XBRL)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render selected view */}
      {subView === "RATIOS" ? (
        <HealthRatios profile={profile} onAuditMetric={onAuditMetric} />
      ) : (
        <StatementsLedger
          profile={profile}
          onAuditMetric={onAuditMetric}
          activeAuditKey={activeAuditKey}
        />
      )}

      {/* Sequential Next Step Recommendation Card */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-[#38BDF8]/30 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#38BDF8] font-bold">
            RECOMMENDED WORKFLOW STEP 3 OF 6
          </div>
          <div className="text-sm font-bold text-white mt-1">
            Next: Investigate Vulnerabilities & Early Warning Signals
          </div>
          <div className="text-xs text-[#94A3B8] mt-0.5">
            Identify balance sheet deterioration, debt maturity walls, working capital leaks, and Basel III risk flags.
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab?.("03_VULNERABILITY")}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded transition-colors shadow-lg shadow-[#2563EB]/30 shrink-0"
        >
          <span>Investigate Warnings (Module 3)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
