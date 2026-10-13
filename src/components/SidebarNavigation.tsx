"use client";

import React, { useState } from "react";
import { PeacockLogo } from "./PeacockLogo";
import {
  Building2,
  FileSpreadsheet,
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
} from "lucide-react";
import { ModuleTab } from "./NavigationTabs";
import { CompanyEntity, CompanyRiskProfile } from "@/lib/types";
import { SessionClearance } from "./AuthGate";
import { WallStreetAvatar, AvatarPresetId } from "./WallStreetAvatar";
import { MODULE_REGISTRY } from "@/config/modules";

interface SidebarNavigationProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  companies: CompanyEntity[];
  activeProfile: CompanyRiskProfile | null;
  onSelectCompany: (id: string) => void;
  session: SessionClearance | null;
  onLogout: () => void;
  onOpenSettings?: () => void;
  earlyWarningCount?: number;
}

const TAB_MAP: Record<string, ModuleTab> = {
  hub: "01_HUB",
  ledger: "02_STATEMENTS",
  health: "03_HEALTH",
  vulnerability: "04_VULNERABILITY",
  stress: "05_SIMULATOR",
  ic: "06_MEMO",
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  FileSpreadsheet,
  Activity,
  ShieldAlert,
  SlidersHorizontal,
  FileText,
};

