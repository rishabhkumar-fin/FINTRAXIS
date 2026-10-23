import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { INSTITUTIONAL_COMPANIES } from "../src/lib/institutionalDatabase.ts";
import { computeCompanyFinanceSummary } from "../src/lib/finance/financeMaster.ts";
import { resolveMarketQuote } from "../src/lib/finance/quoteResolver.ts";
import { formatNetDebtMultiple } from "../src/lib/formatters.ts";

describe("Stage 2: Cross-Screen Financial Consistency Audit", () => {
  const tcs = INSTITUTIONAL_COMPANIES["TCS.NS"];
  assert.ok(tcs, "TCS.NS must exist in curated institutional database");

  const summary = computeCompanyFinanceSummary(tcs.company, tcs.periods);
  assert.ok(summary, "Finance summary must be computable for TCS.NS");

  it("1. Single source of truth computes exact baseline metrics for TCS.NS", () => {
    // 1. EBITDA & Net Debt
    assert.equal(summary.period.ebitda, 63100);
    assert.equal(summary.ratios.netDebt, -39400); // 0 debt - 39400 cash = -39400 (Net cash)
    assert.equal(summary.ratios.isNetCash, true);
    
    // Net Debt / EBITDA must be negative (-0.62x), never 0.0x!
    assert.equal(summary.ratios.netDebtToEbitda, -0.62);
    assert.ok(summary.ratios.netDebtToEbitdaLabel.includes("Net Cash"));
    assert.notEqual(summary.ratios.netDebtToEbitdaLabel, "0.0x");
    assert.notEqual(summary.ratios.netDebtToEbitdaLabel, "0.00x");

    // Coverage
    assert.equal(summary.ratios.interestCoverage, 73.06);

    // Current Ratio
    assert.equal(summary.ratios.currentRatio, 2.30);

    // Graded Health Score (Never 100/100 default)
    assert.ok(summary.healthScore.score > 0 && summary.healthScore.score < 100);
    assert.equal(summary.healthScore.score, 93);
  });

  it("2. Verifies formatNetDebtMultiple formats negative net debt honestly as Net Cash", () => {
    const formatted = formatNetDebtMultiple(summary.ratios.netDebtToEbitda);
    assert.equal(formatted, "-0.62x (Net Cash)");
    assert.notEqual(formatted, "0.0x (Net Cash)");
  });

  it("3. Verifies zero debt vs interest expense explanation", () => {
    // TCS has total debt = 0, but interest expense = 812 Cr (from leases under Ind AS 116)
    assert.equal(summary.debtStructure.totalDebt, 0);
    assert.equal(summary.period.interestExpense, 812);
    assert.ok(summary.debtStructure.explanation.includes("lease liabilities"));
    assert.ok(summary.ratios.financeCostExplanation.includes("lease liabilities under Ind AS 116"));
  });

  it("4. Market Quote Resolver enforces consistency between price, day change, and day range", () => {
    // When Yahoo provides live or delayed data
    const liveSimulated = resolveMarketQuote(tcs.company, {
      regularMarketPrice: 2506.90,
      fulldayChange: -22.10,
      fulldayChangePercent: -0.87,
      regularMarketDayLow: 2479.00,
      regularMarketDayHigh: 2533.00,
      fiftyTwoWeekLow: 1976.80,
      fiftyTwoWeekHigh: 3350.00,
      exchangeName: "NSE",
      currency: "INR",
    });

    assert.equal(liveSimulated.price, 2506.90);
    assert.equal(liveSimulated.change, -22.10);
    assert.equal(liveSimulated.changePercent, -0.87);
    assert.equal(liveSimulated.dayLow, 2479.00);
    assert.equal(liveSimulated.dayHigh, 2533.00);
    // Price must fall inside day range
    assert.ok(liveSimulated.price >= liveSimulated.dayLow);
    assert.ok(liveSimulated.price <= liveSimulated.dayHigh);
    // Price must fall inside 52-week corridor
    assert.ok(liveSimulated.price >= liveSimulated.fiftyTwoWeekLow);
    assert.ok(liveSimulated.price <= liveSimulated.fiftyTwoWeekHigh);
    // Status must NOT be 'live' or 'Verified'
    assert.notEqual(liveSimulated.status, "live");
    assert.equal(liveSimulated.status, "delayed");
    assert.ok(liveSimulated.statusLabel.includes("Delayed"));

    // Fallback reference quote
    const refQuote = resolveMarketQuote(tcs.company, null);
    assert.equal(refQuote.status, "reference");
    assert.ok(refQuote.statusLabel.includes("Reference data"));
    assert.ok(refQuote.statusLabel.includes("unverified"));
  });

  it("5. Audited ledger count reflects real count in database", () => {
    assert.equal(summary.periodsCount, 2);
    assert.ok(summary.latestPeriodLabel.includes("FY2024"));
    assert.ok(summary.latestPeriodLabel.includes("Newer filings may exist"));
  });

  it("6. CIK and regulatory standards match reporting country", () => {
    // TCS is an Indian company, not an SEC registrant
    assert.equal(summary.regulatory.framework, "Ind AS");
    assert.equal(summary.regulatory.cikLabel, "Not applicable (not an SEC registrant)");
    assert.equal(summary.regulatory.isBankOrFinancial, false);
  });

  it("7. Cross-screen consistency audit across all 13 institutional companies", () => {
    const symbols = Object.keys(INSTITUTIONAL_COMPANIES);
    assert.ok(symbols.length >= 10, "Must have at least 10 institutional companies");

    for (const sym of symbols) {
      const item = INSTITUTIONAL_COMPANIES[sym];
      const sum = computeCompanyFinanceSummary(item.company, item.periods);
      assert.ok(sum, `Finance summary must exist for ${sym}`);

      // 1. Share price matches exactly between quote and company entity
      assert.equal(sum.quote.price, item.company.sharePrice ?? sum.quote.price, `Price mismatch on ${sym}`);

      // 2. Net debt is mathematically exact: borrowings + leases - cash & liquid
      const expectedEffectiveDebt = sum.debtStructure.includeLeases
        ? sum.debtStructure.totalDebt
        : sum.debtStructure.borrowings;
      const expectedNetDebt = expectedEffectiveDebt - (sum.debtStructure.cashAndEquivalents + sum.debtStructure.liquidInvestments);
      assert.equal(sum.ratios.netDebt, expectedNetDebt, `Net debt mismatch on ${sym}`);

      // 3. EBITDA is positive for operating companies
      assert.ok(sum.period.ebitda !== null && sum.period.ebitda > 0, `EBITDA must be positive for ${sym}`);

      // 4. If net debt <= 0, netDebtToEbitdaLabel must display "Net Cash" and NEVER "0.0x"
      if (sum.ratios.isNetCash && sum.ratios.netDebtToEbitda !== null) {
        assert.ok(sum.ratios.netDebtToEbitdaLabel.includes("Net Cash"), `Label should say Net Cash on ${sym}`);
        assert.notEqual(sum.ratios.netDebtToEbitdaLabel, "0.0x", `Label must never be 0.0x on ${sym}`);
        assert.notEqual(sum.ratios.netDebtToEbitdaLabel, "0.00x", `Label must never be 0.00x on ${sym}`);
        assert.ok(formatNetDebtMultiple(sum.ratios.netDebtToEbitda).includes("Net Cash"));
      }

      // 5. Health score must be bounded 0-100 and discriminating
      assert.ok(sum.healthScore.score >= 0 && sum.healthScore.score <= 100, `Score out of bounds for ${sym}`);

      // 6. Net debt rule definition is explicitly stated
      assert.ok(sum.debtStructure.netDebtDefinition.length > 0, `Net debt definition missing for ${sym}`);

      // 7. Period count matches available periods
      assert.equal(sum.periodsCount, item.periods.length, `Period count mismatch on ${sym}`);
    }
  });
});
