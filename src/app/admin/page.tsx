"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  Database,
  Users,
  Building2,
  Sliders,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Trash2,
  PlusCircle,
  ArrowLeft,
  Activity,
  AlertTriangle,
  Clock,
  Search,
} from "lucide-react";
import { PeacockLogo } from "@/components/PeacockLogo";

type AdminTab = "telemetry" | "issuers" | "policies" | "users" | "audit";

interface AdminStats {
  counts: {
    companies: number;
    financialPeriods: number;
    auditLineItems: number;
    users: number;
    auditLogs: number;
  };
  database: {
    engine: string;
    journalMode: string;
    synchronous: string;
    isVercel: boolean;
    region: string;
  };
  system: {
    nodeVersion: string;
    platform: string;
    uptimeSeconds: number;
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  provider: {
    name: string;
    tier?: string;
    isContractual?: boolean;
    coverageScope: string;
  };
  activeHurdles: {
    globalLeverage: number;
    globalCoverage: number;
    globalLiquidity: number;
    maintenanceMode: boolean;
    rateLimitRpm: number;
  };
}

interface IssuerItem {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  scaleUnit: string;
  sector: string;
  industry: string;
  marketCap: number | null;
  sharePrice: number | null;
  createdAt: string;
  updatedAt: string;
  periodCount: number;
  auditItemCount: number;
  latestPeriod: string | null;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  desk: string;
  avatar: string;
  role: string;
  netDebtEbitdaHurdle: number | null;
  interestCoverageHurdle: number | null;
  currentRatioHurdle: number | null;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  eventType: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  operator: string;
  details: string;
}

interface SystemConfigItem {
  key: string;
  value: string;
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("telemetry");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [issuers, setIssuers] = useState<IssuerItem[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [configItems, setConfigItems] = useState<SystemConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Ingestion form state
  const [newTicker, setNewTicker] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);

  // Policy edit state
  const [leverageHurdle, setLeverageHurdle] = useState("3.5");
  const [coverageHurdle, setCoverageHurdle] = useState("2.5");
  const [liquidityHurdle, setLiquidityHurdle] = useState("1.1");
  const [rateLimitRpm, setRateLimitRpm] = useState("60");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Audit filter state
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<string>("ALL");
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>("ALL");
  const [issuerSearch, setIssuerSearch] = useState<string>("");

  // New manual audit log state
  const [manualLogDetails, setManualLogDetails] = useState("");

  const showNotification = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resStats, resIssuers, resUsers, resConfig, resLogs] = await Promise.all([
        fetch("/api/admin/stats").then((r) => r.json()),
        fetch("/api/admin/companies").then((r) => r.json()),
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/config").then((r) => r.json()),
        fetch("/api/admin/logs?limit=100").then((r) => r.json()),
      ]);

