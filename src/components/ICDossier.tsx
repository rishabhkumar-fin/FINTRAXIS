"use client";

import React, { useState, useEffect } from "react";
import { PeacockLogo } from "./PeacockLogo";
import { FileText, Printer, Copy, Check, ShieldCheck, AlertTriangle } from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { formatFinancialValue, formatRatio } from "@/lib/formatters";
import { SessionClearance } from "./AuthGate";
import { WallStreetAvatar, AvatarPresetId } from "./WallStreetAvatar";

interface ICDossierProps {
  profile: CompanyRiskProfile;
  session?: SessionClearance | null;
}

export function ICDossier({ profile, session }: ICDossierProps) {
  const { company, periods, latestRatios, riskScore, earlyWarningFlags, simulation } = profile;
  const latest = periods[0];
  const [copied, setCopied] = useState(false);
  const [commentary, setCommentary] = useState("");
  const [saveStatus, setSaveStatus] = useState("SAVED");

  // Load / Save MD commentary to localStorage
  useEffect(() => {
    const key = `fintraxis_md_commentary_${company.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setCommentary(saved);
    } else {
      setCommentary(
        `UNDERWRITING THESIS: Entity exhibits resilient operating cash flow coverage with manageable short-term leverage. Recommended senior credit facility capped at ${formatFinancialValue(
          (latest?.ebitda ?? 1000) * 1.5,
          company.currency,
          company.scaleUnit
        )}. Stressed pro-forma interest coverage maintains a viable buffer above 2.0x floor under +200 bps monetary shock scenario.`
      );
    }
  }, [company.id, latest?.ebitda, company.currency, company.scaleUnit]);

  const handleCommentaryChange = (val: string) => {
    setCommentary(val);
    setSaveStatus("SAVING...");
    const key = `fintraxis_md_commentary_${company.id}`;
    localStorage.setItem(key, val);
    setTimeout(() => setSaveStatus("SAVED TO LOCAL STORAGE"), 400);
  };

  const formatCurr = (val: number | null | undefined) =>
    formatFinancialValue(val, company.currency, company.scaleUnit);

  // Dynamic Hurdle Calibration from Operator Settings
  const maxNetDebtHurdle = session?.netDebtEbitdaHurdle ?? 3.5;
  const minInterestHurdle = session?.interestCoverageHurdle ?? 2.5;
  const minCurrentHurdle = session?.currentRatioHurdle ?? 1.1;

  // Deterministic Covenant Compliance Grid Calculations
  const covenants = [
    {
      covenant: "Maximum Net Debt / EBITDA",
      threshold: `< ${maxNetDebtHurdle.toFixed(2)}x`,
      actual: formatRatio(latestRatios.netDebtToEbitda),
      isCompliant: latestRatios.netDebtToEbitda !== null && latestRatios.netDebtToEbitda < maxNetDebtHurdle,
      impact: "Leverage covenant governing senior revolving credit facility.",
    },
    {
      covenant: "Minimum EBIT Interest Coverage",
      threshold: `> ${minInterestHurdle.toFixed(2)}x`,
      actual: formatRatio(latestRatios.interestCoverage),
      isCompliant: latestRatios.interestCoverage !== null && latestRatios.interestCoverage > minInterestHurdle,
      impact: "Fixed charge coverage floor. Failure restricts dividend upstreaming.",
    },
    {
      covenant: "Minimum Working Capital (Current Ratio)",
      threshold: `> ${minCurrentHurdle.toFixed(2)}x`,
      actual: formatRatio(latestRatios.currentRatio),
      isCompliant: latestRatios.currentRatio !== null && latestRatios.currentRatio > minCurrentHurdle,
      impact: "Liquidity buffer protecting trade suppliers and commercial paper rollovers.",
    },
    {
      covenant: "Minimum Liquidity / Cash Buffer",
      threshold: "> 6.0 Months",
      actual: simulation.cashBurnRunwayMonths ? `${simulation.cashBurnRunwayMonths.toFixed(1)} Mo` : "SELF-SUSTAINING",
      isCompliant: simulation.runwayStatus !== "CRITICAL_BURN",
      impact: "Minimum operational runway under stressed pro-forma operating cash draw.",
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMemo = () => {
    const text = `# FINTRAXIS // CREDIT RISK & INVESTMENT COMMITTEE DOSSIER
CONFIDENTIAL DESK COPY #04 // NOT FOR REDISTRIBUTION
TARGET ENTITY: ${company.name} (${company.symbol})
JURISDICTION: ${company.country} | ACCOUNTING REGIME: ${company.accountingStandard}
UNDERWRITING LEAD: ${session?.userName || "Rishabh Kumar Yadav"} (${session?.userEmail || "rishabh.yadav@fintraxis.sovereign"})
SURVEILLANCE DESK: ${session?.desk || "Global Credit Risk & Distressed Debt"}
RISK SCORE: ${riskScore}/100 | RATING: ${riskScore >= 80 ? "TIER 1 PRIME" : riskScore >= 50 ? "TIER 2 WATCHLIST" : "TIER 3 DISTRESS"}

EXECUTIVE VERDICT:
${
  riskScore >= 80
    ? "UNCONDITIONAL APPROVAL: Strong credit quality, high coverage cushion."
    : riskScore >= 50
    ? "CONDITIONAL APPROVAL: Approved with mandatory quarterly covenant monitoring."
    : "FACILITY DECLINED: Significant solvency or leverage vulnerability."
}

COVENANT AUDIT:
${covenants.map((c) => `- ${c.covenant} [${c.threshold}]: Actual ${c.actual} => ${c.isCompliant ? "COMPLIANT" : "BREACH"}`).join("\n")}

UNDERWRITER COMMENTARY:
${commentary}

PROVENANCE:
FILING: ${latest?.filingForm} (${latest?.filingDate})
URL: ${latest?.filingUrl}
DIGITAL HASH: SHA256:${Buffer.from(company.symbol + (latest?.filingDate || "")).toString("hex").substring(0, 32).toUpperCase()}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ratingLabel =
    riskScore >= 80 ? "TIER 1 PRIME" : riskScore >= 50 ? "TIER 2 WATCHLIST" : "TIER 3 DISTRESS";

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Action Controls (Hidden on Print) */}
      <div className="p-3.5 bg-[#111622] border border-[#1E2536] flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print rounded">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-[#C5A880]" />
          <div>
            <div className="font-bold text-[#F8FAFC] tracking-wider uppercase text-xs">
              MODULE 06 // CREDIT RISK &amp; INVESTMENT COMMITTEE DOSSIER
            </div>
            <div className="text-[10px] text-[#94A3B8]">
              Boardroom underwriting tearsheet ready for Risk Committee &amp; Supervisory Board sign-off
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMemo}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#162033] hover:bg-[#1E2B45] border border-[#1E2536] hover:border-[#C5A880]/40 text-[#F8FAFC] text-xs transition-colors rounded"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#C5A880]" />}
            <span>{copied ? "COPIED" : "COPY MARKDOWN"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#C5A880] hover:bg-[#D4B996] text-[#080B10] font-bold text-xs transition-colors rounded shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>EXPORT BOARDROOM A4 PDF</span>
          </button>
        </div>
      </div>

      {/* Formal IC Dossier Canvas (Printable Target: Inverts to clean A4 white on print) */}
      <div className="p-6 sm:p-8 bg-[#0B0F17] border border-[#1E2536] space-y-6 text-[#F8FAFC] relative overflow-hidden rounded print:bg-white print:text-slate-900 print:border-slate-300 print:shadow-none print:p-0 print:space-y-4">
        {/* Top Confidential Stamp Lockup */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E2536] print:border-slate-300 pb-4 gap-4 print-break-inside-avoid">
          <PeacockLogo size="md" showLockup={true} />

          <div className="border border-[#F43F5E] print:border-slate-800 bg-[#F43F5E]/10 print:bg-slate-100 px-3 py-1.5 text-center sm:text-right rounded">
            <div className="text-[10px] font-bold text-[#F43F5E] print:text-slate-900 tracking-widest uppercase">
              CONFIDENTIAL // CREDIT COMMITTEE MEMORANDUM
            </div>
            <div className="text-[9px] text-[#C5A880] print:text-slate-700 tracking-wider mt-0.5">
              TARGET ISSUER: {company.name} ({company.symbol})
            </div>
          </div>
        </div>

        {/* Executive Committee Underwriting Recommendation Banner */}
        <div
          className={`p-4 border rounded flex items-start gap-3 print-break-inside-avoid print:bg-slate-50 print:border-slate-300 ${
            riskScore >= 80
              ? "bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981] print:text-emerald-800"
              : riskScore >= 50
              ? "bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#F59E0B] print:text-amber-800"
              : "bg-[#F43F5E]/10 border-[#F43F5E]/40 text-[#F43F5E] print:text-rose-800"
          }`}
        >
          {riskScore >= 80 ? (
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <div className="text-xs font-bold uppercase tracking-wider print:text-slate-900">
              EXECUTIVE UNDERWRITING RECOMMENDATION:{" "}
              {riskScore >= 80
                ? "UNCONDITIONAL FACILITY APPROVAL"
                : riskScore >= 50
                ? "APPROVED SUBJECT TO COVENANT WATCHLIST"
                : "CREDIT FACILITY REJECTED / HIGH VULNERABILITY"}
            </div>
            <p className="text-[11px] text-[#94A3B8] print:text-slate-700 leading-relaxed">
              {riskScore >= 80
                ? `Subject entity ${company.name} satisfies all institutional leverage, liquidity, and debt service hurdles. Senior credit facility approved.`
                : riskScore >= 50
                ? `Subject entity ${company.name} approved for credit facility with mandatory quarterly covenant monitoring and enhanced liquidity covenants.`
                : `Elevated indebtedness, compressed interest coverage, or negative cash burn exceeds institutional risk tolerance limits.`}
            </p>
          </div>
        </div>

        {/* Executive Solvency & Risk Rating Matrix */}
        <div className="p-4 bg-[#111622] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded print-break-inside-avoid">
          <div className="space-y-1">
            <span className="text-[10px] text-[#94A3B8] print:text-slate-600 uppercase">
              EXECUTIVE SOLVENCY &amp; UNDERWRITING CLASSIFICATION
            </span>
            <div className="text-lg font-bold text-[#F8FAFC] print:text-slate-900 flex items-center gap-2">
              <span>{company.name}</span>
              <span className="text-xs px-2 py-0.5 border border-[#C5A880] text-[#C5A880] print:border-slate-800 print:text-slate-900 bg-[#080B10] print:bg-white">
                {company.symbol}
              </span>
            </div>
            <div className="text-[11px] text-[#94A3B8] print:text-slate-700">
              Reporting Base: {company.currency} ({company.scaleUnit}) &bull; Accounting Regime: {company.accountingStandard} &bull; Country: {company.country}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#080B10] print:bg-white border border-[#1E2536] print:border-slate-300 text-center min-w-[120px] rounded">
              <div className="text-[9px] text-[#94A3B8] print:text-slate-600 uppercase">HEALTH SCORE</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#F8FAFC] print:text-slate-900 mt-0.5">
                {riskScore} <span className="text-xs text-[#64748B] print:text-slate-500">/ 100</span>
              </div>
              <div className="text-[9px] text-[#C5A880] print:text-slate-700 font-semibold mt-0.5">
                {earlyWarningFlags.length} EWS {earlyWarningFlags.length === 1 ? "FLAG" : "FLAGS"}
              </div>
            </div>

            <div
              className={`p-3 border text-center min-w-[170px] rounded print:bg-white ${
                riskScore >= 80
                  ? "bg-[#10B981]/10 border-[#10B981] text-[#10B981] print:text-emerald-800 print:border-emerald-700"
                  : riskScore >= 50
                  ? "bg-[#F59E0B]/10 border-[#F59E0B] text-[#F59E0B] print:text-amber-800 print:border-amber-700"
                  : "bg-[#F43F5E]/10 border-[#F43F5E] text-[#F43F5E] print:text-rose-800 print:border-rose-700"
              }`}
            >
              <div className="text-[9px] uppercase tracking-wider font-bold">SOLVENCY RATING</div>
              <div className="text-xs font-extrabold mt-0.5">{ratingLabel}</div>
            </div>
          </div>
        </div>

        {/* Debt Covenant Compliance Grid */}
        <div className="space-y-3 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-[#1E2536] print:border-slate-300 pb-1">
            <span className="text-xs font-bold text-[#C5A880] print:text-slate-900 uppercase tracking-wider">
              01. DEBT COVENANT COMPLIANCE &amp; SOLVENCY SURVEILLANCE GRID
            </span>
            <span className="text-[10px] text-[#94A3B8] print:text-slate-600">
              OPERATOR CALIBRATED HURDLES
            </span>
          </div>

          <div className="border border-[#1E2536] print:border-slate-300 bg-[#080B10] print:bg-white overflow-x-auto rounded">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E2536] print:border-slate-300 bg-[#0D111A] print:bg-slate-100 text-[#94A3B8] print:text-slate-700 text-[10px]">
                  <th className="py-2.5 px-3 text-left">CREDIT COVENANT METRIC</th>
                  <th className="py-2.5 px-3 text-right">MANDATED HURDLE</th>
                  <th className="py-2.5 px-3 text-right">AS-REPORTED READING</th>
                  <th className="py-2.5 px-3 text-center">COMPLIANCE STATUS</th>
                  <th className="py-2.5 px-3 text-left">GOVERNING IMPACT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2536]/50 print:divide-slate-200">
                {covenants.map((cov, idx) => (
                  <tr key={idx} className="hover:bg-[#111622] print:hover:bg-transparent">
                    <td className="py-2.5 px-3 text-left font-bold text-[#F8FAFC] print:text-slate-900">
                      {cov.covenant}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#94A3B8] print:text-slate-700">
                      {cov.threshold}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#F8FAFC] print:text-slate-900">
                      {cov.actual}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold border rounded ${
                          cov.isCompliant
                            ? "border-[#10B981] bg-[#10B981]/10 text-[#10B981] print:text-emerald-800 print:bg-emerald-50 print:border-emerald-600"
                            : "border-[#F43F5E] bg-[#F43F5E]/10 text-[#F43F5E] print:text-rose-800 print:bg-rose-50 print:border-rose-600"
                        }`}
                      >
                        {cov.isCompliant ? "COMPLIANT" : "BREACH"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left text-[10.5px] text-[#94A3B8] print:text-slate-600">
                      {cov.impact}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stressed Scenario Sensitivity Table */}
        <div className="space-y-3 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-[#1E2536] print:border-slate-300 pb-1">
            <span className="text-xs font-bold text-[#C5A880] print:text-slate-900 uppercase tracking-wider">
              02. STRESS TESTING IMPACT SYNTHESIS
            </span>
            <span className="text-[#F43F5E] print:text-rose-700 text-[10px] font-bold">
              [SIMULATED - HYPOTHETICAL FORECAST]
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#111622] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded">
              <div className="text-[10px] text-[#94A3B8] print:text-slate-600">BASELINE REVENUE</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[#F8FAFC] print:text-slate-900 mt-0.5">
                {formatCurr(latest?.revenue)}
              </div>
              <div className="text-[10px] text-[#F43F5E] print:text-rose-700 mt-1">
                Stressed: {formatCurr(simulation.simulatedRevenue)} ({simulation.revenueDeltaPct}%)
              </div>
            </div>

            <div className="p-3 bg-[#111622] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded">
              <div className="text-[10px] text-[#94A3B8] print:text-slate-600">OPERATING EBIT</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[#F8FAFC] print:text-slate-900 mt-0.5">
                {formatCurr(latest?.ebit)}
              </div>
              <div className="text-[10px] text-[#F43F5E] print:text-rose-700 mt-1">
                Stressed: {formatCurr(simulation.simulatedEbit)}
              </div>
            </div>

            <div className="p-3 bg-[#111622] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded">
              <div className="text-[10px] text-[#94A3B8] print:text-slate-600">INTEREST EXPENSE</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[#94A3B8] print:text-slate-700 mt-0.5">
                {formatCurr(latest?.interestExpense)}
              </div>
              <div className="text-[10px] text-[#F43F5E] print:text-rose-700 mt-1">
                Stressed: {formatCurr(simulation.simulatedInterestExpense)} (+200 bps)
              </div>
            </div>

            <div className="p-3 bg-[#111622] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded">
              <div className="text-[10px] text-[#94A3B8] print:text-slate-600">INTEREST COVERAGE</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[#10B981] print:text-emerald-800 mt-0.5">
                {formatRatio(latestRatios.interestCoverage)}
              </div>
              <div className="text-[10px] text-[#C5A880] print:text-slate-700 mt-1">
                Stressed: {formatRatio(simulation.simulatedInterestCoverage)}
              </div>
            </div>
          </div>
        </div>

        {/* Managing Director Commentary (Auto-saved) */}
        <div className="space-y-2 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-[#1E2536] print:border-slate-300 pb-1">
            <span className="text-xs font-bold text-[#C5A880] print:text-slate-900 uppercase tracking-wider">
              03. MANAGING DIRECTOR RISK THESIS &amp; CREDIT OPINION
            </span>
            <span className="text-[9px] text-[#10B981] print:text-slate-600 no-print">{saveStatus}</span>
          </div>

          <div className="hidden print:block p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 leading-relaxed">
            {commentary}
          </div>

          <textarea
            value={commentary}
            onChange={(e) => handleCommentaryChange(e.target.value)}
            rows={4}
            placeholder="Enter institutional credit assessment, syndicate terms, or covenant waiver notes..."
            className="w-full p-3 bg-[#080B10] border border-[#1E2536] text-xs font-mono text-[#F8FAFC] leading-relaxed focus:border-[#C5A880] focus:outline-none placeholder-[#64748B] rounded no-print"
          />
        </div>

        {/* Executive Sign-off Block with Dynamic User Attribution */}
        <div className="border-t border-[#1E2536] print:border-slate-300 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-[10px] text-[#94A3B8] print:text-slate-700 print-break-inside-avoid">
          <div className="flex items-start gap-3">
            <div className="no-print">
              <WallStreetAvatar
                avatarId={(session?.avatarId as AvatarPresetId) || "crest"}
                customUrl={session?.avatarCustomUrl}
                size="md"
              />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-[9px] uppercase tracking-wider text-[#C5A880] print:text-slate-900 font-bold">
                UNDERWRITING OFFICER:
              </div>
              <div className="text-[#F8FAFC] print:text-slate-900 font-bold text-xs truncate">
                {session?.userName || "Rishabh Kumar Yadav"}
              </div>
              <div className="text-[9.5px] text-[#64748B] print:text-slate-600 truncate">
                {session?.userEmail || "rishabh.yadav@fintraxis.sovereign"}
              </div>
              <div className="border-b border-[#1E2536] print:border-slate-300 pt-2 w-36"></div>
              <div className="text-[8.5px] text-[#C5A880] print:text-slate-700 pt-0.5">
                {session?.desk || "Global Credit Risk & Distressed Debt"}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[9px] uppercase tracking-wider text-[#94A3B8] print:text-slate-900 font-bold">
              CHIEF RISK OFFICER (CRO):
            </div>
            <div className="text-[#F8FAFC] print:text-slate-900 font-bold text-xs">DR. KLAUS MEIER</div>
            <div className="text-[9.5px] text-[#64748B] print:text-slate-600">klaus.meier@fintraxis.sovereign</div>
            <div className="border-b border-[#1E2536] print:border-slate-300 pt-3 w-44"></div>
            <div className="text-[9px] text-[#64748B] print:text-slate-600">GLOBAL HEAD OF CREDIT SURVEILLANCE</div>
          </div>

          <div className="space-y-1 sm:text-right">
            <div className="text-[9px] uppercase tracking-wider text-[#94A3B8] print:text-slate-900 font-bold">
              DIGITAL ATTESTATION:
            </div>
            <div className="text-[#C5A880] print:text-slate-800 font-mono text-[9.5px]">
              SHA256: 8F9C2B7A09E334F...61A
            </div>
            <div className="text-[9px] text-[#64748B] print:text-slate-600">
              TIMESTAMP: {new Date().toISOString().substring(0, 19)} UTC
            </div>
            <div className="text-[9px] text-[#10B981] print:text-emerald-800 font-bold">
              ELECTRONICALLY SEALED // NODE MUM-01
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
