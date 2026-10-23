"use client";

import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowRight,
  Search,
  HelpCircle,
} from "lucide-react";

export interface QualityIssue {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  companyId: string;
  companySymbol: string;
  companyName: string;
  period?: string;
  category:
    | "BALANCE_SHEET_MISMATCH"
    | "MISSING_UNITS_CURRENCY"
    | "MISSING_SOURCE_FILING"
    | "YOY_VARIANCE_JUMP"
    | "STALE_REPORTING_PERIOD"
    | "UNVERIFIED_IDENTIFIER";
  title: string;
  explanation: string;
  suggestedFix: string;
  metricDetails?: {
    expected?: string;
    actual?: string;
    discrepancy?: string;
  };
}

interface DataQualityDrilldownProps {
  issues: QualityIssue[];
  onOpenPeriodEditor?: (companyId: string, period?: string) => void;
}

export function DataQualityDrilldown({
  issues,
  onOpenPeriodEditor,
}: DataQualityDrilldownProps) {
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "CRITICAL" | "WARNING" | "INFO">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const counts = useMemo(() => {
    return {
      total: issues.length,
      critical: issues.filter((i) => i.severity === "CRITICAL").length,
      warning: issues.filter((i) => i.severity === "WARNING").length,
      info: issues.filter((i) => i.severity === "INFO").length,
    };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((item) => {
      if (severityFilter !== "ALL" && item.severity !== severityFilter) return false;
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.companySymbol.toLowerCase().includes(q) ||
          item.companyName.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.explanation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [issues, severityFilter, categoryFilter, searchTerm]);

  const getSeverityBadge = (severity: "CRITICAL" | "WARNING" | "INFO") => {
    switch (severity) {
      case "CRITICAL":
        return "bg-[#F43F5E]/15 border-[#F43F5E]/40 text-[#F43F5E]";
      case "WARNING":
        return "bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]";
      case "INFO":
        return "bg-[#38BDF8]/15 border-[#38BDF8]/40 text-[#38BDF8]";
    }
  };

  const getCategoryLabel = (cat: QualityIssue["category"]) => {
    switch (cat) {
      case "BALANCE_SHEET_MISMATCH":
        return "Balance Sheet Identity";
      case "MISSING_UNITS_CURRENCY":
        return "Missing Unit / Currency";
      case "MISSING_SOURCE_FILING":
        return "Missing Regulatory Source";
      case "YOY_VARIANCE_JUMP":
        return "Unusual YoY Variance";
      case "STALE_REPORTING_PERIOD":
        return "Stale Fiscal Period";
      case "UNVERIFIED_IDENTIFIER":
        return "Unverified Identifier";
    }
  };

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => setSeverityFilter("ALL")}
          className={`p-3.5 bg-[#101621] border rounded-xl cursor-pointer transition-all ${
            severityFilter === "ALL" ? "border-[#3867F5] shadow-sm shadow-[#3867F5]/20" : "border-[#253247]"
          }`}
        >
          <span className="text-[10px] text-[#9AA8BC] block uppercase font-bold">Total Integrity Audits</span>
          <div className="text-xl font-bold text-[#F3F6FC] mt-1">{counts.total} Flagged</div>
          <span className="text-[10px] text-[#9AA8BC] mt-0.5 block">Automated checks active</span>
        </div>

        <div
          onClick={() => setSeverityFilter("CRITICAL")}
          className={`p-3.5 bg-[#101621] border rounded-xl cursor-pointer transition-all ${
            severityFilter === "CRITICAL" ? "border-[#F43F5E] shadow-sm shadow-[#F43F5E]/20" : "border-[#253247]"
          }`}
        >
          <span className="text-[10px] text-[#F43F5E] block uppercase font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Critical Severity</span>
          </span>
          <div className="text-xl font-bold text-[#F43F5E] mt-1">{counts.critical} Errors</div>
          <span className="text-[10px] text-[#9AA8BC] mt-0.5 block">Identity / arithmetic violations</span>
        </div>

        <div
          onClick={() => setSeverityFilter("WARNING")}
          className={`p-3.5 bg-[#101621] border rounded-xl cursor-pointer transition-all ${
            severityFilter === "WARNING" ? "border-[#F59E0B] shadow-sm shadow-[#F59E0B]/20" : "border-[#253247]"
          }`}
        >
          <span className="text-[10px] text-[#F59E0B] block uppercase font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Warning Severity</span>
          </span>
          <div className="text-xl font-bold text-[#F59E0B] mt-1">{counts.warning} Warnings</div>
          <span className="text-[10px] text-[#9AA8BC] mt-0.5 block">YoY jumps &gt;100% or stale periods</span>
        </div>

        <div
          onClick={() => setSeverityFilter("INFO")}
          className={`p-3.5 bg-[#101621] border rounded-xl cursor-pointer transition-all ${
            severityFilter === "INFO" ? "border-[#38BDF8] shadow-sm shadow-[#3867F5]/20" : "border-[#253247]"
          }`}
        >
          <span className="text-[10px] text-[#38BDF8] block uppercase font-bold flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Info Notices</span>
          </span>
          <div className="text-xl font-bold text-[#38BDF8] mt-1">{counts.info} Notices</div>
          <span className="text-[10px] text-[#9AA8BC] mt-0.5 block">Missing filing link or taxonomy tag</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#101621] border border-[#253247] p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#9AA8BC] shrink-0" />
          <input
            type="text"
            placeholder="Search issue by company, symbol or explanation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as "ALL" | "CRITICAL" | "WARNING" | "INFO")}
            className="px-2.5 py-1.5 bg-[#151E2D] border border-[#253247] text-[#F3F6FC] rounded-lg text-xs"
          >
            <option value="ALL">ALL SEVERITIES</option>
            <option value="CRITICAL">CRITICAL ONLY</option>
            <option value="WARNING">WARNING ONLY</option>
            <option value="INFO">INFO ONLY</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#151E2D] border border-[#253247] text-[#F3F6FC] rounded-lg text-xs"
          >
            <option value="ALL">ALL AUDIT CATEGORIES</option>
            <option value="BALANCE_SHEET_MISMATCH">Balance Sheet Mismatches</option>
            <option value="MISSING_UNITS_CURRENCY">Missing Units / Currency</option>
            <option value="MISSING_SOURCE_FILING">Missing Source Filings</option>
            <option value="YOY_VARIANCE_JUMP">Unusual YoY Jumps</option>
            <option value="STALE_REPORTING_PERIOD">Stale Periods</option>
            <option value="UNVERIFIED_IDENTIFIER">Unverified Identifiers</option>
          </select>
        </div>
      </div>

      {/* Drilldown Issues List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="p-8 bg-[#101621] border border-[#253247] rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto" />
            <div className="text-sm font-bold text-[#F3F6FC]">No Data Quality Issues Detected</div>
            <p className="text-[11px] text-[#9AA8BC] max-w-md mx-auto">
              All financial periods satisfy balance sheet equality, currency scaling criteria, and source verification standards.
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-[#101621] border border-[#253247] hover:border-[#3867F5]/50 p-4 rounded-xl transition-all space-y-2.5"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getSeverityBadge(
                      issue.severity
                    )}`}
                  >
                    {issue.severity}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#151E2D] border border-[#253247] text-[#9AA8BC]">
                    {getCategoryLabel(issue.category)}
                  </span>
                  {issue.period && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#151E2D] border border-[#253247] text-[#38BDF8] font-bold">
                      {issue.period}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F3F6FC]">{issue.companySymbol}</span>
                  <span className="text-[10px] text-[#9AA8BC] hidden sm:inline">&bull; {issue.companyName}</span>
                </div>
              </div>

              {/* Title & Explanation */}
              <div>
                <h4 className="text-xs font-bold text-[#F3F6FC]">{issue.title}</h4>
                <p className="text-[11px] text-[#9AA8BC] mt-0.5 leading-relaxed">{issue.explanation}</p>
              </div>

              {/* Metric Comparison if available */}
              {issue.metricDetails && (
                <div className="p-2 bg-[#0A0E17] border border-[#253247] rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                  {issue.metricDetails.expected && (
                    <div>
                      <span className="text-[#9AA8BC] block">EXPECTED:</span>
                      <span className="text-[#10B981] font-bold">{issue.metricDetails.expected}</span>
                    </div>
                  )}
                  {issue.metricDetails.actual && (
                    <div>
                      <span className="text-[#9AA8BC] block">REPORTED IN DB:</span>
                      <span className="text-[#F43F5E] font-bold">{issue.metricDetails.actual}</span>
                    </div>
                  )}
                  {issue.metricDetails.discrepancy && (
                    <div>
                      <span className="text-[#9AA8BC] block">DISCREPANCY:</span>
                      <span className="text-[#F59E0B] font-bold">{issue.metricDetails.discrepancy}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Fix and Action */}
              <div className="pt-2 border-t border-[#253247] flex items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-1.5 text-[#38BDF8]">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <strong>Suggested Fix:</strong> {issue.suggestedFix}
                  </span>
                </div>

                {onOpenPeriodEditor && (
                  <button
                    type="button"
                    onClick={() => onOpenPeriodEditor(issue.companyId, issue.period)}
                    className="px-2.5 py-1 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] text-[#F3F6FC] rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    <span>Open Ledger</span>
                    <ArrowRight className="w-3 h-3 text-[#38BDF8]" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
