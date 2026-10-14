import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  auditBalanceSheetIdentity,
  calculateNetDebt,
  calculateWorkingCapital,
  calculateCurrentRatio,
  calculateNetDebtToEbitda,
  calculateInterestCoverage,
  calculateFreeCashFlow,
  calculateMargin,
  calculateGrowthRate,
} from "../src/lib/financialCalculations.ts";

describe("Phase 2 & 3: Pure Financial Calculations & Balance Sheet Audit", () => {
  describe("auditBalanceSheetIdentity", () => {
    it("confirms exact balance sheet identity (Assets = Liabilities + Equity)", () => {
      const res = auditBalanceSheetIdentity(1000, 400, 600, 0.01);
      assert.equal(res.isBalanced, true);
      assert.equal(res.status, "BALANCED");
      assert.equal(res.difference, 0);
    });

    it("accepts minute rounding discrepancies within 0.01% tolerance", () => {
      // 1000.05 vs 1000.00 is 0.005% difference <= 0.01%
      const res = auditBalanceSheetIdentity(1000.05, 400, 600, 0.01);
      assert.equal(res.isBalanced, true);
      assert.equal(res.status, "BALANCED");
    });

    it("triggers imbalance warning when discrepancy exceeds tolerance without silent adjustment", () => {
      const res = auditBalanceSheetIdentity(1000, 400, 550, 0.01);
      assert.equal(res.isBalanced, false);
      assert.equal(res.status, "IMBALANCE_WARNING");
      assert.equal(res.difference, 50);
      assert.ok(res.explanation.includes("deviation exceeds"));
    });

    it("handles missing disclosures safely without throwing", () => {
      const res = auditBalanceSheetIdentity(1000, null, 600);
      assert.equal(res.isBalanced, false);
      assert.equal(res.status, "MISSING_DATA");
    });
  });

  describe("calculateNetDebt", () => {
    it("computes net debt correctly for levered entities", () => {
      const res = calculateNetDebt(500, 100, 50);
      assert.equal(res.isComputable, true);
      assert.equal(res.value, 350);
    });

    it("handles net-cash surplus (negative net debt)", () => {
      const res = calculateNetDebt(100, 300, 50);
      assert.equal(res.isComputable, true);
      assert.equal(res.value, -250);
    });

    it("returns typed not-computable result when total debt is null", () => {
      const res = calculateNetDebt(null, 100);
      assert.equal(res.isComputable, false);
      assert.equal(res.status, "MISSING_INPUT");
      assert.equal(res.value, null);
    });
  });

  describe("calculateWorkingCapital & calculateCurrentRatio", () => {
    it("computes working capital and current ratio correctly", () => {
      const wc = calculateWorkingCapital(200, 120);
      assert.equal(wc.value, 80);

      const cr = calculateCurrentRatio(200, 120);
      assert.equal(cr.value, 1.67);
      assert.equal(cr.isComputable, true);
    });

    it("safely handles zero current liabilities (zero denominator)", () => {
      const cr = calculateCurrentRatio(200, 0);
      assert.equal(cr.isComputable, false);
      assert.equal(cr.status, "ZERO_DENOMINATOR");
      assert.equal(cr.value, null);
    });
  });

  describe("calculateNetDebtToEbitda & calculateInterestCoverage", () => {
    it("computes leverage multiple and identifies debt-free buffer", () => {
      const lev = calculateNetDebtToEbitda(350, 100);
      assert.equal(lev.value, 3.5);

      const debtFree = calculateNetDebtToEbitda(-50, 100);
      assert.equal(debtFree.value, 0.0);
      assert.ok(debtFree.reason?.includes("net-cash"));
    });

    it("handles negative or zero EBITDA gracefully", () => {
      const lev = calculateNetDebtToEbitda(350, -50);
      assert.equal(lev.isComputable, false);
      assert.equal(lev.status, "NEGATIVE_BASE");
    });

    it("computes interest coverage and flags zero interest draw", () => {
      const cov = calculateInterestCoverage(150, 30);
      assert.equal(cov.value, 5.0);

      const zeroDraw = calculateInterestCoverage(150, 0);
      assert.equal(zeroDraw.isComputable, false);
      assert.equal(zeroDraw.status, "ZERO_DENOMINATOR");
    });
  });

  describe("calculateMargin & calculateGrowthRate", () => {
    it("computes operating margin percentage", () => {
      const m = calculateMargin(25, 100, "Operating");
      assert.equal(m.value, 25.0);
    });

    it("computes period-over-period growth rate", () => {
      const g = calculateGrowthRate(120, 100);
      assert.equal(g.value, 20.0);
    });

    it("handles zero baseline in growth rate", () => {
      const g = calculateGrowthRate(120, 0);
      assert.equal(g.isComputable, false);
      assert.equal(g.status, "ZERO_DENOMINATOR");
    });

    it("computes free cash flow (CFO - CapEx)", () => {
      const fcf = calculateFreeCashFlow(500, 150);
      assert.equal(fcf.value, 350);
      assert.equal(fcf.isComputable, true);
    });
  });
});
