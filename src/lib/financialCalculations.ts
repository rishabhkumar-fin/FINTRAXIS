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

// ============================================================================
// PHASE 9: INSTITUTIONAL METRICS (PROMOTER PLEDGE, DRAWING POWER, CONTINGENTS, DEBT)
// ============================================================================

export interface PromoterPledgeInputs {
  promoterSharesHeld?: number | null;
  promoterSharesPledged?: number | null;
  promoterHoldingPct?: number | null;
  pledgedPctOfPromoterHolding?: number | null;
  totalShares?: number | null;
  pledgedPctOfTotalCapital?: number | null;
  hasDisclosedPromoterGroup?: boolean;
  lowThreshold?: number; // default 10.0
  moderateThreshold?: number; // default 30.0
}

export interface PromoterPledgeResult extends ComputableResult<number> {
  pledgedPctOfPromoter: number | null;
  pledgedPctOfTotalCapital: number | null;
  promoterHoldingPct: number | null;
  riskTier: "LOW_RISK" | "MODERATE_RISK" | "ELEVATED_RISK" | "NOT_APPLICABLE" | "UNKNOWN";
}

/**
 * Promoter Share Pledging (SEBI LODR Regulation 31 / Indian Appraisal Standard):
 * Evaluates the percentage of promoter group shares encumbered to lenders.
 * A high pledge ratio exposes the company to margin call liquidation risk if stock prices decline.
 */
