"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, CornerDownLeft, Lock, Cpu, FileText, Sliders } from "lucide-react";
import { ModuleTab } from "./NavigationTabs";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCompany: (ticker: string) => void;
  onSelectTab: (tab: ModuleTab) => void;
  onLockSession: () => void;
  onExportMemo: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectCompany,
  onSelectTab,
  onLockSession,
  onExportMemo,
}: CommandPaletteProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setInput("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecute = (cmdStr?: string) => {
    const raw = (cmdStr || input).trim().toUpperCase();
    if (!raw) return;

    // Syntax 1: TICKER <GO> (e.g. "NVDA <GO>", "AAPL <GO>")
    if (raw.endsWith("<GO>") || raw.endsWith(" GO")) {
      const ticker = raw.replace("<GO>", "").replace("GO", "").trim();
      if (ticker) {
        onSelectCompany(ticker);
        onClose();
        return;
      }
    }

    // Syntax 2: Numbers 1 - 8 & Module Keywords
    if (raw === "0" || raw === "ADMIN" || raw.includes("ADMIN") || raw === "GO ADMIN") {
      onSelectTab("00_ADMIN");
      onClose();
      return;
    }
    if (raw === "1" || raw.includes("HUB") || raw.includes("COMPANY") || raw.includes("SECURITY")) {
      onSelectTab("01_HUB");
      onClose();
      return;
    }
    if (raw === "2" || raw.includes("STATEMENT") || raw.includes("HEALTH") || raw.includes("XBRL") || raw.includes("RATIO")) {
      onSelectTab("02_HEALTH");
      onClose();
      return;
    }
    if (raw === "3" || raw.includes("VULNERABILITY") || raw.includes("EWS") || raw.includes("EARLY WARNING")) {
      onSelectTab("03_VULNERABILITY");
      onClose();
      return;
    }
    if (raw === "4" || raw.includes("DEPENDENC") || raw.includes("SUPPLIER") || raw.includes("SOURCING")) {
      onSelectTab("04_DEPENDENCIES");
      onClose();
      return;
    }
    if (raw === "5" || raw.includes("CONCENTRATION") || raw.includes("EXPOSURE") || raw.includes("HHI") || raw.includes("SEGMENT")) {
      onSelectTab("05_CONCENTRATION");
      onClose();
      return;
    }
    if (raw === "6" || raw === "STRESS" || raw.includes("SIMULAT") || raw.includes("SHOCK")) {
      onSelectTab("06_SIMULATOR");
      onClose();
      return;
    }
    if (raw === "7" || raw.includes("MEMO") || raw.includes("DOSSIER") || raw.includes("REPORT")) {
      onSelectTab("07_REPORTS");
      onClose();
      return;
    }
    if (raw === "8" || raw === "OVERVIEW" || raw.includes("OVERVIEW") || raw.includes("DASHBOARD")) {
      onSelectTab("overview");
      onClose();
      return;
    }

    // Syntax 3: Actions
    if (raw === "EXPORT MEMO" || raw === "EXPORT" || raw === "PRINT") {
      onSelectTab("07_REPORTS");
      setTimeout(onExportMemo, 150);
      onClose();
      return;
    }

    if (raw === "LOCK" || raw === "LOGOUT" || raw === "TERMINATE") {
      onLockSession();
      onClose();
      return;
    }

    // Fallback: If looks like a ticker symbol, treat as <GO>
    onSelectCompany(raw);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleExecute();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-24 px-4 font-mono select-none">
      <div
        className="w-full max-w-2xl bg-[#0A0D12] border border-[#38BDF8] shadow-[0_0_50px_rgba(212,175,55,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Command Input Bar */}
        <div className="p-3 bg-[#12161F] border-b border-[#232B3A] flex items-center gap-3">
          <Terminal className="w-4 h-4 text-[#38BDF8]" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="TYPE COMMAND (e.g. NVDA <GO>, STRESS, EXPORT MEMO, LOCK, 1-6)..."
            className="w-full bg-transparent text-xs text-[#E1E7EC] font-mono placeholder-[#5A687D] focus:outline-none uppercase"
          />
          <button
            onClick={() => handleExecute()}
            className="px-2 py-1 bg-[#38BDF8] hover:bg-[#60A5FA] text-[#07090E] font-bold text-[10px] flex items-center gap-1 transition-colors"
          >
            <span>EXEC</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>

        {/* Suggested Institutional Shortcuts */}
        <div className="p-3 bg-[#07090E] space-y-2 text-xs">
          <div className="text-[10px] text-[#5A687D] uppercase font-bold tracking-wider">
            BLOOMBERG TERMINAL SYNTAX GUIDE:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleExecute("NVDA <GO>")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#38BDF8] font-bold">NVDA &lt;GO&gt;</span>
              <span className="text-[10px] text-[#5A687D]">LOAD NVIDIA TICKER</span>
            </button>

            <button
              onClick={() => handleExecute("RELIANCE.NS <GO>")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#38BDF8] font-bold">RELIANCE.NS &lt;GO&gt;</span>
              <span className="text-[10px] text-[#5A687D]">LOAD RELIANCE NSE</span>
            </button>

            <button
              onClick={() => handleExecute("STRESS")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#EF4444] font-bold flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                <span>STRESS</span>
              </span>
              <span className="text-[10px] text-[#5A687D]">MACRO STRESS LAB</span>
            </button>

            <button
              onClick={() => handleExecute("EXPORT MEMO")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#10B981] font-bold flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>EXPORT MEMO</span>
              </span>
              <span className="text-[10px] text-[#5A687D]">PRINT IC DOSSIER</span>
            </button>

            <button
              onClick={() => handleExecute("1")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#E1E7EC] font-bold">[1] COMPANY HUB</span>
              <span className="text-[10px] text-[#5A687D]">MODULE 1</span>
            </button>

            <button
              onClick={() => handleExecute("2")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#E1E7EC] font-bold">[2] FINANCIAL HEALTH</span>
              <span className="text-[10px] text-[#5A687D]">MODULE 2</span>
            </button>

            <button
              onClick={() => handleExecute("3")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#E1E7EC] font-bold">[3] VULNERABILITY</span>
              <span className="text-[10px] text-[#5A687D]">MODULE 3</span>
            </button>

            <button
              onClick={() => handleExecute("4")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#E1E7EC] font-bold">[4] DEPENDENCIES</span>
              <span className="text-[10px] text-[#5A687D]">MODULE 4</span>
            </button>

            <button
              onClick={() => handleExecute("5")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#E1E7EC] font-bold">[5] CONCENTRATION</span>
              <span className="text-[10px] text-[#5A687D]">MODULE 5</span>
            </button>

            <button
              onClick={() => handleExecute("6")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#E1E7EC] font-bold">[6] SIMULATOR</span>
              <span className="text-[10px] text-[#5A687D]">MODULE 6</span>
            </button>

            <button
              onClick={() => handleExecute("ADMIN")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#3867F5]/40 text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#38BDF8] font-bold flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                <span>ADMIN CONSOLE</span>
              </span>
              <span className="text-[10px] text-[#5A687D]">GOVERNANCE</span>
            </button>

            <button
              onClick={() => handleExecute("LOCK")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#EF4444]/40 text-left flex items-center justify-between transition-colors"
            >
              <span className="text-[#EF4444] font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>LOCK</span>
              </span>
              <span className="text-[10px] text-[#5A687D]">DROP CREDENTIALS</span>
            </button>
          </div>
        </div>

        {/* Modal Footer Keybinds */}
        <div className="p-2.5 bg-[#05070A] border-t border-[#1E2638] flex items-center justify-between text-[10px] text-[#5A687D]">
          <span>PRESS ESC TO DISMISS</span>
          <span className="text-[#38BDF8]">HOTKEY: CTRL + K / CMD + K</span>
        </div>
      </div>
    </div>
  );
}
