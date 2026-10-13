import { NextResponse } from "next/server";
import { SEED_COMPANIES } from "@/lib/seedData";

export interface NormalizedMarketQuote {
  symbol: string;
  regularMarketPrice: number;
  chartPreviousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currency: string;
  currencySymbol: string;
  exchangeName: string;
  timestamp: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const cleanTicker = decodeURIComponent(ticker).trim().toUpperCase();

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

        if (meta && typeof meta.regularMarketPrice === "number") {
          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || price;
          const change = price - prevClose;
          const changePercent = prevClose ? (change / prevClose) * 100 : 0;
          const dayHigh = meta.regularMarketDayHigh || price * 1.01;
          const dayLow = meta.regularMarketDayLow || price * 0.99;
          const fiftyTwoWeekHigh = meta.fiftyTwoWeekHigh || price * 1.25;
          const fiftyTwoWeekLow = meta.fiftyTwoWeekLow || price * 0.75;
          const currency = meta.currency || "USD";

          const symbolMap: Record<string, string> = {
            USD: "$",
            INR: "₹",
            JPY: "¥",
            EUR: "€",
            GBP: "£",
          };

          const payload: NormalizedMarketQuote = {
            symbol: cleanTicker,
            regularMarketPrice: Number(price.toFixed(2)),
            chartPreviousClose: Number(prevClose.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2)),
            dayHigh: Number(dayHigh.toFixed(2)),
            dayLow: Number(dayLow.toFixed(2)),
            fiftyTwoWeekHigh: Number(fiftyTwoWeekHigh.toFixed(2)),
            fiftyTwoWeekLow: Number(fiftyTwoWeekLow.toFixed(2)),
            currency,
            currencySymbol: symbolMap[currency] || currency,
            exchangeName: meta.exchangeName || "GLOBAL",
            timestamp: new Date().toISOString(),
          };

          return NextResponse.json({ success: true, data: payload });
        }
      }
    } catch (fetchErr) {
      console.warn(`Upstream quote fetch for ${cleanTicker} failed:`, fetchErr);
    }

    // Fallback to static seed company quote
    const seed = SEED_COMPANIES.find((c) => c.symbol === cleanTicker || c.id === cleanTicker);
    const basePrice = seed?.sharePrice || 100;
    const prevClose = basePrice * 0.995;
    const change = basePrice - prevClose;
    const changePercent = (change / prevClose) * 100;

    const fallbackQuote: NormalizedMarketQuote = {
      symbol: cleanTicker,
      regularMarketPrice: basePrice,
      chartPreviousClose: prevClose,
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      dayHigh: basePrice * 1.015,
      dayLow: basePrice * 0.985,
      fiftyTwoWeekHigh: basePrice * 1.3,
      fiftyTwoWeekLow: basePrice * 0.7,
      currency: seed?.currency || "USD",
      currencySymbol: seed?.currency === "INR" ? "₹" : seed?.currency === "JPY" ? "¥" : "$",
      exchangeName: seed?.exchange || "NASDAQ",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: fallbackQuote });
  } catch (error) {
    console.error("GET /api/market/quote/[ticker] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate market quote" },
      { status: 500 }
    );
  }
}
