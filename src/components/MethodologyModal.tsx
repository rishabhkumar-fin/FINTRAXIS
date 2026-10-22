"use client";

import React, { useState } from "react";
import {
  BookOpen,
  X,
  ShieldCheck,
  Calculator,
  Scale,
  Database,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MethodologyTab = "RATIOS" | "TOLERANCES" | "HHI" | "SCORING" | "DATA_SOURCES" | "DISCLAIMER";

export function MethodologyModal({ isOpen, onClose }: MethodologyModalProps) {
  const [activeTab, setActiveTab] = useState<MethodologyTab>("RATIOS");

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="methodology-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 font-mono select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#0B1220] border border-[#1E293B] max-w-4xl w-full max-h-[90dvh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-[#090D17] border-b border-[#182337] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2563EB]/15 border border-[#38BDF8]/40 rounded-lg text-[#38BDF8]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-[#2563EB]/20 text-[#38BDF8] font-bold rounded border border-[#2563EB]/40">
                  METHODOLOGY & STANDARDS
                </span>
                <span className="text-[10px] text-[#64748B] hidden sm:inline">
                  VIVA & AUDIT TRANSPARENCY ACCORD
                </span>
              </div>
              <h2 id="methodology-modal-title" className="text-base sm:text-lg font-bold text-white mt-0.5">
                Financial Formulas, Accounting Tolerances & Sourcing Specification
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-white bg-[#101A2E] rounded-lg border border-[#1E293B] cursor-pointer"
            aria-label="Close methodology modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#070A0F] border-b border-[#182337] overflow-x-auto text-xs">
          {[
            { id: "RATIOS" as MethodologyTab, label: "Core Ratios & Line Items", icon: Calculator },
            { id: "TOLERANCES" as MethodologyTab, label: "Balance Identity & ±0.01%", icon: Scale },
            { id: "HHI" as MethodologyTab, label: "HHI Concentration", icon: FileSpreadsheet },
            { id: "SCORING" as MethodologyTab, label: "Health Score & Tiers", icon: ShieldCheck },
            { id: "DATA_SOURCES" as MethodologyTab, label: "Data Sourcing & Freshness", icon: Database },
            { id: "DISCLAIMER" as MethodologyTab, label: "Scope & Limitations", icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#1E293B] text-[#38BDF8] border border-[#38BDF8]/40"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#101A2E]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#CBD5E1] leading-relaxed">
          {/* TAB 1: CORE RATIOS */}
          {activeTab === "RATIOS" && (
            <div className="space-y-4">
              <div className="p-3 bg-[#0E1626] border border-[#2563EB]/30 rounded-xl">
                <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                  1. NET DEBT / EBITDA (LEVERAGE MULTIPLE)
                </span>
                <div className="p-2 bg-[#070A0F] border border-[#182337] rounded font-mono text-[11px] text-[#38BDF8] my-1.5 space-y-1">
                  <div>Net Debt = (Short-Term Debt + Long-Term Debt) - (Cash &amp; Marketable Securities)</div>
                  <div>Leverage Ratio = Net Debt / Consolidated EBITDA</div>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  <strong>Source Line Items:</strong> Form 10-K Item 8 / Ind-AS Balance Sheet borrowings less cash and equivalents, divided by operating profit plus depreciation and amortization.
                </p>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  <strong>Interpretation:</strong> Estimates the theoretical years of operating cash earnings required to retire funded indebtedness. If Net Debt &le; 0, the entity is designated as a <em>Net Cash Fortress</em>.
                </p>
              </div>

              <div className="p-3 bg-[#0E1626] border border-[#2563EB]/30 rounded-xl">
                <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                  2. EBIT INTEREST COVERAGE (DEBT SERVICE SAFETY FLOOR)
                </span>
                <div className="p-2 bg-[#070A0F] border border-[#182337] rounded font-mono text-[11px] text-[#38BDF8] my-1.5">
                  Interest Coverage = Operating Profit (EBIT) / Gross Annual Interest Expense
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  <strong>Source Line Items:</strong> Consolidated Income Statement Operating Income (EBIT) divided by Interest Expense.
                </p>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  <strong>Zero Denominator Rule:</strong> If annual interest expense is 0 (debt-free balance sheet), the system evaluates the coverage as <em>Unconstrained / Zero Debt Draw</em> rather than triggering a zero-division arithmetic error.
                </p>
              </div>

              <div className="p-3 bg-[#0E1626] border border-[#2563EB]/30 rounded-xl">
                <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                  3. CURRENT RATIO (LIQUIDITY BUFFER)
                </span>
                <div className="p-2 bg-[#070A0F] border border-[#182337] rounded font-mono text-[11px] text-[#38BDF8] my-1.5">
                  Current Ratio = Total Current Assets / Total Current Liabilities
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  <strong>Source Line Items:</strong> Balance sheet total current assets divided by total obligations maturing within 12 months.
                </p>
              </div>

              <div className="p-3 bg-[#0E1626] border border-[#2563EB]/30 rounded-xl">
                <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                  4. FREE CASH FLOW (FCF)
                </span>
                <div className="p-2 bg-[#070A0F] border border-[#182337] rounded font-mono text-[11px] text-[#38BDF8] my-1.5">
                  Free Cash Flow = Cash Flow from Operations (CFO) - |Capital Expenditures (CapEx)|
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  <strong>Source Line Items:</strong> Cash Flows Statement operating activities line item less additions to property, plant, and equipment.
                </p>
              </div>

              <div className="p-3 bg-[#0E1626] border border-[#2563EB]/30 rounded-xl">
                <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                  5. ALTMAN Z-SCORE DISTRESS DIAGNOSTIC (Z&apos;&apos; 1995 &amp; 1968 VARIANTS)
                </span>
                <div className="p-2 bg-[#070A0F] border border-[#182337] rounded font-mono text-[11px] text-[#38BDF8] my-1.5 space-y-1">
                  <div>Non-Mfg / Emerging (Z&apos;&apos;) = 6.56*X1 + 3.26*X2 + 6.72*X3 + 1.05*X4</div>
                  <div className="text-[10px] text-[#94A3B8]">X1=WC/TA, X2=RE/TA, X3=EBIT/TA, X4=Book Equity/Total Liabilities</div>
                  <div className="text-[10px] text-[#10B981]">Thresholds: &gt; 2.60 Safe Zone | 1.10 – 2.60 Grey Zone | &lt; 1.10 Distress Zone</div>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  <strong>Strict Standards:</strong> Marked Not Applicable for banks/financial firms. When Retained Earnings is not segregated on the face of the balance sheet, returns N/D rather than an approximation.
                </p>
              </div>

              <div className="p-3 bg-[#0E1626] border border-[#2563EB]/30 rounded-xl">
                <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                  6. BENEISH M-SCORE (EARNINGS QUALITY &amp; ACCRUAL SCREENING)
                </span>
                <div className="p-2 bg-[#070A0F] border border-[#182337] rounded font-mono text-[10.5px] text-[#38BDF8] my-1.5 leading-relaxed">
                  M = -4.84 + 0.920*DSRI + 0.528*GMI + 0.404*AQI + 0.892*SGI + 0.115*DEPI - 0.172*SGAI + 4.037*TATA + 0.0327*LVGI
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  <strong>Interpretation:</strong> Screening threshold: M &gt; -1.78 indicates elevated accruals / potential earnings overstatement risk; M &le; -1.78 indicates normal quality. Requires two consecutive comparable fiscal years. Screening signal only; not proof of manipulation.
                </p>
              </div>

              <div className="p-3 bg-[#0E1626] border border-[#2563EB]/30 rounded-xl">
                <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                  7. CERTIFIED DSCR VS DEBT SERVICE PROXY
                </span>
                <div className="p-2 bg-[#070A0F] border border-[#182337] rounded font-mono text-[11px] text-[#38BDF8] my-1.5 space-y-1">
                  <div>Certified DSCR = (PAT + Deprec + Term Interest) / (Term Interest + Scheduled Principal Due)</div>
                  <div>Debt Service Proxy = Consolidated EBITDA / (Interest Expense + Short-Term Debt)</div>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  <strong>Disclosure Rule:</strong> Scheduled principal debt repayments are rarely disclosed on the face of financial statements. FINTRAXIS never labels a proxy as statutory DSCR and explicitly discloses proxy status.
                </p>
              </div>

              <div className="p-3 bg-[#0E1626] border border-[#2563EB]/30 rounded-xl">
                <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                  8. TOTAL OUTSIDE LIABILITIES TO TANGIBLE NET WORTH (TOL / TNW)
                </span>
                <div className="p-2 bg-[#070A0F] border border-[#182337] rounded font-mono text-[11px] text-[#38BDF8] my-1.5">
                  TOL / TNW = Total Liabilities / (Total Shareholders&apos; Equity - Intangible Assets)
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  <strong>Indian Banking Standard:</strong> Established RBI and Indian Bank Association benchmark for consortium credit appraisal. Manufacturing and infrastructure exposure threshold is typically &lt; 3.00x.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TOLERANCES & IDENTITY */}
          {activeTab === "TOLERANCES" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0E1626] border border-[#10B981]/40 rounded-xl">
                <div className="flex items-center gap-2 text-[#10B981] font-bold text-xs uppercase mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>The Fundamental Balance Sheet Identity Accord</span>
                </div>
                <div className="p-2.5 bg-[#070A0F] border border-[#182337] rounded text-white font-mono text-xs my-2">
                  Total Assets &equiv; Total Liabilities + Total Stockholders&apos; Equity
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Every certified accounting standard (US-GAAP, Ind-AS, IFRS, Japanese GAAP) mandates that the debit and credit sides of a double-entry corporate balance sheet must equal each other exactly.
                </p>
              </div>

              <div className="p-4 bg-[#0B1220] border border-[#1E293B] rounded-xl space-y-2">
                <span className="font-bold text-white text-xs block uppercase">
                  Why a strictly bounded &plusmn;0.01% tolerance is utilized
                </span>
                <p className="text-[11px] text-[#94A3B8]">
                  In statutory regulatory filings (such as SEC Form 10-K or BSE/NSE XBRL reports), multi-billion or multi-crore numbers are frequently reported rounded to the nearest integer million or crore.
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  For example, if Total Assets are $352,583M while Total Liabilities ($264,840M) + Equity ($87,743M) sum to $352,583M, rounding in sub-components can introduce a minor fraction of a percentage point.
                </p>
                <div className="p-3 bg-[#070A0F] border border-[#2563EB]/40 rounded text-[10.5px] font-mono text-slate-300 space-y-1">
                  <div>Discrepancy % = (|Total Assets - (Liabilities + Equity)| / Total Assets) &times; 100</div>
                  <div>Threshold: If Discrepancy &le; 0.01% &rarr; Identity Satisfied (Verified)</div>
                  <div>If Discrepancy &gt; 0.01% &rarr; Identity Warning Triggered (Disclosed)</div>
                </div>
                <p className="text-[11px] text-[#F59E0B]">
                  <strong>Zero Silent Adjustment:</strong> FINTRAXIS never fabricates a plug number or forces balance sheet items to match. Any variance exceeding 0.01% is visibly highlighted to the analyst.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: HHI CONCENTRATION */}
          {activeTab === "HHI" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0E1626] border border-[#2563EB]/30 rounded-xl">
                <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                  HERFINDAHL-HIRSCHMAN INDEX (HHI) MATHEMATICS
                </span>
                <div className="p-2.5 bg-[#070A0F] border border-[#182337] rounded font-mono text-[11px] text-[#38BDF8] my-2 space-y-1">
                  <div>HHI = &Sigma; (Market Share %)&sup2;</div>
                  <div className="text-[10px] text-[#94A3B8]">Sum of squared percentage shares across counterparties / segments</div>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  Calculates the degree of commercial concentration across product divisions and geographic jurisdictions under ASC 280 and Ind-AS 108 disclosures.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl">
                  <div className="text-[10px] font-bold text-[#10B981] uppercase">DIVERSIFIED</div>
                  <div className="text-base font-bold text-white mt-0.5">&lt; 1,500 pts</div>
                  <p className="text-[10px] text-[#94A3B8] mt-1">
                    Balanced portfolio with low vulnerability to single-product or single-region shock.
                  </p>
                </div>

                <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl">
                  <div className="text-[10px] font-bold text-[#F59E0B] uppercase">MODERATE</div>
                  <div className="text-base font-bold text-white mt-0.5">1,500 – 2,500 pts</div>
                  <p className="text-[10px] text-[#94A3B8] mt-1">
                    Notable reliance on lead business segment; margin pressure in core unit impacts solvency.
                  </p>
                </div>

                <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl">
                  <div className="text-[10px] font-bold text-[#EF4444] uppercase">CONCENTRATED</div>
                  <div className="text-base font-bold text-white mt-0.5">&gt; 2,500 pts</div>
                  <p className="text-[10px] text-[#94A3B8] mt-1">
                    High operational risk. A regulatory embargo or competitor displacement immediately threatens top line.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HEALTH SCORE & TIERS */}
          {activeTab === "SCORING" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0E1626] border border-[#2563EB]/30 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                  DETERMINISTIC COMPOSITE HEALTH SCORE ENGINE (0 – 100)
                </span>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Evaluated as an auditable deductive penalty model starting from a baseline score of <strong>100</strong>, with deterministic point deductions triggered upon breach of credit early-warning thresholds:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 text-[10.5px]">
                  <div className="p-2.5 bg-[#070A0F] border border-[#182337] rounded space-y-0.5">
                    <span className="text-[#EF4444] font-bold block">Gross Margin Decay: -20 pts</span>
                    <span className="text-slate-300">Triggered if Gross Margin contracts &gt; 300 bps year-over-year.</span>
                  </div>
                  <div className="p-2.5 bg-[#070A0F] border border-[#182337] rounded space-y-0.5">
                    <span className="text-[#EF4444] font-bold block">Accrual Divergence: -15 to -25 pts</span>
                    <span className="text-slate-300">Triggered if CFO / Net Income conversion falls below 0.70x.</span>
                  </div>
                  <div className="p-2.5 bg-[#070A0F] border border-[#182337] rounded space-y-0.5">
                    <span className="text-[#EF4444] font-bold block">Cash-Burn Runway: -15 to -35 pts</span>
                    <span className="text-slate-300">Triggered if available liquidity sustains &lt; 12.0 Mo (-15) or &lt; 6.0 Mo (-35).</span>
                  </div>
                  <div className="p-2.5 bg-[#070A0F] border border-[#182337] rounded space-y-0.5">
                    <span className="text-[#EF4444] font-bold block">Interest Coverage: -15 to -30 pts</span>
                    <span className="text-slate-300">Triggered if EBIT Interest Coverage falls below 3.00x (-15) or &lt; 1.50x (-30).</span>
                  </div>
                  <div className="p-2.5 bg-[#070A0F] border border-[#182337] rounded space-y-0.5">
                    <span className="text-[#EF4444] font-bold block">Excessive Gearing: -10 to -25 pts</span>
                    <span className="text-slate-300">Triggered if Net Debt / EBITDA exceeds 3.00x (-10) or &gt; 4.50x (-25).</span>
                  </div>
                  <div className="p-2.5 bg-[#070A0F] border border-[#182337] rounded space-y-0.5">
                    <span className="text-[#EF4444] font-bold block">Working Capital Deficit: -15 pts</span>
                    <span className="text-slate-300">Triggered if Current Ratio compresses below 1.00x (inverted working capital).</span>
                  </div>
                </div>
                <div className="text-[10px] text-[#64748B] pt-1">
                  Final score is bounded between [10, 100]. Tiers represent internal screening categories, not credit ratings.
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#10B981]">TIER 1 // PRIME SOLVENT (Score: 80 – 100)</span>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">
                      Substantial debt service cushion, healthy free cash flow conversion, unencumbered liquidity buffers.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-white px-2 py-1 bg-[#10B981]/20 rounded">LOW RISK</span>
                </div>

                <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#F59E0B]">TIER 2 // WATCHLIST SURVEILLANCE (Score: 50 – 79)</span>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">
                      Moderate leverage or working capital compression detected. Absorptive buffer under stress is constrained.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-white px-2 py-1 bg-[#F59E0B]/20 rounded">MODERATE</span>
                </div>

                <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#EF4444]">TIER 3 // DISTRESS &amp; RESTRUCTURING (Score: &lt; 50)</span>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">
                      Debt service coverage breached, severe operating cash burn, or impending debt maturity rollover wall.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-white px-2 py-1 bg-[#EF4444]/20 rounded">CRITICAL</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DATA SOURCES */}
          {activeTab === "DATA_SOURCES" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0E1626] border border-[#2563EB]/30 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block">
                  STATUTORY REPOSITORY ARCHITECTURE
                </span>
                <p className="text-[11px] text-[#94A3B8]">
                  FINTRAXIS ingests audited financial statements from statutory regulatory repositories:
                </p>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#38BDF8]">&bull;</span>
                    <span><strong>United States:</strong> SEC EDGAR (Form 10-K Annual Reports & Form 10-Q Quarterly Reports, US-GAAP taxonomy).</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#38BDF8]">&bull;</span>
                    <span><strong>India:</strong> BSE / NSE Regulatory XBRL Disclosures under Ind-AS / Schedule III taxonomy, Ministry of Corporate Affairs (MCA).</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#38BDF8]">&bull;</span>
                    <span><strong>Japan:</strong> FSA Yuho filings under J-GAAP / IFRS.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-[#0B1220] border border-[#1E293B] rounded-xl space-y-2">
                <span className="text-xs font-bold text-white uppercase block">Market Pricing & Freshness Disclaimer</span>
                <p className="text-[11px] text-[#94A3B8]">
                  Open market quotes (share price, day high/low, 52-week ranges) are ingested via public exchange web endpoints and labeled as <strong>DELAYED (15–20 minutes)</strong> or <strong>END_OF_DAY (EOD)</strong>.
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  FINTRAXIS does not claim real-time direct market execution access (DMA) and does not execute broker trades.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: SCOPE & DISCLAIMER */}
          {activeTab === "DISCLAIMER" && (
            <div className="p-5 bg-[#180A0E] border border-[#EF4444]/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-[#EF4444] font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>Regulatory Scope & Academic Evaluation Notice</span>
              </div>
              <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
                FINTRAXIS is an institutional corporate financial intelligence and deterministic credit risk surveillance terminal designed for academic research, credit underwriting workflow automation, and comparative financial analysis.
              </p>
              <div className="p-3 bg-[#080B10] border border-[#EF4444]/30 rounded text-[10.5px] text-[#94A3B8] space-y-1.5">
                <p>
                  <strong>1. Not an Official Credit Rating:</strong> The risk tiers (Tier 1 Prime, Tier 2 Watchlist, Tier 3 Distress) and composite screening score are rule-based mathematical screening indicators. They do not constitute an official credit rating from registered rating organizations such as CRISIL, ICRA, CARE, S&P Global, Moody&apos;s, or Fitch.
                </p>
                <p>
                  <strong>2. Not Financial or Investment Advice:</strong> Financial calculations and scenario simulation outputs are provided for educational and institutional workflow demonstration. They should not be construed as investment advice, a solicitation to purchase securities, or an irrevocable underwriting commitment.
                </p>
                <p>
                  <strong>3. Deterministic Sensitivity Modeling:</strong> The Scenario Simulator executes pure mathematical shock parameters (e.g. -10% revenue shock, +200 bps interest rate shock). It does not predict macroeconomic events or guarantee business outcomes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#090D17] border-t border-[#182337] flex items-center justify-between text-[11px]">
          <span className="text-[#64748B]">
            FINTRAXIS Methodology Specification &bull; Mumbai University Viva Edition
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Acknowledge &amp; Return
          </button>
        </div>
      </div>
    </div>
  );
}
