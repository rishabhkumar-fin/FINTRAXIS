"use client";

import Link from "next/link";
import { PeacockLogo } from "@/components/PeacockLogo";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070A0F] text-[#F8FAFC] flex flex-col items-center justify-center p-4 font-mono select-none">
      <div className="max-w-md w-full bg-[#0C111C] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-5">
        <PeacockLogo size="lg" showLockup={false} />

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded text-[#EF4444] text-[11px] font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>404 // UNKNOWN DESTINATION</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-2">
            Workstation Route Not Found
          </h1>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            The requested terminal path or financial resource does not exist in the active security registry.
          </p>
        </div>

        <div className="w-full pt-3 border-t border-[#1E293B]">
          <Link
            href="/"
            className="w-full min-h-[44px] px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Terminal Login</span>
          </Link>
        </div>

        <div className="text-[10px] text-[#64748B]">
          FINTRAXIS INSTITUTIONAL SURVEILLANCE &bull; SYSTEM DIRECTORY
        </div>
      </div>
    </div>
  );
}
