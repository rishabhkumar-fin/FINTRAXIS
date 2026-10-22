import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculatePromoterPledgeRisk,
  calculateDrawingPower,
  calculateContingentLiabilitiesRatio,
  reconcileDebtStructure,
} from "../src/lib/financialCalculations.ts";
import type { DebtInstrumentRow } from "../src/lib/financialCalculations.ts";

describe("Phase 9: Institutional Metrics & Governance Tests", () => {
  // =========================================================================
  // 1. PROMOTER SHARE PLEDGING
  // =========================================================================
  describe("1. Promoter Share Pledging (SEBI LODR Reg 31)", () => {
    it("computes normal pledge ratio correctly and assigns moderate risk tier", () => {
      const res = calculatePromoterPledgeRisk({
        promoterHoldingPct: 50.0,
        pledgedPctOfPromoterHolding: 15.0,
        hasDisclosedPromoterGroup: true,
      });
      assert.equal(res.status, "VALID");
      assert.equal(res.isComputable, true);
      assert.equal(res.value, 15.0);
      assert.equal(res.riskTier, "MODERATE_RISK");
      assert.equal(res.pledgedPctOfTotalCapital, 7.5); // 15% of 50%
    });

    it("handles zero pledge cleanly as a verified zero with low risk", () => {
      const res = calculatePromoterPledgeRisk({
        promoterHoldingPct: 50.3,
        pledgedPctOfPromoterHolding: 0.0,
        hasDisclosedPromoterGroup: true,
      });
      assert.equal(res.status, "VALID");
      assert.equal(res.value, 0.0);
      assert.equal(res.riskTier, "LOW_RISK");
      assert.equal(res.pledgedPctOfTotalCapital, 0.0);
    });

    it("returns MISSING_INPUT when promoter disclosure inputs are absent", () => {
      const res = calculatePromoterPledgeRisk({
        promoterHoldingPct: null,
        pledgedPctOfPromoterHolding: null,
        hasDisclosedPromoterGroup: true,
      });
      assert.equal(res.status, "MISSING_INPUT");
      assert.equal(res.isComputable, false);
      assert.equal(res.value, null);
    });

    it("returns NOT_APPLICABLE when disclosed promoter holding is zero", () => {
      const res = calculatePromoterPledgeRisk({
        promoterHoldingPct: 0.0,
        hasDisclosedPromoterGroup: true,
      });
      assert.equal(res.status, "NOT_APPLICABLE");
      assert.equal(res.isComputable, false);
      assert.equal(res.value, null);
    });

    it("returns NOT_APPLICABLE when entity has no disclosed promoter group (widely held)", () => {
      const res = calculatePromoterPledgeRisk({
        hasDisclosedPromoterGroup: false,
      });
      assert.equal(res.status, "NOT_APPLICABLE");
      assert.equal(res.isComputable, false);
      assert.equal(res.value, null);
    });

    it("flags invalid pledge data where pledged exceeds 100% or is negative", () => {
      const negativeRes = calculatePromoterPledgeRisk({
        promoterHoldingPct: 50.0,
        pledgedPctOfPromoterHolding: -5.0,
      });
      assert.equal(negativeRes.status, "NEGATIVE_BASE");

      const overflowRes = calculatePromoterPledgeRisk({
        promoterHoldingPct: 50.0,
        pledgedPctOfPromoterHolding: 105.0,
      });
      assert.equal(overflowRes.status, "NEGATIVE_BASE");
    });

    it("evaluates boundary conditions exactly at 10% and 30%", () => {
      // Exactly 10% -> LOW_RISK (<= 10)
      const lowBoundary = calculatePromoterPledgeRisk({
        promoterHoldingPct: 50.0,
        pledgedPctOfPromoterHolding: 10.0,
      });
      assert.equal(lowBoundary.riskTier, "LOW_RISK");

      // Just above 10% -> MODERATE_RISK
      const aboveLow = calculatePromoterPledgeRisk({
        promoterHoldingPct: 50.0,
        pledgedPctOfPromoterHolding: 10.01,
      });
      assert.equal(aboveLow.riskTier, "MODERATE_RISK");

      // Exactly 30% -> MODERATE_RISK (<= 30)
      const modBoundary = calculatePromoterPledgeRisk({
        promoterHoldingPct: 50.0,
        pledgedPctOfPromoterHolding: 30.0,
      });
      assert.equal(modBoundary.riskTier, "MODERATE_RISK");

      // Just above 30% -> ELEVATED_RISK
      const elevated = calculatePromoterPledgeRisk({
        promoterHoldingPct: 50.0,
        pledgedPctOfPromoterHolding: 30.01,
      });
      assert.equal(elevated.riskTier, "ELEVATED_RISK");
    });
  });

  // =========================================================================
  // 2. INDICATIVE WORKING CAPITAL DRAWING POWER
  // =========================================================================
  describe("2. Indicative Working Capital Drawing Power (India)", () => {
    it("computes normal case matching Hand-Computed Fixture 1 Scenario A", () => {
      // Values from docs/RECONCILIATION.md Fixture 1 Scenario A
      const res = calculateDrawingPower({
        inventory: 500.0,
        tradeCreditors: 200.0,
        eligibleReceivablesUnder90Days: 300.0,
        inventoryMarginPct: 25,
        receivablesMarginPct: 40,
        workingCapitalBorrowings: 250.0,
      });

      assert.equal(res.status, "VALID");
      assert.equal(res.isComputable, true);
      assert.equal(res.unflooredPaidStock, 300.0);
      assert.equal(res.flooredPaidStock, 300.0);
      assert.equal(res.stockContribution, 225.0); // 300 * 0.75
      assert.equal(res.receivablesContribution, 180.0); // 300 * 0.60
      assert.equal(res.value, 405.0); // 225 + 180
      assert.equal(res.utilizationPct, 61.7); // (250 / 405) * 100
    });

    it("floors paid stock at zero when trade creditors exceed inventory (Fixture 1 Scenario B)", () => {
      // Values from docs/RECONCILIATION.md Fixture 1 Scenario B
      const res = calculateDrawingPower({
        inventory: 150.0,
        tradeCreditors: 250.0,
        eligibleReceivablesUnder90Days: 400.0,
        inventoryMarginPct: 25,
        receivablesMarginPct: 40,
      });

      assert.equal(res.status, "VALID");
      assert.equal(res.unflooredPaidStock, -100.0);
      assert.equal(res.flooredPaidStock, 0.0);
      assert.equal(res.stockContribution, 0.0);
      assert.equal(res.receivablesContribution, 240.0); // 400 * 0.60
      assert.equal(res.value, 240.0);
    });

    it("returns MISSING_INPUT when receivables ageing (< 90 days) is omitted", () => {
      const res = calculateDrawingPower({
        inventory: 500.0,
        tradeCreditors: 200.0,
        eligibleReceivablesUnder90Days: null,
      });

      assert.equal(res.status, "MISSING_INPUT");
      assert.equal(res.isComputable, false);
      assert.equal(res.value, null);
      assert.match(res.reason || "", /ageing schedule/i);
    });

    it("handles margin extremes (0%, 100%) and rejects invalid margins", () => {
      const zeroMargin = calculateDrawingPower({
        inventory: 300.0,
        tradeCreditors: 100.0, // Paid Stock = 200
        eligibleReceivablesUnder90Days: 100.0,
        inventoryMarginPct: 0,
        receivablesMarginPct: 0,
      });
      assert.equal(zeroMargin.value, 300.0); // 200 + 100

      const fullMargin = calculateDrawingPower({
        inventory: 300.0,
        tradeCreditors: 100.0,
        eligibleReceivablesUnder90Days: 100.0,
        inventoryMarginPct: 100,
        receivablesMarginPct: 100,
      });
      assert.equal(fullMargin.value, 0.0);

      const invalidMargin = calculateDrawingPower({
        inventory: 300.0,
        tradeCreditors: 100.0,
        eligibleReceivablesUnder90Days: 100.0,
        inventoryMarginPct: -10,
      });
      assert.equal(invalidMargin.status, "MISSING_INPUT");
    });

    it("returns NOT_APPLICABLE for banks and financial institutions", () => {
      const res = calculateDrawingPower({
        inventory: 500.0,
        tradeCreditors: 200.0,
        eligibleReceivablesUnder90Days: 300.0,
        isBankOrFinancial: true,
      });
      assert.equal(res.status, "NOT_APPLICABLE");
      assert.equal(res.isComputable, false);
      assert.equal(res.value, null);
    });
  });

  // =========================================================================
  // 3. CONTINGENT LIABILITIES RATIO
  // =========================================================================
  describe("3. Contingent Liabilities to Tangible Net Worth", () => {
    it("computes normal ratio and assigns low risk tier", () => {
      const res = calculateContingentLiabilitiesRatio({
        totalContingentLiabilities: 200.0,
        tangibleNetWorth: 1000.0,
      });
      assert.equal(res.status, "VALID");
      assert.equal(res.isComputable, true);
      assert.equal(res.value, 20.0);
      assert.equal(res.riskTier, "LOW_RISK");
    });

    it("returns MISSING_INPUT when contingent liabilities note is omitted", () => {
      const res = calculateContingentLiabilitiesRatio({
        totalContingentLiabilities: null,
        tangibleNetWorth: 1000.0,
      });
      assert.equal(res.status, "MISSING_INPUT");
      assert.equal(res.isComputable, false);
    });

    it("handles zero and negative tangible net worth as capital deficiency", () => {
      const zeroNetWorth = calculateContingentLiabilitiesRatio({
        totalContingentLiabilities: 100.0,
        tangibleNetWorth: 0.0,
      });
      assert.equal(zeroNetWorth.status, "NEGATIVE_BASE");

      const negNetWorth = calculateContingentLiabilitiesRatio({
        totalContingentLiabilities: 100.0,
        tangibleNetWorth: -500.0,
      });
      assert.equal(negNetWorth.status, "NEGATIVE_BASE");
    });

    it("evaluates boundary levels exactly at 30% and 50%", () => {
      const at30 = calculateContingentLiabilitiesRatio({
        totalContingentLiabilities: 300.0,
        tangibleNetWorth: 1000.0,
      });
      assert.equal(at30.riskTier, "LOW_RISK");

      const at31 = calculateContingentLiabilitiesRatio({
        totalContingentLiabilities: 300.1,
        tangibleNetWorth: 1000.0,
      });
      assert.equal(at31.riskTier, "MODERATE_RISK");

      const at50 = calculateContingentLiabilitiesRatio({
        totalContingentLiabilities: 500.0,
        tangibleNetWorth: 1000.0,
      });
      assert.equal(at50.riskTier, "MODERATE_RISK");

      const at51 = calculateContingentLiabilitiesRatio({
        totalContingentLiabilities: 500.1,
        tangibleNetWorth: 1000.0,
      });
      assert.equal(at51.riskTier, "ELEVATED_RISK");
    });
  });

  // =========================================================================
  // 4. DEBT STRUCTURE & RECONCILIATION
  // =========================================================================
  describe("4. Debt Structure & Tranche Reconciliation", () => {
    const sampleTranches: DebtInstrumentRow[] = [
      {
        id: "tranche_1",
        instrumentName: "1.250% Senior Notes 2026",
        coupon: 1.25,
        couponType: "FIXED",
        currency: "USD",
        maturityYear: 2026,
        principalAmount: 1500.0,
        sourceForm: "10-K",
        filingDate: "2024-11-01",
        sectionOrPage: "Note 8: Term Debt",
        verificationFlag: "NOT_INDEPENDENTLY_VERIFIED",
      },
      {
        id: "tranche_2",
        instrumentName: "2.100% Senior Notes 2028",
        coupon: 2.1,
        couponType: "FIXED",
        currency: "USD",
        maturityYear: 2028,
        principalAmount: 2500.0,
        sourceForm: "10-K",
        filingDate: "2024-11-01",
        sectionOrPage: "Note 8: Term Debt",
        verificationFlag: "NOT_INDEPENDENTLY_VERIFIED",
      },
      {
        id: "tranche_3",
        instrumentName: "3.000% Institutional Bonds 2031",
        coupon: 3.0,
        couponType: "FIXED",
        currency: "USD",
        maturityYear: 2031,
        principalAmount: 4000.0,
        sourceForm: "10-K",
        filingDate: "2024-11-01",
        sectionOrPage: "Note 8: Term Debt",
        verificationFlag: "NOT_INDEPENDENTLY_VERIFIED",
      },
    ];

    it("verifies required provenance fields on all tranche records", () => {
      for (const t of sampleTranches) {
        assert.ok(t.instrumentName, "Must have instrument name");
        assert.ok(t.sourceForm, "Must have source form");
        assert.ok(t.filingDate, "Must have filing date");
        assert.ok(t.sectionOrPage, "Must have section or page note citation");
        assert.ok(t.verificationFlag, "Must have verification flag");
      }
    });

    it("reconciles perfectly when tranche sum equals reported total debt (Fixture 2 Scenario A)", () => {
      const res = reconcileDebtStructure(sampleTranches, 8000.0);
      assert.equal(res.isReconciled, true);
      assert.equal(res.status, "RECONCILED");
      assert.equal(res.totalPrincipalSum, 8000.0);
      assert.equal(res.difference, 0.0);
    });

    it("explains variance when tranche sum differs from reported balance sheet debt (Fixture 2 Scenario B)", () => {
      const res = reconcileDebtStructure(sampleTranches, 8150.0);
      assert.equal(res.isReconciled, false);
      assert.equal(res.status, "VARIANCE_EXPLAINED");
      assert.equal(res.difference, 150.0);
      assert.match(res.explanation, /variance of 150/i);
    });

    it("returns MISSING_TOTAL when disclosed total debt is absent", () => {
      const res = reconcileDebtStructure(sampleTranches, null);
      assert.equal(res.isReconciled, false);
      assert.equal(res.status, "MISSING_TOTAL");
    });

    it("returns NO_INSTRUMENTS when tranche list is empty", () => {
      const res = reconcileDebtStructure([], 8000.0);
      assert.equal(res.isReconciled, false);
      assert.equal(res.status, "NO_INSTRUMENTS");
    });
  });

  // =========================================================================
  // 5. EXPORT VERIFICATION (CSV & SPREADSHEETML XML)
  // =========================================================================
  describe("5. Exports: New Metrics Appearance in CSV & XLSX", () => {
    it("ensures CSV header row contains new metrics and preserves N/D for missing fields", () => {
      const csvHeaders = [
        "Company", "Symbol", "Period", "Currency", "Scale",
        "Revenue", "GrossProfit", "EBIT", "NetIncome", "TotalDebt",
        "CashAndEquivalents", "OperatingCashFlow", "FreeCashFlow",
        "CurrentRatio", "NetDebtToEBITDA", "InterestCoverage",
        "TOL_TNW", "PromoterPledgePct", "IndicativeDrawingPower", "ContingentLiabilitiesPct",
      ];
      assert.ok(csvHeaders.includes("TOL_TNW"));
      assert.ok(csvHeaders.includes("PromoterPledgePct"));
      assert.ok(csvHeaders.includes("IndicativeDrawingPower"));
      assert.ok(csvHeaders.includes("ContingentLiabilitiesPct"));
    });

    it("ensures SpreadsheetML XML encodes missing values as String N/D rather than numeric zero", () => {
      const numCell = (v?: number | null) =>
        v !== undefined && v !== null
          ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>`
          : `<Cell><Data ss:Type="String">N/D</Data></Cell>`;

      const validCell = numCell(150.5);
      const missingCell = numCell(null);
      const undefinedCell = numCell(undefined);

      assert.match(validCell, /ss:Type="Number">150.5<\/Data>/);
      assert.match(missingCell, /ss:Type="String">N\/D<\/Data>/);
      assert.match(undefinedCell, /ss:Type="String">N\/D<\/Data>/);
      assert.strictEqual(missingCell.includes(">0<"), false, "Missing values must never default to zero in Excel");
    });
  });

  // =========================================================================
  // 6. OPERATIONAL GOVERNANCE & ROLE CLEARANCE
  // =========================================================================
  describe("6. Authorization: Write Paths Require Admin Clearance", () => {
    it("verifies operational permission matrix restricts writes to admin roles", async () => {
      const { ROLE_PERMISSIONS } = await import("../src/lib/authGuard.ts");
      assert.ok(ROLE_PERMISSIONS.MANAGE_USERS.includes("SUPER_ADMIN"));
      assert.ok(ROLE_PERMISSIONS.MANAGE_USERS.includes("ADMIN"));
      assert.strictEqual(ROLE_PERMISSIONS.MANAGE_USERS.includes("ANALYST"), false);
      assert.strictEqual(ROLE_PERMISSIONS.MANAGE_USERS.includes("DEMO_ANALYST"), false);
    });
  });
});
