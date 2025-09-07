import { NextRequest, NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Helper function: fetch with timeout, retries, and exponential backoff
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 15000, // 15s timeout
  retries = 3,
  backoff = 500 // initial backoff in ms
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });

    if (!response.ok) {
      if (retries > 0) {
        console.warn(`⚠️ Fetch failed (status ${response.status}), retrying in ${backoff}ms...`);
        await new Promise(res => setTimeout(res, backoff));
        return fetchWithTimeout(url, options, timeout, retries - 1, backoff * 2);
      } else {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
    }

    return response;
  } catch (err) {
    if (retries > 0) {
      console.warn(`⚠️ Fetch error, retrying in ${backoff}ms...`, err);
      await new Promise(res => setTimeout(res, backoff));
      return fetchWithTimeout(url, options, timeout, retries - 1, backoff * 2);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

// Safely extract numbers
function getNumber(obj: Record<string, unknown>, key: string, fallback = 0): number {
  const v = obj[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

// Safely extract strings
function getString(obj: Record<string, unknown>, key: string, fallback = ""): string {
  const v = obj[key];
  return typeof v === "string" ? v : fallback;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> }
): Promise<NextResponse> {
  try {
    const { symbol } = await context.params;

    if (!FINNHUB_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    console.log("📊 Fetching data for:", symbol);

    // Fetch quote
    const quoteResponse = await fetchWithTimeout(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );

    const quoteData = (await quoteResponse.json()) as Record<string, unknown>;
    console.log("📈 Quote data:", quoteData);

    // Fetch company profile
    let profileData: Record<string, unknown> = {};
    try {
      const profileResponse = await fetchWithTimeout(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
      );
      if (profileResponse.ok) {
        profileData = (await profileResponse.json()) as Record<string, unknown>;
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch profile data, continuing without it:", err);
    }

    const currentPrice = getNumber(quoteData, "c", NaN);
    if (Number.isNaN(currentPrice)) {
      return NextResponse.json({ error: "No data found for symbol" }, { status: 404 });
    }

    const stockData = {
      symbol: symbol.toUpperCase(),
      price: getNumber(quoteData, "c", 0),
      change: getNumber(quoteData, "d", 0),
      changePercent: getNumber(quoteData, "dp", 0).toFixed(2),
      volume: 0,
      previousClose: getNumber(quoteData, "pc", 0),
      open: getNumber(quoteData, "o", 0),
      high: getNumber(quoteData, "h", 0),
      low: getNumber(quoteData, "l", 0),
      lastUpdated: new Date().toISOString().split("T")[0],
      companyName: getString(profileData, "name", symbol),
    };

    console.log("✅ Formatted stock data:", stockData);
    return NextResponse.json(stockData);
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    if (e.name === "AbortError") {
      console.error("⏳ Request to Finnhub timed out");
      return NextResponse.json({ error: "Stock API request timed out" }, { status: 504 });
    }

    console.error("❌ Stock API Error:", err);
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
  }
}
