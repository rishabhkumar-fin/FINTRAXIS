import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAltmanZScore,
  calculateBeneishMScore,
  calculateDSCR,
  calculateDebtServiceProxy,
  calculateTolToTnw,
  calculateCovenantHeadroom,
} from "../src/lib/financialCalculations.ts";

describe("Phase 1: Professional Methodology Integrity & Diagnostic Engines", () => {
  describe("Altman Z-Score Diagnostic", () => {
    it("computes Z'' emerging-markets/non-manufacturing model with mathematical precision", () => {
      // Fixture: Working Capital = 200, Retained Earnings = 300, EBIT = 150, Total Assets = 1000, Total Liab = 500, Equity = 500
      // X1 = 200/1000 = 0.2
      // X2 = 300/1000 = 0.3
      // X3 = 150/1000 = 0.15
      // X4 = 500/500 = 1.0
      // Z'' = 6.56*0.2 + 3.26*0.3 + 6.72*0.15 + 1.05*1.0
      //     = 1.312 + 0.978 + 1.008 + 1.05 = 4.348 -> 4.35 (SAFE)
      const res = calculateAltmanZScore({
        workingCapital: 200,
        retainedEarnings: 300,
        ebit: 150,
        totalAssets: 1000,
        totalLiabilities: 500,
        bookValueOfEquity: 500,
        variant: "Z_DOUBLE_PRIME",
      });

      assert.equal(res.isComputable, true);
      assert.equal(res.status, "VALID");
      assert.equal(res.value, 4.35);
      assert.equal(res.zone, "SAFE");
    });

    it("returns NOT_APPLICABLE for banking, NBFC, or financial entities", () => {
      const res = calculateAltmanZScore({
        workingCapital: 200,
        retainedEarnings: 300,
        ebit: 150,
        totalAssets: 1000,
        totalLiabilities: 500,
        bookValueOfEquity: 500,
        isFinancialInstitution: true,
      });

      assert.equal(res.isComputable, false);
      assert.equal(res.status, "NOT_APPLICABLE");
      assert.match(res.reason ?? "", /not applicable to banks/i);
    });

    it("returns MISSING_INPUT when Retained Earnings is not disclosed (zero fabrication)", () => {
      const res = calculateAltmanZScore({
        workingCapital: 200,
        retainedEarnings: null, // Not segregated on face of balance sheet
        ebit: 150,
        totalAssets: 1000,
        totalLiabilities: 500,
        bookValueOfEquity: 500,
      });

      assert.equal(res.isComputable, false);
      assert.equal(res.status, "MISSING_INPUT");
      assert.match(res.reason ?? "", /Retained Earnings line item is not separately disclosed/i);
    });

    it("computes 1968 manufacturing Z-score with market equity valuation", () => {
      // Fixture: WC=100, RE=200, EBIT=100, TA=1000, TL=400, MktCap=800, Rev=1200
      // X1 = 0.1, X2 = 0.2, X3 = 0.1, X4 = 800/400 = 2.0, X5 = 1.2
      // Z = 1.2*0.1 + 1.4*0.2 + 3.3*0.1 + 0.6*2.0 + 0.999*1.2
      //   = 0.12 + 0.28 + 0.33 + 1.20 + 1.1988 = 3.1288 -> 3.13 (SAFE)
      const res = calculateAltmanZScore({
        workingCapital: 100,
        retainedEarnings: 200,
        ebit: 100,
        totalAssets: 1000,
        totalLiabilities: 400,
        marketCap: 800,
        revenue: 1200,
        variant: "ORIGINAL_1968",
      });

      assert.equal(res.isComputable, true);
      assert.equal(res.status, "VALID");
      assert.equal(res.value, 3.13);
      assert.equal(res.zone, "SAFE");
    });
  });

  describe("Beneish M-Score Earnings Manipulation Diagnostic", () => {
    it("computes 8-variable Beneish M-Score across two consecutive comparable periods", () => {
      const currentPeriod = {
        revenue: 1000,
        cogs: 600,
        accountsReceivable: 150,
        totalCurrentAssets: 400,
        propertyPlantEquipment: 500,
        marketableSecurities: 50,
        totalAssets: 1200,
        operatingExpenses: 150,
        shortTermDebt: 50,
        longTermDebt: 250,
        totalCurrentLiabilities: 200,
        netIncome: 120,
        operatingCashFlow: 140,
        depreciation: 50,
      };

      const priorPeriod = {
        revenue: 900,
        cogs: 540,
        accountsReceivable: 130,
        totalCurrentAssets: 360,
        propertyPlantEquipment: 480,
        marketableSecurities: 40,
        totalAssets: 1100,
        operatingExpenses: 140,
        shortTermDebt: 60,
        longTermDebt: 260,
        totalCurrentLiabilities: 190,
        netIncome: 110,
        operatingCashFlow: 130,
        depreciation: 45,
      };

      const res = calculateBeneishMScore({
        currentPeriod,
        priorPeriod,
      });

      assert.equal(res.isComputable, true);
      assert.equal(res.status, "VALID");
      assert(typeof res.value === "number");
      assert.equal(res.zone, "NORMAL");
      assert.match(res.interpretation ?? "", /Beneish M-Score/);
    });

    it("returns MISSING_INPUT when prior fiscal year baseline is absent", () => {
      const res = calculateBeneishMScore({
        currentPeriod: {
          revenue: 1000,
          cogs: 600,
          accountsReceivable: 150,
          totalCurrentAssets: 400,
          propertyPlantEquipment: 500,
          totalAssets: 1200,
          netIncome: 120,
          operatingCashFlow: 140,
        },
        priorPeriod: null,
      });

      assert.equal(res.isComputable, false);
      assert.equal(res.status, "MISSING_INPUT");
      assert.match(res.reason ?? "", /requires two consecutive comparable fiscal years/i);
    });
  });

  describe("DSCR & Analytical Debt Service Proxy", () => {
    it("computes certified DSCR when scheduled principal repayments are explicitly disclosed", () => {
      // PAT = 100, Deprec = 40, Term Interest = 20. Numerator = 160.
      // Term Interest = 20, Principal Repayment = 60. Denominator = 80.
      // DSCR = 160 / 80 = 2.00x
      const res = calculateDSCR(100, 40, 20, 60);

      assert.equal(res.isComputable, true);
      assert.equal(res.status, "VALID");
      assert.equal(res.value, 2.0);
    });

    it("returns MISSING_INPUT when scheduled principal repayment is omitted from primary disclosure", () => {
      const res = calculateDSCR(100, 40, 20, null);

      assert.equal(res.isComputable, false);
      assert.equal(res.status, "MISSING_INPUT");
      assert.match(res.reason ?? "", /Scheduled term debt principal repayments are not explicitly disclosed/i);
    });

    it("computes debt service proxy using short-term borrowings as debt rollover indicator", () => {
      // EBITDA = 250, Interest = 25, Short-Term Debt = 75. Denom = 100.
      // Proxy = 250 / 100 = 2.50x
      const res = calculateDebtServiceProxy(250, 25, 75);

      assert.equal(res.isComputable, true);
      assert.equal(res.status, "VALID");
      assert.equal(res.value, 2.5);
      assert.match(res.interpretation ?? "", /analytical rollover proxy/i);
    });
  });

  describe("Indian Banking Credit Appraisal: TOL / TNW", () => {
    it("computes Total Outside Liabilities to Tangible Net Worth correctly", () => {
      // Total Liabilities = 899,230 Cr (e.g. Reliance FY24)
      // Total Equity = 838,894 Cr, Intangibles = 0
      // TOL / TNW = 899230 / 838894 = 1.07x
      const res = calculateTolToTnw(899230, 838894, 0);

      assert.equal(res.isComputable, true);
      assert.equal(res.status, "VALID");
      assert.equal(res.value, 1.07);
    });

    it("safely handles negative tangible net worth (capital deficiency)", () => {
      const res = calculateTolToTnw(500, -50, 0);

      assert.equal(res.isComputable, false);
      assert.equal(res.status, "NEGATIVE_BASE");
      assert.match(res.reason ?? "", /Tangible Net Worth is negative or zero/i);
    });
  });

  describe("Covenant Headroom & Reverse Stress Analysis", () => {
    it("computes deterministic EBITDA decline headroom before leverage hurdle breach", () => {
      // Net Debt = 300, EBITDA = 150, Current Net Debt / EBITDA = 2.0x, Hurdle = 3.0x
      // Breach EBITDA = 300 / 3.0 = 100
      // Headroom Amount = 150 - 100 = 50
      // Headroom Pct = (50 / 150) * 100 = 33.3%
      const res = calculateCovenantHeadroom(
        { currentNetDebtToEbitda: 2.0, netDebt: 300, ebitda: 150, hurdle: 3.0 },
        { currentInterestCoverage: 5.0, ebit: 100, interestExpense: 20, hurdle: 2.5 },
        { currentRatio: 1.5, currentAssets: 300, currentLiabilities: 200, hurdle: 1.1 }
      );

      assert.equal(res.leverageHeadroom.isBreached, false);
      assert.equal(res.leverageHeadroom.headroomAmount, 50);
      assert.equal(res.leverageHeadroom.headroomPct, 33.3);

      // Coverage: EBIT=100, Int=20, Hurdle=2.5. Breach EBIT = 20 * 2.5 = 50.
      // Drop Amount = 100 - 50 = 50. Drop Pct = (50/100)*100 = 50.0%
      assert.equal(res.coverageHeadroom.isBreached, false);
      assert.equal(res.coverageHeadroom.headroomAmount, 50);
      assert.equal(res.coverageHeadroom.headroomPct, 50.0);

      // Liquidity: CA=300, CL=200, Hurdle=1.1. Breach CA = 200 * 1.1 = 220.
      // Drop Amount = 300 - 220 = 80. Drop Pct = (80/300)*100 = 26.7%
      assert.equal(res.liquidityHeadroom.isBreached, false);
      assert.equal(res.liquidityHeadroom.headroomAmount, 80);
      assert.equal(res.liquidityHeadroom.headroomPct, 26.7);
    });

    it("identifies breached covenant hurdles accurately", () => {
      const res = calculateCovenantHeadroom(
        { currentNetDebtToEbitda: 4.5, netDebt: 450, ebitda: 100, hurdle: 3.5 },
        { currentInterestCoverage: 1.8, ebit: 36, interestExpense: 20, hurdle: 2.5 },
        { currentRatio: 0.9, currentAssets: 180, currentLiabilities: 200, hurdle: 1.1 }
      );

      assert.equal(res.leverageHeadroom.isBreached, true);
      assert.equal(res.coverageHeadroom.isBreached, true);
      assert.equal(res.liquidityHeadroom.isBreached, true);
    });
  });
});
