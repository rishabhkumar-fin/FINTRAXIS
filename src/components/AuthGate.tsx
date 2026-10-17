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
  Sparkles,
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
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
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

  // 1-Click Guest Analyst Access (Isolated Demo Session)
  const handleGuestLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDemo: true }),
      });
      const json = await res.json();
      if (json.success && json.user) {
        const demoUser = json.user;
        const guestSession: SessionClearance = {
          id: demoUser.id,
          userName: demoUser.name,
          userEmail: demoUser.email,
          analystId: "Demo Analyst",
          desk: demoUser.desk,
          role: "DEMO_ANALYST",
          isDemo: true,
          avatarId: "crest",
          netDebtEbitdaHurdle: demoUser.netDebtEbitdaHurdle ?? 3.5,
          interestCoverageHurdle: demoUser.interestCoverageHurdle ?? 2.5,
          currentRatioHurdle: demoUser.currentRatioHurdle ?? 1.1,
          sessionToken: demoUser.sessionToken,
          authenticatedAt: demoUser.authenticatedAt,
        };
        localStorage.setItem("fintraxis_session", JSON.stringify(guestSession));
        setIsLoading(false);
        onAuthenticated(guestSession);
        return;
      }
    } catch {
      // Offline fallback
    }

    const fallbackSession: SessionClearance = {
      id: "usr_demo_session",
      userName: "Demo Analyst",
      userEmail: "demo@fintraxis.terminal",
      analystId: "Demo Analyst",
      desk: "Global Surveillance (Demo Mode)",
      role: "DEMO_ANALYST",
      isDemo: true,
      avatarId: "crest",
      netDebtEbitdaHurdle: 3.5,
      interestCoverageHurdle: 2.5,
      currentRatioHurdle: 1.1,
      sessionToken: `tok_demo_${Date.now()}`,
      authenticatedAt: new Date().toISOString(),
    };
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
      setErrorMessage("Check your email or username");
      return;
    }

    if (!signInPassword) {
      setErrorMessage("Check your password");
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
        setErrorMessage(json.error || "Check your email and password and try again");
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
        role: userData.role || (cleanIdent === "admin" ? "SUPER_ADMIN" : "ANALYST"),
        isDemo: Boolean(userData.isDemo),
        avatarId: userData.avatar || "crest",
        netDebtEbitdaHurdle: userData.netDebtEbitdaHurdle ?? 3.5,
        interestCoverageHurdle: userData.interestCoverageHurdle ?? 2.5,
        currentRatioHurdle: userData.currentRatioHurdle ?? 1.1,
        sessionToken: userData.sessionToken,
        authenticatedAt: userData.authenticatedAt,
      };

      localStorage.setItem("fintraxis_session", JSON.stringify(session));
      setIsLoading(false);
      onAuthenticated(session);
    } catch {
      setErrorMessage("Unable to connect to the server. Please check your internet connection.");
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
          desk: "Global Credit Risk & Surveillance",
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
    <div className="min-h-screen bg-[#080B12] text-[#F3F6FC] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#3867F5]/30">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-[#101621] border border-[#253247] shadow-2xl rounded-xl overflow-hidden">
        {/* =========================================================================
            LEFT COLUMN: BRAND INTRODUCTION & VALUE PROPOSITIONS
           ========================================================================= */}
        <div className="lg:col-span-5 bg-[#0D131C] p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#253247] relative overflow-hidden">
          {/* Subtle Ambient Gradient Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#3867F5]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand & Headlines */}
          <div className="relative z-10 flex flex-col gap-4">
            <PeacockLogo size="lg" showLockup={true} />

            <div className="mt-4">
              <h1 className="text-xl sm:text-2xl font-bold text-[#F3F6FC] leading-tight">
                Understand your company&apos;s financial health.
              </h1>
              <p className="text-sm text-[#9AA8BC] mt-2 leading-relaxed">
                Explore financial results, spot risks, and test what could happen next.
              </p>
            </div>

            {/* Subtle Abstract Financial Chart SVG */}
            <div className="my-3 py-3 border-y border-[#253247]/60">
              <svg viewBox="0 0 340 90" className="w-full h-20 overflow-visible text-[#38BDF8]" fill="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3867F5" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3867F5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal reference grid lines */}
                <line x1="0" y1="20" x2="340" y2="20" stroke="#253247" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="340" y2="50" stroke="#253247" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="340" y2="80" stroke="#253247" strokeDasharray="3 3" />

                {/* Shaded Area under Curve */}
                <path
                  d="M 0,70 Q 50,45 100,55 T 200,30 T 280,38 T 340,15 L 340,90 L 0,90 Z"
                  fill="url(#chartGradient)"
                />
                {/* Smooth Curve */}
                <path
                  d="M 0,70 Q 50,45 100,55 T 200,30 T 280,38 T 340,15"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Pulse Highlight Nodes */}
                <circle cx="200" cy="30" r="3.5" fill="#38BDF8" />
                <circle cx="340" cy="15" r="4" fill="#16A879" />
              </svg>
            </div>

            {/* 3 Concise Benefit Points */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3 p-2 bg-[#151E2D]/80 border border-[#253247] rounded-lg">
                <div className="w-7 h-7 rounded bg-[#3867F5]/20 flex items-center justify-center text-[#38BDF8] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#F3F6FC]">Clear financial data</div>
                  <div className="text-[11px] text-[#9AA8BC]">Direct SEC & XBRL reporting without guesses</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-[#151E2D]/80 border border-[#253247] rounded-lg">
                <div className="w-7 h-7 rounded bg-[#F5B942]/20 flex items-center justify-center text-[#F5B942] shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#F3F6FC]">Early risk signals</div>
                  <div className="text-[11px] text-[#9AA8BC]">Automated debt alerts and solvency hurdles</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-[#151E2D]/80 border border-[#253247] rounded-lg">
                <div className="w-7 h-7 rounded bg-[#16A879]/20 flex items-center justify-center text-[#16A879] shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#F3F6FC]">Simple scenario testing</div>
                  <div className="text-[11px] text-[#9AA8BC]">Simulate interest rate shocks and revenue drops</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance Note */}
          <div className="mt-6 pt-4 border-t border-[#253247]/60 text-[11px] text-[#9AA8BC] flex items-center justify-between font-mono">
            <span>SECURE SYSTEM</span>
            <span className="text-[#16A879]">NODE 24 ACTIVE</span>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: WELCOME & LOGIN / REGISTRATION FORM
           ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-[#101621]">
          <div className="max-w-md w-full mx-auto flex flex-col gap-5">
            {/* Form Header */}
            <div>
              <h2 className="text-2xl font-bold text-[#F3F6FC] tracking-tight">
                Welcome to FINTRAXIS
              </h2>
              <p className="text-xs text-[#9AA8BC] mt-1">
                Sign in with your credentials or explore as a guest analyst.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-[#151E2D] border border-[#253247] rounded-lg font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode("SIGN_IN");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded text-center transition-all flex items-center justify-center gap-1.5 ${
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
                }}
                className={`flex-1 py-1.5 rounded text-center transition-all flex items-center justify-center gap-1.5 ${
                  mode === "REGISTER"
                    ? "bg-[#3867F5] text-white font-bold shadow-sm"
                    : "text-[#9AA8BC] hover:text-[#F3F6FC]"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Error or Success Alert */}
            {errorMessage && (
              <div className="p-3 bg-[#F05252]/10 border border-[#F05252]/50 text-[#F05252] text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-[#16A879]/10 border border-[#16A879]/50 text-[#16A879] text-xs rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* =======================
                FORM: SIGN IN
               ======================= */}
            {mode === "SIGN_IN" ? (
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#F3F6FC]">
                    Email or Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      placeholder="e.g. admin or analyst@fintraxis.terminal"
                      className="w-full px-3.5 py-2.5 bg-[#151E2D] border border-[#253247] rounded-lg text-sm text-[#F3F6FC] placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5] transition-colors"
                      autoComplete="username"
                    />
                    <Mail className="w-4 h-4 text-[#5A687D] absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#F3F6FC]">
                      Password
                    </label>
                    <span className="text-[11px] text-[#38BDF8] font-mono">
                      Default: guest or admin
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSignInPassword ? "text" : "password"}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#151E2D] border border-[#253247] rounded-lg text-sm text-[#F3F6FC] placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5] transition-colors pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-2.5 text-[#5A687D] hover:text-[#F3F6FC] p-0.5 transition-colors"
                      aria-label={showSignInPassword ? "Hide password" : "Show password"}
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#3867F5] hover:bg-[#2c53cb] disabled:opacity-60 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-md mt-1 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Terminal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#253247]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono">
                    <span className="bg-[#101621] px-2 text-[#9AA8BC]">Or continue as</span>
                  </div>
                </div>

                {/* Continue as Guest Button (Sandbox Demo) */}
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#151E2D] hover:bg-[#1a2639] border border-[#253247] text-[#38BDF8] hover:text-white font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Explore as Guest Analyst (Demo Mode)</span>
                </button>
              </form>
            ) : (
              /* =======================
                  FORM: CREATE ACCOUNT
                 ======================= */
              <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#F3F6FC]">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3.5 py-2.5 bg-[#151E2D] border border-[#253247] rounded-lg text-sm text-[#F3F6FC] placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5]"
                    />
                    <User className="w-4 h-4 text-[#5A687D] absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#F3F6FC]">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="analyst@fintraxis.terminal"
                      className="w-full px-3.5 py-2.5 bg-[#151E2D] border border-[#253247] rounded-lg text-sm text-[#F3F6FC] placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5]"
                    />
                    <Mail className="w-4 h-4 text-[#5A687D] absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#F3F6FC]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full px-3.5 py-2.5 bg-[#151E2D] border border-[#253247] rounded-lg text-sm text-[#F3F6FC] placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5] pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-3 text-[#5A687D] hover:text-[#F3F6FC]"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#F3F6FC]">
                      Confirm Password
                    </label>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-type"
                      className="w-full px-3.5 py-2.5 bg-[#151E2D] border border-[#253247] rounded-lg text-sm text-[#F3F6FC] placeholder:text-[#5A687D] focus:outline-none focus:border-[#3867F5]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#3867F5] hover:bg-[#2c53cb] disabled:opacity-60 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-md mt-2 cursor-pointer"
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
