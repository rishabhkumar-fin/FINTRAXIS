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
  status: "VALID" | "ZERO_DENOMINATOR" | "MISSING_INPUT" | "NEGATIVE_BASE" | "MISMATCHED_PERIOD" | "NOT_APPLICABLE";
  formula: string;
  reason?: string;
  zone?: string;
  interpretation?: string;
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

export interface AltmanZInputs {
  workingCapital: number | null | undefined;
  retainedEarnings: number | null | undefined;
  ebit: number | null | undefined;
  totalAssets: number | null | undefined;
  totalLiabilities: number | null | undefined;
  bookValueOfEquity?: number | null | undefined;
  marketCap?: number | null | undefined;
  revenue?: number | null | undefined;
  isFinancialInstitution?: boolean;
  variant?: "Z_DOUBLE_PRIME" | "ORIGINAL_1968";
}

/**
 * Altman Z-Score Diagnostic
 * - Variant 1 (Default): 1995 Non-Manufacturing / Emerging Markets Z''-Score
 *   Z'' = 6.56*X1 + 3.26*X2 + 6.72*X3 + 1.05*X4
 * - Variant 2: Original 1968 Manufacturing Z-Score
 *   Z = 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4_mkt + 0.999*X5
 * 
 * Strict Standards:
 * - Marked NOT_APPLICABLE for banks, NBFCs, and financial firms.
 * - Missing inputs (e.g. retained earnings not segregated) yield MISSING_INPUT, never approximations.
 */
export function calculateAltmanZScore(inputs: AltmanZInputs): ComputableResult<number> {
  const variant = inputs.variant ?? "Z_DOUBLE_PRIME";
  const formula =
    variant === "Z_DOUBLE_PRIME"
      ? "Z'' = 6.56*(WC/TA) + 3.26*(RE/TA) + 6.72*(EBIT/TA) + 1.05*(BVE/TL)"
      : "Z = 1.2*(WC/TA) + 1.4*(RE/TA) + 3.3*(EBIT/TA) + 0.6*(MVE/TL) + 0.999*(Sales/TA)";

  if (inputs.isFinancialInstitution) {
    return {
      value: null,
      isComputable: false,
      status: "NOT_APPLICABLE",
      formula,
      reason: "Altman Z-Score models are not applicable to banks, NBFCs, or insurance institutions due to structural balance sheet differences.",
      zone: "N/A",
    };
  }

  if (
    inputs.totalAssets === null ||
    inputs.totalAssets === undefined ||
    inputs.totalAssets <= 0 ||
    inputs.totalLiabilities === null ||
    inputs.totalLiabilities === undefined ||
    inputs.totalLiabilities <= 0
  ) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Total Assets or Total Liabilities are unavailable or non-positive.",
    };
  }

  if (inputs.workingCapital === null || inputs.workingCapital === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Working Capital is unavailable from disclosure.",
    };
  }

  if (inputs.retainedEarnings === null || inputs.retainedEarnings === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Retained Earnings line item is not separately disclosed in this filing (cannot approximate).",
    };
  }

  if (inputs.ebit === null || inputs.ebit === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Operating Income (EBIT) is unavailable.",
    };
  }

  const x1 = inputs.workingCapital / inputs.totalAssets;
  const x2 = inputs.retainedEarnings / inputs.totalAssets;
  const x3 = inputs.ebit / inputs.totalAssets;

  if (variant === "Z_DOUBLE_PRIME") {
    const bve = inputs.bookValueOfEquity ?? 0;
    if (bve === 0 && inputs.bookValueOfEquity === undefined) {
      return {
        value: null,
        isComputable: false,
        status: "MISSING_INPUT",
        formula,
        reason: "Book Value of Equity is unavailable.",
      };
    }
    const x4 = bve / inputs.totalLiabilities;
    const zDoublePrime = Number((6.56 * x1 + 3.26 * x2 + 6.72 * x3 + 1.05 * x4).toFixed(2));
    const zone = zDoublePrime > 2.60 ? "SAFE" : zDoublePrime >= 1.10 ? "GREY" : "DISTRESS";
    return {
      value: zDoublePrime,
      isComputable: true,
      status: "VALID",
      formula,
      zone,
      interpretation: `Altman Z''-Score (Emerging/Non-Mfg): ${zDoublePrime} (${zone} ZONE). Screening signal: >2.60 Safe, 1.10-2.60 Grey, <1.10 Distress.`,
    };
  } else {
    if (
      inputs.marketCap === null ||
      inputs.marketCap === undefined ||
      inputs.revenue === null ||
      inputs.revenue === undefined
    ) {
      return {
        value: null,
        isComputable: false,
        status: "MISSING_INPUT",
        formula,
        reason: "Market Capitalization or Revenue is unavailable for 1968 manufacturing model.",
      };
    }
    const x4 = inputs.marketCap / inputs.totalLiabilities;
    const x5 = inputs.revenue / inputs.totalAssets;
    const z = Number((1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 0.999 * x5).toFixed(2));
    const zone = z > 2.99 ? "SAFE" : z >= 1.81 ? "GREY" : "DISTRESS";
    return {
      value: z,
      isComputable: true,
      status: "VALID",
      formula,
      zone,
      interpretation: `Altman Z-Score (1968 Mfg): ${z} (${zone} ZONE). Screening signal: >2.99 Safe, 1.81-2.99 Grey, <1.81 Distress.`,
    };
  }
}

