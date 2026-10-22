import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatFinancialValue,
  formatSharePrice,
  formatRatio,
  formatPct,
  formatCompactNumber,
} from "../src/lib/formatters.ts";

describe("Formatting Conventions & Multi-Currency Standards", () => {
  it("formats Indian Rupee (INR) amounts with Crore and Indian numbering grouping", () => {
    // 900000 Cr in INR => ₹9,00,000.0 Cr
    const formattedCr = formatFinancialValue(900000, "INR", "Cr");
    assert.match(formattedCr, /₹/);
    assert.match(formattedCr, /Cr/);
    // Verifies Indian numbering comma structure (e.g. 9,00,000)
    assert.ok(formattedCr.includes("9,00,000"));
  });

  it("formats Indian Rupee (INR) share prices with en-IN currency convention", () => {
    const formattedPrice = formatSharePrice(2950.4, "INR");
    assert.match(formattedPrice, /₹/);
    assert.ok(formattedPrice.includes("2,950.40"));
  });

  it("formats US Dollar (USD) amounts with Millions scale and US conventions", () => {
    const formattedM = formatFinancialValue(383285, "USD", "M");
    assert.ok(formattedM.includes("$"));
    assert.ok(formattedM.includes("383,285 M"));
  });

  it("handles null or undefined financial disclosures transparently without fabrication", () => {
    const formattedNull = formatFinancialValue(null, "USD", "M");
    assert.equal(formattedNull, "Unavailable from disclosure");

    const formattedUndef = formatFinancialValue(undefined, "INR", "Cr");
    assert.equal(formattedUndef, "Unavailable from disclosure");
  });

  it("formats credit ratios and percentages safely with non-disclosure indicators", () => {
    assert.equal(formatRatio(null), "N/D");
    assert.equal(formatRatio(3.456), "3.46x");
    assert.equal(formatPct(null), "N/D");
    assert.equal(formatPct(24.52), "24.52%");
  });

  it("formats compact representations for charts and badges cleanly", () => {
    assert.equal(formatCompactNumber(null), "N/D");
    assert.equal(formatCompactNumber(1500000), "1.5M");
    assert.equal(formatCompactNumber(2500000000), "2.5B");
  });
});
