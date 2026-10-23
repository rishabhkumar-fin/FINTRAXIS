"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

export interface PeriodRecordSummary {
  id: string;
  companyId: string;
  period: string;
  periodType: string;
  filingDate: string | null;
  filingForm: string | null;
  filingUrl: string | null;
  currency: string;
  scaleUnit: string;
}

export interface IssuerSummary {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  scaleUnit: string;
  latestPeriod: string | null;
}

interface PeriodCoverageTableProps {
  companies: IssuerSummary[];
  periods: PeriodRecordSummary[];
  onImportClick?: () => void;
  onEditPeriod?: (companyId: string, period: string) => void;
}

export function PeriodCoverageTable({
  companies,
  periods,
  onImportClick,
  onEditPeriod,
}: PeriodCoverageTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Determine standard fiscal years present or standard 5-year surveillance window
  const canonicalYears = useMemo(() => {
    const yearSet = new Set<string>(["FY2021", "FY2022", "FY2023", "FY2024", "FY2025"]);
    periods.forEach((p) => {
      if (p.period && p.period.startsWith("FY")) {
        yearSet.add(p.period);
      }
    });
    return Array.from(yearSet).sort();
  }, [periods]);

  // Lookup map: `${companyId}_${period}` => PeriodRecordSummary
  const periodMap = useMemo(() => {
    const map = new Map<string, PeriodRecordSummary>();
    periods.forEach((p) => {
      map.set(`${p.companyId}_${p.period}`, p);
    });
    return map;
  }, [periods]);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = searchTerm.toLowerCase();
      return (
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.exchange.toLowerCase().includes(q)
      );
    });
  }, [companies, searchTerm]);

  // Compute coverage stats
  const totalSlots = companies.length * canonicalYears.length;
  let filledSlots = 0;
  companies.forEach((c) => {
    canonicalYears.forEach((yr) => {
      if (periodMap.has(`${c.id}_${yr}`)) filledSlots++;
    });
  });
  const coveragePct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 100;
  const gapCount = totalSlots - filledSlots;

  // CSV Export of Matrix
  const handleExportMatrixCSV = () => {
    const headers = ["Symbol", "Name", "Exchange", "Currency", ...canonicalYears, "Completeness"];
    const rows = filteredCompanies.map((c) => {
      let companyFilled = 0;
      const yrStatuses = canonicalYears.map((yr) => {
        const p = periodMap.get(`${c.id}_${yr}`);
        if (p) {
          companyFilled++;
          return `Audited (${p.filingForm || "Filing"})`;
        }
        return "GAP";
      });
      const completeness = `${companyFilled}/${canonicalYears.length}`;
      return [
        `"${c.symbol}"`,
        `"${c.name}"`,
        `"${c.exchange}"`,
        `"${c.currency}"`,
        ...yrStatuses.map((s) => `"${s}"`),
        `"${completeness}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FINTRAXIS_Period_Coverage_Matrix_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#101621] border border-[#253247] rounded-xl overflow-hidden font-mono text-xs">
      {/* Header bar */}
      <div className="p-4 border-b border-[#253247] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#3867F5]" />
            <h3 className="text-sm font-bold text-[#F3F6FC] uppercase">
              Financial Period Coverage Matrix (Company &times; Fiscal Year)
            </h3>
          </div>
          <p className="text-[11px] text-[#9AA8BC] mt-1">
            Audits historical period continuity. Gaps are highlighted in amber/red to indicate missing regulatory ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onImportClick && (
            <button
              onClick={onImportClick}
              className="px-3 py-1.5 bg-[#3867F5] hover:bg-[#2c53cb] text-white rounded-lg flex items-center gap-1.5 font-bold cursor-pointer transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Import Period</span>
            </button>
          )}

          <button
            onClick={handleExportMatrixCSV}
            className="px-3 py-1.5 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] text-[#38BDF8] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#0A0E17] border-b border-[#253247] text-[11px]">
        <div className="p-2 bg-[#101621] border border-[#253247] rounded-lg">
          <span className="text-[#9AA8BC] text-[10px] block">TOTAL AUDITED PERIODS</span>
          <span className="text-sm font-bold text-[#F3F6FC] mt-0.5 block">{periods.length}</span>
        </div>
        <div className="p-2 bg-[#101621] border border-[#253247] rounded-lg">
          <span className="text-[#9AA8BC] text-[10px] block">ENROLLED SECURITIES</span>
          <span className="text-sm font-bold text-[#F3F6FC] mt-0.5 block">{companies.length}</span>
        </div>
        <div className="p-2 bg-[#101621] border border-[#253247] rounded-lg">
          <span className="text-[#9AA8BC] text-[10px] block">5-YR MATRIX COMPLETENESS</span>
          <span className="text-sm font-bold text-[#10B981] mt-0.5 block">{coveragePct}% ({filledSlots}/{totalSlots})</span>
        </div>
        <div className="p-2 bg-[#101621] border border-[#253247] rounded-lg">
          <span className="text-[#9AA8BC] text-[10px] block">HIGHLIGHTED GAPS</span>
          <span className={`text-sm font-bold mt-0.5 block ${gapCount > 0 ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
            {gapCount} missing periods
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-3 border-b border-[#253247] flex items-center justify-between gap-3 bg-[#101621]">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#9AA8BC] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Symbol, Corporate Name, Exchange..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] placeholder:text-[#5A687D] rounded-lg focus:outline-none focus:border-[#3867F5]"
          />
        </div>

        <span className="text-[#9AA8BC] text-[11px]">
          Showing {filteredCompanies.length} of {companies.length} issuers
        </span>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#151E2D] text-[#9AA8BC] uppercase text-[10px] border-b border-[#253247]">
            <tr>
              <th className="px-3 py-2.5 font-bold">Issuer</th>
              <th className="px-3 py-2.5 font-bold">Domain</th>
              {canonicalYears.map((yr) => (
                <th key={yr} className="px-3 py-2.5 text-center font-bold">
                  {yr}
                </th>
              ))}
              <th className="px-3 py-2.5 text-center font-bold">Completeness</th>
              <th className="px-3 py-2.5 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#253247]">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={canonicalYears.length + 4} className="px-4 py-8 text-center text-[#9AA8BC]">
                  No matching securities in coverage registry.
                </td>
              </tr>
            ) : (
              filteredCompanies.map((c) => {
                let companyFilledCount = 0;
                return (
                  <tr key={c.id} className="hover:bg-[#151E2D]/50 transition-colors">
                    {/* Issuer symbol & name */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="font-bold text-[#F3F6FC]">{c.symbol}</div>
                      <div className="text-[10px] text-[#9AA8BC] max-w-[140px] truncate" title={c.name}>
                        {c.name}
                      </div>
                    </td>

                    {/* Domain / Currency */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-[10px] text-[#9AA8BC]">
                      <div>{c.exchange}</div>
                      <div className="text-[#38BDF8]">{c.currency} &bull; {c.scaleUnit}</div>
                    </td>

                    {/* Matrix cells per fiscal year */}
                    {canonicalYears.map((yr) => {
                      const p = periodMap.get(`${c.id}_${yr}`);
                      if (p) {
                        companyFilledCount++;
                        return (
                          <td key={yr} className="px-2 py-2 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onEditPeriod?.(c.id, yr)}
                              title={`${p.filingForm || "Audited Filing"} · Filed ${p.filingDate || "N/A"}`}
                              className="px-2 py-1 bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 rounded text-[10px] text-[#10B981] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                              <span>Audited</span>
                            </button>
                          </td>
                        );
                      }
                      return (
                        <td key={yr} className="px-2 py-2 text-center whitespace-nowrap">
                          <span
                            title="Missing reporting period ledger (Coverage Gap)"
                            className="px-2 py-0.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded text-[10px] text-[#F59E0B] font-bold inline-block"
                          >
                            &mdash; Gap
                          </span>
                        </td>
                      );
                    })}

                    {/* Completeness progress */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-[#F3F6FC]">
                          {companyFilledCount}/{canonicalYears.length}
                        </span>
                        <div className="w-16 h-1.5 bg-[#151E2D] rounded-full overflow-hidden border border-[#253247]">
                          <div
                            className={`h-full ${
                              companyFilledCount === canonicalYears.length
                                ? "bg-[#10B981]"
                                : companyFilledCount >= 3
                                ? "bg-[#38BDF8]"
                                : "bg-[#F59E0B]"
                            }`}
                            style={{
                              width: `${(companyFilledCount / canonicalYears.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Quick Action */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEditPeriod?.(c.id, c.latestPeriod || "FY2024")}
                        className="px-2 py-1 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] text-[#38BDF8] text-[10px] rounded cursor-pointer transition-colors"
                      >
                        Ledger
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
