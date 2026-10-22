/**
 * Institutional formatting utilities for client and server.
 * Pure TypeScript, zero native or Node.js dependencies.
 */

export function formatFinancialValue(
  value: number | null | undefined,
  currency: string = "USD",
  scaleUnit: string = "Millions",
  fallback: string = "Unavailable from disclosure"
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }

  const symbolMap: Record<string, string> = {
    USD: "$",
    INR: "₹",
    JPY: "¥",
    GBP: "£",
    EUR: "€",
  };

  const currSymbol = symbolMap[currency] || currency;

  // Single unit (e.g. share prices or unscaled metrics)
  if (
    scaleUnit === "Units" ||
    scaleUnit === "None" ||
    scaleUnit === "Single" ||
    scaleUnit === ""
  ) {
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return `${currSymbol}${value.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const normScale = (scaleUnit || "Millions").trim();

  // Indian financial statements in Crores (1 Crore = 10,000,000)
  if (normScale === "Crores" || normScale === "Crore" || normScale === "Cr") {
    const hasDecimals = Math.abs(value % 1) > 0.001;
    return `${currSymbol}${value.toLocaleString("en-IN", {
      minimumFractionDigits: hasDecimals ? 1 : 0,
      maximumFractionDigits: 2,
    })} Cr`;
  }

  // Indian financial statements in Lakhs (1 Lakh = 100,000)
  if (normScale === "Lakhs" || normScale === "Lakh" || normScale === "L") {
    const hasDecimals = Math.abs(value % 1) > 0.001;
    return `${currSymbol}${value.toLocaleString("en-IN", {
      minimumFractionDigits: hasDecimals ? 1 : 0,
      maximumFractionDigits: 2,
    })} L`;
  }

  // Global statements in Billions
  if (normScale === "Billions" || normScale === "Billion" || normScale === "B") {
    return `${currSymbol}${value.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })} B`;
  }

  // Default Millions (e.g. US SEC Form 10-K reported in millions)
  const hasDecimals = Math.abs(value % 1) > 0.001;
  return `${currSymbol}${value.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimals ? 1 : 0,
    maximumFractionDigits: 2,
  })} M`;
}

export function formatSharePrice(
  price: number | null | undefined,
  currency: string = "USD"
): string {
  return formatFinancialValue(price, currency, "Units");
}

export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "N/D";
  return `${value.toFixed(2)}x`;
}

export function formatNetDebtMultiple(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "N/D";
  if (value <= 0) return `${value.toFixed(2)}x (Net Cash)`;
  return `${value.toFixed(2)}x`;
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "N/D";
  return `${value.toFixed(2)}%`;
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "N/D";
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}
