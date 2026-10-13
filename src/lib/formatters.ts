/**
 * Institutional formatting utilities for client and server.
 * Pure TypeScript, zero native or Node.js dependencies.
 */

export function formatFinancialValue(
  value: number | null | undefined,
  currency: string = "USD",
  scaleUnit: string = "Millions"
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/D";
  }

  const symbolMap: Record<string, string> = {
    USD: "$",
    INR: "₹",
    JPY: "¥",
  };

  const currSymbol = symbolMap[currency] || currency;

  if (scaleUnit === "Crores") {
    return `${currSymbol}${value.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} Cr`;
  }

  if (scaleUnit === "Billions") {
    return `${currSymbol}${value.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} B`;
  }

  // Default Millions
  return `${currSymbol}${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} M`;
}

export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "N/D";
  return `${value.toFixed(2)}x`;
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "N/D";
  return `${value.toFixed(2)}%`;
}
