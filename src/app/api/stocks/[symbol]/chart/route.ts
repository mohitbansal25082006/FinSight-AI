import { NextRequest, NextResponse } from 'next/server';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || 'daily';

    if (!ALPHA_VANTAGE_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    let apiFunction = 'TIME_SERIES_DAILY';
    if (interval === 'weekly') apiFunction = 'TIME_SERIES_WEEKLY';
    if (interval === 'monthly') apiFunction = 'TIME_SERIES_MONTHLY';

    const response = await fetch(
      `${BASE_URL}?function=${apiFunction}&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch chart data');
    }

    const data = await response.json();

    if (data['Error Message'] || data['Note']) {
      return NextResponse.json(
        { error: 'Invalid symbol or API limit reached' },
        { status: 400 }
      );
    }

    let timeSeriesKey = 'Time Series (Daily)';
    if (interval === 'weekly') timeSeriesKey = 'Weekly Time Series';
    if (interval === 'monthly') timeSeriesKey = 'Monthly Time Series';

    const timeSeries = data[timeSeriesKey];
    
    if (!timeSeries) {
      return NextResponse.json(
        { error: 'No chart data found' },
        { status: 404 }
      );
    }

    // Convert to chart-friendly format
    const chartData = Object.entries(timeSeries)
      .slice(0, 30) // Last 30 data points
      .reverse()
      .map(([date, values]: [string, any]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      }));

    return NextResponse.json(chartData);

  } catch (error) {
    console.error('Chart API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}