import {
  FinancialPeriodData,
  RatioAnalysis,
  EarlyWarningFlag,
  RiskTier,
  StressSimulationInputs,
  StressSimulationResult,
} from "./types";
import {
  calculateTolToTnw,
  calculateDebtServiceProxy,
  calculateAltmanZScore,
  calculateBeneishMScore,
} from "./financialCalculations";

/**
 * Deterministic Institutional Financial Health Engine & Formula DAG
 */

export function calculateRatios(
  period: FinancialPeriodData,
  priorPeriod?: FinancialPeriodData | null,
  isFinancialInstitution: boolean = false
): RatioAnalysis {
  const currentRatio =
    period.totalCurrentAssets && period.totalCurrentLiabilities && period.totalCurrentLiabilities > 0
      ? period.totalCurrentAssets / period.totalCurrentLiabilities
      : null;

  const quickAssets =
    (period.cashAndEquivalents ?? 0) +
    (period.marketableSecurities ?? 0) +
    (period.accountsReceivable ?? 0);
  const quickRatio =
    period.totalCurrentLiabilities && period.totalCurrentLiabilities > 0 && quickAssets > 0
      ? quickAssets / period.totalCurrentLiabilities
      : null;

  const cashRatio =
    period.cashAndEquivalents !== null &&
    period.cashAndEquivalents !== undefined &&
    period.totalCurrentLiabilities &&
    period.totalCurrentLiabilities > 0
      ? period.cashAndEquivalents / period.totalCurrentLiabilities
      : null;

  const debtToEquity =
    period.totalDebt !== null &&
    period.totalDebt !== undefined &&
    period.totalShareholdersEquity &&
    period.totalShareholdersEquity > 0
      ? period.totalDebt / period.totalShareholdersEquity
      : null;

  const netDebt =
    period.totalDebt !== null && period.totalDebt !== undefined
      ? period.totalDebt - (period.cashAndEquivalents ?? 0)
      : null;

  const netDebtToEbitda =
    netDebt !== null && period.ebitda && period.ebitda > 0
      ? netDebt / period.ebitda
      : null;

  const interestCoverage =
    period.ebit !== null &&
    period.ebit !== undefined &&
    period.interestExpense &&
    period.interestExpense > 0
      ? period.ebit / period.interestExpense
      : null;

  const cfoToNetIncome =
    period.operatingCashFlow !== null &&
    period.operatingCashFlow !== undefined &&
    period.netIncome &&
    period.netIncome !== 0
      ? period.operatingCashFlow / period.netIncome
      : null;

  const grossMarginPct =
    period.grossProfit !== null &&
    period.grossProfit !== undefined &&
    period.revenue &&
    period.revenue > 0
      ? (period.grossProfit / period.revenue) * 100
      : null;

  const operatingMarginPct =
    period.ebit !== null &&
    period.ebit !== undefined &&
    period.revenue &&
    period.revenue > 0
      ? (period.ebit / period.revenue) * 100
      : null;

  const netMarginPct =
    period.netIncome !== null &&
    period.netIncome !== undefined &&
    period.revenue &&
    period.revenue > 0
      ? (period.netIncome / period.revenue) * 100
      : null;

  const roePct =
    period.netIncome !== null &&
    period.netIncome !== undefined &&
    period.totalShareholdersEquity &&
    period.totalShareholdersEquity > 0
      ? (period.netIncome / period.totalShareholdersEquity) * 100
      : null;

  const roaPct =
    period.netIncome !== null &&
    period.netIncome !== undefined &&
    period.totalAssets &&
    period.totalAssets > 0
      ? (period.netIncome / period.totalAssets) * 100
      : null;

  // Indian appraisal TOL / TNW
  const tolTnwResult = calculateTolToTnw(period.totalLiabilities, period.totalShareholdersEquity);
  const tolToTnw = tolTnwResult.isComputable ? tolTnwResult.value : null;

  // Analytical Debt Service Proxy
  const dspResult = calculateDebtServiceProxy(period.ebitda, period.interestExpense, period.shortTermDebt);
  const debtServiceProxy = dspResult.isComputable ? dspResult.value : null;

  // Altman Z Diagnostic
  const workingCapital =
    period.totalCurrentAssets !== null &&
    period.totalCurrentAssets !== undefined &&
    period.totalCurrentLiabilities !== null &&
    period.totalCurrentLiabilities !== undefined
      ? period.totalCurrentAssets - period.totalCurrentLiabilities
      : null;

  const altmanResult = calculateAltmanZScore({
    workingCapital,
    retainedEarnings: null, // Zero fabrication: not segregated in primary face disclosure
    ebit: period.ebit,
    totalAssets: period.totalAssets,
    totalLiabilities: period.totalLiabilities,
    bookValueOfEquity: period.totalShareholdersEquity,
    isFinancialInstitution,
    variant: "Z_DOUBLE_PRIME",
  });
  const altmanZDoublePrime = altmanResult.isComputable ? altmanResult.value : null;
  const altmanZZone = altmanResult.zone ?? null;

  // Beneish M Diagnostic
  let beneishMScore: number | null = null;
  let beneishMZone: string | null = null;
  if (priorPeriod) {
    const mRes = calculateBeneishMScore({
      currentPeriod: period,
      priorPeriod: priorPeriod,
      isFinancialInstitution,
    });
    if (mRes.isComputable) {
      beneishMScore = mRes.value;
      beneishMZone = mRes.zone ?? null;
    }
  }

  return {
    currentRatio,
    quickRatio,
    cashRatio,
    debtToEquity,
    netDebtToEbitda,
    interestCoverage,
    cfoToNetIncome,
    grossMarginPct,
    operatingMarginPct,
    netMarginPct,
    roePct,
    roaPct,
    tolToTnw,
    debtServiceProxy,
    altmanZDoublePrime,
    altmanZZone,
    beneishMScore,
    beneishMZone,
  };
}

