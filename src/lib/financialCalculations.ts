/**
 * FINTRAXIS Server-Side Pure Financial Calculation Engine
 * 
 * Strict Standards:
 * - All financial arithmetic resides here as pure functions.
 * - The UI and AI never perform their own financial arithmetic.
 * - Explicit handling of null inputs, zero denominators, negative values, and mismatched periods.
 * - Returns typed ComputableResult<T> with explicit reasoning when not computable.
 * - Strict Balance Sheet Identity check with configurable tolerance (default 0.01%).
 */

export interface ComputableResult<T = number> {
  value: T | null;
  isComputable: boolean;
  status: "VALID" | "ZERO_DENOMINATOR" | "MISSING_INPUT" | "NEGATIVE_BASE" | "MISMATCHED_PERIOD";
  formula: string;
  reason?: string;
}

export interface BalanceSheetAuditResult {
  isBalanced: boolean;
  tolerancePct: number;
  difference: number;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  calculatedSum: number | null;
  status: "BALANCED" | "IMBALANCE_WARNING" | "MISSING_DATA";
  explanation: string;
}

/**
 * Checks Balance Sheet Accounting Identity:
 * Total Assets = Total Liabilities + Total Shareholders' Equity
 * 
 * Tolerance: Default 0.01% (0.0001) to account for published rounding in millions/crores.
 * Never silently adjusts figures.
 */
export function auditBalanceSheetIdentity(
  totalAssets: number | null | undefined,
  totalLiabilities: number | null | undefined,
  totalEquity: number | null | undefined,
  tolerancePct: number = 0.01
): BalanceSheetAuditResult {
  if (
    totalAssets === null ||
    totalAssets === undefined ||
    totalLiabilities === null ||
    totalLiabilities === undefined ||
    totalEquity === null ||
    totalEquity === undefined
  ) {
    return {
      isBalanced: false,
      tolerancePct,
      difference: 0,
      totalAssets: totalAssets ?? null,
      totalLiabilities: totalLiabilities ?? null,
      totalEquity: totalEquity ?? null,
      calculatedSum: null,
      status: "MISSING_DATA",
      explanation: "One or more core balance sheet aggregates are unavailable from the disclosure.",
    };
  }

  const sum = Number((totalLiabilities + totalEquity).toFixed(2));
  const diff = Number(Math.abs(totalAssets - sum).toFixed(2));
  const maxBase = Math.max(Math.abs(totalAssets), Math.abs(sum));
  const deviationPct = maxBase > 0 ? (diff / maxBase) * 100 : 0;

  const isBalanced = deviationPct <= tolerancePct;

  return {
    isBalanced,
    tolerancePct,
    difference: diff,
    totalAssets,
    totalLiabilities,
    totalEquity,
    calculatedSum: sum,
    status: isBalanced ? "BALANCED" : "IMBALANCE_WARNING",
    explanation: isBalanced
      ? `Balance sheet identity verified (Assets equal Liabilities + Equity within ±${tolerancePct}% tolerance).`
      : `Discrepancy of ${diff} detected (${deviationPct.toFixed(3)}% deviation exceeds ±${tolerancePct}% tolerance). Figures shown as reported without adjustment.`,
  };
}

/**
 * Net Debt Calculation:
 * Total Funded Debt - (Cash + Cash Equivalents + Marketable Securities)
 */
export function calculateNetDebt(
  totalDebt: number | null | undefined,
  cash: number | null | undefined,
  marketableSecurities: number | null | undefined = 0
): ComputableResult<number> {
  const formula = "Total Funded Debt - (Cash & Cash Equivalents + Marketable Securities)";

  if (totalDebt === null || totalDebt === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Total Debt is unavailable from current source.",
    };
  }

  const liquidCash = (cash ?? 0) + (marketableSecurities ?? 0);
  const netDebt = Number((totalDebt - liquidCash).toFixed(2));

  return {
    value: netDebt,
    isComputable: true,
    status: "VALID",
    formula,
  };
}

/**
 * Working Capital Calculation:
 * Total Current Assets - Total Current Liabilities
 */
export function calculateWorkingCapital(
  currentAssets: number | null | undefined,
  currentLiabilities: number | null | undefined
): ComputableResult<number> {
  const formula = "Total Current Assets - Total Current Liabilities";

  if (currentAssets === null || currentAssets === undefined || currentLiabilities === null || currentLiabilities === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Current Assets or Current Liabilities are unavailable from current source.",
    };
  }

  return {
    value: Number((currentAssets - currentLiabilities).toFixed(2)),
    isComputable: true,
    status: "VALID",
    formula,
  };
}

/**
 * Current Ratio:
 * Total Current Assets / Total Current Liabilities
 */
