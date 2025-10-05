// F:\finsight-ai\src\app\api\ai\patterns\route.ts
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

    // Fetch chart data for the symbol
    const chartResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/stocks/${symbol}/chart`);
    
    if (!chartResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 400 });
    }

    const chartData = await chartResponse.json();

    // Recognize patterns
    const patterns = await AiService.recognizePatterns(chartData, symbol);

    return NextResponse.json(patterns);
  } catch (error) {
    console.error('Pattern recognition error:', error);
    return NextResponse.json({ error: 'Failed to recognize patterns' }, { status: 500 });
  }
}