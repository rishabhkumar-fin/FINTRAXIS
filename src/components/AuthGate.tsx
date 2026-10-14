"use client";

import React, { useState } from "react";
import { PeacockLogo } from "./PeacockLogo";
import {
  Lock,
  ArrowRight,
  UserPlus,
  LogIn,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Landmark,
  FileText,
} from "lucide-react";

export interface SessionClearance {
  id?: string;
  userName: string;
  userEmail: string;
  analystId: string;
  desk: string;
  authenticatedAt: string;
  sessionToken: string;
  avatarId?: string;
  avatarCustomUrl?: string;
  netDebtEbitdaHurdle?: number;
  interestCoverageHurdle?: number;
  currentRatioHurdle?: number;
}

interface AuthGateProps {
  onAuthenticated: (session: SessionClearance) => void;
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<"SIGN_IN" | "REGISTER">("SIGN_IN");

  // Sign In State
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1-Click Guest Analyst Access
  const handleGuestLogin = () => {
    const guestSession: SessionClearance = {
      id: `usr_guest_${Date.now()}`,
      userName: "Guest Analyst",
      userEmail: "guest@fintraxis.terminal",
      analystId: "Guest Analyst",
      desk: "Global Market Surveillance",
      avatarId: "crest",
      netDebtEbitdaHurdle: 3.5,
      interestCoverageHurdle: 2.5,
      currentRatioHurdle: 1.1,
      sessionToken: `tok_guest_${Date.now()}`,
      authenticatedAt: new Date().toISOString(),
    };
    localStorage.setItem("fintraxis_session", JSON.stringify(guestSession));
    onAuthenticated(guestSession);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signInIdentifier.trim()) {
      setErrorMessage("Please enter your username or email address.");
      return;
    }