export function calculateCurrentRatio(
  currentAssets: number | null | undefined,
  currentLiabilities: number | null | undefined
): ComputableResult<number> {
  const formula = "Total Current Assets / Total Current Liabilities";

  if (currentAssets === null || currentAssets === undefined || currentLiabilities === null || currentLiabilities === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Current Assets or Current Liabilities are unavailable.",
    };
  }

  if (currentLiabilities === 0) {
    return {
      value: null,
      isComputable: false,
      status: "ZERO_DENOMINATOR",
      formula,
      reason: "Current Liabilities are zero; ratio is mathematically undefined.",
    };
  }

  return {
    value: Number((currentAssets / currentLiabilities).toFixed(2)),
    isComputable: true,
    status: "VALID",
    formula,
  };
}

/**
 * Net Debt to EBITDA:
 * Net Debt / EBITDA
 */
export function calculateNetDebtToEbitda(
  netDebt: number | null | undefined,
  ebitda: number | null | undefined
): ComputableResult<number> {
  const formula = "Net Debt / EBITDA";

  if (netDebt === null || netDebt === undefined || ebitda === null || ebitda === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Net Debt or EBITDA is unavailable.",
    };
  }

  if (ebitda <= 0) {
    return {
      value: null,
      isComputable: false,
      status: "NEGATIVE_BASE",
      formula,
      reason: "EBITDA is negative or zero; leverage multiple is not economically meaningful.",
    };
  }

  if (netDebt <= 0) {
    return {
      value: 0.0,
      isComputable: true,
      status: "VALID",
      formula,
      reason: "Entity is net-cash positive (Debt-Free buffer).",
    };
  }

  return {
    value: Number((netDebt / ebitda).toFixed(2)),
    isComputable: true,
    status: "VALID",
    formula,
  };
}

/**
 * EBIT Interest Coverage:
 * EBIT / Interest Expense
 */
export function calculateInterestCoverage(
  ebit: number | null | undefined,
  interestExpense: number | null | undefined
): ComputableResult<number> {
  const formula = "EBIT / Interest Expense";

  if (ebit === null || ebit === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Operating Income (EBIT) is unavailable.",
    };
  }

  if (interestExpense === null || interestExpense === undefined || interestExpense === 0) {
    return {
      value: null,
      isComputable: false,
      status: "ZERO_DENOMINATOR",
      formula,
      reason: "Zero interest expense reported (no debt service draw).",
    };
  }

  return {
    value: Number((ebit / Math.abs(interestExpense)).toFixed(2)),
    isComputable: true,
    status: "VALID",
    formula,
  };
}

/**
 * Free Cash Flow (FCF):
 * Operating Cash Flow - Capital Expenditures
 */
export function calculateFreeCashFlow(
  operatingCashFlow: number | null | undefined,
  capex: number | null | undefined
): ComputableResult<number> {
  const formula = "Operating Cash Flow - Capital Expenditures";

  if (operatingCashFlow === null || operatingCashFlow === undefined || capex === null || capex === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Operating Cash Flow or CapEx is unavailable.",
    };
  }

  return {
    value: Number((operatingCashFlow - Math.abs(capex)).toFixed(2)),
    isComputable: true,
    status: "VALID",
    formula,
  };
}

/**
 * Gross, Operating, and Net Margins (%)
 */
export function calculateMargin(
  numerator: number | null | undefined,
  revenue: number | null | undefined,
  marginType: "Gross" | "Operating" | "Net"
): ComputableResult<number> {
  const formula = `${marginType} Profit / Total Revenue * 100`;

  if (numerator === null || numerator === undefined || revenue === null || revenue === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: `${marginType} profit or Revenue is unavailable.`,
    };
  }

  if (revenue <= 0) {
    return {
      value: null,
      isComputable: false,
      status: "ZERO_DENOMINATOR",
      formula,
      reason: "Revenue is zero or negative; margin cannot be computed.",
    };
  }

  return {
    value: Number(((numerator / revenue) * 100).toFixed(2)),
    isComputable: true,
    status: "VALID",
    formula,
  };
}

/**
 * Period-over-Period Growth Rate (%)
 */
export function calculateGrowthRate(
  currentPeriodValue: number | null | undefined,
  priorPeriodValue: number | null | undefined
): ComputableResult<number> {
  const formula = "(Current Period - Prior Period) / |Prior Period| * 100";

  if (
    currentPeriodValue === null ||
    currentPeriodValue === undefined ||
    priorPeriodValue === null ||
    priorPeriodValue === undefined
  ) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Multi-period comparison requires both current and prior disclosures.",
    };
  }

  if (priorPeriodValue === 0) {
    return {
      value: null,
      isComputable: false,
      status: "ZERO_DENOMINATOR",
      formula,
      reason: "Prior period baseline is zero; growth is undefined.",
    };
  }

  const growth = ((currentPeriodValue - priorPeriodValue) / Math.abs(priorPeriodValue)) * 100;
  return {
    value: Number(growth.toFixed(2)),
    isComputable: true,
    status: "VALID",
    formula,
  };
}
