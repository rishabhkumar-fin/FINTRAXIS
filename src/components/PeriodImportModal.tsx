"use client";

import React, { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";
import { SessionClearance } from "./AuthGate";

interface PeriodImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Array<{ id: string; symbol: string; name: string; currency: string; scaleUnit?: string }>;
  onSuccess: () => void;
  session?: SessionClearance | null;
}

export function PeriodImportModal({
  isOpen,
  onClose,
  companies,
  onSuccess,
  session,
}: PeriodImportModalProps) {
  const [activeMode, setActiveMode] = useState<"file" | "manual">("file");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // File upload state
  const [pastedData, setPastedData] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  // Manual entry state
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || "TCS.NS");
  const [period, setPeriod] = useState("FY2024");
  const [periodType, setPeriodType] = useState<"ANNUAL" | "QUARTERLY">("ANNUAL");
  const [filingDate, setFilingDate] = useState("2024-03-31");
  const [filingForm, setFilingForm] = useState("Annual Report (NSE/BSE)");
  const [filingUrl, setFilingUrl] = useState("https://www.bseindia.com");
  const [currency, setCurrency] = useState(companies[0]?.currency || "INR");
  const [scaleUnit, setScaleUnit] = useState(companies[0]?.scaleUnit || "Crores");

  // Statement numbers
  const [revenue, setRevenue] = useState("240893");
  const [ebit, setEbit] = useState("59325");
  const [ebitda, setEbitda] = useState("64319");
  const [interestExpense, setInterestExpense] = useState("812");
  const [netIncome, setNetIncome] = useState("46099");
  const [cashAndEquivalents, setCashAndEquivalents] = useState("9014");
  const [marketableSecurities, setMarketableSecurities] = useState("10120");
  const [totalCurrentAssets, setTotalCurrentAssets] = useState("102430");
  const [totalAssets, setTotalAssets] = useState("143580");
  const [totalCurrentLiabilities, setTotalCurrentLiabilities] = useState("47210");
  const [totalDebt, setTotalDebt] = useState("0");
  const [totalLiabilities, setTotalLiabilities] = useState("50942");
  const [totalShareholdersEquity, setTotalShareholdersEquity] = useState("92638");
  const [operatingCashFlow, setOperatingCashFlow] = useState("48950");
  const [freeCashFlow, setFreeCashFlow] = useState("44210");

  if (!isOpen) return null;

  // Real-time Balance Sheet Identity Check
  const numAssets = Number(totalAssets) || 0;
  const numLiab = Number(totalLiabilities) || 0;
  const numEquity = Number(totalShareholdersEquity) || 0;
  const balanceDiff = Math.abs(numAssets - (numLiab + numEquity));
  const balanceTolerance = Math.max(1, 0.005 * numAssets);
  const isBalanceValid = balanceDiff <= balanceTolerance;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setPastedData(text);
    };
    reader.readAsText(file);
  };

  const handleManualCompanyChange = (compId: string) => {
    setSelectedCompanyId(compId);
    const found = companies.find((c) => c.id === compId);
    if (found) {
      setCurrency(found.currency);
      if (found.scaleUnit) setScaleUnit(found.scaleUnit);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.userEmail) headers["x-operator-email"] = session.userEmail;
      if (session?.sessionToken) headers["x-session-token"] = session.sessionToken;

      let payload: unknown;

      if (activeMode === "file") {
        if (!pastedData.trim()) {
          throw new Error("Please upload a file or paste CSV/JSON period data.");
        }
        const trimmed = pastedData.trim();
        if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
          payload = JSON.parse(trimmed);
        } else {
          // Parse CSV
          const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) {
            throw new Error("CSV requires a header line and at least one data row.");
          }
          const headersArr = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
          const records: Record<string, unknown>[] = [];
          for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
            const obj: Record<string, unknown> = {};
            headersArr.forEach((h, idx) => {
              const val = vals[idx] ?? "";
              const num = Number(val);
              obj[h] = !isNaN(num) && val !== "" ? num : val;
            });
            records.push(obj);
          }
          payload = records;
        }
      } else {
        // Manual form
        if (!isBalanceValid) {
          throw new Error(
            `Balance sheet identity violated: Assets (${numAssets.toLocaleString()}) ≠ Liabilities (${numLiab.toLocaleString()}) + Equity (${numEquity.toLocaleString()}). Difference is ${Math.round(balanceDiff).toLocaleString()} (must be within 0.5%).`
          );
        }

        payload = {
          companyId: selectedCompanyId,
          period,
          periodType,
          filingDate,
          filingForm,
          filingUrl,
          currency,
          scaleUnit,
          revenue: Number(revenue),
          ebit: Number(ebit),
          ebitda: Number(ebitda),
          interestExpense: Number(interestExpense),
          netIncome: Number(netIncome),
          cashAndEquivalents: Number(cashAndEquivalents),
          marketableSecurities: Number(marketableSecurities),
          totalCurrentAssets: Number(totalCurrentAssets),
          totalAssets: Number(totalAssets),
          totalCurrentLiabilities: Number(totalCurrentLiabilities),
          totalDebt: Number(totalDebt),
          totalLiabilities: Number(totalLiabilities),
          totalShareholdersEquity: Number(totalShareholdersEquity),
          operatingCashFlow: Number(operatingCashFlow),
          freeCashFlow: Number(freeCashFlow),
        };
      }

      const res = await fetch("/api/admin/periods", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to import reporting period.");
      }

      setSuccessMsg(
        `Successfully imported ${json.count || 1} period record(s) into database. Financial ratios recomputed.`
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error importing period";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="max-w-2xl w-full bg-[#101621] border border-[#253247] rounded-2xl p-6 font-mono text-xs shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#253247] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#38BDF8]" />
              <h2 className="text-base font-bold text-[#F3F6FC] uppercase tracking-wider">
                Import Reporting Period
              </h2>
            </div>
            <p className="text-[11px] text-[#9AA8BC] mt-1">
              Add or update audited fiscal filing periods with balance sheet identity validation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#9AA8BC] hover:text-[#F3F6FC] hover:bg-[#151E2D] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 mt-4 border-b border-[#253247] pb-3">
          <button
            type="button"
            onClick={() => setActiveMode("file")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeMode === "file"
                ? "bg-[#3867F5] text-white"
                : "bg-[#151E2D] text-[#9AA8BC] hover:text-[#F3F6FC]"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV / JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("manual")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeMode === "manual"
                ? "bg-[#3867F5] text-white"
                : "bg-[#151E2D] text-[#9AA8BC] hover:text-[#F3F6FC]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Manual Form</span>
          </button>

          <div className="ml-auto flex items-center gap-2 text-[10px]">
            <a
              href="/templates/period_import_template.csv"
              download
              className="px-2 py-1 bg-[#151E2D] hover:bg-[#1E293B] border border-[#253247] text-[#38BDF8] rounded flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>CSV Template</span>
            </a>
            <a
              href="/templates/period_import_template.json"
              download
              className="px-2 py-1 bg-[#151E2D] hover:bg-[#1E293B] border border-[#253247] text-[#38BDF8] rounded flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>JSON Template</span>
            </a>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-[#F43F5E]/10 border border-[#F43F5E]/30 rounded-lg text-[#F43F5E] text-xs flex items-start gap-2">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg text-[#10B981] text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {activeMode === "file" ? (
            <div className="space-y-3">
              <div className="p-4 bg-[#151E2D] border border-dashed border-[#253247] rounded-xl text-center space-y-2">
                <Upload className="w-8 h-8 text-[#38BDF8] mx-auto" />
                <div className="text-xs text-[#F3F6FC] font-semibold">
                  Choose a CSV or JSON file to upload
                </div>
                <p className="text-[10px] text-[#9AA8BC]">
                  Matches canonical schema: companyId, period, revenue, ebit, ebitda, assets, liabilities, equity, cash, debt...
                </p>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="period-file-input"
                />
                <label
                  htmlFor="period-file-input"
                  className="inline-block px-3 py-1.5 bg-[#3867F5] hover:bg-[#2c53cb] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Browse Files
                </label>
                {fileName && (
                  <div className="text-[11px] text-[#10B981] font-mono mt-1">
                    Selected: {fileName}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#9AA8BC] uppercase font-bold flex items-center justify-between">
                  <span>Or Paste Raw CSV / JSON Data</span>
                  <span className="text-[9px] text-[#9AA8BC] normal-case">
                    Must adhere to balance identity: Assets = Liabilities + Equity (±0.5%)
                  </span>
                </label>
                <textarea
                  rows={8}
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  placeholder={`companyId,period,periodType,filingDate,filingForm,currency,scaleUnit,revenue,ebit,ebitda,interestExpense,netIncome,cashAndEquivalents,marketableSecurities,totalCurrentAssets,totalAssets,totalCurrentLiabilities,totalDebt,totalLiabilities,totalShareholdersEquity,operatingCashFlow,freeCashFlow\nTCS.NS,FY2024,ANNUAL,2024-03-31,Annual Report,INR,Crores,240893,59325,64319,812,46099,9014,10120,102430,143580,47210,0,50942,92638,48950,44210`}
                  className="w-full p-2.5 bg-[#151E2D] border border-[#253247] rounded-lg text-[#F3F6FC] font-mono text-[11px] focus:outline-none focus:border-[#3867F5]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Company *</label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleManualCompanyChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#151E2D] border border-[#253247] text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.symbol} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Fiscal Period *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FY2024"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 bg-[#151E2D] border border-[#253247] text-[#F3F6FC] uppercase rounded-lg focus:outline-none focus:border-[#3867F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Period Type</label>
                  <select
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value as "ANNUAL" | "QUARTERLY")}
                    className="w-full px-2.5 py-1.5 bg-[#151E2D] border border-[#253247] text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
                  >
                    <option value="ANNUAL">ANNUAL</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Filing Date</label>
                  <input
                    type="date"
                    value={filingDate}
                    onChange={(e) => setFilingDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#151E2D] border border-[#253247] text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Filing Form</label>
                  <input
                    type="text"
                    value={filingForm}
                    onChange={(e) => setFilingForm(e.target.value)}
                    placeholder="e.g. 10-K, Annual Report"
                    className="w-full px-2.5 py-1.5 bg-[#151E2D] border border-[#253247] text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Filing URL</label>
                  <input
                    type="text"
                    value={filingUrl}
                    onChange={(e) => setFilingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 bg-[#151E2D] border border-[#253247] text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 bg-[#151E2D] border border-[#253247] text-[#F3F6FC] uppercase rounded-lg focus:outline-none focus:border-[#3867F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9AA8BC] uppercase font-bold">Scale Unit</label>
                  <input
                    type="text"
                    value={scaleUnit}
                    onChange={(e) => setScaleUnit(e.target.value)}
                    placeholder="e.g. Crores, Millions"
                    className="w-full px-2.5 py-1.5 bg-[#151E2D] border border-[#253247] text-[#F3F6FC] rounded-lg focus:outline-none focus:border-[#3867F5]"
                  />
                </div>
              </div>

              {/* Income Statement */}
              <div className="p-3 bg-[#0A0E17] border border-[#253247] rounded-xl space-y-2">
                <span className="text-[10px] text-[#38BDF8] uppercase font-bold block">
                  1. Income Statement Metrics
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">Revenue</label>
                    <input
                      type="number"
                      step="any"
                      value={revenue}
                      onChange={(e) => setRevenue(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">EBIT</label>
                    <input
                      type="number"
                      step="any"
                      value={ebit}
                      onChange={(e) => setEbit(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">EBITDA</label>
                    <input
                      type="number"
                      step="any"
                      value={ebitda}
                      onChange={(e) => setEbitda(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">Finance Cost</label>
                    <input
                      type="number"
                      step="any"
                      value={interestExpense}
                      onChange={(e) => setInterestExpense(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">Net Income</label>
                    <input
                      type="number"
                      step="any"
                      value={netIncome}
                      onChange={(e) => setNetIncome(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Balance Sheet */}
              <div className="p-3 bg-[#0A0E17] border border-[#253247] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#38BDF8] uppercase font-bold">
                    2. Balance Sheet Metrics (Identity Checked)
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                      isBalanceValid
                        ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40"
                        : "bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40"
                    }`}
                  >
                    {isBalanceValid
                      ? `✓ Assets = Liab + Equity (Diff: ${Math.round(balanceDiff)})`
                      : `⚠ Mismatch: Assets (${numAssets}) ≠ L+E (${numLiab + numEquity})`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">Cash & Equivalents</label>
                    <input
                      type="number"
                      step="any"
                      value={cashAndEquivalents}
                      onChange={(e) => setCashAndEquivalents(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">Marketable Securities</label>
                    <input
                      type="number"
                      step="any"
                      value={marketableSecurities}
                      onChange={(e) => setMarketableSecurities(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">Total Current Assets</label>
                    <input
                      type="number"
                      step="any"
                      value={totalCurrentAssets}
                      onChange={(e) => setTotalCurrentAssets(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#F3F6FC] font-bold block">Total Assets *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={totalAssets}
                      onChange={(e) => setTotalAssets(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#38BDF8]/40 text-white rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">Total Debt (Borrowings)</label>
                    <input
                      type="number"
                      step="any"
                      value={totalDebt}
                      onChange={(e) => setTotalDebt(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">Current Liabilities</label>
                    <input
                      type="number"
                      step="any"
                      value={totalCurrentLiabilities}
                      onChange={(e) => setTotalCurrentLiabilities(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#F3F6FC] font-bold block">Total Liabilities *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={totalLiabilities}
                      onChange={(e) => setTotalLiabilities(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#38BDF8]/40 text-white rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#F3F6FC] font-bold block">Shareholders Equity *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={totalShareholdersEquity}
                      onChange={(e) => setTotalShareholdersEquity(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#38BDF8]/40 text-white rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Cash Flow */}
              <div className="p-3 bg-[#0A0E17] border border-[#253247] rounded-xl space-y-2">
                <span className="text-[10px] text-[#38BDF8] uppercase font-bold block">
                  3. Cash Flow Statement Metrics
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">Operating Cash Flow</label>
                    <input
                      type="number"
                      step="any"
                      value={operatingCashFlow}
                      onChange={(e) => setOperatingCashFlow(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#9AA8BC] block">Free Cash Flow</label>
                    <input
                      type="number"
                      step="any"
                      value={freeCashFlow}
                      onChange={(e) => setFreeCashFlow(e.target.value)}
                      className="w-full p-1.5 bg-[#151E2D] border border-[#253247] text-white rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#253247]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#151E2D] hover:bg-[#253247] text-[#9AA8BC] hover:text-[#F3F6FC] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (activeMode === "manual" && !isBalanceValid)}
              className="px-5 py-2 bg-[#3867F5] hover:bg-[#2c53cb] disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-[#3867F5]/25"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating & Upserting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Commit Period to SQLite</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
