import type Database from "better-sqlite3";

export interface PeriodImportPayload {
  ticker: string;
  fiscal_year: string;
  period_end?: string;
  basis?: string;
  framework?: string;
  currency?: string;
  scale_unit?: string;
  source_name?: string;
  source_url?: string;
  filing_date?: string;
  retrieval_date?: string;
  status?: string;

  // Financial Items
  revenue_from_operations?: number;
  revenue?: number;
  other_income?: number;
  operating_costs?: number;
  operating_expenses?: number;
  employee_cost?: number;
  depreciation_amortization?: number;
  finance_cost?: number;
  interest_expense?: number;
  ebit?: number;
  ebitda?: number;
  profit_before_tax?: number;
  tax_expense?: number;
  net_income?: number;

  cash_and_equivalents?: number;
  other_liquid_investments?: number;
  marketable_securities?: number;
  current_assets?: number;
  total_current_assets?: number;
  current_liabilities?: number;
  total_current_liabilities?: number;
  borrowings_current?: number;
  short_term_debt?: number;
  borrowings_non_current?: number;
  long_term_debt?: number;
  total_debt?: number;
  lease_liabilities?: number;
  total_assets?: number;
  total_liabilities?: number;
  total_equity?: number;
  total_shareholders_equity?: number;

  operating_cash_flow?: number;
  capex?: number;
  capital_expenditures?: number;
  free_cash_flow?: number;

  auditor_name?: string;
  auditor_opinion?: string;
}

export interface PeriodValidationResult {
  isValid: boolean;
  error?: string;
  warnings: string[];
  cleanData?: {
    ticker: string;
    fiscalYear: string;
    currency: string;
    scaleUnit: string;
    filingDate: string;
    filingForm: string;
    filingUrl: string;
    status: string;
    revenue: number;
    ebit: number;
    ebitda: number;
    interestExpense: number;
    netIncome: number;
    cash: number;
    liquidInv: number;
    curAssets: number;
    curLiab: number;
    totAssets: number;
    totLiab: number;
    totEquity: number;
    rawDebt: number;
    opCashFlow: number | null;
    fcf: number | null;
  };
}

/**
 * Validates a financial period import record against strict institutional rules:
 * - Assets = Liabilities + Equity within 0.5% tolerance
 * - Non-negative values for revenue, cash, total assets
 * - EBITDA consistency check against EBIT + D&A
 */