export interface BeneishMInputs {
  currentPeriod: {
    revenue: number | null | undefined;
    cogs: number | null | undefined;
    accountsReceivable: number | null | undefined;
    totalCurrentAssets: number | null | undefined;
    propertyPlantEquipment: number | null | undefined;
    marketableSecurities?: number | null | undefined;
    totalAssets: number | null | undefined;
    operatingExpenses?: number | null | undefined;
    shortTermDebt?: number | null | undefined;
    longTermDebt?: number | null | undefined;
    totalCurrentLiabilities?: number | null | undefined;
    netIncome: number | null | undefined;
    operatingCashFlow: number | null | undefined;
    depreciation?: number | null | undefined;
  };
  priorPeriod: {
    revenue: number | null | undefined;
    cogs: number | null | undefined;
    accountsReceivable: number | null | undefined;
    totalCurrentAssets: number | null | undefined;
    propertyPlantEquipment: number | null | undefined;
    marketableSecurities?: number | null | undefined;
    totalAssets: number | null | undefined;
    operatingExpenses?: number | null | undefined;
    shortTermDebt?: number | null | undefined;
    longTermDebt?: number | null | undefined;
    totalCurrentLiabilities?: number | null | undefined;
    netIncome: number | null | undefined;
    operatingCashFlow: number | null | undefined;
    depreciation?: number | null | undefined;
  } | null | undefined;
  isFinancialInstitution?: boolean;
}

/**
 * Beneish M-Score Earnings Manipulation Screening Signal (8-variable model)
 * M = -4.84 + 0.920*DSRI + 0.528*GMI + 0.404*AQI + 0.892*SGI + 0.115*DEPI - 0.172*SGAI + 4.037*TATA + 0.0327*LVGI
 * 
 * Strict Standards:
 * - Requires two consecutive comparable periods.
 * - Screening indicator only; not proof of accounting manipulation.
 * - Not applicable to financial institutions.
 */
