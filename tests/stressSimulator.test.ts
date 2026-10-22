import { test, describe } from "node:test";
import assert from "node:assert";
import { calculateStressScenario } from "../src/lib/financialCalculations.ts";

describe("Stage 4: Deterministic Stress Simulator Unit Tests", () => {
  test("1. 100% variable costs (v = 1.0): EBIT contracts by the exact same percentage as revenue under 0% inflation", () => {
    const revenue = 100000;
    const ebit = 25000; // Operating margin = 25%
    const shockPct = -20; // 20% revenue contraction

    const result = calculateStressScenario({
      revenue,
      ebit,
      revenueShockPct: shockPct,
      cogsInflationPct: 0,
      rateShockBps: 0,
      variableCostSharePct: 100, // 100% variable
      floatingRateDebtSharePct: 0,
    });

    // Stressed revenue = 80,000 (-20%)
    assert.strictEqual(result.simulatedRevenue, 80000);

    // Stressed EBIT must contract by exactly 20%: 25000 * 0.8 = 20000
    assert.strictEqual(result.simulatedEbit, 20000);

    // EBIT Delta = -5000
    assert.strictEqual(result.ebitDelta, -5000);

    // Exact Bridge reconciliation
    const bridgeSum =
      result.ebitBridge.baselineEbit +
      result.ebitBridge.revenueShockImpact +
      result.ebitBridge.variableCostRelief +
      result.ebitBridge.variableCostInflationImpact +
      result.ebitBridge.fixedCostInflationImpact;
    assert.strictEqual(Number(bridgeSum.toFixed(2)), result.simulatedEbit);
  });

  test("2. 0% variable costs (v = 0.0): Maximum operating leverage, entire revenue shock hits EBIT", () => {
    const revenue = 100000;
    const ebit = 25000;
    const shockPct = -10; // -10,000 revenue drop

    const result = calculateStressScenario({
      revenue,
      ebit,
      revenueShockPct: shockPct,
      cogsInflationPct: 0,
      rateShockBps: 0,
      variableCostSharePct: 0, // 100% fixed costs
      floatingRateDebtSharePct: 0,
    });

    // Stressed revenue = 90,000
    assert.strictEqual(result.simulatedRevenue, 90000);

    // Because 100% of costs are fixed (75,000), EBIT drops dollar-for-dollar: 25000 - 10000 = 15000
    assert.strictEqual(result.simulatedEbit, 15000);

    // Fixed costs remain 75,000
    assert.strictEqual(result.stressedFixedCosts, 75000);
    assert.strictEqual(result.stressedVariableCosts, 0);

    // Exact Bridge reconciliation
    const bridgeSum =
      result.ebitBridge.baselineEbit +
      result.ebitBridge.revenueShockImpact +
      result.ebitBridge.variableCostRelief +
      result.ebitBridge.variableCostInflationImpact +
      result.ebitBridge.fixedCostInflationImpact;
    assert.strictEqual(Number(bridgeSum.toFixed(2)), result.simulatedEbit);
  });

  test("3. Zero interest expense / Net cash entity: status returns ZERO_INTEREST without division-by-zero error", () => {
    const result = calculateStressScenario({
      revenue: 50000,
      ebit: 10000,
      interestExpense: 0,
      totalDebt: 0,
      cash: 15000,
      revenueShockPct: -15,
      cogsInflationPct: 5,
      rateShockBps: 300,
      variableCostSharePct: 40,
      floatingRateDebtSharePct: 0,
    });

    assert.strictEqual(result.simulatedInterestExpense, 0);
    assert.strictEqual(result.simulatedInterestCoverage, null);
    assert.strictEqual(result.interestCoverageStatus, "ZERO_INTEREST");
    assert.strictEqual(result.thresholdBreached, false);
    assert.match(result.thresholdBreachSummary, /Complies with analytical reference thresholds/);
  });

  test("4. Severe shock producing negative EBIT: status returns EBIT_NEGATIVE and honest what-if threshold summary", () => {
    const result = calculateStressScenario({
      revenue: 10000,
      ebit: 500, // Thin 5% baseline margin
      interestExpense: 400,
      totalDebt: 5000,
      cash: 200,
      revenueShockPct: -30, // Severe 30% drop
      cogsInflationPct: 15, // 15% inflation
      rateShockBps: 200,
      variableCostSharePct: 20, // Low variable cost flexibility
      floatingRateDebtSharePct: 50,
    });

    // EBIT should be deeply negative
    assert.ok(result.simulatedEbit < 0, `Expected negative EBIT, got ${result.simulatedEbit}`);
    assert.strictEqual(result.interestCoverageStatus, "EBIT_NEGATIVE");
    assert.strictEqual(result.thresholdBreached, true);

    // Verifies honest disclaimer wording, NOT "covenant breach" as a legal certainty
    assert.doesNotMatch(result.thresholdBreachSummary, /covenant breach/i);
    assert.match(result.thresholdBreachSummary, /Reference threshold breached in this scenario/);
    assert.match(result.thresholdBreachSummary, /This is a what-if calculation, not a prediction/);

    // Bridge reconciliation holds even with negative EBIT
    const bridgeSum =
      result.ebitBridge.baselineEbit +
      result.ebitBridge.revenueShockImpact +
      result.ebitBridge.variableCostRelief +
      result.ebitBridge.variableCostInflationImpact +
      result.ebitBridge.fixedCostInflationImpact;
    assert.strictEqual(Number(bridgeSum.toFixed(2)), result.simulatedEbit);
  });

  test("5. Multi-factor test: Floating-rate interest shock correctly calculates incremental interest", () => {
    const totalDebt = 100000;
    const floatingRateShare = 60; // 60% of 100k = 60k floating
    const rateShockBps = 250; // +250 bps = 2.50%
    const baseInterest = 5000;

    const result = calculateStressScenario({
      revenue: 200000,
      ebit: 40000,
      interestExpense: baseInterest,
      totalDebt,
      cash: 10000,
      revenueShockPct: -5,
      cogsInflationPct: 2,
      rateShockBps,
      variableCostSharePct: 50,
      floatingRateDebtSharePct: floatingRateShare,
    });

    // Incremental interest = 60,000 * 0.025 = 1,500
    assert.strictEqual(result.stressedFloatingDebtAmount, 60000);
    assert.strictEqual(result.incrementalInterestExpense, 1500);
    assert.strictEqual(result.simulatedInterestExpense, 6500);
  });
});