/**
 * Early Warning System (EWS) Vulnerability Detection
 */
export function evaluateEarlyWarnings(
  periods: FinancialPeriodData[],
  ratios: RatioAnalysis
): { flags: EarlyWarningFlag[]; score: number; tier: RiskTier } {
  const flags: EarlyWarningFlag[] = [];
  let score = 100;

  if (periods.length === 0) {
    return { flags, score: 50, tier: "TIER_2_WATCHLIST" };
  }

  const latest = periods[0];
  const prior = periods.length > 1 ? periods[1] : null;

  // 1. Gross Margin Decay (> 300 bps YoY)
  if (prior && latest.revenue && latest.grossProfit && prior.revenue && prior.grossProfit) {
    const latestGm = (latest.grossProfit / latest.revenue) * 100;
    const priorGm = (prior.grossProfit / prior.revenue) * 100;
    const gmDeltaBps = (latestGm - priorGm) * 100;

    if (gmDeltaBps < -300) {
      score -= 20;
      flags.push({
        id: "EWS_GM_DECAY",
        metric: "Gross Margin YoY Delta",
        condition: `Margin compressed by ${Math.abs(gmDeltaBps).toFixed(0)} bps YoY (> 300 bps threshold)`,
        severity: gmDeltaBps < -600 ? "CRITICAL" : "AMBER",
        title: "Gross Margin Compression",
        description: `Pricing power deterioration or surging COGS detected. Base margin moved from ${priorGm.toFixed(1)}% to ${latestGm.toFixed(1)}%.`,
        currentValue: `${gmDeltaBps.toFixed(0)} bps`,
        threshold: "-300 bps",
      });
    }
  }

  // 2. CFO-to-Net Income Divergence (Accrual / Working Capital Divergence)
  if (ratios.cfoToNetIncome !== null) {
    if (ratios.cfoToNetIncome < 0.7 && (latest.netIncome ?? 0) > 0) {
      const isCritical = ratios.cfoToNetIncome < 0.4 || (latest.operatingCashFlow ?? 0) < 0;
      score -= isCritical ? 25 : 15;
      flags.push({
        id: "EWS_CFO_DIVERGENCE",
        metric: "CFO / Net Income Conversion",
        condition: `Conversion multiple is ${ratios.cfoToNetIncome.toFixed(2)}x (Threshold: < 0.80x)`,
        severity: isCritical ? "CRITICAL" : "AMBER",
        title: "Aggressive Accrual / Cash Divergence",
        description: "Operating cash flow fails to confirm reported earnings quality. Working capital absorption is elevated.",
        currentValue: `${ratios.cfoToNetIncome.toFixed(2)}x`,
        threshold: "< 0.80x",
      });
    }
  }

  // 3. Cash-Burn Runway (< 6 months)
  const cash = (latest.cashAndEquivalents ?? 0) + (latest.marketableSecurities ?? 0);
  const fcf = latest.freeCashFlow ?? (latest.operatingCashFlow ? latest.operatingCashFlow - (latest.capitalExpenditures ?? 0) : null);
  
  if (fcf !== null && fcf < 0) {
    const monthlyBurn = Math.abs(fcf) / 12;
    const runwayMonths = monthlyBurn > 0 ? cash / monthlyBurn : 999;

    if (runwayMonths < 6) {
      score -= 35;
      flags.push({
        id: "EWS_CASH_RUNWAY_CRITICAL",
        metric: "Liquidity Runway",
        condition: `Available liquidity sustains operations for ${runwayMonths.toFixed(1)} months (< 6.0 months limit)`,
        severity: "CRITICAL",
        title: "Acute Liquidity Exhaustion",
        description: "Negative Free Cash Flow burn rate threatens solvency unless external liquidity or capital raise is executed.",
        currentValue: `${runwayMonths.toFixed(1)} Mo`,
        threshold: "< 6.0 Mo",
      });
    } else if (runwayMonths < 12) {
      score -= 15;
      flags.push({
        id: "EWS_CASH_RUNWAY_MONITOR",
        metric: "Liquidity Runway",
        condition: `Liquidity runway stands at ${runwayMonths.toFixed(1)} months (< 12.0 months buffer)`,
        severity: "AMBER",
        title: "Elevated Cash Burn Watchlist",
        description: "Operating cash burn requires proactive refinancing or working capital rationalization.",
        currentValue: `${runwayMonths.toFixed(1)} Mo`,
        threshold: "< 12.0 Mo",
      });
    }
  }

  // 4. Interest Coverage Fragility
  if (ratios.interestCoverage !== null) {
    if (ratios.interestCoverage < 1.5) {
      score -= 30;
      flags.push({
        id: "EWS_INTEREST_COV_CRITICAL",
        metric: "EBIT Interest Coverage",
        condition: `EBIT Coverage is ${ratios.interestCoverage.toFixed(2)}x (Sub-investment grade stress)`,
        severity: "CRITICAL",
        title: "Debt Service Default Vulnerability",
        description: "Operating earnings are inadequate to reliably service fixed debt obligations under higher base rates.",
        currentValue: `${ratios.interestCoverage.toFixed(2)}x`,
        threshold: "< 1.50x",
      });
    } else if (ratios.interestCoverage < 3.0) {
      score -= 15;
      flags.push({
        id: "EWS_INTEREST_COV_AMBER",
        metric: "EBIT Interest Coverage",
        condition: `EBIT Coverage is ${ratios.interestCoverage.toFixed(2)}x (< 3.00x institutional hurdle)`,
        severity: "AMBER",
        title: "Tight Debt Coverage Buffer",
        description: "Buffer against monetary tightening or margin contraction is narrow.",
        currentValue: `${ratios.interestCoverage.toFixed(2)}x`,
        threshold: "< 3.00x",
      });
    }
  }

  // 5. Net Debt to EBITDA
  if (ratios.netDebtToEbitda !== null) {
    if (ratios.netDebtToEbitda > 4.5) {
      score -= 25;
      flags.push({
        id: "EWS_LEVERAGE_CRITICAL",
        metric: "Net Debt / EBITDA",
        condition: `Leverage multiple is ${ratios.netDebtToEbitda.toFixed(2)}x (Excessive gearing)`,
        severity: "CRITICAL",
        title: "Excessive Balance Sheet Gearing",
        description: "Net indebtedness relative to cash generation exceeds Tier 1 screening threshold limits.",
        currentValue: `${ratios.netDebtToEbitda.toFixed(2)}x`,
        threshold: "> 4.50x",
      });
    } else if (ratios.netDebtToEbitda > 3.0) {
      score -= 10;
      flags.push({
        id: "EWS_LEVERAGE_AMBER",
        metric: "Net Debt / EBITDA",
        condition: `Leverage multiple is ${ratios.netDebtToEbitda.toFixed(2)}x (> 3.00x watchlist limit)`,
        severity: "AMBER",
        title: "Elevated Debt Gearing",
        description: "Credit rating pressure likely if debt repayment velocity does not accelerate.",
        currentValue: `${ratios.netDebtToEbitda.toFixed(2)}x`,
        threshold: "> 3.00x",
      });
    }
  }

  // 6. Current Ratio Deficit
  if (ratios.currentRatio !== null && ratios.currentRatio < 1.0) {
    score -= 15;
    flags.push({
      id: "EWS_WORKING_CAPITAL_DEFICIT",
      metric: "Current Ratio",
      condition: `Current Ratio is ${ratios.currentRatio.toFixed(2)}x (< 1.00x negative net working capital)`,
      severity: ratios.currentRatio < 0.75 ? "CRITICAL" : "AMBER",
      title: "Working Capital Inversion",
      description: "Short-term liabilities exceed short-term liquid assets. Reliance on vendor credit or rollover lines.",
      currentValue: `${ratios.currentRatio.toFixed(2)}x`,
      threshold: "< 1.00x",
    });
  }

  score = Math.max(10, Math.min(100, score));

  let tier: RiskTier = "TIER_1_STABLE";
  if (score < 50 || flags.some((f) => f.severity === "CRITICAL")) {
    tier = "TIER_3_CRITICAL";
  } else if (score < 80 || flags.some((f) => f.severity === "AMBER")) {
    tier = "TIER_2_WATCHLIST";
  }

  return { flags, score, tier };
}