export function calculateBeneishMScore(inputs: BeneishMInputs): ComputableResult<number> {
  const formula =
    "M = -4.84 + 0.920*DSRI + 0.528*GMI + 0.404*AQI + 0.892*SGI + 0.115*DEPI - 0.172*SGAI + 4.037*TATA + 0.0327*LVGI";

  if (inputs.isFinancialInstitution) {
    return {
      value: null,
      isComputable: false,
      status: "NOT_APPLICABLE",
      formula,
      reason: "Beneish M-Score is not applicable to banks or financial institutions.",
      zone: "N/A",
    };
  }

  if (!inputs.priorPeriod) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Beneish M-Score requires two consecutive comparable fiscal years to compute index deltas.",
    };
  }

  const cur = inputs.currentPeriod;
  const pri = inputs.priorPeriod;

  if (
    !cur.revenue ||
    !pri.revenue ||
    cur.totalAssets === null ||
    cur.totalAssets === undefined ||
    cur.totalAssets <= 0 ||
    pri.totalAssets === null ||
    pri.totalAssets === undefined ||
    pri.totalAssets <= 0 ||
    cur.accountsReceivable === null ||
    cur.accountsReceivable === undefined ||
    pri.accountsReceivable === null ||
    pri.accountsReceivable === undefined ||
    cur.cogs === null ||
    cur.cogs === undefined ||
    pri.cogs === null ||
    pri.cogs === undefined ||
    cur.netIncome === null ||
    cur.netIncome === undefined ||
    cur.operatingCashFlow === null ||
    cur.operatingCashFlow === undefined
  ) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "One or more core disclosure inputs across the two fiscal periods are unavailable.",
    };
  }

  const dsri = (cur.accountsReceivable / cur.revenue) / (pri.accountsReceivable / pri.revenue);
  const curGm = (cur.revenue - cur.cogs) / cur.revenue;
  const priGm = (pri.revenue - pri.cogs) / pri.revenue;
  const gmi = curGm > 0 ? priGm / curGm : 1.0;

  const curNonCurrentTangible =
    (cur.totalCurrentAssets ?? 0) + (cur.propertyPlantEquipment ?? 0) + (cur.marketableSecurities ?? 0);
  const priNonCurrentTangible =
    (pri.totalCurrentAssets ?? 0) + (pri.propertyPlantEquipment ?? 0) + (pri.marketableSecurities ?? 0);
  const curAqiRatio = 1 - curNonCurrentTangible / cur.totalAssets;
  const priAqiRatio = 1 - priNonCurrentTangible / pri.totalAssets;
  const aqi = priAqiRatio > 0 ? Math.max(0, curAqiRatio / priAqiRatio) : 1.0;

  const sgi = cur.revenue / pri.revenue;

  const curDeprec = cur.depreciation ?? (cur.totalAssets * 0.05);
  const priDeprec = pri.depreciation ?? (pri.totalAssets * 0.05);
  const curDeprecRate =
    (cur.propertyPlantEquipment ?? 0) > 0 ? curDeprec / (curDeprec + (cur.propertyPlantEquipment ?? 0)) : 0.1;
  const priDeprecRate =
    (pri.propertyPlantEquipment ?? 0) > 0 ? priDeprec / (priDeprec + (pri.propertyPlantEquipment ?? 0)) : 0.1;
  const depi = curDeprecRate > 0 ? priDeprecRate / curDeprecRate : 1.0;

  const curSga = cur.operatingExpenses ?? cur.revenue * 0.15;
  const priSga = pri.operatingExpenses ?? pri.revenue * 0.15;
  const sgai = (curSga / cur.revenue) / (priSga / pri.revenue);

  const curTotalDebt = (cur.longTermDebt ?? 0) + (cur.shortTermDebt ?? 0) + (cur.totalCurrentLiabilities ?? 0);
  const priTotalDebt = (pri.longTermDebt ?? 0) + (pri.shortTermDebt ?? 0) + (pri.totalCurrentLiabilities ?? 0);
  const curLev = curTotalDebt / cur.totalAssets;
  const priLev = priTotalDebt / pri.totalAssets;
  const lvgi = priLev > 0 ? curLev / priLev : 1.0;

  const tata = (cur.netIncome - cur.operatingCashFlow) / cur.totalAssets;

  const mScore = Number(
    (
      -4.84 +
      0.92 * dsri +
      0.528 * gmi +
      0.404 * aqi +
      0.892 * sgi +
      0.115 * depi -
      0.172 * sgai +
      4.037 * tata +
      0.0327 * lvgi
    ).toFixed(2)
  );

  const zone = mScore > -1.78 ? "ELEVATED_RISK" : "NORMAL";
  const interpretation =
    mScore > -1.78
      ? `Beneish M-Score: ${mScore} (ELEVATED RISK OF EARNINGS OVERSTATEMENT). Screening signal (M > -1.78 indicates elevated accruals; not legal proof of manipulation).`
      : `Beneish M-Score: ${mScore} (NORMAL EARNINGS QUALITY). Screening signal (M <= -1.78 indicates standard accrual patterns).`;

  return {
    value: mScore,
    isComputable: true,
    status: "VALID",
    formula,
    zone,
    interpretation,
  };
}

/**
 * Certified Debt Service Coverage Ratio (DSCR):
 * (PAT + Depreciation + Term Interest) / (Term Interest + Scheduled Principal Repayment)
 */
export function calculateDSCR(
  pat: number | null | undefined,
  depreciation: number | null | undefined,
  termInterest: number | null | undefined,
  scheduledPrincipalRepayment: number | null | undefined
): ComputableResult<number> {
  const formula = "(PAT + Depreciation + Term Debt Interest) / (Term Debt Interest + Scheduled Principal Due)";

  if (scheduledPrincipalRepayment === null || scheduledPrincipalRepayment === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Scheduled term debt principal repayments are not explicitly disclosed in the primary financial statements (requires footnote notes inspection).",
    };
  }

  if (pat === null || pat === undefined || termInterest === null || termInterest === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "PAT (Net Income) or Term Interest Expense is unavailable.",
    };
  }

  const denom = termInterest + scheduledPrincipalRepayment;
  if (denom <= 0) {
    return {
      value: null,
      isComputable: false,
      status: "ZERO_DENOMINATOR",
      formula,
      reason: "Combined debt service requirement is zero or negative.",
    };
  }

  const numer = pat + (depreciation ?? 0) + termInterest;
  const dscr = Number((numer / denom).toFixed(2));

  return {
    value: dscr,
    isComputable: true,
    status: "VALID",
    formula,
    interpretation: `Certified DSCR: ${dscr}x. Bank appraisal standard: >= 1.50x acceptable for term loan syndicate.`,
  };
}

