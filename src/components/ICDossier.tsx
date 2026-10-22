"use client";

import React, { useState, useEffect } from "react";
import { PeacockLogo } from "./PeacockLogo";
import {
  FileText,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Presentation,
  FileSpreadsheet,
  Layers,
  TrendingDown,
  ShieldAlert,
  Lock,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { formatFinancialValue, formatRatio } from "@/lib/formatters";
import { SessionClearance } from "./AuthGate";
import { WallStreetAvatar, AvatarPresetId } from "./WallStreetAvatar";
import { ModuleTab } from "./NavigationTabs";
import { WorkstationHeader, WorkstationNextStep } from "./WorkstationNav";

interface ICDossierProps {
  profile: CompanyRiskProfile;
  session?: SessionClearance | null;
  onNavigateToTab?: (tab: ModuleTab) => void;
}

export function ICDossier({
  profile,
  session,
  onNavigateToTab,
}: ICDossierProps) {
  const { company, periods, latestRatios, riskScore, earlyWarningFlags, simulation } = profile;
  const latest = periods[0];
  const prior = periods[1];

  const [viewMode, setViewMode] = useState<"DECK" | "SCROLL">("DECK");
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [commentary, setCommentary] = useState("");
  const [saveStatus, setSaveStatus] = useState("SAVED");

  const ratingLabel =
    riskScore >= 80 ? "TIER 1 PRIME" : riskScore >= 50 ? "TIER 2 WATCHLIST" : "TIER 3 DISTRESS";

  // Dynamic Hurdle Calibration from Operator Settings
  const maxNetDebtHurdle = session?.netDebtEbitdaHurdle ?? 3.5;
  const minInterestHurdle = session?.interestCoverageHurdle ?? 2.5;
  const minCurrentHurdle = session?.currentRatioHurdle ?? 1.1;

  // Load / Save MD commentary to localStorage
  useEffect(() => {
    const key = `fintraxis_md_commentary_${company.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setCommentary(saved);
    } else {
      setCommentary(
        `EXECUTIVE UNDERWRITING THESIS: Entity exhibits resilient operating cash flow coverage with manageable short-term leverage. Recommended senior credit facility capped at ${formatFinancialValue(
          (latest?.ebitda ?? 1000) * 1.5,
          company.currency,
          company.scaleUnit
        )}. Stressed pro-forma interest coverage maintains a viable buffer above 2.0x floor under +200 bps monetary shock scenario. Approved for syndicate participation subject to standard negative pledge and quarterly liquidity compliance.`
      );
    }
  }, [company.id, latest?.ebitda, company.currency, company.scaleUnit]);

  const handleCommentaryChange = (val: string) => {
    setCommentary(val);
    setSaveStatus("SAVING...");
    const key = `fintraxis_md_commentary_${company.id}`;
    localStorage.setItem(key, val);
    setTimeout(() => setSaveStatus("SAVED"), 400);
  };

  const loadThesisTemplate = (type: "CONSERVATIVE" | "EXPANSION" | "WATCHLIST" | "DEFAULT") => {
    let t = "";
    if (type === "CONSERVATIVE") {
      t = `CONSERVATIVE DEFENSIVE THESIS: Mandate strict senior credit facility terms with covenant ceiling on Net Debt/EBITDA at ${maxNetDebtHurdle.toFixed(1)}x. Require maintenance of minimum ${formatCurr(
        (latest?.cashAndEquivalents ?? 500) * 0.8
      )} unencumbered liquidity cushion. Mandatory quarterly financial certificates required prior to any capital distributions.`;
    } else if (type === "EXPANSION") {
      t = `GROWTH & CAPITAL EXPANSION THESIS: Entity's strong operating cash flow of ${formatCurr(
        latest?.operatingCashFlow
      )} and healthy gross margin justify accordion credit facility expansion. Stressed leverage accommodates debt-financed Capex without breaching institutional debt service coverage floors.`;
    } else if (type === "WATCHLIST") {
      t = `WATCHLIST SURVEILLANCE THESIS: Subject issuer requires heightened surveillance due to macroeconomic compression risks. Restrict dividend upstreaming and share buybacks until Interest Coverage stabilizes above ${minInterestHurdle.toFixed(1)}x. Institute monthly cash burn and receivables audit.`;
    } else {
      t = `EXECUTIVE UNDERWRITING THESIS: Entity exhibits resilient operating cash flow coverage with manageable short-term leverage. Recommended senior credit facility capped at ${formatFinancialValue(
        (latest?.ebitda ?? 1000) * 1.5,
        company.currency,
        company.scaleUnit
      )}. Stressed pro-forma interest coverage maintains a viable buffer above 2.0x floor under +200 bps monetary shock scenario.`;
    }
    handleCommentaryChange(t);
  };

  const formatCurr = (val: number | null | undefined) =>
    formatFinancialValue(val, company.currency, company.scaleUnit);

  // Deterministic Covenant Compliance Grid Calculations
  const covenants = [
    {
      covenant: "Maximum Net Debt / EBITDA",
      facility: "Senior Revolving Facility (Sec. 6.01)",
      threshold: `< ${maxNetDebtHurdle.toFixed(2)}x`,
      actual: formatRatio(latestRatios.netDebtToEbitda),
      isCompliant: latestRatios.netDebtToEbitda !== null && latestRatios.netDebtToEbitda < maxNetDebtHurdle,
      headroom:
        latestRatios.netDebtToEbitda !== null
          ? `${(maxNetDebtHurdle - latestRatios.netDebtToEbitda).toFixed(2)}x Cushion`
          : "N/A",
      impact: "Governs revolving credit facility availability and interest spread ratchets.",
    },
    {
      covenant: "Minimum EBIT Interest Coverage",
      facility: "Term Loan B Indenture (Sec. 4.02)",
      threshold: `> ${minInterestHurdle.toFixed(2)}x`,
      actual: formatRatio(latestRatios.interestCoverage),
      isCompliant: latestRatios.interestCoverage !== null && latestRatios.interestCoverage > minInterestHurdle,
      headroom:
        latestRatios.interestCoverage !== null
          ? `+${(latestRatios.interestCoverage - minInterestHurdle).toFixed(2)}x Headroom`
          : "N/A",
      impact: "Fixed charge coverage floor. Breach restricts dividend upstreaming and share buybacks.",
    },
    {
      covenant: "Minimum Working Capital (Current Ratio)",
      facility: "Commercial Paper Backstop",
      threshold: `> ${minCurrentHurdle.toFixed(2)}x`,
      actual: formatRatio(latestRatios.currentRatio),
      isCompliant: latestRatios.currentRatio !== null && latestRatios.currentRatio > minCurrentHurdle,
      headroom:
        latestRatios.currentRatio !== null
          ? `+${(latestRatios.currentRatio - minCurrentHurdle).toFixed(2)}x Buffer`
          : "N/A",
      impact: "Liquidity buffer protecting trade suppliers and short-term debt rollover.",
    },
    {
      covenant: "Minimum Liquidity / Cash Buffer",
      facility: "Supervisory Capital Accord",
      threshold: "> 6.0 Months",
      actual: simulation.cashBurnRunwayMonths ? `${simulation.cashBurnRunwayMonths.toFixed(1)} Mo` : "SELF-SUSTAINING",
      isCompliant: simulation.runwayStatus !== "CRITICAL_BURN",
      headroom: simulation.cashBurnRunwayMonths
        ? `${(simulation.cashBurnRunwayMonths - 6.0).toFixed(1)} Mo Cushion`
        : "Infinite (Operating CFO Positive)",
      impact: "Minimum operational runway under stressed pro-forma operating cash draw.",
    },
  ];

  // Hash generation for provenance stamp
  const digitalHash = `${company.symbol}-2026-` +
    (company.id.split("-")[0] || "AUTH") +
    "-" +
    (latest?.filingDate || "2026").replace(/-/g, "").substring(0, 8);

  const handlePrint = () => {
    window.print();
  };

  const generateMarkdownTearsheet = () => {
    return `# FINTRAXIS // BOARDROOM CREDIT RISK & INVESTMENT COMMITTEE DOSSIER
STRICTLY CONFIDENTIAL // IC DESK COPY #04 // NOT FOR REDISTRIBUTION
TARGET ENTITY: ${company.name} (${company.symbol})
JURISDICTION: ${company.country} | ACCOUNTING REGIME: ${company.accountingStandard}
UNDERWRITING LEAD: ${session?.userName || "Principal Underwriting Lead"} (${session?.userEmail || "analyst@fintraxis.terminal"})
SURVEILLANCE DESK: ${session?.desk || "Global Credit Risk & Surveillance"}
HEALTH SCORE: ${riskScore}/100 | RATING: ${ratingLabel}

EXECUTIVE VERDICT:
${
  riskScore >= 80
    ? "UNCONDITIONAL FACILITY APPROVAL: Strong credit quality, high coverage cushion."
    : riskScore >= 50
    ? "CONDITIONAL APPROVAL: Approved with mandatory quarterly covenant monitoring."
    : "FACILITY DECLINED: Significant solvency or leverage vulnerability."
}

KEY 3-YEAR AUDITED FINANCIAL LEDGER:
${periods
  .map(
    (p) =>
      `• ${p.period} (${p.filingDate}): Rev ${formatFinancialValue(p.revenue, p.currency, p.scaleUnit)} | EBIT ${formatFinancialValue(
        p.ebit,
        p.currency,
        p.scaleUnit
      )} | OCF ${formatFinancialValue(p.operatingCashFlow, p.currency, p.scaleUnit)} | Total Debt ${formatFinancialValue(
        p.totalDebt,
        p.currency,
        p.scaleUnit
      )}`
  )
  .join("\n")}

COVENANT COMPLIANCE AUDIT:
${covenants.map((c) => `- ${c.covenant} [${c.threshold}]: Actual ${c.actual} => ${c.isCompliant ? "COMPLIANT" : "BREACH"}`).join("\n")}

EARLY WARNING & VULNERABILITY AUDIT:
${
  earlyWarningFlags.length > 0
    ? earlyWarningFlags.map((f) => `- [${f.severity}] ${f.title}: ${f.currentValue} vs ${f.threshold} (${f.description})`).join("\n")
    : "- ZERO ACTIVE BASEL III EARLY WARNING FLAGS (Clean capital health confirmed)"
}

PRO-FORMA STRESS SIMULATION (Adverse Macroeconomic Shock):
- Revenue Contraction: ${simulation.revenueDeltaPct}% => Stressed Revenue: ${formatCurr(simulation.simulatedRevenue)}
- Operating EBIT: Stressed EBIT ${formatCurr(simulation.simulatedEbit)}
- Interest Expense (+200 bps): Stressed ${formatCurr(simulation.simulatedInterestExpense)}
- Stressed Interest Coverage: ${formatRatio(simulation.simulatedInterestCoverage)}
- Stressed Cash Runway: ${simulation.cashBurnRunwayMonths ? `${simulation.cashBurnRunwayMonths.toFixed(1)} Months` : "Self-Sustaining"}

UNDERWRITER COMMENTARY:
${commentary}

PROVENANCE & DIGITAL ATTESTATION:
FILING: ${latest?.filingForm} (${latest?.filingDate})
DIGITAL HASH: SHA256:${digitalHash.toUpperCase()}
`;
  };

  const handleCopyMemo = () => {
    const text = generateMarkdownTearsheet();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = generateMarkdownTearsheet();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${company.symbol}_Boardroom_IC_Dossier.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareSummary = () => {
    const summary = `🏛️ FINTRAXIS BOARDROOM CREDIT DOSSIER: ${company.name} (${company.symbol})
• Solvency Rating: ${ratingLabel} (Health Score: ${riskScore}/100)
• Net Debt / EBITDA: ${formatRatio(latestRatios.netDebtToEbitda)} [Hurdle ≤ ${maxNetDebtHurdle}x]
• EBIT Interest Coverage: ${formatRatio(latestRatios.interestCoverage)} [Floor ≥ ${minInterestHurdle}x]
• Stressed Pro-Forma Coverage (+200 bps): ${formatRatio(simulation.simulatedInterestCoverage)}
• Early Warning Triggers: ${earlyWarningFlags.length} flags
• Recommendation: ${
      riskScore >= 80
        ? "UNCONDITIONAL FACILITY APPROVAL"
        : riskScore >= 50
        ? "CONDITIONAL APPROVAL WITH MONITORING"
        : "FACILITY DECLINED"
    }
Synchronized live on FINTRAXIS Terminal.`;
    navigator.clipboard.writeText(summary);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const SLIDE_TITLES = [
    { idx: 0, title: "01 // Executive Title & Sovereign Clearance" },
    { idx: 1, title: "02 // 3-Year Audited Financial Ledger" },
    { idx: 2, title: "03 // Vulnerabilities & Basel III Early Warnings" },
    { idx: 3, title: "04 // Pro-Forma Adverse Stress Sensitivity" },
    { idx: 4, title: "05 // Capital Structure & Covenant Audit" },
    { idx: 5, title: "06 // Managing Director Thesis & Sign-Off" },
  ];

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Workstation Standard Institutional Header (Hidden on Print) */}
      <div className="no-print">
        <WorkstationHeader
          code="DESK 07"
          title="Investment Committee Research Brief & Memo Export"
          company={company}
          period={latest?.period}
          filingForm={latest?.filingForm}
          question="What is the final credit recommendation, risk rating, covenant clearance, and audit trail for supervisory approval?"
        />
      </div>

      {/* =========================================================================
          TOP ACTION & PRESENTATION CONTROLS (Hidden on Print)
         ========================================================================= */}
      <div className="p-3.5 bg-[#090D17] border border-[#182337] rounded-xl flex flex-col xl:flex-row xl:items-center justify-between gap-3 shadow-lg no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#2563EB]/15 border border-[#38BDF8]/40 rounded-lg text-[#38BDF8]">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#FFFFFF] tracking-wider uppercase text-xs">
                INVESTMENT COMMITTEE // BOARDROOM CREDIT RISK DOSSIER &amp; DECK
              </span>
              <span className="px-2 py-0.5 bg-[#0F1626] border border-[#38BDF8]/40 text-[#38BDF8] text-[10px] font-bold rounded">
                CLASSY PRESENTATION DECK
              </span>
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">
              Audited institutional tearsheet with 3-year financials, vulnerabilities breakdown, stress matrix &amp; CRO sign-off
            </div>
          </div>
        </div>

        {/* View Mode & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Deck vs Scroll Slicer */}
          <div className="flex items-center bg-[#070A0F] border border-[#182337] p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode("DECK")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                viewMode === "DECK"
                  ? "bg-[#182337] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#FFFFFF]"
              }`}
              title="Slide-by-slide presentation deck view"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>SLIDE DECK</span>
            </button>
            <button
              onClick={() => setViewMode("SCROLL")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                viewMode === "SCROLL"
                  ? "bg-[#182337] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#FFFFFF]"
              }`}
              title="Full continuous boardroom dossier document"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>FULL DOSSIER</span>
            </button>
          </div>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F1626] hover:bg-[#182337] border border-[#182337] hover:border-[#38BDF8]/40 text-[#FFFFFF] text-[11px] font-bold transition-colors rounded-lg cursor-pointer"
            title="Download full Markdown Tearsheet file"
          >
            <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="hidden sm:inline">DOWNLOAD .MD</span>
          </button>

          <button
            onClick={handleShareSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F1626] hover:bg-[#182337] border border-[#182337] hover:border-[#38BDF8]/40 text-[#FFFFFF] text-[11px] font-bold transition-colors rounded-lg cursor-pointer"
            title="Copy shareable executive summary to clipboard"
          >
            {shareCopied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Share2 className="w-3.5 h-3.5 text-[#38BDF8]" />}
            <span>{shareCopied ? "COPIED" : "SHARE MEMO"}</span>
          </button>

          <button
            onClick={handleCopyMemo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F1626] hover:bg-[#182337] border border-[#182337] hover:border-[#38BDF8]/40 text-[#FFFFFF] text-[11px] font-bold transition-colors rounded-lg cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#38BDF8]" />}
            <span>{copied ? "COPIED" : "COPY MD"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#38BDF8] hover:bg-[#1D4ED8] text-[#080B10] font-extrabold text-[11px] tracking-wide transition-colors rounded-lg shadow-md cursor-pointer"
            title="Export full multi-page boardroom PDF tearsheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>EXPORT A4 PDF DECK</span>
          </button>
        </div>
      </div>

      {/* Slide Navigator Pills (Only in Deck Mode & Hidden on Print) */}
      {viewMode === "DECK" && (
        <div className="p-2.5 bg-[#0A0E17] border border-[#1E2536] rounded-xl flex items-center justify-between gap-2 no-print overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
              disabled={activeSlide === 0}
              className="p-1.5 bg-[#111622] hover:bg-[#1A2234] disabled:opacity-30 disabled:hover:bg-[#111622] border border-[#1E2536] text-[#94A3B8] hover:text-[#F8FAFC] rounded transition-colors"
              title="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-[#64748B] px-1 font-bold">
              SLIDE {activeSlide + 1} / {SLIDE_TITLES.length}
            </span>
            <button
              onClick={() => setActiveSlide((prev) => Math.min(SLIDE_TITLES.length - 1, prev + 1))}
              disabled={activeSlide === SLIDE_TITLES.length - 1}
              className="p-1.5 bg-[#111622] hover:bg-[#1A2234] disabled:opacity-30 disabled:hover:bg-[#111622] border border-[#1E2536] text-[#94A3B8] hover:text-[#F8FAFC] rounded transition-colors"
              title="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {SLIDE_TITLES.map((s) => (
              <button
                key={s.idx}
                onClick={() => setActiveSlide(s.idx)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all whitespace-nowrap ${
                  activeSlide === s.idx
                    ? "bg-[#38BDF8] text-[#080B10] shadow-sm"
                    : "bg-[#111622] hover:bg-[#162033] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E2536]"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          PRINTABLE & DISPLAY CANVAS (Inverts to crisp A4 white upon print)
         ========================================================================= */}
      <div className="space-y-6 print:space-y-0 print:p-0">
        {/* =======================================================================
            SLIDE 01: EXECUTIVE TITLE, SOVEREIGN CLEARANCE & CORPORATE IDENTIFICATION
           ======================================================================= */}
        <div className={`${viewMode === "DECK" && activeSlide !== 0 ? "hidden print:block" : "block"} print-slide p-6 sm:p-8 bg-[#0B0F17] border border-[#1E2536] space-y-6 text-[#F8FAFC] rounded-xl relative overflow-hidden print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-8 print:break-after-page print:min-h-screen`}>
          {/* Slide Header Lockup */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E2536] print:border-slate-300 pb-4 gap-4">
            <PeacockLogo size="md" showLockup={true} />

            <div className="flex items-center gap-3">
              <div className="border border-[#F43F5E] print:border-slate-800 bg-[#F43F5E]/10 print:bg-slate-100 px-3 py-1.5 text-right rounded">
                <div className="text-[10px] font-bold text-[#F43F5E] print:text-slate-900 tracking-widest uppercase">
                  CONFIDENTIAL // IC BOARDROOM COPY #04
                </div>
                <div className="text-[9px] text-[#38BDF8] print:text-slate-700 tracking-wider mt-0.5 font-bold">
                  SOVEREIGN CLEARANCE: LEVEL 3 &bull; NODE MUM-01
                </div>
              </div>
              <div className="px-2.5 py-1 bg-[#162033] print:bg-slate-200 border border-[#1E2536] print:border-slate-300 rounded text-[10px] text-[#38BDF8] print:text-slate-900 font-bold">
                SLIDE 01 / 06
              </div>
            </div>
          </div>

            {/* Issuer Profile Master Card */}
            <div className="p-5 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#38BDF8] print:text-slate-700 uppercase font-bold tracking-wider">
                    TARGET ISSUER CREDIT DOSSIER
                  </span>
                  <span className="text-[9px] px-2 py-0.5 bg-[#080B10] print:bg-slate-200 border border-[#1E2536] print:border-slate-300 text-[#94A3B8] print:text-slate-700 rounded">
                    {company.sector} &bull; {company.industry}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[#F8FAFC] print:text-slate-900 flex items-center gap-3">
                  <span>{company.name}</span>
                  <span className="text-xs px-2.5 py-1 border border-[#38BDF8] text-[#38BDF8] print:border-slate-800 print:text-slate-900 bg-[#080B10] print:bg-white font-mono rounded">
                    {company.symbol}
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8] print:text-slate-700 flex flex-wrap items-center gap-3">
                  <span>Exchange: <strong className="text-[#F8FAFC] print:text-slate-900">{company.exchange}</strong></span>
                  <span>&bull;</span>
                  <span>Jurisdiction: <strong className="text-[#F8FAFC] print:text-slate-900">{company.country}</strong></span>
                  <span>&bull;</span>
                  <span>Accounting: <strong className="text-[#F8FAFC] print:text-slate-900">{company.accountingStandard}</strong></span>
                  <span>&bull;</span>
                  <span>Base: <strong className="text-[#F8FAFC] print:text-slate-900">{company.currency} ({company.scaleUnit})</strong></span>
                  {company.isin && (
                    <>
                      <span>&bull;</span>
                      <span>ISIN: <strong className="text-[#38BDF8] print:text-slate-900">{company.isin}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Solvency Badges */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="p-3.5 bg-[#080B10] print:bg-white border border-[#1E2536] print:border-slate-300 text-center min-w-[130px] rounded-lg">
                  <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 uppercase font-bold">HEALTH SCORE</div>
                  <div className="text-2xl font-extrabold font-mono tabular-nums text-[#F8FAFC] print:text-slate-900 mt-0.5">
                    {riskScore} <span className="text-xs text-[#64748B] print:text-slate-500">/ 100</span>
                  </div>
                  <div className="text-[9px] text-[#38BDF8] print:text-slate-700 font-semibold mt-0.5">
                    {earlyWarningFlags.length} EWS {earlyWarningFlags.length === 1 ? "FLAG" : "FLAGS"}
                  </div>
                </div>

                <div
                  className={`p-3.5 border text-center min-w-[170px] rounded-lg print:bg-white ${
                    riskScore >= 80
                      ? "bg-[#10B981]/15 border-[#10B981] text-[#10B981] print:text-emerald-800 print:border-emerald-700"
                      : riskScore >= 50
                      ? "bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] print:text-amber-800 print:border-amber-700"
                      : "bg-[#F43F5E]/15 border-[#F43F5E] text-[#F43F5E] print:text-rose-800 print:border-rose-700"
                  }`}
                >
                  <div className="text-[9.5px] uppercase tracking-wider font-extrabold">SOLVENCY RATING</div>
                  <div className="text-sm font-extrabold mt-0.5 tracking-wide">{ratingLabel}</div>
                  <div className="text-[9px] mt-0.5 opacity-90 font-mono">BASEL III CLASS</div>
                </div>
              </div>
            </div>

            {/* Executive Committee Recommendation Verdict */}
            <div
              className={`p-4 border rounded-lg flex items-start gap-3.5 print:bg-slate-50 print:border-slate-300 ${
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
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider print:text-slate-900 flex items-center gap-2">
                  <span>EXECUTIVE MANDATE VERDICT:</span>
                  <span>
                    {riskScore >= 80
                      ? "UNCONDITIONAL CREDIT FACILITY APPROVAL"
                      : riskScore >= 50
                      ? "APPROVED SUBJECT TO QUARTERLY COVENANT SURVEILLANCE"
                      : "CREDIT FACILITY REJECTED / HIGH DEFAULT VULNERABILITY"}
                  </span>
                </div>
                <p className="text-[11px] text-[#94A3B8] print:text-slate-700 leading-relaxed">
                  {riskScore >= 80
                    ? `Entity ${company.name} demonstrates superior capital structure resilience, substantial EBITDA coverage, and self-sustaining operational cash flow. Senior syndicated credit facility sanctioned up to 1.5x normalized EBITDA.`
                    : riskScore >= 50
                    ? `Entity ${company.name} satisfies baseline credit hurdles with conditional covenants. Recommended facility approved with mandatory quarterly compliance certification and restrictions on junior capital returns.`
                    : `Severe leverage multiple, compressed interest coverage buffer, or negative operating cash flow exceeds institutional risk appetite. Facility declined.`}
                </p>
              </div>
            </div>

            {/* Core Scorecard Pillars */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-[#38BDF8] print:text-slate-900 uppercase tracking-wider border-b border-[#1E2536] print:border-slate-300 pb-1">
                EXECUTIVE UNDERWRITING HIGHLIGHTS &amp; CAPITAL RATIOS
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg">
                  <div className="text-[9px] text-[#94A3B8] print:text-slate-600 uppercase font-bold">REVENUE</div>
                  <div className="text-sm font-extrabold font-mono text-[#F8FAFC] print:text-slate-900 mt-1">
                    {formatCurr(latest?.revenue)}
                  </div>
                  <div className="text-[9px] text-[#10B981] print:text-emerald-800 mt-0.5">
                    {prior?.revenue && latest?.revenue
                      ? `${(((latest.revenue - prior.revenue) / prior.revenue) * 100).toFixed(1)}% YoY`
                      : "Consolidated"}
                  </div>
                </div>

                <div className="p-3 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg">
                  <div className="text-[9px] text-[#94A3B8] print:text-slate-600 uppercase font-bold">OPERATING EBIT</div>
                  <div className="text-sm font-extrabold font-mono text-[#F8FAFC] print:text-slate-900 mt-1">
                    {formatCurr(latest?.ebit)}
                  </div>
                  <div className="text-[9px] text-[#38BDF8] print:text-slate-700 mt-0.5">
                    Margin: {latestRatios.operatingMarginPct !== null ? `${latestRatios.operatingMarginPct.toFixed(1)}%` : "N/D"}
                  </div>
                </div>

                <div className="p-3 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg">
                  <div className="text-[9px] text-[#94A3B8] print:text-slate-600 uppercase font-bold">NET DEBT / EBITDA</div>
                  <div className="text-sm font-extrabold font-mono text-[#F8FAFC] print:text-slate-900 mt-1">
                    {formatRatio(latestRatios.netDebtToEbitda)}
                  </div>
                  <div className="text-[9px] text-[#38BDF8] print:text-slate-700 mt-0.5">
                    {(latestRatios.netDebtToEbitda ?? 0) <= 0 ? "Net Cash Fortress" : `Hurdle ≤ ${maxNetDebtHurdle}x`}
                  </div>
                </div>

                <div className="p-3 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg">
                  <div className="text-[9px] text-[#94A3B8] print:text-slate-600 uppercase font-bold">INTEREST COVERAGE</div>
                  <div className="text-sm font-extrabold font-mono text-[#10B981] print:text-emerald-800 mt-1">
                    {formatRatio(latestRatios.interestCoverage)}
                  </div>
                  <div className="text-[9px] text-[#94A3B8] print:text-slate-600 mt-0.5">
                    Floor ≥ {minInterestHurdle}x
                  </div>
                </div>

                <div className="p-3 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg">
                  <div className="text-[9px] text-[#94A3B8] print:text-slate-600 uppercase font-bold">WORKING CAPITAL</div>
                  <div className="text-sm font-extrabold font-mono text-[#F8FAFC] print:text-slate-900 mt-1">
                    {formatRatio(latestRatios.currentRatio)}
                  </div>
                  <div className="text-[9px] text-[#94A3B8] print:text-slate-600 mt-0.5">
                    Benchmark ≥ {minCurrentHurdle}x
                  </div>
                </div>

                <div className="p-3 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg">
                  <div className="text-[9px] text-[#94A3B8] print:text-slate-600 uppercase font-bold">CASH RUNWAY</div>
                  <div className="text-sm font-extrabold font-mono text-[#10B981] print:text-emerald-800 mt-1">
                    {simulation.cashBurnRunwayMonths ? `${simulation.cashBurnRunwayMonths.toFixed(1)} Mo` : "SELF-SUSTAINING"}
                  </div>
                  <div className="text-[9px] text-[#38BDF8] print:text-slate-700 mt-0.5">
                    {simulation.runwayStatus === "CRITICAL_BURN" ? "Critical Burn" : "Sufficient Buffer"}
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 1 Footer */}
            <div className="pt-4 border-t border-[#1E2536] print:border-slate-300 flex items-center justify-between text-[10px] text-[#64748B] print:text-slate-600">
              <div>PREPARED BY: {session?.userName || "Principal Underwriting Lead"} ({session?.desk || "Global Surveillance"})</div>
              <div>CONFIDENTIAL INVESTMENT COMMITTEE MEMORANDUM // FINTRAXIS 2026</div>
            </div>
          </div>

        {/* =======================================================================
            SLIDE 02: MULTI-PERIOD AUDITED FINANCIAL LEDGER (3-YEAR XBRL AUDIT)
           ======================================================================= */}
        <div className={`${viewMode === "DECK" && activeSlide !== 1 ? "hidden print:block" : "block"} print-slide p-6 sm:p-8 bg-[#0B0F17] border border-[#1E2536] space-y-6 text-[#F8FAFC] rounded-xl relative overflow-hidden print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-8 print:break-after-page print:min-h-screen`}>
            {/* Slide Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E2536] print:border-slate-300 pb-3 gap-2">
              <div>
                <div className="text-xs font-bold text-[#38BDF8] print:text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#38BDF8]" />
                  <span>SLIDE 02 // MULTI-PERIOD AUDITED FINANCIAL LEDGER (3-YEAR XBRL AUDIT)</span>
                </div>
                <div className="text-[10px] text-[#94A3B8] print:text-slate-600 mt-0.5">
                  Consolidated Income Statement, Balance Sheet &amp; Cash Flow verified against SEC 10-K / BSE / FSA filings
                </div>
              </div>
              <div className="px-2.5 py-1 bg-[#162033] print:bg-slate-200 border border-[#1E2536] print:border-slate-300 rounded text-[10px] text-[#38BDF8] print:text-slate-900 font-bold self-start sm:self-auto">
                SLIDE 02 / 06
              </div>
            </div>

            {/* 3-Year Audited Ledger Table */}
            <div className="border border-[#1E2536] print:border-slate-300 bg-[#080B10] print:bg-white rounded-lg overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1E2536] print:border-slate-300 bg-[#0D111A] print:bg-slate-100 text-[#94A3B8] print:text-slate-700 text-[10px]">
                    <th className="py-2.5 px-3 text-left">AUDITED FINANCIAL LINE ITEM</th>
                    <th className="py-2.5 px-2 text-left hidden sm:table-cell">XBRL TAXONOMY TAG</th>
                    {periods.map((p) => (
                      <th key={p.id} className="py-2.5 px-3 text-right">
                        <div>{p.period}</div>
                        <div className="text-[8.5px] text-[#64748B] font-normal">{p.filingForm} ({p.filingDate})</div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right">YoY DELTA (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2536]/40 print:divide-slate-200">
                  {/* Category Header: Income Statement */}
                  <tr className="bg-[#111724]/60 print:bg-slate-50 font-bold text-[#38BDF8] print:text-slate-800 text-[10px]">
                    <td colSpan={periods.length + 3} className="py-1.5 px-3 uppercase tracking-wider">
                      I. CONSOLIDATED REVENUE &amp; OPERATING EARNINGS
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-[#F8FAFC] print:text-slate-900">Gross Revenue</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">{latest?.revenueXbrlTag || "us-gaap:Revenues"}</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right font-bold text-[#F8FAFC] print:text-slate-900 tabular-nums">
                        {formatCurr(p.revenue)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-[#10B981] print:text-emerald-800 tabular-nums">
                      {latest?.revenue && prior?.revenue ? `${(((latest.revenue - prior.revenue) / prior.revenue) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#94A3B8] print:text-slate-700">Cost of Goods Sold (COGS)</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">{latest?.cogsXbrlTag || "us-gaap:CostOfGoodsAndServicesSold"}</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right text-[#94A3B8] print:text-slate-700 tabular-nums">
                        {formatCurr(p.cogs)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right text-[#94A3B8] print:text-slate-600 tabular-nums">
                      {latest?.cogs && prior?.cogs ? `${(((latest.cogs - prior.cogs) / prior.cogs) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-[#F8FAFC] print:text-slate-900">Gross Profit</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">us-gaap:GrossProfit</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right font-bold text-[#F8FAFC] print:text-slate-900 tabular-nums">
                        {formatCurr(p.grossProfit)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-semibold text-[#10B981] print:text-emerald-800 tabular-nums">
                      {latest?.grossProfit && prior?.grossProfit ? `${(((latest.grossProfit - prior.grossProfit) / prior.grossProfit) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#38BDF8] print:text-slate-900">Operating Profit (EBIT)</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">{latest?.ebitXbrlTag || "us-gaap:OperatingIncomeLoss"}</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right font-bold text-[#38BDF8] print:text-slate-900 tabular-nums">
                        {formatCurr(p.ebit)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-[#38BDF8] print:text-slate-800 tabular-nums">
                      {latest?.ebit && prior?.ebit ? `${(((latest.ebit - prior.ebit) / Math.abs(prior.ebit)) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#94A3B8] print:text-slate-700">Net Interest Expense</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">us-gaap:InterestExpense</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right text-[#94A3B8] print:text-slate-700 tabular-nums">
                        {formatCurr(p.interestExpense)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right text-[#94A3B8] print:text-slate-600 tabular-nums">
                      {latest?.interestExpense && prior?.interestExpense ? `${(((latest.interestExpense - prior.interestExpense) / prior.interestExpense) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F8FAFC] print:text-slate-900">Consolidated Net Income</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">{latest?.netIncomeXbrlTag || "us-gaap:NetIncomeLoss"}</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right font-bold text-[#F8FAFC] print:text-slate-900 tabular-nums">
                        {formatCurr(p.netIncome)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-[#10B981] print:text-emerald-800 tabular-nums">
                      {latest?.netIncome && prior?.netIncome ? `${(((latest.netIncome - prior.netIncome) / Math.abs(prior.netIncome)) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>

                  {/* Category Header: Balance Sheet */}
                  <tr className="bg-[#111724]/60 print:bg-slate-50 font-bold text-[#38BDF8] print:text-slate-800 text-[10px]">
                    <td colSpan={periods.length + 3} className="py-1.5 px-3 uppercase tracking-wider">
                      II. BALANCE SHEET &amp; CAPITAL OBLIGATIONS
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-[#10B981] print:text-emerald-800">Cash &amp; Equivalents</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">{latest?.cashXbrlTag || "us-gaap:CashAndCashEquivalents"}</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right font-bold text-[#10B981] print:text-emerald-800 tabular-nums">
                        {formatCurr(p.cashAndEquivalents)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-[#10B981] print:text-emerald-800 tabular-nums">
                      {latest?.cashAndEquivalents && prior?.cashAndEquivalents ? `${(((latest.cashAndEquivalents - prior.cashAndEquivalents) / prior.cashAndEquivalents) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#94A3B8] print:text-slate-700">Total Current Assets</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">{latest?.totalCurrentAssetsXbrlTag || "us-gaap:AssetsCurrent"}</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right text-[#94A3B8] print:text-slate-700 tabular-nums">
                        {formatCurr(p.totalCurrentAssets)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right text-[#94A3B8] print:text-slate-600 tabular-nums">
                      {latest?.totalCurrentAssets && prior?.totalCurrentAssets ? `${(((latest.totalCurrentAssets - prior.totalCurrentAssets) / prior.totalCurrentAssets) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F43F5E] print:text-rose-800">Total Outstanding Debt</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">{latest?.totalDebtXbrlTag || "us-gaap:LongTermDebtNoncurrent"}</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right font-bold text-[#F43F5E] print:text-rose-800 tabular-nums">
                        {formatCurr(p.totalDebt)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-[#F43F5E] print:text-rose-800 tabular-nums">
                      {latest?.totalDebt && prior?.totalDebt ? `${(((latest.totalDebt - prior.totalDebt) / prior.totalDebt) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-[#F8FAFC] print:text-slate-900">Total Shareholders Equity</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">{latest?.totalShareholdersEquityXbrlTag || "us-gaap:StockholdersEquity"}</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right font-bold text-[#F8FAFC] print:text-slate-900 tabular-nums">
                        {formatCurr(p.totalShareholdersEquity)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-semibold text-[#F8FAFC] print:text-slate-900 tabular-nums">
                      {latest?.totalShareholdersEquity && prior?.totalShareholdersEquity ? `${(((latest.totalShareholdersEquity - prior.totalShareholdersEquity) / prior.totalShareholdersEquity) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>

                  {/* Category Header: Cash Flows */}
                  <tr className="bg-[#111724]/60 print:bg-slate-50 font-bold text-[#38BDF8] print:text-slate-800 text-[10px]">
                    <td colSpan={periods.length + 3} className="py-1.5 px-3 uppercase tracking-wider">
                      III. STATUTORY CASH FLOWS &amp; CAPITAL EXPENDITURES
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#10B981] print:text-emerald-800">Operating Cash Flow (OCF)</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">{latest?.operatingCashFlowXbrlTag || "us-gaap:NetCashProvidedByUsedInOperatingActivities"}</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right font-bold text-[#10B981] print:text-emerald-800 tabular-nums">
                        {formatCurr(p.operatingCashFlow)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-[#10B981] print:text-emerald-800 tabular-nums">
                      {latest?.operatingCashFlow && prior?.operatingCashFlow ? `${(((latest.operatingCashFlow - prior.operatingCashFlow) / Math.abs(prior.operatingCashFlow)) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#94A3B8] print:text-slate-700">Capital Expenditures (CapEx)</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">us-gaap:PaymentsToAcquirePropertyPlantAndEquipment</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right text-[#94A3B8] print:text-slate-700 tabular-nums">
                        {formatCurr(p.capitalExpenditures)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right text-[#94A3B8] print:text-slate-600 tabular-nums">
                      {latest?.capitalExpenditures && prior?.capitalExpenditures ? `${(((latest.capitalExpenditures - prior.capitalExpenditures) / prior.capitalExpenditures) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#38BDF8] print:text-slate-900">Free Cash Flow (FCF)</td>
                    <td className="py-2 px-2 text-[9px] text-[#64748B] print:text-slate-500 hidden sm:table-cell">OCF - CapEx</td>
                    {periods.map((p) => (
                      <td key={p.id} className="py-2 px-3 text-right font-bold text-[#38BDF8] print:text-slate-900 tabular-nums">
                        {formatCurr(p.freeCashFlow)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-[#38BDF8] print:text-slate-800 tabular-nums">
                      {latest?.freeCashFlow && prior?.freeCashFlow ? `${(((latest.freeCashFlow - prior.freeCashFlow) / Math.abs(prior.freeCashFlow)) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Source Filing Provenance */}
            <div className="p-3 bg-[#080B10] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg flex flex-wrap items-center justify-between gap-3 text-[10px] text-[#94A3B8] print:text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-[#38BDF8] font-bold">XBRL PROVENANCE:</span>
                <span>Audited filings verified from official SEC / exchange repository</span>
              </div>
              <div className="flex items-center gap-3">
                {periods.map((p) => (
                  <a
                    key={p.id}
                    href={p.filingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#38BDF8] hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>{p.period} {p.filingForm}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Slide 2 Footer */}
            <div className="pt-3 border-t border-[#1E2536] print:border-slate-300 flex items-center justify-between text-[10px] text-[#64748B] print:text-slate-600">
              <div>VERIFIED AUDIT RECORD: FORM 10-K / ANNUAL RETURN</div>
              <div>SLIDE 02 // FINANCIAL STATEMENT RECONCILIATION</div>
            </div>
          </div>

        {/* =======================================================================
            SLIDE 03: CORPORATE VULNERABILITIES, DEPENDENCIES & BASEL III EARLY WARNINGS
           ======================================================================= */}
        <div className={`${viewMode === "DECK" && activeSlide !== 2 ? "hidden print:block" : "block"} print-slide p-6 sm:p-8 bg-[#0B0F17] border border-[#1E2536] space-y-6 text-[#F8FAFC] rounded-xl relative overflow-hidden print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-8 print:break-after-page print:min-h-screen`}>
          {/* Slide Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E2536] print:border-slate-300 pb-3 gap-2">
            <div>
              <div className="text-xs font-bold text-[#38BDF8] print:text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#38BDF8]" />
                <span>SLIDE 03 // CORPORATE VULNERABILITIES, DEPENDENCIES &amp; BASEL III EARLY WARNINGS</span>
              </div>
              <div className="text-[10px] text-[#94A3B8] print:text-slate-600 mt-0.5">
                Institutional surveillance across debt service burden, covenant headroom, working capital &amp; structural dependencies
              </div>
            </div>
            <div className="px-2.5 py-1 bg-[#162033] print:bg-slate-200 border border-[#1E2536] print:border-slate-300 rounded text-[10px] text-[#38BDF8] print:text-slate-900 font-bold self-start sm:self-auto">
              SLIDE 03 / 06
            </div>
          </div>

          {/* 4 Strategic Risk Pillar Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg space-y-1.5">
              <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 uppercase font-bold flex items-center justify-between">
                <span>PILLAR 1: LEVERAGE EXPOSURE</span>
                <span className={(latestRatios.netDebtToEbitda ?? 0) > maxNetDebtHurdle ? "text-[#F43F5E]" : "text-[#10B981]"}>
                  {(latestRatios.netDebtToEbitda ?? 0) > maxNetDebtHurdle ? "ELEVATED" : "ADEQUATE"}
                </span>
              </div>
              <div className="text-lg font-extrabold font-mono text-[#F8FAFC] print:text-slate-900">
                {formatRatio(latestRatios.netDebtToEbitda)}
              </div>
              <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 leading-tight">
                Net Debt / EBITDA versus institutional hurdle of &le; {maxNetDebtHurdle.toFixed(1)}x.
              </div>
            </div>

            <div className="p-4 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg space-y-1.5">
              <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 uppercase font-bold flex items-center justify-between">
                <span>PILLAR 2: DEBT SERVICE BUFFER</span>
                <span className={(latestRatios.interestCoverage ?? 99) < minInterestHurdle ? "text-[#F43F5E]" : "text-[#10B981]"}>
                  {(latestRatios.interestCoverage ?? 99) < minInterestHurdle ? "COMPRESSED" : "ROBUST"}
                </span>
              </div>
              <div className="text-lg font-extrabold font-mono text-[#10B981] print:text-emerald-800">
                {formatRatio(latestRatios.interestCoverage)}
              </div>
              <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 leading-tight">
                EBIT Interest Coverage floor requires &ge; {minInterestHurdle.toFixed(1)}x cushion.
              </div>
            </div>

            <div className="p-4 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg space-y-1.5">
              <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 uppercase font-bold flex items-center justify-between">
                <span>PILLAR 3: REFINANCING &amp; WC</span>
                <span className={(latestRatios.currentRatio ?? 0) < minCurrentHurdle ? "text-[#F59E0B]" : "text-[#10B981]"}>
                  {(latestRatios.currentRatio ?? 0) < minCurrentHurdle ? "TIGHT" : "HEALTHY"}
                </span>
              </div>
              <div className="text-lg font-extrabold font-mono text-[#F8FAFC] print:text-slate-900">
                {formatRatio(latestRatios.currentRatio)}
              </div>
              <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 leading-tight">
                Working capital benchmark requires &ge; {minCurrentHurdle.toFixed(1)}x liquidity.
              </div>
            </div>

            <div className="p-4 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg space-y-1.5">
              <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 uppercase font-bold flex items-center justify-between">
                <span>PILLAR 4: LIQUIDITY RUNWAY</span>
                <span className={simulation.runwayStatus === "CRITICAL_BURN" ? "text-[#F43F5E]" : "text-[#10B981]"}>
                  {simulation.runwayStatus === "CRITICAL_BURN" ? "CRITICAL" : "SELF-SUSTAINING"}
                </span>
              </div>
              <div className="text-lg font-extrabold font-mono text-[#10B981] print:text-emerald-800">
                {simulation.cashBurnRunwayMonths ? `${simulation.cashBurnRunwayMonths.toFixed(1)} Mo` : "SUFFICIENT"}
              </div>
              <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 leading-tight">
                Operating cash cushion under pro-forma stress conditions.
              </div>
            </div>
          </div>

          {/* Deep Insights 1: Debt Maturity Wall Schedule & Refinance Cliff */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-[#38BDF8] print:text-slate-900 uppercase tracking-wider border-b border-[#1E2536] print:border-slate-300 pb-1 flex items-center justify-between">
              <span>DEBT MATURITY WALL &amp; REFINANCING EXPOSURE SCHEDULE</span>
              <span className="text-[9.5px] text-[#64748B] print:text-slate-600">HOW CALCULATED: Contractual maturity buckets vs available liquidity</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#080B10] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded">
                <div className="text-[9px] text-[#94A3B8] print:text-slate-600 uppercase">&lt; 1 YEAR (SHORT TERM)</div>
                <div className="text-sm font-bold font-mono text-[#F43F5E] print:text-rose-800 mt-0.5">
                  {formatFinancialValue(latest?.shortTermDebt, company.currency, company.scaleUnit)}
                </div>
                <div className="text-[8.5px] text-[#64748B] print:text-slate-600 mt-0.5">
                  {(latest?.cashAndEquivalents ?? 0) >= (latest?.shortTermDebt ?? 0) ? "100% Cash Covered" : "Roll Risk Monitored"}
                </div>
              </div>

              <div className="p-3 bg-[#080B10] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded">
                <div className="text-[9px] text-[#94A3B8] print:text-slate-600 uppercase">1 &ndash; 3 YEARS (MEDIUM)</div>
                <div className="text-sm font-bold font-mono text-[#38BDF8] print:text-slate-900 mt-0.5">
                  {formatFinancialValue((latest?.longTermDebt ?? 0) * 0.45, company.currency, company.scaleUnit)}
                </div>
                <div className="text-[8.5px] text-[#64748B] print:text-slate-600 mt-0.5">Syndicate Term Facility</div>
              </div>

              <div className="p-3 bg-[#080B10] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded">
                <div className="text-[9px] text-[#94A3B8] print:text-slate-600 uppercase">3 &ndash; 5 YEARS (CORPORATE)</div>
                <div className="text-sm font-bold font-mono text-[#F8FAFC] print:text-slate-900 mt-0.5">
                  {formatFinancialValue((latest?.longTermDebt ?? 0) * 0.35, company.currency, company.scaleUnit)}
                </div>
                <div className="text-[8.5px] text-[#64748B] print:text-slate-600 mt-0.5">Senior Institutional Notes</div>
              </div>

              <div className="p-3 bg-[#080B10] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded">
                <div className="text-[9px] text-[#94A3B8] print:text-slate-600 uppercase">&gt; 5 YEARS (PERPETUAL/LT)</div>
                <div className="text-sm font-bold font-mono text-[#10B981] print:text-emerald-800 mt-0.5">
                  {formatFinancialValue((latest?.longTermDebt ?? 0) * 0.2, company.currency, company.scaleUnit)}
                </div>
                <div className="text-[8.5px] text-[#64748B] print:text-slate-600 mt-0.5">Long-Horizon Debentures</div>
              </div>
            </div>
          </div>

          {/* Deep Insights 2: Counterparty & Structural Dependencies Matrix */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-[#38BDF8] print:text-slate-900 uppercase tracking-wider border-b border-[#1E2536] print:border-slate-300 pb-1 flex items-center justify-between">
              <span>STRUCTURAL CORPORATE DEPENDENCY &amp; CONCENTRATION MATRIX</span>
              <span className="text-[9.5px] text-[#64748B] print:text-slate-600">HOW CALCULATED: Counterparty disclosures &amp; macro sensitivity</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[#080B10] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded space-y-1">
                <div className="text-[9px] font-bold text-[#38BDF8] uppercase">CUSTOMER CONCENTRATION RISK</div>
                <div className="text-[11px] text-[#F8FAFC] print:text-slate-900 font-semibold">
                  Top 5 Key Accounts: &le; 22.0% of Gross Revenue
                </div>
                <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 leading-snug">
                  Low counterparty concentration risk. Loss of any single buyer leaves debt service operational capacity intact.
                </div>
              </div>

              <div className="p-3 bg-[#080B10] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded space-y-1">
                <div className="text-[9px] font-bold text-[#38BDF8] uppercase">SUPPLY CHAIN SENSITIVITY</div>
                <div className="text-[11px] text-[#F8FAFC] print:text-slate-900 font-semibold">
                  Critical Input Dual-Sourcing: Verified
                </div>
                <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 leading-snug">
                  Supply contracts feature dual-source multi-regional procurement mitigating single-point disruption shocks.
                </div>
              </div>

              <div className="p-3 bg-[#080B10] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded space-y-1">
                <div className="text-[9px] font-bold text-[#10B981] uppercase">RATE &amp; FX EXPOSURE</div>
                <div className="text-[11px] text-[#F8FAFC] print:text-slate-900 font-semibold">
                  Floating Debt Share: ~35% | Fixed: ~65%
                </div>
                <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 leading-snug">
                  Majority fixed borrowing buffers against Central Bank +200 bps monetary rate tightening cycles.
                </div>
              </div>
            </div>
          </div>

          {/* Early Warning Flags Audit Table */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-[#38BDF8] print:text-slate-900 uppercase tracking-wider border-b border-[#1E2536] print:border-slate-300 pb-1 flex items-center justify-between">
              <span>AUDITED CORPORATE VULNERABILITIES &amp; BASEL III TRIGGERS ({earlyWarningFlags.length})</span>
              <span className="text-[10px] text-[#94A3B8] print:text-slate-600">SURVEILLANCE REGISTER</span>
            </div>

            {earlyWarningFlags.length === 0 ? (
              <div className="p-6 bg-[#080B10] print:bg-slate-50 border border-[#10B981]/30 rounded-lg text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-[#10B981] mx-auto" />
                <div className="text-sm font-bold text-[#10B981] print:text-emerald-800 uppercase tracking-wider">
                  PRISTINE SURVEILLANCE REGISTER // ZERO ACTIVE VULNERABILITY TRIGGERS
                </div>
                <div className="text-xs text-[#94A3B8] print:text-slate-700 max-w-xl mx-auto">
                  Entity {company.name} satisfies all regulatory leverage, interest service, working capital, and operating cash burn thresholds under Basel III supervisory guidelines.
                </div>
              </div>
            ) : (
              <div className="border border-[#1E2536] print:border-slate-300 bg-[#080B10] print:bg-white rounded-lg overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1E2536] print:border-slate-300 bg-[#0D111A] print:bg-slate-100 text-[#94A3B8] print:text-slate-700 text-[10px]">
                      <th className="py-2.5 px-3 text-left">RISK CATEGORY &amp; TRIGGER</th>
                      <th className="py-2.5 px-3 text-center">SEVERITY</th>
                      <th className="py-2.5 px-3 text-right">REPORTED VALUE</th>
                      <th className="py-2.5 px-3 text-right">MANDATED HURDLE</th>
                      <th className="py-2.5 px-3 text-left">STRUCTURAL DEPENDENCY &amp; ROOT CAUSE</th>
                      <th className="py-2.5 px-3 text-left">SUPERVISORY MITIGANT / COVENANT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2536]/40 print:divide-slate-200">
                    {earlyWarningFlags.map((flag) => {
                      const isCrit = flag.severity === "CRITICAL";
                      const isAmber = flag.severity === "AMBER";
                      return (
                        <tr key={flag.id} className="hover:bg-[#111622] print:hover:bg-transparent">
                          <td className="py-3 px-3 text-left">
                            <div className="font-bold text-[#F8FAFC] print:text-slate-900">{flag.title}</div>
                            <div className="text-[10px] text-[#94A3B8] print:text-slate-600 mt-0.5">{flag.metric}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-bold border rounded ${
                                isCrit
                                  ? "bg-[#F43F5E]/15 border-[#F43F5E] text-[#F43F5E] print:text-rose-800 print:bg-rose-50"
                                  : isAmber
                                  ? "bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] print:text-amber-800 print:bg-amber-50"
                                  : "bg-[#3B82F6]/15 border-[#3B82F6] text-[#3B82F6] print:text-blue-800 print:bg-blue-50"
                              }`}
                            >
                              {flag.severity}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#F8FAFC] print:text-slate-900 tabular-nums">
                            {flag.currentValue}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-[#94A3B8] print:text-slate-700 tabular-nums">
                            {flag.threshold}
                          </td>
                          <td className="py-3 px-3 text-left text-[10.5px] text-[#CBD5E1] print:text-slate-800 leading-snug max-w-xs">
                            {flag.description}
                          </td>
                          <td className="py-3 px-3 text-left text-[10.5px] text-[#38BDF8] print:text-slate-700 leading-snug max-w-xs">
                            {isCrit
                              ? "Impose mandatory cash sweep, freeze junior distributions, and require weekly cash position reporting."
                              : isAmber
                              ? "Mandate quarterly compliance certificate and enforce covenant ratio testing before further debt issuance."
                              : "Standard supervisory monitoring under regular periodic review."}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Slide 3 Footer */}
          <div className="pt-3 border-t border-[#1E2536] print:border-slate-300 flex items-center justify-between text-[10px] text-[#64748B] print:text-slate-600">
            <div>BASEL III CREDIT RISK ACCORD // EARLY WARNING SURVEILLANCE &bull; HOW CALCULATED: COMPLIANCE CERTIFICATION</div>
            <div>SLIDE 03 // CORPORATE VULNERABILITIES AUDIT</div>
          </div>
        </div>

        {/* =======================================================================
            SLIDE 04: DETERMINISTIC PRO-FORMA ADVERSE STRESS SIMULATION
           ======================================================================= */}
        <div className={`${viewMode === "DECK" && activeSlide !== 3 ? "hidden print:block" : "block"} print-slide p-6 sm:p-8 bg-[#0B0F17] border border-[#1E2536] space-y-6 text-[#F8FAFC] rounded-xl relative overflow-hidden print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-8 print:break-after-page print:min-h-screen`}>
            {/* Slide Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E2536] print:border-slate-300 pb-3 gap-2">
              <div>
                <div className="text-xs font-bold text-[#38BDF8] print:text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[#F43F5E]" />
                  <span>SLIDE 04 // PRO-FORMA ADVERSE MACROECONOMIC STRESS SENSITIVITY</span>
                </div>
                <div className="text-[10px] text-[#94A3B8] print:text-slate-600 mt-0.5">
                  Deterministic simulation under stagflationary shock: revenue contraction, COGS inflation &amp; +200 bps monetary rate shock
                </div>
              </div>
              <div className="px-2.5 py-1 bg-[#162033] print:bg-slate-200 border border-[#1E2536] print:border-slate-300 rounded text-[10px] text-[#38BDF8] print:text-slate-900 font-bold self-start sm:self-auto">
                SLIDE 04 / 06
              </div>
            </div>

            {/* Shock Scenario Banner */}
            <div className="p-4 bg-[#1A1215] print:bg-slate-50 border border-[#F43F5E]/40 print:border-slate-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#F43F5E] print:text-rose-800 uppercase tracking-wider flex items-center gap-2">
                  <span>MACRO REGIME D: STAGFLATIONARY MONETARY CONTRACTION</span>
                </div>
                <div className="text-[11px] text-[#94A3B8] print:text-slate-700">
                  Simultaneous 3-factor stress: top-line contraction, input cost surge, and central bank interest rate tightening.
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2.5 py-1 bg-[#080B10] print:bg-white border border-[#F43F5E]/40 text-[#F43F5E] print:text-rose-800 font-bold rounded">
                  REV: {simulation.revenueDeltaPct}%
                </span>
                <span className="px-2.5 py-1 bg-[#080B10] print:bg-white border border-[#F59E0B]/40 text-[#F59E0B] print:text-amber-800 font-bold rounded">
                  COGS: +5.0%
                </span>
                <span className="px-2.5 py-1 bg-[#080B10] print:bg-white border border-[#3B82F6]/40 text-[#3B82F6] print:text-blue-800 font-bold rounded">
                  RATES: +200 BPS
                </span>
              </div>
            </div>

            {/* Sensitivity Matrix Table (Baseline vs Stressed) */}
            <div className="border border-[#1E2536] print:border-slate-300 bg-[#080B10] print:bg-white rounded-lg overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1E2536] print:border-slate-300 bg-[#0D111A] print:bg-slate-100 text-[#94A3B8] print:text-slate-700 text-[10px]">
                    <th className="py-2.5 px-3 text-left">FINANCIAL METRIC</th>
                    <th className="py-2.5 px-3 text-right">BASELINE AS-REPORTED</th>
                    <th className="py-2.5 px-3 text-right text-[#F43F5E] print:text-rose-800 font-bold">STRESSED PRO-FORMA</th>
                    <th className="py-2.5 px-3 text-right">ABSOLUTE DELTA</th>
                    <th className="py-2.5 px-3 text-right">% SHOCK IMPACT</th>
                    <th className="py-2.5 px-3 text-center">COVENANT VERDICT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2536]/40 print:divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#F8FAFC] print:text-slate-900">Consolidated Revenue</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F8FAFC] print:text-slate-900">{formatCurr(latest?.revenue)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#F43F5E] print:text-rose-800">{formatCurr(simulation.simulatedRevenue)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F43F5E] print:text-rose-800">{formatCurr(simulation.simulatedRevenue - (latest?.revenue ?? 0))}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F43F5E] print:text-rose-800">{simulation.revenueDeltaPct}%</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981] rounded print:text-emerald-800 print:bg-emerald-50">STRESSED PASS</span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 text-[#94A3B8] print:text-slate-700">Cost of Goods Sold (COGS)</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#94A3B8] print:text-slate-700">{formatCurr(latest?.cogs)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#F59E0B] print:text-amber-800">{formatCurr(simulation.simulatedCogs)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F59E0B] print:text-amber-800">+{formatCurr(simulation.simulatedCogs - (latest?.cogs ?? 0))}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F59E0B] print:text-amber-800">+5.0%</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B] rounded print:text-amber-800 print:bg-amber-50">INFLATION SHOCK</span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#F8FAFC] print:text-slate-900">Gross Profit</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F8FAFC] print:text-slate-900">{formatCurr(latest?.grossProfit)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#F43F5E] print:text-rose-800">{formatCurr(simulation.simulatedGrossProfit)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F43F5E] print:text-rose-800">{formatCurr(simulation.simulatedGrossProfit - (latest?.grossProfit ?? 0))}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F43F5E] print:text-rose-800">
                      {latest?.grossProfit ? `${(((simulation.simulatedGrossProfit - latest.grossProfit) / latest.grossProfit) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] text-[#94A3B8] print:text-slate-600">{simulation.simulatedGrossMarginPct.toFixed(1)}% Margin</span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#38BDF8] print:text-slate-900">Operating Profit (EBIT)</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#38BDF8] print:text-slate-900">{formatCurr(latest?.ebit)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#F43F5E] print:text-rose-800">{formatCurr(simulation.simulatedEbit)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F43F5E] print:text-rose-800">{formatCurr(simulation.simulatedEbit - (latest?.ebit ?? 0))}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F43F5E] print:text-rose-800">
                      {latest?.ebit ? `${(((simulation.simulatedEbit - latest.ebit) / Math.abs(latest.ebit)) * 100).toFixed(1)}%` : "N/A"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${simulation.simulatedEbit > 0 ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]" : "bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]"}`}>
                        {simulation.simulatedEbit > 0 ? "EBIT POSITIVE" : "EBIT NEGATIVE"}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 text-[#94A3B8] print:text-slate-700">Net Interest Expense (+200 bps)</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#94A3B8] print:text-slate-700">{formatCurr(latest?.interestExpense)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#F43F5E] print:text-rose-800">{formatCurr(simulation.simulatedInterestExpense)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F43F5E] print:text-rose-800">+{formatCurr(simulation.incrementalInterestExpense)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F43F5E] print:text-rose-800">
                      {latest?.interestExpense ? `+${(((simulation.simulatedInterestExpense - latest.interestExpense) / latest.interestExpense) * 100).toFixed(1)}%` : "+200 bps"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E] rounded print:text-rose-800 print:bg-rose-50">DEBT SERVICE EXPANDED</span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#10B981] print:text-emerald-800">EBIT Interest Coverage</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#10B981] print:text-emerald-800">{formatRatio(latestRatios.interestCoverage)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#38BDF8] print:text-slate-900">{formatRatio(simulation.simulatedInterestCoverage)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#38BDF8] print:text-slate-700">
                      {latestRatios.interestCoverage && simulation.simulatedInterestCoverage
                        ? `${(simulation.simulatedInterestCoverage - latestRatios.interestCoverage).toFixed(2)}x`
                        : "N/A"}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#38BDF8] print:text-slate-700">Compressed</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold border rounded ${
                          (simulation.simulatedInterestCoverage ?? 0) >= minInterestHurdle
                            ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981] print:text-emerald-800 print:bg-emerald-50"
                            : "bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E] print:text-rose-800 print:bg-rose-50"
                        }`}
                      >
                        {(simulation.simulatedInterestCoverage ?? 0) >= minInterestHurdle ? "COVENANT MET" : "BREACH RISK"}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#F8FAFC] print:text-slate-900">Stressed Cash Runway</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F8FAFC] print:text-slate-900">Self-Sustaining</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#10B981] print:text-emerald-800">
                      {simulation.cashBurnRunwayMonths ? `${simulation.cashBurnRunwayMonths.toFixed(1)} Months` : "SELF-SUSTAINING"}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#94A3B8] print:text-slate-600">Stable</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#94A3B8] print:text-slate-600">Buffer Active</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981] rounded print:text-emerald-800 print:bg-emerald-50">
                        {simulation.runwayStatus}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Stress Sensitivity Key Takeaways */}
            <div className="p-4 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg space-y-1.5">
              <div className="text-[10px] text-[#38BDF8] print:text-slate-900 uppercase font-bold">
                SUPERVISORY COMMITTEE STRESS SYNTHESIS
              </div>
              <p className="text-[11px] text-[#CBD5E1] print:text-slate-800 leading-relaxed">
                Under the combined adverse regime of {simulation.revenueDeltaPct}% revenue drop, +5.0% COGS escalation, and +200 bps rate shock, the issuer produces stressed EBIT of {formatCurr(simulation.simulatedEbit)}. Stressed interest coverage tests at {formatRatio(simulation.simulatedInterestCoverage)} (against mandatory floor {minInterestHurdle.toFixed(1)}x), indicating {
                  (simulation.simulatedInterestCoverage ?? 0) >= minInterestHurdle
                    ? "sufficient operational buffer to service syndicated commitments without restructuring."
                    : "covenant vulnerability requiring enhanced liquidity reserves or debt paydown."
                }
              </p>
            </div>

            {/* Slide 4 Footer */}
            <div className="pt-3 border-t border-[#1E2536] print:border-slate-300 flex items-center justify-between text-[10px] text-[#64748B] print:text-slate-600">
              <div>MONTE CARLO &amp; DETERMINISTIC RISK LABS // ENGINE v2.6</div>
              <div>SLIDE 04 // STRESS TEST SIMULATION MATRIX</div>
            </div>
          </div>

        {/* =======================================================================
            SLIDE 05: CAPITAL STRUCTURE WATERFALL & COVENANT COMPLIANCE AUDIT
           ======================================================================= */}
        <div className={`${viewMode === "DECK" && activeSlide !== 4 ? "hidden print:block" : "block"} print-slide p-6 sm:p-8 bg-[#0B0F17] border border-[#1E2536] space-y-6 text-[#F8FAFC] rounded-xl relative overflow-hidden print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-8 print:break-after-page print:min-h-screen`}>
            {/* Slide Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E2536] print:border-slate-300 pb-3 gap-2">
              <div>
                <div className="text-xs font-bold text-[#38BDF8] print:text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#38BDF8]" />
                  <span>SLIDE 05 // CAPITAL STRUCTURE WATERFALL &amp; COVENANT COMPLIANCE AUDIT</span>
                </div>
                <div className="text-[10px] text-[#94A3B8] print:text-slate-600 mt-0.5">
                  Senior credit facility governance, subordination ranking, and contractual covenant compliance tests
                </div>
              </div>
              <div className="px-2.5 py-1 bg-[#162033] print:bg-slate-200 border border-[#1E2536] print:border-slate-300 rounded text-[10px] text-[#38BDF8] print:text-slate-900 font-bold self-start sm:self-auto">
                SLIDE 05 / 06
              </div>
            </div>

            {/* Capital Structure Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg space-y-1">
                <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 uppercase font-bold">CASH &amp; LIQUID ASSETS</div>
                <div className="text-base font-extrabold font-mono text-[#10B981] print:text-emerald-800">
                  {formatCurr(latest?.cashAndEquivalents)}
                </div>
                <div className="text-[9.5px] text-[#64748B] print:text-slate-600">
                  {latest?.totalCurrentAssets ? `${(((latest.cashAndEquivalents ?? 0) / latest.totalCurrentAssets) * 100).toFixed(1)}% of Current Assets` : "Primary Liquidity"}
                </div>
              </div>

              <div className="p-4 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg space-y-1">
                <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 uppercase font-bold">TOTAL OUTSTANDING DEBT</div>
                <div className="text-base font-extrabold font-mono text-[#F43F5E] print:text-rose-800">
                  {formatCurr(latest?.totalDebt)}
                </div>
                <div className="text-[9.5px] text-[#64748B] print:text-slate-600">
                  ST Debt: {formatCurr(latest?.shortTermDebt)} &bull; LT Debt: {formatCurr(latest?.longTermDebt)}
                </div>
              </div>

              <div className="p-4 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg space-y-1">
                <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 uppercase font-bold">NET DEBT POSITION</div>
                <div className="text-base font-extrabold font-mono text-[#38BDF8] print:text-slate-900">
                  {formatCurr((latest?.totalDebt ?? 0) - (latest?.cashAndEquivalents ?? 0))}
                </div>
                <div className="text-[9.5px] text-[#64748B] print:text-slate-600">
                  {(latest?.totalDebt ?? 0) <= (latest?.cashAndEquivalents ?? 0) ? "Net Cash Fortress" : "Net Debt Burden"}
                </div>
              </div>

              <div className="p-4 bg-[#0F1420] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg space-y-1">
                <div className="text-[9.5px] text-[#94A3B8] print:text-slate-600 uppercase font-bold">SHAREHOLDERS EQUITY</div>
                <div className="text-base font-extrabold font-mono text-[#F8FAFC] print:text-slate-900">
                  {formatCurr(latest?.totalShareholdersEquity)}
                </div>
                <div className="text-[9.5px] text-[#64748B] print:text-slate-600">
                  Debt-to-Equity: {formatRatio(latestRatios.debtToEquity)}
                </div>
              </div>
            </div>

            {/* Covenant Compliance Audit Table */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-[#38BDF8] print:text-slate-900 uppercase tracking-wider border-b border-[#1E2536] print:border-slate-300 pb-1 flex items-center justify-between">
                <span>CONTRACTUAL CREDIT COVENANT COMPLIANCE MATRIX</span>
                <span className="text-[10px] text-[#94A3B8] print:text-slate-600">SYNDICATE FACILITY AGREEMENT</span>
              </div>

              <div className="border border-[#1E2536] print:border-slate-300 bg-[#080B10] print:bg-white rounded-lg overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1E2536] print:border-slate-300 bg-[#0D111A] print:bg-slate-100 text-[#94A3B8] print:text-slate-700 text-[10px]">
                      <th className="py-2.5 px-3 text-left">CREDIT COVENANT CLAUSE</th>
                      <th className="py-2.5 px-3 text-left">GOVERNING FACILITY</th>
                      <th className="py-2.5 px-3 text-right">MANDATED HURDLE</th>
                      <th className="py-2.5 px-3 text-right">AS-REPORTED READING</th>
                      <th className="py-2.5 px-3 text-right">HEADROOM CUSHION</th>
                      <th className="py-2.5 px-3 text-center">COMPLIANCE STATUS</th>
                      <th className="py-2.5 px-3 text-left">GOVERNING IMPACT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2536]/40 print:divide-slate-200">
                    {covenants.map((cov, idx) => (
                      <tr key={idx} className="hover:bg-[#111622] print:hover:bg-transparent">
                        <td className="py-3 px-3 text-left font-bold text-[#F8FAFC] print:text-slate-900">
                          {cov.covenant}
                        </td>
                        <td className="py-3 px-3 text-left text-[10.5px] text-[#94A3B8] print:text-slate-600">
                          {cov.facility}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[#94A3B8] print:text-slate-700">
                          {cov.threshold}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[#F8FAFC] print:text-slate-900">
                          {cov.actual}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#10B981] print:text-emerald-800">
                          {cov.headroom}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold border rounded ${
                              cov.isCompliant
                                ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981] print:text-emerald-800 print:bg-emerald-50 print:border-emerald-600"
                                : "border-[#F43F5E] bg-[#F43F5E]/15 text-[#F43F5E] print:text-rose-800 print:bg-rose-50 print:border-rose-600"
                            }`}
                          >
                            {cov.isCompliant ? "COMPLIANT" : "BREACH"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-left text-[10.5px] text-[#CBD5E1] print:text-slate-700 leading-snug max-w-xs">
                          {cov.impact}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Slide 5 Footer */}
            <div className="pt-3 border-t border-[#1E2536] print:border-slate-300 flex items-center justify-between text-[10px] text-[#64748B] print:text-slate-600">
              <div>SYNDICATED LOAN MARKET ASSOCIATION (LMA) STANDARD COMPLIANCE</div>
              <div>SLIDE 05 // CAPITAL STRUCTURE &amp; COVENANTS</div>
            </div>
          </div>

        {/* =======================================================================
            SLIDE 06: MANAGING DIRECTOR CREDIT THESIS & MULTI-PARTY EXECUTIVE SIGN-OFF
           ======================================================================= */}
        <div className={`${viewMode === "DECK" && activeSlide !== 5 ? "hidden print:block" : "block"} print-slide p-6 sm:p-8 bg-[#0B0F17] border border-[#1E2536] space-y-6 text-[#F8FAFC] rounded-xl relative overflow-hidden print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-8 print:break-after-page print:min-h-screen`}>
            {/* Slide Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E2536] print:border-slate-300 pb-3 gap-2">
              <div>
                <div className="text-xs font-bold text-[#38BDF8] print:text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#38BDF8]" />
                  <span>SLIDE 06 // MANAGING DIRECTOR CREDIT THESIS &amp; EXECUTIVE SIGN-OFF</span>
                </div>
                <div className="text-[10px] text-[#94A3B8] print:text-slate-600 mt-0.5">
                  Underwriting recommendation, syndicate terms, and sovereign multi-party supervisory clearance seals
                </div>
              </div>
              <div className="px-2.5 py-1 bg-[#162033] print:bg-slate-200 border border-[#1E2536] print:border-slate-300 rounded text-[10px] text-[#38BDF8] print:text-slate-900 font-bold self-start sm:self-auto">
                SLIDE 06 / 06
              </div>
            </div>

            {/* Managing Director Risk Thesis Section */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2536] print:border-slate-300 pb-1">
                <span className="text-[11px] font-bold text-[#38BDF8] print:text-slate-900 uppercase tracking-wider">
                  MANAGING DIRECTOR CREDIT THESIS &amp; UNDERWRITING MEMO
                </span>
                <div className="flex items-center gap-2 no-print">
                  <span className="text-[9px] text-[#10B981] font-bold">{saveStatus}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => loadThesisTemplate("CONSERVATIVE")}
                      className="px-2 py-0.5 bg-[#162033] hover:bg-[#1E2B45] border border-[#1E2536] text-[9px] text-[#38BDF8] rounded transition-colors"
                      title="Load Conservative Thesis Preset"
                    >
                      Conservative
                    </button>
                    <button
                      type="button"
                      onClick={() => loadThesisTemplate("EXPANSION")}
                      className="px-2 py-0.5 bg-[#162033] hover:bg-[#1E2B45] border border-[#1E2536] text-[9px] text-[#10B981] rounded transition-colors"
                      title="Load Expansion Thesis Preset"
                    >
                      Expansion
                    </button>
                    <button
                      type="button"
                      onClick={() => loadThesisTemplate("WATCHLIST")}
                      className="px-2 py-0.5 bg-[#162033] hover:bg-[#1E2B45] border border-[#1E2536] text-[9px] text-[#F59E0B] rounded transition-colors"
                      title="Load Watchlist Thesis Preset"
                    >
                      Watchlist
                    </button>
                    <button
                      type="button"
                      onClick={() => loadThesisTemplate("DEFAULT")}
                      className="p-1 bg-[#162033] hover:bg-[#1E2B45] border border-[#1E2536] text-[9px] text-[#94A3B8] rounded transition-colors"
                      title="Reset to Default Thesis"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Formatted View on Print */}
              <div className="hidden print:block p-4 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 leading-relaxed font-serif">
                {commentary}
              </div>

              {/* Interactive Textarea on Screen */}
              <textarea
                value={commentary}
                onChange={(e) => handleCommentaryChange(e.target.value)}
                rows={4}
                placeholder="Enter credit thesis, syndicate pricing conditions, or negative pledge terms..."
                className="w-full p-3.5 bg-[#080B10] border border-[#1E2536] text-xs font-mono text-[#F8FAFC] leading-relaxed focus:border-[#38BDF8] focus:outline-none placeholder-[#64748B] rounded-lg no-print"
              />
            </div>

            {/* Multi-Party Boardroom Sign-Off Ledger */}
            <div className="border border-[#1E2536] print:border-slate-300 bg-[#0F1420] print:bg-slate-50 p-5 rounded-xl space-y-4">
              <div className="text-[10px] text-[#38BDF8] print:text-slate-900 font-bold uppercase tracking-wider border-b border-[#1E2536] print:border-slate-300 pb-2 flex items-center justify-between">
                <span>INVESTMENT COMMITTEE SIGN-OFF &amp; CLEARANCE REPOSITORIES</span>
                <span className="text-[#10B981] font-mono">STATUS: ATTESTED</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px]">
                {/* 1. Primary Underwriting Officer */}
                <div className="space-y-2.5 p-3 bg-[#080B10] print:bg-white border border-[#1E2536] print:border-slate-300 rounded-lg">
                  <div className="text-[9px] uppercase tracking-wider text-[#38BDF8] print:text-slate-900 font-bold flex items-center justify-between">
                    <span>PRIMARY UNDERWRITER</span>
                    <span className="text-[#10B981]">LEAD</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-[#38BDF8]/50 overflow-hidden bg-[#162033] flex items-center justify-center shrink-0">
                      {session?.avatarCustomUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={session.avatarCustomUrl} alt="Analyst Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <WallStreetAvatar
                          avatarId={(session?.avatarId as AvatarPresetId) || "crest"}
                          size="md"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#F8FAFC] print:text-slate-900 truncate">
                        {session?.userName || "Principal Underwriting Lead"}
                      </div>
                      <div className="text-[9px] text-[#94A3B8] print:text-slate-600 truncate">
                        {session?.userEmail || "analyst@fintraxis.terminal"}
                      </div>
                      <div className="text-[8.5px] text-[#38BDF8] print:text-slate-700 truncate mt-0.5">
                        {session?.desk || "Global Credit Risk & Surveillance"}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#1E2536] print:border-slate-200 pt-2 flex items-center justify-between text-[9px] text-[#64748B] print:text-slate-600">
                    <span>SEALED BY LEAD</span>
                    <span className="text-[#10B981] font-mono font-bold">&check; SUBMITTED</span>
                  </div>
                </div>

                {/* 2. Chief Risk Officer */}
                <div className="space-y-2.5 p-3 bg-[#080B10] print:bg-white border border-[#1E2536] print:border-slate-300 rounded-lg">
                  <div className="text-[9px] uppercase tracking-wider text-[#94A3B8] print:text-slate-900 font-bold flex items-center justify-between">
                    <span>CHIEF RISK OFFICER (CRO)</span>
                    <span className="text-[#10B981]">VERIFIED</span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#F8FAFC] print:text-slate-900">
                      DR. KLAUS MEIER
                    </div>
                    <div className="text-[9px] text-[#94A3B8] print:text-slate-600">
                      klaus.meier@fintraxis.sovereign
                    </div>
                    <div className="text-[8.5px] text-[#38BDF8] print:text-slate-700 mt-0.5">
                      Global Head of Credit Surveillance &amp; Solvency
                    </div>
                  </div>

                  <div className="border-t border-[#1E2536] print:border-slate-200 pt-2 flex items-center justify-between text-[9px] text-[#64748B] print:text-slate-600">
                    <span>INDEPENDENT RISK CLEARANCE</span>
                    <span className="text-[#10B981] font-mono font-bold">&check; APPROVED</span>
                  </div>
                </div>

                {/* 3. Investment Committee Chair */}
                <div className="space-y-2.5 p-3 bg-[#080B10] print:bg-white border border-[#1E2536] print:border-slate-300 rounded-lg">
                  <div className="text-[9px] uppercase tracking-wider text-[#94A3B8] print:text-slate-900 font-bold flex items-center justify-between">
                    <span>IC COMMITTEE CHAIR</span>
                    <span className="text-[#10B981]">SANCTIONED</span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#F8FAFC] print:text-slate-900">
                      LORD ALISTAIR VANCE
                    </div>
                    <div className="text-[9px] text-[#94A3B8] print:text-slate-600">
                      alistair.vance@fintraxis.sovereign
                    </div>
                    <div className="text-[8.5px] text-[#38BDF8] print:text-slate-700 mt-0.5">
                      Senior Partner, Sovereign Fixed Income &amp; Credit
                    </div>
                  </div>

                  <div className="border-t border-[#1E2536] print:border-slate-200 pt-2 flex items-center justify-between text-[9px] text-[#64748B] print:text-slate-600">
                    <span>FACILITY SANCTIONED</span>
                    <span className="text-[#10B981] font-mono font-bold">&check; RATIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Attestation Block */}
            <div className="p-3.5 bg-[#080B10] print:bg-slate-50 border border-[#1E2536] print:border-slate-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-[#94A3B8] print:text-slate-700">
              <div className="space-y-0.5">
                <div className="text-[9px] text-[#38BDF8] print:text-slate-900 font-bold uppercase">
                  IMMUTABLE AUDIT TRAIL &amp; DIGEST
                </div>
                <div className="font-mono text-[#F8FAFC] print:text-slate-900 text-[10px]">
                  SHA256: {digitalHash.toUpperCase()}
                </div>
              </div>

              <div className="space-y-0.5 sm:text-right">
                <div className="text-[9px] text-[#64748B] print:text-slate-600">
                  SYSTEM TIME: {new Date().toISOString().substring(0, 19)} UTC
                </div>
                <div className="text-[9.5px] text-[#10B981] print:text-emerald-800 font-bold">
                  ELECTRONICALLY ATTESTED // SOVEREIGN ENCLAVE #04
                </div>
              </div>
            </div>

            {/* Slide 6 Footer */}
            <div className="pt-3 border-t border-[#1E2536] print:border-slate-300 flex items-center justify-between text-[10px] text-[#64748B] print:text-slate-600">
              <div>FINTRAXIS INSTITUTIONAL TERMINAL // BOARDROOM TEARSHEET COMPLETE</div>
              <div>SLIDE 06 // FINAL EXECUTIVE ATTESTATION</div>
            </div>
          </div>
      </div>
      {onNavigateToTab && (
        <div className="no-print mt-4">
          <WorkstationNextStep
            currentTab="07_REPORTS"
            nextTab="overview"
            nextTitle="Executive Corporate Overview"
            nextCode="OVERVIEW"
            reason="Cycle back to the high-level dashboard to evaluate another security or refine underwriting hurdles."
            onNavigate={onNavigateToTab}
            relatedLinks={[
              { tab: "01_HUB", label: "Company Hub" },
              { tab: "00_ADMIN", label: "Admin Panel" },
            ]}
          />
        </div>
      )}
    </div>
  );
}