/**
 * Deterministic Stress Simulator
 */
export function runStressSimulation(
  latestPeriod: FinancialPeriodData,
  inputs: StressSimulationInputs
): StressSimulationResult {
  const baseRev = latestPeriod.revenue ?? 0;
  const baseCogs = latestPeriod.cogs ?? 0;
  const baseOpex =
    latestPeriod.operatingExpenses ??
    (latestPeriod.grossProfit !== null && latestPeriod.ebit !== null
      ? latestPeriod.grossProfit - latestPeriod.ebit
      : baseRev * 0.15);
  const baseInterest = latestPeriod.interestExpense ?? 0;
  const baseTotalDebt = latestPeriod.totalDebt ?? 0;
  const baseCash = (latestPeriod.cashAndEquivalents ?? 0) + (latestPeriod.marketableSecurities ?? 0);
  const baseEbitda = latestPeriod.ebitda ?? (latestPeriod.ebit ? latestPeriod.ebit * 1.15 : baseRev * 0.25);
  const baseDeprec = Math.max(0, baseEbitda - (latestPeriod.ebit ?? baseRev * 0.2));

  // 1. Shocks & Assumptions
  const revShockFactor = 1 + inputs.revenueShockPct / 100;
  const cogsShockFactor = 1 + inputs.cogsInflationPct / 100;
  const rateShockDecimal = inputs.rateShockBps / 10000; // e.g. 200 bps = 0.02
  const floatingRateDebtSharePct = inputs.floatingRateDebtSharePct ?? 40; // Default 40% floating-rate facility share
  const stressedFloatingDebtAmount = baseTotalDebt * (floatingRateDebtSharePct / 100);

  // 2. Recalculations
  const simulatedRevenue = baseRev * revShockFactor;
  const simulatedCogs = baseCogs * cogsShockFactor;
  const simulatedGrossProfit = simulatedRevenue - simulatedCogs;
  const simulatedGrossMarginPct = simulatedRevenue > 0 ? (simulatedGrossProfit / simulatedRevenue) * 100 : 0;
  const simulatedEbit = simulatedGrossProfit - baseOpex;

  // Stressed interest: applies rate shock strictly to floating-rate debt portion
  const incrementalInterestExpense = stressedFloatingDebtAmount * rateShockDecimal;
  const simulatedInterestExpense = baseInterest + incrementalInterestExpense;

  const simulatedEbitda = simulatedEbit + baseDeprec;

  // Effective tax rate assumption (21% base corporate tax floor)
  const effectiveTaxRate =
    latestPeriod.taxExpense && latestPeriod.ebit && latestPeriod.ebit > 0
      ? Math.min(0.35, Math.max(0.15, latestPeriod.taxExpense / latestPeriod.ebit))
      : 0.21;

  const preTaxEarnings = simulatedEbit - simulatedInterestExpense;
  const simulatedNetIncome = preTaxEarnings > 0 ? preTaxEarnings * (1 - effectiveTaxRate) : preTaxEarnings;

  const simulatedInterestCoverage =
    simulatedInterestExpense > 0 ? simulatedEbit / simulatedInterestExpense : null;

  const simulatedNetDebt = baseTotalDebt - baseCash;
  const simulatedNetDebtToEbitda =
    simulatedEbitda > 0 ? simulatedNetDebt / simulatedEbitda : null;

  // Stressed Cash-Burn Runway
  // Approximate Stressed Operating Cash Flow delta
  const ebitDelta = simulatedEbit - (latestPeriod.ebit ?? 0);
  const interestDelta = simulatedInterestExpense - baseInterest;
  const baseFcf = latestPeriod.freeCashFlow ?? (latestPeriod.operatingCashFlow ?? simulatedNetIncome * 0.9);
  const simulatedFcf = baseFcf + ebitDelta - interestDelta;

  let projectedMonthlyBurn = 0;
  let cashBurnRunwayMonths: number | null = null;
  let runwayStatus: "SUFFICIENT" | "MONITOR" | "CRITICAL_BURN" = "SUFFICIENT";

  if (simulatedFcf < 0) {
    projectedMonthlyBurn = Math.abs(simulatedFcf) / 12;
    cashBurnRunwayMonths = projectedMonthlyBurn > 0 ? baseCash / projectedMonthlyBurn : 0;
    if (cashBurnRunwayMonths < 6) {
      runwayStatus = "CRITICAL_BURN";
    } else {
      runwayStatus = "MONITOR";
    }
  }

  return {
    basePeriod: latestPeriod.period,
    simulatedRevenue,
    revenueDeltaPct: inputs.revenueShockPct,
    simulatedCogs,
    simulatedGrossProfit,
    simulatedGrossMarginPct,
    simulatedEbit,
    simulatedInterestExpense,
    incrementalInterestExpense,
    floatingRateDebtSharePct,
    stressedFloatingDebtAmount: Number(stressedFloatingDebtAmount.toFixed(2)),
    simulatedEbitda,
    simulatedNetIncome,
    simulatedInterestCoverage,
    simulatedNetDebtToEbitda,
    projectedMonthlyBurn,
    cashBurnRunwayMonths,
    runwayStatus,
  };
}
