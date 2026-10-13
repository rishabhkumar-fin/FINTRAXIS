"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Target, Zap } from "lucide-react";
import { ModuleTab } from "./NavigationTabs";

interface GuideContent {
  title: string;
  badge: string;
  purpose: string;
  actions: string[];
  decisionRule: string;
}

const MODULE_GUIDES: Record<ModuleTab, GuideContent> = {
  "01_HUB": {
    title: "SECURITIES DIRECTORY: GLOBAL SECURITY MASTER & ENTITY RESOLUTION",
    badge: "OMNICHANNEL RESOLUTION",
    purpose:
      "Universal entity resolution across USA (SEC EDGAR), India (NSE/BSE), Japan (TSE), and European exchanges. Ingests raw reported financials, maintains native currency preservation, and maps securities to local SQLite master database.",
    actions: [
      "Omnibar Global Search: Type 2+ characters to query live global ticker database and preview exchange metadata.",
      "1-Click SQLite Ingestion: Click 'INGEST' to pull multi-period 10-K/Annual Report financial statements directly into local database.",
      "Institutional HUD Inspection: Review live market cap, 52-week trading corridor, P/E multiples, and reporting scale (Millions, Crores, Billions).",
    ],
    decisionRule:
      "RULE 1.1: Financial figures must strictly maintain native as-reported reporting currency (ISO 4217). Cross-border comparisons require auditable, timestamped reference FX rates.",
  },
  "02_STATEMENTS": {
    title: "FINANCIAL STATEMENTS: MULTI-PERIOD LEDGER & XBRL AUDIT TRAIL",
    badge: "LINE-ITEM PROVENANCE",
    purpose:
      "Full 3-statement provenance engine (Income Statement, Balance Sheet, Cash Flow) across multi-period annual filings with cell-level XBRL audit lineage.",
    actions: [
      "Click-to-Audit Cells: Click any financial cell with gold marker to open the right-hand Audit Sidecar showing XBRL tag, source filing URL, and formula DAG.",
      "Period Horizon Toggle: Audit sequential FY historical reporting periods to identify balance sheet trends and revenue momentum.",
      "Missing Item Protocol: Any unpopulated field renders strictly as 'N/D' (Not Disclosed), preventing false arithmetic zeros.",
    ],
    decisionRule:
      "RULE 2.1: An unaudited line item is inadmissible for institutional underwriting. Every statement cell must tie back to a verified SEC EDGAR or statutory filing tag.",
  },
  "03_HEALTH": {
    title: "CREDIT RISK & SOLVENCY: DEFAULT HEALTH & CAPITAL MULTIPLES",
    badge: "SOLVENCY HEALTH",
    purpose:
      "Evaluates capital structure robustness, cash flow quality, debt service capacity, and DuPont ROE breakdown through a directed acyclic graph (DAG) of non-coerced accounting formulas.",
    actions: [
      "Inspect Ratio Categories: Review Liquidity (Current, Quick, Cash), Solvency (Debt/Equity, Debt/EBITDA), and Coverage (EBIT/Interest, OCF/Debt).",
      "DuPont 3-Factor Deconstruction: Deconstruct Return on Equity into Net Margin × Asset Turnover × Financial Leverage.",
      "Altman Z-Score Diagnostic: Audit the 5-factor multivariate credit distress formula determining bankruptcy probability.",
    ],
    decisionRule:
      "RULE 3.1: Altman Z-Score < 1.81 signifies imminent distress (Red Zone). Interest Coverage < 2.50x triggers automatic credit facility covenant review.",
  },
  "04_VULNERABILITY": {
    title: "SURVEILLANCE DESK: BASEL III EARLY WARNING SYSTEM & COVENANTS",
    badge: "BREACH SURVEILLANCE",
    purpose:
      "Continuous algorithmic surveillance monitoring capital erosion, aggressive accounting red-flags, liquidity contraction, and covenant proximity.",
    actions: [
      "Vulnerability Matrix Review: Inspect categorized severity flags (CRITICAL, ELEVATED, WATCH) with calculated breach distances.",
      "Working Capital Stress Detection: Track receivables growth vs revenue growth and inventory buildup pace.",
      "Refinancing Wall Audit: Identify imminent short-term debt maturities exceeding liquid cash & marketable securities.",
    ],
    decisionRule:
      "RULE 4.1: Two or more CRITICAL flags require mandatory Investment Committee Escalation and temporary freeze on credit facility expansions.",
  },
  "05_SIMULATOR": {
    title: "CAPITAL STRESS LAB: MACROECONOMIC SENSITIVITY & SHOCK SIMULATION",
    badge: "PRO-FORMA SENSITIVITY",
    purpose:
      "Simulates enterprise resilience under severe macroeconomic shocks (+/- revenue haircut, operating margin contraction, and benchmark monetary rate hikes).",
    actions: [
      "Shock Sliders: Adjust top-line Revenue Haircut (-30% to 0%), Operating Margin Squeeze, and Benchmark Interest Rate Hikes (+0 to +500 bps).",
      "Liquidity Runway Gauge: Observe remaining cash burn runway in months under pro-forma stressed operating cash draw.",
      "Pro-Forma Ratio Impact: Compare baseline interest coverage, debt/EBITDA, and net margins against post-shock pro-forma numbers.",
    ],
    decisionRule:
      "RULE 5.1: If stressed liquidity runway drops below 6.0 months under a 20% revenue shock and +200 bps rate hike, mandatory cash collateral is required.",
  },
  "06_MEMO": {
    title: "INVESTMENT COMMITTEE: CREDIT UNDERWRITING MEMO & BOARDROOM DECK",
    badge: "BOARDROOM DELIVERABLE",
    purpose:
      "Credit committee investment memorandum synthesizing executive risk tier (BlackRock Aladdin rating scale), covenant compliance matrix, stress results, and underwriter attestations.",
    actions: [
      "Managing Director Risk Thesis: Input custom underwriter commentary (auto-saved securely to local browser storage).",
      "Covenant Compliance Grid: Verify test compliance for Net Debt/EBITDA, Interest Coverage, and Working Capital minimums.",
      "1-Click Boardroom PDF Tearsheet: Click 'EXPORT BOARDROOM MEMO' to generate a clean, vector print-optimized PDF with navigation stripped.",
    ],
    decisionRule:
      "RULE 6.1: Investment Committee approval requires Aladdin Composite Score >= 70/100, zero critical covenant defaults, and formal digital attestation sign-off.",
  },
};

