// F:\finsight-ai\src\app\api\ai\prediction\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AiService } from '@/lib/ai-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe') || '1w';

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Fetch historical data for the symbol
    const chartResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stocks/${symbol}/chart`);
    
    if (!chartResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 400 });
    }

    const historicalData = await chartResponse.json();

    // Predict stock price
    const prediction = await AiService.predictStockPrice(historicalData, symbol, timeframe);

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Stock price prediction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to predict stock price',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}