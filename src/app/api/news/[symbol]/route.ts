import { NextRequest, NextResponse } from 'next/server';
import { AiService } from '@/lib/ai-service';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    // Await the params promise before destructuring
    const resolvedParams = await params;
    const { symbol } = resolvedParams;
    
    if (!FINNHUB_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    
    console.log('📰 Fetching news for:', symbol);
    
    // Get news from Finnhub
    const newsResponse = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${getDateDaysAgo(7)}&to=${getTodayDate()}&token=${FINNHUB_API_KEY}`
    );
    
    if (!newsResponse.ok) {
      throw new Error('Failed to fetch news');
    }
    
    const newsData = await newsResponse.json();
    
    if (!Array.isArray(newsData) || newsData.length === 0) {
      return NextResponse.json([]);
    }
    
    // Format news data
    const formattedNews = newsData.slice(0, 10).map((item: any) => ({
      id: item.id || Date.now() + Math.random(),
      title: item.headline || 'No title',
      summary: item.summary || '',
      url: item.url || '',
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      source: item.source || 'Unknown',
      image: item.image || '',
      category: item.category || 'general',
    }));
    
    // Generate AI insights if we have news
    let aiInsight = null;
    if (formattedNews.length > 0) {
      try {
        aiInsight = await AiService.summarizeNews(newsData, symbol);
      } catch (error) {
        console.error('AI insight generation failed:', error);
      }
    }
    
    return NextResponse.json({
      news: formattedNews,
      aiInsight: aiInsight,
      total: formattedNews.length,
    });
  } catch (error) {
    console.error('❌ News API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}