// F:\finsight-ai\src\app\api\ai\sentiment\route.ts
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
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Analyze social media sentiment
    const sentiment = await AiService.analyzeSocialMediaSentiment(symbol);

    return NextResponse.json(sentiment);
  } catch (error) {
    console.error('Social media sentiment analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze social media sentiment' }, { status: 500 });
  }
}