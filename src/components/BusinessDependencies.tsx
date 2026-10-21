"use client";

import React, { useState } from "react";
import {
  Network,
  FileText,
  ExternalLink,
  Plus,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { CompanyRiskProfile, BusinessDependency } from "@/lib/types";
import { getBusinessDependencies } from "@/lib/businessDisclosures";
import { ModuleTab } from "./NavigationTabs";

interface BusinessDependenciesProps {
  profile: CompanyRiskProfile;
  onNavigateToTab?: (tab: ModuleTab) => void;
}

export function BusinessDependencies({
  profile,
  onNavigateToTab,
}: BusinessDependenciesProps) {
  const company = profile.company;
  const initialDependencies = getBusinessDependencies(company.id);

  const [dependencies, setDependencies] = useState<BusinessDependency[]>(initialDependencies);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCounterparty, setNewCounterparty] = useState("");
  const [newRelation, setNewRelation] = useState<BusinessDependency["relationshipType"]>("SUPPLIER");
  const [newLevel, setNewLevel] = useState<BusinessDependency["dependencyLevel"]>("MODERATE");
  const [newDesc, setNewDesc] = useState("");
  const [newCitation, setNewCitation] = useState("");

  const handleAddCustomDependency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounterparty.trim()) return;

    const item: BusinessDependency = {
      id: `${company.id}_CUSTOM_${Date.now()}`,
      companyId: company.id,
      counterpartyName: newCounterparty.trim(),
      relationshipType: newRelation,
      disclosureType: "ANALYST_ESTIMATE",
      dependencyLevel: newLevel,
      disclosedConcentrationPct: null,
      description: newDesc.trim() || "Analyst-entered supply chain observation.",
      filingCitation: newCitation.trim() || "Analyst Internal Dossier",
      filingPeriod: "Current",
    };

    setDependencies([item, ...dependencies]);
    setShowAddModal(false);
    setNewCounterparty("");
    setNewDesc("");
    setNewCitation("");
  };

  const filtered = dependencies.filter((d) => {
    if (filterType === "ALL") return true;
    if (filterType === "SUPPLIER") return d.relationshipType === "SUPPLIER";
    if (filterType === "CUSTOMER") return d.relationshipType === "CUSTOMER";
    if (filterType === "CRITICAL") return d.dependencyLevel === "CRITICAL_SINGLE_SOURCE";
    return true;
  });

  const criticalCount = dependencies.filter(
    (d) => d.dependencyLevel === "CRITICAL_SINGLE_SOURCE"
  ).length;

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-[#0D121F] border border-[#1E293B] rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                SUPPLY CHAIN &amp; PARTNERS
              </span>
              <span className="text-xs font-mono text-[#64748B]">
                OPERATIONAL RELATIONSHIP SURVEILLANCE
              </span>
            </div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Network className="w-5 h-5 text-[#38BDF8]" />
              Business Dependency Intelligence
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              Examines disclosed business relationships, single-source operational bottlenecks,
              and critical partner dependencies reported in regulatory filings for{" "}
              <span className="text-white font-medium">{company.name} ({company.symbol})</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B] hover:bg-[#2A374D] text-[#38BDF8] border border-[#38BDF8]/30 rounded text-xs font-mono transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Analyst Note</span>
            </button>
          </div>
        </div>

        {/* High-Level Dependency KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1E293B]/70 font-mono text-xs">
          <div className="bg-[#0A0E17] border border-[#1E293B] rounded p-3">
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Disclosed Counterparties</div>
            <div className="text-lg font-bold text-white mt-1">{dependencies.length}</div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">Disclosed in filings & notes</div>
          </div>
          <div className="bg-[#0A0E17] border border-[#1E293B] rounded p-3">
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Critical Single-Source</div>
            <div className={`text-lg font-bold mt-1 ${criticalCount > 0 ? "text-[#EF4444]" : "text-[#10B981]"}`}>
              {criticalCount}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">High operational disruption risk</div>
          </div>
          <div className="bg-[#0A0E17] border border-[#1E293B] rounded p-3">
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Top Customer Threshold</div>
            <div className="text-lg font-bold text-[#38BDF8] mt-1">
              {dependencies.find((d) => d.relationshipType === "CUSTOMER")?.disclosedConcentrationPct !== null &&
              dependencies.find((d) => d.relationshipType === "CUSTOMER")?.disclosedConcentrationPct !== undefined
                ? `${dependencies.find((d) => d.relationshipType === "CUSTOMER")?.disclosedConcentrationPct}%`
                : "< 10.0%"}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">ASC 280 / Ind-AS 108 limit</div>
          </div>
          <div className="bg-[#0A0E17] border border-[#1E293B] rounded p-3">
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Primary Disclosure Basis</div>
            <div className="text-lg font-bold text-white mt-1 truncate">
              {company.accountingStandard}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">Statutory Footnotes & 10-K</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E293B] pb-2 text-xs font-mono">
        <span className="text-[#64748B] text-[11px] mr-2">FILTER BY:</span>
        {[
          { id: "ALL", label: "All Relationships" },
          { id: "SUPPLIER", label: "Suppliers & Vendors" },
          { id: "CUSTOMER", label: "Customers & Channels" },
          { id: "CRITICAL", label: "Critical Single-Source" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              filterType === tab.id
                ? "bg-[#2563EB] text-white font-semibold"
                : "bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Disclosed Dependencies Table */}
      <div className="bg-[#0D121F] border border-[#1E293B] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#38BDF8]" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Disclosed Relationship Records & Sourcing Architecture
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] font-mono">
            {filtered.length} of {dependencies.length} entries shown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0A0E17] text-[#64748B] border-b border-[#1E293B]">
              <tr>
                <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Counterparty & Role</th>
                <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Relationship Type</th>
                <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Dependency Severity</th>
                <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Disclosure Class</th>
                <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Operational Scope & Risks</th>
                <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Regulatory Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60 text-[#CBD5E1]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#111827]/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-[12.5px]">{item.counterpartyName}</div>
                    <div className="text-[10px] text-[#64748B]">{item.filingPeriod}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10.5px] bg-[#1E293B] text-[#94A3B8]">
                      {item.relationshipType.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {item.dependencyLevel === "CRITICAL_SINGLE_SOURCE" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
                        <AlertTriangle className="w-3 h-3" />
                        SINGLE-SOURCE
                      </span>
                    )}
                    {item.dependencyLevel === "STRATEGIC_HIGH" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                        STRATEGIC
                      </span>
                    )}
                    {item.dependencyLevel === "MODERATE" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30">
                        MODERATE
                      </span>
                    )}
                    {item.dependencyLevel === "DISTRIBUTED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30">
                        <CheckCircle2 className="w-3 h-3" />
                        DISTRIBUTED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.disclosureType === "CONFIRMED_FILING" && (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-semibold">
                        FILING AUDITED
                      </span>
                    )}
                    {item.disclosureType === "QUALITATIVE_NOTE" && (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-[#64748B]/20 text-[#94A3B8] border border-[#64748B]/40">
                        QUALITATIVE
                      </span>
                    )}
                    {item.disclosureType === "ANALYST_ESTIMATE" && (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/30">
                        ANALYST NOTE
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 max-w-xs text-[11px] leading-relaxed text-[#94A3B8]">
                    {item.description}
                  </td>
                  <td className="py-3 px-4 max-w-xs text-[10px] text-[#64748B]">
                    <div className="flex items-center gap-1">
                      <span>{item.filingCitation}</span>
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#38BDF8] hover:underline"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Institutional Explanatory Callout */}
      <div className="bg-[#0D1526] border border-[#1E3A8A]/50 rounded-lg p-4 text-xs text-[#94A3B8] leading-relaxed flex items-start gap-3 font-mono">
        <Info className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />
        <div>
          <span className="text-white font-bold block mb-1">
            Institutional Sourcing & Regulatory Disclosure Transparency:
          </span>
          Under GAAP (ASC 280) and IFRS (IFRS 8), reporting entities are strictly required to disclose
          customers contributing more than 10% of total revenue. However, supplier identities and contract volumes
          are frequently treated as proprietary trade secrets under Item 1A confidential treatment rules, unless
          they constitute an irreplaceable sole-source manufacturing bottleneck. All records displayed above are
          sourced directly from confirmed audited notes or disclosed statutory risk factors.
        </div>
      </div>

      {/* Sequential Next Step Recommendation Card */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-[#38BDF8]/30 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] font-bold">
            RECOMMENDED WORKFLOW STEP 5 OF 6
          </div>
          <div className="text-sm font-bold text-white mt-1">
            Next: Analyze Business & Geographic Exposure Concentration
          </div>
          <div className="text-xs text-[#94A3B8] mt-0.5">
            Evaluate Herfindahl-Hirschman Indices (HHI), revenue line diversification, and regional operating exposures.
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab?.("05_CONCENTRATION")}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-mono font-bold text-xs rounded transition-colors shadow-lg shadow-[#2563EB]/30 shrink-0"
        >
          <span>Examine Concentration (Module 5)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Add Custom Analyst Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-lg max-w-lg w-full p-5 shadow-2xl font-mono text-xs">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#38BDF8]" />
              Record Analyst Business Dependency Note
            </h3>
            <p className="text-[11px] text-[#94A3B8] mb-4">
              Add a verified operational counterparty or supply chain finding. This entry will be labeled
              as an <span className="text-[#8B5CF6]">ANALYST ESTIMATE</span> in accordance with data integrity guidelines.
            </p>
            <form onSubmit={handleAddCustomDependency} className="space-y-3">
              <div>
                <label className="text-[10px] text-[#64748B] block mb-1">COUNTERPARTY NAME *</label>
                <input
                  type="text"
                  required
                  value={newCounterparty}
                  onChange={(e) => setNewCounterparty(e.target.value)}
                  placeholder="e.g. ASML Holding, Foxconn, Saudi Aramco"
                  className="w-full bg-[#080B10] border border-[#334155] rounded px-3 py-1.5 text-white focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#64748B] block mb-1">RELATIONSHIP TYPE</label>
                  <select
                    value={newRelation}
                    onChange={(e) =>
                      setNewRelation(e.target.value as BusinessDependency["relationshipType"])
                    }
                    className="w-full bg-[#080B10] border border-[#334155] rounded px-3 py-1.5 text-white focus:outline-none focus:border-[#38BDF8]"
                  >
                    <option value="SUPPLIER">SUPPLIER</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="TECHNOLOGY_PARTNER">TECHNOLOGY PARTNER</option>
                    <option value="REGULATORY_INFRASTRUCTURE">REGULATORY INFRASTRUCTURE</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#64748B] block mb-1">DEPENDENCY SEVERITY</label>
                  <select
                    value={newLevel}
                    onChange={(e) =>
                      setNewLevel(e.target.value as BusinessDependency["dependencyLevel"])
                    }
                    className="w-full bg-[#080B10] border border-[#334155] rounded px-3 py-1.5 text-white focus:outline-none focus:border-[#38BDF8]"
                  >
                    <option value="CRITICAL_SINGLE_SOURCE">CRITICAL SINGLE SOURCE</option>
                    <option value="STRATEGIC_HIGH">STRATEGIC HIGH</option>
                    <option value="MODERATE">MODERATE</option>
                    <option value="DISTRIBUTED">DISTRIBUTED</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#64748B] block mb-1">OPERATIONAL SCOPE / RISK DESCRIPTION</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the nature of dependency and potential business disruption impact..."
                  className="w-full bg-[#080B10] border border-[#334155] rounded px-3 py-1.5 text-white focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748B] block mb-1">REGULATORY OR PRIMARY RESEARCH CITATION</label>
                <input
                  type="text"
                  value={newCitation}
                  onChange={(e) => setNewCitation(e.target.value)}
                  placeholder="e.g. Form 10-K Item 1A, S&P Capital IQ, Supply Chain Audit"
                  className="w-full bg-[#080B10] border border-[#334155] rounded px-3 py-1.5 text-white focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded"
                >
                  Save Sourcing Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
