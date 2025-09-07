import { NextRequest, NextResponse } from 'next/server';

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

    // Using Yahoo Finance search (unofficial)
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=10&newsCount=0`,
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
    const quotes = data.quotes || [];

    const formattedResults = quotes.slice(0, 10).map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.longname || quote.shortname,
      type: quote.quoteType || 'EQUITY',
      region: quote.region || 'US',
      currency: 'USD',
      exchange: quote.exchange
    }));

    return NextResponse.json(formattedResults);

  } catch (error) {
    console.error('Yahoo Search Error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}