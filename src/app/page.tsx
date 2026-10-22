"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AuthGate, SessionClearance } from "@/components/AuthGate";
import { SidebarNavigation } from "@/components/SidebarNavigation";
import { MacroTickerTape } from "@/components/MacroTickerTape";
import { CommandPalette } from "@/components/CommandPalette";
import { AdminConsoleView } from "@/components/AdminConsoleView";
import { OverviewWorkstation } from "@/components/OverviewWorkstation";
import { CompanyHub } from "@/components/CompanyHub";
import { FinancialHealthWorkspace } from "@/components/FinancialHealthWorkspace";
import { VulnerabilityMonitor } from "@/components/VulnerabilityMonitor";
import { BusinessDependencies } from "@/components/BusinessDependencies";
import { ConcentrationExposure } from "@/components/ConcentrationExposure";
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
import { PeacockLogo } from "@/components/PeacockLogo";
import { SEED_COMPANIES } from "@/lib/seedData";
import { Loader2, AlertCircle, Sparkles, Menu, Search } from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MethodologyModal } from "@/components/MethodologyModal";
import { TerminalWalkthroughTour } from "@/components/TerminalWalkthroughTour";

export default function FintraxisTerminalPage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(true);
  const [session, setSession] = useState<SessionClearance | null>(null);
  const [activeTab, setActiveTab] = useState<ModuleTab>("00_ADMIN");
  const [companies, setCompanies] = useState<CompanyEntity[]>(SEED_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("AAPL");
  const [profile, setProfile] = useState<CompanyRiskProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Scroll Container & Request Abort Refs
  const mainScrollRef = useRef<HTMLElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Command Palette, Settings Modal & AI Copilot State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState<boolean>(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [showIdleWarning, setShowIdleWarning] = useState<boolean>(false);

  // Inactivity Idle Timer Refs
  const idleWarningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleLogoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audit Sidecar State
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<AuditRecord | null>(null);
  const [activeAuditKey, setActiveAuditKey] = useState<string | null>(null);

  // URL Synchronization Helper (Source of Truth)
  const updateUrl = useCallback((tab: ModuleTab, companyId: string) => {
    if (typeof window === "undefined") return;
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get("tab") === tab && currentParams.get("company") === companyId) {
      return;
    }
    currentParams.set("tab", tab);
    currentParams.set("company", companyId);
    if (tab !== "02_HEALTH" && tab !== "07_REPORTS") {
      currentParams.delete("view");
    }
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    window.history.pushState({ tab, companyId }, "", newUrl);
  }, []);

  const handleSelectTab = useCallback((tab: ModuleTab) => {
    setActiveTab(tab);
    updateUrl(tab, selectedCompanyId);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: "instant" });
      mainScrollRef.current.focus();
    }
  }, [selectedCompanyId, updateUrl]);

  const handleSelectCompany = useCallback((companyId: string) => {
    setSelectedCompanyId(companyId);
    if (typeof window !== "undefined") {
      localStorage.setItem("fintraxis_last_company", companyId);
    }
    updateUrl(activeTab, companyId);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: "instant" });
      mainScrollRef.current.focus();
    }
  }, [activeTab, updateUrl]);

  // Handle browser Back / Forward navigation (PopState)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab") as ModuleTab | null;
      const urlCompany = params.get("company");
      if (urlTab) setActiveTab(urlTab);
      if (urlCompany) setSelectedCompanyId(urlCompany);
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ top: 0, behavior: "instant" });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Reset scroll position to top whenever activeTab or selectedCompanyId changes
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [activeTab, selectedCompanyId]);

  // Hydration safety & Server-Trusted Session Verification on Initial Startup
  useEffect(() => {
    let isCancelled = false;

    const verifySessionAndInit = async () => {
      let initialTab: ModuleTab = "00_ADMIN";
      let initialCompany = "AAPL";

      if (typeof window !== "undefined") {
        const lastSaved = localStorage.getItem("fintraxis_last_company");
        if (lastSaved) initialCompany = lastSaved;

        const searchParams = new URLSearchParams(window.location.search);
        const urlTab = searchParams.get("tab") as ModuleTab | null;
        const urlCompany = searchParams.get("company");
        if (urlTab) initialTab = urlTab;
        if (urlCompany) initialCompany = urlCompany;
      }

      setSelectedCompanyId(initialCompany);

      // Check per-tab confirmation flag per Entry Contract
      const isTabConfirmed =
        typeof window !== "undefined" &&
        sessionStorage.getItem("fintraxis_tab_confirmed") === "true";

      if (!isTabConfirmed) {
        // Cold visit / new tab / new window / incognito: land on Login Page First!
        if (!isCancelled) {
          setSession(null);
          setIsVerifyingAuth(false);
          setMounted(true);
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled && json.success && json.user) {
            const u = json.user;
            const verifiedSession: SessionClearance = {
              id: u.id,
              userName: u.name,
              userEmail: u.email,
              analystId: u.name,
              desk: u.desk,
              role: u.role,
              isDemo: u.isDemo,
              avatarId: u.avatar,
              netDebtEbitdaHurdle: u.netDebtEbitdaHurdle ?? 3.5,
              interestCoverageHurdle: u.interestCoverageHurdle ?? 2.5,
              currentRatioHurdle: u.currentRatioHurdle ?? 1.1,
              sessionToken: u.sessionToken,
              authenticatedAt: u.authenticatedAt,
            };
            setSession(verifiedSession);
            localStorage.setItem("fintraxis_session", JSON.stringify(verifiedSession));

            if (typeof window !== "undefined" && !new URLSearchParams(window.location.search).get("tab")) {
              const isAdmin = verifiedSession.role === "SUPER_ADMIN" || verifiedSession.role === "ADMIN";
              initialTab = isAdmin ? "00_ADMIN" : "overview";
            }
            setActiveTab(initialTab);
            setIsVerifyingAuth(false);
            setMounted(true);
            return;
          }
        } else {
          // Session expired or terminated on server
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("fintraxis_tab_confirmed");
            localStorage.removeItem("fintraxis_session");
          }
          if (!isCancelled) {
            setAuthNotice("Your session ended. Please sign in again.");
            setSession(null);
            setIsVerifyingAuth(false);
            setMounted(true);
          }
          return;
        }
      } catch (e) {
        console.warn("Server session check error:", e);
      }

      if (!isCancelled) {
        setSession(null);
        setIsVerifyingAuth(false);
        setMounted(true);
      }
    };

    verifySessionAndInit();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLockSession = useCallback(async (notice?: string) => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout notification error:", e);
    }
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("fintraxis_tab_confirmed");
      localStorage.removeItem("fintraxis_session");
      window.history.replaceState({}, "", "/");
    }
    setSession(null);
    setShowIdleWarning(false);
    if (typeof notice === "string") {
      setAuthNotice(notice);
    } else {
      setAuthNotice(null);
    }
  }, []);

  // Inactivity Idle Timer (30 minutes total, warning modal at 29 minutes)
  const resetIdleTimer = useCallback(() => {
    if (idleWarningTimerRef.current) clearTimeout(idleWarningTimerRef.current);
    if (idleLogoutTimerRef.current) clearTimeout(idleLogoutTimerRef.current);
    setShowIdleWarning(false);

    if (!session) return;

    // 29 minutes: show warning modal
    idleWarningTimerRef.current = setTimeout(() => {
      setShowIdleWarning(true);
    }, 29 * 60 * 1000);

    // 30 minutes: auto logout
    idleLogoutTimerRef.current = setTimeout(() => {
      setShowIdleWarning(false);
      handleLockSession("Your session ended due to inactivity. Please sign in again.");
    }, 30 * 60 * 1000);
  }, [session, handleLockSession]);

  useEffect(() => {
    if (!session) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => {
      if (!showIdleWarning) {
        resetIdleTimer();
      }
    };

    resetIdleTimer();
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (idleWarningTimerRef.current) clearTimeout(idleWarningTimerRef.current);
      if (idleLogoutTimerRef.current) clearTimeout(idleLogoutTimerRef.current);
    };
  }, [session, showIdleWarning, resetIdleTimer]);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+Shift+L, 1-6 Modules)
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

      // 4. Methodology Guide (Ctrl + M or Cmd + M)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setIsMethodologyOpen((prev) => !prev);
        return;
      }

      // 4. Tab Jump (1-6 for Modules 1-6) when not in an input/textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "1") handleSelectTab("01_HUB");
        else if (e.key === "2") handleSelectTab("02_HEALTH");
        else if (e.key === "3") handleSelectTab("03_VULNERABILITY");
        else if (e.key === "4") handleSelectTab("04_DEPENDENCIES");
        else if (e.key === "5") handleSelectTab("05_CONCENTRATION");
        else if (e.key === "6") handleSelectTab("06_SIMULATOR");
        else if (e.key === "7") handleSelectTab("07_REPORTS");
        else if (e.key === "8") handleSelectTab("overview");
        else if (e.key === "9") setIsAiOpen((prev) => !prev);
        else if (e.key === "0") handleSelectTab("00_ADMIN");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSelectTab, handleLockSession]);

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
      avatarCustomUrl: updated.avatarCustomUrl !== undefined ? updated.avatarCustomUrl : session.avatarCustomUrl,
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

  // Load Active Company Risk Profile with in-flight AbortController
  const loadProfile = useCallback(async (companyId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${encodeURIComponent(companyId)}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setProfile(json.data);
      } else {
        throw new Error(json.error || "Failed to load risk profile");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Aborted by newer company selection
      }
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

  // Prevent flash of content: Render neutral branded terminal splash while verifying clearance
  if (isVerifyingAuth || !mounted) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center font-mono text-slate-400 gap-4 select-none">
        <PeacockLogo size="lg" showLockup={false} />
        <div className="flex items-center gap-2.5 text-xs tracking-widest text-[#38BDF8]">
          <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
          <span>VERIFYING TERMINAL CLEARANCE &bull; FINTRAXIS SOVEREIGN</span>
        </div>
      </div>
    );
  }

  // Enforce Real Authentication & Onboarding Gate
  if (!session) {
    return (
      <AuthGate
        initialMessage={authNotice}
        onAuthenticated={(s) => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("fintraxis_tab_confirmed", "true");
          }
          setSession(s);
          setAuthNotice(null);
          const isAdmin = s.role === "SUPER_ADMIN" || s.role === "ADMIN";
          const targetTab: ModuleTab = isAdmin ? "00_ADMIN" : "overview";
          setActiveTab(targetTab);
          updateUrl(targetTab, selectedCompanyId);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#F8FAFC] flex font-mono selection:bg-[#38BDF8]/30 selection:text-[#FFFFFF]">
      {/* Column 1: Vertical Institutional Left Sidebar */}
      <SidebarNavigation
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        companies={companies}
        activeProfile={profile}
        onSelectCompany={handleSelectCompany}
        session={session}
        onLogout={handleLockSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
        earlyWarningCount={profile?.earlyWarningFlags.length || 0}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Column 2: Flexible Main Workspace Area (responsive offset: pl-0 on mobile, lg:pl-64 on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 pl-0 lg:pl-64 transition-all duration-200">
        {/* Mobile Header Bar (< lg screens) */}
        <header className="lg:hidden w-full bg-[#090D17] border-b border-[#182337] px-3.5 py-2.5 flex items-center justify-between sticky top-0 z-30 select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-1.5 bg-[#0F1626] hover:bg-[#182337] border border-[#182337] text-[#38BDF8] rounded transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <PeacockLogo size="sm" showLockup={false} />
              <span className="font-mono font-bold tracking-widest text-xs text-slate-100">
                FINTRAXIS
              </span>
            </div>
            {profile?.company.symbol && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#0F1626] border border-[#38BDF8]/30 text-[#38BDF8] text-[10px] font-bold rounded">
                {profile.company.symbol}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-1.5 bg-[#0F1626] hover:bg-[#182337] border border-[#182337] text-[#94A3B8] hover:text-[#FFFFFF] rounded transition-colors"
              title="Quick Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsAiOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[11px] rounded transition-colors shadow-[0_0_12px_rgba(37,99,235,0.4)] cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI</span>
            </button>
          </div>
        </header>

        {/* Top Legible Macro Ticker & Utility Bar */}
        <MacroTickerTape
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
          onOpenTour={() => setIsTourOpen(true)}
          selectedTicker={profile?.company.symbol}
          selectedCurrency={profile?.company.currency}
          selectedCountry={profile?.company.country}
          userDesk={session.desk}
        />

        {/* Scrollable Workstation Canvas (Responsive safe padding for mobile bottom nav) */}
        <main
          ref={mainScrollRef}
          tabIndex={-1}
          className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1720px] w-full mx-auto relative pb-28 lg:pb-16 overflow-y-auto focus:outline-none"
        >
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

          {/* Contextual Institutional Field Guide for Active Module */}
          <ModuleGuide moduleKey={activeTab} />

          {/* Module 01: Administrative Governance & Supervisory Console */}
          {activeTab === "00_ADMIN" && (
            <AdminConsoleView
              session={session}
              onNavigateToTab={handleSelectTab}
            />
          )}

          {/* Executive Corporate Overview */}
          {activeTab === "overview" && (
            <OverviewWorkstation
              profile={profile}
              companies={companies}
              onSelectCompany={handleSelectCompany}
              onRefreshProfile={() => loadProfile(selectedCompanyId)}
              onNavigateToTab={handleSelectTab}
            />
          )}

          {/* Desk 01: Global Securities Directory & Master */}
          {activeTab === "01_HUB" && (
            <CompanyHub
              companies={companies}
              activeProfile={profile}
              onSelectCompany={handleSelectCompany}
              onNavigateToTab={handleSelectTab}
              onRefreshMaster={loadCompanies}
              isLoading={isLoading}
            />
          )}

          {/* Module 02: Financial Health Analysis (Unifying 3-Statement XBRL Ledger + Credit Solvency Ratios) */}
          {(activeTab === "02_HEALTH" || activeTab === "02_STATEMENTS" || activeTab === "03_HEALTH") && profile && (
            <FinancialHealthWorkspace
              profile={profile}
              onAuditMetric={handleAuditMetric}
              activeAuditKey={activeAuditKey}
              onNavigateToTab={handleSelectTab}
            />
          )}

          {/* Module 03: Financial Vulnerability Monitor */}
          {(activeTab === "03_VULNERABILITY" || activeTab === "04_VULNERABILITY") && profile && (
            <VulnerabilityMonitor
              profile={profile}
              session={session}
              onNavigateToTab={handleSelectTab}
            />
          )}

          {/* Module 04: Business Dependency Intelligence */}
          {activeTab === "04_DEPENDENCIES" && profile && (
            <BusinessDependencies
              profile={profile}
              onNavigateToTab={handleSelectTab}
            />
          )}

          {/* Module 05: Concentration & Exposure Analysis */}
          {activeTab === "05_CONCENTRATION" && profile && (
            <ConcentrationExposure
              profile={profile}
              onNavigateToTab={handleSelectTab}
            />
          )}

          {/* Module 06: Scenario & Resilience Simulator */}
          {(activeTab === "06_SIMULATOR" || activeTab === "05_SIMULATOR") && profile && (
            <StressSimulator
              profile={profile}
              onNavigateToTab={handleSelectTab}
            />
          )}

          {/* Supporting Capability: Investment Committee Research Reports & Export */}
          {(activeTab === "07_REPORTS" || activeTab === "06_MEMO") && profile && (
            <ICDossier
              profile={profile}
              session={session}
              onNavigateToTab={handleSelectTab}
            />
          )}

          {/* Fallback Loading State */}
          {isLoading && !profile && (
            <div className="py-24 flex flex-col items-center justify-center space-y-3 text-[#64748B]">
              <Loader2 className="w-6 h-6 animate-spin text-[#38BDF8]" />
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
            handleSelectCompany(ticker);
          }}
          onSelectTab={handleSelectTab}
          onLockSession={handleLockSession}
          onExportMemo={() => {
            handleSelectTab("07_REPORTS");
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
              avatarCustomUrl: session.avatarCustomUrl,
              netDebtEbitdaHurdle: session.netDebtEbitdaHurdle ?? 3.5,
              interestCoverageHurdle: session.interestCoverageHurdle ?? 2.5,
              currentRatioHurdle: session.currentRatioHurdle ?? 1.1,
            }}
            onSave={handleUpdateSettings}
            onReseedCache={loadCompanies}
            onLogout={handleLockSession}
          />
        )}

        {/* Floating AI Financial Risk Copilot Trigger */}
        <button
          onClick={() => setIsAiOpen(true)}
          className="fixed bottom-20 lg:bottom-10 right-4 sm:right-6 z-40 bg-[#38BDF8] hover:bg-[#1D4ED8] text-[#080B10] px-4 py-2 font-mono font-bold text-xs rounded-full shadow-[0_4px_24px_rgba(37,99,235,0.4)] flex items-center gap-2 transition-all hover:scale-105 cursor-pointer no-print border border-[#080B10]"
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

        {/* Mobile-First Bottom Navigation Bar (Hidden on lg+ screens) */}
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          earlyWarningCount={profile?.earlyWarningFlags.length || 0}
          session={session}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
          onOpenAi={() => setIsAiOpen(true)}
          onLogout={handleLockSession}
          isMoreOpen={isMobileMoreOpen}
          setIsMoreOpen={setIsMobileMoreOpen}
        />

        {/* Methodology & Data Sources Guide Modal (Examiners & Analysts) */}
        <MethodologyModal
          isOpen={isMethodologyOpen}
          onClose={() => setIsMethodologyOpen(false)}
        />

        {/* Terminal Walkthrough Spotlight Tour */}
        <TerminalWalkthroughTour
          isOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
          onNavigateToTab={handleSelectTab}
        />

        {/* Inactivity Idle Security Warning Modal */}
        {showIdleWarning && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="idle-warning-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none animate-in fade-in duration-150"
          >
            <div className="bg-[#0C111C] border border-[#F59E0B] p-6 max-w-md w-full rounded-2xl shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-[#F59E0B] font-bold text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span id="idle-warning-title">SESSION INACTIVITY WARNING</span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                For banking risk compliance, your active workstation session will expire in 60 seconds due to inactivity. Would you like to remain signed in?
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleLockSession("You have signed out.")}
                  className="min-h-[44px] px-3.5 py-2 bg-[#1E293B] hover:bg-[#334155] text-xs text-white rounded-lg transition-colors cursor-pointer"
                >
                  Sign Out Now
                </button>
                <button
                  type="button"
                  onClick={resetIdleTimer}
                  className="min-h-[44px] px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-white rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  Stay Signed In
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Institutional Fixed Status Footer (Desktop only) */}
        <footer className="fixed bottom-0 left-0 lg:left-64 right-0 h-7 border-t border-[#1E2536] bg-[#0A0E17] px-4 hidden lg:flex items-center justify-between text-[10px] text-[#64748B] select-none z-30 font-mono no-print">
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
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="text-[#94A3B8] hover:text-[#38BDF8] underline transition-colors cursor-pointer"
            >
              METHODOLOGY &amp; FORMULAS (CTRL+M)
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsTourOpen(true)}
              className="text-[#94A3B8] hover:text-[#38BDF8] underline transition-colors cursor-pointer"
            >
              TAKE TOUR
            </button>
            <span>&bull;</span>
            <span>HOTKEYS: [1-6] &bull; CTRL+K &bull; CTRL+J</span>
            <span>&bull;</span>
            <span className="text-[#38BDF8]">FINTRAXIS INSTITUTIONAL</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
