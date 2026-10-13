import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(), // e.g. "AAPL", "RELIANCE.NS", "7203.T"
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  exchange: text("exchange").notNull(),
  country: text("country").notNull(), // USA, IND, JPN
  currency: text("currency").notNull(), // USD, INR, JPY
  scaleUnit: text("scale_unit").notNull(), // Millions, Crores, Billions
  isin: text("isin"),
  cik: text("cik"),
  sector: text("sector").notNull(),
  industry: text("industry").notNull(),
  fiscalYearEnd: text("fiscal_year_end").notNull(),
  accountingStandard: text("accounting_standard").notNull(), // US-GAAP, Ind-AS / IFRS, J-GAAP / IFRS
  fxRateToUsd: real("fx_rate_to_usd").notNull(),
  fxTimestamp: text("fx_timestamp").notNull(),
  marketCap: real("market_cap"),
  sharePrice: real("share_price"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const financialPeriods = sqliteTable("financial_periods", {
  id: text("id").primaryKey(), // AAPL_FY2024
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  period: text("period").notNull(), // FY2024, FY2023, FY2022
  periodType: text("period_type").notNull().default("ANNUAL"),
  filingDate: text("filing_date").notNull(),
  filingForm: text("filing_form").notNull(), // 10-K, Annual Report, Yuho 
  filingUrl: text("filing_url").notNull(),
  currency: text("currency").notNull(),
  scaleUnit: text("scale_unit").notNull(),

  // Income Statement
  revenue: real("revenue"),
  revenueXbrlTag: text("revenue_xbrl_tag"),
  cogs: real("cogs"),
  cogsXbrlTag: text("cogs_xbrl_tag"),
  grossProfit: real("gross_profit"),
  operatingExpenses: real("operating_expenses"),
  ebit: real("ebit"),
  ebitXbrlTag: text("ebit_xbrl_tag"),
  interestExpense: real("interest_expense"),
  taxExpense: real("tax_expense"),
  netIncome: real("net_income"),
  netIncomeXbrlTag: text("net_income_xbrl_tag"),

  // Balance Sheet
  cashAndEquivalents: real("cash_and_equivalents"),
  cashXbrlTag: text("cash_xbrl_tag"),
  marketableSecurities: real("marketable_securities"),
  accountsReceivable: real("accounts_receivable"),
  inventories: real("inventories"),
  totalCurrentAssets: real("total_current_assets"),
  totalCurrentAssetsXbrlTag: text("total_current_assets_xbrl_tag"),
  propertyPlantEquipment: real("property_plant_equipment"),
  totalAssets: real("total_assets"),
  totalAssetsXbrlTag: text("total_assets_xbrl_tag"),
  accountsPayable: real("accounts_payable"),
  shortTermDebt: real("short_term_debt"),
  totalCurrentLiabilities: real("total_current_liabilities"),
  totalCurrentLiabilitiesXbrlTag: text("total_current_liabilities_xbrl_tag"),
  longTermDebt: real("long_term_debt"),
  totalDebt: real("total_debt"),
  totalDebtXbrlTag: text("total_debt_xbrl_tag"),
  totalLiabilities: real("total_liabilities"),
  totalShareholdersEquity: real("total_shareholders_equity"),
  totalShareholdersEquityXbrlTag: text("total_shareholders_equity_xbrl_tag"),

  // Cash Flow
  operatingCashFlow: real("operating_cash_flow"),
  operatingCashFlowXbrlTag: text("operating_cash_flow_xbrl_tag"),
  capitalExpenditures: real("capital_expenditures"),
  freeCashFlow: real("free_cash_flow"),
  financingCashFlow: real("financing_cash_flow"),
  investingCashFlow: real("investing_cash_flow"),

  // Derived
  ebitda: real("ebitda"),
  ebitdaFormula: text("ebitda_formula"),
});

export const auditLineItems = sqliteTable("audit_line_items", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  period: text("period").notNull(),
  metricKey: text("metric_key").notNull(),
  metricLabel: text("metric_label").notNull(),
  reportedValue: real("reported_value"),
  currency: text("currency").notNull(),
  scaleUnit: text("scale_unit").notNull(),
  formula: text("formula"),
  xbrlTag: text("xbrl_tag").notNull(),
  sourceFiling: text("source_filing").notNull(),
  filingDate: text("filing_date").notNull(),
  filingUrl: text("filing_url").notNull(),
  calculationTreeJson: text("calculation_tree_json"),
  notes: text("notes"),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  desk: text("desk").notNull(),
  avatar: text("avatar").notNull().default("crest"),
  netDebtEbitdaHurdle: real("net_debt_ebitda_hurdle").default(3.50),
  interestCoverageHurdle: real("interest_coverage_hurdle").default(2.50),
  currentRatioHurdle: real("current_ratio_hurdle").default(1.10),
  createdAt: text("created_at").notNull(),
});

export type Company = typeof companies.$inferSelect;
export type FinancialPeriod = typeof financialPeriods.$inferSelect;
export type AuditLineItem = typeof auditLineItems.$inferSelect;
export type User = typeof users.$inferSelect;
