import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
  displaySymbol: string | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(obj: Record<string, unknown>, key: string, fallback = ''): string {
  const v = obj[key];
  return typeof v === 'string' ? v : fallback;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 1) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    if (!FINNHUB_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log('🔍 Searching for:', query);

    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FinSight-AI/1.0)',
        },
      }
    );

    if (!response.ok) {
      console.error('❌ API Response not OK:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    console.log('📊 Raw API Response:', data);

    const resultsRaw = Array.isArray(data.result) ? (data.result as unknown[]) : [];

    const formattedResults = resultsRaw
      .map((item) => {
        if (!isObject(item)) return null;

        const symbol = getString(item, 'symbol');
        if (!symbol) return null; // symbol is required

        const description = getString(item, 'description');
        const type = getString(item, 'type', 'Common Stock');
        const displaySymbol = getString(item, 'displaySymbol', symbol);

        const result: SearchResult = {
          symbol,
          name: description || symbol,
          type,
          region: 'US',
          currency: 'USD',
          displaySymbol: displaySymbol || null,
        };

        return result;
      })
      .filter((r): r is SearchResult => r !== null)
      .slice(0, 10);

    console.log('✅ Formatted results:', formattedResults.length);
    return NextResponse.json(formattedResults);
  } catch (error: unknown) {
    console.error('❌ Search API Error:', error);
    return NextResponse.json({ error: 'Failed to search stocks' }, { status: 500 });
  }
}
