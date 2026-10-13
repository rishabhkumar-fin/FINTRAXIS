import { NextResponse } from "next/server";
import { SEED_COMPANIES } from "@/lib/seedData";

export interface NormalizedMarketSearchItem {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  country: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Direct Yahoo Finance Search Proxy
    const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      query
    )}&quotesCount=12&newsCount=0&enableFuzzyQuery=true`;

    let results: NormalizedMarketSearchItem[] = [];

    try {
      const response = await fetch(yahooUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
        next: { revalidate: 30 },
      });

      if (response.ok) {
        const json = await response.json();
        const quotes = json.quotes || [];

        results = quotes
          .filter((q: { isYahooFinance?: boolean; quoteType?: string }) =>
            ["EQUITY", "ETF", "INDEX"].includes(q.quoteType || "")
          )
          .map((q: { symbol: string; shortname?: string; longname?: string; exchange?: string; quoteType?: string }) => {
            const sym = q.symbol || "";
            let country = "US";
            if (sym.endsWith(".NS") || sym.endsWith(".BO")) country = "IN";
            else if (sym.endsWith(".T")) country = "JP";
            else if (sym.endsWith(".L")) country = "UK";
            else if (sym.endsWith(".AS") || sym.endsWith(".PA") || sym.endsWith(".DE")) country = "EU";

            return {
              symbol: sym,
              name: q.shortname || q.longname || sym,
              exchange: q.exchange || "GLOBAL",
              type: q.quoteType || "EQUITY",
              country,
            };
          });
      }
    } catch (fetchErr) {
      console.warn("Yahoo market search fetch failed, falling back to local master:", fetchErr);
    }

    // If Yahoo search returned 0 or failed, fallback to local seed matches
    if (results.length === 0) {
      const qLower = query.toLowerCase();
      results = SEED_COMPANIES.filter(
        (c) =>
          c.symbol.toLowerCase().includes(qLower) ||
          c.name.toLowerCase().includes(qLower)
      ).map((c) => ({
        symbol: c.symbol,
        name: c.name,
        exchange: c.exchange,
        type: "EQUITY",
        country: c.country,
      }));
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("GET /api/market/search failure:", error);
    return NextResponse.json(
      { success: false, error: "Market search resolution failed" },
      { status: 500 }
    );
  }
}
