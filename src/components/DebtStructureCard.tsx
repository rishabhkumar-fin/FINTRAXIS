"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { CompanyEntity, FinancialPeriodData } from "@/lib/types";
import { DebtInstrumentRow, reconcileDebtStructure } from "@/lib/financialCalculations";
import { formatFinancialValue } from "@/lib/formatters";

interface DebtStructureCardProps {
  company: CompanyEntity;
  period: FinancialPeriodData | null | undefined;
  instruments?: DebtInstrumentRow[];
}

export function DebtStructureCard({ company, period, instruments = [] }: DebtStructureCardProps) {
  const totalDebt = period?.totalDebt ?? 0;
  const cashReserves = period?.cashAndEquivalents ?? 0;

  const reconciliation = reconcileDebtStructure(instruments, period?.totalDebt);

  // Illustrative fallback buckets if no verified filing tranches are stored
  const maturityBuckets = [
    { label: "< 1 Year (Near-Term Rollover)", pct: 0.18, amount: totalDebt * 0.18, status: totalDebt * 0.18 <= cashReserves ? "COVERED" : "REFINANCE NEEDED" },
    { label: "1 - 3 Years (Medium Notes)", pct: 0.32, amount: totalDebt * 0.32, status: "ORDERLY" },
    { label: "3 - 5 Years (Syndicate Facilities)", pct: 0.28, amount: totalDebt * 0.28, status: "LONG-DATED" },
    { label: "> 5 Years (Institutional Bonds)", pct: 0.22, amount: totalDebt * 0.22, status: "PRIME SECURED" },
  ];

  const formatCurr = (val: number | null | undefined) =>
    formatFinancialValue(val, company.currency, company.scaleUnit);

  return (
    <div className="p-4 bg-[#090E17] border border-[#1E293B] rounded-xl space-y-3.5 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-[#38BDF8]" />
          <span>DEBT STRUCTURE &amp; TRANCHE RECONCILIATION</span>
          {instruments.length > 0 ? (
            <span className="px-1.5 py-0.5 text-[9px] bg-[#10B981]/15 border border-[#10B981]/40 text-[#34D399] rounded font-bold uppercase">
              Disclosed in filing
            </span>
          ) : (
            <span className="px-1.5 py-0.5 text-[9px] bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FBBF24] rounded font-bold uppercase">
              Illustrative, not from filing
            </span>
          )}
        </div>
        <div className="text-[10px] text-[#94A3B8]">
          LIQUID CASH BUFFER: <strong className="text-[#10B981]">{formatCurr(cashReserves)}</strong>
        </div>
      </div>

      {instruments.length > 0 ? (
        /* Sourced Tranche Table */
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] divide-y divide-[#182337]">
              <thead>
                <tr className="text-[#64748B] text-[10px] text-left">
                  <th className="py-1.5 px-2">INSTRUMENT</th>
                  <th className="py-1.5 px-2">COUPON</th>
                  <th className="py-1.5 px-2">TYPE</th>
                  <th className="py-1.5 px-2">MATURITY</th>
                  <th className="py-1.5 px-2 text-right">PRINCIPAL ({company.scaleUnit})</th>
                  <th className="py-1.5 px-2 text-right">SOURCE FILING NOTE</th>
                  <th className="py-1.5 px-2 text-right">VERIFICATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182337] text-slate-300">
                {instruments.map((inst) => (
                  <tr key={inst.id} className="hover:bg-[#0C111C]">
                    <td className="py-2 px-2 font-semibold text-white">{inst.instrumentName}</td>
                    <td className="py-2 px-2 text-[#38BDF8]">
                      {inst.coupon !== null ? `${inst.coupon}%` : "Zero / Floating"}
                    </td>
                    <td className="py-2 px-2 text-[#94A3B8]">{inst.couponType}</td>
                    <td className="py-2 px-2 text-white font-bold">{inst.maturityYear || "N/D"}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-white">
                      {formatCurr(inst.principalAmount)}
                    </td>
                    <td className="py-2 px-2 text-right text-[10px] text-[#94A3B8]">
                      {inst.sourceForm} &bull; {inst.sectionOrPage}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#101A2E] border border-[#182337] text-[#38BDF8]">
                        {inst.verificationFlag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sum vs Disclosed Total Reconciliation */}
          <div className="p-3 bg-[#05070B] border border-[#182337] rounded-lg space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center font-bold">
              <span className="text-[#94A3B8]">Sum of Itemized Tranches:</span>
              <span className="text-white font-mono">{formatCurr(reconciliation.totalPrincipalSum)}</span>
            </div>
            <div className="flex justify-between items-center font-bold">
              <span className="text-[#94A3B8]">Reported Total Debt (Balance Sheet):</span>
              <span className="text-white font-mono">{formatCurr(reconciliation.disclosedTotalDebt)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-[#182337] pt-1 font-bold">
              <span className="text-[#64748B]">Reconciliation Variance:</span>
              <span className={reconciliation.isReconciled ? "text-[#10B981]" : "text-[#F59E0B]"}>
                {reconciliation.difference !== null ? formatCurr(reconciliation.difference) : "N/D"}
                {reconciliation.differencePct !== null && ` (${reconciliation.differencePct}%)`}
              </span>
            </div>
            <p className="text-[10px] text-[#64748B] pt-1 leading-relaxed">
              {reconciliation.explanation}
            </p>
          </div>
        </div>
      ) : (
        /* Illustrative Schedule with Clear Demonstration Badge */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {maturityBuckets.map((mb, idx) => (
              <div key={idx} className="p-3 bg-[#05070B] border border-[#1E293B] rounded-lg space-y-1.5">
                <div className="text-[10px] text-[#64748B] uppercase font-bold flex justify-between">
                  <span>{mb.label}</span>
                  <span className="text-[#38BDF8]">{(mb.pct * 100).toFixed(0)}%</span>
                </div>
                <div className="text-base font-bold font-mono text-[#F8FAFC]">
                  {formatCurr(mb.amount)}
                </div>
                <div className="w-full bg-[#101A2E] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#38BDF8] h-full" style={{ width: `${mb.pct * 100}%` }} />
                </div>
                <div className="text-[9.5px] text-[#10B981] font-semibold flex items-center justify-between">
                  <span>STATUS: {mb.status}</span>
                  {totalDebt === 0 && <span className="text-[#64748B]">ZERO DEBT</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-[#05070B] border border-[#182337] rounded text-[10px] text-[#94A3B8] space-y-1">
            <div>
              <span className="text-[#FBBF24] font-bold">Illustrative Schedule (Not from filing):</span> Contractual tranche maturities are simulated for stress testing. Sourced tranches require parsing audited Debt Notes (US-GAAP Form 10-K Term Debt Note / Ind-AS Borrowings Note).
            </div>
            <div className="text-[#64748B]">
              See <code className="text-[#38BDF8]">docs/MANUAL_VERIFICATION_CHECKLIST.md</code> for unverified note parsing items.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