    if (!signInPassword) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signInIdentifier.trim(),
          password: signInPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Authentication failed. Please verify your credentials.");
        setIsLoading(false);
        return;
      }

      const userData = json.user;
      const session: SessionClearance = {
        id: userData.id,
        userName: userData.name,
        userEmail: userData.email,
        analystId: userData.name,
        desk: userData.desk || "Credit Risk & Intelligence",
        avatarId: userData.avatar || "crest",
        netDebtEbitdaHurdle: userData.netDebtEbitdaHurdle ?? 3.5,
        interestCoverageHurdle: userData.interestCoverageHurdle ?? 2.5,
        currentRatioHurdle: userData.currentRatioHurdle ?? 1.1,
        sessionToken: userData.sessionToken,
        authenticatedAt: userData.authenticatedAt || new Date().toISOString(),
      };

      if (rememberMe) {
        localStorage.setItem("fintraxis_session", JSON.stringify(session));
      }
      setIsLoading(false);
      onAuthenticated(session);
    } catch (err: unknown) {
      console.error("Sign-in network error:", err);
      setErrorMessage("Network error connecting to authentication service.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!regEmail.trim()) {
      setErrorMessage("Please enter an email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setErrorMessage("Please enter a valid email address (e.g. name@gmail.com).");
      return;
    }

    if (regPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
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
          desk: "Credit Risk & Intelligence",
          avatar: "crest",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Account creation failed. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Account created successfully! Please sign in with your credentials.");
      setMode("SIGN_IN");
      setSignInIdentifier(regEmail);
      setSignInPassword("");
      setIsLoading(false);
    } catch (err: unknown) {
      console.error("Registration network error:", err);
      setErrorMessage("Network error creating account.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05070B] text-[#F8FAFC] flex items-center justify-center p-3 sm:p-6 select-none font-mono overflow-y-auto">
      {/* Background Radial Navy Accents */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(rgba(37, 99, 235, 0.25) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#1D4ED8]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-[#0284C7]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Luxury Layout - Classy Black & Navy Blue */}
      <div className="relative w-full max-w-5xl bg-[#090E17] border border-[#1E293B] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.95)] z-10 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 my-auto">
        
        {/* LEFT COLUMN: Wall Street Institutional Showcase (5 cols on lg) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0B111E] to-[#06090F] p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-[#1E293B] flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Royal Crest Lockup */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <PeacockLogo size="lg" showLockup={false} />
                <div>
                  <div className="text-sm font-bold tracking-[0.25em] text-[#F8FAFC] uppercase">
                    FINTRAXIS
                  </div>
                  <div className="text-[9.5px] text-[#38BDF8] tracking-widest uppercase font-semibold">
                    SOVEREIGN WEALTH &bull; EST. 2026
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#101A2E] border border-[#2563EB]/40 rounded text-[10px] text-[#38BDF8] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>LEVEL 3 CLEARANCE // WALL STREET DESK</span>
              </div>
            </div>

            {/* Prestige Pitch */}
            <div className="space-y-2">
              <h1 className="text-lg sm:text-xl font-bold text-[#F8FAFC] tracking-tight leading-snug">
                Institutional Credit Risk &amp; Solvency Intelligence
              </h1>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Premier institutional underwriting terminal deployed for corporate debt syndicates, sovereign risk desks, and Investment Committees.
              </p>
            </div>

            {/* 4 Pillars of Wall Street Clearance */}
            <div className="space-y-2.5 pt-2 border-t border-[#1E293B]">
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded bg-[#131F37] border border-[#2563EB]/40 flex items-center justify-center text-[#38BDF8] shrink-0 mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#F8FAFC]">Multi-Period Audited Financials</div>
                  <div className="text-[10px] text-[#64748B]">Regulatory XBRL disclosures across NSE, BSE, NASDAQ &amp; NYSE.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded bg-[#131F37] border border-[#2563EB]/40 flex items-center justify-center text-[#38BDF8] shrink-0 mt-0.5">
                  <Landmark className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#F8FAFC]">Monetary Transmission Shock Lab</div>
                  <div className="text-[10px] text-[#64748B]">Real-time RBI Repo Rate (5.50%) &amp; US Fed Funds stress testing.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded bg-[#131F37] border border-[#2563EB]/40 flex items-center justify-center text-[#38BDF8] shrink-0 mt-0.5">
                  <FileText className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#F8FAFC]">Boardroom Presentation PDF Deck</div>
                  <div className="text-[10px] text-[#64748B]">1-Click PowerPoint-style underwriting memos with cryptographic seal.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Node Attestation */}
          <div className="pt-4 border-t border-[#1E293B] flex items-center justify-between text-[10px] text-[#64748B]">
            <span className="flex items-center gap-1.5 text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <span>NODE: MUM-01 // NY-02</span>
            </span>
            <span className="text-[#38BDF8] font-mono">AES-256 VAULT</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Slick Credential Vault (7 cols on lg) */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-5 bg-[#090E17]">
          
          {/* Highlighted VIP 1-Click Guest Analyst Pass */}
          <div className="p-4 bg-gradient-to-r from-[#0F1B33] to-[#0A1224] border border-[#2563EB]/60 rounded-xl space-y-2.5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 px-3 py-0.5 bg-[#2563EB] text-white text-[9px] font-bold uppercase tracking-wider rounded-bl">
              1-CLICK GUEST PASS
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#38BDF8] animate-pulse" />
              <div className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                EXPLORE TERMINAL AS GUEST ANALYST
              </div>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              No registration or password needed. Instantly launch full institutional clearance to inspect all modules, Groww-style charts, and stress simulations.
            </p>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-[1.01]"
            >
              <span>ENTER DIRECTLY AS GUEST</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#1E293B]"></div>
            <span className="flex-shrink mx-3 text-[#64748B] text-[10px] uppercase font-mono tracking-widest">
              OR USE ACCOUNT CREDENTIALS
            </span>
            <div className="flex-grow border-t border-[#1E293B]"></div>
          </div>

          {/* Segmented Sign In / Create Account Toggle */}
          <div className="w-full grid grid-cols-2 gap-1 p-1 bg-[#05070C] border border-[#1E293B] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode("SIGN_IN");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-medium transition-all flex items-center justify-center gap-2 rounded ${
                mode === "SIGN_IN"
                  ? "bg-[#1E293B] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Operator Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("REGISTER");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-medium transition-all flex items-center justify-center gap-2 rounded ${
                mode === "REGISTER"
                  ? "bg-[#1E293B] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Account</span>
            </button>
          </div>

          {/* Error / Success Notifications */}
          {errorMessage && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/50 text-[#EF4444] text-xs flex items-center gap-2.5 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/40 text-[#10B981] text-xs flex items-center gap-2.5 rounded">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* FORM: Operator Sign In */}
          {mode === "SIGN_IN" ? (
            <form onSubmit={handleSignIn} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10.5px] text-[#94A3B8] uppercase font-bold tracking-wider">
                  Username or Email Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    required
                    placeholder="e.g. user@gmail.com or username"
                    className="w-full pl-9 pr-3 py-2 bg-[#05070C] border border-[#1E293B] text-[#F8FAFC] placeholder-[#475569] focus:border-[#3B82F6] focus:outline-none text-xs font-mono rounded transition-colors"
                  />
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] text-[#94A3B8] uppercase font-bold tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showSignInPassword ? "text" : "password"}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    placeholder="Enter security password"
                    className="w-full pl-9 pr-10 py-2 bg-[#05070C] border border-[#1E293B] text-[#F8FAFC] placeholder-[#475569] focus:border-[#3B82F6] focus:outline-none text-xs font-mono rounded transition-colors"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#CBD5E1] transition-colors"
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#94A3B8] hover:text-[#CBD5E1]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#1E293B] bg-[#05070C] text-[#2563EB] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Remember clearance on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#1E293B] hover:bg-[#2563EB] border border-[#3B82F6]/50 text-[#38BDF8] hover:text-white font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>AUTHENTICATING...</span>
                  </span>
                ) : (
                  <>
                    <span>SIGN IN WITH CREDENTIALS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* FORM: Register Account */
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10.5px] text-[#94A3B8] uppercase font-bold tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3 py-2 bg-[#05070C] border border-[#1E293B] text-[#F8FAFC] placeholder-[#475569] focus:border-[#3B82F6] focus:outline-none text-xs font-mono rounded transition-colors"
                  />
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] text-[#94A3B8] uppercase font-bold tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="e.g. user@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-[#05070C] border border-[#1E293B] text-[#F8FAFC] placeholder-[#475569] focus:border-[#3B82F6] focus:outline-none text-xs font-mono rounded transition-colors"
                  />
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10.5px] text-[#94A3B8] uppercase font-bold tracking-wider">
                    Password (8+ chars)
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="Min 8 characters"
                      className="w-full pl-9 pr-8 py-2 bg-[#05070C] border border-[#1E293B] text-[#F8FAFC] placeholder-[#475569] focus:border-[#3B82F6] focus:outline-none text-xs font-mono rounded transition-colors"
                    />
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((prev) => !prev)}
                      className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#CBD5E1] transition-colors"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] text-[#94A3B8] uppercase font-bold tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-3 py-2 bg-[#05070C] border border-[#1E293B] text-[#F8FAFC] placeholder-[#475569] focus:border-[#3B82F6] focus:outline-none text-xs font-mono rounded transition-colors"
                    />
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1 shadow-md"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>REGISTERING...</span>
                  </span>
                ) : (
                  <>
                    <span>CREATE ACCOUNT &amp; PROCEED</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Direct Guest Link at bottom */}
          <div className="text-center pt-1 border-t border-[#1E293B]">
            <button
              onClick={handleGuestLogin}
              className="text-[11px] text-[#94A3B8] hover:text-[#38BDF8] underline transition-colors cursor-pointer"
            >
              Want to skip login? Click here to continue as Guest Analyst
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
