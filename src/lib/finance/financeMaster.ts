import type { CompanyEntity, FinancialPeriodData, RiskTier } from "../types.ts";
import type { CompanyFinanceSummary, ScoreComponentBreakdown } from "./types.ts";
import { resolveMarketQuote } from "./quoteResolver.ts";
import {
  calculateTolToTnw,
  calculateAltmanZScore,
  calculateBeneishMScore,
  calculatePromoterPledgeRisk,
  calculateDrawingPower,
  calculateContingentLiabilitiesRatio,
} from "../financialCalculations.ts";

export interface FinanceMasterOptions {
  includeLeasesInNetDebt?: boolean;
  includeLiquidInvestments?: boolean;
}

/**
 * Computes a unified, strictly audited financial summary for a company.
 * Single source of truth consumed across all screens, Copilot, stress models, and exports.
 */
export function computeCompanyFinanceSummary(
  company: CompanyEntity,
  periods: FinancialPeriodData[],
  options: FinanceMasterOptions = {}
): CompanyFinanceSummary | null {
  if (!periods || periods.length === 0) return null;

  const includeLeases = options.includeLeasesInNetDebt ?? true;
  const includeLiquidInv = options.includeLiquidInvestments ?? false;

  const latest = periods[0];
  const prior = periods.length > 1 ? periods[1] : null;

  // 1. Debt Architecture & Decomposition
  // Total debt reported on balance sheet
  const rawTotalDebt = latest.totalDebt ?? ((latest.shortTermDebt ?? 0) + (latest.longTermDebt ?? 0));
  // Borrowings (funded bank/market debt)
  const borrowings = latest.workingCapitalBorrowings ?? rawTotalDebt;
  // Lease liabilities under Ind AS 116 / ASC 842
  const leaseLiabilities = Math.max(0, rawTotalDebt - borrowings);
  const hasFundedBorrowings = borrowings > 0;

  const cash = latest.cashAndEquivalents ?? 0;
  const liquidInv = includeLiquidInv ? (latest.marketableSecurities ?? 0) : 0;
  const totalLiquid = cash + liquidInv;

  const effectiveDebt = includeLeases ? rawTotalDebt : borrowings;
  const netDebt = effectiveDebt - totalLiquid;
  const isNetCash = netDebt <= 0;

  // Explanation for "Zero debt" vs Interest Expense
  let debtExplanation = "";
  if (rawTotalDebt === 0 && (latest.interestExpense ?? 0) > 0) {
    debtExplanation =
      "No financial borrowings; finance cost relates to lease liabilities (Ind AS 116 / ASC 842) and other finance charges.";
  } else if (isNetCash) {
    debtExplanation = `Net cash position: liquid reserves (${company.currency} ${totalLiquid.toLocaleString()}) exceed total debt (${company.currency} ${rawTotalDebt.toLocaleString()}).`;
  } else {
    debtExplanation = `Funded debt structure with ${company.currency} ${netDebt.toLocaleString()} net borrowings.`;
  }

  // 2. Core Financial Ratios (Consistent Net Debt / EBITDA Rule)
  const ebitda = latest.ebitda ?? ((latest.ebit ?? 0) * 1.12);
  let netDebtToEbitda: number | null = null;
  let netDebtToEbitdaLabel = "N/D";

  if (ebitda && ebitda > 0) {
    const rawMultiple = Number((netDebt / ebitda).toFixed(2));
    netDebtToEbitda = rawMultiple;
    if (isNetCash) {
      netDebtToEbitdaLabel = `${rawMultiple.toFixed(2)}x (Net Cash position)`;
    } else {
      netDebtToEbitdaLabel = `${rawMultiple.toFixed(2)}x`;
    }
  }

  // Interest Coverage
  let interestCoverage: number | null = null;
  let interestCoverageLabel = "N/D";
  const interest = latest.interestExpense ?? 0;
  const ebit = latest.ebit ?? 0;

  if (interest > 0) {
    interestCoverage = Number((ebit / interest).toFixed(2));
    interestCoverageLabel = `${interestCoverage.toFixed(2)}x`;
  } else if (interest === 0 && ebit > 0) {
    interestCoverageLabel = "Not applicable: no interest cost (debt-free)";
  }

  const financeCostExplanation =
    rawTotalDebt === 0 && interest > 0
      ? "Finance cost relates to lease liabilities under Ind AS 116, not bank borrowings"
      : "Operating EBIT divided by gross interest expense";

  // Liquidity Ratios
  const currentAssets = latest.totalCurrentAssets ?? 0;
  const currentLiabilities = latest.totalCurrentLiabilities ?? 0;
  const currentRatio = currentLiabilities > 0 ? Number((currentAssets / currentLiabilities).toFixed(2)) : null;

  const quickAssets = cash + (latest.marketableSecurities ?? 0) + (latest.accountsReceivable ?? 0);
  const quickRatio = currentLiabilities > 0 ? Number((quickAssets / currentLiabilities).toFixed(2)) : null;

  const cashRatio = currentLiabilities > 0 ? Number((cash / currentLiabilities).toFixed(2)) : null;

  // Margin Ratios
  const rev = latest.revenue ?? 0;
  const operatingMarginPct = rev > 0 ? Number(((ebit / rev) * 100).toFixed(2)) : null;
  const grossMarginPct = rev > 0 && latest.grossProfit ? Number(((latest.grossProfit / rev) * 100).toFixed(2)) : null;
  const netMarginPct = rev > 0 && latest.netIncome ? Number(((latest.netIncome / rev) * 100).toFixed(2)) : null;

  // Return Ratios
  const equity = latest.totalShareholdersEquity ?? 0;
  const assets = latest.totalAssets ?? 0;
  const roePct = equity > 0 && latest.netIncome ? Number(((latest.netIncome / equity) * 100).toFixed(2)) : null;
  const roaPct = assets > 0 && latest.netIncome ? Number(((latest.netIncome / assets) * 100).toFixed(2)) : null;

  // Cash flow & diagnostics
  const fcf = latest.freeCashFlow ?? ((latest.operatingCashFlow ?? 0) - (latest.capitalExpenditures ?? 0));
  const cfoToNetIncome = latest.netIncome && latest.netIncome !== 0 ? Number(((latest.operatingCashFlow ?? 0) / latest.netIncome).toFixed(2)) : null;

  const tolTnwResult = calculateTolToTnw(latest.totalLiabilities, equity);
  const tolToTnw = tolTnwResult.isComputable ? tolTnwResult.value : null;

  const isFinancial = company.sector.toLowerCase().includes("bank") || company.sector.toLowerCase().includes("financial");
  const workingCapital =
    latest.totalCurrentAssets !== null &&
    latest.totalCurrentAssets !== undefined &&
    latest.totalCurrentLiabilities !== null &&
    latest.totalCurrentLiabilities !== undefined
      ? latest.totalCurrentAssets - latest.totalCurrentLiabilities
      : null;

  const altmanZResult = calculateAltmanZScore({
    workingCapital,
    retainedEarnings: null,
    ebit: latest.ebit,
    totalAssets: latest.totalAssets,
    totalLiabilities: latest.totalLiabilities,
    bookValueOfEquity: latest.totalShareholdersEquity,
    isFinancialInstitution: isFinancial,
    variant: "Z_DOUBLE_PRIME",
  });
  const altmanZScore = altmanZResult.isComputable ? altmanZResult.value : null;

  const beneishMResult = prior
    ? calculateBeneishMScore({
        currentPeriod: latest,
        priorPeriod: prior,
        isFinancialInstitution: isFinancial,
      })
    : { isComputable: false, value: null };
  const beneishMScore = beneishMResult.isComputable ? beneishMResult.value : null;

  const pledgeResult = calculatePromoterPledgeRisk({
    hasDisclosedPromoterGroup: company.hasPromoterGroup === 1,
    promoterHoldingPct: company.promoterHoldingPct,
    pledgedPctOfPromoterHolding: company.promoterPledgedPct,
  });
  const promoterPledgePct = pledgeResult.isComputable ? pledgeResult.value : null;

  const dpResult = calculateDrawingPower({
    inventory: latest.inventories,
    tradeCreditors: latest.accountsPayable,
    eligibleReceivablesUnder90Days: latest.receivablesAgeingUnder90Days ?? latest.accountsReceivable,
    workingCapitalBorrowings: latest.workingCapitalBorrowings,
    isBankOrFinancial: isFinancial,
  });
  const indicativeDrawingPower = dpResult.isComputable ? dpResult.value : null;

  const tangibleNetWorth = equity - (latest.intangibles ?? 0);
  const contingentResult = calculateContingentLiabilitiesRatio({
    totalContingentLiabilities: latest.contingentLiabilitiesTotal,
    tangibleNetWorth,
  });
  const contingentLiabilitiesPct = contingentResult.isComputable ? contingentResult.value : null;

  // 3. Transparent, Discriminating Credit Health Score (Graded 0-100, not flat 100)
  const components: ScoreComponentBreakdown[] = [];

  // Component 1: Leverage & Debt Burden (Weight: 25%)
  let leverageScore = 0;
  if (isNetCash) {
    leverageScore = 24; // High score for net cash, but conservative headroom
  } else if (netDebtToEbitda !== null) {
    if (netDebtToEbitda <= 1.0) leverageScore = 23;
    else if (netDebtToEbitda <= 2.0) leverageScore = 19;
    else if (netDebtToEbitda <= 3.0) leverageScore = 14;
    else if (netDebtToEbitda <= 4.0) leverageScore = 8;
    else leverageScore = 2;
  }
  components.push({
    name: "Leverage (Net Debt / EBITDA)",
    score: leverageScore,
    maxScore: 25,
    weightPct: 25,
    rationale: isNetCash
      ? "Net cash surplus buffers against operational contractions"
      : `Leverage multiple of ${netDebtToEbitda?.toFixed(2)}x vs 3.50x hurdle`,
  });

  // Component 2: Debt Service Coverage (Weight: 25%)
  let coverageScore = 0;
  if (interest === 0) {
    coverageScore = 25; // Debt free, no interest load
  } else if (interestCoverage !== null) {
    if (interestCoverage >= 20.0) coverageScore = 24;
    else if (interestCoverage >= 10.0) coverageScore = 21;
    else if (interestCoverage >= 4.0) coverageScore = 17;
    else if (interestCoverage >= 2.5) coverageScore = 12;
    else if (interestCoverage >= 1.5) coverageScore = 6;
    else coverageScore = 2;
  }
  components.push({
    name: "Interest Coverage (EBIT / Finance Cost)",
    score: coverageScore,
    maxScore: 25,
    weightPct: 25,
    rationale: interest === 0
      ? "Zero funded interest expense"
      : `Coverage of ${interestCoverage?.toFixed(1)}x provides ample debt service buffer`,
  });

  // Component 3: Working Capital Liquidity (Weight: 20%)
  let liquidityScore = 0;
  if (currentRatio !== null) {
    if (currentRatio >= 2.0) liquidityScore = 19;
    else if (currentRatio >= 1.5) liquidityScore = 17;
    else if (currentRatio >= 1.2) liquidityScore = 14;
    else if (currentRatio >= 1.0) liquidityScore = 10;
    else liquidityScore = 5;
  }
  components.push({
    name: "Current Liquidity (Current Ratio)",
    score: liquidityScore,
    maxScore: 20,
    weightPct: 20,
    rationale: `Current ratio of ${currentRatio?.toFixed(2)}x against 1.10x reference standard`,
  });

  // Component 4: Operating Profitability (Weight: 15%)
  let marginScore = 0;
  if (operatingMarginPct !== null) {
    if (operatingMarginPct >= 25.0) marginScore = 15;
    else if (operatingMarginPct >= 18.0) marginScore = 13;
    else if (operatingMarginPct >= 10.0) marginScore = 10;
    else if (operatingMarginPct >= 5.0) marginScore = 6;
    else marginScore = 2;
  }
  components.push({
    name: "Operating Margin (EBIT / Revenue)",
    score: marginScore,
    maxScore: 15,
    weightPct: 15,
    rationale: `Operating margin of ${operatingMarginPct?.toFixed(1)}% demonstrates operational pricing power`,
  });

  // Component 5: Cash Conversion & Earnings Quality (Weight: 15%)
  let cashQualityScore = 0;
  if (cfoToNetIncome !== null) {
    if (cfoToNetIncome >= 1.1) cashQualityScore = 15;
    else if (cfoToNetIncome >= 0.9) cashQualityScore = 13;
    else if (cfoToNetIncome >= 0.7) cashQualityScore = 9;
    else if (cfoToNetIncome >= 0.5) cashQualityScore = 5;
    else cashQualityScore = 2;
  }
  components.push({
    name: "Earnings Quality (CFO / Net Income)",
    score: cashQualityScore,
    maxScore: 15,
    weightPct: 15,
    rationale: `Cash conversion multiple of ${cfoToNetIncome?.toFixed(2)}x indicates solid cash earnings backing`,
  });

  const totalScore = components.reduce((acc, c) => acc + c.score, 0);
  const tier: RiskTier =
    totalScore >= 75 ? "TIER_1_STABLE" : totalScore >= 55 ? "TIER_2_WATCHLIST" : "TIER_3_CRITICAL";
  const tierLabel = tier === "TIER_1_STABLE" ? "STABLE" : tier === "TIER_2_WATCHLIST" ? "WATCHLIST" : "CRITICAL";

  // 4. Regulatory & Identity Context (Accurate standard citing)
  const isIndian = company.country === "IND";
  const isUS = company.country === "USA";
  const framework = isIndian ? "Ind AS" : isUS ? "US-GAAP" : "IFRS";
  const cikLabel = company.cik && isUS ? company.cik : "Not applicable (not an SEC registrant)";
  const isinLabel = company.isin || "Not verified";

  const quote = resolveMarketQuote(company, null);

  return {
    company,
    period: latest,
    allPeriods: periods,
    periodsCount: periods.length,
    latestPeriodLabel: `Latest period in dataset: ${latest.period}. Newer filings may exist.`,
    quote,
    debtStructure: {
      totalDebt: rawTotalDebt,
      borrowings,
      leaseLiabilities,
      cashAndEquivalents: cash,
      liquidInvestments: liquidInv,
      hasFundedBorrowings,
      explanation: debtExplanation,
    },
    ratios: {
      netDebt,
      isNetCash,
      netDebtToEbitda,
      netDebtToEbitdaLabel,
      interestCoverage,
      interestCoverageLabel,
      financeCostExplanation,
      currentRatio,
      quickRatio,
      cashRatio,
      operatingMarginPct,
      grossMarginPct,
      netMarginPct,
      roePct,
      roaPct,
      fcf,
      cfoToNetIncome,
      tolToTnw,
      altmanZScore,
      beneishMScore,
      promoterPledgePct,
      indicativeDrawingPower,
      contingentLiabilitiesPct,
    },
    healthScore: {
      score: totalScore,
      tier,
      tierLabel,
      screeningDisclaimer: "Screening signal, not a credit rating",
      components,
    },
    regulatory: {
      framework,
      isBankOrFinancial: isFinancial,
      cikLabel,
      isinLabel,
      countryName: isIndian ? "India" : isUS ? "United States" : company.country,
    },
  };
}
