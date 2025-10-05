// F:\finsight-ai\src\app\api\ai\fraud\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AiService } from '@/lib/ai-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Fetch trading data for the symbol
    const stockResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/stocks/${symbol}`);
    
    if (!stockResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 400 });
    }

    const stockData = await stockResponse.json();

    // Create mock trading data for demonstration
    // In a real implementation, you would fetch actual trading data
    const tradingData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      
      return {
        date: date.toISOString().split('T')[0],
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        price: stockData.price * (0.95 + Math.random() * 0.1),
        trades: Math.floor(Math.random() * 10000) + 1000
      };
    });

    // Detect fraud
    const fraudAlerts = await AiService.detectFraud(tradingData, symbol);

    return NextResponse.json(fraudAlerts);
  } catch (error) {
    console.error('Fraud detection error:', error);
    return NextResponse.json({ error: 'Failed to detect fraud' }, { status: 500 });
  }
}