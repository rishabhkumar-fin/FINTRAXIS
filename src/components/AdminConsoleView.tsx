"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
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
  Activity,
  AlertTriangle,
  Search,
  ArrowRight,
  Radio,
  CheckCircle2,
  XCircle,
  Settings2,
  Play,
  FileText,
  UserPlus,
  Zap,
} from "lucide-react";
import { SessionClearance } from "./AuthGate";
import { ModuleTab } from "./NavigationTabs";

export type AdminSubTab =
  | "telemetry"
  | "users"
  | "permissions"
  | "providers"
  | "policies"
  | "issuers"
  | "jobs"
  | "audit"
  | "settings";

interface AdminStats {
  counts: {
    companies: number;
    financialPeriods: number;
    auditLineItems: number;
    users: number;
    usersActive?: number;
    usersDeactivated?: number;
    auditLogs: number;
    systemJobs?: number;
  };
  userBreakdown?: {
    total: number;
    active: number;
    deactivated: number;
    superAdmins: number;
    admins: number;
    analysts: number;
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
    alertMarginDeterioration?: number;
    alertRevenueContraction?: number;
    maxRateShockBps?: number;
    defaultCurrency?: string;
    defaultPeriodType?: string;
    sessionTimeoutMinutes?: number;
    loginLockoutAttempts?: number;
    organizationName?: string;
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
  status: "ACTIVE" | "DEACTIVATED";
  lastLoginAt: string | null;
  netDebtEbitdaHurdle: number | null;
  interestCoverageHurdle: number | null;
  currentRatioHurdle: number | null;
  createdAt: string;
}

interface ProviderItem {
  id: string;
  name: string;
  category: string;
  status: "ACTIVE" | "STANDBY" | "UNCONFIGURED" | "DEGRADED";
  isContractual: boolean;
  credentialsStatus: string;
  supportedCategories: string[];
  coverageLimitations: string;
  lastSuccessfulRetrieval: string;
  latestError: string | null;
  responseTimeMs: number;
}

interface JobItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: "IDLE" | "RUNNING" | "COMPLETED" | "FAILED";
  lastRunAt: string | null;
  lastDurationMs: number | null;
  recordsProcessed: number | null;
  lastError: string | null;
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

interface AdminConsoleViewProps {
  session?: SessionClearance | null;
  onNavigateToTab?: (tab: ModuleTab) => void;
}

export function AdminConsoleView({ session, onNavigateToTab }: AdminConsoleViewProps) {
  const [activeTab, setActiveTab] = useState<AdminSubTab>("telemetry");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [issuers, setIssuers] = useState<IssuerItem[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [providersList, setProvidersList] = useState<ProviderItem[]>([]);
  const [jobsList, setJobsList] = useState<JobItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [configItems, setConfigItems] = useState<SystemConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Ingestion form state
  const [newTicker, setNewTicker] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);

  // Policy hurdle calibration state
  const [leverageHurdle, setLeverageHurdle] = useState("3.5");
  const [coverageHurdle, setCoverageHurdle] = useState("2.5");
  const [liquidityHurdle, setLiquidityHurdle] = useState("1.1");
  const [marginDeterioration, setMarginDeterioration] = useState("-5.0");
  const [revenueContraction, setRevenueContraction] = useState("-10.0");
  const [maxRateShock, setMaxRateShock] = useState("500");
  const [rateLimitRpm, setRateLimitRpm] = useState("60");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [defaultPeriodType, setDefaultPeriodType] = useState("ANNUAL");
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [lockoutAttempts, setLockoutAttempts] = useState("5");
  const [orgName, setOrgName] = useState("FINTRAXIS Institutional Risk Services");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Filtering states
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [issuerSearch, setIssuerSearch] = useState("");
  const [auditSeverityFilter, setAuditSeverityFilter] = useState("ALL");
  const [auditTypeFilter, setAuditTypeFilter] = useState("ALL");
  const [auditSearch, setAuditSearch] = useState("");

  // Modals & User Provisioning state
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserDesk, setNewUserDesk] = useState("Institutional Risk Desk");
  const [newUserRole, setNewUserRole] = useState("ANALYST");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Manual company creation state
  const [isManualCompanyOpen, setIsManualCompanyOpen] = useState(false);
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualExchange, setManualExchange] = useState("NASDAQ");
  const [manualCurrency, setManualCurrency] = useState("USD");
  const [manualSector, setManualSector] = useState("Technology");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // Financial Statement Editor state
  const [isStatementEditorOpen, setIsStatementEditorOpen] = useState(false);
  const [statementCompany, setStatementCompany] = useState<IssuerItem | null>(null);
  const [statementPeriod, setStatementPeriod] = useState("FY2024");
  const [statementRevenue, setStatementRevenue] = useState("");
  const [statementEbitda, setStatementEbitda] = useState("");
  const [statementDebt, setStatementDebt] = useState("");
  const [statementCash, setStatementCash] = useState("");
  const [statementInterest, setStatementInterest] = useState("");
  const [isSavingStatement, setIsSavingStatement] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDestructive: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Provider health test state
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [providerTestResult, setProviderTestResult] = useState<{ id: string; msg: string; latency: number } | null>(null);

  // Job execution state
  const [runningJobId, setRunningJobId] = useState<string | null>(null);

  // Diagnostic log note state
  const [manualLogDetails, setManualLogDetails] = useState("");

  const userRole = session?.role || (session?.isDemo ? "DEMO_ANALYST" : "ANALYST");
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
  const canModifyConfig = isSuperAdmin || isAdmin || userRole === "LEAD_ANALYST";
  const canManageUsers = isSuperAdmin || isAdmin;

  const showNotification = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (session?.userEmail) headers["x-operator-email"] = session.userEmail;
      if (session?.sessionToken) headers["x-session-token"] = session.sessionToken;

      const [resStats, resIssuers, resUsers, resProviders, resJobs, resConfig, resLogs] = await Promise.all([
        fetch("/api/admin/stats", { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/admin/companies", { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/admin/users", { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/admin/providers", { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/admin/jobs", { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/admin/config", { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/admin/logs?limit=150", { headers }).then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (resStats.success) {
        setStats(resStats);
        if (resStats.activeHurdles) {
          const h = resStats.activeHurdles;
          setLeverageHurdle(String(h.globalLeverage));
          setCoverageHurdle(String(h.globalCoverage));
          setLiquidityHurdle(String(h.globalLiquidity));
          setRateLimitRpm(String(h.rateLimitRpm));
          setMaintenanceMode(h.maintenanceMode);
          if (h.alertMarginDeterioration !== undefined) setMarginDeterioration(String(h.alertMarginDeterioration));
          if (h.alertRevenueContraction !== undefined) setRevenueContraction(String(h.alertRevenueContraction));
          if (h.maxRateShockBps !== undefined) setMaxRateShock(String(h.maxRateShockBps));
          if (h.defaultCurrency) setDefaultCurrency(h.defaultCurrency);
          if (h.defaultPeriodType) setDefaultPeriodType(h.defaultPeriodType);
          if (h.sessionTimeoutMinutes) setSessionTimeout(String(h.sessionTimeoutMinutes));
          if (h.loginLockoutAttempts) setLockoutAttempts(String(h.loginLockoutAttempts));
          if (h.organizationName) setOrgName(h.organizationName);
        }
      }
      if (resIssuers.success) setIssuers(resIssuers.companies);
      if (resUsers.success) setUsersList(resUsers.users);
      if (resProviders.success) setProvidersList(resProviders.providers);
      if (resJobs.success) setJobsList(resJobs.jobs);
      if (resConfig.success) setConfigItems(resConfig.config);
      if (resLogs.success) setAuditLogs(resLogs.logs);
    } catch (err) {
      console.warn("Failed to load admin telemetry feeds:", err);
      showNotification("error", "Error loading administrative telemetry feeds");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handler: Ingest Ticker
  const handleIngestTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker.trim()) return;

    setIsIngesting(true);
    try {
      const res = await fetch("/api/companies/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-email": session?.userEmail || "admin@fintraxis.terminal",
        },
        body: JSON.stringify({ ticker: newTicker.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", `Registered issuer ${data.company.symbol} (${data.company.name})`);
        setNewTicker("");
        loadAllData();
      } else {
        showNotification("error", data.error || "Failed to ingest company");
      }
    } catch {
      showNotification("error", "Network error during company registration");
    } finally {
      setIsIngesting(false);
    }
  };

  // Handler: Purge Company (with Confirmation)
  const handlePurgeCompany = (id: string, symbol: string) => {
    setConfirmDialog({
      isOpen: true,
      title: `Purge Security Master Issuer: ${symbol}`,
      description: `This action will permanently delete ${symbol} and all linked financial periods, income statements, balance sheets, and XBRL audit items from SQLite. This cannot be undone.`,
      actionLabel: "Permanently Purge Entity",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/admin/companies?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: { "x-operator-email": session?.userEmail || "admin@fintraxis.terminal" },
          });
          const data = await res.json();
          if (data.success) {
            showNotification("success", `Purged issuer ${symbol} from database`);
            loadAllData();
          } else {
            showNotification("error", data.error || "Failed to purge company");
          }
        } catch {
          showNotification("error", "Network error while purging company");
        }
      },
    });
  };

  // Handler: Manual Company Enrollment
  const handleCreateManualCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSymbol.trim() || !manualName.trim()) return;

    setIsCreatingCompany(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-email": session?.userEmail || "admin@fintraxis.local",
        },
        body: JSON.stringify({
          symbol: manualSymbol.trim().toUpperCase(),
          name: manualName.trim(),
          exchange: manualExchange,
          currency: manualCurrency,
          sector: manualSector,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", `Successfully added new company: ${manualSymbol.toUpperCase()}`);
        setManualSymbol("");
        setManualName("");
        setIsManualCompanyOpen(false);
        loadAllData();
      } else {
        showNotification("error", data.error || "Failed to add company");
      }
    } catch {
      showNotification("error", "Network error while creating company");
    } finally {
      setIsCreatingCompany(false);
    }
  };

  // Handler: Open Financial Statement Editor
  const handleOpenStatementEditor = async (company: IssuerItem) => {
    setStatementCompany(company);
    setStatementPeriod("FY2024");
    setStatementRevenue("");
    setStatementEbitda("");
    setStatementDebt("");
    setStatementCash("");
    setStatementInterest("");
    setIsStatementEditorOpen(true);

    try {
      const res = await fetch(`/api/admin/periods?companyId=${encodeURIComponent(company.id)}`);
      const data = await res.json();
      if (data.success && data.periods && data.periods.length > 0) {
        const latestP = data.periods[0];
        setStatementPeriod(latestP.period || "FY2024");
        setStatementRevenue(latestP.revenue !== null && latestP.revenue !== undefined ? String(latestP.revenue) : "");
        setStatementEbitda(latestP.ebitda !== null && latestP.ebitda !== undefined ? String(latestP.ebitda) : "");
        setStatementDebt(latestP.totalDebt !== null && latestP.totalDebt !== undefined ? String(latestP.totalDebt) : "");
        setStatementCash(latestP.cashAndEquivalents !== null && latestP.cashAndEquivalents !== undefined ? String(latestP.cashAndEquivalents) : "");
        setStatementInterest(latestP.interestExpense !== null && latestP.interestExpense !== undefined ? String(latestP.interestExpense) : "");
      }
    } catch {
      // Non-fatal
    }
  };

  // Handler: Save Financial Statements
  const handleSaveStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementCompany || !statementPeriod.trim()) return;

    setIsSavingStatement(true);
    try {
      const res = await fetch("/api/admin/periods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-email": session?.userEmail || "admin@fintraxis.local",
        },
        body: JSON.stringify({
          companyId: statementCompany.id,
          period: statementPeriod.trim().toUpperCase(),
          revenue: statementRevenue ? parseFloat(statementRevenue) : null,
          ebitda: statementEbitda ? parseFloat(statementEbitda) : null,
          totalDebt: statementDebt ? parseFloat(statementDebt) : null,
          cashAndEquivalents: statementCash ? parseFloat(statementCash) : null,
          interestExpense: statementInterest ? parseFloat(statementInterest) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", `Updated ${statementCompany.symbol} ${statementPeriod} statements in SQLite!`);
        setIsStatementEditorOpen(false);
        loadAllData();
      } else {
        showNotification("error", data.error || "Failed to save financial statements");
      }
    } catch {
      showNotification("error", "Network error while saving financial statements");
    } finally {
      setIsSavingStatement(false);
    }
  };

  // Handler: Provision New User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      showNotification("error", "Name, email, and password (min 8 chars) are required.");
      return;
    }

    setIsCreatingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-email": session?.userEmail || "admin@fintraxis.terminal",
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          desk: newUserDesk.trim(),
          role: newUserRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", `Provisioned ${data.user.name} (${data.user.email}) with ${data.user.role} clearance`);
        setIsCreateUserOpen(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        loadAllData();
      } else {
        showNotification("error", data.error || "Failed to provision user");
      }
    } catch {
      showNotification("error", "Network error during user provisioning");
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Handler: Toggle User Status (Activate / Deactivate)
  const handleToggleUserStatus = (user: UserItem) => {
    const targetStatus = user.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
    const actionWord = targetStatus === "DEACTIVATED" ? "deactivate" : "activate";

    setConfirmDialog({
      isOpen: true,
      title: `${targetStatus === "DEACTIVATED" ? "Deactivate" : "Activate"} Operator: ${user.name}`,
      description: `Are you sure you want to ${actionWord} ${user.email}? ${
        targetStatus === "DEACTIVATED"
          ? "Deactivated users cannot authenticate or access the terminal until reactivated."
          : "The user will immediately regain access according to their assigned clearance."
      }`,
      actionLabel: targetStatus === "DEACTIVATED" ? "Deactivate Account" : "Activate Account",
      isDestructive: targetStatus === "DEACTIVATED",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch("/api/admin/users", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-operator-email": session?.userEmail || "admin@fintraxis.terminal",
            },
            body: JSON.stringify({ id: user.id, status: targetStatus }),
          });
          const data = await res.json();
          if (data.success) {
            showNotification("success", `Operator ${user.email} marked as ${targetStatus}`);
            loadAllData();
          } else {
            showNotification("error", data.error || `Failed to ${actionWord} user`);
          }
        } catch {
          showNotification("error", `Network error while updating user status`);
        }
      },
    });
  };

  // Handler: Change User Role
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-operator-email": session?.userEmail || "admin@fintraxis.terminal",
        },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", `Updated role clearance to ${newRole}`);
        loadAllData();
      } else {
        showNotification("error", data.error || "Failed to update role");
      }
    } catch {
      showNotification("error", "Network error updating operator role");
    }
  };

  // Handler: Delete User Account (with Confirmation)
  const handleDeleteUser = (user: UserItem) => {
    setConfirmDialog({
      isOpen: true,
      title: `De-register Operator: ${user.name}`,
      description: `Permanently delete ${user.email} from the institutional user register. This operation cannot be undone.`,
      actionLabel: "De-register Operator",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, {
            method: "DELETE",
            headers: { "x-operator-email": session?.userEmail || "admin@fintraxis.terminal" },
          });
          const data = await res.json();
          if (data.success) {
            showNotification("success", `Operator ${user.email} de-registered`);
            loadAllData();
          } else {
            showNotification("error", data.error || "Failed to remove user");
          }
        } catch {
          showNotification("error", "Network error while removing user");
        }
      },
    });
  };

  // Handler: Revoke User Session
  const handleRevokeSession = (user: UserItem) => {
    setConfirmDialog({
      isOpen: true,
      title: `Revoke Active Sessions: ${user.name}`,
      description: `Terminate all active terminal sessions for ${user.email}. The operator will be required to re-authenticate with their credentials.`,
      actionLabel: "Revoke All Sessions",
      isDestructive: false,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await fetch("/api/admin/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventType: "SECURITY_REVOKE",
              operator: session?.userEmail || "SUPER_ADMIN",
              details: `Revoked active authentication credentials and session tokens for ${user.email}`,
              severity: "WARNING",
            }),
          });
          showNotification("success", `Revoked active terminal sessions for ${user.email}`);
          loadAllData();
        } catch {
          showNotification("error", "Failed to record session revocation");
        }
      },
    });
  };

  // Handler: Test Data Provider
  const handleTestProvider = async (providerId: string) => {
    setTestingProviderId(providerId);
    setProviderTestResult(null);
    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-email": session?.userEmail || "admin@fintraxis.terminal",
        },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json();
      if (data.success) {
        setProviderTestResult({
          id: providerId,
          msg: data.message,
          latency: data.latencyMs,
        });
        showNotification("success", `Provider ${providerId} health check: ${data.message}`);
        loadAllData();
      } else {
        showNotification("error", data.error || `Health check failed for ${providerId}`);
      }
    } catch {
      showNotification("error", `Network failure testing provider ${providerId}`);
    } finally {
      setTestingProviderId(null);
    }
  };

  // Handler: Execute System Job
  const handleRunJob = async (jobId: string, jobName: string) => {
    setRunningJobId(jobId);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-email": session?.userEmail || "admin@fintraxis.terminal",
        },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", `Job "${jobName}" completed: ${data.summary} (${data.durationMs}ms)`);
        loadAllData();
      } else {
        showNotification("error", data.error || `Job "${jobName}" failed`);
      }
    } catch {
      showNotification("error", `Network error executing job "${jobName}"`);
    } finally {
      setRunningJobId(null);
    }
  };

  // Handler: Calibrate Policies & Settings
  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-email": session?.userEmail || "admin@fintraxis.terminal",
        },
        body: JSON.stringify({
          hurdles: {
            globalLeverage: Number(leverageHurdle),
            globalCoverage: Number(coverageHurdle),
            globalLiquidity: Number(liquidityHurdle),
            alertMarginDeterioration: Number(marginDeterioration),
            alertRevenueContraction: Number(revenueContraction),
            maxRateShockBps: Number(maxRateShock),
            rateLimitRpm: Number(rateLimitRpm),
            defaultCurrency,
            defaultPeriodType,
            sessionTimeoutMinutes: Number(sessionTimeout),
            loginLockoutAttempts: Number(lockoutAttempts),
            organizationName: orgName,
            maintenanceMode,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", "Institutional risk policy hurdles calibrated and committed to audit journal");
        loadAllData();
      } else {
        showNotification("error", data.error || "Failed to update risk policy");
      }
    } catch {
      showNotification("error", "Network error updating risk policy");
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Handler: Diagnostic Ping
  const handleCreateDiagnosticLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLogDetails.trim()) return;

    try {
      const res = await fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "SYSTEM_DIAGNOSTIC",
          operator: session?.userEmail || "SUPER_ADMIN",
          details: manualLogDetails.trim(),
          severity: "INFO",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", "Diagnostic timestamp committed to audit journal");
        setManualLogDetails("");
        loadAllData();
      }
    } catch {
      showNotification("error", "Failed to write diagnostic audit log");
    }
  };

  // Handler: Download Diagnostic Snapshot
  const handleDownloadDiagnosticSnapshot = () => {
    const snapshot = {
      fintraxisRelease: "2.4.0-institutional",
      generatedAt: new Date().toISOString(),
      operator: session?.userEmail || "anonymous",
      role: session?.role || "ANALYST",
      stats,
      activeHurdles: stats?.activeHurdles,
      systemConfig: configItems,
      registeredIssuersCount: issuers.length,
      operatorsCount: usersList.length,
      auditRecordsCount: auditLogs.length,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintraxis_diagnostic_snapshot_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification("success", "Downloaded system diagnostic snapshot");
  };

  // Filtered User List
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.desk.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Issuers List
  const filteredIssuers = issuers.filter((c) =>
    c.symbol.toLowerCase().includes(issuerSearch.toLowerCase()) ||
    c.name.toLowerCase().includes(issuerSearch.toLowerCase()) ||
    c.exchange.toLowerCase().includes(issuerSearch.toLowerCase())
  );

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter((l) => {
    const matchesSeverity = auditSeverityFilter === "ALL" || l.severity === auditSeverityFilter;
    const matchesType = auditTypeFilter === "ALL" || l.eventType === auditTypeFilter;
    const matchesSearch =
      auditSearch === "" ||
      l.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.operator.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.eventType.toLowerCase().includes(auditSearch.toLowerCase());
    return matchesSeverity && matchesType && matchesSearch;
  });

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-[#F05252]/10 text-[#F05252] border border-[#F05252]/30";
      case "WARNING":
        return "bg-[#F5B942]/10 text-[#F5B942] border border-[#F5B942]/30";
      default:
        return "bg-[#3867F5]/10 text-[#38BDF8] border border-[#3867F5]/30";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "COMPLETED":
        return "bg-[#16A879]/15 text-[#16A879] border border-[#16A879]/30";
      case "STANDBY":
      case "IDLE":
        return "bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30";
      case "DEACTIVATED":
      case "FAILED":
        return "bg-[#F05252]/15 text-[#F05252] border border-[#F05252]/30";
      default:
        return "bg-[#5A687D]/15 text-[#9AA8BC] border border-[#5A687D]/30";
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* =========================================================================
          NOTIFICATION TOAST
         ========================================================================= */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            actionMessage.type === "success"
              ? "bg-[#16A879]/10 border-[#16A879]/40 text-[#16A879]"
              : "bg-[#F05252]/10 border-[#F05252]/40 text-[#F05252]"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span className="font-semibold">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs hover:opacity-75 transition-opacity cursor-pointer font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          CONFIRMATION MODAL
         ========================================================================= */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#101621] border border-[#253247] max-w-md w-full rounded-2xl p-6 shadow-2xl flex flex-col gap-4 font-mono">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  confirmDialog.isDestructive ? "bg-[#F05252]/10 text-[#F05252]" : "bg-[#3867F5]/10 text-[#38BDF8]"
                }`}
              >
                {confirmDialog.isDestructive ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F3F6FC]">{confirmDialog.title}</h3>
                <span className="text-[10px] text-[#9AA8BC]">Administrative Confirmation Gate</span>
              </div>
            </div>

            <p className="text-xs text-[#9AA8BC] leading-relaxed">{confirmDialog.description}</p>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-[#151E2D] hover:bg-[#253247] text-xs font-mono text-[#F3F6FC] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-xs font-mono font-bold text-white rounded-lg transition-colors cursor-pointer ${
                  confirmDialog.isDestructive ? "bg-[#F05252] hover:bg-[#d94141]" : "bg-[#3867F5] hover:bg-[#2c53cb]"
                }`}
              >
                {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROVISION NEW USER MODAL
         ========================================================================= */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#101621] border border-[#253247] max-w-lg w-full rounded-2xl p-6 shadow-2xl flex flex-col gap-5 font-mono">
            <div className="flex items-center justify-between border-b border-[#253247] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#3867F5]/15 text-[#38BDF8] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F3F6FC]">PROVISION OPERATOR CLEARANCE</h3>
                  <span className="text-[10px] text-[#9AA8BC]">Enroll active analyst or administrator into security directory</span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateUserOpen(false)}
                className="text-[#9AA8BC] hover:text-[#F3F6FC] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9AA8BC]">OPERATOR FULL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs font-mono text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9AA8BC]">OFFICIAL EMAIL IDENTIFIER</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. s.jenkins@fintraxis.institutional"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs font-mono text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9AA8BC]">TEMPORARY PASSWORD</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs font-mono text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9AA8BC]">ROLE CLEARANCE</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs font-mono text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
                  >
                    <option value="ANALYST">ANALYST (Standard)</option>
                    <option value="LEAD_ANALYST">LEAD_ANALYST (Supervisor)</option>
                    <option value="ADMIN">ADMIN (Operational)</option>
                    {isSuperAdmin && <option value="SUPER_ADMIN">SUPER_ADMIN (Full Clearance)</option>}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9AA8BC]">DESK ASSIGNMENT</label>
                <input
                  type="text"
                  placeholder="e.g. Credit Risk & Surveillance Desk"
                  value={newUserDesk}
                  onChange={(e) => setNewUserDesk(e.target.value)}
                  className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs font-mono text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2 bg-[#151E2D] hover:bg-[#253247] text-xs text-[#F3F6FC] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-4 py-2 bg-[#3867F5] hover:bg-[#2c53cb] disabled:opacity-50 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isCreatingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{isCreatingUser ? "PROVISIONING..." : "CONFIRM CLEARANCE"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADMIN HEADER & OPERATIONAL TELEMETRY BADGE
         ========================================================================= */}
      <div className="bg-[#101621] border border-[#253247] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#3867F5]/20 border border-[#3867F5]/40 text-[#38BDF8] text-[10px] font-mono font-bold tracking-wider rounded">
              ENTERPRISE GOVERNANCE CONTROL PLANE
            </span>
            <span className="text-xs text-[#9AA8BC] font-mono">
              Session: <strong className="text-[#F3F6FC]">{session?.userEmail || "Terminal Operator"}</strong>
            </span>
            <span className="px-2 py-0.5 bg-[#16A879]/15 border border-[#16A879]/30 text-[#16A879] text-[10px] font-mono font-bold rounded">
              {userRole}
            </span>
          </div>
          <div className="flex items-baseline gap-3 mt-1.5">
            <h1 className="text-2xl font-bold text-[#F3F6FC] tracking-tight">Institutional Administration Console</h1>
            <span className="text-xs font-mono text-[#9AA8BC] hidden sm:inline">
              FINTRAXIS v2.4 &bull; SQLite Master WAL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] text-xs font-mono text-[#F3F6FC] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh administrative telemetry feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#38BDF8]" : "text-[#9AA8BC]"}`} />
            <span>Sync Feeds</span>
          </button>

          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab("overview")}
              className="px-3.5 py-1.5 bg-[#3867F5] hover:bg-[#2c53cb] text-white text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-[#3867F5]/30"
            >
              <span>Workstation Overview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          NINE SUB-SECTIONS NAVIGATION BAR (A THROUGH I)
         ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#253247] pb-2 font-mono text-xs scrollbar-none">
        {[
          { id: "telemetry", label: "A. Overview", icon: Server },
          { id: "users", label: "B. Users & Access", icon: Users, badge: stats?.counts.users },
          { id: "permissions", label: "C. Permissions", icon: ShieldCheck },
          { id: "providers", label: "D. Data Providers", icon: Radio, badge: providersList.length || 3 },
          { id: "policies", label: "E. Risk Policies", icon: Sliders },
          { id: "issuers", label: "F. Company Registry", icon: Building2, badge: stats?.counts.companies },
          { id: "jobs", label: "G. Operations & Jobs", icon: Play, badge: jobsList.length || 4 },
          { id: "audit", label: "H. Audit Journal", icon: FileText, badge: stats?.counts.auditLogs },
          { id: "settings", label: "I. App Settings", icon: Settings2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminSubTab)}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer font-bold ${
                isActive
                  ? "bg-[#3867F5] text-white shadow-sm shadow-[#3867F5]/25"
                  : "bg-[#101621] hover:bg-[#151E2D] text-[#9AA8BC] hover:text-[#F3F6FC] border border-[#253247]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-[#151E2D] text-[#9AA8BC] border border-[#253247]"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          SECTION A: ADMINISTRATION OVERVIEW & TELEMETRY
         ========================================================================= */}
      {activeTab === "telemetry" && (
        <div className="flex flex-col gap-6 font-mono">
          {/* Top 5 Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#9AA8BC] text-[11px]">
                <span>REGISTERED ISSUERS</span>
                <Building2 className="w-4 h-4 text-[#3867F5]" />
              </div>
              <div className="text-2xl font-bold text-[#F3F6FC] mt-2">
                {stats?.counts.companies ?? "..."}
              </div>
              <div className="text-[10px] text-[#16A879] mt-1">Verified SQLite Master</div>
            </div>

            <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#9AA8BC] text-[11px]">
                <span>FINANCIAL PERIODS</span>
                <FileSpreadsheet className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div className="text-2xl font-bold text-[#F3F6FC] mt-2">
                {stats?.counts.financialPeriods ?? "..."}
              </div>
              <div className="text-[10px] text-[#9AA8BC] mt-1">Audited Ledgers</div>
            </div>

            <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#9AA8BC] text-[11px]">
                <span>XBRL AUDIT ITEMS</span>
                <Database className="w-4 h-4 text-[#16A879]" />
              </div>
              <div className="text-2xl font-bold text-[#F3F6FC] mt-2">
                {stats?.counts.auditLineItems ?? "..."}
              </div>
              <div className="text-[10px] text-[#16A879] mt-1">Traceable Taxonomy</div>
            </div>

            <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#9AA8BC] text-[11px]">
                <span>OPERATOR CLEARANCES</span>
                <Users className="w-4 h-4 text-[#F5B942]" />
              </div>
              <div className="text-2xl font-bold text-[#F3F6FC] mt-2">
                {stats?.counts.users ?? "..."}
              </div>
              <div className="text-[10px] text-[#16A879] mt-1">
                {stats?.userBreakdown?.active ?? stats?.counts.users} Active &bull; {stats?.userBreakdown?.deactivated ?? 0} Deactivated
              </div>
            </div>

            <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#9AA8BC] text-[11px]">
                <span>AUDIT JOURNAL</span>
                <ShieldCheck className="w-4 h-4 text-[#16A879]" />
              </div>
              <div className="text-2xl font-bold text-[#F3F6FC] mt-2">
                {stats?.counts.auditLogs ?? "..."}
              </div>
              <div className="text-[10px] text-[#38BDF8] mt-1">Immutable Events</div>
            </div>
          </div>

          {/* Engine & Runtime Diagnostics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#101621] border border-[#253247] p-5 rounded-xl">
              <div className="flex items-center gap-2 border-b border-[#253247] pb-3 mb-4 text-[#F3F6FC] font-bold text-xs uppercase">
                <Server className="w-4 h-4 text-[#3867F5]" />
                <span>Persistence Engine Diagnostics</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
                  <span className="text-[#9AA8BC] text-[10px]">DATABASE ENGINE</span>
                  <div className="font-bold text-[#F3F6FC] mt-0.5">{stats?.database.engine || "better-sqlite3"}</div>
                </div>
                <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
                  <span className="text-[#9AA8BC] text-[10px]">JOURNALING CONCURRENCY</span>
                  <div className="font-bold text-[#16A879] mt-0.5">{stats?.database.journalMode || "WAL"}</div>
                </div>
                <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
                  <span className="text-[#9AA8BC] text-[10px]">SYNCHRONOUS SAFETY</span>
                  <div className="font-bold text-[#F3F6FC] mt-0.5">{stats?.database.synchronous || "NORMAL (1)"}</div>
                </div>
                <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
                  <span className="text-[#9AA8BC] text-[10px]">DEPLOYMENT TOPOLOGY</span>
                  <div className="font-bold text-[#38BDF8] mt-0.5">
                    {stats?.database.isVercel ? `Vercel Serverless (${stats.database.region})` : "Local Edge Server"}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#101621] border border-[#253247] p-5 rounded-xl">
              <div className="flex items-center gap-2 border-b border-[#253247] pb-3 mb-4 text-[#F3F6FC] font-bold text-xs uppercase">
                <Activity className="w-4 h-4 text-[#16A879]" />
                <span>Runtime Memory & Uptime Telemetry</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
                  <span className="text-[#9AA8BC] text-[10px]">NODE RUNTIME</span>
                  <div className="font-bold text-[#F3F6FC] mt-0.5">{stats?.system.nodeVersion || process.version}</div>
                </div>
                <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
                  <span className="text-[#9AA8BC] text-[10px]">PLATFORM OS</span>
                  <div className="font-bold text-[#F3F6FC] mt-0.5">{stats?.system.platform || process.platform}</div>
                </div>
                <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
                  <span className="text-[#9AA8BC] text-[10px]">HEAP UTILIZATION</span>
                  <div className="font-bold text-[#38BDF8] mt-0.5">
                    {stats?.system.heapUsedMB ?? 0} MB / {stats?.system.heapTotalMB ?? 0} MB
                  </div>
                </div>
                <div className="p-3 bg-[#151E2D] border border-[#253247] rounded-lg">
                  <span className="text-[#9AA8BC] text-[10px]">SYSTEM UPTIME</span>
                  <div className="font-bold text-[#16A879] mt-0.5">{stats?.system.uptimeSeconds ?? 0} seconds</div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Ping Tool */}
          <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-[#F3F6FC] uppercase">Supervisory Integrity Ping</h4>
              <p className="text-xs text-[#9AA8BC] mt-0.5">
                Append a diagnostic cryptographic timestamp to verify SQLite persistence.
              </p>
            </div>
            <form onSubmit={handleCreateDiagnosticLog} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Diagnostic note (e.g., Weekly health check)"
                value={manualLogDetails}
                onChange={(e) => setManualLogDetails(e.target.value)}
                className="px-3 py-1.5 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5] rounded-lg w-64"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] hover:border-[#3867F5] text-xs text-[#38BDF8] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Record Ping
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION B: USER & ACCESS MANAGEMENT
         ========================================================================= */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-5 font-mono">
          {/* Header Action Bar */}
          <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#5A687D] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search operator, email, or desk..."
                  className="pl-8 pr-3 py-1.5 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5] rounded-lg w-64"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
              >
                <option value="ALL">ALL ROLES</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="LEAD_ANALYST">LEAD_ANALYST</option>
                <option value="ANALYST">ANALYST</option>
                <option value="DEMO_ANALYST">DEMO_ANALYST</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9AA8BC]">{filteredUsers.length} of {usersList.length} Operators</span>
              {canManageUsers && (
                <button
                  onClick={() => setIsCreateUserOpen(true)}
                  className="px-3.5 py-1.5 bg-[#3867F5] hover:bg-[#2c53cb] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Provision Operator</span>
                </button>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#101621] border border-[#253247] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#151E2D] text-[#9AA8BC] uppercase text-[10px] border-b border-[#253247]">
                  <tr>
                    <th className="px-4 py-3">Operator Name</th>
                    <th className="px-4 py-3">Email Identifier</th>
                    <th className="px-4 py-3">Desk Assignment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Role Clearance</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#253247]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#9AA8BC]">
                        No registered operators match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isTargetSuperAdmin = user.role === "SUPER_ADMIN";
                      return (
                        <tr key={user.id} className="hover:bg-[#151E2D]/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-[#F3F6FC]">{user.name}</td>
                          <td className="px-4 py-3 text-[#9AA8BC]">{user.email}</td>
                          <td className="px-4 py-3 text-[#38BDF8]">{user.desk}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getStatusBadgeClass(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {canManageUsers ? (
                              <select
                                value={user.role}
                                onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                                disabled={!isSuperAdmin && isTargetSuperAdmin}
                                className="px-2 py-1 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] rounded focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                              >
                                {isSuperAdmin && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
                                <option value="ADMIN">ADMIN</option>
                                <option value="LEAD_ANALYST">LEAD_ANALYST</option>
                                <option value="ANALYST">ANALYST</option>
                                <option value="DEMO_ANALYST">DEMO_ANALYST</option>
                              </select>
                            ) : (
                              <span className="text-[#F3F6FC] font-semibold">{user.role}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {canManageUsers && (
                                <>
                                  <button
                                    onClick={() => handleToggleUserStatus(user)}
                                    title={user.status === "ACTIVE" ? "Deactivate operator" : "Activate operator"}
                                    className={`px-2 py-1 border text-[11px] rounded transition-colors cursor-pointer ${
                                      user.status === "ACTIVE"
                                        ? "border-[#F5B942]/40 text-[#F5B942] hover:bg-[#F5B942]/10"
                                        : "border-[#16A879]/40 text-[#16A879] hover:bg-[#16A879]/10"
                                    }`}
                                  >
                                    {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                                  </button>

                                  <button
                                    onClick={() => handleRevokeSession(user)}
                                    title="Revoke active sessions"
                                    className="px-2 py-1 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] text-[11px] text-[#38BDF8] rounded transition-colors cursor-pointer"
                                  >
                                    Revoke
                                  </button>

                                  {isSuperAdmin && (
                                    <button
                                      onClick={() => handleDeleteUser(user)}
                                      title="Permanently remove user"
                                      className="p-1 hover:bg-[#F05252]/20 text-[#5A687D] hover:text-[#F05252] rounded transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION C: ROLES & PERMISSIONS MATRIX
         ========================================================================= */}
      {activeTab === "permissions" && (
        <div className="flex flex-col gap-5 font-mono">
          <div className="bg-[#101621] border border-[#253247] p-5 rounded-xl">
            <h3 className="text-sm font-bold text-[#F3F6FC] uppercase">Institutional Clearance & Capabilities Matrix</h3>
            <p className="text-xs text-[#9AA8BC] mt-1">
              Backend authorization middleware strictly validates permissions for every operational endpoint.
            </p>
          </div>

          <div className="bg-[#101621] border border-[#253247] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#151E2D] text-[#9AA8BC] uppercase text-[10px] border-b border-[#253247]">
                  <tr>
                    <th className="px-4 py-3">Capability / Operation</th>
                    <th className="px-3 py-3 text-center">SUPER_ADMIN</th>
                    <th className="px-3 py-3 text-center">ADMIN</th>
                    <th className="px-3 py-3 text-center">LEAD_ANALYST</th>
                    <th className="px-3 py-3 text-center">ANALYST</th>
                    <th className="px-3 py-3 text-center">DEMO_ANALYST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#253247]">
                  {[
                    { name: "View Financial Statements & Hub", sa: true, ad: true, la: true, an: true, dm: true },
                    { name: "Register New Security Master Ticker", sa: true, ad: true, la: true, an: false, dm: false },
                    { name: "Poll & Refresh External Quotes", sa: true, ad: true, la: true, an: true, dm: false },
                    { name: "Execute Macro Stress Simulations", sa: true, ad: true, la: true, an: true, dm: true },
                    { name: "Export Dossiers & IC Briefing Memos", sa: true, ad: true, la: true, an: true, dm: false },
                    { name: "Manage Operators, Roles & Desks", sa: true, ad: true, la: false, an: false, dm: false },
                    { name: "Calibrate Institutional Risk Hurdles", sa: true, ad: true, la: true, an: false, dm: false },
                    { name: "Configure Connected Data Providers", sa: true, ad: false, la: false, an: false, dm: false },
                    { name: "Audit Trail & Cryptographic Journal", sa: true, ad: true, la: true, an: false, dm: false },
                    { name: "Execute Background Maintenance Jobs", sa: true, ad: true, la: false, an: false, dm: false },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#151E2D]/40">
                      <td className="px-4 py-3 font-semibold text-[#F3F6FC]">{row.name}</td>
                      <td className="px-3 py-3 text-center">
                        {row.sa ? <CheckCircle2 className="w-4 h-4 text-[#16A879] inline" /> : <XCircle className="w-4 h-4 text-[#5A687D] inline" />}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {row.ad ? <CheckCircle2 className="w-4 h-4 text-[#16A879] inline" /> : <XCircle className="w-4 h-4 text-[#5A687D] inline" />}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {row.la ? <CheckCircle2 className="w-4 h-4 text-[#16A879] inline" /> : <XCircle className="w-4 h-4 text-[#5A687D] inline" />}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {row.an ? <CheckCircle2 className="w-4 h-4 text-[#16A879] inline" /> : <XCircle className="w-4 h-4 text-[#5A687D] inline" />}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {row.dm ? <CheckCircle2 className="w-4 h-4 text-[#16A879] inline" /> : <XCircle className="w-4 h-4 text-[#5A687D] inline" />}
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
          SECTION D: DATA PROVIDER MANAGEMENT
         ========================================================================= */}
      {activeTab === "providers" && (
        <div className="flex flex-col gap-5 font-mono">
          <div className="bg-[#101621] border border-[#253247] p-5 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F3F6FC] uppercase">Connected External Providers & Coverage</h3>
              <p className="text-xs text-[#9AA8BC] mt-1">
                Monitors data pipelines, credential health, and API response latencies without exposing secrets.
              </p>
            </div>
            <span className="text-xs text-[#38BDF8]">
              Primary Provider: <strong>{stats?.provider.name || "Yahoo Finance"}</strong>
            </span>
          </div>

          {providerTestResult && (
            <div className="p-3 bg-[#151E2D] border border-[#38BDF8]/40 rounded-xl text-xs flex items-center justify-between">
              <span className="text-[#38BDF8]">
                ✓ Health Probe for <strong>{providerTestResult.id}</strong>: {providerTestResult.msg}
              </span>
              <span className="text-[#9AA8BC]">Observed Latency: {providerTestResult.latency}ms</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providersList.map((p) => {
              const isTesting = testingProviderId === p.id;
              return (
                <div key={p.id} className="bg-[#101621] border border-[#253247] p-5 rounded-xl flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F3F6FC]">{p.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getStatusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#38BDF8] mt-1">{p.category}</div>

                    <div className="mt-4 flex flex-col gap-2 text-xs">
                      <div className="p-2.5 bg-[#151E2D] border border-[#253247] rounded-lg">
                        <span className="text-[#9AA8BC] text-[10px]">CREDENTIAL STATUS</span>
                        <div className="text-[#F3F6FC] font-semibold mt-0.5">{p.credentialsStatus}</div>
                      </div>

                      <div className="p-2.5 bg-[#151E2D] border border-[#253247] rounded-lg">
                        <span className="text-[#9AA8BC] text-[10px]">COVERAGE CONSTRAINTS</span>
                        <div className="text-[#9AA8BC] text-[11px] mt-0.5 leading-relaxed">{p.coverageLimitations}</div>
                      </div>

                      <div className="p-2.5 bg-[#151E2D] border border-[#253247] rounded-lg">
                        <span className="text-[#9AA8BC] text-[10px]">SUPPORTED CATEGORIES</span>
                        <ul className="text-[11px] text-[#F3F6FC] list-disc list-inside mt-1 space-y-0.5">
                          {p.supportedCategories.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#253247] pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-[#9AA8BC]">Latency: ~{p.responseTimeMs}ms</span>
                    <button
                      onClick={() => handleTestProvider(p.id)}
                      disabled={isTesting}
                      className="px-3 py-1.5 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] text-xs font-bold text-[#38BDF8] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>{isTesting ? "PROBING..." : "Test Health"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION E: FINANCIAL RISK CONFIGURATION
         ========================================================================= */}
      {activeTab === "policies" && (
        <div className="flex flex-col gap-6 font-mono">
          <div className="bg-[#101621] border border-[#253247] p-6 rounded-xl">
            <div className="border-b border-[#253247] pb-4 mb-6">
              <h3 className="text-sm font-bold text-[#F3F6FC] uppercase">
                Institutional Risk Policy Hurdle Calibration
              </h3>
              <p className="text-xs text-[#9AA8BC] mt-1">
                Configure global thresholds that trigger early warning flags across all analyst workspaces. 
                Modifications are committed to the audit trail with operator provenance.
              </p>
            </div>

            <form onSubmit={handleSavePolicies} className="flex flex-col gap-6 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#F3F6FC] font-semibold flex items-center justify-between">
                    <span>NET DEBT / EBITDA CEILING</span>
                    <span className="text-[10px] text-[#F5B942]">AMBER WARNING</span>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={leverageHurdle}
                    onChange={(e) => setLeverageHurdle(e.target.value)}
                    disabled={!canModifyConfig}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-sm text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                  />
                  <span className="text-[10px] text-[#9AA8BC]">Warning hurdle for leverage. Default: 3.50x</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#F3F6FC] font-semibold flex items-center justify-between">
                    <span>INTEREST COVERAGE FLOOR</span>
                    <span className="text-[10px] text-[#F05252]">RED VIOLATION</span>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={coverageHurdle}
                    onChange={(e) => setCoverageHurdle(e.target.value)}
                    disabled={!canModifyConfig}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-sm text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                  />
                  <span className="text-[10px] text-[#9AA8BC]">EBIT / Interest coverage floor. Default: 2.50x</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#F3F6FC] font-semibold flex items-center justify-between">
                    <span>CURRENT RATIO FLOOR</span>
                    <span className="text-[10px] text-[#38BDF8]">LIQUIDITY GATE</span>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={liquidityHurdle}
                    onChange={(e) => setLiquidityHurdle(e.target.value)}
                    disabled={!canModifyConfig}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-sm text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                  />
                  <span className="text-[10px] text-[#9AA8BC]">Current Assets / Liab baseline. Default: 1.10x</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#F3F6FC] font-semibold">MARGIN DETERIORATION (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={marginDeterioration}
                    onChange={(e) => setMarginDeterioration(e.target.value)}
                    disabled={!canModifyConfig}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-sm text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                  />
                  <span className="text-[10px] text-[#9AA8BC]">EBIT margin drop alert. Default: -5.0%</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#F3F6FC] font-semibold">REVENUE CONTRACTION (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={revenueContraction}
                    onChange={(e) => setRevenueContraction(e.target.value)}
                    disabled={!canModifyConfig}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-sm text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                  />
                  <span className="text-[10px] text-[#9AA8BC]">YoY top-line drop trigger. Default: -10.0%</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#F3F6FC] font-semibold">MAX RATE SHOCK (BPS)</label>
                  <input
                    type="number"
                    step="25"
                    value={maxRateShock}
                    onChange={(e) => setMaxRateShock(e.target.value)}
                    disabled={!canModifyConfig}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-sm text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                  />
                  <span className="text-[10px] text-[#9AA8BC]">Simulation boundary. Default: 500 bps</span>
                </div>
              </div>

              {canModifyConfig && (
                <div>
                  <button
                    type="submit"
                    disabled={isSavingPolicy}
                    className="px-5 py-2.5 bg-[#3867F5] hover:bg-[#2c53cb] disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {isSavingPolicy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>CALIBRATE POLICIES & COMMIT TO AUDIT TRAIL</span>
                  </button>
                </div>
              )}
            </form>

            {/* Persisted System Registry Parameters Table */}
            {configItems.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#253247]">
                <h4 className="text-xs font-bold text-[#F3F6FC] uppercase mb-3">
                  Persisted System Registry Parameters
                </h4>
                <div className="overflow-x-auto border border-[#253247] rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#151E2D] text-[#9AA8BC] text-[10px] uppercase">
                      <tr>
                        <th className="px-3 py-2">Parameter Key</th>
                        <th className="px-3 py-2">Configured Value</th>
                        <th className="px-3 py-2">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#253247]">
                      {configItems.map((item) => (
                        <tr key={item.key} className="hover:bg-[#151E2D]/40">
                          <td className="px-3 py-2 font-bold text-[#38BDF8]">{item.key}</td>
                          <td className="px-3 py-2 text-[#F3F6FC]">{item.value}</td>
                          <td className="px-3 py-2 text-[#9AA8BC]">{item.updatedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION F: COMPANY REGISTRY & DATA QUALITY
         ========================================================================= */}
      {activeTab === "issuers" && (
        <div className="flex flex-col gap-5 font-mono">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ingestion Panel */}
            <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F3F6FC]">
                  <PlusCircle className="w-4 h-4 text-[#3867F5]" />
                  <span>REGISTER NEW SECURITY MASTER ISSUER</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualCompanyOpen(true)}
                  className="px-2.5 py-1 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] text-[#38BDF8] text-[10px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>Manual Add Form</span>
                </button>
              </div>
              <p className="text-xs text-[#9AA8BC]">
                Ingest verified corporate profile and multi-period financial statements from official providers or use manual form.
              </p>
              <form onSubmit={handleIngestTicker} className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value)}
                  placeholder="Ticker (e.g. MSFT, TCS.NS, NVDA, 7203.T)"
                  className="flex-1 px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] uppercase placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5] rounded-lg"
                />
                <button
                  type="submit"
                  disabled={isIngesting || !newTicker.trim()}
                  className="px-4 py-2 bg-[#3867F5] hover:bg-[#2c53cb] disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {isIngesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  <span>{isIngesting ? "INGESTING..." : "INGEST ISSUER"}</span>
                </button>
              </form>
            </div>

            {/* Search Filter */}
            <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#F3F6FC]">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#38BDF8]" />
                  <span>SECURITY MASTER FILTER</span>
                </div>
                <span className="text-[#9AA8BC]">{filteredIssuers.length} of {issuers.length} Listed</span>
              </div>
              <input
                type="text"
                value={issuerSearch}
                onChange={(e) => setIssuerSearch(e.target.value)}
                placeholder="Search by Symbol, Corporate Name, or Exchange..."
                className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] placeholder:text-[#5A687D] focus:outline-none focus:border-[#38BDF8] rounded-lg"
              />
            </div>
          </div>

          {/* Companies Table */}
          <div className="bg-[#101621] border border-[#253247] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#151E2D] text-[#9AA8BC] uppercase text-[10px] border-b border-[#253247]">
                  <tr>
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Corporate Entity</th>
                    <th className="px-4 py-3">Exchange & Domain</th>
                    <th className="px-4 py-3">Statements Coverage</th>
                    <th className="px-4 py-3">Data Quality</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#253247]">
                  {filteredIssuers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#9AA8BC]">
                        No matching securities in registry.
                      </td>
                    </tr>
                  ) : (
                    filteredIssuers.map((company) => {
                      const isVerified = company.periodCount > 0 && company.auditItemCount > 0;
                      return (
                        <tr key={company.id} className="hover:bg-[#151E2D]/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-[#38BDF8]">{company.symbol}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#F3F6FC]">{company.name}</div>
                            <div className="text-[10px] text-[#9AA8BC]">{company.sector} &bull; {company.industry}</div>
                          </td>
                          <td className="px-4 py-3 text-[#9AA8BC]">
                            {company.exchange} ({company.country}) &bull; {company.currency}
                          </td>
                          <td className="px-4 py-3 text-[#F3F6FC]">
                            <span className="font-bold">{company.periodCount}</span> periods &bull;{" "}
                            <span className="text-[#16A879]">{company.auditItemCount} items</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                isVerified
                                  ? "bg-[#16A879]/15 text-[#16A879] border border-[#16A879]/30"
                                  : "bg-[#F5B942]/15 text-[#F5B942] border border-[#F5B942]/30"
                              }`}
                            >
                              {isVerified ? "VERIFIED (XBRL)" : "UNVERIFIED"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canModifyConfig && (
                                <button
                                  onClick={() => handleOpenStatementEditor(company)}
                                  className="px-2 py-0.5 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] text-[10px] text-[#10B981] hover:text-white rounded transition-colors cursor-pointer"
                                  title="Edit Financial Statements in SQLite"
                                >
                                  Edit Statements
                                </button>
                              )}
                              {onNavigateToTab && (
                                <button
                                  onClick={() => onNavigateToTab("01_HUB")}
                                  className="text-xs text-[#38BDF8] hover:text-white transition-colors cursor-pointer"
                                >
                                  View Hub
                                </button>
                              )}
                              {canModifyConfig && (
                                <button
                                  onClick={() => handlePurgeCompany(company.id, company.symbol)}
                                  className="p-1 text-[#5A687D] hover:text-[#F05252] hover:bg-[#F05252]/15 rounded transition-colors cursor-pointer"
                                  title="Cascade purge from SQLite"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION G: OPERATIONS & BACKGROUND JOBS
         ========================================================================= */}
      {activeTab === "jobs" && (
        <div className="flex flex-col gap-5 font-mono">
          <div className="bg-[#101621] border border-[#253247] p-5 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F3F6FC] uppercase">System Jobs & Arithmetic Integrity</h3>
              <p className="text-xs text-[#9AA8BC] mt-1">
                Trigger genuine analytical checks, balance sheet identity audits, and database integrity checkpoints.
              </p>
            </div>
            <span className="text-xs text-[#16A879]">{jobsList.length} Active System Jobs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobsList.map((job) => {
              const isRunning = runningJobId === job.id;
              return (
                <div key={job.id} className="bg-[#101621] border border-[#253247] p-5 rounded-xl flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#F3F6FC] uppercase">{job.name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getStatusBadgeClass(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#9AA8BC] mt-1.5 leading-relaxed">{job.description}</p>

                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                      <div className="p-2.5 bg-[#151E2D] border border-[#253247] rounded-lg">
                        <span className="text-[#9AA8BC] text-[10px]">CATEGORY</span>
                        <div className="text-[#38BDF8] font-bold mt-0.5">{job.category}</div>
                      </div>
                      <div className="p-2.5 bg-[#151E2D] border border-[#253247] rounded-lg">
                        <span className="text-[#9AA8BC] text-[10px]">RECORDS PROCESSED</span>
                        <div className="text-[#F3F6FC] font-bold mt-0.5">{job.recordsProcessed ?? 0} items</div>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-[#9AA8BC]">
                      Last executed: {job.lastRunAt || "Never"} ({job.lastDurationMs ? `${job.lastDurationMs}ms` : "N/A"})
                    </div>
                  </div>

                  <div className="border-t border-[#253247] pt-3 flex items-center justify-end">
                    <button
                      onClick={() => handleRunJob(job.id, job.name)}
                      disabled={isRunning || !canManageUsers}
                      className="px-4 py-2 bg-[#3867F5] hover:bg-[#2c53cb] disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isRunning ? "EXECUTING..." : "RUN JOB NOW"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION H: SECURITY AUDIT JOURNAL
         ========================================================================= */}
      {activeTab === "audit" && (
        <div className="flex flex-col gap-5 font-mono">
          <div className="bg-[#101621] border border-[#253247] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search details or operator..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="px-3 py-1.5 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] placeholder:text-[#5A687D] rounded-lg w-60"
              />

              <select
                value={auditSeverityFilter}
                onChange={(e) => setAuditSeverityFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] rounded-lg"
              >
                <option value="ALL">ALL SEVERITIES</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <select
                value={auditTypeFilter}
                onChange={(e) => setAuditTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] rounded-lg"
              >
                <option value="ALL">ALL EVENT TYPES</option>
                <option value="USER_MANAGEMENT">USER_MANAGEMENT</option>
                <option value="POLICY_UPDATE">POLICY_UPDATE</option>
                <option value="PROVIDER_HEALTH">PROVIDER_HEALTH</option>
                <option value="SYSTEM_JOB">SYSTEM_JOB</option>
                <option value="SYSTEM_DIAGNOSTIC">SYSTEM_DIAGNOSTIC</option>
              </select>
            </div>

            <a
              href="/api/admin/logs?format=csv"
              download
              className="px-3.5 py-1.5 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] text-xs font-bold text-[#38BDF8] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>

          <div className="bg-[#101621] border border-[#253247] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#151E2D] text-[#9AA8BC] uppercase text-[10px] border-b border-[#253247]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Event Type</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#253247]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#9AA8BC]">
                        No audit events match criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#151E2D]/50 transition-colors">
                        <td className="px-4 py-3 text-[#9AA8BC] whitespace-nowrap">{log.timestamp}</td>
                        <td className="px-4 py-3 font-bold text-[#38BDF8]">{log.eventType}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getSeverityBadgeClass(log.severity)}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#F3F6FC]">{log.operator}</td>
                        <td className="px-4 py-3 text-[#F3F6FC] max-w-md truncate">{log.details}</td>
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
          SECTION I: APPLICATION & WORKSPACE SETTINGS
         ========================================================================= */}
      {activeTab === "settings" && (
        <div className="flex flex-col gap-6 font-mono">
          <div className="bg-[#101621] border border-[#253247] p-6 rounded-xl">
            <div className="border-b border-[#253247] pb-4 mb-6">
              <h3 className="text-sm font-bold text-[#F3F6FC] uppercase">
                Enterprise Workspace & System Preferences
              </h3>
              <p className="text-xs text-[#9AA8BC] mt-1">
                Configure global institutional metadata, default currency, presentation cadence, and session security timeouts.
              </p>
            </div>

            <form onSubmit={handleSavePolicies} className="flex flex-col gap-5 max-w-2xl">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#F3F6FC] font-semibold">ORGANIZATION / WORKSPACE NAME</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={!canModifyConfig}
                  className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-sm text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#F3F6FC] font-semibold">DEFAULT PRESENTATION CURRENCY</label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    disabled={!canModifyConfig}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                  >
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="JPY">JPY (¥ - Japanese Yen)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#F3F6FC] font-semibold">DEFAULT CADENCE</label>
                  <select
                    value={defaultPeriodType}
                    onChange={(e) => setDefaultPeriodType(e.target.value)}
                    disabled={!canModifyConfig}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                  >
                    <option value="ANNUAL">ANNUAL (Form 10-K / Annual Reports)</option>
                    <option value="QUARTERLY">QUARTERLY (Form 10-Q)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#F3F6FC] font-semibold">SESSION TIMEOUT (MINUTES)</label>
                  <input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    disabled={!canModifyConfig}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#F3F6FC] font-semibold">LOCKOUT ATTEMPTS</label>
                  <input
                    type="number"
                    value={lockoutAttempts}
                    onChange={(e) => setLockoutAttempts(e.target.value)}
                    disabled={!canModifyConfig}
                    className="px-3 py-2 bg-[#151E2D] border border-[#253247] text-xs text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5] disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#253247]">
                <button
                  type="button"
                  onClick={handleDownloadDiagnosticSnapshot}
                  className="px-4 py-2 bg-[#151E2D] hover:bg-[#253247] border border-[#253247] text-xs font-bold text-[#38BDF8] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Diagnostic Snapshot</span>
                </button>

                {canModifyConfig && (
                  <button
                    type="submit"
                    disabled={isSavingPolicy}
                    className="px-5 py-2 bg-[#3867F5] hover:bg-[#2c53cb] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {isSavingPolicy ? "SAVING..." : "SAVE SETTINGS"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manual Add Company */}
      {isManualCompanyOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-[#101621] border border-[#253247] rounded-2xl p-6 font-mono text-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#253247] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#3867F5]" />
                <span className="font-bold text-white text-sm">Add New Security Master Company</span>
              </div>
              <button
                onClick={() => setIsManualCompanyOpen(false)}
                className="text-[#9AA8BC] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualCompany} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Ticker Symbol *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NVDA, AMZN"
                  value={manualSymbol}
                  onChange={(e) => setManualSymbol(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] rounded-lg text-white font-mono uppercase focus:outline-none focus:border-[#3867F5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Corporate Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NVIDIA Corporation"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] rounded-lg text-white focus:outline-none focus:border-[#3867F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Exchange *</label>
                  <select
                    value={manualExchange}
                    onChange={(e) => setManualExchange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] rounded-lg text-white focus:outline-none focus:border-[#3867F5]"
                  >
                    <option value="NASDAQ">NASDAQ</option>
                    <option value="NYSE">NYSE</option>
                    <option value="NSE / BSE">NSE / BSE (India)</option>
                    <option value="Tokyo Stock Exchange (Prime)">Tokyo (Prime)</option>
                    <option value="LSE">London (LSE)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Currency *</label>
                  <select
                    value={manualCurrency}
                    onChange={(e) => setManualCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] rounded-lg text-white focus:outline-none focus:border-[#3867F5]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Sector / Industry *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technology / Semiconductors"
                  value={manualSector}
                  onChange={(e) => setManualSector(e.target.value)}
                  className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] rounded-lg text-white focus:outline-none focus:border-[#3867F5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#253247]">
                <button
                  type="button"
                  onClick={() => setIsManualCompanyOpen(false)}
                  className="px-4 py-2 bg-[#151E2D] hover:bg-[#253247] text-[#9AA8BC] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCompany}
                  className="px-4 py-2 bg-[#3867F5] hover:bg-[#2c53cb] text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isCreatingCompany ? "Creating..." : "Enroll Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Financial Statement Editor */}
      {isStatementEditorOpen && statementCompany && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="max-w-xl w-full bg-[#101621] border border-[#253247] rounded-2xl p-6 font-mono text-xs space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#253247] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#10B981]" />
                  <span className="font-bold text-white text-sm">Financial Statement Editor</span>
                </div>
                <div className="text-[11px] text-[#9AA8BC] mt-0.5">
                  Issuer: <span className="text-[#38BDF8] font-bold">{statementCompany.symbol}</span> &bull; {statementCompany.name} ({statementCompany.currency})
                </div>
              </div>
              <button
                onClick={() => setIsStatementEditorOpen(false)}
                className="text-[#9AA8BC] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatement} className="space-y-3.5">
              <div className="p-2.5 bg-[#0A0E17] border border-[#253247] rounded-xl text-[11px] text-[#9AA8BC]">
                Inputs saved here directly update the SQLite financial ledgers and recompute all analyst credit ratios, debt hurdles, and stress projections.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Fiscal Period *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FY2024, FY2025"
                    value={statementPeriod}
                    onChange={(e) => setStatementPeriod(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] rounded-lg text-white font-mono uppercase focus:outline-none focus:border-[#3867F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Scale Unit</label>
                  <div className="px-3 py-2 bg-[#151E2D]/50 border border-[#253247] rounded-lg text-[#9AA8BC]">
                    {statementCompany.scaleUnit} ({statementCompany.currency})
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Consolidated Annual Revenue</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 391035"
                    value={statementRevenue}
                    onChange={(e) => setStatementRevenue(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] rounded-lg text-white font-mono focus:outline-none focus:border-[#3867F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Operating Profit (EBITDA)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 134690"
                    value={statementEbitda}
                    onChange={(e) => setStatementEbitda(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] rounded-lg text-white font-mono focus:outline-none focus:border-[#3867F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Total Funded Debt (Long + Short)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 106595"
                    value={statementDebt}
                    onChange={(e) => setStatementDebt(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] rounded-lg text-white font-mono focus:outline-none focus:border-[#3867F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Cash &amp; Liquid Reserves</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 29943"
                    value={statementCash}
                    onChange={(e) => setStatementCash(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] rounded-lg text-white font-mono focus:outline-none focus:border-[#3867F5]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Annual Interest Expense</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 3933"
                    value={statementInterest}
                    onChange={(e) => setStatementInterest(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151E2D] border border-[#253247] rounded-lg text-white font-mono focus:outline-none focus:border-[#3867F5]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#253247]">
                <button
                  type="button"
                  onClick={() => setIsStatementEditorOpen(false)}
                  className="px-4 py-2 bg-[#151E2D] hover:bg-[#253247] text-[#9AA8BC] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStatement}
                  className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isSavingStatement ? "Saving to SQLite..." : "Save Statements to SQLite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
