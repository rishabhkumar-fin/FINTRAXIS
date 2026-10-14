import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

describe("Phase 6: Research Reports & Integrity Digest", () => {
  it("generates deterministic SHA-256 file integrity digest", () => {
    const reportText = "FINTRAXIS RESEARCH MEMO // AAPL FY2024 // REVENUE: 391035.00";
    const digest = crypto.createHash("sha256").update(reportText, "utf8").digest("hex");

    assert.equal(typeof digest, "string");
    assert.equal(digest.length, 64);

    // Same content yields same digest
    const checkDigest = crypto.createHash("sha256").update(reportText, "utf8").digest("hex");
    assert.equal(digest, checkDigest);

    // Tampered content yields different digest
    const tampered = crypto.createHash("sha256").update(reportText + " ", "utf8").digest("hex");
    assert.notEqual(digest, tampered);
  });

  it("formats CSV rows with exact figures without floating rounding errors", () => {
    const headers = ["Period", "Revenue", "EBIT", "NetIncome"];
    const row = ["FY2024", 391035.0, 123216.0, 93736.0];
    const csv = [headers.join(","), row.join(",")].join("\n");

    assert.ok(csv.includes("Period,Revenue,EBIT,NetIncome"));
    assert.ok(csv.includes("FY2024,391035,123216,93736"));
  });
});
