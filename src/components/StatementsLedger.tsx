"use client";

import React, { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { CompanyRiskProfile } from "@/lib/types";
import { formatFinancialValue } from "@/lib/formatters";

interface StatementsLedgerProps {
  profile: CompanyRiskProfile;
  onAuditMetric: (metricKey: string, period: string, label: string, value?: number | null) => void;
  activeAuditKey?: string | null;
}

type StatementView = "INCOME" | "BALANCE_SHEET" | "CASH_FLOW";

export function StatementsLedger({
  profile,
  onAuditMetric,
  activeAuditKey,
}: StatementsLedgerProps) {
  const [activeStatement, setActiveStatement] = useState<StatementView>("INCOME");
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

  return (
    <div className="space-y-4">
      {/* Executive Financial Digest Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="p-3 bg-[#0E131A] border border-[#1E2638] rounded-sm">
          <div className="text-[10px] text-[#5A687D] uppercase">LATEST REVENUE ({latest?.period})</div>
          <div className="text-base font-bold text-[#E1E7EC] mt-0.5">
            {formatCell(latest?.revenue)}
          </div>
          {revYoY !== null && (
            <div className="text-[10px] mt-1 flex items-center gap-1">
              <span className={revYoY >= 0 ? "text-[#10B981] font-bold" : "text-[#EF4444] font-bold"}>
                {revYoY >= 0 ? "+" : ""}{revYoY.toFixed(1)}% YoY
              </span>
              <span className="text-[#5A687D]">vs {prior?.period}</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-[#0E131A] border border-[#1E2638] rounded-sm">
          <div className="text-[10px] text-[#5A687D] uppercase">OPERATING INCOME (EBIT)</div>
          <div className="text-base font-bold text-[#E1E7EC] mt-0.5">
            {formatCell(latest?.ebit)}
          </div>
          {ebitMargin !== null && (
            <div className="text-[10px] mt-1 text-[#C5A880]">
              Operating Margin: <span className="font-bold">{ebitMargin.toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-[#0E131A] border border-[#1E2638] rounded-sm">
          <div className="text-[10px] text-[#5A687D] uppercase">NET BOTTOM-LINE PROFIT</div>
          <div className="text-base font-bold text-[#E1E7EC] mt-0.5">
            {formatCell(latest?.netIncome)}
          </div>
          {netMargin !== null && (
            <div className="text-[10px] mt-1 text-[#9BA8B8]">
              Net Margin: <span className={netMargin >= 0 ? "text-[#10B981] font-semibold" : "text-[#EF4444] font-semibold"}>{netMargin.toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-[#0E131A] border border-[#1E2638] rounded-sm">
          <div className="text-[10px] text-[#5A687D] uppercase">NET DEBT STATUS</div>
          <div className="text-base font-bold mt-0.5">
            {netDebt === null ? (
              <span className="text-[#9BA8B8]">N/A</span>
            ) : netDebt <= 0 ? (
              <span className="text-[#10B981]">NET CASH FORTRESS</span>
            ) : (
              <span className="text-[#F59E0B]">{formatCell(netDebt)}</span>
            )}
          </div>
          <div className="text-[10px] mt-1 text-[#5A687D]">
            {netDebt !== null && netDebt <= 0 ? "Cash exceeds all debt" : "Total funded obligations"}
          </div>
        </div>
      </div>
      {/* Ledger Header & Sub-Navigation */}
      <div className="p-3 bg-[#0E131A] border border-[#1E2638] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-4 h-4 text-[#C5A880]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#E1E7EC] tracking-wider uppercase">
                XBRL AUDITABLE FINANCIAL LEDGER // {company.symbol}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 border border-[#C5A880]/50 text-[#C5A880] bg-[#12161F]">
                AS-REPORTED: {company.currency} ({company.scaleUnit})
              </span>
            </div>
            <div className="text-[10px] text-[#5A687D] font-mono">
              Click any numeric cell to inspect GAAP/Ind-AS XBRL tag &amp; SEC EDGAR lineage in the Audit Sidecar
            </div>
          </div>
        </div>

        {/* Statement Switcher Tabs */}
        <div className="flex items-center space-x-1 font-mono text-xs">
          <button
            onClick={() => setActiveStatement("INCOME")}
            className={`px-3 py-1.5 border transition-colors ${
              activeStatement === "INCOME"
                ? "bg-[#181F2B] border-[#C5A880] text-[#C5A880] font-bold"
                : "bg-[#07090E] border-[#1E2638] text-[#9BA8B8] hover:text-[#E1E7EC]"
            }`}
          >
            INCOME STATEMENT
          </button>
          <button
            onClick={() => setActiveStatement("BALANCE_SHEET")}
            className={`px-3 py-1.5 border transition-colors ${
              activeStatement === "BALANCE_SHEET"
                ? "bg-[#181F2B] border-[#C5A880] text-[#C5A880] font-bold"
                : "bg-[#07090E] border-[#1E2638] text-[#9BA8B8] hover:text-[#E1E7EC]"
            }`}
          >
            BALANCE SHEET
          </button>
          <button
            onClick={() => setActiveStatement("CASH_FLOW")}
            className={`px-3 py-1.5 border transition-colors ${
              activeStatement === "CASH_FLOW"
                ? "bg-[#181F2B] border-[#C5A880] text-[#C5A880] font-bold"
                : "bg-[#07090E] border-[#1E2638] text-[#9BA8B8] hover:text-[#E1E7EC]"
            }`}
          >
            CASH FLOW
          </button>
        </div>
      </div>

      {/* Main Multi-Period Ledger Grid */}
      <div className="border border-[#1E2638] bg-[#07090E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2638] bg-[#0E131A] text-[#5A687D] text-[11px]">
                <th className="py-2.5 px-3 text-left w-2/5">STANDARDIZED GAAP / IFRS LINE ITEM</th>
                {sortedPeriods.map((p) => (
                  <th key={p.id} className="py-2.5 px-3 text-right">
                    <div className="text-[#C5A880] font-bold">{p.period}</div>
                    <div className="text-[9px] text-[#5A687D]">
                      {p.filingForm} &bull; {p.filingDate}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638]/50">
              {activeStatement === "INCOME" && (
                <>
                  {/* Revenue */}
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2.5 px-3 text-left font-bold text-[#E1E7EC]">
                      Total Net Revenue / Turnover
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("revenue", p.period, "Total Net Revenue", p.revenue)}
                        className={`py-2.5 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("revenue", p.period) ? "active-audit" : "text-[#E1E7EC]"
                        }`}
                      >
                        {formatCell(p.revenue)}
                      </td>
                    ))}
                  </tr>

                  {/* COGS */}
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2.5 px-3 text-left text-[#9BA8B8] pl-6">
                      Cost of Goods Sold (COGS)
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("cogs", p.period, "Cost of Goods Sold", p.cogs)}
                        className={`py-2.5 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("cogs", p.period) ? "active-audit" : "text-[#9BA8B8]"
                        }`}
                      >
                        {formatCell(p.cogs)}
                      </td>
                    ))}
                  </tr>

                  {/* Gross Profit */}
                  <tr className="hover:bg-[#12161F] bg-[#0A0D12]">
                    <td className="py-2.5 px-3 text-left font-semibold text-[#C5A880]">
                      Gross Profit
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("grossProfit", p.period, "Gross Profit", p.grossProfit)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-semibold audit-cell ${
                          isCellActive("grossProfit", p.period) ? "active-audit" : "text-[#C5A880]"
                        }`}
                      >
                        {formatCell(p.grossProfit)}
                      </td>
                    ))}
                  </tr>

                  {/* Operating Expenses */}
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2.5 px-3 text-left text-[#9BA8B8] pl-6">
                      Operating Expenses (R&amp;D + SG&amp;A)
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("operatingExpenses", p.period, "Operating Expenses", p.operatingExpenses)}
                        className={`py-2.5 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("operatingExpenses", p.period) ? "active-audit" : "text-[#9BA8B8]"
                        }`}
                      >
                        {formatCell(p.operatingExpenses)}
                      </td>
                    ))}
                  </tr>

                  {/* Operating Income / EBIT */}
                  <tr className="hover:bg-[#12161F] bg-[#0A0D12]">
                    <td className="py-2.5 px-3 text-left font-bold text-[#E1E7EC]">
                      Operating Income (EBIT)
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("ebit", p.period, "Operating Income (EBIT)", p.ebit)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-bold audit-cell ${
                          isCellActive("ebit", p.period) ? "active-audit" : "text-[#E1E7EC]"
                        }`}
                      >
                        {formatCell(p.ebit)}
                      </td>
                    ))}
                  </tr>

                  {/* Interest Expense */}
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2.5 px-3 text-left text-[#9BA8B8] pl-6">
                      Interest &amp; Finance Expense
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("interestExpense", p.period, "Interest Expense", p.interestExpense)}
                        className={`py-2.5 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("interestExpense", p.period) ? "active-audit" : "text-[#EF4444]"
                        }`}
                      >
                        {formatCell(p.interestExpense)}
                      </td>
                    ))}
                  </tr>

                  {/* Tax Expense */}
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2.5 px-3 text-left text-[#9BA8B8] pl-6">
                      Income Tax Provision
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("taxExpense", p.period, "Tax Expense", p.taxExpense)}
                        className={`py-2.5 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("taxExpense", p.period) ? "active-audit" : "text-[#9BA8B8]"
                        }`}
                      >
                        {formatCell(p.taxExpense)}
                      </td>
                    ))}
                  </tr>

                  {/* Net Income */}
                  <tr className="hover:bg-[#12161F] bg-[#12161F]">
                    <td className="py-2.5 px-3 text-left font-extrabold text-[#C5A880]">
                      Net Income (Consolidated Bottom-Line)
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("netIncome", p.period, "Net Income", p.netIncome)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-extrabold audit-cell ${
                          isCellActive("netIncome", p.period) ? "active-audit" : "text-[#C5A880]"
                        }`}
                      >
                        {formatCell(p.netIncome)}
                      </td>
                    ))}
                  </tr>

                  {/* EBITDA */}
                  <tr className="hover:bg-[#12161F] bg-[#0E131A]">
                    <td className="py-2.5 px-3 text-left font-bold text-[#10B981]">
                      Pro-Forma EBITDA (Operating Cash Earnings)
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("ebitda", p.period, "EBITDA", p.ebitda)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-bold audit-cell ${
                          isCellActive("ebitda", p.period) ? "active-audit" : "text-[#10B981]"
                        }`}
                      >
                        {formatCell(p.ebitda)}
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {activeStatement === "BALANCE_SHEET" && (
                <>
                  {/* Current Assets */}
                  <tr className="bg-[#0E131A]">
                    <td colSpan={sortedPeriods.length + 1} className="py-1.5 px-3 text-left font-bold text-[#5A687D] text-[10px] uppercase">
                      CURRENT ASSETS
                    </td>
                  </tr>
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2 px-3 text-left text-[#9BA8B8] pl-6">Cash &amp; Cash Equivalents</td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("cashAndEquivalents", p.period, "Cash & Equivalents", p.cashAndEquivalents)}
                        className={`py-2 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("cashAndEquivalents", p.period) ? "active-audit" : "text-[#10B981]"
                        }`}
                      >
                        {formatCell(p.cashAndEquivalents)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2 px-3 text-left text-[#9BA8B8] pl-6">Marketable Securities (Liquid)</td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("marketableSecurities", p.period, "Marketable Securities", p.marketableSecurities)}
                        className={`py-2 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("marketableSecurities", p.period) ? "active-audit" : "text-[#9BA8B8]"
                        }`}
                      >
                        {formatCell(p.marketableSecurities)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2 px-3 text-left text-[#9BA8B8] pl-6">Accounts &amp; Trade Receivables</td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("accountsReceivable", p.period, "Receivables", p.accountsReceivable)}
                        className={`py-2 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("accountsReceivable", p.period) ? "active-audit" : "text-[#9BA8B8]"
                        }`}
                      >
                        {formatCell(p.accountsReceivable)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2 px-3 text-left text-[#9BA8B8] pl-6">Inventories</td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("inventories", p.period, "Inventories", p.inventories)}
                        className={`py-2 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("inventories", p.period) ? "active-audit" : "text-[#9BA8B8]"
                        }`}
                      >
                        {formatCell(p.inventories)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-[#12161F] bg-[#0A0D12]">
                    <td className="py-2.5 px-3 text-left font-bold text-[#C5A880]">Total Current Assets</td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("totalCurrentAssets", p.period, "Total Current Assets", p.totalCurrentAssets)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-bold audit-cell ${
                          isCellActive("totalCurrentAssets", p.period) ? "active-audit" : "text-[#C5A880]"
                        }`}
                      >
                        {formatCell(p.totalCurrentAssets)}
                      </td>
                    ))}
                  </tr>

                  {/* Total Assets */}
                  <tr className="hover:bg-[#12161F] bg-[#12161F]">
                    <td className="py-2.5 px-3 text-left font-extrabold text-[#E1E7EC]">TOTAL ASSETS</td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("totalAssets", p.period, "Total Assets", p.totalAssets)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-extrabold audit-cell ${
                          isCellActive("totalAssets", p.period) ? "active-audit" : "text-[#E1E7EC]"
                        }`}
                      >
                        {formatCell(p.totalAssets)}
                      </td>
                    ))}
                  </tr>

                  {/* Liabilities & Debt */}
                  <tr className="bg-[#0E131A]">
                    <td colSpan={sortedPeriods.length + 1} className="py-1.5 px-3 text-left font-bold text-[#5A687D] text-[10px] uppercase">
                      LIABILITIES &amp; DEBT STRUCTURE
                    </td>
                  </tr>
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2 px-3 text-left text-[#9BA8B8] pl-6">Accounts &amp; Trade Payables</td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("accountsPayable", p.period, "Payables", p.accountsPayable)}
                        className={`py-2 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("accountsPayable", p.period) ? "active-audit" : "text-[#9BA8B8]"
                        }`}
                      >
                        {formatCell(p.accountsPayable)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2 px-3 text-left text-[#9BA8B8] pl-6">Short-Term Borrowings</td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("shortTermDebt", p.period, "Short-term Debt", p.shortTermDebt)}
                        className={`py-2 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("shortTermDebt", p.period) ? "active-audit" : "text-[#EF4444]"
                        }`}
                      >
                        {formatCell(p.shortTermDebt)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-[#12161F] bg-[#0A0D12]">
                    <td className="py-2.5 px-3 text-left font-bold text-[#E1E7EC]">Total Current Liabilities</td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("totalCurrentLiabilities", p.period, "Total Current Liabilities", p.totalCurrentLiabilities)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-bold audit-cell ${
                          isCellActive("totalCurrentLiabilities", p.period) ? "active-audit" : "text-[#E1E7EC]"
                        }`}
                      >
                        {formatCell(p.totalCurrentLiabilities)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2 px-3 text-left text-[#EF4444] font-semibold pl-6">Total Gross Debt (ST + LT)</td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("totalDebt", p.period, "Total Debt", p.totalDebt)}
                        className={`py-2 px-3 text-right font-mono-numbers font-semibold audit-cell ${
                          isCellActive("totalDebt", p.period) ? "active-audit" : "text-[#EF4444]"
                        }`}
                      >
                        {formatCell(p.totalDebt)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-[#12161F] bg-[#12161F]">
                    <td className="py-2.5 px-3 text-left font-extrabold text-[#C5A880]">TOTAL SHAREHOLDERS EQUITY</td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("totalShareholdersEquity", p.period, "Stockholders Equity", p.totalShareholdersEquity)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-extrabold audit-cell ${
                          isCellActive("totalShareholdersEquity", p.period) ? "active-audit" : "text-[#C5A880]"
                        }`}
                      >
                        {formatCell(p.totalShareholdersEquity)}
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {activeStatement === "CASH_FLOW" && (
                <>
                  {/* Operating Cash Flow */}
                  <tr className="hover:bg-[#12161F] bg-[#0A0D12]">
                    <td className="py-2.5 px-3 text-left font-extrabold text-[#10B981]">
                      Cash Flow from Operating Activities (CFO)
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("operatingCashFlow", p.period, "Operating Cash Flow", p.operatingCashFlow)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-extrabold audit-cell ${
                          isCellActive("operatingCashFlow", p.period) ? "active-audit" : "text-[#10B981]"
                        }`}
                      >
                        {formatCell(p.operatingCashFlow)}
                      </td>
                    ))}
                  </tr>

                  {/* Capital Expenditures */}
                  <tr className="hover:bg-[#12161F]">
                    <td className="py-2.5 px-3 text-left text-[#9BA8B8] pl-6">
                      Capital Expenditures (CapEx)
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("capitalExpenditures", p.period, "Capital Expenditures", p.capitalExpenditures)}
                        className={`py-2.5 px-3 text-right font-mono-numbers audit-cell ${
                          isCellActive("capitalExpenditures", p.period) ? "active-audit" : "text-[#9BA8B8]"
                        }`}
                      >
                        {formatCell(p.capitalExpenditures)}
                      </td>
                    ))}
                  </tr>

                  {/* Free Cash Flow */}
                  <tr className="hover:bg-[#12161F] bg-[#12161F]">
                    <td className="py-2.5 px-3 text-left font-extrabold text-[#C5A880]">
                      Audited Free Cash Flow (FCF = CFO - CapEx)
                    </td>
                    {sortedPeriods.map((p) => (
                      <td
                        key={p.id}
                        onClick={() => onAuditMetric("freeCashFlow", p.period, "Free Cash Flow", p.freeCashFlow)}
                        className={`py-2.5 px-3 text-right font-mono-numbers font-extrabold audit-cell ${
                          isCellActive("freeCashFlow", p.period) ? "active-audit" : "text-[#C5A880]"
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
    </div>
  );
}
