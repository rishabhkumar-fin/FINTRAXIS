export type CountryCode = "USA" | "IND" | "JPN" | "GBR" | "EUR" | "GLOBAL";
export type CurrencyCode = "USD" | "INR" | "JPY" | "GBP" | "EUR";
export type ScaleUnit = "Millions" | "Crores" | "Billions";
export type RiskTier = "TIER_1_STABLE" | "TIER_2_WATCHLIST" | "TIER_3_CRITICAL";

export interface CompanyEntity {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  country: CountryCode;
  currency: CurrencyCode;
  scaleUnit: ScaleUnit;
  isin?: string | null;
  cik?: string | null;
  sector: string;
  industry: string;
  fiscalYearEnd: string;
  accountingStandard: string;
  fxRateToUsd: number;
  fxTimestamp: string;
  marketCap?: number | null;
  sharePrice?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialPeriodData {
  id: string;
  companyId: string;
  period: string; // FY2024, FY2023, FY2022
  periodType: "ANNUAL" | "QUARTERLY";
  filingDate: string;
  filingForm: string;
  filingUrl: string;
  currency: CurrencyCode;
  scaleUnit: ScaleUnit;

  // Income Statement
  revenue: number | null;
  revenueXbrlTag?: string | null;
  cogs: number | null;
  cogsXbrlTag?: string | null;
  grossProfit: number | null;
  operatingExpenses: number | null;
  ebit: number | null;
  ebitXbrlTag?: string | null;
  interestExpense: number | null;
  taxExpense: number | null;
  netIncome: number | null;
  netIncomeXbrlTag?: string | null;

  // Balance Sheet
  cashAndEquivalents: number | null;
  cashXbrlTag?: string | null;
  marketableSecurities: number | null;
  accountsReceivable: number | null;
  inventories: number | null;
  totalCurrentAssets: number | null;
  totalCurrentAssetsXbrlTag?: string | null;
  propertyPlantEquipment: number | null;
  totalAssets: number | null;
  totalAssetsXbrlTag?: string | null;
  accountsPayable: number | null;
  shortTermDebt: number | null;
  totalCurrentLiabilities: number | null;
  totalCurrentLiabilitiesXbrlTag?: string | null;
  longTermDebt: number | null;
  totalDebt: number | null;
  totalDebtXbrlTag?: string | null;
  totalLiabilities: number | null;
  totalShareholdersEquity: number | null;
  totalShareholdersEquityXbrlTag?: string | null;

  // Cash Flow
  operatingCashFlow: number | null;
  operatingCashFlowXbrlTag?: string | null;
  capitalExpenditures: number | null;
  freeCashFlow: number | null;
  financingCashFlow?: number | null;
  investingCashFlow?: number | null;

  // Derived
  ebitda: number | null;
  ebitdaFormula?: string | null;
}

export interface AuditRecord {
  id: string;
  companyId: string;
  period: string;
  metricKey: string;
  metricLabel: string;
  reportedValue: number | null;
  currency: CurrencyCode;
  scaleUnit: ScaleUnit;
  formula?: string | null;
  xbrlTag: string;
  sourceFiling: string;
  filingDate: string;
  filingUrl: string;
  calculationTreeJson?: string | null;
  notes?: string | null;
}

export interface RatioAnalysis {
  currentRatio: number | null;
  quickRatio: number | null;
  cashRatio: number | null;
  debtToEquity: number | null;
  netDebtToEbitda: number | null;
  interestCoverage: number | null;
  cfoToNetIncome: number | null;
  grossMarginPct: number | null;
  operatingMarginPct: number | null;
  netMarginPct: number | null;
  roePct: number | null;
  roaPct: number | null;
}

export interface EarlyWarningFlag {
  id: string;
  metric: string;
  condition: string;
  severity: "INFO" | "AMBER" | "CRITICAL";
  title: string;
  description: string;
  currentValue: string;
  threshold: string;
}

export interface StressSimulationInputs {
  revenueShockPct: number; // e.g. -15 (-30 to +30)
  cogsInflationPct: number; // e.g. 5 (-15 to +15)
  rateShockBps: number; // e.g. 200 (+100 to +500)
}

export interface StressSimulationResult {
  basePeriod: string;
  simulatedRevenue: number;
  revenueDeltaPct: number;
  simulatedCogs: number;
  simulatedGrossProfit: number;
  simulatedGrossMarginPct: number;
  simulatedEbit: number;
  simulatedInterestExpense: number;
  incrementalInterestExpense: number;
  simulatedEbitda: number;
  simulatedNetIncome: number;
  simulatedInterestCoverage: number | null;
  simulatedNetDebtToEbitda: number | null;
  projectedMonthlyBurn: number;
  cashBurnRunwayMonths: number | null; // Infinity or null if cash-flow positive
  runwayStatus: "SUFFICIENT" | "MONITOR" | "CRITICAL_BURN";
}

export interface CompanyRiskProfile {
  company: CompanyEntity;
  periods: FinancialPeriodData[];
  latestRatios: RatioAnalysis;
  riskTier: RiskTier;
  riskScore: number; // 0 - 100
  earlyWarningFlags: EarlyWarningFlag[];
  simulation: StressSimulationResult;
}
