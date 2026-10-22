import type { CompanyEntity, FinancialPeriodData, RiskTier } from "../types";

export type QuoteStatus = "live" | "delayed" | "end-of-day" | "reference";

export interface StandardMarketQuote {
  symbol: string;
  price: number;
  chartPreviousClose: number;
  previousDayClose: number;
  change: number;
  changePercent: number;
  dayLow: number;
  dayHigh: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  currency: string;
  currencySymbol: string;
  exchangeName: string;
  asOf: string;
  source: string;
  status: QuoteStatus;
  statusLabel: string;
}

export interface ScoreComponentBreakdown {
  name: string;
  score: number; // component points earned
  maxScore: number;
  weightPct: number;
  rationale: string;
}

export interface CompanyFinanceSummary {
  company: CompanyEntity;
  period: FinancialPeriodData;
  allPeriods: FinancialPeriodData[];
  periodsCount: number;
  latestPeriodLabel: string;
  quote: StandardMarketQuote;
  
  // Debt Architecture
  debtStructure: {
    totalDebt: number;
    borrowings: number;
    leaseLiabilities: number;
    cashAndEquivalents: number;
    liquidInvestments: number;
    hasFundedBorrowings: boolean;
    explanation: string;
  };

  // Core Computed Ratios (Single Source of Truth)
  ratios: {
    netDebt: number;
    isNetCash: boolean;
    netDebtToEbitda: number | null;
    netDebtToEbitdaLabel: string; // e.g. "-0.62x (Net Cash position)"
    interestCoverage: number | null;
    interestCoverageLabel: string;
    financeCostExplanation: string;
    currentRatio: number | null;
    quickRatio: number | null;
    cashRatio: number | null;
    operatingMarginPct: number | null;
    grossMarginPct: number | null;
    netMarginPct: number | null;
    roePct: number | null;
    roaPct: number | null;
    fcf: number | null;
    cfoToNetIncome: number | null;
    tolToTnw: number | null;
    altmanZScore: number | null;
    beneishMScore: number | null;
    promoterPledgePct: number | null;
    indicativeDrawingPower: number | null;
    contingentLiabilitiesPct: number | null;
  };

  // Differentiating Health Score (transparent, graded, screening score)
  healthScore: {
    score: number; // Graded 0-100 (never arbitrary 100 for all)
    tier: RiskTier;
    tierLabel: string;
    screeningDisclaimer: string;
    components: ScoreComponentBreakdown[];
  };

  // Regulatory context
  regulatory: {
    framework: string; // "Ind AS" | "US-GAAP" | "IFRS"
    isBankOrFinancial: boolean;
    cikLabel: string; // Real CIK or "Not applicable (not an SEC registrant)"
    isinLabel: string;
    countryName: string;
  };
}
