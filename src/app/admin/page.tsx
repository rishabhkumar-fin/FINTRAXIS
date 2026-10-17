"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PeacockLogo } from "@/components/PeacockLogo";
import { AdminConsoleView } from "@/components/AdminConsoleView";
import { SessionClearance } from "@/components/AuthGate";

export default function AdminPage() {
  const [session, setSession] = useState<SessionClearance | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("fintraxis_session");
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch {
        // Fallback session
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#F8FAFC] flex flex-col font-mono selection:bg-[#38BDF8]/30 selection:text-[#FFFFFF]">
      {/* Top Banner Navigation */}
      <header className="h-14 border-b border-[#253247] bg-[#101621] px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-[#38BDF8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Terminal Workspace</span>
          </Link>
          <span className="text-[#253247]">|</span>
          <div className="flex items-center gap-2">
            <PeacockLogo className="w-5 h-5 text-[#3867F5]" />
            <span className="text-xs font-bold tracking-wider text-[#F3F6FC]">FINTRAXIS ADMIN PORTAL</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#9AA8BC]">
          <span>Role:</span>
          <span className="px-2 py-0.5 bg-[#3867F5]/20 text-[#38BDF8] rounded font-bold">
            {session?.role || "SUPER_ADMIN"}
          </span>
        </div>
      </header>

      {/* Main Console Workspace */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        <AdminConsoleView session={session} />
      </main>
    </div>
  );
}
