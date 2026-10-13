"use client";

import React, { useState } from "react";
import { PeacockLogo } from "./PeacockLogo";
import { Lock, ArrowRight, UserPlus, LogIn, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

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

  // Sign In State (empty by default for user's own email/password)
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

      localStorage.setItem("fintraxis_session", JSON.stringify(session));
      setIsLoading(false);
      onAuthenticated(session);
    } catch (err: unknown) {
      console.error("Registration network error:", err);
      setErrorMessage("Network error creating account.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080B10] text-[#F8FAFC] flex flex-col items-center justify-center p-4 select-none font-mono">
      {/* Background radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(#1E2536 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-[#0D111A] border border-[#1E2536] shadow-2xl z-10 rounded-lg overflow-hidden">
        {/* Brand Header */}
        <div className="p-7 bg-[#090D14] border-b border-[#1E2536] flex flex-col items-center text-center">
          <PeacockLogo size="md" showLockup={true} />
          <p className="text-[11px] tracking-widest text-[#94A3B8] uppercase font-mono mt-2">
            Risk &amp; Financial Intelligence Terminal
          </p>

          {/* Clean Segmented Tab Switcher */}
          <div className="w-full grid grid-cols-2 gap-1 p-1 bg-[#06080D] border border-[#1E2536] mt-5 rounded">
            <button
              type="button"
              onClick={() => {
                setMode("SIGN_IN");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-mono font-medium transition-all flex items-center justify-center gap-2 rounded ${
                mode === "SIGN_IN"
                  ? "bg-[#172033] text-[#C5A880] border border-[#C5A880]/30 shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
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
              className={`py-2 text-xs font-mono font-medium transition-all flex items-center justify-center gap-2 rounded ${
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

        {/* Form Container */}
        <div className="p-7 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-[#F43F5E]/10 border border-[#F43F5E]/40 text-[#F43F5E] text-xs flex items-center gap-2.5 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/40 text-[#10B981] text-xs flex items-center gap-2.5 rounded">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {mode === "SIGN_IN" ? (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#94A3B8] uppercase tracking-wide font-medium">
                  Username or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    required
                    placeholder="Enter your username or email"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#06080D] border border-[#1E2536] text-[#F8FAFC] placeholder-[#475569] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded transition-colors"
                  />
                  <User className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-[#94A3B8] uppercase tracking-wide font-medium">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showSignInPassword ? "text" : "password"}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#06080D] border border-[#1E2536] text-[#F8FAFC] placeholder-[#475569] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded transition-colors"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-[#64748B] hover:text-[#CBD5E1] transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#94A3B8] hover:text-[#CBD5E1] text-[11px]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#1E2536] bg-[#06080D] text-[#C5A880] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-3 bg-[#C5A880] hover:bg-[#D4B996] text-[#080B10] font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 rounded shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#080B10] border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  <>
                    <span>Sign In to Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* 1-Click Guest Analyst Account Button */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#1E2536]"></div>
                <span className="flex-shrink mx-3 text-[#5A687D] text-[10px] uppercase font-mono tracking-wider">Or Instant Access</span>
                <div className="flex-grow border-t border-[#1E2536]"></div>
              </div>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-2.5 bg-[#12161F] hover:bg-[#1A2233] border border-[#232B3A] hover:border-[#C5A880] text-[#C5A880] font-bold text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer rounded"
              >
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>Explore as Guest Analyst (1-Click)</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] text-[#94A3B8] uppercase tracking-wide font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="e.g. Alex Morgan or Jane Doe"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#06080D] border border-[#1E2536] text-[#F8FAFC] placeholder-[#475569] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded transition-colors"
                  />
                  <User className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#94A3B8] uppercase tracking-wide font-medium">
                  Username or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="Enter your email or preferred username"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#06080D] border border-[#1E2536] text-[#F8FAFC] placeholder-[#475569] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded transition-colors"
                  />
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-[#94A3B8] uppercase tracking-wide font-medium">
                    Create Password
                  </label>
                  {regPassword && (
                    <span className={`text-[9.5px] font-bold ${
                      regPassword.length >= 12 && /[A-Z]/.test(regPassword) && /\d/.test(regPassword) && /[^a-zA-Z0-9]/.test(regPassword)
                        ? "text-[#10B981]"
                        : regPassword.length >= 8 && /[A-Z]/.test(regPassword) && /\d/.test(regPassword)
                        ? "text-[#38BDF8]"
                        : regPassword.length >= 8
                        ? "text-[#F59E0B]"
                        : "text-[#F43F5E]"
                    }`}>
                      {regPassword.length >= 12 && /[A-Z]/.test(regPassword) && /\d/.test(regPassword) && /[^a-zA-Z0-9]/.test(regPassword)
                        ? "INSTITUTIONAL GRADE (AES-256)"
                        : regPassword.length >= 8 && /[A-Z]/.test(regPassword) && /\d/.test(regPassword)
                        ? "STRONG"
                        : regPassword.length >= 8
                        ? "MODERATE"
                        : "WEAK"}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="Min 8 chars, uppercase, number & symbol"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#06080D] border border-[#1E2536] text-[#F8FAFC] placeholder-[#475569] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded transition-colors"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-[#64748B] hover:text-[#CBD5E1] transition-colors"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter Bar */}
                {regPassword && (
                  <div className="pt-1 space-y-1">
                    <div className="w-full bg-[#111622] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          regPassword.length >= 12 && /[A-Z]/.test(regPassword) && /\d/.test(regPassword) && /[^a-zA-Z0-9]/.test(regPassword)
                            ? "bg-[#10B981] w-full"
                            : regPassword.length >= 8 && /[A-Z]/.test(regPassword) && /\d/.test(regPassword)
                            ? "bg-[#38BDF8] w-3/4"
                            : regPassword.length >= 8
                            ? "bg-[#F59E0B] w-1/2"
                            : "bg-[#F43F5E] w-1/4"
                        }`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[9px] text-[#64748B] pt-0.5">
                      <span className={regPassword.length >= 8 ? "text-[#10B981]" : ""}>
                        {regPassword.length >= 8 ? "✓" : "•"} 8+ chars
                      </span>
                      <span className={/[A-Z]/.test(regPassword) && /[a-z]/.test(regPassword) ? "text-[#10B981]" : ""}>
                        {/[A-Z]/.test(regPassword) && /[a-z]/.test(regPassword) ? "✓" : "•"} Upper &amp; lower
                      </span>
                      <span className={/\d/.test(regPassword) ? "text-[#10B981]" : ""}>
                        {/\d/.test(regPassword) ? "✓" : "•"} Number
                      </span>
                      <span className={/[^a-zA-Z0-9]/.test(regPassword) ? "text-[#10B981]" : ""}>
                        {/[^a-zA-Z0-9]/.test(regPassword) ? "✓" : "•"} Symbol (!@#$)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#94A3B8] uppercase tracking-wide font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#06080D] border border-[#1E2536] text-[#F8FAFC] placeholder-[#475569] focus:border-[#C5A880] focus:outline-none text-xs font-mono rounded transition-colors"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-3 bg-[#C5A880] hover:bg-[#D4B996] text-[#080B10] font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 rounded shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#080B10] border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* 1-Click Guest Analyst Account Button */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#1E2536]"></div>
                <span className="flex-shrink mx-3 text-[#5A687D] text-[10px] uppercase font-mono tracking-wider">Or Instant Access</span>
                <div className="flex-grow border-t border-[#1E2536]"></div>
              </div>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-2.5 bg-[#12161F] hover:bg-[#1A2233] border border-[#232B3A] hover:border-[#C5A880] text-[#C5A880] font-bold text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer rounded"
              >
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>Explore as Guest Analyst (1-Click)</span>
              </button>
            </form>
          )}

          {/* Secure Session Footer */}
          <div className="pt-3 border-t border-[#1E2536] flex flex-col gap-1 text-[10px] text-[#64748B]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#10B981]">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                <span className="font-bold">256-BIT SHA-256 CLEARANCE</span>
              </div>
              <span className="font-mono text-[#C5A880]">ZERO-KNOWLEDGE AUTH</span>
            </div>
            <div className="text-[9px] text-[#5A687D]">
              All analyst sessions are cryptographically tokenized &amp; isolated in memory.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
