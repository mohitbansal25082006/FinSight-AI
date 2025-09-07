import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AiService } from '@/lib/ai-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }
    
    // Check if we have recent insights (less than 4 hours old)
    const existingInsight = await prisma.aiInsight.findFirst({
      where: {
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
        createdAt: {
          gte: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    if (existingInsight) {
      return NextResponse.json(existingInsight);
    }
    
    // Generate new AI insight
    try {
      // Fetch recent news for the symbol
      const newsResponse = await fetch(
        `${process.env.NEXTAUTH_URL}/api/news/${symbol}`
      );
      const newsData = await newsResponse.json();
      
      if (newsData.news && newsData.news.length > 0) {
        const aiInsight = await AiService.summarizeNews(newsData.news, symbol);
        
        // Save to database
        const savedInsight = await prisma.aiInsight.create({
          data: {
            userId: session.user.id,
            symbol: symbol.toUpperCase(),
            title: `AI Analysis for ${symbol.toUpperCase()}`,
            summary: aiInsight.summary,
            sentiment: aiInsight.sentiment,
            confidence: aiInsight.confidence,
            category: 'analysis',
          },
        });
        
        return NextResponse.json(savedInsight);
      } else {
        // No news available, create a basic insight
        const basicInsight = await prisma.aiInsight.create({
          data: {
            userId: session.user.id,
            symbol: symbol.toUpperCase(),
            title: `Analysis for ${symbol.toUpperCase()}`,
            summary: `Limited news data available for ${symbol.toUpperCase()}. Monitor for updates on earnings, product launches, or market developments that could impact price movements.`,
            sentiment: 'neutral',
            confidence: 0.3,
            category: 'analysis',
          },
        });
        
        return NextResponse.json(basicInsight);
      }
    } catch (error) {
      console.error('AI insight generation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate AI insights' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('AI insights API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}