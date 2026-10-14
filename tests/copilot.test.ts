import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveFinanceIntelligence } from "../src/lib/financeKnowledgeBase.ts";

describe("Phase 7: AI Copilot Grounding & Knowledge Resolution", () => {
  it("resolves core accounting concept 'assets' in PRO and ELI10 modes", () => {
    // PRO Mode
    const proResult = resolveFinanceIntelligence("what is assets", undefined, undefined, false);
    assert.ok(proResult);
    assert.ok(proResult.response.includes("CORPORATE ASSETS"));
    assert.ok(proResult.response.includes("Total Assets"));
    assert.ok(proResult.response.includes("Total Liabilities"));

    // ELI10 Mode
    const eli10Result = resolveFinanceIntelligence("what is assets", undefined, undefined, true);
    assert.ok(eli10Result);
    assert.ok(eli10Result.response.includes("LEMONADE STAND"));
  });

  it("resolves 'ebitda' and explains formula and lender covenants", () => {
    const res = resolveFinanceIntelligence("explain ebitda", undefined, undefined, false);
    assert.ok(res);
    assert.ok(res.response.includes("EBITDA"));
    assert.ok(res.followUps.length > 0);
  });

  it("resolves macro repo rate and explains central bank monetary transmission", () => {
    const res = resolveFinanceIntelligence("what is repo rate", undefined, undefined, false);
    assert.ok(res);
    assert.ok(res.response.includes("REPO RATE") || res.response.includes("POLICY"));
  });
});
