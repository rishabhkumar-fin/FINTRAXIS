"use client";

import React from "react";
import { X, ExternalLink, ShieldCheck, Binary, Calculator, FileCheck, Layers } from "lucide-react";
import { AuditRecord, CompanyEntity } from "@/lib/types";

interface ComponentItem {
  name: string;
  value: string;
}

interface AuditSidecarProps {
  isOpen: boolean;
  onClose: () => void;
  auditItem: AuditRecord | null;
  company: CompanyEntity | null;
}

export function AuditSidecar({
  isOpen,
  onClose,
  auditItem,
  company,
}: AuditSidecarProps) {
  if (!isOpen) return null;

  const parsedTree = auditItem?.calculationTreeJson
    ? (() => {
        try {
          return JSON.parse(auditItem.calculationTreeJson);
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#07090E] border-l border-[#1E2638] shadow-2xl z-50 flex flex-col font-mono text-xs text-[#E1E7EC] animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#1E2638] bg-[#0A0D12] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-[#38BDF8]" />
          <div>
            <span className="font-bold text-[#E1E7EC] tracking-wider text-xs">
              AUDIT SIDECAR // LINE-ITEM PROVENANCE
            </span>
            <div className="text-[10px] text-[#5A687D]">
              SEC EDGAR &bull; XBRL TAXONOMY &bull; FORMULA DAG
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#1E2638] text-[#9BA8B8] hover:text-[#E1E7EC] transition-colors"
          title="Close Audit Sidecar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {auditItem ? (
          <>
            {/* Target Value Overview Card */}
            <div className="p-3 bg-[#12161F] border border-[#232B3A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#5A687D] uppercase">METRIC NAME</span>
                <span className="px-1.5 py-0.5 text-[9px] bg-[#07090E] border border-[#1E2638] text-[#38BDF8]">
                  {auditItem.period} AUDITED
                </span>
              </div>
              <div className="text-sm font-bold text-[#E1E7EC]">
                {auditItem.metricLabel}
              </div>
              <div className="flex items-baseline justify-between pt-1 border-t border-[#1E2638]">
                <span className="text-[10px] text-[#5A687D]">REPORTED VALUE:</span>
                <span className="text-base font-bold font-mono text-[#38BDF8]">
                  {auditItem.currency === "USD" ? "$" : auditItem.currency === "INR" ? "₹" : "¥"}
                  {auditItem.reportedValue?.toLocaleString() ?? "N/D"}{" "}
                  <span className="text-xs text-[#9BA8B8]">{auditItem.scaleUnit}</span>
                </span>
              </div>
            </div>

            {/* Regulatory Filing Provenance */}
            <div className="p-3 bg-[#0E131A] border border-[#1E2638] space-y-2.5">
              <div className="flex items-center gap-1.5 text-[#9BA8B8] text-[11px] font-bold">
                <FileCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>REGULATORY FILING PROVENANCE</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-[#1E2638]/50">
                  <span className="text-[#5A687D]">Source Document:</span>
                  <span className="text-[#E1E7EC] font-semibold">{auditItem.sourceFiling}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1E2638]/50">
                  <span className="text-[#5A687D]">Filing Date:</span>
                  <span className="text-[#E1E7EC] font-mono">{auditItem.filingDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1E2638]/50">
                  <span className="text-[#5A687D]">Accounting Regime:</span>
                  <span className="text-[#38BDF8]">{company?.accountingStandard || "US-GAAP"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#5A687D]">Jurisdiction:</span>
                  <span className="text-[#E1E7EC]">
                    {company?.country === "USA"
                      ? "SEC (United States)"
                      : company?.country === "IND"
                      ? "SEBI / MCA (India)"
                      : "FSA / EDINET (Japan)"}
                  </span>
                </div>
              </div>

              {auditItem.filingUrl && (
                <a
                  href={auditItem.filingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 w-full py-1.5 bg-[#12161F] hover:bg-[#181F2B] border border-[#38BDF8]/50 text-[#38BDF8] hover:text-[#60A5FA] transition-colors text-[11px]"
                >
                  <span>VIEW OFFICIAL REGULATORY FILING</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* XBRL Tag & Ontology */}
            <div className="p-3 bg-[#0E131A] border border-[#1E2638] space-y-2">
              <div className="flex items-center gap-1.5 text-[#9BA8B8] text-[11px] font-bold">
                <Layers className="w-3.5 h-3.5 text-[#10B981]" />
                <span>TAXONOMY & XBRL TAG</span>
              </div>
              <div className="p-2 bg-[#07090E] border border-[#1E2638] break-all font-mono text-[10px] text-[#10B981]">
                {auditItem.xbrlTag}
              </div>
              <p className="text-[10px] text-[#5A687D] leading-relaxed">
                Direct standardized line item tagged under {company?.country} electronic filing taxonomies. Certified immutable post-filing.
              </p>
            </div>

            {/* Deterministic Formula DAG Breakdown */}
            <div className="p-3 bg-[#0E131A] border border-[#1E2638] space-y-2">
              <div className="flex items-center gap-1.5 text-[#9BA8B8] text-[11px] font-bold">
                <Calculator className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>FORMULA & CALCULATION DAG</span>
              </div>

              {auditItem.formula && (
                <div className="p-2 bg-[#12161F] border border-[#232B3A] text-[11px] text-[#60A5FA]">
                  {auditItem.formula}
                </div>
              )}

              {parsedTree && parsedTree.components && (
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-[#5A687D] uppercase">COMPONENT DECOMPOSITION:</span>
                  <div className="space-y-1 bg-[#07090E] p-2 border border-[#1E2638]">
                    {parsedTree.components.map((comp: ComponentItem, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] py-0.5">
                        <span className="text-[#9BA8B8]">{comp.name}:</span>
                        <span className="text-[#38BDF8] font-mono">{comp.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auditor Notes */}
            {auditItem.notes && (
              <div className="p-3 bg-[#12161F]/60 border border-[#1E2638] space-y-1">
                <span className="text-[10px] text-[#5A687D] uppercase">AUDITOR COMPLIANCE NOTE</span>
                <p className="text-[11px] text-[#9BA8B8] leading-relaxed">{auditItem.notes}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-[#5A687D] space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-[#232B3A]" />
            <p className="text-xs">Select any statement line item or ratio card to inspect its full auditable lineage.</p>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 border-t border-[#1E2638] bg-[#0A0D12] text-[10px] text-[#5A687D] flex items-center justify-between">
        <span>FINTRAXIS PROVENANCE V2.4</span>
        <span className="text-[#10B981]">CHAIN OF CUSTODY VERIFIED</span>
      </div>
    </div>
  );
}
