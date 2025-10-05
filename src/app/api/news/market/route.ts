// F:\finsight-ai\src\app\api\news\market\route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch market news from NewsAPI
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=stock%20market%20OR%20trading%20OR%20finance&sortBy=publishedAt&pageSize=${limit}&apiKey=${process.env.NEWS_API_KEY}`
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data.articles);
    }

    // Fallback to mock data
    const mockNews = [
      {
        title: "Stock Market Rallies on Positive Economic Data",
        description: "Major indices climbed as investors reacted positively to latest economic indicators.",
        url: "https://example.com/news1",
        publishedAt: new Date().toISOString(),
        source: { name: "Financial Times" }
      },
      // Add more mock news items...
    ];

    return NextResponse.json(mockNews);
  } catch (error) {
    console.error('Error fetching market news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}