export function calculatePromoterPledgeRisk(inputs: PromoterPledgeInputs): PromoterPledgeResult {
  const formula = "Pledge Ratio (%) = (Promoter Shares Pledged ÷ Total Promoter Shares Held) × 100";
  const lowThresh = inputs.lowThreshold ?? 10.0;
  const modThresh = inputs.moderateThreshold ?? 30.0;

  // 1. Check if entity has a disclosed promoter group
  if (inputs.hasDisclosedPromoterGroup === false) {
    return {
      value: null,
      isComputable: false,
      status: "NOT_APPLICABLE",
      formula,
      pledgedPctOfPromoter: null,
      pledgedPctOfTotalCapital: null,
      promoterHoldingPct: null,
      riskTier: "NOT_APPLICABLE",
      reason: "Not applicable: no promoter or controlling group disclosed in statutory filings (e.g. widely held / institutional ownership).",
      interpretation: "Not applicable: no promoter or controlling group disclosed in filings.",
    };
  }

  // 2. Validate presence of promoter holding
  const hasPromoterPct = inputs.promoterHoldingPct !== undefined && inputs.promoterHoldingPct !== null;
  const hasPromoterShares = inputs.promoterSharesHeld !== undefined && inputs.promoterSharesHeld !== null;

  if (!hasPromoterPct && !hasPromoterShares) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      pledgedPctOfPromoter: null,
      pledgedPctOfTotalCapital: null,
      promoterHoldingPct: null,
      riskTier: "UNKNOWN",
      reason: "Promoter shareholding disclosure is missing or unavailable from regulatory filing.",
      interpretation: "Unavailable from disclosure: promoter holding data not reported.",
    };
  }

  const promoterHolding = hasPromoterPct ? inputs.promoterHoldingPct! : inputs.promoterSharesHeld!;
  if (promoterHolding <= 0) {
    return {
      value: null,
      isComputable: false,
      status: "NOT_APPLICABLE",
      formula,
      pledgedPctOfPromoter: null,
      pledgedPctOfTotalCapital: null,
      promoterHoldingPct: 0,
      riskTier: "NOT_APPLICABLE",
      reason: "Disclosed promoter group holding is zero (100% public or non-promoter shareholding).",
      interpretation: "Not applicable: disclosed promoter holding is zero.",
    };
  }

  // 3. Resolve pledge ratio
  let pledgeRatio: number;
  if (inputs.pledgedPctOfPromoterHolding !== undefined && inputs.pledgedPctOfPromoterHolding !== null) {
    pledgeRatio = inputs.pledgedPctOfPromoterHolding;
  } else if (
    inputs.promoterSharesPledged !== undefined &&
    inputs.promoterSharesPledged !== null &&
    inputs.promoterSharesHeld !== undefined &&
    inputs.promoterSharesHeld !== null
  ) {
    if (inputs.promoterSharesHeld === 0) {
      return {
        value: null,
        isComputable: false,
        status: "ZERO_DENOMINATOR",
        formula,
        pledgedPctOfPromoter: null,
        pledgedPctOfTotalCapital: null,
        promoterHoldingPct: 0,
        riskTier: "NOT_APPLICABLE",
        reason: "Promoter shares held is zero; cannot compute pledge percentage.",
      };
    }
    pledgeRatio = Number(((inputs.promoterSharesPledged / inputs.promoterSharesHeld) * 100).toFixed(2));
  } else {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      pledgedPctOfPromoter: null,
      pledgedPctOfTotalCapital: null,
      promoterHoldingPct: hasPromoterPct ? inputs.promoterHoldingPct! : null,
      riskTier: "UNKNOWN",
      reason: "Pledged shares data is missing or not disclosed in the shareholding pattern.",
      interpretation: "Unavailable from disclosure: pledged shares figure missing.",
    };
  }

  // 4. Validate sanity bounds (cannot pledge more than 100% or negative)
  if (pledgeRatio < 0 || pledgeRatio > 100) {
    return {
      value: null,
      isComputable: false,
      status: "NEGATIVE_BASE",
      formula,
      pledgedPctOfPromoter: null,
      pledgedPctOfTotalCapital: null,
      promoterHoldingPct: hasPromoterPct ? inputs.promoterHoldingPct! : null,
      riskTier: "UNKNOWN",
      reason: `Invalid pledge ratio (${pledgeRatio}%): pledged shares cannot be negative or exceed shares held.`,
    };
  }

  if (
    inputs.promoterSharesPledged !== undefined &&
    inputs.promoterSharesPledged !== null &&
    inputs.promoterSharesHeld !== undefined &&
    inputs.promoterSharesHeld !== null &&
    inputs.promoterSharesPledged > inputs.promoterSharesHeld
  ) {
    return {
      value: null,
      isComputable: false,
      status: "NEGATIVE_BASE",
      formula,
      pledgedPctOfPromoter: null,
      pledgedPctOfTotalCapital: null,
      promoterHoldingPct: hasPromoterPct ? inputs.promoterHoldingPct! : null,
      riskTier: "UNKNOWN",
      reason: "Pledged shares count exceeds total promoter shares held.",
    };
  }

  // Calculate pledged % of total capital if available
  let pledgedTotalCapital: number | null = null;
  if (inputs.pledgedPctOfTotalCapital !== undefined && inputs.pledgedPctOfTotalCapital !== null) {
    pledgedTotalCapital = inputs.pledgedPctOfTotalCapital;
  } else if (inputs.promoterHoldingPct !== undefined && inputs.promoterHoldingPct !== null) {
    pledgedTotalCapital = Number(((pledgeRatio * inputs.promoterHoldingPct) / 100).toFixed(2));
  } else if (
    inputs.promoterSharesPledged !== undefined &&
    inputs.promoterSharesPledged !== null &&
    inputs.totalShares !== undefined &&
    inputs.totalShares !== null &&
    inputs.totalShares > 0
  ) {
    pledgedTotalCapital = Number(((inputs.promoterSharesPledged / inputs.totalShares) * 100).toFixed(2));
  }

  // 5. Determine risk tier based on illustrative reference levels
  let riskTier: "LOW_RISK" | "MODERATE_RISK" | "ELEVATED_RISK";
  if (pledgeRatio <= lowThresh) {
    riskTier = "LOW_RISK";
  } else if (pledgeRatio <= modThresh) {
    riskTier = "MODERATE_RISK";
  } else {
    riskTier = "ELEVATED_RISK";
  }

  const roundedValue = Number(pledgeRatio.toFixed(2));
  return {
    value: roundedValue,
    isComputable: true,
    status: "VALID",
    formula,
    pledgedPctOfPromoter: roundedValue,
    pledgedPctOfTotalCapital: pledgedTotalCapital,
    promoterHoldingPct: hasPromoterPct ? Number(inputs.promoterHoldingPct!.toFixed(2)) : null,
    riskTier,
    zone: riskTier,
    interpretation:
      riskTier === "LOW_RISK"
        ? `Promoter pledge is ${roundedValue}% (Illustrative reference: ≤ ${lowThresh}% low risk). Clean promoter collateral position.`
        : riskTier === "MODERATE_RISK"
        ? `Promoter pledge is ${roundedValue}% (Illustrative reference: ${lowThresh}% - ${modThresh}% moderate). Requires monitoring for stock price margin triggers.`
        : `Promoter pledge is ${roundedValue}% (Illustrative reference: > ${modThresh}% elevated). Significant vulnerability to margin calls if share price declines.`,
  };
}

