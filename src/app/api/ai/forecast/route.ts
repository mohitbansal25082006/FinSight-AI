// F:\finsight-ai\src\app\api\ai\forecast\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AiService } from '@/lib/ai-service';

interface MarketDataPoint {
  date: string;
  sp500: number;
  nasdaq: number;
  dow: number;
  vix: number;
}

interface EnhancedMarketTrendForecast {
  trend: string;
  confidence: number;
  keyIndicators: string[];
  catalysts: string[];
  sectorExpectations: Record<string, string>;
  riskFactors: string[];
  timeframe: string;
  lastUpdated: string;
  technicalAnalysis: {
    trendStrength: number;
    supportLevels: number[];
    resistanceLevels: number[];
    volumeAnalysis: string;
  };
  macroFactors: {
    interestRates: string;
    inflation: string;
    gdpGrowth: string;
    employment: string;
  };
}

// GET handler for retrieving market trend forecast
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const enhanced = searchParams.get('enhanced') === 'true';
    const timeframe = searchParams.get('timeframe') || '1m';
    
    // Generate mock market data for the last 30 days
    const marketData: MarketDataPoint[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic market data with some randomness
      const sp500Base = 4500;
      const nasdaqBase = 14000;
      const dowBase = 35000;
      const vixBase = 15;
      
      marketData.push({
        date: date.toISOString().split('T')[0],
        sp500: sp500Base * (1 + (Math.random() * 0.02 - 0.01)),
        nasdaq: nasdaqBase * (1 + (Math.random() * 0.03 - 0.015)),
        dow: dowBase * (1 + (Math.random() * 0.015 - 0.0075)),
        vix: vixBase * (1 + (Math.random() * 0.5 - 0.25)),
      });
    }
    
    // Convert MarketDataPoint[] to Record<string, unknown>[] for AiService compatibility
    const marketDataAsRecords: Record<string, unknown>[] = marketData.map(point => ({
      date: point.date,
      sp500: point.sp500,
      nasdaq: point.nasdaq,
      dow: point.dow,
      vix: point.vix,
    }));
    
    // Generate enhanced market trend forecast
    const forecast = await AiService.generateMarketTrendForecast(marketDataAsRecords, timeframe, enhanced);
    
    return NextResponse.json(forecast);
  } catch (error) {
    console.error('Market trend forecast error:', error);
    return NextResponse.json(
      { error: 'Error generating forecast' },
      { status: 500 }
    );
  }
}