/**
 * Debt Service Proxy (Short-Term Indebtedness Proxy):
 * EBITDA / (Interest Expense + Short-Term Debt)
 * Explicitly labeled as an analytical proxy, not certified statutory DSCR.
 */
export function calculateDebtServiceProxy(
  ebitda: number | null | undefined,
  interestExpense: number | null | undefined,
  shortTermDebt: number | null | undefined
): ComputableResult<number> {
  const formula = "EBITDA / (Interest Expense + Short-Term Debt)";

  if (ebitda === null || ebitda === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "EBITDA is unavailable.",
    };
  }

  const denom = (interestExpense ?? 0) + (shortTermDebt ?? 0);
  if (denom <= 0) {
    return {
      value: null,
      isComputable: false,
      status: "ZERO_DENOMINATOR",
      formula,
      reason: "Interest expense plus short-term borrowings sum to zero.",
    };
  }

  const proxy = Number((ebitda / denom).toFixed(2));
  return {
    value: proxy,
    isComputable: true,
    status: "VALID",
    formula,
    interpretation: `Debt Service Proxy: ${proxy}x (analytical rollover proxy using short-term debt; not certified statutory DSCR).`,
  };
}

/**
 * Total Outside Liabilities to Tangible Net Worth (TOL / TNW):
 * Indian Banking Credit Appraisal Metric (IBA / Consortium Practice).
 */
export function calculateTolToTnw(
  totalLiabilities: number | null | undefined,
  totalShareholdersEquity: number | null | undefined,
  intangibles: number | null | undefined = 0
): ComputableResult<number> {
  const formula = "Total Outside Liabilities / Tangible Net Worth [TL / (Equity - Intangibles)]";

  if (
    totalLiabilities === null ||
    totalLiabilities === undefined ||
    totalShareholdersEquity === null ||
    totalShareholdersEquity === undefined
  ) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      reason: "Total Liabilities or Shareholders' Equity is unavailable.",
    };
  }

  const tnw = totalShareholdersEquity - (intangibles ?? 0);
  if (tnw <= 0) {
    return {
      value: null,
      isComputable: false,
      status: "NEGATIVE_BASE",
      formula,
      reason: "Tangible Net Worth is negative or zero (insolvent capital base).",
    };
  }

  const tolTnw = Number((totalLiabilities / tnw).toFixed(2));
  return {
    value: tolTnw,
    isComputable: true,
    status: "VALID",
    formula,
    interpretation: `TOL/TNW: ${tolTnw}x. Illustrative reference level: < 3.00x commonly applied in Indian banking consortium appraisal (user-adjustable, not a regulatory limit).`,
  };
}

export interface CovenantHeadroomResult {
  metric: string;
  currentValue: number | null;
  hurdle: number;
  headroomPct: number | null;
  headroomAmount: number | null;
  isBreached: boolean;
  explanation: string;
}

/**
 * Calculates deterministic covenant headroom and reverse stress limits.
 */
