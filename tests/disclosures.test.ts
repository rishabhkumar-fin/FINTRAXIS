import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getBusinessDependencies,
  getConcentrationAnalysis,
  computeHerfindahlIndex,
} from "../src/lib/businessDisclosures.ts";

describe("Module 4 & 5: Business Dependencies and Concentration Analysis", () => {
  it("resolves confirmed regulatory dependencies for Apple Inc. (AAPL)", () => {
    const deps = getBusinessDependencies("AAPL");
    assert.ok(deps.length >= 3, "Expected at least 3 disclosed dependencies for AAPL");

    const tsmc = deps.find((d) => d.counterpartyName.includes("TSMC"));
    assert.ok(tsmc, "TSMC dependency missing");
    assert.equal(tsmc.dependencyLevel, "CRITICAL_SINGLE_SOURCE");
    assert.equal(tsmc.relationshipType, "SUPPLIER");
    assert.equal(tsmc.disclosureType, "CONFIRMED_FILING");

    const foxconn = deps.find((d) => d.counterpartyName.includes("Foxconn"));
    assert.ok(foxconn, "Foxconn dependency missing");
    assert.equal(foxconn.dependencyLevel, "STRATEGIC_HIGH");

    const customerDist = deps.find((d) => d.relationshipType === "CUSTOMER");
    assert.ok(customerDist, "Customer concentration disclosure missing");
    assert.equal(customerDist.dependencyLevel, "DISTRIBUTED");
  });

  it("resolves confirmed regulatory dependencies for Reliance Industries (RELIANCE.NS)", () => {
    const deps = getBusinessDependencies("RELIANCE.NS");
    assert.ok(deps.length >= 2, "Expected at least 2 disclosed dependencies for Reliance");

    const dot = deps.find((d) => d.relationshipType === "REGULATORY_INFRASTRUCTURE");
    assert.ok(dot, "DoT regulatory dependency missing");
    assert.equal(dot.dependencyLevel, "CRITICAL_SINGLE_SOURCE");

    const aramco = deps.find((d) => d.counterpartyName.includes("Aramco"));
    assert.ok(aramco, "Crude supply dependency missing");
  });

  it("calculates Herfindahl-Hirschman Index (HHI) with mathematical precision", () => {
    // 50% and 50% = 50^2 + 50^2 = 2500 + 2500 = 5000
    const hhi5050 = computeHerfindahlIndex([
      { percentageOfTotal: 50 },
      { percentageOfTotal: 50 },
    ]);
    assert.equal(hhi5050, 5000);

    // 4 equal segments of 25% = 4 * 625 = 2500
    const hhi25x4 = computeHerfindahlIndex([
      { percentageOfTotal: 25 },
      { percentageOfTotal: 25 },
      { percentageOfTotal: 25 },
      { percentageOfTotal: 25 },
    ]);
    assert.equal(hhi25x4, 2500);

    // 10 equal segments of 10% = 10 * 100 = 1000 (Well Diversified)
    const hhi10x10 = computeHerfindahlIndex(
      Array.from({ length: 10 }, () => ({ percentageOfTotal: 10 }))
    );
    assert.equal(hhi10x10, 1000);
  });

  it("computes segment and geographic concentration analysis for Apple Inc.", () => {
    const analysis = getConcentrationAnalysis("AAPL", "USD");
    assert.equal(analysis.companyId, "AAPL");
    assert.equal(analysis.regulatoryStandard, "US-GAAP (ASC 280 Segment Reporting)");
    assert.ok(analysis.businessSegments.length >= 5, "Expected 5 product segments for Apple");
    assert.ok(analysis.geographicSegments.length >= 5, "Expected 5 geographic segments for Apple");

    assert.equal(analysis.topSegmentName, "iPhone");
    assert.ok(analysis.topSegmentConcentrationPct > 50, "iPhone should be > 50% of revenue");
    assert.equal(analysis.topGeographicName, "Americas (USA, Canada, Latin America)");
    assert.ok(analysis.herfindahlIndexBusiness > 2500, "Apple product lines should have HHI > 2500");
  });

  it("provides transparent fallback disclaimer when disclosures are exempt or unavailable", () => {
    const unmapped = getBusinessDependencies("UNKNOWN_TICKER");
    assert.ok(unmapped.length > 0);
    assert.equal(unmapped[0].disclosureType, "QUALITATIVE_NOTE");
    assert.ok(
      unmapped[0].description.includes("confidential trade secrets") ||
        unmapped[0].description.includes("confidential"),
      "Fallback must explain confidential treatment honestly"
    );

    const unmappedConc = getConcentrationAnalysis("UNKNOWN_TICKER", "USD");
    assert.equal(unmappedConc.dataStatus, "PARTIAL_DISCLOSURE");
    assert.ok(unmappedConc.disclosureNotes.length > 0);
  });
});
