"use client";

// Lightweight Institutional Markdown Parser
function FormattedAiResponse({ content }: { content: string }) {
  if (!content) return null;

  // Split content by lines
  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const parseInlineMarkdown = (line: string): React.ReactNode[] => {
    // Regex for bold **text** and inline code `code`
    const tokens = line.split(/(\*\*.*?\*\*|`.*?`)/g);
    return tokens.map((token, i) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return <strong key={i} className="font-bold text-white">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith("`") && token.endsWith("`")) {
        return (
          <code key={i} className="px-1 py-0.5 bg-[#05070B] border border-[#1E293B] rounded text-[#38BDF8] font-mono text-[11px]">
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  const flushList = () => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={`ul_${renderedElements.length}`} className="space-y-1 my-1.5 ml-3">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Code block fences
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        renderedElements.push(
          <pre key={`code_${idx}`} className="p-2.5 my-2 bg-[#05070B] border border-[#1E293B] rounded-lg text-[11px] text-[#10B981] font-mono overflow-x-auto">
            {codeBlockLines.join("\n")}
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      flushList();
      renderedElements.push(
        <h3 key={`h3_${idx}`} className="text-xs sm:text-sm font-bold text-white mt-2 mb-1 flex items-center gap-1.5">
          {parseInlineMarkdown(trimmed.replace("### ", ""))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      renderedElements.push(
        <h2 key={`h2_${idx}`} className="text-sm font-bold text-[#38BDF8] mt-2.5 mb-1 flex items-center gap-1.5">
          {parseInlineMarkdown(trimmed.replace("## ", ""))}
        </h2>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      const cleanBullet = trimmed.replace(/^[-*•]s+/, "");
      currentList.push(
        <li key={`li_${idx}`} className="text-xs sm:text-[12.5px] text-[#CBD5E1] flex items-start gap-1.5">
          <span className="text-[#38BDF8] mt-1 text-[8px]">&bull;</span>
          <span className="flex-1">{parseInlineMarkdown(cleanBullet)}</span>
        </li>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      renderedElements.push(
        <blockquote key={`quote_${idx}`} className="border-l-2 border-[#38BDF8] pl-2.5 my-1.5 text-xs text-[#94A3B8] italic">
          {parseInlineMarkdown(trimmed.replace("> ", ""))}
        </blockquote>
      );
      return;
    }

    // Empty lines
    if (!trimmed) {
      flushList();
      return;
    }

    // Normal paragraph
    flushList();
    renderedElements.push(
      <p key={`p_${idx}`} className="text-xs sm:text-[12.5px] text-[#CBD5E1] leading-relaxed my-1">
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{renderedElements}</div>;
}


import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Send,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  ExternalLink,
  ShieldCheck,
  Database,
  Loader2,
} from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  sources?: Array<{
    title: string;
    filing: string;
    url?: string;
    period: string;
    timestamp: string;
  }>;
  groundedTicker?: string | null;
  mode?: string;
  followUps?: string[];
  isError?: boolean;
}

interface FinancialAiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: CompanyRiskProfile | null;
}

export function FinancialAiAssistant({
  isOpen,
  onClose,
  activeProfile,
}: FinancialAiAssistantProps) {
  const company = activeProfile?.company;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize or restore conversation history
  useEffect(() => {
    const saved = localStorage.getItem("fintraxis_ai_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch (e) {
        console.warn("Could not restore AI chat history:", e);
      }
    }

    // Default intro message
    const introMsg: Message = {
      id: "intro",
      sender: "ai",
      text: activeProfile
        ? `### 🏛️ Wall Street & Institutional Risk Intelligence Copilot\n\nActive surveillance loaded for **${company?.name} (${company?.symbol})**:\n\n• **Country & Regime:** ${company?.country} (${company?.currency} ${company?.scaleUnit}) &bull; ${company?.accountingStandard}\n• **Credit Solvency Tier:** **${activeProfile.riskTier}** (Score: \`${activeProfile.riskScore}/100\`)\n• **Net Debt / EBITDA:** \`${activeProfile.latestRatios?.netDebtToEbitda !== null ? (activeProfile.latestRatios.netDebtToEbitda <= 0 ? `${activeProfile.latestRatios.netDebtToEbitda.toFixed(2)}x (Net Cash)` : `${activeProfile.latestRatios.netDebtToEbitda.toFixed(2)}x`) : "N/D"}\`\n• **Interest Coverage:** \`${activeProfile.latestRatios?.interestCoverage !== null ? `${activeProfile.latestRatios?.interestCoverage?.toFixed(2)}x` : "N/D"}\`\n\nAll figures are grounded directly in the **SQLite WAL Ledger** and audited XBRL filings. Ask any question about this company's credit health, simulate adverse shocks, or explore financial concepts below.`
        : `### 🏛️ Wall Street & Institutional Risk Intelligence Copilot\n\nWelcome to **FINTRAXIS Institutional Intelligence**. I provide grounded financial analysis, credit underwriting memos, forensic accounting diagnostics, and macro interest rate stress tests.\n\nAll company data is queried in real time from our local **SQLite Financial Database** with zero invented metrics. What would you like to explore?`,
      timestamp: "Just now",
      sources: company
        ? [
            {
              title: `${company.name} (${company.symbol}) SEC/Exchange Filings`,
              filing: activeProfile?.periods?.[0]?.filingForm || "Annual Report",
              period: activeProfile?.periods?.[0]?.period || "FY2024",
              timestamp: "SQLite WAL Cache",
            },
          ]
        : [],
      followUps: company
        ? [
            `Summarize ${company.symbol}'s balance sheet and solvency`,
            `Simulate a -15% revenue contraction on ${company.symbol}`,
            `What are ${company.symbol}'s critical business dependencies?`,
            "Explain Altman Z-Score formula and thresholds",
          ]
        : [
            "Summarize Apple Inc. (AAPL) financials",
            "Simulate -10% revenue drop on Reliance",
            "Explain Current Ratio and Quick Ratio formulas",
            "What does RBI Repo Rate (5.50%) mean for corporate borrowers?",
          ],
    };

    setMessages([introMsg]);
  }, [company?.symbol, activeProfile, company]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Save history to localStorage
  const saveHistory = (msgs: Message[]) => {
    setMessages(msgs);
    try {
      localStorage.setItem("fintraxis_ai_chat_history", JSON.stringify(msgs.slice(-20))); // Keep last 20
    } catch (e) {
      console.warn("Storage save failed:", e);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    localStorage.removeItem("fintraxis_ai_chat_history");
    const resetMsg: Message = {
      id: `reset_${Date.now()}`,
      sender: "ai",
      text: "Conversation cleared. Ready for your next institutional financial analysis or query!",
      timestamp: "Just now",
      followUps: [
        "Analyze credit risk & solvency for active company",
        "Explain Net Debt to EBITDA 3.5x hurdle",
        "Simulate a -20% revenue shock",
      ],
    };
    saveHistory([resetMsg]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setInputQuery("");

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    saveHistory(newHistory);
    setIsLoading(true);

    try {
      // Send chat request to real server-side AI chat API
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
          activeTicker: company?.symbol || "AAPL",
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}`);
      }

      const data = await res.json();

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: data.message || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources || [],
        groundedTicker: data.groundedTicker || null,
        mode: data.mode || "LOCAL_DETERMINISTIC",
        followUps: data.followUps || [],
      };

      saveHistory([...newHistory, aiMsg]);
    } catch (err: unknown) {
      console.error("AI Request error:", err);
      const errMsg = err instanceof Error ? err.message : "Network Error";
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: "ai",
        text: `### ⚠️ Connection Notice\n\nCould not reach the server AI route: ${errMsg}.\n\nPlease ensure the backend service is running or retry your request.`,
        timestamp: "Just now",
        isError: true,
        followUps: ["Retry last request", "Explain Current Ratio formula"],
      };
      saveHistory([...newHistory, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 font-mono shadow-2xl flex flex-col bg-[#0A0E17] border border-[#1E293B] ${
        isExpanded
          ? "inset-4 md:inset-10 rounded-xl"
          : "bottom-4 right-4 md:bottom-6 md:right-6 w-[94vw] sm:w-[540px] h-[640px] max-h-[88vh] rounded-xl"
      }`}
    >
      {/* Header Bar */}
      <div className="p-3.5 bg-[#0D121F] border-b border-[#1E293B] flex items-center justify-between rounded-t-xl select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#38BDF8] flex items-center justify-center text-white shadow-md shadow-[#2563EB]/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs tracking-wider">
                FINTRAXIS RISK COPILOT
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                SQLITE GROUNDED
              </span>
            </div>
            <div className="text-[10px] text-[#64748B]">
              {company ? `Active: ${company.name} (${company.symbol})` : "General Financial Intelligence"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#94A3B8]">
          <button
            onClick={handleClearChat}
            className="p-1.5 hover:bg-[#1E293B] hover:text-white rounded transition-colors"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-[#1E293B] hover:text-white rounded transition-colors hidden sm:block"
            title={isExpanded ? "Restore Window" : "Maximize Window"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#EF4444]/20 hover:text-[#EF4444] rounded transition-colors"
            title="Close Copilot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-[#64748B]">
                <span>{isUser ? "ANALYST" : "FINTRAXIS INTELLIGENCE"}</span>
                <span>&bull;</span>
                <span>{msg.timestamp}</span>
                {!isUser && msg.mode && (
                  <>
                    <span>&bull;</span>
                    <span className="text-[#38BDF8]">
                      {msg.mode === "GEMINI_API" ? "GEMINI MODEL API" : "VERIFIED DETERMINISTIC"}
                    </span>
                  </>
                )}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`p-4 rounded-xl max-w-[92%] leading-relaxed ${
                  isUser
                    ? "bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20 rounded-tr-none"
                    : msg.isError
                    ? "bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#FCA5A5] rounded-tl-none"
                    : "bg-[#0D1526] border border-[#1E293B] text-[#E2E8F0] shadow-sm rounded-tl-none"
                }`}
              >
                {/* Render formatted content */}
                <div className="space-y-2 font-sans text-xs sm:text-[13px]">
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <FormattedAiResponse content={msg.text} />
                  )}
                </div>

                {/* Grounded Source References */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#1E293B]/70 font-mono text-[10.5px]">
                    <div className="text-[10px] text-[#64748B] uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Database className="w-3 h-3 text-[#38BDF8]" />
                      <span>Retrieved Evidence Provenance:</span>
                    </div>
                    {msg.sources.map((src, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[#94A3B8]">
                        <span className="text-[#38BDF8]">&bull;</span>
                        <span className="text-white font-medium">{src.title}</span>
                        <span>({src.filing})</span>
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#38BDF8] hover:underline flex items-center gap-0.5 ml-1"
                          >
                            <span>Filing</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Bubble Actions */}
                {!isUser && (
                  <div className="mt-2 pt-2 flex items-center justify-between text-[10px] text-[#64748B]">
                    <span className="flex items-center gap-1 text-[#10B981]">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Calculated via pure financial functions</span>
                    </span>
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#10B981]" />
                          <span className="text-[#10B981]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Follow-up question quick pills */}
              {!isUser && msg.followUps && msg.followUps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[92%]">
                  {msg.followUps.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-2.5 py-1 bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#38BDF8]/40 text-[#94A3B8] hover:text-white rounded text-[10.5px] transition-colors flex items-center gap-1 cursor-pointer text-left"
                    >
                      <Lightbulb className="w-3 h-3 text-[#F59E0B] shrink-0" />
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2 text-[#94A3B8] font-mono text-xs">
            <div className="w-6 h-6 rounded-full bg-[#1E293B] flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#38BDF8]" />
            </div>
            <div className="bg-[#0D1526] border border-[#1E293B] rounded-lg p-3 text-[11.5px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                <span className="font-bold text-white">Querying SQLite Financial Engine...</span>
              </div>
              <div className="text-[10px] text-[#64748B] mt-1">
                Resolving balance sheet records & calculating deterministic ratios.
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-[#0D121F] border-t border-[#1E293B] rounded-b-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              company
                ? `Ask about ${company.symbol} (e.g., "Simulate -15% revenue shock", "Explain Net Debt")...`
                : "Ask any financial question or simulate a macro scenario..."
            }
            className="flex-1 bg-[#080B10] border border-[#1E293B] hover:border-[#334155] focus:border-[#38BDF8] rounded-lg px-3.5 py-2 text-white text-xs placeholder:text-[#5A687D] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="p-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#1E293B] disabled:text-[#475569] text-white rounded-lg transition-colors cursor-pointer"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[9.5px] text-[#64748B] mt-2 px-1">
          <span>Grounded against SQLite WAL &bull; Deterministic Financial Engine Policy</span>
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}