export function SidebarNavigation({
  activeTab,
  onSelectTab,
  companies,
  activeProfile,
  onSelectCompany,
  session,
  onLogout,
  onOpenSettings,
  earlyWarningCount = 0,
}: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const selected = activeProfile?.company;

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0A0E17] border-r border-[#1E2536] flex flex-col justify-between transition-all duration-200 select-none no-print ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Header Lockup & Collapse Trigger */}
      <div className="flex flex-col">
        <div className="p-3.5 border-b border-[#1E2536] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <PeacockLogo size="sm" showLockup={false} />
            {!isCollapsed && (
              <span className="font-mono font-medium tracking-[0.25em] text-slate-100 text-xs uppercase truncate whitespace-nowrap shrink-0">
                FINTRAXIS
              </span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111622] rounded transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Active Entity Quick Switcher Card */}
        <div className="p-2 border-b border-[#1E2536] relative">
          <button
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="w-full p-2 bg-[#111622] hover:bg-[#162033] border border-[#1E2536] text-left transition-colors flex items-center justify-between rounded"
          >
            <div className="truncate mr-1 min-w-0">
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                <span>ACTIVE ENTITY</span>
                {selected?.country && (
                  <span className="text-[9px] px-1 bg-[#080B10] text-[#94A3B8] border border-[#1E2536]">
                    {selected.country}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold font-mono text-[#F8FAFC] truncate">
                {selected ? selected.symbol : "SELECT ENTITY"}
              </div>
              {!isCollapsed && selected && (
                <div className="text-[10px] text-[#94A3B8] truncate">
                  {selected.name}
                </div>
              )}
            </div>

            {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-[#64748B] shrink-0" />}
          </button>

          {/* Quick Entity Dropdown Menu */}
          {isSwitcherOpen && (
            <div className="absolute top-full left-2 right-2 mt-1 z-50 bg-[#0D111A] border border-[#1E2536] shadow-2xl rounded max-h-56 overflow-y-auto">
              <div className="p-1.5 text-[9px] text-[#64748B] uppercase border-b border-[#1E2536] flex justify-between">
                <span>SECURITY REGISTER</span>
                <span>{companies.length} ISSUERS</span>
              </div>
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectCompany(c.id);
                    setIsSwitcherOpen(false);
                  }}
                  className={`w-full p-2 text-left text-xs font-mono flex items-center justify-between hover:bg-[#162033] transition-colors border-b border-[#1E2536]/40 last:border-0 ${
                    selected?.id === c.id ? "bg-[#172033] text-[#C5A880]" : "text-[#94A3B8]"
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-bold text-[#F8FAFC]">{c.symbol}</div>
                    <div className="text-[10px] text-[#64748B] truncate">{c.name}</div>
                  </div>
                  <div className="text-[10px] px-1 bg-[#080B10] border border-[#1E2536] text-[#94A3B8]">
                    {c.currency}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 6-Module Registry Navigation List */}
        <nav className="p-2 space-y-1 overflow-y-auto">
          {MODULE_REGISTRY.map((mod, index) => {
            const targetTab = TAB_MAP[mod.id];
            const isCurrent = activeTab === targetTab;
            const IconComponent = ICON_MAP[mod.iconName] || Building2;
            const hotkey = (index + 1).toString();

            let badge: string | null = null;
            let badgeColor: string | null = null;
            if (mod.id === "ledger") badge = "AUDIT";
            if (mod.id === "health") badge = "DAG";
            if (mod.id === "stress") badge = "SHOCK";
            if (mod.id === "ic") badge = "PDF";
            if (mod.id === "vulnerability") {
              badge = earlyWarningCount > 0 ? `${earlyWarningCount} FLAGS` : "0 FLAGS";
              badgeColor = earlyWarningCount > 0 ? "text-[#F43F5E] border-[#F43F5E]/40" : "text-[#10B981] border-[#10B981]/40";
            }

            return (
              <button
                key={mod.id}
                onClick={() => onSelectTab(targetTab)}
                title={isCollapsed ? `${mod.number}: ${mod.name}` : undefined}
                className={`w-full p-2.5 flex items-center gap-3 text-left transition-all rounded ${
                  isCurrent
                    ? "bg-[#162033] border-l-2 border-[#C5A880] text-[#F8FAFC]"
                    : "hover:bg-[#111622] text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                <IconComponent
                  className={`w-4 h-4 shrink-0 ${
                    isCurrent ? "text-[#C5A880]" : "text-[#64748B]"
                  }`}
                />

                {!isCollapsed && (
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="truncate mr-1">
                      <div className="text-xs font-semibold truncate leading-tight">
                        {mod.number} {mod.name}
                      </div>
                      <div className="text-[9.5px] text-[#64748B] truncate">
                        {mod.shortDesc}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {badge && (
                        <span
                          className={`text-[8.5px] px-1 py-0.2 border rounded ${
                            badgeColor || "text-[#94A3B8] border-[#1E2536]"
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                      <span className="text-[9px] text-[#475569] font-mono">[{hotkey}]</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer with Operator Identity & Settings CTA */}
      <div className="p-3 border-t border-[#1E2536] bg-[#0D111A] font-mono text-xs">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 mr-2">
                <WallStreetAvatar
                  avatarId={(session?.avatarId as AvatarPresetId) || "crest"}
                  customUrl={session?.avatarCustomUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F8FAFC] truncate">
                    {session?.userName || "Rishabh Kumar Yadav"}
                  </div>
                  <div className="text-[9px] text-[#94A3B8] truncate">
                    {session?.userEmail || "rishabh.yadav@fintraxis.sovereign"}
                  </div>
                  <div className="text-[8.5px] text-[#C5A880] tracking-wider mt-0.5 truncate">
                    {session?.desk || "Global Credit Risk & Distressed Debt"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="p-1.5 bg-[#111622] hover:bg-[#172033] border border-[#1E2536] text-[#94A3B8] hover:text-[#F8FAFC] rounded transition-colors"
                    title="Operator Calibration Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="p-1.5 bg-[#111622] hover:bg-[#F43F5E]/20 border border-[#1E2536] hover:border-[#F43F5E] text-[#94A3B8] hover:text-[#F43F5E] rounded transition-colors"
                  title="Lock Terminal Session (Ctrl+Shift+L)"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-[8.5px] text-[#64748B] flex items-center justify-between pt-1 border-t border-[#1E2536]/60">
              <span>NODE: MUM-01 (LIVE)</span>
              <span>LOCK: CTRL+SHIFT+L</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <WallStreetAvatar
              avatarId={(session?.avatarId as AvatarPresetId) || "crest"}
              customUrl={session?.avatarCustomUrl}
              size="xs"
            />
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 bg-[#111622] hover:bg-[#172033] text-[#94A3B8] hover:text-[#F8FAFC] rounded transition-colors"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onLogout}
              className="p-1.5 bg-[#111622] hover:bg-[#F43F5E]/20 text-[#94A3B8] hover:text-[#F43F5E] rounded transition-colors"
              title="Lock Terminal (Ctrl+Shift+L)"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
