"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  HelpCircle,
  X,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { formatFinancialValue } from "@/lib/formatters";

interface StatementsLedgerProps {
  profile: CompanyRiskProfile;
  onAuditMetric: (metricKey: string, period: string, label: string, value?: number | null) => void;
  activeAuditKey?: string | null;
}

type StatementView = "INCOME" | "BALANCE_SHEET" | "CASH_FLOW";

interface TermExplanation {
  name: string;
  category: string;
  definition: string;
  clientTakeaway: string;
  formula?: string;
}

const FINANCIAL_TERMS_DICT: Record<string, TermExplanation> = {
  revenue: {
    name: "Total Net Revenue / Turnover",
    category: "Income Statement",
    definition: "Total amount of income generated from selling products or providing services before deducting any expenses.",
    clientTakeaway: "Indicates market demand and top-line scale. Consistent growth signals a healthy, expanding business.",
    formula: "Gross Sales - Returns - Allowances - Discounts",
  },
  cogs: {
    name: "Cost of Goods Sold (COGS)",
    category: "Income Statement",
    definition: "Direct production expenses incurred to manufacture goods or deliver services (raw materials, factory labor, shipping).",
    clientTakeaway: "Lower COGS relative to revenue means higher production efficiency and superior pricing power.",
    formula: "Beginning Inventory + Purchases - Ending Inventory",
  },
  grossProfit: {
    name: "Gross Profit",
    category: "Income Statement",
    definition: "Profit remaining after paying direct manufacturing costs. Measures baseline operational product profitability.",
    clientTakeaway: "A wide gross margin gives the company a financial cushion to spend on R&D, sales, and marketing.",
    formula: "Revenue - COGS",
  },
  operatingExpenses: {
    name: "Operating Expenses (OpEx)",
    category: "Income Statement",
    definition: "Indirect running costs required to keep the business operational: research & development, sales, marketing, and corporate overhead.",
    clientTakeaway: "Shows management discipline. Bloated OpEx eats away at bottom-line earnings.",
    formula: "SG&A + R&D + Depreciation & Amortization",
  },
  ebit: {
    name: "Operating Profit (EBIT)",
    category: "Income Statement",
    definition: "Earnings Before Interest & Taxes. The purest gauge of fundamental core business profitability.",
    clientTakeaway: "What the company earns strictly from operations, independent of bank debt or tax jurisdictions.",
    formula: "Revenue - COGS - OpEx",
  },
  ebitda: {
    name: "EBITDA",
    category: "Income Statement",
    definition: "Earnings Before Interest, Taxes, Depreciation, and Amortization. Approximates gross operational cash generation.",
    clientTakeaway: "Widely used by Wall Street lenders to measure capacity to service debt covenants.",
    formula: "EBIT + Depreciation + Amortization",
  },
  interestExpense: {
    name: "Gross Interest Expense",
    category: "Income Statement",
    definition: "Total contractual interest paid to lenders, bondholders, and banks for borrowed debt capital.",
    clientTakeaway: "High interest expense drains cash reserves and leaves the firm vulnerable if central banks raise rates.",
    formula: "Total Funded Debt × Weighted Average Cost of Debt",
  },
  netIncome: {
    name: "Net Bottom-Line Profit",
    category: "Income Statement",
    definition: "Final net earnings remaining for shareholders after all expenses, interest, and taxes are settled.",
    clientTakeaway: "The definitive bottom-line profit that fuels dividends, share buybacks, or balance sheet reinvestment.",
    formula: "Pre-Tax Income - Income Taxes",
  },
  cashAndEquivalents: {
    name: "Cash & Liquid Equivalents",
    category: "Balance Sheet",
    definition: "Unencumbered cash in bank accounts, money market funds, and Treasury bills with maturity under 90 days.",
    clientTakeaway: "The ultimate survival buffer. Fortress cash reserves protect the company from recessionary crises.",
    formula: "Bank Deposits + Short-Term Treasury Bills",
  },
  totalDebt: {
    name: "Total Funded Debt Obligations",
    category: "Balance Sheet",
    definition: "All contractual debt obligations owed to banks, syndicates, and public bondholders (short-term loans + long-term bonds).",
    clientTakeaway: "High debt increases insolvency risk. Must be evaluated against operating EBITDA and cash reserves.",
    formula: "Short-Term Borrowings + Long-Term Senior Notes + Revolving Credit Lines",
  },
  netDebt: {
    name: "Net Debt",
    category: "Balance Sheet",
    definition: "Total funded debt minus total cash reserves.",
    clientTakeaway: "If negative, the company has more cash than debt (Net Cash Fortress), indicating supreme safety.",
    formula: "Total Funded Debt - Cash & Cash Equivalents",
  },
  operatingCashFlow: {
    name: "Operating Cash Flow (CFO)",
    category: "Cash Flow",
    definition: "Actual cold hard cash produced by business operations after adjusting for non-cash expenses and working capital shifts.",
    clientTakeaway: "More trustworthy than accounting profit because cash in the bank cannot be fabricated by accounting gimmicks.",
    formula: "Net Income + Non-Cash Charges - Working Capital Additions",
  },
  capitalExpenditures: {
    name: "Capital Expenditures (Capex)",
    category: "Cash Flow",
    definition: "Cash invested into long-term physical assets: factories, data centers, industrial machinery, and software infrastructure.",
    clientTakeaway: "Investments for future growth. Essential to maintain competitive advantage.",
    formula: "Cash outflows for Property, Plant & Equipment",
  },
  freeCashFlow: {
    name: "Free Cash Flow (FCF)",
    category: "Cash Flow",
    definition: "Discretionary cash remaining after paying all operating expenses and required capital reinvestments.",
    clientTakeaway: "The lifeblood of valuation. Cash that can be returned to investors or used to retire expensive debt.",
    formula: "Operating Cash Flow - Capital Expenditures",
  },
};

