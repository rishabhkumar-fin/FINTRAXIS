"use client";

import React, { useState } from "react";
import { PeacockLogo } from "./PeacockLogo";
import { Lock, ArrowRight, UserPlus, LogIn, Mail, User, Briefcase, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";
import { WallStreetAvatar, AVATAR_PRESETS, AvatarPresetId } from "./WallStreetAvatar";

export interface SessionClearance {
  id?: string;
  userName: string;
  userEmail: string;
  analystId: string;
  desk: string;
  authenticatedAt: string;
  sessionToken: string;
  avatarId?: AvatarPresetId | string;
  avatarCustomUrl?: string;
  netDebtEbitdaHurdle?: number;
  interestCoverageHurdle?: number;
  currentRatioHurdle?: number;
}

interface AuthGateProps {
  onAuthenticated: (session: SessionClearance) => void;
}

const DESK_ALLOCATIONS = [
  "Global Credit Risk & Distressed Debt",
  "Special Situations & Restructuring",
  "Sovereign Risk Desk",
  "Leveraged Finance & Syndicate Desk",
];

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<"SIGN_IN" | "REGISTER">("SIGN_IN");

  // Selected Avatar Preset
  const [selectedAvatarId, setSelectedAvatarId] = useState<AvatarPresetId>("crest");

  // Sign In State (Pre-seeded with Rishabh Kumar Yadav)
  const [signInEmail, setSignInEmail] = useState("rishabh.yadav@fintraxis.sovereign");
  const [signInPassword, setSignInPassword] = useState("Password123!");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Registration State
  const [regName, setRegName] = useState("Rishabh Kumar Yadav");
  const [regEmail, setRegEmail] = useState("rishabh.yadav@fintraxis.sovereign");
  const [regPassword, setRegPassword] = useState("Password123!");
  const [regDesk, setRegDesk] = useState(DESK_ALLOCATIONS[0]);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signInEmail.trim(),
          password: signInPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Authentication failed. Check your credentials.");
        setIsLoading(false);
        return;
      }

      const userData = json.user;
      const session: SessionClearance = {
        id: userData.id,
        userName: userData.name,
        userEmail: userData.email,
        analystId: userData.name,
        desk: userData.desk,
        avatarId: userData.avatar || selectedAvatarId,
        netDebtEbitdaHurdle: userData.netDebtEbitdaHurdle,
        interestCoverageHurdle: userData.interestCoverageHurdle,
        currentRatioHurdle: userData.currentRatioHurdle,
        sessionToken: userData.sessionToken,
        authenticatedAt: userData.authenticatedAt,
      };

      localStorage.setItem("fintraxis_session", JSON.stringify(session));
      setIsLoading(false);
      onAuthenticated(session);
    } catch (err: unknown) {
      console.error("Sign-in network error:", err);
      setErrorMessage("Network error connecting to institutional enclave.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim() || !regEmail.trim()) {
      setErrorMessage("Full name and institutional email are required.");
      return;
    }

    if (regPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          desk: regDesk,
          avatar: selectedAvatarId,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Registration failed. Try again.");
        setIsLoading(false);
        return;
      }

      const userData = json.user;
      const session: SessionClearance = {
        id: userData.id,
        userName: userData.name,
        userEmail: userData.email,
        analystId: userData.name,
        desk: userData.desk,
        avatarId: userData.avatar || selectedAvatarId,
        netDebtEbitdaHurdle: userData.netDebtEbitdaHurdle,
        interestCoverageHurdle: userData.interestCoverageHurdle,
        currentRatioHurdle: userData.currentRatioHurdle,
        sessionToken: userData.sessionToken,
        authenticatedAt: userData.authenticatedAt,
      };

      localStorage.setItem("fintraxis_session", JSON.stringify(session));
      setIsLoading(false);
      onAuthenticated(session);
    } catch (err: unknown) {
      console.error("Registration network error:", err);
      setErrorMessage("Network error registering operator.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080B10] text-[#F8FAFC] flex flex-col items-center justify-center p-4 select-none font-mono">
      {/* Subtle Guilloché Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: `radial-gradient(#1E2536 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Outer Executive Slate-Titanium Container */}
      <div className="relative w-full max-w-md bg-[#111622] border border-[#1E2536] shadow-2xl z-10 overflow-hidden rounded">
        {/* Top Sovereign Brand Header */}
        <div className="p-6 bg-[#0D111A] border-b border-[#1E2536] flex flex-col items-center text-center space-y-2">
          <PeacockLogo size="md" showLockup={true} />
          <div className="text-[10px] tracking-wider text-[#94A3B8] font-mono mt-0.5">
            INSTITUTIONAL RISK TERMINAL &bull; CRYPTOGRAPHIC ENCLAVE
          </div>

          {/* Dual Modal Tabs: Sign In vs Register */}
          <div className="w-full grid grid-cols-2 gap-1 p-1 bg-[#080B10] border border-[#1E2536] mt-3 rounded">
            <button
              onClick={() => {
                setMode("SIGN_IN");
                setErrorMessage(null);
              }}
              className={`py-1.5 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 rounded ${
                mode === "SIGN_IN"
                  ? "bg-[#172033] text-[#C5A880] border border-[#C5A880]/30 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Operator Sign In</span>
            </button>
            <button
              onClick={() => {
                setMode("REGISTER");
                setErrorMessage(null);
              }}
              className={`py-1.5 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 rounded ${
                mode === "REGISTER"
                  ? "bg-[#172033] text-[#C5A880] border border-[#C5A880]/30 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Modal Form Area */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2.5 bg-[#F43F5E]/10 border border-[#F43F5E]/40 text-[#F43F5E] text-xs flex items-center gap-2 rounded animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}

          {/* Visual Avatar Preset Selector */}
          <div className="space-y-1.5 pb-2 border-b border-[#1E2536]">
            <div className="flex items-center justify-between text-[10px] text-[#94A3B8] uppercase">
              <span className="flex items-center gap-1 text-[#C5A880] font-bold">
                <Sparkles className="w-3 h-3 text-[#C5A880]" />
                <span>SELECT WALL STREET AVATAR</span>
              </span>
              <span className="text-[9px] text-[#64748B]">PBKDF2 SHA-512</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatarId === preset.id;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => setSelectedAvatarId(preset.id)}
                    className={`p-2 flex items-center gap-2 border text-left transition-all rounded ${
                      isSelected
                        ? "bg-[#172033] border-[#C5A880] ring-1 ring-[#C5A880]"
                        : "bg-[#090D14] border-[#1E2536] hover:border-[#2A364F]"
                    }`}
                  >
                    <WallStreetAvatar avatarId={preset.id} size="sm" />
                    <div className="min-w-0">
                      <div
                        className={`text-[10px] font-bold truncate ${
                          isSelected ? "text-[#F8FAFC]" : "text-[#CBD5E1]"
                        }`}
                      >
                        {preset.name}
                      </div>
                      <div className="text-[8.5px] text-[#64748B] truncate">{preset.tag}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {mode === "SIGN_IN" ? (
            <form onSubmit={handleSignIn} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-[#94A3B8] uppercase flex justify-between">
                  <span>INSTITUTIONAL EMAIL</span>
                  <span className="text-[#10B981] font-bold">VERIFIED</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded"
                  />
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748B]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#94A3B8] uppercase flex justify-between">
                  <span>PASSWORD / PASSKEY</span>
                  <span className="text-[#64748B] text-[9px]">MIN 8 CHARACTERS</span>
                </label>
                <div className="relative">
                  <input
                    type={showSignInPassword ? "text" : "password"}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    className="w-full pl-8 pr-9 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded"
                  />
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748B]" />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#CBD5E1]"
                  >
                    {showSignInPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 mt-2 bg-[#C5A880] hover:bg-[#D4B996] text-[#080B10] font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 rounded"
              >
                {isLoading ? (
                  <span>AUTHENTICATING (PBKDF2)...</span>
                ) : (
                  <>
                    <span>ENTER TERMINAL</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-[#94A3B8] uppercase">OPERATOR FULL NAME</label>
                <div className="relative">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="e.g. Rishabh Kumar Yadav"
                    className="w-full pl-8 pr-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded"
                  />
                  <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748B]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#94A3B8] uppercase">INSTITUTIONAL EMAIL</label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="name@firm.com or @gmail.com"
                    className="w-full pl-8 pr-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded"
                  />
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748B]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#94A3B8] uppercase">CREATE PASSWORD</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                    className="w-full pl-8 pr-9 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded"
                  />
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748B]" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#CBD5E1]"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#94A3B8] uppercase">SURVEILLANCE DESK ASSIGNMENT</label>
                <div className="relative">
                  <select
                    value={regDesk}
                    onChange={(e) => setRegDesk(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[#080B10] border border-[#1E2536] text-[#F8FAFC] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded"
                  >
                    {DESK_ALLOCATIONS.map((d) => (
                      <option key={d} value={d} className="bg-[#080B10] text-[#F8FAFC]">
                        {d}
                      </option>
                    ))}
                  </select>
                  <Briefcase className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748B]" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 mt-2 bg-[#C5A880] hover:bg-[#D4B996] text-[#080B10] font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 rounded"
              >
                {isLoading ? (
                  <span>GENERATING PBKDF2 CREDENTIALS...</span>
                ) : (
                  <>
                    <span>REGISTER &amp; INITIALIZE SESSION</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Institutional Audit Footer */}
          <div className="pt-2.5 border-t border-[#1E2536] flex items-center justify-between text-[9px] text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              <span>NODE MUM-01 (ACTIVE)</span>
            </div>
            <div>SQLITE WAL &bull; 10,000 PBKDF2 ITERATIONS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
