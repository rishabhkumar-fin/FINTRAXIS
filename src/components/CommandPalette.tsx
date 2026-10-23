"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  CornerDownLeft,
  Cpu,
  FileText,
  Sliders,
  BookOpen,
  Building2,
  Bookmark,
  BookmarkCheck,
  Search,
} from "lucide-react";
import { ModuleTab } from "./NavigationTabs";
import { CompanyEntity } from "@/lib/types";
import { isTickerInWatchlist, toggleTickerInWatchlist } from "@/lib/watchlist";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCompany: (ticker: string) => void;
  onSelectTab: (tab: ModuleTab) => void;
  onLockSession: () => void;
  onExportMemo: () => void;
  onOpenMethodology?: () => void;
  onOpenTour?: () => void;
  onOpenHelp?: () => void;
  companies?: CompanyEntity[];
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectCompany,
  onSelectTab,
  onLockSession,
  onExportMemo,
  onOpenMethodology,
  onOpenTour,
  onOpenHelp,
  companies = [],
}: CommandPaletteProps) {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setInput("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const query = input.trim().toLowerCase();

  // Filter enrolled companies by symbol, name, ISIN, exchange, sector
  const matchedCompanies = query
    ? companies.filter(
        (c) =>
          c.symbol.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.exchange.toLowerCase().includes(query) ||
          c.sector.toLowerCase().includes(query) ||
          (c.isin && c.isin.toLowerCase().includes(query))
      )
    : [];

  if (!isOpen) return null;

  const handleExecute = (cmdStr?: string) => {
    const raw = (cmdStr || input).trim().toUpperCase();
    if (!raw) return;

    // Syntax 1: TICKER <GO> (e.g. "NVDA <GO>", "AAPL <GO>")
    if (raw.endsWith("<GO>") || raw.endsWith(" GO")) {
      const ticker = raw.replace("<GO>", "").replace("GO", "").trim();
      if (ticker) {
        onSelectCompany(ticker);
        onSelectTab("overview");
        onClose();
        return;
      }
    }

    // If matches any company in filtered list
    if (matchedCompanies.length > 0) {
      const target = matchedCompanies[selectedIndex] || matchedCompanies[0];
      onSelectCompany(target.symbol);
      onSelectTab("overview");
      onClose();
      return;
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

    if (raw === "HELP" || raw === "GLOSSARY" || raw.includes("HELP") || raw.includes("GLOSSARY") || raw === "?") {
      if (onOpenHelp) onOpenHelp();
      onClose();
      return;
    }

    if (raw === "METHODOLOGY" || raw.includes("METHOD") || raw.includes("FORMULA")) {
      if (onOpenMethodology) onOpenMethodology();
      onClose();
      return;
    }

    if (raw === "TOUR" || raw.includes("WALKTHROUGH") || raw.includes("GUIDE")) {
      if (onOpenTour) onOpenTour();
      onClose();
      return;
    }

    // Fallback: If looks like a ticker symbol, treat as <GO>
    onSelectCompany(raw);
    onSelectTab("overview");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleExecute();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (matchedCompanies.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % matchedCompanies.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (matchedCompanies.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + matchedCompanies.length) % matchedCompanies.length);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 px-4 font-mono select-none">
      <div
        className="w-full max-w-2xl bg-[#0A0D12] border border-[#38BDF8] shadow-[0_0_50px_rgba(56,189,248,0.25)] rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Command Input Bar */}
        <div className="p-3 bg-[#12161F] border-b border-[#232B3A] flex items-center gap-3">
          <Terminal className="w-4 h-4 text-[#38BDF8]" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="TYPE COMPANY (TCS, NVDA), OR COMMAND (STRESS, EXPORT, HELP, 1-8)..."
            className="w-full bg-transparent text-xs text-[#E1E7EC] font-mono placeholder-[#5A687D] focus:outline-none uppercase"
          />
          <button
            onClick={() => handleExecute()}
            className="px-2.5 py-1 bg-[#38BDF8] hover:bg-[#60A5FA] text-[#07090E] font-bold text-[10px] flex items-center gap-1 transition-colors rounded cursor-pointer"
          >
            <span>EXEC</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>

        {/* Section A: Matching Companies from Database */}
        {matchedCompanies.length > 0 && (
          <div className="p-3 bg-[#0A0E17] border-b border-[#1E2638] max-h-60 overflow-y-auto space-y-1.5">
            <div className="text-[10px] text-[#38BDF8] uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>MATCHING CORPORATE ISSUERS ({matchedCompanies.length}):</span>
            </div>
            {matchedCompanies.map((c, idx) => {
              const isSelected = idx === selectedIndex;
              const inW = isTickerInWatchlist(c.symbol);
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCompany(c.symbol);
                    onSelectTab("overview");
                    onClose();
                  }}
                  className={`p-2.5 rounded border transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[#101A2E] border-[#38BDF8] text-white"
                      : "bg-[#0E131A] hover:bg-[#12161F] border-[#1E2638] text-[#CBD5E1]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-bold text-xs text-[#38BDF8] shrink-0">{c.symbol}</span>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-white truncate">{c.name}</div>
                      <div className="text-[10px] text-[#64748B]">
                        {c.exchange} &bull; {c.sector} &bull; {c.country}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTickerInWatchlist(c.symbol);
                      }}
                      className={`p-1 rounded text-[10px] border flex items-center gap-1 transition-colors ${
                        inW
                          ? "bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]"
                          : "bg-[#1E2638] border-[#2A3447] text-[#94A3B8] hover:text-white"
                      }`}
                      title={inW ? "In Watchlist" : "Add to Watchlist"}
                    >
                      {inW ? <BookmarkCheck className="w-3 h-3 text-[#38BDF8]" /> : <Bookmark className="w-3 h-3" />}
                    </button>

                    <span className="text-[10px] px-2 py-0.5 bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#60A5FA] rounded font-bold">
                      OPEN
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State when user typed something that didn't match companies or commands */}
        {query && matchedCompanies.length === 0 && !["STRESS", "HELP", "EXPORT", "LOCK", "ADMIN", "METHODOLOGY", "TOUR"].some(k => k.toLowerCase().includes(query)) && (
          <div className="p-4 bg-[#0A0E17] border-b border-[#1E2638] text-center text-xs text-[#94A3B8]">
            <Search className="w-5 h-5 text-[#5A687D] mx-auto mb-1.5" />
            <p>No matching corporate issuer found for &quot;<strong className="text-white">{input}</strong>&quot;.</p>
            <p className="text-[10px] text-[#64748B] mt-1">
              Try searching ticker symbol (e.g. <span className="text-[#38BDF8]">TCS.NS</span>, <span className="text-[#38BDF8]">AAPL</span>, <span className="text-[#38BDF8]">RELIANCE.NS</span>) or company name.
            </p>
          </div>
        )}

        {/* Suggested Institutional Shortcuts */}
        <div className="p-3 bg-[#07090E] space-y-2 text-xs">
          <div className="text-[10px] text-[#5A687D] uppercase font-bold tracking-wider">
            TERMINAL SHORTCUTS &amp; MODULE NAVIGATION:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleExecute("TCS.NS <GO>")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors cursor-pointer rounded"
            >
              <span className="text-[#38BDF8] font-bold">TCS.NS &lt;GO&gt;</span>
              <span className="text-[10px] text-[#5A687D]">LOAD TCS OVERVIEW</span>
            </button>

            <button
              onClick={() => handleExecute("RELIANCE.NS <GO>")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors cursor-pointer rounded"
            >
              <span className="text-[#38BDF8] font-bold">RELIANCE.NS &lt;GO&gt;</span>
              <span className="text-[10px] text-[#5A687D]">LOAD RELIANCE NSE</span>
            </button>

            <button
              onClick={() => handleExecute("STRESS")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors cursor-pointer rounded"
            >
              <span className="text-[#EF4444] font-bold flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                <span>STRESS</span>
              </span>
              <span className="text-[10px] text-[#5A687D]">MACRO STRESS LAB</span>
            </button>

            <button
              onClick={() => handleExecute("EXPORT MEMO")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors cursor-pointer rounded"
            >
              <span className="text-[#10B981] font-bold flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>EXPORT MEMO</span>
              </span>
              <span className="text-[10px] text-[#5A687D]">PRINT IC DOSSIER</span>
            </button>

            <button
              onClick={() => handleExecute("HELP")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#2563EB]/40 text-left flex items-center justify-between transition-colors cursor-pointer rounded"
            >
              <span className="text-[#38BDF8] font-bold flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-[#38BDF8]" />
                <span>HELP &amp; GLOSSARY</span>
              </span>
              <span className="text-[10px] text-[#5A687D]">? / CONCEPT GUIDE</span>
            </button>

            <button
              onClick={() => handleExecute("1")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors cursor-pointer rounded"
            >
              <span className="text-[#E1E7EC] font-bold">COMPANY DIRECTORY</span>
              <span className="text-[10px] text-[#5A687D]">DIRECTORY</span>
            </button>

            <button
              onClick={() => handleExecute("2")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#1E2638] text-left flex items-center justify-between transition-colors cursor-pointer rounded"
            >
              <span className="text-[#E1E7EC] font-bold">FINANCIAL HEALTH</span>
              <span className="text-[10px] text-[#5A687D]">SOLVENCY</span>
            </button>

            <button
              onClick={() => handleExecute("ADMIN")}
              className="p-2 bg-[#0E131A] hover:bg-[#12161F] border border-[#3867F5]/40 text-left flex items-center justify-between transition-colors cursor-pointer rounded"
            >
              <span className="text-[#38BDF8] font-bold flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                <span>ADMIN CONSOLE</span>
              </span>
              <span className="text-[10px] text-[#5A687D]">GOVERNANCE</span>
            </button>
          </div>
        </div>

        {/* Modal Footer Keybinds */}
        <div className="p-2.5 bg-[#05070A] border-t border-[#1E2638] flex items-center justify-between text-[10px] text-[#5A687D]">
          <span>PRESS ESC TO DISMISS &bull; UP/DOWN TO NAVIGATE &bull; ENTER TO SELECT</span>
          <span className="text-[#38BDF8]">HOTKEY: CTRL + K / CMD + K</span>
        </div>
      </div>
    </div>
  );
}
