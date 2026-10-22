import { NextResponse } from "next/server";
import { SEED_COMPANIES } from "@/lib/seedData";
import { INSTITUTIONAL_COMPANIES } from "@/lib/institutionalDatabase";
import { resolveMarketQuote } from "@/lib/finance/quoteResolver";
import type { StandardMarketQuote } from "@/lib/finance/types";
import type { CompanyEntity } from "@/lib/types";

export interface NormalizedMarketQuote extends StandardMarketQuote {
  regularMarketPrice: number;
  timestamp: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const cleanTicker = decodeURIComponent(ticker).trim().toUpperCase();

    // Find known company metadata
    const seed =
      INSTITUTIONAL_COMPANIES[cleanTicker]?.company ||
      SEED_COMPANIES.find((c) => c.symbol === cleanTicker || c.id === cleanTicker);

    const companyPlaceholder: CompanyEntity = seed || {
      id: cleanTicker,
      symbol: cleanTicker,
      name: cleanTicker,
      exchange: cleanTicker.endsWith(".NS") || cleanTicker.endsWith(".BO") ? "NSE / BSE" : "NASDAQ",
      country: cleanTicker.endsWith(".NS") || cleanTicker.endsWith(".BO") ? "IND" : "USA",
      currency: cleanTicker.endsWith(".NS") || cleanTicker.endsWith(".BO") ? "INR" : "USD",
      scaleUnit: cleanTicker.endsWith(".NS") || cleanTicker.endsWith(".BO") ? "Crores" : "Millions",
      sector: "General",
      industry: "General",
      fiscalYearEnd: "March",
      accountingStandard: cleanTicker.endsWith(".NS") ? "Ind AS" : "US-GAAP",
      fxRateToUsd: cleanTicker.endsWith(".NS") ? 0.0119 : 1.0,
      fxTimestamp: "Anchor USD",
      sharePrice: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      cleanTicker
    )}?interval=1d&range=1mo`;

    try {
      const response = await fetch(yahooUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
        next: { revalidate: 15 },
      });

      if (response.ok) {
        const json = await response.json();
        const meta = json.chart?.result?.[0]?.meta;

        if (meta && typeof meta.regularMarketPrice === "number" && meta.regularMarketPrice > 0) {
          const resolved = resolveMarketQuote(companyPlaceholder, {
            regularMarketPrice: meta.regularMarketPrice,
            fulldayChange: meta.fulldayChange,
            fulldayChangePercent: meta.fulldayChangePercent,
            previousClose: meta.previousClose,
            regularMarketDayLow: meta.regularMarketDayLow,
            regularMarketDayHigh: meta.regularMarketDayHigh,
            fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
            exchangeName: meta.fullExchangeName || meta.exchangeName,
            currency: meta.currency,
            timestamp: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
            isLiveFeed: false, // Honest labeling: 15m delayed exchange quote
          });

          const payload: NormalizedMarketQuote = {
            ...resolved,
            regularMarketPrice: resolved.price,
            timestamp: resolved.asOf,
          };

          return NextResponse.json({ success: true, data: payload });
        }
      }
    } catch (fetchErr) {
      console.warn(`Upstream quote fetch for ${cleanTicker} failed, using reference quote:`, fetchErr);
    }

    // Fallback: Honest Reference Quote
    const referenceQuote = resolveMarketQuote(companyPlaceholder, null);
    const fallbackPayload: NormalizedMarketQuote = {
      ...referenceQuote,
      regularMarketPrice: referenceQuote.price,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: fallbackPayload });
  } catch (error) {
    console.error("GET /api/market/quote/[ticker] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate market quote" },
      { status: 500 }
    );
  }
}