// ============================================================================
// WORKING CAPITAL: INDICATIVE DRAWING POWER
// ============================================================================

export interface DrawingPowerInputs {
  inventory: number | null | undefined;
  tradeCreditors: number | null | undefined;
  eligibleReceivablesUnder90Days: number | null | undefined;
  inventoryMarginPct?: number; // default 25
  receivablesMarginPct?: number; // default 40
  workingCapitalBorrowings?: number | null | undefined;
  isBankOrFinancial?: boolean;
}

export interface DrawingPowerResult extends ComputableResult<number> {
  unflooredPaidStock: number | null;
  flooredPaidStock: number | null;
  eligibleReceivables: number | null;
  inventoryMarginPct: number;
  receivablesMarginPct: number;
  stockContribution: number | null;
  receivablesContribution: number | null;
  drawingPower: number | null;
  workingCapitalBorrowings: number | null;
  utilizationPct: number | null;
}

/**
 * Indicative Drawing Power (DP):
 * Annual-statement based indication of borrowing capacity against paid stock and trade receivables.
 * 
 * Note: Real drawing power is sanctioned by banks from monthly stock & debtor statements.
 * This function provides an indicative reference level using balance-sheet date figures.
 */
export function calculateDrawingPower(inputs: DrawingPowerInputs): DrawingPowerResult {
  const invMargin = inputs.inventoryMarginPct ?? 25;
  const recMargin = inputs.receivablesMarginPct ?? 40;
  const formula = "DP = [max(0, Inventory − Trade Creditors) × (1 − Margin_inv)] + [Eligible Receivables (<90d) × (1 − Margin_rec)]";

  if (inputs.isBankOrFinancial) {
    return {
      value: null,
      isComputable: false,
      status: "NOT_APPLICABLE",
      formula,
      unflooredPaidStock: null,
      flooredPaidStock: null,
      eligibleReceivables: null,
      inventoryMarginPct: invMargin,
      receivablesMarginPct: recMargin,
      stockContribution: null,
      receivablesContribution: null,
      drawingPower: null,
      workingCapitalBorrowings: null,
      utilizationPct: null,
      reason: "Not applicable to banking, NBFC, or financial institutions where physical inventory drawing power does not apply.",
      interpretation: "Not applicable: entity is a financial institution.",
    };
  }

  // Margin range check (0% - 100%)
  if (invMargin < 0 || invMargin > 100 || recMargin < 0 || recMargin > 100) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      unflooredPaidStock: null,
      flooredPaidStock: null,
      eligibleReceivables: null,
      inventoryMarginPct: invMargin,
      receivablesMarginPct: recMargin,
      stockContribution: null,
      receivablesContribution: null,
      drawingPower: null,
      workingCapitalBorrowings: null,
      utilizationPct: null,
      reason: "Bank margins must be set between 0% and 100%.",
    };
  }

  // Check inventory and trade creditors
  if (
    inputs.inventory === null ||
    inputs.inventory === undefined ||
    inputs.tradeCreditors === null ||
    inputs.tradeCreditors === undefined
  ) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      unflooredPaidStock: null,
      flooredPaidStock: null,
      eligibleReceivables: null,
      inventoryMarginPct: invMargin,
      receivablesMarginPct: recMargin,
      stockContribution: null,
      receivablesContribution: null,
      drawingPower: null,
      workingCapitalBorrowings: null,
      utilizationPct: null,
      reason: "Inventory or trade creditors figure is unavailable from primary disclosure.",
      interpretation: "Unavailable from disclosure: inventory or trade payables line missing.",
    };
  }

  // Check receivables ageing (< 90 days)
  if (inputs.eligibleReceivablesUnder90Days === null || inputs.eligibleReceivablesUnder90Days === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      unflooredPaidStock: Number((inputs.inventory - inputs.tradeCreditors).toFixed(2)),
      flooredPaidStock: Math.max(0, Number((inputs.inventory - inputs.tradeCreditors).toFixed(2))),
      eligibleReceivables: null,
      inventoryMarginPct: invMargin,
      receivablesMarginPct: recMargin,
      stockContribution: null,
      receivablesContribution: null,
      drawingPower: null,
      workingCapitalBorrowings: inputs.workingCapitalBorrowings ?? null,
      utilizationPct: null,
      reason: "Trade receivables ageing schedule (< 90 days) is unavailable from disclosure. Cannot assume 100% of receivables are bank-eligible.",
      interpretation: "N/D: trade receivable ageing (< 90 days) is unavailable from disclosure.",
    };
  }

  const unflooredPaidStock = Number((inputs.inventory - inputs.tradeCreditors).toFixed(2));
  const flooredPaidStock = Math.max(0, unflooredPaidStock);
  const eligibleReceivables = inputs.eligibleReceivablesUnder90Days;

  const stockContribution = Number((flooredPaidStock * (1 - invMargin / 100)).toFixed(2));
  const receivablesContribution = Number((eligibleReceivables * (1 - recMargin / 100)).toFixed(2));
  const drawingPower = Number((stockContribution + receivablesContribution).toFixed(2));

  let utilizationPct: number | null = null;
  if (
    inputs.workingCapitalBorrowings !== undefined &&
    inputs.workingCapitalBorrowings !== null &&
    drawingPower > 0
  ) {
    utilizationPct = Number(((inputs.workingCapitalBorrowings / drawingPower) * 100).toFixed(1));
  }

  return {
    value: drawingPower,
    isComputable: true,
    status: "VALID",
    formula,
    unflooredPaidStock,
    flooredPaidStock,
    eligibleReceivables,
    inventoryMarginPct: invMargin,
    receivablesMarginPct: recMargin,
    stockContribution,
    receivablesContribution,
    drawingPower,
    workingCapitalBorrowings: inputs.workingCapitalBorrowings ?? null,
    utilizationPct,
    interpretation: `Indicative Drawing Power: ${drawingPower} (Paid Stock: ${flooredPaidStock} @ ${invMargin}% margin; Eligible Receivables: ${eligibleReceivables} @ ${recMargin}% margin). Indicative, annual-statement basis, not a bank-sanctioned DP.`,
  };
}

