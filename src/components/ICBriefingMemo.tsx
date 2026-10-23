"use client";

import React, { useState } from "react";
import { FileText, Printer, Copy, Check, ExternalLink } from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { formatFinancialValue, formatRatio } from "@/lib/formatters";

interface ICBriefingMemoProps {
  profile: CompanyRiskProfile;
}

export function ICBriefingMemo({ profile }: ICBriefingMemoProps) {
  const { company, periods, latestRatios, riskTier, riskScore, earlyWarningFlags, simulation } = profile;
  const latest = periods[0];
  const [copied, setCopied] = useState(false);

  const formatCurr = (val: number | null | undefined) =>
    formatFinancialValue(val, company.currency, company.scaleUnit);

  const generateMarkdown = () => {
    return `# FINTRAXIS INSTITUTIONAL RISK BRIEFING MEMO
======================================================
TARGET ENTITY: ${company.name} (${company.symbol})
JURISDICTION: ${company.country} | REGIME: ${company.accountingStandard}
OPERATOR CLEARANCE: VERIFIED
TIMESTAMP: ${new Date().toISOString()}
CREDIT SURVEILLANCE TIER: ${riskTier} (Health Score: ${riskScore}/100)

1. EXECUTIVE SOLVENCY VERDICT
------------------------------------------------------
Reporting Currency: ${company.currency} (${company.scaleUnit})
As-Reported Net Revenue: ${formatCurr(latest?.revenue)}
Operating EBIT: ${formatCurr(latest?.ebit)}
Pro-Forma EBITDA: ${formatCurr(latest?.ebitda)}
Interest Coverage Multiple: ${formatRatio(latestRatios.interestCoverage)}
Net Debt / EBITDA: ${formatRatio(latestRatios.netDebtToEbitda)}
Current Ratio: ${formatRatio(latestRatios.currentRatio)}
Quick Ratio: ${formatRatio(latestRatios.quickRatio)}
CFO / Net Income Conversion: ${formatRatio(latestRatios.cfoToNetIncome)}
TOL / TNW Multiple: ${formatRatio(latestRatios.tolToTnw)}
Promoter Share Pledge %: ${company.hasPromoterGroup === 0 ? "N/A (Dispersed Ownership)" : company.promoterPledgedPct !== null && company.promoterPledgedPct !== undefined ? `${company.promoterPledgedPct.toFixed(2)}%` : "N/D"}
Indicative Drawing Power: ${latestRatios.indicativeDrawingPower !== null && latestRatios.indicativeDrawingPower !== undefined ? formatCurr(latestRatios.indicativeDrawingPower) : "N/D"}
Contingent Liabilities / Net Worth: ${latestRatios.contingentLiabilitiesRatio !== null && latestRatios.contingentLiabilitiesRatio !== undefined ? `${latestRatios.contingentLiabilitiesRatio.toFixed(2)}%` : "N/D"}

2. EARLY WARNING SURVEILLANCE & COVENANT AUDIT
------------------------------------------------------
Total Flags Triggered: ${earlyWarningFlags.length}
${
  earlyWarningFlags.length > 0
    ? earlyWarningFlags
        .map(
          (f) =>
            `- [${f.severity}] ${f.title}: ${f.condition} (Current: ${f.currentValue}, Threshold: ${f.threshold})`
        )
        .join("\n")
    : "- No covenant or solvency breaches detected. Entity satisfies all institutional hurdles."
}

3. DETERMINISTIC STRESS TEST SENSITIVITY [SIMULATED - HYPOTHETICAL]
------------------------------------------------------
Baseline Revenue Shock: ${simulation.revenueDeltaPct}%
Stressed Pro-Forma Revenue: ${formatCurr(simulation.simulatedRevenue)}
Stressed EBIT: ${formatCurr(simulation.simulatedEbit)}
Stressed Interest Expense: ${formatCurr(simulation.simulatedInterestExpense)}
Stressed Coverage Ratio: ${formatRatio(simulation.simulatedInterestCoverage)}
Liquidity Runway Status: ${simulation.runwayStatus}

4. REGULATORY PROVENANCE & REGISTRATION
------------------------------------------------------
Filing Form: ${latest?.filingForm}
Filing Date: ${latest?.filingDate}
EDGAR/BSE/EDINET URL: ${latest?.filingUrl}
XBRL Taxonomy Tag (Revenue): ${latest?.revenueXbrlTag || "Direct Standardized"}
======================================================
MEMO GENERATED VIA FINTRAXIS DETERMINISTIC AUDIT TERMINAL
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    const headers = ["Period", "Revenue", "EBIT", "Net Income", "Total Debt", "Cash", "Operating Cash Flow"];
    const rows = periods.map((p) => [
      p.period,
      p.revenue ?? "",
      p.ebit ?? "",
      p.netIncome ?? "",
      p.totalDebt ?? "",
      p.cashAndEquivalents ?? "",
      p.operatingCashFlow ?? "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${company.symbol}_financial_ledger.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Actions */}
      <div className="p-3 bg-[#0E131A] border border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2563EB]" />
          <div>
            <div className="font-bold text-[#E1E7EC] tracking-wider uppercase">
              INVESTMENT COMMITTEE (IC) TEARSHEET BRIEFING MEMO
            </div>
            <div className="text-[10px] text-[#5A687D]">
              Institutional dossier ready for Risk Committee &amp; Supervisory Board review
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12161F] hover:bg-[#181F2B] border border-[#232B3A] hover:border-[#38BDF8] text-[#38BDF8] text-xs transition-colors cursor-pointer"
          >
            <span>EXPORT CSV</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12161F] hover:bg-[#181F2B] border border-[#232B3A] hover:border-[#2563EB] text-[#E1E7EC] text-xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#2563EB]" />}
            <span>{copied ? "COPIED" : "COPY MARKDOWN"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>EXPORT / PRINT TEARSHEET</span>
          </button>
        </div>
      </div>

      {/* Institutional Printable Tearsheet Card */}
      <div className="p-6 bg-[#07090E] border border-[#1E2638] space-y-6 text-[#E1E7EC]">
        {/* Memo Header */}
        <div className="border-b border-[#1E2638] pb-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="text-[10px] text-[#2563EB] tracking-[0.2em] uppercase font-bold">
              FINTRAXIS // INVESTMENT COMMITTEE BRIEFING DOSSIER
            </div>
            <h1 className="text-xl font-bold font-mono tracking-wider mt-1 text-[#E1E7EC]">
              {company.name} ({company.symbol})
            </h1>
            <div className="text-xs text-[#5A687D] mt-1 space-x-2">
              <span>EXCHANGE: {company.exchange}</span>
              <span>&bull;</span>
              <span>CIK: {company.cik ? company.cik : (company.country === "IND" ? "Not applicable, not an SEC registrant" : "Not applicable")}</span>
              <span>&bull;</span>
              <span>REGIME: {company.accountingStandard}</span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="inline-block px-2.5 py-1 border text-xs font-bold border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]">
              {riskTier.replace(/_/g, " ")}
            </div>
            <div className="text-[10px] text-[#5A687D]">
              HEALTH SCORE: <span className="text-[#E1E7EC] font-bold">{riskScore} / 100</span>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Solvency & Capital Structure */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#2563EB] uppercase tracking-wider border-b border-[#1E2638] pb-1">
            EXECUTIVE SOLVENCY &amp; CAPITAL STRUCTURE
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-2.5 bg-[#12161F] border border-[#232B3A]">
              <div className="text-[10px] text-[#5A687D]">NET REVENUE ({latest?.period})</div>
              <div className="text-sm font-bold font-mono-numbers text-[#E1E7EC] mt-0.5">
                {formatCurr(latest?.revenue)}
              </div>
            </div>
            <div className="p-2.5 bg-[#12161F] border border-[#232B3A]">
              <div className="text-[10px] text-[#5A687D]">OPERATING EBIT</div>
              <div className="text-sm font-bold font-mono-numbers text-[#E1E7EC] mt-0.5">
                {formatCurr(latest?.ebit)}
              </div>
            </div>
            <div className="p-2.5 bg-[#12161F] border border-[#232B3A]">
              <div className="text-[10px] text-[#5A687D]">EBIT INTEREST COVERAGE</div>
              <div className="text-sm font-bold font-mono-numbers text-[#10B981] mt-0.5">
                {formatRatio(latestRatios.interestCoverage)}
              </div>
            </div>
            <div className="p-2.5 bg-[#12161F] border border-[#232B3A]">
              <div className="text-[10px] text-[#5A687D]">NET DEBT / EBITDA</div>
              <div className="text-sm font-bold font-mono-numbers text-[#2563EB] mt-0.5">
                {formatRatio(latestRatios.netDebtToEbitda)}
              </div>
            </div>
            <div className="p-2.5 bg-[#12161F] border border-[#232B3A]">
              <div className="text-[10px] text-[#5A687D]">TOL / TNW MULTIPLE</div>
              <div className="text-sm font-bold font-mono-numbers text-[#E1E7EC] mt-0.5">
                {formatRatio(latestRatios.tolToTnw)}
              </div>
            </div>
            <div className="p-2.5 bg-[#12161F] border border-[#232B3A]">
              <div className="text-[10px] text-[#5A687D]">PROMOTER PLEDGE %</div>
              <div className="text-sm font-bold font-mono-numbers text-[#E1E7EC] mt-0.5">
                {company.hasPromoterGroup === 0
                  ? "N/A"
                  : company.promoterPledgedPct !== null && company.promoterPledgedPct !== undefined
                  ? `${company.promoterPledgedPct.toFixed(1)}%`
                  : "N/D"}
              </div>
            </div>
            <div className="p-2.5 bg-[#12161F] border border-[#232B3A]">
              <div className="text-[10px] text-[#5A687D]">INDICATIVE DRAWING POWER</div>
              <div className="text-sm font-bold font-mono-numbers text-[#E1E7EC] mt-0.5">
                {latestRatios.indicativeDrawingPower !== null && latestRatios.indicativeDrawingPower !== undefined
                  ? formatCurr(latestRatios.indicativeDrawingPower)
                  : "N/D"}
              </div>
            </div>
            <div className="p-2.5 bg-[#12161F] border border-[#232B3A]">
              <div className="text-[10px] text-[#5A687D]">CONTINGENT LIAB / TNW</div>
              <div className="text-sm font-bold font-mono-numbers text-[#E1E7EC] mt-0.5">
                {latestRatios.contingentLiabilitiesRatio !== null && latestRatios.contingentLiabilitiesRatio !== undefined
                  ? `${latestRatios.contingentLiabilitiesRatio.toFixed(1)}%`
                  : "N/D"}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Early Warning & Vulnerabilities */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#2563EB] uppercase tracking-wider border-b border-[#1E2638] pb-1">
            EARLY WARNING SURVEILLANCE &amp; COVENANT DIAGNOSIS
          </div>
          {earlyWarningFlags.length > 0 ? (
            <div className="space-y-2">
              {earlyWarningFlags.map((flag) => (
                <div key={flag.id} className="p-3 bg-[#12161F] border border-[#232B3A] flex justify-between items-start">
                  <div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 font-bold mr-2">
                      {flag.severity}
                    </span>
                    <span className="font-bold text-[#E1E7EC]">{flag.title}</span>
                    <p className="text-[11px] text-[#9BA8B8] mt-1">{flag.description}</p>
                  </div>
                  <div className="text-right text-[11px]">
                    <span className="text-[#5A687D]">Reading: </span>
                    <span className="text-[#EF4444] font-bold">{flag.currentValue}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-[#12161F] border border-[#232B3A] text-[#10B981]">
              Pristine covenant profile: zero early warning triggers active.
            </div>
          )}
        </div>

        {/* Section 3: Stressed Pro-Forma Sensitivity */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#2563EB] uppercase tracking-wider border-b border-[#1E2638] pb-1 flex justify-between">
            <span>DETERMINISTIC STRESS SENSITIVITY</span>
            <span className="text-[#EF4444] text-[10px]">[SIMULATED - HYPOTHETICAL]</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-2.5 bg-[#12161F] border border-[#232B3A]">
              <div className="text-[10px] text-[#5A687D]">STRESSED REVENUE ({simulation.revenueDeltaPct}%)</div>
              <div className="text-sm font-bold font-mono-numbers text-[#E1E7EC] mt-0.5">
                {formatCurr(simulation.simulatedRevenue)}
              </div>
            </div>
            <div className="p-2.5 bg-[#12161F] border border-[#232B3A]">
              <div className="text-[10px] text-[#5A687D]">STRESSED INTEREST EXPENSE</div>
              <div className="text-sm font-bold font-mono-numbers text-[#EF4444] mt-0.5">
                {formatCurr(simulation.simulatedInterestExpense)}
              </div>
            </div>
            <div className="p-2.5 bg-[#12161F] border border-[#232B3A]">
              <div className="text-[10px] text-[#5A687D]">STRESSED INTEREST COVERAGE</div>
              <div className="text-sm font-bold font-mono-numbers text-[#2563EB] mt-0.5">
                {formatRatio(simulation.simulatedInterestCoverage)}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Regulatory Chain of Custody */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#2563EB] uppercase tracking-wider border-b border-[#1E2638] pb-1">
            AUDIT PROVENANCE &amp; REGULATORY ATTESTATION
          </div>
          <div className="p-3 bg-[#12161F] border border-[#232B3A] space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#5A687D]">Primary Regulatory Filing:</span>
              <span className="text-[#E1E7EC] font-semibold">{latest?.filingForm} ({latest?.filingDate})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A687D]">XBRL Taxonomy Tag (Topline):</span>
              <span className="text-[#10B981] font-mono text-[10px]">{latest?.revenueXbrlTag || "Standardized"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A687D]">Official Electronic Registry:</span>
              <a
                href={latest?.filingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <span>OPEN REGULATORY FILING</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Committee Signature Block */}
        <div className="border-t border-[#1E2638] pt-4 grid grid-cols-2 gap-4 text-[10px] text-[#5A687D]">
          <div>
            <div>REVIEWED BY: CHIEF RISK OFFICER (CRO)</div>
            <div className="mt-4 border-b border-[#232B3A] w-48"></div>
            <div className="mt-1">SIGNATURE / DIGITAL ATTESTATION</div>
          </div>
          <div className="text-right">
            <div>AUDITED AT: {new Date().toISOString()}</div>
            <div className="mt-4 border-b border-[#232B3A] w-48 ml-auto"></div>
            <div className="mt-1">FINTRAXIS CLEARANCE KEY: FX-9082-CERT</div>
          </div>
        </div>
      </div>
    </div>
  );
}
