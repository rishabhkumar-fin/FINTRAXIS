"use client";

import React, { useState } from "react";
import { Calculator, Info } from "lucide-react";
import { CompanyEntity, FinancialPeriodData } from "@/lib/types";
import { calculateDrawingPower } from "@/lib/financialCalculations";
import { formatFinancialValue } from "@/lib/formatters";
import { ConceptTooltip } from "./ConceptTooltip";

interface DrawingPowerCardProps {
  company: CompanyEntity;
  period: FinancialPeriodData | null | undefined;
}

export function DrawingPowerCard({ company, period }: DrawingPowerCardProps) {
  const [invMargin, setInvMargin] = useState(25);
  const [recMargin, setRecMargin] = useState(40);

  const isFinancial = company.sector?.toLowerCase().includes("financ") || company.sector?.toLowerCase().includes("bank");
  const isIndianAppraisal = company.country === "IND" || company.accountingStandard.includes("Ind-AS");

  const dpResult = calculateDrawingPower({
    inventory: period?.inventories,
    tradeCreditors: period?.accountsPayable,
    eligibleReceivablesUnder90Days: period?.receivablesAgeingUnder90Days,
    inventoryMarginPct: invMargin,
    receivablesMarginPct: recMargin,
    workingCapitalBorrowings: period?.workingCapitalBorrowings,
    isBankOrFinancial: isFinancial,
  });

  const formatCurr = (val: number | null | undefined) =>
    formatFinancialValue(val, company.currency, company.scaleUnit);

  if (!isIndianAppraisal && !isFinancial) {
    return (
      <div className="p-3 bg-[#080B10] border border-[#1E2536] rounded-lg font-mono text-xs space-y-1 text-[#64748B]">
        <div className="flex items-center gap-2 text-white font-bold text-[11px] uppercase">
          <Calculator className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Working Capital Indicative Drawing Power (India)</span>
          <ConceptTooltip conceptId="drawing-power" />
        </div>
        <p className="text-[10px]">
          Not applicable: Indicative Drawing Power appraisal conventions apply to Indian commercial banking under Ind-AS Schedule III disclosures.
        </p>
      </div>
    );
  }

  if (isFinancial) {
    return (
      <div className="p-3 bg-[#080B10] border border-[#1E2536] rounded-lg font-mono text-xs space-y-1 text-[#64748B]">
        <div className="flex items-center gap-2 text-white font-bold text-[11px] uppercase">
          <Calculator className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Working Capital Indicative Drawing Power (India)</span>
          <ConceptTooltip conceptId="drawing-power" />
        </div>
        <p className="text-[10px]">
          Not applicable: Banking, NBFC, and financial entities do not maintain physical stock drawing power.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#090D17] border border-[#1E2536] rounded-xl font-mono text-xs space-y-3.5 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#182337] pb-2.5">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#38BDF8]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Indicative Working Capital Drawing Power (Annual-Statement Basis)
          </span>
          <ConceptTooltip conceptId="drawing-power" />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#94A3B8]">
          <span>CONVENTION: INDIAN COMMERCIAL BANKING</span>
          <span className="px-1.5 py-0.2 bg-[#2563EB]/15 border border-[#2563EB]/40 text-[#60A5FA] rounded">
            INDICATIVE
          </span>
        </div>
      </div>

      {/* Context Banner */}
      <div className="p-2.5 bg-[#05070B] border border-[#182337] rounded text-[10px] text-[#94A3B8] flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
        <div>
          <span className="text-white font-bold">Appraisal Context:</span> Real drawing power is computed monthly by the lending bank from verified stock and book-debt statements under sanction terms. This card uses annual-statement figures and provides only an indication.
        </div>
      </div>

      {/* Line-by-Line Arithmetic Working */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Step 1 & 2: Paid Stock & Eligible Receivables */}
        <div className="space-y-2 p-3 bg-[#0C111C] border border-[#182337] rounded-lg">
          <div className="text-[10px] font-bold text-[#38BDF8] uppercase border-b border-[#182337] pb-1">
            Component Decomposition &amp; Margins
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Total Disclosed Inventories:</span>
              <span className="text-white font-bold">{formatCurr(period?.inventories)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Less: Trade Creditors (Payables):</span>
              <span className="text-[#EF4444] font-bold">({formatCurr(period?.accountsPayable)})</span>
            </div>
            <div className="flex justify-between items-center border-t border-[#182337] pt-1">
              <span className="text-[#94A3B8]">Paid Stock (Unfloored):</span>
              <span className="text-slate-300">
                {dpResult.unflooredPaidStock !== null ? formatCurr(dpResult.unflooredPaidStock) : "N/D"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#38BDF8] font-bold">Paid Stock (Floored at 0):</span>
              <span className="text-[#38BDF8] font-bold">
                {dpResult.flooredPaidStock !== null ? formatCurr(dpResult.flooredPaidStock) : "N/D"}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-[#182337] pt-1">
              <span className="text-[#94A3B8]">Eligible Receivables (&lt; 90 Days):</span>
              <span className="text-white font-bold">
                {dpResult.eligibleReceivables !== null
                  ? formatCurr(dpResult.eligibleReceivables)
                  : "N/D (Ageing Note Omitted)"}
              </span>
            </div>
            {dpResult.eligibleReceivables === null && (
              <div className="text-[9.5px] text-[#F59E0B] italic">
                * Note: Schedule III receivables ageing breakdown was not segregated on face statements. Cannot assume 100% of book debts are bank-eligible.
              </div>
            )}
          </div>
        </div>

        {/* User-Adjustable Margins & Output DP */}
        <div className="space-y-2 p-3 bg-[#0C111C] border border-[#182337] rounded-lg flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#38BDF8] uppercase border-b border-[#182337] pb-1 flex items-center justify-between">
              <span>User-Adjustable Bank Margins</span>
              <span className="text-[9px] text-[#64748B]">Sanction Letter Terms</span>
            </div>

            <div className="space-y-2.5 mt-2 text-[10.5px]">
              <div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Inventory Margin Haircut:</span>
                  <span className="font-bold text-white">{invMargin}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={invMargin}
                  onChange={(e) => setInvMargin(Number(e.target.value))}
                  className="w-full accent-[#38BDF8] bg-[#05070B] h-1.5 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Receivables Margin Haircut:</span>
                  <span className="font-bold text-white">{recMargin}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={recMargin}
                  onChange={(e) => setRecMargin(Number(e.target.value))}
                  className="w-full accent-[#38BDF8] bg-[#05070B] h-1.5 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Final Calculated Result */}
          <div className="p-2.5 bg-[#05070B] border border-[#182337] rounded space-y-1">
            <div className="text-[9.5px] text-[#64748B] uppercase">INDICATIVE DRAWING POWER</div>
            <div className="text-xl font-bold font-mono text-[#10B981]">
              {dpResult.isComputable && dpResult.value !== null
                ? formatCurr(dpResult.value)
                : "N/D (Missing Ageing)"}
            </div>
            <div className="text-[9px] text-[#94A3B8]">
              {dpResult.isComputable
                ? `Paid Stock Contribution: ${formatCurr(dpResult.stockContribution)} | Receivables Contribution: ${formatCurr(dpResult.receivablesContribution)}`
                : "Awaiting Schedule III receivables ageing disclosure."}
            </div>
          </div>
        </div>
      </div>

      {/* Utilization Line if Borrowings are Disclosed */}
      <div className="p-2.5 bg-[#05070B] border border-[#182337] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]">
        <div className="text-[#64748B]">
          WORKING CAPITAL BORROWINGS UTILIZATION:{" "}
          <span className="font-bold text-white">
            {period?.workingCapitalBorrowings ? formatCurr(period.workingCapitalBorrowings) : "N/D (Not segregated from total debt)"}
          </span>
        </div>
        <div className="text-[#94A3B8]">
          {dpResult.utilizationPct !== null
            ? `Utilization: ${dpResult.utilizationPct}% of Indicative DP`
            : "Utilization unavailable: working capital line not reported separately"}
        </div>
      </div>
    </div>
  );
}