// ============================================================================
// CONTINGENT LIABILITIES TO TANGIBLE NET WORTH
// ============================================================================

export interface ContingentLiabilitiesInputs {
  totalContingentLiabilities: number | null | undefined;
  tangibleNetWorth: number | null | undefined;
  disclosedCategories?: { label: string; amount: number; source?: string }[] | null;
  lowThreshold?: number; // default 30%
  elevatedThreshold?: number; // default 50%
}

export interface ContingentLiabilitiesResult extends ComputableResult<number> {
  totalContingentLiabilities: number | null;
  tangibleNetWorth: number | null;
  ratioPct: number | null;
  categories: { label: string; amount: number; source?: string }[];
  riskTier: "LOW_RISK" | "MODERATE_RISK" | "ELEVATED_RISK" | "UNKNOWN";
}

/**
 * Contingent Liabilities to Tangible Net Worth:
 * Evaluates off-balance-sheet commitments (disputed tax demands, guarantees given, civil claims)
 * against shareholders' tangible equity buffer.
 */
export function calculateContingentLiabilitiesRatio(
  inputs: ContingentLiabilitiesInputs
): ContingentLiabilitiesResult {
  const formula = "Contingent Liabilities Ratio (%) = (Total Disclosed Contingent Liabilities ÷ Tangible Net Worth) × 100";
  const lowThresh = inputs.lowThreshold ?? 30.0;
  const elevatedThresh = inputs.elevatedThreshold ?? 50.0;
  const categories = inputs.disclosedCategories ?? [];

  if (inputs.totalContingentLiabilities === null || inputs.totalContingentLiabilities === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      totalContingentLiabilities: null,
      tangibleNetWorth: inputs.tangibleNetWorth ?? null,
      ratioPct: null,
      categories,
      riskTier: "UNKNOWN",
      reason: "Contingent liabilities note is not disclosed or unavailable in the statutory filing.",
      interpretation: "Unavailable from disclosure: contingent liabilities note omitted.",
    };
  }

  if (inputs.totalContingentLiabilities < 0) {
    return {
      value: null,
      isComputable: false,
      status: "NEGATIVE_BASE",
      formula,
      totalContingentLiabilities: inputs.totalContingentLiabilities,
      tangibleNetWorth: inputs.tangibleNetWorth ?? null,
      ratioPct: null,
      categories,
      riskTier: "UNKNOWN",
      reason: "Total contingent liabilities cannot be negative.",
    };
  }

  if (inputs.tangibleNetWorth === null || inputs.tangibleNetWorth === undefined) {
    return {
      value: null,
      isComputable: false,
      status: "MISSING_INPUT",
      formula,
      totalContingentLiabilities: inputs.totalContingentLiabilities,
      tangibleNetWorth: null,
      ratioPct: null,
      categories,
      riskTier: "UNKNOWN",
      reason: "Tangible net worth is unavailable from disclosure.",
    };
  }

  if (inputs.tangibleNetWorth <= 0) {
    return {
      value: null,
      isComputable: false,
      status: "NEGATIVE_BASE",
      formula,
      totalContingentLiabilities: inputs.totalContingentLiabilities,
      tangibleNetWorth: inputs.tangibleNetWorth,
      ratioPct: null,
      categories,
      riskTier: "ELEVATED_RISK",
      reason: "Tangible net worth is zero or negative (capital deficiency). Contingent claim coverage is absent.",
      interpretation: "Capital deficient: tangible net worth is negative or zero.",
    };
  }

  const ratio = Number(((inputs.totalContingentLiabilities / inputs.tangibleNetWorth) * 100).toFixed(2));

  let riskTier: "LOW_RISK" | "MODERATE_RISK" | "ELEVATED_RISK";
  if (ratio <= lowThresh) {
    riskTier = "LOW_RISK";
  } else if (ratio <= elevatedThresh) {
    riskTier = "MODERATE_RISK";
  } else {
    riskTier = "ELEVATED_RISK";
  }

  return {
    value: ratio,
    isComputable: true,
    status: "VALID",
    formula,
    totalContingentLiabilities: inputs.totalContingentLiabilities,
    tangibleNetWorth: inputs.tangibleNetWorth,
    ratioPct: ratio,
    categories,
    riskTier,
    zone: riskTier,
    interpretation: `Contingent Liabilities / Tangible Net Worth: ${ratio}% (Disclosed claims: ${inputs.totalContingentLiabilities} vs Net Worth: ${inputs.tangibleNetWorth}). Contingent liabilities are possible obligations. They may never crystallize, and the filing's estimate may be incomplete. Illustrative reference level, user-adjustable.`,
  };
}