export function validatePeriodRecord(
  item: PeriodImportPayload,
  companyFallback?: { currency: string; scaleUnit: string }
): PeriodValidationResult {
  const ticker = (item.ticker || (item as unknown as { companyId?: string }).companyId || "").toUpperCase().trim();
  const fiscalYear = (item.fiscal_year || (item as unknown as { period?: string }).period || "").toUpperCase().trim();

  if (!ticker || !fiscalYear) {
    return {
      isValid: false,
      error: "Each reporting period requires a valid ticker and fiscal_year (e.g., FY2025).",
      warnings: [],
    };
  }

  const currency = item.currency || companyFallback?.currency || "USD";
  const scaleUnit = item.scale_unit || companyFallback?.scaleUnit || "Millions";
  const warnings: string[] = [];

  const revenue = Number(item.revenue_from_operations ?? item.revenue ?? 0);
  const ebit = item.ebit !== undefined ? Number(item.ebit) : null;
  const ebitda = item.ebitda !== undefined ? Number(item.ebitda) : null;
  const interestExpense = Number(item.finance_cost ?? item.interest_expense ?? 0);
  const netIncome = Number(item.net_income ?? 0);
  const cash = Number(item.cash_and_equivalents ?? 0);
  const liquidInv = Number(item.other_liquid_investments ?? item.marketable_securities ?? 0);
  const curAssets = Number(item.current_assets ?? item.total_current_assets ?? 0);
  const curLiab = Number(item.current_liabilities ?? item.total_current_liabilities ?? 0);
  const totAssets = Number(item.total_assets ?? 0);
  const totLiab = Number(item.total_liabilities ?? 0);
  const totEquity = Number(item.total_equity ?? item.total_shareholders_equity ?? 0);
  const opCashFlow = item.operating_cash_flow !== undefined ? Number(item.operating_cash_flow) : null;
  const capex = item.capex !== undefined ? Number(item.capex) : (item.capital_expenditures !== undefined ? Number(item.capital_expenditures) : null);
  const fcf = item.free_cash_flow !== undefined ? Number(item.free_cash_flow) : (opCashFlow !== null && capex !== null ? opCashFlow - capex : null);
  const rawDebt = item.total_debt !== undefined
    ? Number(item.total_debt)
    : ((Number(item.borrowings_current ?? item.short_term_debt ?? 0)) + (Number(item.borrowings_non_current ?? item.long_term_debt ?? 0)));

  // Strict balance sheet identity check
  if (totAssets > 0 && totLiab > 0 && totEquity > 0) {
    const diff = Math.abs(totAssets - (totLiab + totEquity));
    const allowedDiff = totAssets * 0.005; // 0.5% tolerance
    if (diff > allowedDiff) {
      return {
        isValid: false,
        error: `Balance Sheet Identity Mismatch for ${ticker} ${fiscalYear}: Total Assets (${totAssets.toLocaleString()}) ≠ Liabilities + Equity (${(totLiab + totEquity).toLocaleString()}). Discrepancy of ${diff.toLocaleString()} ${currency} exceeds 0.5% tolerance.`,
        warnings,
      };
    }
  }

  // Sign constraints
  if (revenue < 0) {
    return { isValid: false, error: `Negative revenue reported for ${ticker} ${fiscalYear}.`, warnings };
  }
  if (totAssets < 0) {
    return { isValid: false, error: `Negative total assets reported for ${ticker} ${fiscalYear}.`, warnings };
  }
  if (cash < 0) {
    return { isValid: false, error: `Negative cash reported for ${ticker} ${fiscalYear}.`, warnings };
  }

  // EBITDA = EBIT + D&A check
  const depAmort = item.depreciation_amortization !== undefined ? Number(item.depreciation_amortization) : null;
  if (ebit !== null && ebitda !== null && depAmort !== null) {
    const expected = ebit + depAmort;
    if (Math.abs(ebitda - expected) > Math.abs(expected) * 0.05 + 1) {
      warnings.push(`${ticker} ${fiscalYear}: EBITDA (${ebitda}) diverges from EBIT (${ebit}) + D&A (${depAmort}).`);
    }
  }

  const finalEbit = ebit !== null ? ebit : (ebitda !== null ? ebitda * 0.85 : 0);
  const finalEbitda = ebitda !== null ? ebitda : finalEbit * 1.15;
  const filingDate = item.filing_date || new Date().toISOString().split("T")[0];
  const filingForm = item.framework === "US-GAAP" ? "Form 10-K" : "Annual Audited Filing";
  const filingUrl = item.source_url || "https://www.bseindia.com";
  const status = item.status || "reported (user-entered from filing)";

  return {
    isValid: true,
    warnings,
    cleanData: {
      ticker,
      fiscalYear,
      currency,
      scaleUnit,
      filingDate,
      filingForm,
      filingUrl,
      status,
      revenue,
      ebit: finalEbit,
      ebitda: finalEbitda,
      interestExpense,
      netIncome,
      cash,
      liquidInv,
      curAssets,
      curLiab,
      totAssets,
      totLiab,
      totEquity,
      rawDebt,
      opCashFlow,
      fcf,
    },
  };
}

/**
 * Inserts or updates a financial period record in the SQLite database idempotently.
 */
export function executePeriodUpsert(
  sqliteDb: Database.Database,
  clean: NonNullable<PeriodValidationResult["cleanData"]>
): string {
  const periodId = `${clean.ticker}_${clean.fiscalYear}`;

  sqliteDb.prepare(`
    INSERT INTO financial_periods (
      id, company_id, period, period_type, filing_date, filing_form, filing_url,
      currency, scale_unit, revenue, ebit, ebitda, interest_expense, net_income,
      cash_and_equivalents, marketable_securities, total_current_assets, total_assets,
      total_current_liabilities, total_debt, total_liabilities, total_shareholders_equity,
      operating_cash_flow, free_cash_flow
    ) VALUES (
      ?, ?, ?, 'ANNUAL', ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      filing_date = excluded.filing_date,
      filing_form = excluded.filing_form,
      filing_url = excluded.filing_url,
      currency = excluded.currency,
      scale_unit = excluded.scale_unit,
      revenue = excluded.revenue,
      ebit = excluded.ebit,
      ebitda = excluded.ebitda,
      interest_expense = excluded.interest_expense,
      net_income = excluded.net_income,
      cash_and_equivalents = excluded.cash_and_equivalents,
      marketable_securities = excluded.marketable_securities,
      total_current_assets = excluded.total_current_assets,
      total_assets = excluded.total_assets,
      total_current_liabilities = excluded.total_current_liabilities,
      total_debt = excluded.total_debt,
      total_liabilities = excluded.total_liabilities,
      total_shareholders_equity = excluded.total_shareholders_equity,
      operating_cash_flow = excluded.operating_cash_flow,
      free_cash_flow = excluded.free_cash_flow
  `).run(
    periodId,
    clean.ticker,
    clean.fiscalYear,
    clean.filingDate,
    clean.filingForm,
    clean.filingUrl,
    clean.currency,
    clean.scaleUnit,
    clean.revenue,
    clean.ebit,
    clean.ebitda,
    clean.interestExpense,
    clean.netIncome,
    clean.cash,
    clean.liquidInv,
    clean.curAssets,
    clean.totAssets,
    clean.curLiab,
    clean.rawDebt,
    clean.totLiab,
    clean.totEquity,
    clean.opCashFlow,
    clean.fcf
  );

  return periodId;
}
