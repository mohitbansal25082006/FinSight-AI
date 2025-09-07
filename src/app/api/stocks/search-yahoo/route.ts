import { NextRequest, NextResponse } from 'next/server';

interface YahooQuote {
  symbol?: string;
  longname?: string;
  shortname?: string;
  quoteType?: string;
  region?: string;
  exchange?: string;
  currency?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 1) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Using Yahoo Finance search (unofficial)
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        query
      )}&lang=en-US&region=US&quotesCount=10&newsCount=0`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FinSight-AI/1.0)',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();

    // Ensure data is an object and quotes is an array
    const quotesRaw = isObject(data) && Array.isArray((data as Record<string, unknown>).quotes)
      ? ((data as Record<string, unknown>).quotes as unknown[])
      : [];

    const formattedResults = quotesRaw
      .map((q): YahooQuote | null => {
        if (!isObject(q)) return null;
        const symbol = typeof q['symbol'] === 'string' ? (q['symbol'] as string) : undefined;
        if (!symbol) return null; // symbol is required for our result

        const longname = typeof q['longname'] === 'string' ? (q['longname'] as string) : undefined;
        const shortname = typeof q['shortname'] === 'string' ? (q['shortname'] as string) : undefined;
        const quoteType = typeof q['quoteType'] === 'string' ? (q['quoteType'] as string) : undefined;
        const region = typeof q['region'] === 'string' ? (q['region'] as string) : undefined;
        const exchange = typeof q['exchange'] === 'string' ? (q['exchange'] as string) : undefined;
        const currency = typeof q['currency'] === 'string' ? (q['currency'] as string) : 'USD';

        return {
          symbol,
          longname,
          shortname,
          quoteType,
          region,
          exchange,
          currency,
        };
      })
      .filter((r): r is YahooQuote => r !== null)
      .slice(0, 10)
      .map((quote) => ({
        symbol: quote.symbol!,
        name: quote.longname || quote.shortname || quote.symbol,
        type: quote.quoteType || 'EQUITY',
        region: quote.region || 'US',
        currency: quote.currency || 'USD',
        exchange: quote.exchange || null,
      }));

    return NextResponse.json(formattedResults);
  } catch (error: unknown) {
    console.error('Yahoo Search Error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
