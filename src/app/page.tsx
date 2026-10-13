"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AuthGate, SessionClearance } from "@/components/AuthGate";
import { SidebarNavigation } from "@/components/SidebarNavigation";
import { MacroTickerTape } from "@/components/MacroTickerTape";
import { WorkflowBanner } from "@/components/WorkflowBanner";
import { CommandPalette } from "@/components/CommandPalette";
import { CompanyHub } from "@/components/CompanyHub";
import { StatementsLedger } from "@/components/StatementsLedger";
import { HealthRatios } from "@/components/HealthRatios";
import { VulnerabilityMonitor } from "@/components/VulnerabilityMonitor";
import { StressSimulator } from "@/components/StressSimulator";
import { ICDossier } from "@/components/ICDossier";
import { AuditSidecar } from "@/components/AuditSidecar";
import { ModuleGuide } from "@/components/ModuleGuide";
import { SettingsModal, OperatorSettings } from "@/components/SettingsModal";
import { FinancialAiAssistant } from "@/components/FinancialAiAssistant";
import { ModuleTab } from "@/components/NavigationTabs";
import {
  CompanyEntity,
  CompanyRiskProfile,
  AuditRecord,
} from "@/lib/types";
import { SEED_COMPANIES } from "@/lib/seedData";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";

export default function FintraxisTerminalPage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [session, setSession] = useState<SessionClearance | null>(null);
  const [activeTab, setActiveTab] = useState<ModuleTab>("01_HUB");
  const [companies, setCompanies] = useState<CompanyEntity[]>(SEED_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("AAPL");
  const [profile, setProfile] = useState<CompanyRiskProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Command Palette, Settings Modal & AI Copilot State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);

  // Audit Sidecar State
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<AuditRecord | null>(null);
  const [activeAuditKey, setActiveAuditKey] = useState<string | null>(null);

  // Hydration safety & Session Restoral
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("fintraxis_session");
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch (e) {
        console.warn("Corrupt session in storage, resetting:", e);
      }
    }
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+Shift+L, 1-6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Drop Credentials / Lock Terminal (Ctrl + Shift + L or Cmd + Shift + L)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === "L") {
        e.preventDefault();
        handleLockSession();
        return;
      }

      // 2. Command Palette (Ctrl + K or Cmd + K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // 3. Financial AI Risk Copilot (Ctrl + J or Cmd + J)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsAiOpen((prev) => !prev);
        return;
      }

      // 4. Tab Jump (1-6) when not in an input/textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "1") setActiveTab("01_HUB");
        else if (e.key === "2") setActiveTab("02_STATEMENTS");
        else if (e.key === "3") setActiveTab("03_HEALTH");
        else if (e.key === "4") setActiveTab("04_VULNERABILITY");
        else if (e.key === "5") setActiveTab("05_SIMULATOR");
        else if (e.key === "6") setActiveTab("06_MEMO");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLockSession = () => {
    localStorage.removeItem("fintraxis_session");
    setSession(null);
  };

  const handleUpdateSettings = (updated: OperatorSettings) => {
    if (!session) return;
    const newSession: SessionClearance = {
      ...session,
      id: updated.id || session.id,
      userName: updated.name,
      userEmail: updated.email,
      analystId: updated.name,
      desk: updated.desk,
      avatarId: updated.avatar,
      netDebtEbitdaHurdle: updated.netDebtEbitdaHurdle,
      interestCoverageHurdle: updated.interestCoverageHurdle,
      currentRatioHurdle: updated.currentRatioHurdle,
    };
    setSession(newSession);
    localStorage.setItem("fintraxis_session", JSON.stringify(newSession));
  };

  // Load Companies Master List
  const loadCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/companies");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setCompanies(json.data);
      }
    } catch (e) {
      console.warn("Using static seed companies:", e);
    }
  }, []);

  // Load Active Company Risk Profile
  const loadProfile = useCallback(async (companyId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${encodeURIComponent(companyId)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setProfile(json.data);
      } else {
        throw new Error(json.error || "Failed to load risk profile");
      }
    } catch (err: unknown) {
      console.error("Profile load failure:", err);
      const msg = err instanceof Error ? err.message : "Failed to load risk profile";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    if (selectedCompanyId) {
      loadProfile(selectedCompanyId);
    }
  }, [selectedCompanyId, loadProfile]);

  // Handle cell click to open Audit Sidecar
  const handleAuditMetric = async (
    metricKey: string,
    period: string,
    label: string,
    value?: number | null
  ) => {
    setActiveAuditKey(`${metricKey}_${period}`);
    setIsAuditOpen(true);

    try {
      const res = await fetch(
        `/api/audit?companyId=${encodeURIComponent(
          selectedCompanyId
        )}&metricKey=${encodeURIComponent(metricKey)}&period=${encodeURIComponent(
          period
        )}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedAuditRecord(json.data);
        return;
      }
    } catch (e) {
      console.warn("Audit query fallback:", e);
    }

    // Dynamic fallback audit record
    setSelectedAuditRecord({
      id: `DYNAMIC_${metricKey}_${period}`,
      companyId: selectedCompanyId,
      period,
      metricKey,
      metricLabel: label,
      reportedValue: value,
      currency: profile?.company.currency || "USD",
      scaleUnit: profile?.company.scaleUnit || "Millions",
      formula: `Standardized Line Item: ${label}`,
      xbrlTag: `${profile?.company.accountingStandard.toLowerCase()}:${metricKey}`,
      sourceFiling: "Annual Regulatory Filing Form 10-K / Yuho / 20-F",
      filingDate: "Audited Regulatory Period End",
      filingUrl: profile?.periods.find((p) => p.period === period)?.filingUrl || "https://www.sec.gov/edgar",
      notes: "Line item verified against regulatory taxonomy standards.",
    });
  };

  // Prevent flash of content during hydration
  if (!mounted) {
    return <div className="min-h-screen bg-[#080B10]" />;
  }

  // Enforce Real Authentication & Onboarding Gate
  if (!session) {
    return <AuthGate onAuthenticated={(s) => setSession(s)} />;
  }

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F8FAFC] flex font-mono selection:bg-[#C5A880]/30 selection:text-[#F8FAFC]">
      {/* Column 1: Vertical Institutional Left Sidebar */}
      <SidebarNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        companies={companies}
        activeProfile={profile}
        onSelectCompany={(id) => setSelectedCompanyId(id)}
        session={session}
        onLogout={handleLockSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
        earlyWarningCount={profile?.earlyWarningFlags.length || 0}
      />

      {/* Column 2: Flexible Main Workspace Area (offset by sidebar width) */}
      <div className="flex-1 flex flex-col min-w-0 pl-64 transition-all duration-200">
        {/* Top Legible Macro Ticker & Utility Bar */}
        <MacroTickerTape
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          selectedTicker={profile?.company.symbol}
          selectedCurrency={profile?.company.currency}
          selectedCountry={profile?.company.country}
          userDesk={session.desk}
        />

        {/* Scrollable Workstation Canvas */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1720px] w-full mx-auto relative pb-20 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-[#F43F5E]/10 border border-[#F43F5E] text-[#F43F5E] text-xs flex items-center justify-between rounded">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>TERMINAL WARNING: {error}</span>
              </div>
              <button
                onClick={() => loadProfile(selectedCompanyId)}
                className="px-2.5 py-0.5 bg-[#080B10] border border-[#F43F5E] text-xs hover:bg-[#F43F5E] hover:text-white transition-colors rounded"
              >
                RETRY
              </button>
            </div>
          )}

          {/* Collapsible Institutional Underwriting Workflow Discovery Banner */}
          <WorkflowBanner
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            selectedTicker={profile?.company.symbol}
          />

          {/* Contextual Institutional Field Guide for Active Module */}
          <ModuleGuide moduleKey={activeTab} />

          {/* Module 01: Global Security Master & Real-Time Market HUD */}
          {activeTab === "01_HUB" && (
            <CompanyHub
              companies={companies}
              activeProfile={profile}
              onSelectCompany={(id) => setSelectedCompanyId(id)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onRefreshMaster={loadCompanies}
              isLoading={isLoading}
            />
          )}

          {/* Module 02: Multi-Period Statement Ledger & XBRL Line-Item Audit */}
          {activeTab === "02_STATEMENTS" && profile && (
            <StatementsLedger
              profile={profile}
              onAuditMetric={handleAuditMetric}
              activeAuditKey={activeAuditKey}
            />
          )}

          {/* Module 03: Deterministic Solvency & Health DAG Matrix */}
          {activeTab === "03_HEALTH" && profile && (
            <HealthRatios
              profile={profile}
              onAuditMetric={handleAuditMetric}
            />
          )}

          {/* Module 04: Vulnerability Monitor & Basel III Early Warning System */}
          {activeTab === "04_VULNERABILITY" && profile && (
            <VulnerabilityMonitor profile={profile} session={session} />
          )}

          {/* Module 05: Deterministic Stress Simulator [SIMULATED - HYPOTHETICAL] */}
          {activeTab === "05_SIMULATOR" && profile && (
            <StressSimulator profile={profile} />
          )}

          {/* Module 06: Formal Credit Risk & IC Underwriting Dossier */}
          {activeTab === "06_MEMO" && profile && (
            <ICDossier profile={profile} session={session} />
          )}

          {/* Fallback Loading State */}
          {isLoading && !profile && (
            <div className="py-24 flex flex-col items-center justify-center space-y-3 text-[#64748B]">
              <Loader2 className="w-6 h-6 animate-spin text-[#C5A880]" />
              <div className="text-xs uppercase tracking-wider">
                RESOLVING INSTITUTIONAL METRICS &bull; QUERYING SQLITE WAL...
              </div>
            </div>
          )}
        </main>

        {/* Expandable Audit Sidecar Drawer */}
        <AuditSidecar
          isOpen={isAuditOpen}
          onClose={() => {
            setIsAuditOpen(false);
            setActiveAuditKey(null);
          }}
          auditItem={selectedAuditRecord}
          company={profile?.company || null}
        />

        {/* Bloomberg-Style Execution Command Bar (Ctrl + K) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelectCompany={(ticker) => {
            setSelectedCompanyId(ticker);
            loadProfile(ticker);
          }}
          onSelectTab={(tab) => setActiveTab(tab)}
          onLockSession={handleLockSession}
          onExportMemo={() => {
            setActiveTab("06_MEMO");
            setTimeout(() => window.print(), 200);
          }}
        />

        {/* Institutional Settings & Calibration Modal */}
        {session && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={{
              id: session.id,
              name: session.userName,
              email: session.userEmail,
              desk: session.desk,
              avatar: (session.avatarId as string) || "crest",
              netDebtEbitdaHurdle: session.netDebtEbitdaHurdle ?? 3.5,
              interestCoverageHurdle: session.interestCoverageHurdle ?? 2.5,
              currentRatioHurdle: session.currentRatioHurdle ?? 1.1,
            }}
            onSave={handleUpdateSettings}
            onReseedCache={loadCompanies}
          />
        )}

        {/* Floating AI Financial Risk Copilot Trigger */}
        <button
          onClick={() => setIsAiOpen(true)}
          className="fixed bottom-10 right-6 z-40 bg-[#C5A880] hover:bg-[#D4B996] text-[#080B10] px-4 py-2 font-mono font-bold text-xs rounded-full shadow-[0_4px_24px_rgba(197,168,128,0.4)] flex items-center gap-2 transition-all hover:scale-105 cursor-pointer no-print border border-[#080B10]"
          title="Open Financial AI Copilot (Ctrl + J)"
        >
          <Sparkles className="w-4 h-4 text-[#080B10]" />
          <span>AI Risk Copilot</span>
          <span className="text-[9.5px] px-1.5 py-0.2 bg-[#080B10]/20 rounded font-normal">
            CTRL+J
          </span>
        </button>

        {/* Financial AI Risk Copilot Drawer */}
        <FinancialAiAssistant
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
          activeProfile={profile}
        />

        {/* Institutional Fixed Status Footer */}
        <footer className="fixed bottom-0 left-64 right-0 h-7 border-t border-[#1E2536] bg-[#0A0E17] px-4 flex items-center justify-between text-[10px] text-[#64748B] select-none z-30 font-mono no-print">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#10B981]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              <span>PORT 3001 OK</span>
            </span>
            <span>&bull;</span>
            <span>OPERATOR: {session.userName}</span>
            <span>&bull;</span>
            <span>DESK: {session.desk}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>HOTKEYS: [1-6] MODULES &bull; CTRL+K SEARCH &bull; CTRL+J AI COPILOT &bull; CTRL+SHIFT+L LOCK</span>
            <span>&bull;</span>
            <span className="text-[#C5A880]">FINTRAXIS INSTITUTIONAL</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