      if (resStats.success) {
        setStats(resStats);
        if (resStats.activeHurdles) {
          setLeverageHurdle(String(resStats.activeHurdles.globalLeverage));
          setCoverageHurdle(String(resStats.activeHurdles.globalCoverage));
          setLiquidityHurdle(String(resStats.activeHurdles.globalLiquidity));
          setRateLimitRpm(String(resStats.activeHurdles.rateLimitRpm));
          setMaintenanceMode(resStats.activeHurdles.maintenanceMode);
        }
      }
      if (resIssuers.success) setIssuers(resIssuers.companies);
      if (resUsers.success) setUsersList(resUsers.users);
      if (resConfig.success) setConfigItems(resConfig.config);
      if (resLogs.success) setAuditLogs(resLogs.logs);
    } catch (err) {
      console.error("Failed to load admin telemetry:", err);
      showNotification("error", "Error loading administrative data feeds");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle Issuer Ingestion
  const handleIngestTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker.trim()) return;

    setIsIngesting(true);
    try {
      const res = await fetch("/api/companies/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: newTicker.trim().toUpperCase(), forceRefresh: true }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", `Ingested ${newTicker.toUpperCase()} with ${data.periodsCount ?? 0} audited periods.`);
        setNewTicker("");
        loadAllData();
      } else {
        showNotification("error", data.error || "Failed to ingest issuer");
      }
    } catch {
      showNotification("error", "Network error during ingestion request");
    } finally {
      setIsIngesting(false);
    }
  };

  // Handle Issuer Purge
  const handlePurgeIssuer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently purge ${id} (${name}) and all its financial statements from SQLite?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/companies?id=${encodeURIComponent(id)}&operator=SUPER_ADMIN`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", data.message);
        loadAllData();
      } else {
        showNotification("error", data.error || "Failed to purge issuer");
      }
    } catch {
      showNotification("error", "Network error during purge request");
    }
  };

  // Handle User Role Change
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole, operator: "SUPER_ADMIN" }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", `Updated role for operator to ${newRole}`);
        loadAllData();
      } else {
        showNotification("error", data.error || "Failed to update role");
      }
    } catch {
      showNotification("error", "Network error during role update");
    }
  };

  // Handle User De-registration
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Confirm permanent removal of operator account ${email}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}&operator=SUPER_ADMIN`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", data.message);
        loadAllData();
      } else {
        showNotification("error", data.error || "Failed to remove user");
      }
    } catch {
      showNotification("error", "Network error during user deletion");
    }
  };

  // Handle Policy Save
  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    try {
      const updates = [
        { key: "GLOBAL_LEVERAGE_HURDLE", value: leverageHurdle, description: "Global Net Debt / EBITDA threshold trigger" },
        { key: "GLOBAL_COVERAGE_HURDLE", value: coverageHurdle, description: "Global EBIT / Interest Expense coverage floor" },
        { key: "GLOBAL_LIQUIDITY_HURDLE", value: liquidityHurdle, description: "Global Current Ratio liquidity floor" },
        { key: "RATE_LIMIT_ANALYST_RPM", value: rateLimitRpm, description: "Requests per minute allowed per terminal session" },
        { key: "MAINTENANCE_MODE", value: String(maintenanceMode), description: "Operational lockdown flag for schema re-indexing" },
      ];

      for (const item of updates) {
        await fetch("/api/admin/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, operator: "SUPER_ADMIN" }),
        });
      }

      showNotification("success", "Institutional risk hurdle policies successfully persisted to SQLite");
      loadAllData();
    } catch {
      showNotification("error", "Error saving hurdle policies");
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Handle Manual Diagnostic Log
  const handleCreateDiagnosticLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLogDetails.trim()) return;

    try {
      const res = await fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "SYSTEM_DIAGNOSTIC",
          severity: "INFO",
          operator: "SUPER_ADMIN",
          details: manualLogDetails.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", "Diagnostic entry recorded in immutable audit journal");
        setManualLogDetails("");
        loadAllData();
      } else {
        showNotification("error", data.error || "Failed to record entry");
      }
    } catch {
      showNotification("error", "Network error recording diagnostic log");
    }
  };

  const filteredIssuers = issuers.filter(
    (c) =>
      c.symbol.toLowerCase().includes(issuerSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(issuerSearch.toLowerCase()) ||
      c.exchange.toLowerCase().includes(issuerSearch.toLowerCase())
  );

  const filteredLogs = auditLogs.filter((log) => {
    if (auditSeverityFilter !== "ALL" && log.severity !== auditSeverityFilter) return false;
    if (auditTypeFilter !== "ALL" && log.eventType !== auditTypeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#080B12] text-[#F3F6FC] font-sans flex flex-col selection:bg-[#3867F5]/30">
      {/* Top Admin Clearance Bar */}
      <header className="border-b border-[#253247] bg-[#101621] px-5 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <PeacockLogo size="md" showLockup={true} />
          <div className="h-6 w-px bg-[#253247] hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#3867F5]/15 border border-[#3867F5]/40 text-[#38BDF8] text-[10px] font-mono font-bold tracking-wider">
              OPERATIONAL GOVERNANCE CONSOLE
            </span>
            <span className="text-xs text-[#9AA8BC] font-mono hidden lg:inline">
              SECURE SUPERVISORY ACCESS
            </span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#151E2D] border border-[#253247] text-[#9AA8BC]">
            <Server className="w-3.5 h-3.5 text-[#16A879]" />
            <span>NODE:</span>
            <span className="text-[#F3F6FC] font-bold">{stats?.system.platform || "win32"}</span>
            <span className="text-[#253247]">|</span>
            <span className="text-[#16A879]">{stats?.database.journalMode || "WAL"}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#151E2D] border border-[#253247] text-[#9AA8BC]">
            <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>UPTIME:</span>
            <span className="text-[#F3F6FC] font-bold">
              {stats ? `${Math.floor(stats.system.uptimeSeconds / 60)}m ${stats.system.uptimeSeconds % 60}s` : "..."}
            </span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1 bg-[#3867F5] hover:bg-[#2c53cb] text-white font-medium text-xs rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO TERMINAL</span>
          </Link>
        </div>
      </header>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`px-5 py-2.5 text-xs font-mono flex items-center justify-between border-b ${
            actionMessage.type === "success"
              ? "bg-[#16A879]/15 border-[#16A879]/50 text-[#16A879]"
              : "bg-[#F05252]/15 border-[#F05252]/50 text-[#F05252]"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-[#9AA8BC] hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[#253247] pb-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`flex items-center gap-2 px-4 py-2 border transition-all ${
              activeTab === "telemetry"
                ? "bg-[#151E2D] border-[#3867F5] text-[#38BDF8] font-bold shadow-sm"
                : "border-transparent text-[#9AA8BC] hover:text-[#F3F6FC] hover:bg-[#101621]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>01 // TELEMETRY & HEALTH</span>
          </button>

          <button
            onClick={() => setActiveTab("issuers")}
            className={`flex items-center gap-2 px-4 py-2 border transition-all ${
              activeTab === "issuers"
                ? "bg-[#151E2D] border-[#3867F5] text-[#38BDF8] font-bold shadow-sm"
                : "border-transparent text-[#9AA8BC] hover:text-[#F3F6FC] hover:bg-[#101621]"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>02 // SECURITY MASTER ({issuers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("policies")}
            className={`flex items-center gap-2 px-4 py-2 border transition-all ${
              activeTab === "policies"
                ? "bg-[#151E2D] border-[#3867F5] text-[#38BDF8] font-bold shadow-sm"
                : "border-transparent text-[#9AA8BC] hover:text-[#F3F6FC] hover:bg-[#101621]"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>03 // RISK POLICIES & HURDLES</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 border transition-all ${
              activeTab === "users"
                ? "bg-[#151E2D] border-[#3867F5] text-[#38BDF8] font-bold shadow-sm"
                : "border-transparent text-[#9AA8BC] hover:text-[#F3F6FC] hover:bg-[#101621]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>04 // USER DIRECTORY ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2 border transition-all ${
              activeTab === "audit"
                ? "bg-[#151E2D] border-[#3867F5] text-[#38BDF8] font-bold shadow-sm"
                : "border-transparent text-[#9AA8BC] hover:text-[#F3F6FC] hover:bg-[#101621]"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>05 // REGULATORY AUDIT JOURNAL</span>
          </button>

          <div className="ml-auto pl-4">
            <button
              onClick={loadAllData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] text-[#9AA8BC] hover:text-white rounded text-xs transition-colors"
              title="Refresh all metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#3867F5]" : ""}`} />
              <span>SYNC REPO</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: TELEMETRY & SYSTEM HEALTH
           ========================================================================= */}
        {activeTab === "telemetry" && (
          <div className="flex flex-col gap-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-[#101621] border border-[#253247] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#9AA8BC] text-xs font-mono">
                  <span>SECURITIES</span>
                  <Building2 className="w-4 h-4 text-[#3867F5]" />
                </div>
                <div className="text-2xl font-mono font-bold text-[#F3F6FC] mt-2">
                  {stats?.counts.companies ?? "..."}
                </div>
                <div className="text-[10px] text-[#16A879] font-mono mt-1">Verified SQLite Master</div>
              </div>

              <div className="bg-[#101621] border border-[#253247] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#9AA8BC] text-xs font-mono">
                  <span>PERIOD LEDGERS</span>
                  <FileSpreadsheet className="w-4 h-4 text-[#38BDF8]" />
                </div>
                <div className="text-2xl font-mono font-bold text-[#F3F6FC] mt-2">
                  {stats?.counts.financialPeriods ?? "..."}
                </div>
                <div className="text-[10px] text-[#9AA8BC] font-mono mt-1">Audited Financial Statements</div>
              </div>

              <div className="bg-[#101621] border border-[#253247] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#9AA8BC] text-xs font-mono">
                  <span>XBRL AUDIT ITEMS</span>
                  <Database className="w-4 h-4 text-[#16A879]" />
                </div>
                <div className="text-2xl font-mono font-bold text-[#F3F6FC] mt-2">
                  {stats?.counts.auditLineItems ?? "..."}
                </div>
                <div className="text-[10px] text-[#16A879] font-mono mt-1">Traceable Provenance Roots</div>
              </div>

              <div className="bg-[#101621] border border-[#253247] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#9AA8BC] text-xs font-mono">
                  <span>CLEARANCES</span>
                  <Users className="w-4 h-4 text-[#F5B942]" />
                </div>
                <div className="text-2xl font-mono font-bold text-[#F3F6FC] mt-2">
                  {stats?.counts.users ?? "..."}
                </div>
                <div className="text-[10px] text-[#9AA8BC] font-mono mt-1">Active Desk Operators</div>
              </div>

              <div className="bg-[#101621] border border-[#253247] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#9AA8BC] text-xs font-mono">
                  <span>AUDIT JOURNAL</span>
                  <ShieldCheck className="w-4 h-4 text-[#16A879]" />
                </div>
                <div className="text-2xl font-mono font-bold text-[#F3F6FC] mt-2">
                  {stats?.counts.auditLogs ?? "..."}
                </div>
                <div className="text-[10px] text-[#16A879] font-mono mt-1">Immutable Log Events</div>
              </div>
            </div>

            {/* Diagnostic Panels Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Database & Runtime Telemetry */}
              <div className="bg-[#101621] border border-[#253247] p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#253247] pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#3867F5]" />
                    <h3 className="font-mono text-sm font-bold text-[#F3F6FC]">DATABASE & STORAGE ENGINE</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-[#16A879]/15 text-[#16A879] text-[10px] font-mono font-bold">
                    OPERATIONAL
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 bg-[#151E2D] border border-[#253247]">
                    <div className="text-[#9AA8BC] text-[10px]">ENGINE / ORM</div>
                    <div className="font-bold text-[#F3F6FC] mt-1">{stats?.database.engine || "better-sqlite3"}</div>
                  </div>
                  <div className="p-3 bg-[#151E2D] border border-[#253247]">
                    <div className="text-[#9AA8BC] text-[10px]">JOURNAL CONCURRENCY</div>
                    <div className="font-bold text-[#16A879] mt-1">{stats?.database.journalMode || "WAL Mode"}</div>
                  </div>
                  <div className="p-3 bg-[#151E2D] border border-[#253247]">
                    <div className="text-[#9AA8BC] text-[10px]">EXECUTION RUNTIME</div>
                    <div className="font-bold text-[#F3F6FC] mt-1">Node {stats?.system.nodeVersion || process.version}</div>
                  </div>
                  <div className="p-3 bg-[#151E2D] border border-[#253247]">
                    <div className="text-[#9AA8BC] text-[10px]">DEPLOYMENT TARGET</div>
                    <div className="font-bold text-[#38BDF8] mt-1">
                      {stats?.database.isVercel ? `Vercel Serverless (${stats.database.region})` : "Local Server Environment"}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#253247] pt-3 flex flex-col gap-2">
                  <div className="text-xs font-mono text-[#9AA8BC] flex items-center justify-between">
                    <span>Heap Memory Used:</span>
                    <span className="text-[#F3F6FC] font-bold">{stats?.system.heapUsedMB ?? 0} MB / {stats?.system.heapTotalMB ?? 0} MB</span>
                  </div>
                  <div className="w-full bg-[#151E2D] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#3867F5] h-full"
                      style={{
                        width: stats ? `${Math.min(100, Math.round((stats.system.heapUsedMB / (stats.system.heapTotalMB || 1)) * 100))}%` : "0%",
                      }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-[#9AA8BC] flex justify-between">
                    <span>Resident Set Size (RSS): {stats?.system.rssMB ?? 0} MB</span>
                    <span>Zero Data Loss Policy: Enforced</span>
                  </div>
                </div>
              </div>

              {/* Data Ingestion Pipeline & Provider Status */}
              <div className="bg-[#101621] border border-[#253247] p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#253247] pb-3">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#38BDF8]" />
                    <h3 className="font-mono text-sm font-bold text-[#F3F6FC]">MARKET & XBRL DATA PROVIDER</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-[#3867F5]/15 text-[#38BDF8] text-[10px] font-mono font-bold">
                    NON-CONTRACTUAL
                  </span>
                </div>

                <div className="flex flex-col gap-3 text-xs font-mono">
                  <div className="p-3 bg-[#151E2D] border border-[#253247] flex justify-between items-center">
                    <div>
                      <div className="text-[#9AA8BC] text-[10px]">PRIMARY DATA ENGINE</div>
                      <div className="font-bold text-[#F3F6FC] mt-0.5">{stats?.provider.name || "Provider Interface"}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-[#16A879]/20 text-[#16A879] border border-[#16A879]/40">
                      ACTIVE
                    </span>
                  </div>

                  <div className="p-3 bg-[#151E2D] border border-[#253247]">
                    <div className="text-[#9AA8BC] text-[10px]">COVERAGE DOMAINS</div>
                    <div className="text-[#F3F6FC] mt-0.5">{stats?.provider.coverageScope || "Global Corporate Risk"}</div>
                  </div>

                  <div className="p-3 bg-[#151E2D] border border-[#253247]">
                    <div className="text-[#9AA8BC] text-[10px]">DATA INTEGRITY DISCLOSURE</div>
                    <div className="text-[#9AA8BC] text-[11px] mt-1 leading-relaxed">
                      All balance sheet identities, coverage multiples, and operating metrics reflect verified filings. 
                      Synthetic estimates and silent adjustments are strictly disallowed. Missing disclosures remain explicit.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Diagnostic Test */}
            <div className="bg-[#101621] border border-[#253247] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-mono font-bold text-[#F3F6FC] uppercase">Supervisory Integrity Ping</h4>
                <p className="text-xs text-[#9AA8BC] mt-0.5">
                  Append a system diagnostic timestamp to the immutable audit journal to verify persistence.
                </p>
              </div>
              <form onSubmit={handleCreateDiagnosticLog} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Diagnostic note (e.g., Weekly health check)"
                  value={manualLogDetails}
                  onChange={(e) => setManualLogDetails(e.target.value)}
                  className="px-3 py-1.5 bg-[#151E2D] border border-[#253247] text-xs font-mono text-[#F3F6FC] placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5] w-64"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] hover:border-[#3867F5] text-xs font-mono text-[#38BDF8] rounded transition-colors whitespace-nowrap"
                >
                  Record Ping
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: SECURITY MASTER & INGESTION CONSOLE
           ========================================================================= */}
        {activeTab === "issuers" && (
          <div className="flex flex-col gap-6">
            {/* Top Toolbar: Ingest Form + Search Filter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Ingestion Panel */}
              <div className="bg-[#101621] border border-[#253247] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F3F6FC]">
                  <PlusCircle className="w-4 h-4 text-[#3867F5]" />
                  <span>INGEST NEW SECURITY INTO SQLITE MASTER</span>
                </div>
                <p className="text-xs text-[#9AA8BC]">
                  Pull audited profiles, financial statements, and provenance items from verified providers.
                </p>
                <form onSubmit={handleIngestTicker} className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value)}
                    placeholder="Ticker symbol (e.g. MSFT, TCS.NS, NVDA, 7203.T)"
                    className="flex-1 px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs font-mono text-[#F3F6FC] uppercase placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5]"
                  />
                  <button
                    type="submit"
                    disabled={isIngesting || !newTicker.trim()}
                    className="px-4 py-2 bg-[#3867F5] hover:bg-[#2c53cb] disabled:opacity-50 text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    {isIngesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    <span>{isIngesting ? "INGESTING..." : "INGEST ISSUER"}</span>
                  </button>
                </form>
              </div>

              {/* Search Filter */}
              <div className="bg-[#101621] border border-[#253247] p-4 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-[#F3F6FC]">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#38BDF8]" />
                    <span>SECURITY MASTER FILTER</span>
                  </div>
                  <span className="text-[#9AA8BC]">{filteredIssuers.length} of {issuers.length} Listed</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={issuerSearch}
                    onChange={(e) => setIssuerSearch(e.target.value)}
                    placeholder="Search by Symbol, Corporate Name, or Exchange..."
                    className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs font-mono text-[#F3F6FC] placeholder:text-[#5A687D] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              </div>
            </div>

            {/* Issuers Master Table */}
            <div className="bg-[#101621] border border-[#253247] overflow-hidden">
              <div className="p-4 border-b border-[#253247] flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold text-[#F3F6FC]">REGISTERED INSTITUTIONAL ISSUERS</h3>
                <span className="text-xs font-mono text-[#9AA8BC]">Direct SQLite Multi-Period Records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#151E2D] text-[#9AA8BC] uppercase text-[10px] border-b border-[#253247]">
                    <tr>
                      <th className="px-4 py-3">Symbol</th>
                      <th className="px-4 py-3">Issuer Name</th>
                      <th className="px-4 py-3">Exchange</th>
                      <th className="px-4 py-3">Country / Ccy</th>
                      <th className="px-4 py-3 text-right">Periods</th>
                      <th className="px-4 py-3 text-right">Audit Nodes</th>
                      <th className="px-4 py-3">Latest Period</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#253247]">
                    {filteredIssuers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-[#9AA8BC]">
                          No securities matching query found in local master.
                        </td>
                      </tr>
                    ) : (
                      filteredIssuers.map((company) => (
                        <tr key={company.id} className="hover:bg-[#151E2D]/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-[#38BDF8]">{company.symbol}</td>
                          <td className="px-4 py-3 text-[#F3F6FC] max-w-[200px] truncate" title={company.name}>
                            {company.name}
                          </td>
                          <td className="px-4 py-3 text-[#9AA8BC]">{company.exchange}</td>
                          <td className="px-4 py-3 text-[#9AA8BC]">
                            {company.country} &bull; <span className="text-[#F3F6FC]">{company.currency}</span> ({company.scaleUnit})
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[#16A879]">{company.periodCount}</td>
                          <td className="px-4 py-3 text-right text-[#9AA8BC]">{company.auditItemCount}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-[#151E2D] border border-[#253247] text-[10px] text-[#38BDF8]">
                              {company.latestPeriod || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={async () => {
                                  setIsIngesting(true);
                                  await fetch("/api/companies/ingest", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ symbol: company.symbol, forceRefresh: true }),
                                  });
                                  showNotification("success", `Re-synchronized ${company.symbol} filings`);
                                  setIsIngesting(false);
                                  loadAllData();
                                }}
                                title="Force re-sync filings and quotes"
                                className="p-1.5 hover:bg-[#3867F5]/20 text-[#38BDF8] rounded transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handlePurgeIssuer(company.id, company.name)}
                                title="Purge security from database"
                                className="p-1.5 hover:bg-[#F05252]/20 text-[#F05252] rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: RISK POLICIES & HURDLES
           ========================================================================= */}
        {activeTab === "policies" && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#101621] border border-[#253247] p-6">
              <div className="border-b border-[#253247] pb-4 mb-6">
                <h3 className="font-mono text-base font-bold text-[#F3F6FC]">
                  INSTITUTIONAL RISK POLICY HURDLE CALIBRATION
                </h3>
                <p className="text-xs text-[#9AA8BC] mt-1">
                  Adjust global thresholds that trigger early warning flags across all analyst workspaces. 
                  Modifications are immediately timestamped and committed to the supervisory audit trail.
                </p>
              </div>

              <form onSubmit={handleSavePolicies} className="flex flex-col gap-6 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Leverage Multiple Hurdle */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-[#F3F6FC] font-semibold flex items-center justify-between">
                      <span>NET DEBT / EBITDA CEILING</span>
                      <span className="text-[10px] text-[#F5B942]">AMBER WARNING</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={leverageHurdle}
                      onChange={(e) => setLeverageHurdle(e.target.value)}
                      className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-sm font-mono text-[#F3F6FC] focus:outline-none focus:border-[#3867F5]"
                    />
                    <span className="text-[11px] text-[#9AA8BC]">
                      Companies exceeding this multiple are flagged as elevated default risk. Default: 3.50x
                    </span>
                  </div>

                  {/* Interest Coverage Floor */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-[#F3F6FC] font-semibold flex items-center justify-between">
                      <span>INTEREST COVERAGE FLOOR</span>
                      <span className="text-[10px] text-[#F05252]">RED VIOLATION</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={coverageHurdle}
                      onChange={(e) => setCoverageHurdle(e.target.value)}
                      className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-sm font-mono text-[#F3F6FC] focus:outline-none focus:border-[#3867F5]"
                    />
                    <span className="text-[11px] text-[#9AA8BC]">
                      EBIT / Interest Expense multiple floor. Ratios below this indicate debt-service stress. Default: 2.50x
                    </span>
                  </div>

                  {/* Current Ratio Floor */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-[#F3F6FC] font-semibold flex items-center justify-between">
                      <span>CURRENT RATIO LIQUIDITY FLOOR</span>
                      <span className="text-[10px] text-[#38BDF8]">LIQUIDITY GATE</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={liquidityHurdle}
                      onChange={(e) => setLiquidityHurdle(e.target.value)}
                      className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-sm font-mono text-[#F3F6FC] focus:outline-none focus:border-[#3867F5]"
                    />
                    <span className="text-[11px] text-[#9AA8BC]">
                      Minimum working capital coverage ratio (Current Assets / Current Liabilities). Default: 1.10x
                    </span>
                  </div>

                  {/* Rate Limiting RPM */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-[#F3F6FC] font-semibold flex items-center justify-between">
                      <span>OPERATOR RATE LIMIT (RPM)</span>
                      <span className="text-[10px] text-[#16A879]">DDOS DEFENSE</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={rateLimitRpm}
                      onChange={(e) => setRateLimitRpm(e.target.value)}
                      className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-sm font-mono text-[#F3F6FC] focus:outline-none focus:border-[#3867F5]"
                    />
                    <span className="text-[11px] text-[#9AA8BC]">
                      Max authentication and ingest requests allowed per client window. Default: 60 RPM
                    </span>
                  </div>
                </div>

                {/* Maintenance Mode Toggle */}
                <div className="p-4 bg-[#151E2D] border border-[#253247] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono font-bold text-[#F3F6FC]">GLOBAL MAINTENANCE LOCKDOWN</div>
                    <div className="text-[11px] text-[#9AA8BC] mt-0.5">
                      Restrict write operations across all analyst desks during database migrations and audits.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                      maintenanceMode
                        ? "bg-[#F05252] text-white"
                        : "bg-[#101621] border border-[#253247] text-[#9AA8BC] hover:text-[#F3F6FC]"
                    }`}
                  >
                    {maintenanceMode ? "LOCKDOWN ACTIVE" : "DISABLED"}
                  </button>
                </div>

                {/* Save CTA */}
                <div>
                  <button
                    type="submit"
                    disabled={isSavingPolicy}
                    className="px-5 py-2.5 bg-[#3867F5] hover:bg-[#2c53cb] disabled:opacity-50 text-white font-mono text-xs font-bold rounded flex items-center gap-2 transition-colors"
                  >
                    {isSavingPolicy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>CALIBRATE POLICIES & COMMIT TO AUDIT JOURNAL</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Current System Parameters in SQLite */}
            <div className="bg-[#101621] border border-[#253247] p-5">
              <h4 className="font-mono text-xs font-bold text-[#F3F6FC] uppercase mb-3">
                Persisted System Parameters (`system_config`)
              </h4>
              <div className="divide-y divide-[#253247] text-xs font-mono">
                {configItems.map((cfg) => (
                  <div key={cfg.key} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-[#38BDF8] font-bold">{cfg.key}</span>
                      <p className="text-[11px] text-[#9AA8BC]">{cfg.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-[#151E2D] border border-[#253247] text-[#16A879] font-bold">
                        {cfg.value}
                      </span>
                      <div className="text-[9px] text-[#5A687D] mt-0.5">By {cfg.updatedBy} &bull; {cfg.updatedAt.slice(0, 10)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: USER DIRECTORY & ACCESS CONTROL
           ========================================================================= */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#101621] border border-[#253247] overflow-hidden">
              <div className="p-4 border-b border-[#253247] flex items-center justify-between">
                <div>
                  <h3 className="font-mono text-sm font-bold text-[#F3F6FC]">
                    OPERATOR CLEARANCES & ROLES
                  </h3>
                  <p className="text-xs text-[#9AA8BC] mt-0.5">
                    Manage desk assignments, access permissions, and individual hurdle calibrations.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#38BDF8]">{usersList.length} Operators Enrolled</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#151E2D] text-[#9AA8BC] uppercase text-[10px] border-b border-[#253247]">
                    <tr>
                      <th className="px-4 py-3">Operator Name</th>
                      <th className="px-4 py-3">Email Identifier</th>
                      <th className="px-4 py-3">Desk Assignment</th>
                      <th className="px-4 py-3">Role Clearance</th>
                      <th className="px-4 py-3">Hurdle Overrides</th>
                      <th className="px-4 py-3">Enrolled</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#253247]">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-[#151E2D]/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-[#F3F6FC]">{user.name}</td>
                        <td className="px-4 py-3 text-[#9AA8BC]">{user.email}</td>
                        <td className="px-4 py-3 text-[#38BDF8]">{user.desk}</td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role || "ANALYST"}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="bg-[#151E2D] border border-[#253247] text-xs font-mono text-[#F3F6FC] px-2 py-1 rounded focus:outline-none focus:border-[#3867F5]"
                          >
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            <option value="LEAD_ANALYST">LEAD_ANALYST</option>
                            <option value="ANALYST">ANALYST</option>
                            <option value="DEMO_ANALYST">DEMO_ANALYST</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-[#9AA8BC]">
                          Lev: <span className="text-[#F3F6FC]">{user.netDebtEbitdaHurdle ?? "3.5"}x</span> &bull; Cov:{" "}
                          <span className="text-[#F3F6FC]">{user.interestCoverageHurdle ?? "2.5"}x</span>
                        </td>
                        <td className="px-4 py-3 text-[#9AA8BC]">{user.createdAt.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            title="De-register operator"
                            className="p-1.5 hover:bg-[#F05252]/20 text-[#F05252] rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: REGULATORY AUDIT JOURNAL
           ========================================================================= */}
        {activeTab === "audit" && (
          <div className="flex flex-col gap-6">
            {/* Filter Bar & Export Action */}
            <div className="bg-[#101621] border border-[#253247] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center flex-wrap gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#9AA8BC]">SEVERITY:</span>
                  <select
                    value={auditSeverityFilter}
                    onChange={(e) => setAuditSeverityFilter(e.target.value)}
                    className="bg-[#151E2D] border border-[#253247] text-[#F3F6FC] px-2 py-1 rounded focus:outline-none focus:border-[#3867F5]"
                  >
                    <option value="ALL">ALL SEVERITIES</option>
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[#9AA8BC]">EVENT TYPE:</span>
                  <select
                    value={auditTypeFilter}
                    onChange={(e) => setAuditTypeFilter(e.target.value)}
                    className="bg-[#151E2D] border border-[#253247] text-[#F3F6FC] px-2 py-1 rounded focus:outline-none focus:border-[#3867F5]"
                  >
                    <option value="ALL">ALL EVENT TYPES</option>
                    <option value="AUTH_LOGIN">AUTH_LOGIN</option>
                    <option value="AUTH_FAILED">AUTH_FAILED</option>
                    <option value="RATE_LIMIT_BLOCK">RATE_LIMIT_BLOCK</option>
                    <option value="DEMO_SESSION">DEMO_SESSION</option>
                    <option value="COMPANY_INGEST">COMPANY_INGEST</option>
                    <option value="POLICY_UPDATE">POLICY_UPDATE</option>
                    <option value="USER_MANAGEMENT">USER_MANAGEMENT</option>
                    <option value="SYSTEM_DIAGNOSTIC">SYSTEM_DIAGNOSTIC</option>
                  </select>
                </div>
              </div>

              <div>
                <a
                  href="/api/admin/logs?format=csv"
                  download
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#16A879] hover:bg-[#138d65] text-white font-mono text-xs font-bold rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT REGULATORY CSV</span>
                </a>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-[#101621] border border-[#253247] overflow-hidden">
              <div className="p-4 border-b border-[#253247] flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold text-[#F3F6FC]">
                  IMMUTABLE AUDIT JOURNAL ({filteredLogs.length} Records)
                </h3>
                <span className="text-xs font-mono text-[#9AA8BC]">Cryptographic Event Log</span>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#151E2D] text-[#9AA8BC] uppercase text-[10px] border-b border-[#253247] sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3">Timestamp (UTC)</th>
                      <th className="px-4 py-3">Event Type</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Operator</th>
                      <th className="px-4 py-3">Event Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#253247]">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[#9AA8BC]">
                          No audit events matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#151E2D]/50 transition-colors">
                          <td className="px-4 py-3 text-[#9AA8BC] whitespace-nowrap">
                            {log.timestamp.replace("T", " ").slice(0, 19)}
                          </td>
                          <td className="px-4 py-3 font-bold text-[#38BDF8]">
                            <span className="px-1.5 py-0.5 bg-[#151E2D] border border-[#253247]">
                              {log.eventType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                log.severity === "CRITICAL"
                                  ? "bg-[#F05252]/20 text-[#F05252] border border-[#F05252]/40"
                                  : log.severity === "WARNING"
                                  ? "bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40"
                                  : "bg-[#16A879]/20 text-[#16A879] border border-[#16A879]/40"
                              }`}
                            >
                              {log.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#F3F6FC]">{log.operator}</td>
                          <td className="px-4 py-3 text-[#9AA8BC] max-w-[450px] break-words">
                            {log.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
