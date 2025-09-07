import { NextRequest, NextResponse } from 'next/server';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'tesla';

  console.log('🔍 DEBUG: Search query:', query);
  console.log('🔍 DEBUG: API Key exists:', !!ALPHA_VANTAGE_API_KEY);

  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    console.log('🔍 DEBUG: Full URL:', url);

    const response = await fetch(url);
    const data = await response.json();

    console.log('🔍 DEBUG: Raw API Response:', JSON.stringify(data, null, 2));

    return NextResponse.json({
      debug: true,
      query,
      hasApiKey: !!ALPHA_VANTAGE_API_KEY,
      responseStatus: response.status,
      rawData: data
    });
  } catch (error) {
    console.error('🔍 DEBUG: Error:', error);
    return NextResponse.json({ error: 'Debug failed', details: error });
  }
}