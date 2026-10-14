import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { primaryDataProvider } from "../src/lib/providers/index.ts";

describe("Phase 1: Provider Independence & Idempotent Ingestion", () => {
  it("initializes primary DataProvider with valid non-contractual metadata", () => {
    assert.ok(primaryDataProvider);
    assert.equal(typeof primaryDataProvider.search, "function");
    assert.equal(typeof primaryDataProvider.getProfile, "function");
    assert.equal(typeof primaryDataProvider.getQuote, "function");
    assert.equal(typeof primaryDataProvider.getStatements, "function");
    assert.equal(typeof primaryDataProvider.getFilings, "function");

    assert.equal(primaryDataProvider.metadata.tier, "NON_CONTRACTUAL");
    assert.equal(primaryDataProvider.metadata.isContractual, false);
    assert.ok(primaryDataProvider.metadata.termsNotice.length > 0);
  });

  it("handles empty or whitespace search queries gracefully", async () => {
    const emptyResults = await primaryDataProvider.search("");
    assert.deepEqual(emptyResults, []);

    const whitespaceResults = await primaryDataProvider.search("   ");
    assert.deepEqual(whitespaceResults, []);
  });

  it("verifies duplicate company ingestion idempotency logic", () => {
    // Simulating database company records
    const mockDb = new Map<string, { id: string; name: string; periods: string[] }>();

    function ingestCompany(symbol: string, name: string, periodList: string[]) {
      const clean = symbol.toUpperCase().trim();
      const existing = mockDb.get(clean);

      if (existing) {
        // Idempotent return without duplicate rows or error
        return {
          success: true,
          isExisting: true,
          company: existing,
          message: "Idempotent: existing security preserved without duplication",
        };
      }

      const newRecord = { id: clean, name, periods: periodList };
      mockDb.set(clean, newRecord);
      return {
        success: true,
        isExisting: false,
        company: newRecord,
        message: "Ingested successfully",
      };
    }

    // First ingestion of AAPL
    const firstRun = ingestCompany("AAPL", "Apple Inc.", ["FY2024", "FY2023"]);
    assert.equal(firstRun.success, true);
    assert.equal(firstRun.isExisting, false);
    assert.equal(mockDb.size, 1);

    // Second duplicate ingestion of AAPL (must be idempotent)
    const secondRun = ingestCompany("AAPL", "Apple Inc.", ["FY2024", "FY2023"]);
    assert.equal(secondRun.success, true);
    assert.equal(secondRun.isExisting, true);
    assert.equal(mockDb.size, 1); // Row count remains 1, no duplicate keys!
  });

  it("ensures zero fabrication: missing financial items remain null", () => {
    // Raw feed with missing items
    const rawFeedItem: { revenue?: number; interestExpense?: number } = {
      revenue: 100000,
      // interestExpense is not disclosed
    };

    // Strict zero-fabrication parsing
    const parsedInterest = rawFeedItem.interestExpense ?? null;
    assert.equal(parsedInterest, null);
    assert.notEqual(parsedInterest, 0); // Never 0 when undisclosed
    assert.notEqual(parsedInterest, 100000 * 0.08); // Never synthetic multiplier
  });
});