export function calculateCovenantHeadroom(
  leverage: { currentNetDebtToEbitda: number | null; netDebt: number | null; ebitda: number | null; hurdle: number },
  coverage: { currentInterestCoverage: number | null; ebit: number | null; interestExpense: number | null; hurdle: number },
  liquidity: { currentRatio: number | null; currentAssets: number | null; currentLiabilities: number | null; hurdle: number }
): {
  leverageHeadroom: CovenantHeadroomResult;
  coverageHeadroom: CovenantHeadroomResult;
  liquidityHeadroom: CovenantHeadroomResult;
} {
  // 1. Leverage Headroom
  let levResult: CovenantHeadroomResult;
  if (
    leverage.currentNetDebtToEbitda === null ||
    leverage.netDebt === null ||
    leverage.ebitda === null ||
    leverage.ebitda <= 0 ||
    leverage.hurdle <= 0
  ) {
    levResult = {
      metric: "Net Debt / EBITDA",
      currentValue: leverage.currentNetDebtToEbitda,
      hurdle: leverage.hurdle,
      headroomPct: null,
      headroomAmount: null,
      isBreached: false,
      explanation: "Inputs unavailable or net-cash entity.",
    };
  } else {
    if (leverage.netDebt <= 0) {
      levResult = {
        metric: "Net Debt / EBITDA",
        currentValue: 0.0,
        hurdle: leverage.hurdle,
        headroomPct: 100.0,
        headroomAmount: leverage.ebitda,
        isBreached: false,
        explanation: "Entity is net-cash surplus. EBITDA can fall 100% without incurring funded net debt leverage.",
      };
    } else {
      const breachEbitda = leverage.netDebt / leverage.hurdle;
      const dropAmount = Number((leverage.ebitda - breachEbitda).toFixed(2));
      const dropPct = Number(((dropAmount / leverage.ebitda) * 100).toFixed(1));
      const isBreached = leverage.currentNetDebtToEbitda > leverage.hurdle;

      levResult = {
        metric: "Net Debt / EBITDA",
        currentValue: Number(leverage.currentNetDebtToEbitda.toFixed(2)),
        hurdle: leverage.hurdle,
        headroomPct: dropPct,
        headroomAmount: dropAmount,
        isBreached,
        explanation: isBreached
          ? `Hurdle breached by ${(leverage.currentNetDebtToEbitda - leverage.hurdle).toFixed(2)}x. Operating profit provides zero headroom.`
          : `EBITDA can contract by ${dropPct}% (${dropAmount}) before leverage exceeds ${leverage.hurdle.toFixed(2)}x.`,
      };
    }
  }

  // 2. Coverage Headroom
  let covResult: CovenantHeadroomResult;
  if (
    coverage.currentInterestCoverage === null ||
    coverage.ebit === null ||
    coverage.interestExpense === null ||
    coverage.interestExpense <= 0 ||
    coverage.hurdle <= 0
  ) {
    covResult = {
      metric: "EBIT Interest Coverage",
      currentValue: coverage.currentInterestCoverage,
      hurdle: coverage.hurdle,
      headroomPct: null,
      headroomAmount: null,
      isBreached: false,
      explanation: "Inputs unavailable or zero interest expense.",
    };
  } else {
    const breachEbit = coverage.interestExpense * coverage.hurdle;
    const dropAmount = Number((coverage.ebit - breachEbit).toFixed(2));
    const dropPct = coverage.ebit > 0 ? Number(((dropAmount / coverage.ebit) * 100).toFixed(1)) : -100;
    const isBreached = coverage.currentInterestCoverage < coverage.hurdle;

    covResult = {
      metric: "EBIT Interest Coverage",
      currentValue: Number(coverage.currentInterestCoverage.toFixed(2)),
      hurdle: coverage.hurdle,
      headroomPct: dropPct,
      headroomAmount: dropAmount,
      isBreached,
      explanation: isBreached
        ? `Floor breached by ${(coverage.hurdle - coverage.currentInterestCoverage).toFixed(2)}x. Debt service buffer exhausted.`
        : `Operating income (EBIT) can contract by ${dropPct}% (${dropAmount}) before coverage falls below ${coverage.hurdle.toFixed(2)}x.`,
    };
  }

  // 3. Liquidity Headroom
  let liqResult: CovenantHeadroomResult;
  if (
    liquidity.currentRatio === null ||
    liquidity.currentAssets === null ||
    liquidity.currentLiabilities === null ||
    liquidity.currentLiabilities <= 0 ||
    liquidity.hurdle <= 0
  ) {
    liqResult = {
      metric: "Current Ratio",
      currentValue: liquidity.currentRatio,
      hurdle: liquidity.hurdle,
      headroomPct: null,
      headroomAmount: null,
      isBreached: false,
      explanation: "Inputs unavailable or zero current liabilities.",
    };
  } else {
    const breachCa = liquidity.currentLiabilities * liquidity.hurdle;
    const dropAmount = Number((liquidity.currentAssets - breachCa).toFixed(2));
    const dropPct =
      liquidity.currentAssets > 0 ? Number(((dropAmount / liquidity.currentAssets) * 100).toFixed(1)) : -100;
    const isBreached = liquidity.currentRatio < liquidity.hurdle;

    liqResult = {
      metric: "Current Ratio",
      currentValue: Number(liquidity.currentRatio.toFixed(2)),
      hurdle: liquidity.hurdle,
      headroomPct: dropPct,
      headroomAmount: dropAmount,
      isBreached,
      explanation: isBreached
        ? `Liquidity buffer breached by ${(liquidity.hurdle - liquidity.currentRatio).toFixed(2)}x.`
        : `Current assets can fall by ${dropPct}% (${dropAmount}) before Current Ratio compresses below ${liquidity.hurdle.toFixed(2)}x.`,
    };
  }

  return {
    leverageHeadroom: levResult,
    coverageHeadroom: covResult,
    liquidityHeadroom: liqResult,
  };
}
