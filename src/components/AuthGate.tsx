"use client";

import React, { useState } from "react";
import { PeacockLogo } from "./PeacockLogo";
import {
  ArrowRight,
  UserPlus,
  LogIn,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Sliders,
  TrendingUp,
  Lock,
} from "lucide-react";

export interface SessionClearance {
  id?: string;
  userName: string;
  userEmail: string;
  analystId: string;
  desk: string;
  role: "SUPER_ADMIN" | "ADMIN" | "LEAD_ANALYST" | "ANALYST" | "DEMO_ANALYST";
  isDemo?: boolean;
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
  initialMessage?: string | null;
}

export function AuthGate({ onAuthenticated, initialMessage }: AuthGateProps) {
  const [mode, setMode] = useState<"SIGN_IN" | "REGISTER">("SIGN_IN");

  // Sign In State
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Registration State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick 1-Click Login (Analyst or Admin)
  const handleQuickRoleLogin = async (roleType: "ANALYST" | "ADMIN") => {
    setIsLoading(true);
    setErrorMessage(null);

    const email = roleType === "ADMIN" ? "admin@fintraxis.local" : "analyst@fintraxis.local";
    const password = roleType === "ADMIN" ? "admin123" : "analyst123";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.user) {
        const u = json.user;
        const session: SessionClearance = {
          id: u.id,
          userName: u.name,
          userEmail: u.email,
          analystId: u.name,
          desk: u.desk || (roleType === "ADMIN" ? "Global Systems & Risk Governance" : "Credit Risk & Underwriting"),
          role: u.role || (roleType === "ADMIN" ? "SUPER_ADMIN" : "ANALYST"),
          isDemo: false,
          avatarId: u.avatar || (roleType === "ADMIN" ? "security" : "crest"),
          netDebtEbitdaHurdle: u.netDebtEbitdaHurdle ?? 3.5,
          interestCoverageHurdle: u.interestCoverageHurdle ?? 2.5,
          currentRatioHurdle: u.currentRatioHurdle ?? 1.1,
          sessionToken: u.sessionToken,
          authenticatedAt: u.authenticatedAt,
        };

        if (typeof window !== "undefined") {
          sessionStorage.setItem("fintraxis_tab_confirmed", "true");
        }
        localStorage.setItem("fintraxis_session", JSON.stringify(session));
        setIsLoading(false);
        onAuthenticated(session);
        return;
      }
    } catch {
      // Fallback local session if server route fails
    }

    // Direct local fallback session
    const fallbackSession: SessionClearance = {
      id: roleType === "ADMIN" ? "usr_admin_local" : "usr_analyst_local",
      userName: roleType === "ADMIN" ? "Institutional Administrator" : "Sarah Jenkins",
      userEmail: email,
      analystId: roleType === "ADMIN" ? "Admin Operator" : "Credit Analyst",
      desk: roleType === "ADMIN" ? "Global Systems & Risk Governance" : "Credit Risk & Underwriting",
      role: roleType === "ADMIN" ? "SUPER_ADMIN" : "ANALYST",
      isDemo: false,
      avatarId: roleType === "ADMIN" ? "security" : "crest",
      netDebtEbitdaHurdle: 3.5,
      interestCoverageHurdle: 2.5,
      currentRatioHurdle: 1.1,
      sessionToken: `tok_local_${Date.now()}`,
      authenticatedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("fintraxis_tab_confirmed", "true");
    }
    localStorage.setItem("fintraxis_session", JSON.stringify(fallbackSession));
    setIsLoading(false);
    onAuthenticated(fallbackSession);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanIdent = signInIdentifier.trim();
    if (!cleanIdent) {
      setErrorMessage("Please enter your email or username");
      return;
    }

    if (!signInPassword) {
      setErrorMessage("Please enter your password");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanIdent,
          password: signInPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      const userData = json.user;
      const session: SessionClearance = {
        id: userData.id,
        userName: userData.name,
        userEmail: userData.email,
        analystId: userData.name,
        desk: userData.desk || "Global Credit Risk & Surveillance",
        role: userData.role || (cleanIdent.includes("admin") ? "SUPER_ADMIN" : "ANALYST"),
        isDemo: Boolean(userData.isDemo),
        avatarId: userData.avatar || "crest",
        netDebtEbitdaHurdle: userData.netDebtEbitdaHurdle ?? 3.5,
        interestCoverageHurdle: userData.interestCoverageHurdle ?? 2.5,
        currentRatioHurdle: userData.currentRatioHurdle ?? 1.1,
        sessionToken: userData.sessionToken,
        authenticatedAt: userData.authenticatedAt,
      };

      if (typeof window !== "undefined") {
        sessionStorage.setItem("fintraxis_tab_confirmed", "true");
      }
      localStorage.setItem("fintraxis_session", JSON.stringify(session));
      setIsLoading(false);
      onAuthenticated(session);
    } catch {
      setErrorMessage("Unable to connect to the authentication server.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim()) {
      setErrorMessage("Please enter your full name");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match");
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
          desk: "Credit Risk & Underwriting",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Registration could not be completed.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Account created successfully. You can now sign in.");
      setMode("SIGN_IN");
      setSignInIdentifier(regEmail.trim());
      setSignInPassword("");
      setIsLoading(false);
    } catch {
      setErrorMessage("Unable to reach the server. Please check your connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#38BDF8]/30">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-[#0C111C] border border-[#1E293B] shadow-2xl rounded-2xl overflow-hidden">
        {/* =========================================================================
            LEFT COLUMN: BRAND INTRODUCTION & PROBLEM-SOLVING VALUE
           ========================================================================= */}
        <div className="lg:col-span-5 bg-[#090D16] p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#1E293B] relative overflow-hidden">
          {/* Subtle Ambient Gradient Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand & Headlines */}
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <PeacockLogo size="md" showLockup={false} />
              <div>
                <span className="font-mono font-bold tracking-widest text-sm text-white">
                  FINTRAXIS
                </span>
                <span className="block text-[10px] font-mono text-[#38BDF8] tracking-wider uppercase">
                  Institutional Risk Terminal
                </span>
              </div>
            </div>

            <div className="mt-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                Welcome to FINTRAXIS
              </h1>
              <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                Understand financial performance. Identify risk. Make informed decisions.
              </p>
            </div>

            {/* Subtle Institutional Moving Financial Line Animation */}
            <div className="w-full h-8 overflow-hidden relative my-1 rounded bg-[#070A10]/60 border border-[#1E293B]/60 flex items-center">
              <svg className="w-full h-full" viewBox="0 0 400 32" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="finLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 20 Q 50 8, 100 16 T 200 10 T 300 22 T 400 6"
                  fill="none"
                  stroke="url(#finLineGrad)"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  className="animate-pulse"
                />
              </svg>
            </div>

            {/* 3 Core Value Cards */}
            <div className="flex flex-col gap-2.5 mt-2">
              <div className="flex items-start gap-3 p-3 bg-[#111827]/70 border border-[#1E293B] rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-[#2563EB]/20 flex items-center justify-center text-[#38BDF8] shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">3 Core Credit Solvency Ratios</div>
                  <div className="text-[11px] text-[#94A3B8] leading-normal">
                    Net Debt / EBITDA, Interest Coverage, and Current Ratio computed with zero formula errors.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#111827]/70 border border-[#1E293B] rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shrink-0 mt-0.5">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Macro Stress Simulator</div>
                  <div className="text-[11px] text-[#94A3B8] leading-normal">
                    Two-slider scenario testing: rate hikes (+0.5% to +3.0%) &amp; revenue shocks (-5% to -25%).
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#111827]/70 border border-[#1E293B] rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-[#10B981]/20 flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">1-Click Underwriting Memo</div>
                  <div className="text-[11px] text-[#94A3B8] leading-normal">
                    Printable 1-page executive tearsheet with cryptographic SHA-256 integrity stamp.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance Note */}
          <div className="mt-6 pt-4 border-t border-[#1E293B]/60 text-[11px] text-[#64748B] flex items-center justify-between font-mono">
            <span>LOCAL DATABASE ACTIVE</span>
            <span className="text-[#10B981] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              SQLITE &bull; WAL MODE
            </span>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: 1-CLICK DEMO ACCESS & CREDENTIALS SIGN-IN
           ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-[#0C111C]">
          <div className="max-w-md w-full mx-auto flex flex-col gap-5">
            {/* Form Header */}
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Terminal Access
              </h2>
              <p className="text-xs text-[#94A3B8] mt-1">
                Choose a role for instant 1-click access or enter your operator credentials.
              </p>
            </div>

            {/* Quick 1-Click Role Access Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickRoleLogin("ANALYST")}
                disabled={isLoading}
                className="p-3.5 bg-[#111827] hover:bg-[#1A2333] border border-[#2563EB]/40 hover:border-[#38BDF8] rounded-xl text-left transition-all group cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-[#2563EB]/20 flex items-center justify-center text-[#38BDF8]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30 rounded">
                    ANALYST
                  </span>
                </div>
                <div className="font-bold text-xs text-white group-hover:text-[#38BDF8] transition-colors">
                  Login as Credit Analyst
                </div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5 leading-snug">
                  Research solvency, stress test &amp; export briefs
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin("ADMIN")}
                disabled={isLoading}
                className="p-3.5 bg-[#111827] hover:bg-[#1A2333] border border-[#8B5CF6]/40 hover:border-[#A78BFA] rounded-xl text-left transition-all group cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center text-[#A78BFA]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 rounded">
                    ADMIN
                  </span>
                </div>
                <div className="font-bold text-xs text-white group-hover:text-[#A78BFA] transition-colors">
                  Login as Admin
                </div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5 leading-snug">
                  Manage companies, hurdles &amp; audit trails
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1E293B]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-[#0C111C] px-3 text-[#64748B]">Or sign in with email</span>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-[#111827] border border-[#1E293B] rounded-lg font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode("SIGN_IN");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-center transition-all flex items-center justify-center gap-1.5 ${
                  mode === "SIGN_IN"
                    ? "bg-[#2563EB] text-white font-bold shadow-sm"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("REGISTER");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-center transition-all flex items-center justify-center gap-1.5 ${
                  mode === "REGISTER"
                    ? "bg-[#2563EB] text-white font-bold shadow-sm"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Initial Session Notice (e.g. Inactivity Timeout or Session Expiry) */}
            {initialMessage && !errorMessage && !successMessage && (
              <div className="p-3.5 bg-[#38BDF8]/10 border border-[#38BDF8]/40 text-[#38BDF8] text-xs rounded-xl flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#38BDF8]" />
                <span className="font-medium leading-relaxed">{initialMessage}</span>
              </div>
            )}

            {/* Error or Success Alert */}
            {errorMessage && (
              <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/40 text-[#EF4444] text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/40 text-[#10B981] text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* FORM: SIGN IN */}
            {mode === "SIGN_IN" ? (
              <form onSubmit={handleSignIn} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signin-email" className="text-xs font-medium text-[#E2E8F0]">
                    Email or Username
                  </label>
                  <div className="relative">
                    <input
                      id="signin-email"
                      type="text"
                      inputMode="email"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      placeholder="analyst@fintraxis.local or admin@fintraxis.local"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-base sm:text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] transition-colors"
                      autoComplete="username"
                    />
                    <Mail className="w-4 h-4 text-[#64748B] absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="signin-password" className="text-xs font-medium text-[#E2E8F0]">
                      Password
                    </label>
                    <span className="text-[11px] text-[#38BDF8] font-mono">
                      Default: analyst123 / admin123
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="signin-password"
                      type={showSignInPassword ? "text" : "password"}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-base sm:text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] transition-colors pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-2 top-2 text-[#64748B] hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
                      aria-label={showSignInPassword ? "Hide password" : "Show password"}
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md mt-1 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter Terminal Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* FORM: CREATE ACCOUNT */
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#E2E8F0]">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
                    />
                    <User className="w-4 h-4 text-[#64748B] absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#E2E8F0]">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="analyst@fintraxis.local"
                      className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
                    />
                    <Mail className="w-4 h-4 text-[#64748B] absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#E2E8F0]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-3 text-[#64748B] hover:text-white"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#E2E8F0]">
                      Confirm Password
                    </label>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-type"
                      className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md mt-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
