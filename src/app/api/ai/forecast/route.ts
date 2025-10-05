// F:\finsight-ai\src\app\api\ai\forecast\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AiService } from '@/lib/ai-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '1m';

    // Fetch market data
    // In a real implementation, you would fetch actual market data
    const marketData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      
      return {
        date: date.toISOString().split('T')[0],
        sp500: 4000 + Math.random() * 500,
        nasdaq: 12000 + Math.random() * 1500,
        dow: 32000 + Math.random() * 2000,
        vix: 15 + Math.random() * 10
      };
    });

    // Generate market trend forecast
    const forecast = await AiService.generateMarketTrendForecast(marketData, timeframe);

    return NextResponse.json(forecast);
  } catch (error) {
    console.error('Market trend forecast error:', error);
    return NextResponse.json({ error: 'Failed to generate market trend forecast' }, { status: 500 });
  }
}