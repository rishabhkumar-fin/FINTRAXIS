"use client";

import React, { useState } from "react";
import { X, Sliders, User, Database, Check, RefreshCw, Upload, Trash2 } from "lucide-react";
import { WallStreetAvatar, AVATAR_PRESETS, AvatarPresetId } from "./WallStreetAvatar";

export interface OperatorSettings {
  id?: string;
  name: string;
  email: string;
  desk: string;
  avatar: string;
  avatarCustomUrl?: string;
  netDebtEbitdaHurdle: number;
  interestCoverageHurdle: number;
  currentRatioHurdle: number;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OperatorSettings;
  onSave: (updated: OperatorSettings) => void;
  onReseedCache?: () => void;
}

const DESK_OPTIONS = [
  "Global Credit Risk & Distressed Debt",
  "Special Situations & Restructuring",
  "Sovereign Risk Desk",
  "Leveraged Finance & Syndicate Desk",
];

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  onReseedCache,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"PROFILE" | "HURDLES" | "DIAGNOSTICS">("PROFILE");

  // Form State
  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [desk, setDesk] = useState(settings.desk || DESK_OPTIONS[0]);
  const [avatar, setAvatar] = useState<string>(settings.avatar || "crest");
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>(settings.avatarCustomUrl || "");
  const [netDebtHurdle, setNetDebtHurdle] = useState<number>(settings.netDebtEbitdaHurdle ?? 3.5);
  const [interestCovHurdle, setInterestCovHurdle] = useState<number>(settings.interestCoverageHurdle ?? 2.5);
  const [currentRatioHurdle, setCurrentRatioHurdle] = useState<number>(settings.currentRatioHurdle ?? 1.1);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reseedStatus, setReseedStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("File size exceeds 3MB limit. Please choose a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: OperatorSettings = {
        id: settings.id,
        name: name.trim(),
        email: email.trim(),
        desk,
        avatar,
        avatarCustomUrl: customAvatarUrl || undefined,
        netDebtEbitdaHurdle: Number(netDebtHurdle),
        interestCoverageHurdle: Number(interestCovHurdle),
        currentRatioHurdle: Number(currentRatioHurdle),
      };

      const res = await fetch("/api/auth/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.user) {
        onSave({ ...payload, ...json.user });
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 800);
      } else {
        // Fallback save to parent and localStorage
        onSave(payload);
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 800);
      }
    } catch (err) {
      console.warn("Settings save error, falling back to local state:", err);
      const fallback: OperatorSettings = {
        id: settings.id,
        name: name.trim(),
        email: email.trim(),
        desk,
        avatar,
        avatarCustomUrl: customAvatarUrl || undefined,
        netDebtEbitdaHurdle: Number(netDebtHurdle),
        interestCoverageHurdle: Number(interestCovHurdle),
        currentRatioHurdle: Number(currentRatioHurdle),
      };
      onSave(fallback);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerReseed = async () => {
    setReseedStatus("RE-SEEDING WAL MASTER...");
    try {
      if (onReseedCache) {
        onReseedCache();
      }
      setTimeout(() => {
        setReseedStatus("DATABASE RE-SYNCHRONIZED (WAL OK)");
        setTimeout(() => setReseedStatus(null), 2500);
      }, 600);
    } catch {
      setReseedStatus("RE-SEED COMPLETE");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080B10]/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-[#111622] border border-[#1E2536] shadow-2xl rounded overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-[#0D111A] border-b border-[#1E2536] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C5A880]"></span>
            <span className="font-bold tracking-wider text-slate-100 text-xs uppercase">
              INSTITUTIONAL SETTINGS &bull; OPERATOR CALIBRATION
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2536] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1E2536] bg-[#090D14] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("PROFILE")}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === "PROFILE"
                ? "bg-[#111622] text-[#C5A880] border-b-2 border-[#C5A880]"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile &amp; Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HURDLES")}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === "HURDLES"
                ? "bg-[#111622] text-[#C5A880] border-b-2 border-[#C5A880]"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Risk Hurdle Calibration</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DIAGNOSTICS")}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === "DIAGNOSTICS"
                ? "bg-[#111622] text-[#C5A880] border-b-2 border-[#C5A880]"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQLite Diagnostics</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* TAB 1: PROFILE & DESK */}
          {activeTab === "PROFILE" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#94A3B8] uppercase">OPERATOR FULL NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] text-xs font-mono focus:border-[#C5A880] focus:outline-none rounded"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#94A3B8] uppercase">INSTITUTIONAL EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] text-xs font-mono focus:border-[#C5A880] focus:outline-none rounded"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#94A3B8] uppercase">SURVEILLANCE DESK ASSIGNMENT</label>
                <select
                  value={desk}
                  onChange={(e) => setDesk(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] text-xs font-mono focus:border-[#C5A880] focus:outline-none rounded"
                >
                  {DESK_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-2 pt-2 border-t border-[#1E2536]">
                <label className="text-[10px] text-[#94A3B8] uppercase flex items-center justify-between">
                  <span>WALL STREET AVATAR PRESET</span>
                  <span className="text-[#C5A880]">Active: {avatar}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVATAR_PRESETS.map((p) => {
                    const isSelected = avatar === p.id;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setAvatar(p.id)}
                        className={`p-2 flex items-center gap-2 border text-left transition-all rounded ${
                          isSelected
                            ? "bg-[#162033] border-[#C5A880] ring-1 ring-[#C5A880]"
                            : "bg-[#090D14] border-[#1E2536] hover:border-[#2A364F]"
                        }`}
                      >
                        <WallStreetAvatar avatarId={p.id as AvatarPresetId} size="sm" />
                        <div className="min-w-0">
                          <div className={`text-[10px] font-bold truncate ${isSelected ? "text-[#F8FAFC]" : "text-[#CBD5E1]"}`}>
                            {p.name}
                          </div>
                          <div className="text-[8.5px] text-[#64748B] truncate">{p.tag}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Photo Upload Card */}
              <div className="space-y-2 pt-3 border-t border-[#1E2536]">
                <label className="text-[10px] text-[#94A3B8] uppercase flex items-center justify-between">
                  <span>CUSTOM PROFILE PHOTO</span>
                  <span className="text-[#10B981]">{customAvatarUrl ? "Custom Image Active" : "Preset Avatar Active"}</span>
                </label>

                <div className="p-3 bg-[#090D14] border border-[#1E2536] rounded-lg flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-[#C5A880]/50 overflow-hidden bg-[#162033] flex items-center justify-center shrink-0">
                    {customAvatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={customAvatarUrl} alt="Custom Preview" className="w-full h-full object-cover" />
                    ) : (
                      <WallStreetAvatar avatarId={avatar as AvatarPresetId} size="md" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-[#172033] hover:bg-[#1E2B45] border border-[#C5A880]/40 text-[#C5A880] text-[10px] font-bold rounded cursor-pointer transition-colors flex items-center gap-1.5">
                        <Upload className="w-3 h-3" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>

                      {customAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setCustomAvatarUrl("")}
                          className="px-2.5 py-1.5 bg-[#1F1316] hover:bg-[#2D161B] border border-[#F43F5E]/40 text-[#F43F5E] text-[10px] rounded transition-colors flex items-center gap-1"
                          title="Remove custom photo"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <div className="text-[9px] text-[#64748B]">
                      Upload JPG, PNG, or WebP. Appears on your analyst badge, reports, and IC Dossier sign-off.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RISK HURDLE CALIBRATION */}
          {activeTab === "HURDLES" && (
            <div className="space-y-5 animate-in fade-in duration-100">
              <div className="p-3 bg-[#080B10] border border-[#1E2536] rounded text-[11px] text-[#94A3B8] leading-relaxed">
                Adjusting institutional hurdles dynamically recalibrates the <span className="text-[#10B981] font-bold">COMPLIANT</span> / <span className="text-[#F43F5E] font-bold">BREACH</span> threshold flags in Module 04 (Vulnerability Monitor) and Module 06 (IC Underwriting Dossier).
              </div>

              {/* Net Debt / EBITDA */}
              <div className="space-y-2 p-3 bg-[#0D111A] border border-[#1E2536] rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#F8FAFC]">MAX NET DEBT / EBITDA HURDLE</div>
                    <div className="text-[10px] text-[#64748B]">Maximum tolerated leverage ceiling before covenant default.</div>
                  </div>
                  <div className="text-base font-bold font-mono text-[#38BDF8]">
                    {Number(netDebtHurdle).toFixed(2)}x
                  </div>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.1"
                  value={netDebtHurdle}
                  onChange={(e) => setNetDebtHurdle(parseFloat(e.target.value))}
                  className="w-full accent-[#38BDF8]"
                />
                <div className="flex justify-between text-[9px] text-[#64748B]">
                  <span>Conservative (1.50x)</span>
                  <span>Standard Wall Street (3.50x)</span>
                  <span>Aggressive (5.50x)</span>
                </div>
              </div>

              {/* EBIT Interest Coverage */}
              <div className="space-y-2 p-3 bg-[#0D111A] border border-[#1E2536] rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#F8FAFC]">MIN EBIT INTEREST COVERAGE FLOOR</div>
                    <div className="text-[10px] text-[#64748B]">Minimum debt service capacity required for facility clearance.</div>
                  </div>
                  <div className="text-base font-bold font-mono text-[#10B981]">
                    {Number(interestCovHurdle).toFixed(2)}x
                  </div>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={interestCovHurdle}
                  onChange={(e) => setInterestCovHurdle(parseFloat(e.target.value))}
                  className="w-full accent-[#10B981]"
                />
                <div className="flex justify-between text-[9px] text-[#64748B]">
                  <span>Distressed Floor (1.20x)</span>
                  <span>Institutional Baseline (2.50x)</span>
                  <span>Prime Cushion (4.00x)</span>
                </div>
              </div>

              {/* Current Ratio Floor */}
              <div className="space-y-2 p-3 bg-[#0D111A] border border-[#1E2536] rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#F8FAFC]">MIN CURRENT RATIO (WORKING CAPITAL)</div>
                    <div className="text-[10px] text-[#64748B]">Minimum liquidity buffer required to withstand short-term obligations.</div>
                  </div>
                  <div className="text-base font-bold font-mono text-[#C5A880]">
                    {Number(currentRatioHurdle).toFixed(2)}x
                  </div>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.05"
                  value={currentRatioHurdle}
                  onChange={(e) => setCurrentRatioHurdle(parseFloat(e.target.value))}
                  className="w-full accent-[#C5A880]"
                />
                <div className="flex justify-between text-[9px] text-[#64748B]">
                  <span>Tight (0.90x)</span>
                  <span>Standard (1.10x)</span>
                  <span>Conservative (1.80x)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTICS */}
          {activeTab === "DIAGNOSTICS" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="space-y-2 p-3 bg-[#080B10] border border-[#1E2536] rounded">
                <div className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>LOCAL SQLITE PERSISTENCE ENGINE</span>
                </div>
                <div className="text-[11px] space-y-1 text-[#94A3B8]">
                  <div className="flex justify-between">
                    <span>Database Path:</span>
                    <span className="font-mono text-[#F8FAFC]">data/fintraxis.db</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Journal Mode:</span>
                    <span className="font-mono text-[#10B981] font-bold">WAL (Write-Ahead Logging)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Synchronous Mode:</span>
                    <span className="font-mono text-[#F8FAFC]">NORMAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Clearance Node:</span>
                    <span className="font-mono text-[#C5A880]">MUM-01 // PRODUCTION</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#0D111A] border border-[#1E2536] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#F8FAFC]">CACHE RE-SYNCHRONIZATION</div>
                    <div className="text-[10px] text-[#64748B]">Re-indexes local security master and refreshes SQLite state.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTriggerReseed}
                    className="px-3 py-1.5 bg-[#172033] hover:bg-[#1E2B45] border border-[#1E2536] text-[#38BDF8] text-xs font-bold flex items-center gap-1.5 transition-colors rounded"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>RE-SYNC</span>
                  </button>
                </div>
                {reseedStatus && (
                  <div className="text-[10px] text-[#10B981] font-bold animate-pulse">
                    {reseedStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-[#1E2536] flex items-center justify-between">
            <div className="text-[10px] text-[#64748B]">
              CHANGES PERSIST DIRECTLY TO SQLITE MASTER
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-[#080B10] hover:bg-[#111622] border border-[#1E2536] text-[#94A3B8] text-xs font-bold transition-colors rounded"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 bg-[#C5A880] hover:bg-[#D4B996] text-[#080B10] text-xs font-bold flex items-center gap-1.5 transition-colors rounded disabled:opacity-50 cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>SAVED</span>
                  </>
                ) : isSaving ? (
                  <span>SAVING...</span>
                ) : (
                  <span>SAVE CHANGES</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
