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
  TrendingUp,
  Shield,
  Activity,
  SlidersHorizontal,
} from "lucide-react";

export interface SessionClearance {
  id?: string;
  userName: string;
  userEmail: string;
  analystId: string;
  desk: string;
  role: "SUPER_ADMIN" | "ADMIN" | "LEAD_ANALYST" | "ANALYST" | "DEMO_ANALYST";
  isDemo?: boolean;
  mustChangePassword?: boolean;
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
  const [acceptDisclaimer, setAcceptDisclaimer] = useState(false);

  // Form handling state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password strength calculation
  const hasMinLength = regPassword.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(regPassword);
  const hasNumbers = /[0-9]/.test(regPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(regPassword);
  const strengthScore = [hasMinLength, hasLetters, hasNumbers, hasSpecial].filter(Boolean).length;

  // Continue as Guest (Read-Only Demo Session)
  const handleContinueAsGuest = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDemo: true }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.user) {
        const u = json.user;
        const session: SessionClearance = {
          id: u.id,
          userName: u.name,
          userEmail: u.email,
          analystId: u.name,
          desk: u.desk || "Credit Risk & Surveillance (Demo)",
          role: "DEMO_ANALYST",
          isDemo: true,
          avatarId: u.avatar || "crest",
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
        onAuthenticated(session);
      } else {
        setErrorMessage(json.error || "Guest access is currently unavailable.");
      }
    } catch {
      setErrorMessage("Unable to connect to the authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sign In Submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanIdent = signInIdentifier.trim();
    if (!cleanIdent) {
      setErrorMessage("Please enter your email or username.");
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
          email: cleanIdent,
          password: signInPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Incorrect email or password.");
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
        mustChangePassword: userData.mustChangePassword,
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

  // Create Account Submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!hasMinLength || !hasLetters || !hasNumbers) {
      setErrorMessage("Password must be at least 8 characters and include both letters and numbers.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!acceptDisclaimer) {
      setErrorMessage("Please acknowledge the educational analysis notice before proceeding.");
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
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Registration could not be completed.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Account created successfully. Signing you in...");
      setTimeout(() => {
        if (json.user) {
          const session: SessionClearance = {
            id: json.user.id,
            userName: json.user.name,
            userEmail: json.user.email,
            analystId: json.user.name,
            desk: json.user.desk || "Global Credit Risk & Surveillance",
            role: "ANALYST",
            isDemo: false,
            avatarId: "crest",
            netDebtEbitdaHurdle: 3.5,
            interestCoverageHurdle: 2.5,
            currentRatioHurdle: 1.1,
            sessionToken: json.user.sessionToken,
            authenticatedAt: json.user.authenticatedAt,
          };
          if (typeof window !== "undefined") {
            sessionStorage.setItem("fintraxis_tab_confirmed", "true");
          }
          localStorage.setItem("fintraxis_session", JSON.stringify(session));
          onAuthenticated(session);
        }
      }, 700);
    } catch {
      setErrorMessage("Unable to reach the server. Please check your connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B12] text-[#F3F6FC] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-[#3867F5]/30">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-[#101621] border border-[#253247] shadow-2xl rounded-2xl overflow-hidden">
        {/* =========================================================================
            LEFT PANEL: BRAND & VALUE PROPOSITION (DESKTOP) / COMPACT BRAND (MOBILE)
           ========================================================================= */}
        <div className="lg:col-span-5 bg-[#151E2D] p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#253247] relative overflow-hidden order-2 lg:order-1">
          {/* Top Brand & Headlines */}
          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <PeacockLogo size="md" showLockup={false} />
              <div>
                <span className="font-mono font-bold tracking-widest text-base text-[#F3F6FC]">
                  FINTRAXIS
                </span>
                <span className="block text-[10px] font-mono text-[#38BDF8] tracking-wider uppercase">
                  Corporate Financial Intelligence
                </span>
              </div>
            </div>

            <div className="mt-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#F3F6FC] leading-snug">
                Understand the numbers behind the risk.
              </h1>
              <p className="text-xs text-[#9AA8BC] mt-2 leading-relaxed">
                Financial health, early-warning signals and stress tests, explained in plain language.
              </p>
            </div>

            {/* Restrained Abstract Line-Chart Graphic */}
            <div className="w-full h-12 overflow-hidden relative my-2 rounded-lg bg-[#101621] border border-[#253247] flex items-center px-2">
              <svg className="w-full h-8" viewBox="0 0 320 28" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="restrainedLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3867F5" stopOpacity="0.3" />
                    <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#16A879" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 18 Q 40 8, 80 14 T 160 10 T 240 20 T 320 6"
                  fill="none"
                  stroke="url(#restrainedLineGrad)"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* 3 Short Feature Lines */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-[#3867F5]/20 flex items-center justify-center text-[#38BDF8] shrink-0 mt-0.5">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#F3F6FC]">Financial health</div>
                  <div className="text-[11px] text-[#9AA8BC] leading-normal">
                    Audit leverage, coverage, and working capital across multiple fiscal periods.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-[#F5B942]/20 flex items-center justify-center text-[#F5B942] shrink-0 mt-0.5">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#F3F6FC]">Risk monitoring</div>
                  <div className="text-[11px] text-[#9AA8BC] leading-normal">
                    Detect balance sheet vulnerabilities, concentration risks, and counterparty exposure.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-[#16A879]/20 flex items-center justify-center text-[#16A879] shrink-0 mt-0.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#F3F6FC]">Stress testing</div>
                  <div className="text-[11px] text-[#9AA8BC] leading-normal">
                    Simulate revenue shocks and interest rate shifts with pure mathematical models.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Integrity Stamp */}
          <div className="mt-6 pt-4 border-t border-[#253247] text-[10px] text-[#9AA8BC] flex items-center justify-between font-mono">
            <span>FINTRAXIS PLATFORM</span>
            <span className="text-[#38BDF8]">VERIFIED METHODOLOGY</span>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: SIGN IN / CREATE ACCOUNT / CONTINUE AS GUEST
           ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-[#101621] order-1 lg:order-2">
          <div className="max-w-md w-full mx-auto flex flex-col gap-4">
            {/* Header Switcher Tabs */}
            <div className="flex p-1 bg-[#151E2D] border border-[#253247] rounded-lg font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode("SIGN_IN");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "SIGN_IN"
                    ? "bg-[#3867F5] text-white font-bold shadow-sm"
                    : "text-[#9AA8BC] hover:text-[#F3F6FC]"
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
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "REGISTER"
                    ? "bg-[#3867F5] text-white font-bold shadow-sm"
                    : "text-[#9AA8BC] hover:text-[#F3F6FC]"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Session Notice */}
            {initialMessage && !errorMessage && !successMessage && (
              <div className="p-3 bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] text-xs rounded-xl flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[#38BDF8]" />
                <span className="leading-relaxed">{initialMessage}</span>
              </div>
            )}

            {/* Error or Success Alert */}
            {errorMessage && (
              <div className="p-3 bg-[#F05252]/10 border border-[#F05252]/30 text-[#F05252] text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-[#16A879]/10 border border-[#16A879]/30 text-[#16A879] text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* FORM: SIGN IN */}
            {mode === "SIGN_IN" ? (
              <form onSubmit={handleSignIn} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signin-ident" className="text-xs font-medium text-[#F3F6FC]">
                    Email or Username
                  </label>
                  <div className="relative">
                    <input
                      id="signin-ident"
                      type="text"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      placeholder="e.g. analyst@firm.com or username"
                      className="w-full px-3.5 py-2.5 bg-[#151E2D] border border-[#253247] rounded-xl text-xs text-white placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5] transition-colors"
                      autoComplete="username"
                      disabled={isLoading}
                    />
                    <Mail className="w-4 h-4 text-[#5A687D] absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signin-password" className="text-xs font-medium text-[#F3F6FC]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signin-password"
                      type={showSignInPassword ? "text" : "password"}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#151E2D] border border-[#253247] rounded-xl text-xs text-white placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5] transition-colors pr-10"
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-2 top-2 text-[#5A687D] hover:text-white p-1.5 transition-colors cursor-pointer"
                      aria-label={showSignInPassword ? "Hide password" : "Show password"}
                    >
                      {showSignInPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#3867F5] hover:bg-[#2F57D4] disabled:opacity-60 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md mt-1 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* FORM: CREATE ACCOUNT */
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-name" className="text-xs font-medium text-[#F3F6FC]">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      id="reg-name"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full px-3.5 py-2 bg-[#151E2D] border border-[#253247] rounded-xl text-xs text-white placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5]"
                      disabled={isLoading}
                    />
                    <User className="w-4 h-4 text-[#5A687D] absolute right-3.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-email" className="text-xs font-medium text-[#F3F6FC]">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="analyst@firm.com"
                      className="w-full px-3.5 py-2 bg-[#151E2D] border border-[#253247] rounded-xl text-xs text-white placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5]"
                      disabled={isLoading}
                    />
                    <Mail className="w-4 h-4 text-[#5A687D] absolute right-3.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-pass" className="text-xs font-medium text-[#F3F6FC]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="reg-pass"
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full px-3.5 py-2 bg-[#151E2D] border border-[#253247] rounded-xl text-xs text-white placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5] pr-9"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2 top-2 text-[#5A687D] hover:text-white p-1"
                        aria-label={showRegPassword ? "Hide password" : "Show password"}
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-confirm" className="text-xs font-medium text-[#F3F6FC]">
                      Confirm Password
                    </label>
                    <input
                      id="reg-confirm"
                      type={showRegPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      className="w-full px-3.5 py-2 bg-[#151E2D] border border-[#253247] rounded-xl text-xs text-white placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5]"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Strength Meter & Rules */}
                <div className="p-2.5 bg-[#151E2D] border border-[#253247] rounded-lg flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#9AA8BC]">Password strength:</span>
                    <span className={`font-mono font-bold ${
                      strengthScore >= 3 ? "text-[#16A879]" : strengthScore === 2 ? "text-[#F5B942]" : "text-[#F05252]"
                    }`}>
                      {strengthScore >= 3 ? "Strong" : strengthScore === 2 ? "Moderate" : "Weak"}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#101621] rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 ${hasMinLength ? "bg-[#16A879]" : "bg-[#253247]"}`} />
                    <div className={`h-full flex-1 ${hasLetters ? "bg-[#16A879]" : "bg-[#253247]"}`} />
                    <div className={`h-full flex-1 ${hasNumbers ? "bg-[#16A879]" : "bg-[#253247]"}`} />
                    <div className={`h-full flex-1 ${hasSpecial ? "bg-[#16A879]" : "bg-[#253247]"}`} />
                  </div>
                  <div className="text-[10px] text-[#9AA8BC]">
                    Rule: minimum 8 characters, mix of letters and numbers.
                  </div>
                </div>

                {/* Educational Disclaimer Acceptance */}
                <label className="flex items-start gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={acceptDisclaimer}
                    onChange={(e) => setAcceptDisclaimer(e.target.checked)}
                    className="mt-0.5 rounded border-[#253247] bg-[#151E2D] text-[#3867F5] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-[#9AA8BC] leading-tight">
                    I understand this is an educational corporate credit analysis tool, not investment advice.
                  </span>
                </label>

                {/* Primary Create Account Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#3867F5] hover:bg-[#2F57D4] disabled:opacity-60 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md mt-1 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Divider "or" */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#253247]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-[#101621] px-3 text-[#9AA8BC]">or</span>
              </div>
            </div>

            {/* Continue as Guest Button */}
            <button
              type="button"
              onClick={handleContinueAsGuest}
              disabled={isLoading}
              className="w-full p-3 bg-[#151E2D] hover:bg-[#1D293D] border border-[#253247] hover:border-[#38BDF8] rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#3867F5]/20 flex items-center justify-center text-[#38BDF8]">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-[#F3F6FC] group-hover:text-[#38BDF8] transition-colors">
                    Continue as Guest
                  </span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 bg-[#3867F5]/10 text-[#38BDF8] border border-[#3867F5]/30 rounded font-bold">
                  GUEST / DEMO
                </span>
              </div>
              <div className="text-[11px] text-[#9AA8BC] leading-normal">
                Read-only demo session: inspect balance sheets, solvency health, and stress tests.
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
