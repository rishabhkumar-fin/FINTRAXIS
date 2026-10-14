/**
 * FINTRAXIS Institutional Data Provider Interface
 * Standardizes security search, quote, price history, audited statements, and filings.
 * Guarantees provider independence, data honesty, and transparent provenance.
 */

export type DataKind = 
  | "REPORTED" 
  | "PROVIDER_NORMALIZED" 
  | "DERIVED_CALCULATION" 
  | "ANALYST_ASSUMPTION" 
  | "AI_GENERATED";

export type PriceStatus = "LIVE" | "DELAYED" | "END_OF_DAY" | "HISTORICAL";

export interface ProviderMetadata {
  id: string;
  name: string;
  tier: "OFFICIAL_REGULATORY" | "LICENSED_MARKET" | "NON_CONTRACTUAL" | "USER_SUPPLIED";
  isContractual: boolean;
  termsNotice: string;
}

export interface SecuritySearchResult {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  sector?: string;
  industry?: string;
  sourceStatus: "AVAILABLE" | "COVERED_NORMALIZED" | "NOT_FOUND";
  providerId: string;
}

export interface ProviderQuote {
  symbol: string;
  price: number | null;
  currency: string;
  status: PriceStatus;
  timestamp: string;
  dayChange?: number | null;
  dayChangePercent?: number | null;
  marketCap?: number | null;
  volume?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  provider: string;
  isStale?: boolean;
}

export interface PriceHistoryPoint {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export interface NormalizedStatementPeriod {
  period: string; // e.g. "FY2024"
  filingDate: string;
  filingForm: string;
  currency: string;
  scaleUnit: "Millions" | "Crores" | "Billions";
  sourceKind: DataKind;
  providerName: string;
  sourceUrl?: string;

  // Income Statement
  revenue: number | null;
  cogs: number | null;
  grossProfit: number | null;
  operatingExpenses: number | null;
  ebit: number | null;
  interestExpense: number | null;
  taxExpense: number | null;
  netIncome: number | null;

  // Balance Sheet
  cashAndEquivalents: number | null;
  marketableSecurities: number | null;
  accountsReceivable: number | null;
  inventories: number | null;
  totalCurrentAssets: number | null;
  propertyPlantEquipment: number | null;
  totalAssets: number | null;
  accountsPayable: number | null;
  shortTermDebt: number | null;
  totalCurrentLiabilities: number | null;
  longTermDebt: number | null;
  totalDebt: number | null;
  totalLiabilities: number | null;
  totalShareholdersEquity: number | null;

  // Cash Flow
  operatingCashFlow: number | null;
  capitalExpenditures: number | null;
  freeCashFlow: number | null;
  financingCashFlow: number | null;
  investingCashFlow: number | null;
}

export interface FilingDocument {
  id: string;
  period: string;
  form: string; // "10-K", "10-Q", "Annual Report"
  filingDate: string;
  filingUrl: string;
  sourceAuthority: "SEC_EDGAR" | "MCA_SEBI" | "EDINET" | "COMPANY_REGISTRY";
  cikOrIsin?: string;
  auditor?: string;
  isAudited: boolean;
}

export interface DataProvider {
  readonly metadata: ProviderMetadata;
  
  search(query: string): Promise<SecuritySearchResult[]>;
  getProfile(symbol: string): Promise<{
    symbol: string;
    name: string;
    exchange: string;
    country: string;
    currency: string;
    sector: string;
    industry: string;
    accountingStandard: string;
  } | null>;
  getQuote(symbol: string): Promise<ProviderQuote | null>;
  getPriceHistory(symbol: string, timeframe: string): Promise<PriceHistoryPoint[]>;
  getStatements(symbol: string): Promise<NormalizedStatementPeriod[]>;
  getFilings(symbol: string): Promise<FilingDocument[]>;
}