interface ModuleGuideProps {
  moduleKey: ModuleTab;
}

export function ModuleGuide({ moduleKey }: ModuleGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const guide = MODULE_GUIDES[moduleKey];

  if (!guide) return null;

  return (
    <div className="mb-4 bg-[#0B0F17] border border-[#1E2536] text-xs font-mono select-none overflow-hidden rounded">
      {/* Collapsible Bar Header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-2 flex items-center justify-between bg-[#0F1420] hover:bg-[#151C2C] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-[#C5A880]" />
          <span className="font-bold tracking-wider text-[#C5A880] text-[11px] uppercase">
            HOW TO USE THIS MODULE
          </span>
          <span className="text-[#475569]">&bull;</span>
          <span className="text-[10px] text-[#64748B] hidden sm:inline">{guide.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] px-1.5 py-0.5 bg-[#172033] border border-[#232F47] text-[#38BDF8] font-bold">
            {guide.badge}
          </span>
          <span className="text-[10px] text-[#94A3B8] flex items-center gap-1 font-semibold">
            {isOpen ? "[COLLAPSE GUIDE]" : "[EXPAND FIELD GUIDE]"}
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </div>
      </button>

      {/* Expanded 3-Card Institutional Field Guide */}
      {isOpen && (
        <div className="p-4 bg-[#0A0D15] border-t border-[#1E2536] grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-150">
          {/* Card 1: Purpose */}
          <div className="p-3 bg-[#111622] border border-[#1E2536] rounded space-y-2">
            <div className="flex items-center gap-1.5 text-[#C5A880] text-[10.5px] font-bold uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>01. Operational Purpose</span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
              {guide.purpose}
            </p>
          </div>

          {/* Card 2: Core Actions */}
          <div className="p-3 bg-[#111622] border border-[#1E2536] rounded space-y-2">
            <div className="flex items-center gap-1.5 text-[#38BDF8] text-[10.5px] font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>02. Core Actions &amp; Controls</span>
            </div>
            <ul className="space-y-1.5 text-[10.5px] text-[#94A3B8] leading-tight">
              {guide.actions.map((act, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#38BDF8] font-bold">&rsaquo;</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 3: Decision Rule */}
          <div className="p-3 bg-[#111622] border border-[#1E2536] rounded space-y-2">
            <div className="flex items-center gap-1.5 text-[#10B981] text-[10.5px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>03. Institutional Decision Rule</span>
            </div>
            <div className="p-2 bg-[#080B10] border border-[#1F293D] rounded text-[11px] text-[#E2E8F0] font-mono leading-relaxed">
              {guide.decisionRule}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