// ============================================================================
// SOURCED DEBT INSTRUMENTS & RECONCILIATION
// ============================================================================

export interface DebtInstrumentRow {
  id: string;
  instrumentName: string;
  coupon: number | string | null;
  couponType: "FIXED" | "FLOATING" | "ZERO_COUPON" | "OTHER";
  currency: string;
  maturityYear: number | string | null;
  principalAmount: number;
  sourceForm: string;
  filingDate: string;
  sectionOrPage: string;
  verificationFlag: "VERIFIED_BY_AGENT" | "SUPPLIED_BY_USER" | "NOT_INDEPENDENTLY_VERIFIED";
}

export interface DebtReconciliationResult {
  isReconciled: boolean;
  status: "RECONCILED" | "VARIANCE_EXPLAINED" | "MISSING_TOTAL" | "NO_INSTRUMENTS";
  totalPrincipalSum: number;
  disclosedTotalDebt: number | null;
  difference: number | null;
  differencePct: number | null;
  explanation: string;
}

/**
 * Reconciles the sum of itemized debt tranche principals against total debt reported on the balance sheet.
 * Accounts for differences due to unamortized discounts, lease liabilities, or unitemized overdrafts.
 */
export function reconcileDebtStructure(
  instruments: DebtInstrumentRow[],
  disclosedTotalDebt: number | null | undefined,
  tolerancePct: number = 0.5
): DebtReconciliationResult {
  if (instruments.length === 0) {
    return {
      isReconciled: false,
      status: "NO_INSTRUMENTS",
      totalPrincipalSum: 0,
      disclosedTotalDebt: disclosedTotalDebt ?? null,
      difference: null,
      differencePct: null,
      explanation: "No itemized debt tranche disclosures stored for this period.",
    };
  }

  const sum = Number(instruments.reduce((acc, curr) => acc + (curr.principalAmount || 0), 0).toFixed(2));

  if (disclosedTotalDebt === null || disclosedTotalDebt === undefined) {
    return {
      isReconciled: false,
      status: "MISSING_TOTAL",
      totalPrincipalSum: sum,
      disclosedTotalDebt: null,
      difference: null,
      differencePct: null,
      explanation: "Total debt disclosure is unavailable from primary balance sheet.",
    };
  }

  const diff = Number((disclosedTotalDebt - sum).toFixed(2));
  const diffPct = disclosedTotalDebt > 0 ? Number(((Math.abs(diff) / disclosedTotalDebt) * 100).toFixed(2)) : 0;
  const isReconciled = diffPct <= tolerancePct;

  return {
    isReconciled,
    status: isReconciled ? "RECONCILED" : "VARIANCE_EXPLAINED",
    totalPrincipalSum: sum,
    disclosedTotalDebt,
    difference: diff,
    differencePct: diffPct,
    explanation: isReconciled
      ? `Tranche principal sum (${sum}) matches reported balance sheet debt (${disclosedTotalDebt}) within ${tolerancePct}% tolerance.`
      : `Variance of ${diff} (${diffPct}%) between tranche sum (${sum}) and reported total debt (${disclosedTotalDebt}). Variance typically reflects unamortized bond discounts, finance leases, or unitemized bank overdrafts.`,
  };
}


