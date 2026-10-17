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
  "00_ADMIN": {
    title: "OPERATIONAL GOVERNANCE CONSOLE: TELEMETRY & SYSTEM MASTER",
    badge: "SYSTEM GOVERNANCE",
    purpose:
      "Centralized supervisory control center providing real-time infrastructure telemetry, Security Master entity management, global analytical risk policy calibration, user access control, and regulatory audit logging.",
    actions: [
      "Infrastructure Telemetry: Audit SQLite WAL concurrency, process memory, and data provider status.",
      "Security Master Registry: Ingest new corporate issuers and trigger multi-period statement re-synchronizations.",
      "Policy Hurdle Calibration: Adjust reference thresholds for Net Debt/EBITDA, Interest Coverage, and Current Ratio.",
    ],
    decisionRule:
      "RULE 0.1: Administrative policy modifications are timestamped and committed to the system audit journal. Destructive operations require Lead Analyst or Super Admin clearance.",
  },
  overview: {
    title: "CORPORATE OVERVIEW: EXECUTIVE HEALTH & MARKET VALUATION",
    badge: "EXECUTIVE SUMMARY",
    purpose:
      "High-level executive briefing providing distinct separation between intraday market trading data and multi-period reported accounting fundamentals, with instant solvency status checks.",
    actions: [
      "Market vs Accounting: Compare live market capitalization against audited annual revenue and core EBIT.",
      "Credit Hurdle Assessment: Review leverage (<= 3.50x), coverage (>= 2.50x), and liquidity (>= 1.10x) status.",
      "Trajectory Inspection: Audit historical multi-period revenue momentum and operating profit trajectory.",
    ],
    decisionRule:
      "RULE 0.2: Market valuation and reported accounting fundamentals must remain visually and conceptually separated to prevent mixing intraday market moves with fiscal accounting records.",
  },
  "01_HUB": {
    title: "MODULE 1: COMPANY INTELLIGENCE WORKSPACE & SECURITIES MASTER",
    badge: "COMPANY INTELLIGENCE",
    purpose:
      "Universal entity resolution across USA (SEC EDGAR), India (NSE/BSE), Japan (TSE), and global exchanges. Ingests raw reported financials, maintains native currency preservation, and maps securities to local SQLite master database.",
    actions: [
      "Omnibar Global Search: Search companies by ticker, CIK, ISIN, or name to verify reporting currency and exchange.",
      "Multi-Period Statement Audit: Inspect available reporting periods, filing URLs, and scale units (Millions, Crores, Billions).",
      "Interactive Chart Inspection: Examine trading corridors and price action alongside accounting fundamentals.",
    ],
    decisionRule:
      "RULE 1.1: Financial figures must strictly maintain native as-reported reporting currency (ISO 4217). Cross-border comparisons require auditable reference FX rates.",
  },
  "02_HEALTH": {
    title: "MODULE 2: FINANCIAL HEALTH ANALYSIS & 3-STATEMENT ACCOUNTING",
    badge: "FINANCIAL HEALTH",
    purpose:
      "Explains the company's financial condition using genuine multi-period 3-statement financial ledgers (Income Statement, Balance Sheet, Cash Flow) and reproducible credit solvency ratios.",
    actions: [
      "3-Statement XBRL Audit: Click any gold-marked statement cell to inspect its underlying SEC XBRL tag, filing URL, and formula calculation tree.",
      "Solvency & Liquidity Multiples: Audit Current Ratio, Quick Ratio, Debt-to-Equity, Net Debt / EBITDA, and Interest Coverage.",
      "Cash Flow Quality: Review Operating Cash Flow vs Net Income and Free Cash Flow (CFO - CapEx) generation.",
    ],
    decisionRule:
      "RULE 2.1: All financial metrics are calculated via pure backend functions. Zero silent arithmetic substitutions are permitted.",
  },
  "02_STATEMENTS": {
    title: "MODULE 2: FINANCIAL STATEMENTS (XBRL AUDIT TRAIL)",
    badge: "LINE-ITEM PROVENANCE",
    purpose:
      "Full 3-statement provenance engine (Income Statement, Balance Sheet, Cash Flow) across multi-period annual filings with cell-level XBRL audit lineage.",
    actions: [
      "Click-to-Audit Cells: Click any financial cell with gold marker to open the right-hand Audit Sidecar showing XBRL tag and source filing URL.",
      "Period Horizon: Audit sequential FY historical reporting periods to identify balance sheet trends.",
    ],
    decisionRule:
      "RULE 2.2: Every statement cell must tie back to a verified SEC EDGAR or statutory filing tag.",
  },
  "03_HEALTH": {
    title: "MODULE 2: CREDIT RISK & SOLVENCY ASSESSMENT",
    badge: "SOLVENCY HEALTH",
    purpose:
      "Evaluates capital structure robustness, cash flow quality, debt service capacity, and DuPont ROE breakdown.",
    actions: [
      "Inspect Ratio Categories: Review Liquidity, Solvency, and Coverage multiples.",
      "Altman Z-Score Diagnostic: Audit the 5-factor multivariate credit distress formula.",
    ],
    decisionRule:
      "RULE 2.3: Altman Z-Score < 1.81 signifies distress. Interest Coverage < 2.50x triggers automatic credit facility covenant review.",
  },
  "03_VULNERABILITY": {
    title: "MODULE 3: FINANCIAL VULNERABILITY MONITOR & SURVEILLANCE",
    badge: "EARLY WARNING",
    purpose:
      "Identifies early potential financial deterioration, working capital stress, refinancing walls, and debt covenant proximity.",
    actions: [
      "Vulnerability Matrix Review: Inspect categorized severity flags (CRITICAL, ELEVATED, WATCH) with calculated breach distances.",
      "Working Capital Stress: Track receivables growth vs revenue growth and inventory buildup pace.",
      "Refinancing Wall Audit: Identify short-term debt maturities exceeding liquid cash & marketable securities.",
    ],
    decisionRule:
      "RULE 3.1: Two or more CRITICAL flags require mandatory Investment Committee Escalation and temporary freeze on credit facility expansions.",
  },
  "04_VULNERABILITY": {
    title: "MODULE 3: FINANCIAL VULNERABILITY MONITOR",
    badge: "EARLY WARNING",
    purpose:
      "Algorithmic surveillance monitoring capital erosion, aggressive accounting red-flags, liquidity contraction, and covenant proximity.",
    actions: [
      "Inspect early warning triggers with affected reporting periods.",
    ],
    decisionRule:
      "RULE 3.2: Configurable hurdles calibrate against operator underwriting guidelines.",
  },
  "04_DEPENDENCIES": {
    title: "MODULE 4: BUSINESS DEPENDENCY INTELLIGENCE",
    badge: "BUSINESS DEPENDENCIES",
    purpose:
      "Uncovers disclosed operational dependencies, single-source suppliers, sovereign infrastructure licensors, and major customer distribution channels from statutory notes.",
    actions: [
      "Sourcing Architecture: Identify critical sole-source manufacturing bottlenecks (e.g., TSMC custom silicon, Foxconn assembly).",
      "Customer Concentration: Verify whether any commercial off-taker exceeds the 10% statutory disclosure threshold under ASC 280 / Ind-AS 108.",
      "Analyst Sourcing Notes: Record proprietary supply chain findings labeled with explicit data-provenance tags.",
    ],
    decisionRule:
      "RULE 4.1: If supplier or customer individual identities are withheld as confidential trade secrets under regulatory exemptions, the platform explicitly notes the limitation without fabricating counterparties.",
  },
  "05_CONCENTRATION": {
    title: "MODULE 5: CONCENTRATION & EXPOSURE ANALYSIS",
    badge: "CONCENTRATION & EXPOSURE",
    purpose:
      "Quantifies revenue diversification across operating product divisions and geographic jurisdictions using the Herfindahl-Hirschman Index (HHI).",
    actions: [
      "Product Line Contribution: Review revenue percentage generated by flagship vs secondary business segments.",
      "Geographic Jurisdiction Exposure: Measure exposure to international regions, tariffs, and cross-border currency regimes.",
      "Herfindahl-Hirschman Index: Assess market concentration regime (<1,500 Diversified, 1,500-2,500 Moderate, >2,500 Concentrated).",
    ],
    decisionRule:
      "RULE 5.1: High product or geographic concentration (HHI > 2,500) mandates stress testing for regional macro downturns in Module 6.",
  },
  "05_SIMULATOR": {
    title: "MODULE 6: SCENARIO & RESILIENCE SIMULATOR",
    badge: "STRESS SIMULATION",
    purpose:
      "Simulates enterprise resilience under severe macroeconomic shocks (revenue contraction, input inflation, and monetary benchmark rate hikes).",
    actions: [
      "Shock Sliders: Adjust top-line Revenue Haircut (-30% to +30%), COGS inflation, and Rate Hikes (+0 to +500 bps).",
      "Liquidity Runway Gauge: Observe remaining cash burn runway in months under pro-forma stressed operating cash draw.",
    ],
    decisionRule:
      "RULE 6.1: Modeled estimates represent synthetic stress transmissions, not predictive guarantees of future performance.",
  },
  "06_SIMULATOR": {
    title: "MODULE 6: SCENARIO & RESILIENCE SIMULATOR",
    badge: "STRESS SIMULATION",
    purpose:
      "Simulates enterprise resilience under severe macroeconomic shocks (revenue contraction, input inflation, and monetary benchmark rate hikes).",
    actions: [
      "Shock Sliders: Adjust top-line Revenue Haircut (-30% to +30%), COGS inflation, and Rate Hikes (+0 to +500 bps).",
      "Liquidity Runway Gauge: Observe remaining cash burn runway in months under pro-forma stressed operating cash draw.",
      "Pro-Forma Covenant Review: Check whether stressed interest coverage breaches debt covenant floors (< 2.50x).",
    ],
    decisionRule:
      "RULE 6.2: Modeled estimates represent synthetic stress transmissions, not predictive guarantees of future performance.",
  },
  "06_MEMO": {
    title: "RESEARCH REPORTS & INVESTMENT COMMITTEE DOSSIER",
    badge: "BOARDROOM DELIVERABLE",
    purpose:
      "Consolidates findings across all core modules into an evidence-backed Investment Committee Tearsheet with SHA-256 cryptographic verification.",
    actions: [
      "Verify Module Consistency: Ensure displayed figures match underlying statement ledgers and calculations.",
      "Export PDF / CSV: Generate print-optimized PDF tearsheets and CSV data records.",
    ],
    decisionRule:
      "RULE 7.1: File hashes verify data transit integrity, not factual accounting veracity.",
  },
  "07_REPORTS": {
    title: "RESEARCH REPORTS & INVESTMENT COMMITTEE DOSSIER",
    badge: "BOARDROOM DELIVERABLE",
    purpose:
      "Consolidates findings across all 6 core modules into an evidence-backed Investment Committee Tearsheet with SHA-256 cryptographic verification.",
    actions: [
      "Verify Module Consistency: Ensure displayed figures match underlying statement ledgers and calculations.",
      "Export PDF / CSV: Generate print-optimized PDF tearsheets and CSV data records with audit stamps.",
      "Executive Summary: Synthesize credit tier, early warnings, business dependencies, and stressed liquidity runway.",
    ],
    decisionRule:
      "RULE 7.2: File hashes verify data transit integrity, not factual accounting veracity.",
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
          <HelpCircle className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="font-bold tracking-wider text-[#38BDF8] text-[11px] uppercase">
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
            <div className="flex items-center gap-1.5 text-[#38BDF8] text-[10.5px] font-bold uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-[#38BDF8]" />
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