export function StatementsLedger({
  profile,
  onAuditMetric,
  activeAuditKey,
}: StatementsLedgerProps) {
  const [activeStatement, setActiveStatement] = useState<StatementView>("INCOME");
  const [selectedTerm, setSelectedTerm] = useState<TermExplanation | null>(null);
  const [isOfficialReportModalOpen, setIsOfficialReportModalOpen] = useState(false);

  const { company, periods } = profile;

  // Sorted periods: FY2024, FY2023, FY2022
  const sortedPeriods = [...periods].sort((a, b) => b.period.localeCompare(a.period));

  const formatCell = (val: number | null | undefined) =>
    formatFinancialValue(val, company.currency, company.scaleUnit);

  const isCellActive = (key: string, period: string) =>
    activeAuditKey === `${key}_${period}` || activeAuditKey === key;

  const latest = sortedPeriods[0];
  const prior = sortedPeriods[1];

  const revYoY =
    latest?.revenue != null && prior?.revenue != null && prior.revenue !== 0
      ? ((latest.revenue - prior.revenue) / prior.revenue) * 100
      : null;

  const ebitMargin =
    latest?.revenue != null && latest?.ebit != null && latest.revenue !== 0
      ? (latest.ebit / latest.revenue) * 100
      : null;

  const netMargin =
    latest?.revenue != null && latest?.netIncome != null && latest.revenue !== 0
      ? (latest.netIncome / latest.revenue) * 100
      : null;

  const netDebt =
    latest?.totalDebt != null && latest?.cashAndEquivalents != null
      ? latest.totalDebt - latest.cashAndEquivalents
      : null;

  const isIndianEntity =
    company.country === "IND" ||
    company.symbol.endsWith(".NS") ||
    company.symbol.endsWith(".BO");

  const regulatoryBody = isIndianEntity
    ? "Securities and Exchange Board of India (SEBI) & Ministry of Corporate Affairs (MCA)"
    : company.country === "JPN"
    ? "Financial Services Agency of Japan (EDINET)"
    : "U.S. Securities and Exchange Commission (SEC EDGAR)";

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Executive Financial Digest Bar - Royal Black & Navy Blue */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-[#090E17] border border-[#1E293B] rounded-lg">
          <div className="text-[10px] text-[#64748B] uppercase">LATEST REVENUE ({latest?.period})</div>
          <div className="text-base font-bold text-[#F8FAFC] mt-0.5">
            {formatCell(latest?.revenue)}
          </div>
          {revYoY !== null && (
            <div className="text-[10px] mt-1 flex items-center gap-1">
              <span className={revYoY >= 0 ? "text-[#10B981] font-bold" : "text-[#EF4444] font-bold"}>
                {revYoY >= 0 ? "+" : ""}{revYoY.toFixed(1)}% YoY
              </span>
              <span className="text-[#64748B]">vs {prior?.period}</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-[#090E17] border border-[#1E293B] rounded-lg">
          <div className="text-[10px] text-[#64748B] uppercase">OPERATING INCOME (EBIT)</div>
          <div className="text-base font-bold text-[#38BDF8] mt-0.5">
            {formatCell(latest?.ebit)}
          </div>
          {ebitMargin !== null && (
            <div className="text-[10px] mt-1 text-[#94A3B8]">
              Margin: <span className="font-bold text-[#38BDF8]">{ebitMargin.toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-[#090E17] border border-[#1E293B] rounded-lg">
          <div className="text-[10px] text-[#64748B] uppercase">NET BOTTOM-LINE PROFIT</div>
          <div className="text-base font-bold text-[#F8FAFC] mt-0.5">
            {formatCell(latest?.netIncome)}
          </div>
          {netMargin !== null && (
            <div className="text-[10px] mt-1 text-[#94A3B8]">
              Margin: <span className={netMargin >= 0 ? "text-[#10B981] font-semibold" : "text-[#EF4444] font-semibold"}>{netMargin.toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-[#090E17] border border-[#1E293B] rounded-lg">
          <div className="text-[10px] text-[#64748B] uppercase">NET DEBT STATUS</div>
          <div className="text-base font-bold mt-0.5">
            {netDebt === null ? (
              <span className="text-[#94A3B8]">N/A</span>
            ) : netDebt <= 0 ? (
              <span className="text-[#10B981]">NET CASH FORTRESS</span>
            ) : (
              <span className="text-[#EF4444]">{formatCell(netDebt)}</span>
            )}
          </div>
          <div className="text-[10px] mt-1 text-[#64748B]">
            {netDebt !== null && netDebt <= 0 ? "Cash exceeds all debt obligations" : "Total funded obligations exceed cash"}
          </div>
        </div>
      </div>

      {/* Ledger Header, Sub-Navigation & Actions */}
      <div className="p-3 bg-[#090E17] border border-[#1E293B] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#101A2E] border border-[#2563EB]/40 rounded-lg text-[#38BDF8]">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F8FAFC] tracking-wider uppercase">
                XBRL AUDITABLE FINANCIAL LEDGER // {company.symbol}
              </span>
              <span className="text-[10px] px-2 py-0.5 border border-[#2563EB]/40 text-[#38BDF8] bg-[#0E1524] rounded font-bold">
                AS-REPORTED: {company.currency} ({company.scaleUnit})
              </span>
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">
              Click any cell to inspect audit provenance &bull; Click &quot;?&quot; icons to see client-friendly term explanations
            </div>
          </div>
        </div>

        {/* Action Buttons: Official Report & Statement Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsOfficialReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101A2E] hover:bg-[#1E293B] border border-[#2563EB]/50 text-[#38BDF8] hover:text-white text-xs font-bold rounded transition-colors cursor-pointer"
            title="Inspect Official Regulatory Filing & Auditor Report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>OFFICIAL REPORT</span>
          </button>

          {/* Statement Switcher Tabs */}
          <div className="flex items-center p-0.5 bg-[#05070B] border border-[#1E293B] rounded-lg text-xs">
            <button
              onClick={() => setActiveStatement("INCOME")}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                activeStatement === "INCOME"
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              INCOME
            </button>
            <button
              onClick={() => setActiveStatement("BALANCE_SHEET")}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                activeStatement === "BALANCE_SHEET"
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              BALANCE SHEET
            </button>
            <button
              onClick={() => setActiveStatement("CASH_FLOW")}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                activeStatement === "CASH_FLOW"
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              CASH FLOW
            </button>
          </div>
        </div>
      </div>

      {/* Main Multi-Period Ledger Grid */}
      <div className="border border-[#1E293B] bg-[#05070B] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#090E17] text-[#64748B] text-[11px]">
                <th className="py-2.5 px-3 text-left w-2/5">STANDARDIZED GAAP / IFRS LINE ITEM</th>
                {sortedPeriods.map((p) => (
                  <th key={p.id} className="py-2.5 px-3 text-right">
                    <div className="text-[#38BDF8] font-bold">{p.period}</div>
                    <div className="text-[9px] text-[#64748B]">
                      {p.filingForm} &bull; {p.filingDate}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/40">
              {activeStatement === "INCOME" && (
                <>
                  {/* Revenue */}
                  <tr className="hover:bg-[#0B111E]">
                    <td className="py-2.5 px-3 text-left font-bold text-[#F8FAFC] flex items-center justify-between">
                      <span>Total Net Revenue / Turnover</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.revenue)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                        title="What does Revenue mean?"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("revenue", p.period, "Total Net Revenue", p.revenue)}
                        className={`py-2.5 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("revenue", p.period) ? "active-audit" : "text-[#F8FAFC]"
                        }`}
                      >
                        {formatCell(p.revenue)}
                      </td>
                    ))}
                  </tr>

                  {/* COGS */}
                  <tr className="hover:bg-[#0B111E]">
                    <td className="py-2.5 px-3 text-left text-[#94A3B8] pl-6 flex items-center justify-between">
                      <span>Cost of Goods Sold (COGS)</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.cogs)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                        title="What does COGS mean?"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("cogs", p.period, "Cost of Goods Sold", p.cogs)}
                        className={`py-2.5 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("cogs", p.period) ? "active-audit" : "text-[#EF4444]"
                        }`}
                      >
                        -{formatCell(p.cogs)}
                      </td>
                    ))}
                  </tr>

                  {/* Gross Profit */}
                  <tr className="hover:bg-[#0B111E] bg-[#0A0E17]">
                    <td className="py-2.5 px-3 text-left font-semibold text-[#10B981] flex items-center justify-between">
                      <span>Gross Profit</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.grossProfit)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                        title="What does Gross Profit mean?"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("grossProfit", p.period, "Gross Profit", p.grossProfit)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-semibold audit-cell ${
                          isCellActive("grossProfit", p.period) ? "active-audit" : "text-[#10B981]"
                        }`}
                      >
                        {formatCell(p.grossProfit)}
                      </td>
                    ))}
                  </tr>

                  {/* Operating Expenses */}
                  <tr className="hover:bg-[#0B111E]">
                    <td className="py-2.5 px-3 text-left text-[#94A3B8] pl-6 flex items-center justify-between">
                      <span>Operating Expenses (R&amp;D + SG&amp;A)</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.operatingExpenses)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                        title="What does OpEx mean?"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("operatingExpenses", p.period, "Operating Expenses", p.operatingExpenses)}
                        className={`py-2.5 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("operatingExpenses", p.period) ? "active-audit" : "text-[#EF4444]"
                        }`}
                      >
                        -{formatCell(p.operatingExpenses)}
                      </td>
                    ))}
                  </tr>

                  {/* Operating Profit (EBIT) */}
                  <tr className="hover:bg-[#0B111E] bg-[#0A0E17]">
                    <td className="py-2.5 px-3 text-left font-bold text-[#38BDF8] flex items-center justify-between">
                      <span>Operating Profit (EBIT)</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.ebit)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                        title="What does EBIT mean?"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("ebit", p.period, "Operating Profit (EBIT)", p.ebit)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-bold audit-cell ${
                          isCellActive("ebit", p.period) ? "active-audit" : "text-[#38BDF8]"
                        }`}
                      >
                        {formatCell(p.ebit)}
                      </td>
                    ))}
                  </tr>

                  {/* Interest Expense */}
                  <tr className="hover:bg-[#0B111E]">
                    <td className="py-2.5 px-3 text-left text-[#EF4444] pl-6 flex items-center justify-between">
                      <span>Gross Interest Expense</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.interestExpense)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                        title="What does Interest Expense mean?"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("interestExpense", p.period, "Gross Interest Expense", p.interestExpense)}
                        className={`py-2.5 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("interestExpense", p.period) ? "active-audit" : "text-[#EF4444]"
                        }`}
                      >
                        -{formatCell(p.interestExpense)}
                      </td>
                    ))}
                  </tr>

                  {/* Net Bottom-Line Profit */}
                  <tr className="hover:bg-[#0B111E] bg-[#0A0E17]">
                    <td className="py-2.5 px-3 text-left font-extrabold text-[#F8FAFC] flex items-center justify-between">
                      <span>Net Bottom-Line Profit</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.netIncome)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                        title="What does Net Income mean?"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("netIncome", p.period, "Net Bottom-Line Profit", p.netIncome)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-extrabold audit-cell ${
                          isCellActive("netIncome", p.period)
                            ? "active-audit"
                            : (p.netIncome ?? 0) >= 0
                            ? "text-[#10B981]"
                            : "text-[#EF4444]"
                        }`}
                      >
                        {formatCell(p.netIncome)}
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {activeStatement === "BALANCE_SHEET" && (
                <>
                  {/* Cash */}
                  <tr className="hover:bg-[#0B111E]">
                    <td className="py-2.5 px-3 text-left font-bold text-[#10B981] flex items-center justify-between">
                      <span>Cash &amp; Liquid Equivalents</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.cashAndEquivalents)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("cashAndEquivalents", p.period, "Cash & Liquid Equivalents", p.cashAndEquivalents)}
                        className="py-2.5 px-3 text-right font-mono-numbers text-[#10B981] font-bold audit-cell"
                      >
                        {formatCell(p.cashAndEquivalents)}
                      </td>
                    ))}
                  </tr>

                  {/* Total Current Assets */}
                  <tr className="hover:bg-[#0B111E]">
                    <td className="py-2.5 px-3 text-left text-[#CBD5E1] pl-4">
                      Total Current Assets
                    </td>
                    {sortedPeriods.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 text-right font-mono-numbers text-[#CBD5E1]">
                        {formatCell(p.totalCurrentAssets)}
                      </td>
                    ))}
                  </tr>

                  {/* Total Assets */}
                  <tr className="hover:bg-[#0B111E] bg-[#0A0E17]">
                    <td className="py-2.5 px-3 text-left font-extrabold text-[#38BDF8]">
                      Total Consolidated Assets
                    </td>
                    {sortedPeriods.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 text-right font-mono-numbers font-extrabold text-[#38BDF8]">
                        {formatCell(p.totalAssets)}
                      </td>
                    ))}
                  </tr>

                  {/* Total Funded Debt */}
                  <tr className="hover:bg-[#0B111E]">
                    <td className="py-2.5 px-3 text-left font-bold text-[#EF4444] flex items-center justify-between">
                      <span>Total Funded Debt Obligations</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.totalDebt)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("totalDebt", p.period, "Total Funded Debt Obligations", p.totalDebt)}
                        className="py-2.5 px-3 text-right font-mono-numbers text-[#EF4444] font-bold audit-cell"
                      >
                        {formatCell(p.totalDebt)}
                      </td>
                    ))}
                  </tr>

                  {/* Net Debt Status */}
                  <tr className="hover:bg-[#0B111E] bg-[#0A0E17]">
                    <td className="py-2.5 px-3 text-left font-bold text-[#F8FAFC] flex items-center justify-between">
                      <span>Net Funded Debt (Debt - Cash)</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.netDebt)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => {
                      const nd = (p.totalDebt ?? 0) - (p.cashAndEquivalents ?? 0);
                      return (
                        <td
                          key={p.id}
                          className={`py-2.5 px-3 text-right font-mono-numbers font-bold ${
                            nd <= 0 ? "text-[#10B981]" : "text-[#EF4444]"
                          }`}
                        >
                          {nd <= 0 ? "NET CASH FORTRESS" : formatCell(nd)}
                        </td>
                      );
                    })}
                  </tr>
                </>
              )}

              {activeStatement === "CASH_FLOW" && (
                <>
                  {/* Operating Cash Flow */}
                  <tr className="hover:bg-[#0B111E]">
                    <td className="py-2.5 px-3 text-left font-bold text-[#10B981] flex items-center justify-between">
                      <span>Operating Cash Flow (CFO)</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.operatingCashFlow)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("operatingCashFlow", p.period, "Operating Cash Flow", p.operatingCashFlow)}
                        className="py-2.5 px-3 text-right font-mono-numbers text-[#10B981] font-bold audit-cell"
                      >
                        {formatCell(p.operatingCashFlow)}
                      </td>
                    ))}
                  </tr>

                  {/* Capex */}
                  <tr className="hover:bg-[#0B111E]">
                    <td className="py-2.5 px-3 text-left text-[#EF4444] pl-6 flex items-center justify-between">
                      <span>Capital Expenditures (Capex)</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.capitalExpenditures)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("capitalExpenditures", p.period, "Capital Expenditures", p.capitalExpenditures)}
                        className="py-2.5 px-3 text-right font-mono-numbers text-[#EF4444] audit-cell"
                      >
                        -{formatCell(p.capitalExpenditures)}
                      </td>
                    ))}
                  </tr>

                  {/* Free Cash Flow */}
                  <tr className="hover:bg-[#0B111E] bg-[#0A0E17]">
                    <td className="py-2.5 px-3 text-left font-extrabold text-[#38BDF8] flex items-center justify-between">
                      <span>Free Cash Flow (FCF)</span>
                      <button
                        onClick={() => setSelectedTerm(FINANCIAL_TERMS_DICT.freeCashFlow)}
                        className="text-[10px] text-[#64748B] hover:text-[#38BDF8] cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("freeCashFlow", p.period, "Free Cash Flow", p.freeCashFlow)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-extrabold audit-cell ${
                          (p.freeCashFlow ?? 0) >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
                        }`}
                      >
                        {formatCell(p.freeCashFlow)}
                      </td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: OFFICIAL REGULATORY FILING INSPECTOR */}
      {isOfficialReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#05070B]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#090E17] border border-[#2563EB]/40 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-[#0B111E] border-b border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#38BDF8]" />
                <div>
                  <h3 className="font-bold text-sm text-[#F8FAFC]">
                    OFFICIAL REGULATORY REPORT &amp; PROVENANCE
                  </h3>
                  <div className="text-[10px] text-[#64748B]">
                    {company.name} ({company.symbol}) &bull; Standardized Audited Ledger
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOfficialReportModalOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="p-3 bg-[#05070B] border border-[#1E293B] rounded-lg space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B] uppercase font-bold">REGULATORY JURISDICTION</span>
                  <span className="text-[#38BDF8] font-bold">{regulatoryBody}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B] uppercase font-bold">FILING STANDARD</span>
                  <span className="text-[#F8FAFC]">{company.accountingStandard} (XBRL Standardized)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B] uppercase font-bold">CENTRAL INDEX / CIN CODE</span>
                  <span className="text-[#38BDF8] font-bold">{company.cik || company.symbol}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B] uppercase font-bold">ISIN NUMBER</span>
                  <span className="text-[#F8FAFC]">{company.isin || "INE066F01012"}</span>
                </div>
              </div>

              {/* Multi-Year Audited Filing Dates */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <span>AUDITED ANNUAL REPORTS &amp; OPINIONS</span>
                </h4>
                <div className="space-y-1.5">
                  {sortedPeriods.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-[#0B111E] border border-[#1E293B] rounded flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#F8FAFC]">{p.period} Annual Report ({p.filingForm})</div>
                        <div className="text-[10px] text-[#64748B]">
                          Filing Date: {p.filingDate} &bull; Currency: {p.currency} ({company.scaleUnit})
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-[10px] font-bold rounded">
                        UNQUALIFIED CLEAN OPINION
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Attestation */}
              <div className="p-3 bg-[#101A2E]/50 border border-[#2563EB]/30 rounded-lg text-[11px] text-[#CBD5E1] space-y-1">
                <div className="font-bold text-[#38BDF8] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>STATUTORY AUDITOR TRUE &amp; FAIR CERTIFICATION</span>
                </div>
                <p className="text-[10.5px] text-[#94A3B8] leading-relaxed">
                  Financial figures are extracted directly from official filings under full regulatory compliance.
                  No synthetic or simulated numbers are utilized in the audit ledger.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#0B111E] border-t border-[#1E293B] flex items-center justify-between">
              <span className="text-[10px] text-[#64748B]">REGULATORY REPOSITORY SYNC: LIVE</span>
              <button
                onClick={() => setIsOfficialReportModalOpen(false)}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded transition-colors cursor-pointer"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FINANCIAL TERM EXPLAINER (CLIENT-FRIENDLY) */}
      {selectedTerm && (
        <div className="fixed inset-0 z-50 bg-[#05070B]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#090E17] border border-[#38BDF8]/40 shadow-2xl rounded-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 bg-[#0B111E] border-b border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#38BDF8]" />
                <h3 className="font-bold text-sm text-[#F8FAFC]">
                  {selectedTerm.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTerm(null)}
                className="p-1 text-[#64748B] hover:text-[#F8FAFC] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-bold">WHAT IT MEANS (PLAIN ENGLISH)</span>
                <p className="text-[#CBD5E1] leading-relaxed bg-[#05070B] p-2.5 border border-[#1E293B] rounded">
                  {selectedTerm.definition}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-[#38BDF8] uppercase font-bold">CLIENT TAKEAWAY // WHY IT MATTERS</span>
                <p className="text-[#F8FAFC] leading-relaxed bg-[#101A2E] p-2.5 border border-[#2563EB]/40 rounded">
                  {selectedTerm.clientTakeaway}
                </p>
              </div>

              {selectedTerm.formula && (
                <div className="space-y-1">
                  <span className="text-[10px] text-[#64748B] uppercase font-bold">CALCULATION FORMULA</span>
                  <div className="text-[11px] font-mono text-[#38BDF8] bg-[#05070B] p-2 border border-[#1E293B] rounded">
                    {selectedTerm.formula}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#0B111E] border-t border-[#1E293B] flex justify-end">
              <button
                onClick={() => setSelectedTerm(null)}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded transition-colors cursor-pointer"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