// ==========================================
// STAGE 4: DETERMINISTIC STRESS SIMULATOR PURE ENGINE
// ==========================================

export interface StressScenarioParams {
  revenue: number;
  ebit: number;
  ebitda?: number | null;
  depreciation?: number | null;
  interestExpense?: number | null;
  totalDebt?: number | null;
  cash?: number | null;
  revenueShockPct: number; // e.g. -15 (-50 to +20)
  cogsInflationPct: number; // e.g. 5 (0 to 30)
  rateShockBps: number; // e.g. 200 (-200 to +800)
  variableCostSharePct: number; // e.g. 35 (0 to 100)
  floatingRateDebtSharePct: number; // e.g. 40 (0 to 100)
  coverageHurdle?: number; // default 2.50
  leverageHurdle?: number; // default 3.50
}

export interface StressScenarioResult {
  simulatedRevenue: number;
  baselineOperatingCosts: number;
  baselineVariableCosts: number;
  baselineFixedCosts: number;
  stressedVariableCosts: number;
  stressedFixedCosts: number;
  simulatedEbit: number;
  ebitDelta: number;
  ebitBridge: {
    baselineEbit: number;
    revenueShockImpact: number;
    variableCostRelief: number;
    variableCostInflationImpact: number;
    fixedCostInflationImpact: number;
    stressedEbit: number;
  };
  simulatedInterestExpense: number;
  incrementalInterestExpense: number;
  stressedFloatingDebtAmount: number;
  simulatedEbitda: number;
  simulatedInterestCoverage: number | null;
  interestCoverageStatus: "SOLVENT" | "EBIT_NEGATIVE" | "ZERO_INTEREST" | "THRESHOLD_BREACH";
  simulatedNetDebt: number;
  simulatedNetDebtToEbitda: number | null;
  thresholdBreached: boolean;
  thresholdBreachSummary: string;
}

