"use client";

import { useEffect } from "react";
import { PeacockLogo } from "@/components/PeacockLogo";
import { RotateCcw, AlertTriangle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("FINTRAXIS Runtime Exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#F8FAFC] flex flex-col items-center justify-center p-4 font-mono select-none">
      <div className="max-w-md w-full bg-[#0C111C] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-5">
        <PeacockLogo size="lg" showLockup={false} />

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F59E0B]/15 border border-[#F59E0B]/30 rounded text-[#F59E0B] text-[11px] font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>OPERATIONAL RECOVERY</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-2">
            Workstation Execution Error
          </h1>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            An unexpected error occurred while rendering the credit surveillance canvas. Your session and database records remain protected.
          </p>
        </div>

        <div className="w-full pt-3 border-t border-[#1E293B]">
          <button
            onClick={() => reset()}
            className="w-full min-h-[44px] px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload Workstation State</span>
          </button>
        </div>

        <div className="text-[10px] text-[#64748B]">
          DIGEST: {error.digest || "ERR_RUNTIME_EXCEPTION"}
        </div>
      </div>
    </div>
  );
}
