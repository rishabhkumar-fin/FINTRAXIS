"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Unify admin into main terminal project
    router.replace("/?tab=00_ADMIN");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#F8FAFC] flex items-center justify-center font-mono">
      <div className="flex items-center gap-3 text-xs text-[#38BDF8]">
        <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
        <span>Loading FINTRAXIS Institutional Admin Console...</span>
      </div>
    </div>
  );
}