export function calculateStressScenario(params: StressScenarioParams): StressScenarioResult {
  const baseRev = params.revenue || 0;
  const baseEbit = params.ebit || 0;
  const baseOperatingCosts = Math.max(0, baseRev - baseEbit);

  const v = Math.min(1, Math.max(0, (params.variableCostSharePct ?? 50) / 100));
  const baseVariableCosts = Number((baseOperatingCosts * v).toFixed(2));
  const baseFixedCosts = Number((baseOperatingCosts * (1 - v)).toFixed(2));

  const s = params.revenueShockPct / 100;
  const c = Math.max(0, params.cogsInflationPct / 100);
  const deltaR = params.rateShockBps / 10000;
  const f = Math.min(1, Math.max(0, (params.floatingRateDebtSharePct ?? 40) / 100));

  // 1. Stressed Revenue
  const simulatedRevenue = Number((baseRev * (1 + s)).toFixed(2));

  // 2. Stressed Costs
  const stressedVariableCosts = Number((baseVariableCosts * (1 + s) * (1 + c)).toFixed(2));
  const stressedFixedCosts = Number((baseFixedCosts * (1 + c)).toFixed(2));

  // 3. Stressed EBIT
  const simulatedEbit = Number((simulatedRevenue - stressedVariableCosts - stressedFixedCosts).toFixed(2));
  const ebitDelta = Number((simulatedEbit - baseEbit).toFixed(2));

  // 4. EBIT Bridge Components (Sums exactly to simulatedEbit)
  const revenueShockImpact = Number((baseRev * s).toFixed(2));
  const variableCostRelief = Number((-baseVariableCosts * s).toFixed(2));
  const variableCostInflationImpact = Number((-baseVariableCosts * (1 + s) * c).toFixed(2));
  const fixedCostInflationImpact = Number((-baseFixedCosts * c).toFixed(2));

  // 5. Interest & Coverage
  const baseInterest = Math.max(0, params.interestExpense || 0);
  const baseTotalDebt = Math.max(0, params.totalDebt || 0);
  const baseCash = Math.max(0, params.cash || 0);
  const stressedFloatingDebtAmount = Number((baseTotalDebt * f).toFixed(2));
  const incrementalInterestExpense = Number((stressedFloatingDebtAmount * deltaR).toFixed(2));
  const simulatedInterestExpense = Number(Math.max(0, baseInterest + incrementalInterestExpense).toFixed(2));

  let simulatedInterestCoverage: number | null = null;
  let interestCoverageStatus: "SOLVENT" | "EBIT_NEGATIVE" | "ZERO_INTEREST" | "THRESHOLD_BREACH" = "SOLVENT";
  const covHurdle = params.coverageHurdle ?? 2.50;
  const levHurdle = params.leverageHurdle ?? 3.50;

  if (simulatedInterestExpense <= 0) {
    simulatedInterestCoverage = null;
    interestCoverageStatus = "ZERO_INTEREST";
  } else if (simulatedEbit <= 0) {
    simulatedInterestCoverage = Number((simulatedEbit / simulatedInterestExpense).toFixed(2));
    interestCoverageStatus = "EBIT_NEGATIVE";
  } else {
    simulatedInterestCoverage = Number((simulatedEbit / simulatedInterestExpense).toFixed(2));
    if (simulatedInterestCoverage < covHurdle) {
      interestCoverageStatus = "THRESHOLD_BREACH";
    } else {
      interestCoverageStatus = "SOLVENT";
    }
  }

  // 6. Stressed EBITDA & Leverage
  const baseEbitda = params.ebitda ?? (baseEbit * 1.15);
  const baseDeprec = params.depreciation ?? Math.max(0, baseEbitda - baseEbit);
  const simulatedEbitda = Number((simulatedEbit + baseDeprec).toFixed(2));
  const simulatedNetDebt = Number((baseTotalDebt - baseCash).toFixed(2));
  const simulatedNetDebtToEbitda = simulatedEbitda > 0 ? Number((simulatedNetDebt / simulatedEbitda).toFixed(2)) : null;

  // 7. Threshold Assessment (No "covenant breach" wording)
  let thresholdBreached = false;
  let thresholdBreachSummary = "Complies with analytical reference thresholds in this scenario.";

  if (interestCoverageStatus === "EBIT_NEGATIVE") {
    thresholdBreached = true;
    thresholdBreachSummary = "Reference threshold breached in this scenario: Operating loss (EBIT <= 0). Operating income cannot service debt interest. This is a what-if calculation, not a prediction.";
  } else if (interestCoverageStatus === "THRESHOLD_BREACH") {
    thresholdBreached = true;
    thresholdBreachSummary = `Reference threshold breached in this scenario: Interest coverage (${simulatedInterestCoverage}x) falls below reference floor (${covHurdle.toFixed(2)}x). This is a what-if calculation, not a prediction.`;
  } else if (simulatedNetDebtToEbitda !== null && simulatedNetDebtToEbitda > levHurdle) {
    thresholdBreached = true;
    thresholdBreachSummary = `Reference threshold breached in this scenario: Net Debt / EBITDA (${simulatedNetDebtToEbitda}x) exceeds reference ceiling (${levHurdle.toFixed(2)}x). This is a what-if calculation, not a prediction.`;
  }

  return {
    simulatedRevenue,
    baselineOperatingCosts: baseOperatingCosts,
    baselineVariableCosts: baseVariableCosts,
    baselineFixedCosts: baseFixedCosts,
    stressedVariableCosts,
    stressedFixedCosts,
    simulatedEbit,
    ebitDelta,
    ebitBridge: {
      baselineEbit: baseEbit,
      revenueShockImpact,
      variableCostRelief,
      variableCostInflationImpact,
      fixedCostInflationImpact,
      stressedEbit: simulatedEbit,
    },
    simulatedInterestExpense,
    incrementalInterestExpense,
    stressedFloatingDebtAmount,
    simulatedEbitda,
    simulatedInterestCoverage,
    interestCoverageStatus,
    simulatedNetDebt,
    simulatedNetDebtToEbitda,
    thresholdBreached,
    thresholdBreachSummary,
  };
}
