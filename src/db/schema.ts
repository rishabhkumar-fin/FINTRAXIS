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
  cin: text("cin"),
  sector: text("sector").notNull(),
  industry: text("industry").notNull(),
  fiscalYearEnd: text("fiscal_year_end").notNull(),
  accountingStandard: text("accounting_standard").notNull(), // US-GAAP, Ind-AS / IFRS, J-GAAP / IFRS
  fxRateToUsd: real("fx_rate_to_usd").notNull(),
  fxTimestamp: text("fx_timestamp").notNull(),
  marketCap: real("market_cap"),
  sharePrice: real("share_price"),
  // Phase 9 Additive Promoter / Ownership Governance
  hasPromoterGroup: real("has_promoter_group").default(1), // 1 if disclosed promoter group exists, 0 if widely held
  promoterHoldingPct: real("promoter_holding_pct"),
  promoterPledgedPct: real("promoter_pledged_pct"), // % of promoter holding pledged
  promoterPledgedCapitalPct: real("promoter_pledged_capital_pct"), // % of total share capital
  promoterPledgeQuarter: text("promoter_pledge_quarter"),
  promoterPledgeSourceUrl: text("promoter_pledge_source_url"),
  promoterPledgeVerification: text("promoter_pledge_verification").default("NOT_INDEPENDENTLY_VERIFIED"),
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

  // Phase 9 Additive Financial Appraisal & Working Capital Fields
  receivablesAgeingUnder90Days: real("receivables_ageing_under_90_days"),
  workingCapitalBorrowings: real("working_capital_borrowings"),
  intangibles: real("intangibles"),
  contingentLiabilitiesTotal: real("contingent_liabilities_total"),
  contingentLiabilitiesTax: real("contingent_liabilities_tax"),
  contingentLiabilitiesGuarantees: real("contingent_liabilities_guarantees"),
  contingentLiabilitiesClaims: real("contingent_liabilities_claims"),
  contingentLiabilitiesSourceUrl: text("contingent_liabilities_source_url"),
  contingentLiabilitiesVerification: text("contingent_liabilities_verification").default("NOT_INDEPENDENTLY_VERIFIED"),
});

export const debtInstruments = sqliteTable("debt_instruments", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  period: text("period").notNull(),
  instrumentName: text("instrument_name").notNull(),
  coupon: real("coupon"),
  couponType: text("coupon_type").notNull().default("FIXED"),
  currency: text("currency").notNull(),
  maturityYear: text("maturity_year"),
  principalAmount: real("principal_amount").notNull(),
  sourceForm: text("source_form").notNull(),
  filingDate: text("filing_date").notNull(),
  sectionOrPage: text("section_or_page").notNull(),
  verificationFlag: text("verification_flag").notNull().default("NOT_INDEPENDENTLY_VERIFIED"),
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
  role: text("role").notNull().default("ANALYST"),
  status: text("status").notNull().default("ACTIVE"),
  mustChangePassword: real("must_change_password").default(0),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull(),
});

export const adminAuditLogs = sqliteTable("admin_audit_logs", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  eventType: text("event_type").notNull(),
  severity: text("severity").notNull(),
  operator: text("operator").notNull(),
  details: text("details").notNull(),
});

export const systemConfig = sqliteTable("system_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});

export const systemJobs = sqliteTable("system_jobs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  status: text("status").notNull().default("IDLE"),
  lastRunAt: text("last_run_at"),
  lastDurationMs: real("last_duration_ms"),
  recordsProcessed: real("records_processed").default(0),
  lastError: text("last_error"),
  createdAt: text("created_at").notNull(),
});

export type Company = typeof companies.$inferSelect;
export type FinancialPeriod = typeof financialPeriods.$inferSelect;
export type AuditLineItem = typeof auditLineItems.$inferSelect;
export type User = typeof users.$inferSelect;
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type SystemJob = typeof systemJobs.$inferSelect;
export type DebtInstrument = typeof debtInstruments.$inferSelect;
