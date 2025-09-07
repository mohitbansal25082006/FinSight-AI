import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 1) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (!FINNHUB_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
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

    const data = await response.json();
    console.log('📊 Raw API Response:', data);

    // Finnhub returns { count: number, result: [...] }
    const results = data.result || [];
    console.log('✅ Found results:', results.length);

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'No results found for this search term' },
        { status: 404 }
      );
    }

    // Format results for our frontend
    const formattedResults = results.slice(0, 10).map((item: any) => ({
      symbol: item.symbol || '',
      name: item.description || '',
      type: item.type || 'Common Stock',
      region: 'US',
      currency: 'USD',
      displaySymbol: item.displaySymbol || item.symbol
    }));

    console.log('✅ Formatted results:', formattedResults);
    return NextResponse.json(formattedResults);

  } catch (error) {
    console.error('❌ Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    );
  }
}