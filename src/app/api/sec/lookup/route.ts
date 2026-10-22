import { NextResponse } from "next/server";

// In-memory short cache for SEC responses (TTL: 60 seconds)
const cache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL_MS = 60000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker")?.trim().toUpperCase();

    const userAgent = process.env.SEC_EDGAR_USER_AGENT;
    if (!userAgent) {
      return NextResponse.json({
        enabled: false,
        source: "SEC_EDGAR_LOOKUP",
        message:
          "SEC EDGAR live lookup requires an environment variable 'SEC_EDGAR_USER_AGENT' (format: 'SampleApp admin@domain.com') per SEC fair-access policy. Live queries are currently disabled. Please analyze pre-verified issuers or upload disclosures via Admin Ingest.",
      });
    }

    if (!ticker) {
      return NextResponse.json(
        { error: "Query parameter 'ticker' is required." },
        { status: 400 }
      );
    }

    // Check cache
    const cached = cache.get(ticker);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        enabled: true,
        cached: true,
        source: "SEC_EDGAR_LOOKUP",
        badge: "Fetched from SEC EDGAR, not reviewed",
        data: cached.data,
      });
    }

    // AbortController with 4000ms timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      // Query SEC company facts API
      const secUrl = `https://data.sec.gov/submissions/CIK${ticker.padStart(10, "0")}.json`;
      const response = await fetch(secUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
        },
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        return NextResponse.json({
          enabled: true,
          status: "RATE_LIMITED",
          badge: "Fetched from SEC EDGAR, not reviewed",
          message: "SEC EDGAR fair access rate limit reached (HTTP 429). Falling back to stored company records.",
        });
      }

      if (response.status === 403) {
        return NextResponse.json({
          enabled: true,
          status: "FORBIDDEN",
          badge: "Fetched from SEC EDGAR, not reviewed",
          message: "SEC EDGAR rejected request (HTTP 403). Check SEC_EDGAR_USER_AGENT header syntax.",
        });
      }

      if (!response.ok) {
        return NextResponse.json({
          enabled: true,
          status: "NOT_FOUND",
          badge: "Fetched from SEC EDGAR, not reviewed",
          message: `SEC EDGAR returned status ${response.status} for ${ticker}. Check CIK number or ticker.`,
        });
      }

      const json = await response.json();
      cache.set(ticker, { timestamp: Date.now(), data: json });

      return NextResponse.json({
        enabled: true,
        cached: false,
        source: "SEC_EDGAR_LOOKUP",
        badge: "Fetched from SEC EDGAR, not reviewed",
        data: json,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeout);
      const isAbort = fetchErr instanceof Error && fetchErr.name === "AbortError";
      return NextResponse.json({
        enabled: true,
        status: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
        badge: "Fetched from SEC EDGAR, not reviewed",
        message: isAbort
          ? "SEC EDGAR lookup timed out (>4000ms). Falling back to local SQLite master."
          : "Failed to connect to SEC EDGAR. Falling back to local SQLite master.",
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal SEC lookup error", details: errorMsg },
      { status: 500 }
    );
  }
}
