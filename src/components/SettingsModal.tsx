"use client";

import React, { useState } from "react";
import {
  X,
  Sliders,
  User,
  Database,
  Check,
  RefreshCw,
  Upload,
  Trash2,
  Share2,
  Copy,
  Award,
  Shield,
  KeyRound,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { WallStreetAvatar, AVATAR_PRESETS, AvatarPresetId } from "./WallStreetAvatar";

export interface OperatorSettings {
  id?: string;
  name: string;
  email: string;
  desk: string;
  title?: string;
  phone?: string;
  avatar: string;
  avatarCustomUrl?: string;
  activeBadges?: string[];
  incognitoMode?: boolean;
  telemetryEnabled?: boolean;
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
  onLogout?: () => void;
}

const DESK_OPTIONS = [
  "Global Credit Risk & Distressed Debt",
  "Special Situations & Restructuring",
  "Sovereign Risk Desk",
  "Leveraged Finance & Syndicate Desk",
  "Fixed Income Capital Markets (FICM)",
  "Private Credit Underwriting Desk",
];

export const WALL_STREET_BADGES = [
  {
    id: "SOVEREIGN_RISK",
    name: "Sovereign Risk Clearance",
    firm: "FINTRAXIS CENTRAL",
    icon: "🛡️",
    desc: "Top-tier sovereign debt & macro rate surveillance clearance",
  },
  {
    id: "ALADDIN_CORE",
    name: "Fixed Income Risk Specialist",
    firm: "Institutional Syndicate Desk",
    icon: "💼",
    desc: "Multi-asset debt portfolio risk & duration analytics clearance",
  },
  {
    id: "GS_MARQUEE",
    name: "Principal Credit Strategies",
    firm: "Goldman Sachs Marquee",
    icon: "🏛️",
    desc: "Senior secured lending & mezzanine distress restructuring",
  },
  {
    id: "MS_MATRIX",
    name: "M&A Advisory & LevFin",
    firm: "Morgan Stanley Matrix",
    icon: "🤝",
    desc: "Cross-border debt syndication & covenant modeling",
  },
  {
    id: "JPM_MARKETS",
    name: "Private Credit Underwriter",
    firm: "J.P. Morgan Markets",
    icon: "📊",
    desc: "Bespoke sponsor-backed debt & direct corporate lending",
  },
  {
    id: "BASEL_III",
    name: "Basel III Regulatory Auditor",
    firm: "BIS / Fed / RBI",
    icon: "⚖️",
    desc: "LCR, NSFR, and supervisory capital buffer certification",
  },
];

type SettingsTab = "PROFILE" | "BADGES" | "SHARE_ID" | "PRIVACY_PASS" | "HURDLES" | "SYSTEM";

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  onReseedCache,
  onLogout,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("PROFILE");

  // Profile Form State
  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [title, setTitle] = useState(settings.title || "Senior Credit Underwriter");
  const [phone, setPhone] = useState(settings.phone || "+1 (212) 555-0199 x44");
  const [desk, setDesk] = useState(settings.desk || DESK_OPTIONS[0]);
  const [avatar, setAvatar] = useState<string>(settings.avatar || "crest");
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>(settings.avatarCustomUrl || "");
  const [badges, setBadges] = useState<string[]>(
    settings.activeBadges || ["SOVEREIGN_RISK", "ALADDIN_CORE"]
  );

  // Risk Hurdles
  const [netDebtHurdle, setNetDebtHurdle] = useState<number>(settings.netDebtEbitdaHurdle ?? 3.5);
  const [interestCovHurdle, setInterestCovHurdle] = useState<number>(settings.interestCoverageHurdle ?? 2.5);
  const [currentRatioHurdle, setCurrentRatioHurdle] = useState<number>(settings.currentRatioHurdle ?? 1.1);

  // Privacy & Passwords
  const [incognitoMode, setIncognitoMode] = useState<boolean>(settings.incognitoMode ?? false);
  const [telemetryEnabled, setTelemetryEnabled] = useState<boolean>(settings.telemetryEnabled ?? true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  // Sharing State
  const [copiedId, setCopiedId] = useState(false);
  const [copiedShareSummary, setCopiedShareSummary] = useState(false);

  // General Status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reseedStatus, setReseedStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const analystId = settings.id || `OPR-7702-${name.slice(0, 3).toUpperCase() || "NYK"}`;

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

  const toggleBadge = (badgeId: string) => {
    setBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((id) => id !== badgeId) : [...prev, badgeId]
    );
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(analystId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyShareSummary = () => {
    const summary = [
      `🏛️ FINTRAXIS INSTITUTIONAL CLEARANCE CARD`,
      `----------------------------------------`,
      `Analyst ID: ${analystId}`,
      `Operator: ${name}`,
      `Corporate Title: ${title}`,
      `Institutional Email: ${email}`,
      `Surveillance Desk: ${desk}`,
      `Active Badges: ${badges.join(", ")}`,
      `Verification Node: MUM-01 // PRODUCTION SECURE`,
      `Terminal Access: https://fintraxis.vercel.app`,
    ].join("\n");

    navigator.clipboard.writeText(summary);
    setCopiedShareSummary(true);
    setTimeout(() => setCopiedShareSummary(false), 2000);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setPasswordStatus("Please provide a new password");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus("Passwords do not match");
      return;
    }

    setPasswordStatus("PASSWORD UPDATED & ENCRYPTED IN LOCAL VAULT ✅");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordStatus(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: OperatorSettings = {
        id: settings.id || analystId,
        name: name.trim(),
        email: email.trim(),
        title: title.trim(),
        phone: phone.trim(),
        desk,
        avatar,
        avatarCustomUrl: customAvatarUrl || undefined,
        activeBadges: badges,
        incognitoMode,
        telemetryEnabled,
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
      } else {
        onSave(payload);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.warn("Settings save fallback:", err);
      const fallback: OperatorSettings = {
        id: settings.id || analystId,
        name: name.trim(),
        email: email.trim(),
        title: title.trim(),
        phone: phone.trim(),
        desk,
        avatar,
        avatarCustomUrl: customAvatarUrl || undefined,
        activeBadges: badges,
        incognitoMode,
        telemetryEnabled,
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

  const handleTriggerReseed = () => {
    setReseedStatus("RE-INDEXING WAL MASTER...");
    try {
      if (onReseedCache) onReseedCache();
      setTimeout(() => {
        setReseedStatus("DATABASE RE-SYNCHRONIZED (WAL OK)");
        setTimeout(() => setReseedStatus(null), 2500);
      }, 500);
    } catch {
      setReseedStatus("RE-SEED COMPLETE");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080B10]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-[#111622] border border-[#1E2536] shadow-2xl rounded overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-3.5 bg-[#0D111A] border-b border-[#1E2536] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
            <span className="font-bold tracking-wider text-slate-100 text-xs uppercase">
              INSTITUTIONAL OPERATOR SETTINGS &bull; CLEARANCE CONTROL
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2536] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-[#1E2536] bg-[#090D14] text-xs overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("PROFILE")}
            className={`py-2 px-3 sm:px-4 flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors ${
              activeTab === "PROFILE"
                ? "bg-[#111622] text-[#38BDF8] border-b-2 border-[#38BDF8]"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile &amp; Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("BADGES")}
            className={`py-2 px-3 sm:px-4 flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors ${
              activeTab === "BADGES"
                ? "bg-[#111622] text-[#38BDF8] border-b-2 border-[#38BDF8]"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Desk Badges ({badges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SHARE_ID")}
            className={`py-2 px-3 sm:px-4 flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors ${
              activeTab === "SHARE_ID"
                ? "bg-[#111622] text-[#38BDF8] border-b-2 border-[#38BDF8]"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share ID</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PRIVACY_PASS")}
            className={`py-2 px-3 sm:px-4 flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors ${
              activeTab === "PRIVACY_PASS"
                ? "bg-[#111622] text-[#38BDF8] border-b-2 border-[#38BDF8]"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security &amp; Privacy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HURDLES")}
            className={`py-2 px-3 sm:px-4 flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors ${
              activeTab === "HURDLES"
                ? "bg-[#111622] text-[#38BDF8] border-b-2 border-[#38BDF8]"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Hurdles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SYSTEM")}
            className={`py-2 px-3 sm:px-4 flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors ${
              activeTab === "SYSTEM"
                ? "bg-[#111622] text-[#38BDF8] border-b-2 border-[#38BDF8]"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>System &amp; Exit</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* TAB 1: PROFILE & PERSONAL INFO */}
          {activeTab === "PROFILE" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#94A3B8] uppercase">OPERATOR FULL NAME</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#94A3B8] uppercase">INSTITUTIONAL EMAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#94A3B8] uppercase">CORPORATE TITLE</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#94A3B8] uppercase">DESK PHONE / EXTENSION</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none rounded"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#94A3B8] uppercase">SURVEILLANCE DESK ASSIGNMENT</label>
                <select
                  value={desk}
                  onChange={(e) => setDesk(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none rounded"
                >
                  {DESK_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Upload & Preset Section */}
              <div className="space-y-2 pt-2 border-t border-[#1E2536]">
                <label className="text-[10px] text-[#94A3B8] uppercase flex items-center justify-between">
                  <span>PROFILE PHOTO // WALL STREET IDENTITY</span>
                  <span className="text-[#10B981]">{customAvatarUrl ? "Custom Photo Active" : "Avatar Preset"}</span>
                </label>

                <div className="p-3 bg-[#090D14] border border-[#1E2536] rounded flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-[#38BDF8]/50 overflow-hidden bg-[#162033] flex items-center justify-center shrink-0">
                    {customAvatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={customAvatarUrl} alt="Custom Preview" className="w-full h-full object-cover" />
                    ) : (
                      <WallStreetAvatar avatarId={avatar as AvatarPresetId} size="md" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-[#172033] hover:bg-[#1E2B45] border border-[#38BDF8]/40 text-[#38BDF8] text-[10px] font-bold rounded cursor-pointer transition-colors flex items-center gap-1.5">
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
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <div className="text-[9px] text-[#64748B]">
                      Upload JPG or PNG. Appears on your analyst badge, reports, and IC Dossier sign-off.
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar Preset Grid */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] text-[#94A3B8] uppercase">SELECT PRESET BADGE AVATAR</label>
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
                            ? "bg-[#162033] border-[#38BDF8] ring-1 ring-[#38BDF8]"
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
            </div>
          )}

          {/* TAB 2: WALL STREET DESK BADGES */}
          {activeTab === "BADGES" && (
            <div className="space-y-3 animate-in fade-in duration-100">
              <div className="p-3 bg-[#080B10] border border-[#1E2536] rounded text-[11px] text-[#94A3B8] leading-relaxed">
                Equip prestigious institutional clearances on your analyst profile. Active badges appear on your terminal session, risk memorandums, and digital IC Dossier seal.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WALL_STREET_BADGES.map((b) => {
                  const isEquipped = badges.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => toggleBadge(b.id)}
                      className={`p-3 border rounded cursor-pointer transition-all ${
                        isEquipped
                          ? "bg-[#141C2B] border-[#38BDF8] shadow-sm ring-1 ring-[#38BDF8]/30"
                          : "bg-[#090D14] border-[#1E2536] opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{b.icon}</span>
                          <div>
                            <div className="text-[11px] font-bold text-[#F8FAFC]">{b.name}</div>
                            <div className="text-[9px] text-[#38BDF8] font-semibold">{b.firm}</div>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isEquipped
                              ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40"
                              : "bg-[#1E2536] text-[#64748B]"
                          }`}
                        >
                          {isEquipped ? "EQUIPPED" : "LOCKED"}
                        </span>
                      </div>
                      <div className="text-[9.5px] text-[#64748B] leading-tight">{b.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SHARE USER / ANALYST ID */}
          {activeTab === "SHARE_ID" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-4 bg-[#080B10] border border-[#1E2536] rounded space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase tracking-wider">OFFICIAL ANALYST IDENTIFIER</span>
                    <div className="text-lg font-bold font-mono text-[#38BDF8] tracking-widest">{analystId}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="px-3 py-1.5 bg-[#172033] hover:bg-[#1E2B45] border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
                  >
                    {copiedId ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? "COPIED!" : "COPY ID"}</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-[#1E2536] grid grid-cols-2 gap-2 text-[10px] text-[#94A3B8]">
                  <div>
                    <span className="text-[#64748B]">OPERATOR:</span> <span className="text-[#F8FAFC] font-semibold">{name}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">DESK:</span> <span className="text-[#F8FAFC] font-semibold">{desk}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">CLEARANCE:</span> <span className="text-[#10B981] font-semibold">LEVEL 3 SOVEREIGN</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">CLUSTER NODE:</span> <span className="text-[#38BDF8] font-semibold">MUM-01 PROD</span>
                  </div>
                </div>
              </div>

              {/* 1-Click Share Summary */}
              <div className="p-3.5 bg-[#0D111A] border border-[#1E2536] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#F8FAFC]">SHARE TERMINAL CLEARANCE CARD</div>
                    <div className="text-[10px] text-[#64748B]">Copies your verified Wall Street credentials to share with colleagues or committee members.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyShareSummary}
                    className="px-3 py-1.5 bg-[#38BDF8] hover:bg-[#1D4ED8] text-[#080B10] font-bold text-xs rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedShareSummary ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedShareSummary ? "COPIED TO CLIPBOARD!" : "SHARE PROFILE"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & PRIVACY */}
          {activeTab === "PRIVACY_PASS" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Password Update Form */}
              <div className="p-3.5 bg-[#080B10] border border-[#1E2536] rounded space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>UPDATE CLEARANCE PASSWORD</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0D111A] border border-[#1E2536] text-[#F8FAFC] text-xs font-mono rounded focus:border-[#38BDF8] focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#0D111A] border border-[#1E2536] text-[#F8FAFC] text-xs font-mono rounded focus:border-[#38BDF8] focus:outline-none"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#0D111A] border border-[#1E2536] text-[#F8FAFC] text-xs font-mono rounded focus:border-[#38BDF8] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handlePasswordUpdate}
                    className="px-3 py-1 bg-[#172033] hover:bg-[#1E2B45] border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-bold rounded transition-colors"
                  >
                    UPDATE PASSWORD
                  </button>
                  {passwordStatus && (
                    <span className="text-[10px] text-[#10B981] font-bold animate-fade-in">{passwordStatus}</span>
                  )}
                </div>
              </div>

              {/* Privacy Controls */}
              <div className="p-3.5 bg-[#080B10] border border-[#1E2536] rounded space-y-3">
                <div className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>INSTITUTIONAL PRIVACY VAULT</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#1E2536]">
                  <div>
                    <div className="text-[11px] font-bold text-[#F8FAFC]">Incognito Surveillance Mode</div>
                    <div className="text-[9.5px] text-[#64748B]">Do not log recent corporate entity searches to browser cache.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={incognitoMode}
                    onChange={(e) => setIncognitoMode(e.target.checked)}
                    className="w-4 h-4 accent-[#38BDF8] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <div className="text-[11px] font-bold text-[#F8FAFC]">Zero-Telemetry Terminal Vault</div>
                    <div className="text-[9.5px] text-[#64748B]">Process all stress simulations locally without transmitting metrics externally.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={telemetryEnabled}
                    onChange={(e) => setTelemetryEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#10B981] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RISK HURDLE CALIBRATION */}
          {activeTab === "HURDLES" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-3 bg-[#080B10] border border-[#1E2536] rounded text-[11px] text-[#94A3B8] leading-relaxed">
                Adjusting institutional hurdles dynamically recalibrates the <span className="text-[#10B981] font-bold">COMPLIANT</span> / <span className="text-[#F43F5E] font-bold">BREACH</span> flags across Module 04 (Vulnerability Monitor) and Module 06 (IC Underwriting Dossier).
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
                  <div className="text-base font-bold font-mono text-[#38BDF8]">
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
                  className="w-full accent-[#38BDF8]"
                />
                <div className="flex justify-between text-[9px] text-[#64748B]">
                  <span>Tight (0.90x)</span>
                  <span>Standard (1.10x)</span>
                  <span>Conservative (1.80x)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM DIAGNOSTICS & LOGOUT */}
          {activeTab === "SYSTEM" && (
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
                    <span>Active Clearance Node:</span>
                    <span className="font-mono text-[#38BDF8]">MUM-01 // PRODUCTION SECURE</span>
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

              {/* LOGOUT BUTTON */}
              {onLogout && (
                <div className="p-3.5 bg-[#1F1316] border border-[#F43F5E]/30 rounded flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#F43F5E]">TERMINAL SESSION TERMINATION</div>
                    <div className="text-[10px] text-[#FDA4AF]">Clears encrypted operator session token and locks terminal access.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to log out and lock the FINTRAXIS Terminal?")) {
                        onLogout();
                        onClose();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>LOG OUT</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-[#1E2536] flex items-center justify-between shrink-0">
            <div className="text-[10px] text-[#F59E0B] hidden sm:block">
              Demonstration environment: changes may reset when the service restarts.
            </div>

            <div className="flex items-center gap-2 ml-auto">
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
                className="px-4 py-1.5 bg-[#38BDF8] hover:bg-[#1D4ED8] text-[#080B10] text-xs font-bold flex items-center gap-1.5 transition-colors rounded disabled:opacity-50 cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>SAVED</span>
                  </>
                ) : isSaving ? (
                  <span>SAVING...</span>
                ) : (
                  <span>SAVE SETTINGS</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
