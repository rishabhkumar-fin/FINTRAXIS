"use client";

import React, { useState } from "react";
import { PeacockLogo } from "./PeacockLogo";
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  Activity,
  ShieldAlert,
  SlidersHorizontal,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  Settings,
  Sparkles,
  X,
  Network,
  PieChart,
} from "lucide-react";
import { ModuleTab } from "./NavigationTabs";
import { CompanyEntity, CompanyRiskProfile } from "@/lib/types";
import { SessionClearance } from "./AuthGate";
import { WallStreetAvatar, AvatarPresetId } from "./WallStreetAvatar";

interface SidebarNavigationProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  companies: CompanyEntity[];
  activeProfile: CompanyRiskProfile | null;
  onSelectCompany: (id: string) => void;
  session: SessionClearance | null;
  onLogout: () => void;
  onOpenSettings?: () => void;
  onOpenAi?: () => void;
  earlyWarningCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function SidebarNavigation({
  activeTab,
  onSelectTab,
  companies,
  activeProfile,
  onSelectCompany,
  session,
  onLogout,
  onOpenSettings,
  onOpenAi,
  earlyWarningCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const selected = activeProfile?.company;

  const handleTabClick = (tab: ModuleTab) => {
    onSelectTab(tab);
    onCloseMobile?.();
  };

  const handleCompanySelect = (id: string) => {
    onSelectCompany(id);
    setIsSwitcherOpen(false);
    onCloseMobile?.();
  };

  const userRole = session?.role || (session?.isDemo ? "DEMO_ANALYST" : "ANALYST");
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  // Canonical Navigation: Admin Console + Overview + 6 Core Workstations
  const navItems = [
    {
      id: "00_ADMIN" as ModuleTab,
      name: "Admin Panel",
      shortDesc: "Governance, Data & Settings",
      icon: ShieldCheck,
      badge: isAdmin ? "ADMIN" : "GOVERNANCE",
      badgeColor: isAdmin ? "text-[#38BDF8] border-[#38BDF8]/40 bg-[#3867F5]/10" : "text-[#94A3B8] border-[#334155] bg-[#1E293B]/40",
    },
    {
      id: "overview" as ModuleTab,
      name: "Overview",
      shortDesc: "Executive Financial Summary",
      icon: LayoutDashboard,
      badge: "SUMMARY",
      badgeColor: "text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10",
    },
    {
      id: "01_HUB" as ModuleTab,
      name: "Company Directory",
      shortDesc: "Securities Search & Profile",
      icon: Building2,
      badge: "DIRECTORY",
      badgeColor: "text-[#38BDF8] border-[#253247]",
    },
    {
      id: "02_HEALTH" as ModuleTab,
      name: "Financial Health",
      shortDesc: "Solvency & 3-Statement Ledger",
      icon: Activity,
      badge: "SOLVENCY",
      badgeColor: "text-[#38BDF8] border-[#253247]",
    },
    {
      id: "03_VULNERABILITY" as ModuleTab,
      name: "Vulnerability Monitor",
      shortDesc: "Early Warning & Debt Rollover",
      icon: ShieldAlert,
      badge: earlyWarningCount > 0 ? `${earlyWarningCount} FLAGS` : "SURVEILLANCE",
      badgeColor: earlyWarningCount > 0 ? "text-[#F43F5E] border-[#F43F5E]/40 bg-[#F43F5E]/10" : "text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10",
    },
    {
      id: "04_DEPENDENCIES" as ModuleTab,
      name: "Business Dependencies",
      shortDesc: "Supply Chain & Customer Ties",
      icon: Network,
      badge: "SUPPLY",
      badgeColor: "text-[#38BDF8] border-[#253247]",
    },
    {
      id: "05_CONCENTRATION" as ModuleTab,
      name: "Concentration & Exposure",
      shortDesc: "Segment & Geographic Risk",
      icon: PieChart,
      badge: "EXPOSURE",
      badgeColor: "text-[#38BDF8] border-[#253247]",
    },
    {
      id: "06_SIMULATOR" as ModuleTab,
      name: "Scenario Simulator",
      shortDesc: "Macro Shocks & Rate Testing",
      icon: SlidersHorizontal,
      badge: "SIMULATOR",
      badgeColor: "text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10",
    },
    {
      id: "07_REPORTS" as ModuleTab,
      name: "Executive Credit Memo",
      shortDesc: "Underwriting Tearsheet & PDF",
      icon: FileText,
      badge: "EXPORT",
      badgeColor: "text-[#94A3B8] border-[#334155]",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/75 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-[#0A0E17] border-r border-[#253247] flex flex-col justify-between transition-all duration-200 select-none no-print ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header Lockup & Collapse Trigger */}
        <div className="flex flex-col">
          <div className="p-3.5 border-b border-[#253247] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <PeacockLogo size="sm" showLockup={false} />
              {!isCollapsed && (
                <span className="font-mono font-bold tracking-[0.2em] text-[#F3F6FC] text-xs uppercase truncate whitespace-nowrap">
                  FINTRAXIS
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:block p-1 text-[#9AA8BC] hover:text-[#F3F6FC] hover:bg-[#151E2D] rounded transition-colors"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1 text-[#9AA8BC] hover:text-[#F3F6FC] hover:bg-[#151E2D] rounded transition-colors"
                title="Close Navigation Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Entity Quick Switcher Card */}
          <div className="p-2 border-b border-[#253247] relative">
            <button
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className="w-full p-2 bg-[#101621] hover:bg-[#151E2D] border border-[#253247] text-left transition-colors flex items-center justify-between rounded-lg"
            >
              <div className="truncate mr-1 min-w-0">
                <div className="text-[10px] text-[#9AA8BC] uppercase tracking-wider flex items-center gap-1">
                  <span>ACTIVE ISSUER</span>
                  {selected?.country && (
                    <span className="text-[9px] px-1 bg-[#080B12] text-[#38BDF8] border border-[#253247] rounded">
                      {selected.country}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold font-mono text-[#F3F6FC] truncate mt-0.5">
                  {selected ? selected.symbol : "SELECT ISSUER"}
                </div>
                {!isCollapsed && selected && (
                  <div className="text-[10px] text-[#9AA8BC] truncate">
                    {selected.name}
                  </div>
                )}
              </div>

              {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-[#9AA8BC] shrink-0" />}
            </button>

            {/* Quick Entity Dropdown Menu */}
            {isSwitcherOpen && (
              <div className="absolute top-full left-2 right-2 mt-1 z-50 bg-[#101621] border border-[#253247] shadow-2xl rounded-lg max-h-56 overflow-y-auto">
                <div className="p-2 text-[9px] text-[#9AA8BC] uppercase border-b border-[#253247] flex justify-between font-mono">
                  <span>SECURITY REGISTER</span>
                  <span>{companies.length} ISSUERS</span>
                </div>
                {companies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCompanySelect(c.id)}
                    className={`w-full p-2 text-left text-xs font-mono flex items-center justify-between hover:bg-[#151E2D] transition-colors border-b border-[#253247]/40 last:border-0 ${
                      selected?.id === c.id ? "bg-[#151E2D] text-[#38BDF8]" : "text-[#9AA8BC]"
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-bold text-[#F3F6FC]">{c.symbol}</div>
                      <div className="text-[10px] text-[#9AA8BC] truncate">{c.name}</div>
                    </div>
                    <div className="text-[10px] px-1 bg-[#080B12] border border-[#253247] text-[#38BDF8] rounded">
                      {c.currency}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 10-Item Primary Navigation List */}
          <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)]">
            {/* Workspace Views */}
            {navItems.map((item) => {
              const isCurrent =
                activeTab === item.id ||
                (item.id === "02_HEALTH" && (activeTab === "02_STATEMENTS" || activeTab === "03_HEALTH")) ||
                (item.id === "03_VULNERABILITY" && activeTab === "04_VULNERABILITY") ||
                (item.id === "06_SIMULATOR" && activeTab === "05_SIMULATOR") ||
                (item.id === "07_REPORTS" && activeTab === "06_MEMO");
              const IconComponent = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  title={isCollapsed ? `${item.name}: ${item.shortDesc}` : undefined}
                  className={`w-full p-2.5 flex items-center gap-3 text-left transition-all rounded-lg font-mono ${
                    isCurrent
                      ? "bg-[#151E2D] border-l-2 border-[#3867F5] text-white shadow-sm"
                      : "hover:bg-[#101621] text-[#9AA8BC] hover:text-[#F3F6FC]"
                  }`}
                >
                  <IconComponent
                    className={`w-4 h-4 shrink-0 ${
                      isCurrent ? "text-[#38BDF8]" : "text-[#9AA8BC]"
                    }`}
                  />

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div className="truncate mr-1">
                        <div className="text-xs font-semibold truncate leading-tight text-[#F3F6FC]">
                          {item.name}
                        </div>
                        <div className="text-[9.5px] text-[#9AA8BC] truncate">
                          {item.shortDesc}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span
                            className={`text-[8.5px] px-1 py-0.2 border rounded ${
                              item.badgeColor || "text-[#9AA8BC] border-[#253247]"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}

            {/* Separator */}
            <div className="pt-2 pb-1 border-t border-[#253247]/60 my-1" />

            {/* Item: AI Copilot */}
            {onOpenAi && (
              <button
                onClick={() => {
                  onOpenAi();
                  onCloseMobile?.();
                }}
                title={isCollapsed ? "AI Copilot: Financial Intelligence" : undefined}
                className="w-full p-2.5 flex items-center gap-3 text-left transition-all rounded-lg font-mono hover:bg-[#101621] text-[#38BDF8] hover:text-white"
              >
                <Sparkles className="w-4 h-4 shrink-0 text-[#38BDF8]" />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold leading-tight text-[#F3F6FC]">AI Copilot</div>
                      <div className="text-[9.5px] text-[#9AA8BC]">Credit & Risk Assistant</div>
                    </div>
                  </div>
                )}
              </button>
            )}

            {/* Item: Settings */}
            {onOpenSettings && (
              <button
                onClick={() => {
                  onOpenSettings();
                  onCloseMobile?.();
                }}
                title={isCollapsed ? "Settings: Preferences & Hurdles" : undefined}
                className="w-full p-2.5 flex items-center gap-3 text-left transition-all rounded-lg font-mono hover:bg-[#101621] text-[#9AA8BC] hover:text-[#F3F6FC]"
              >
                <Settings className="w-4 h-4 shrink-0 text-[#9AA8BC]" />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold leading-tight text-[#F3F6FC]">Settings</div>
                      <div className="text-[9.5px] text-[#9AA8BC]">Preferences & Hurdles</div>
                    </div>
                  </div>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* Bottom User Clearance & Logout Card */}
        <div className="p-3 border-t border-[#253247] bg-[#0D131C]">
          {!isCollapsed ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 mr-2">
                  <WallStreetAvatar
                    avatarId={(session?.avatarId as AvatarPresetId) || "crest"}
                    customUrl={session?.avatarCustomUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#F3F6FC] truncate">
                      {session?.userName || "Principal Risk Officer"}
                    </div>
                    <div className="text-[9.5px] text-[#9AA8BC] truncate">
                      {session?.userEmail || "analyst@fintraxis.terminal"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-1.5 bg-[#151E2D] hover:bg-[#F05252]/20 border border-[#253247] hover:border-[#F05252] text-[#9AA8BC] hover:text-[#F05252] rounded transition-colors"
                  title="Lock Terminal Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Clearance Pill & Desk */}
              <div className="flex items-center justify-between pt-1.5 border-t border-[#253247]/60 text-[9px] font-mono">
                <span className="text-[#38BDF8] truncate max-w-[120px]">
                  {session?.desk || "Global Risk Surveillance"}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                    userRole === "SUPER_ADMIN"
                      ? "bg-[#3867F5]/20 text-[#38BDF8] border border-[#3867F5]/40"
                      : userRole === "LEAD_ANALYST"
                      ? "bg-[#16A879]/20 text-[#16A879] border border-[#16A879]/40"
                      : userRole === "DEMO_ANALYST"
                      ? "bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40"
                      : "bg-[#151E2D] text-[#9AA8BC] border border-[#253247]"
                  }`}
                >
                  {userRole}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <WallStreetAvatar
                avatarId={(session?.avatarId as AvatarPresetId) || "crest"}
                customUrl={session?.avatarCustomUrl}
                size="xs"
              />
              <button
                onClick={onLogout}
                className="p-1.5 bg-[#151E2D] hover:bg-[#F05252]/20 text-[#9AA8BC] hover:text-[#F05252] rounded transition-colors"
                title="Lock Terminal"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
