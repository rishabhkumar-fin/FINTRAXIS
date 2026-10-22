"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { HealthRatios } from "./HealthRatios";
import { StatementsLedger } from "./StatementsLedger";
import { ModuleTab } from "./NavigationTabs";
import { WorkstationHeader, WorkstationNextStep } from "./WorkstationNav";

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
      {/* Workstation Standard Institutional Header */}
      <WorkstationHeader
        code="DESK 02"
        title="Financial Health & 3-Statement Solvency Workspace"
        company={company}
        period={profile.periods[0]?.period}
        filingForm={profile.periods[0]?.filingForm}
        question="Can this company comfortably service its debt obligations, and how do its balance sheet and cash flows trend over audited periods?"
      >
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setSubView("RATIOS")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors cursor-pointer ${
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors cursor-pointer ${
              subView === "STATEMENTS"
                ? "bg-[#2563EB] text-white font-bold"
                : "bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>3-Statement Ledger (XBRL)</span>
          </button>
        </div>
      </WorkstationHeader>

      {/* Render selected view */}
      {subView === "RATIOS" ? (
        <HealthRatios
          profile={profile}
          onAuditMetric={onAuditMetric}
          onNavigateToTab={onNavigateToTab}
        />
      ) : (
        <StatementsLedger
          profile={profile}
          onAuditMetric={onAuditMetric}
          activeAuditKey={activeAuditKey}
        />
      )}

      {/* Sequential Next Step in Workflow */}
      <WorkstationNextStep
        currentTab="02_HEALTH"
        nextTab="03_VULNERABILITY"
        nextTitle="Financial Vulnerability Monitor"
        nextCode="DESK 03"
        reason="Identify balance sheet deterioration, debt maturity walls, working capital leaks, and Basel III early warning flags."
        onNavigate={(tab) => onNavigateToTab?.(tab)}
        relatedLinks={[
          { tab: "overview", label: "Executive Overview" },
          { tab: "04_DEPENDENCIES", label: "Business Dependencies" },
        ]}
      />
    </div>
  );
}
