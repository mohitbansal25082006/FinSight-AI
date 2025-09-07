import { NextRequest, NextResponse } from 'next/server';
import { AiService } from '@/lib/ai-service';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(obj: Record<string, unknown>, key: string, fallback = ''): string {
  const v = obj[key];
  return typeof v === 'string' ? v : fallback;
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse> {
  try {
    const resolved = await params;
    const { symbol } = resolved;

    if (!FINNHUB_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log('📰 Fetching news for:', symbol);

    const newsResponse = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(
        symbol
      )}&from=${getDateDaysAgo(7)}&to=${getTodayDate()}&token=${FINNHUB_API_KEY}`
    );

    if (!newsResponse.ok) {
      throw new Error('Failed to fetch news');
    }

    const raw = (await newsResponse.json()) as unknown;

    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json({ news: [], aiInsight: null, total: 0 });
    }

    const newsArray = raw as unknown[];

    const formattedNews = newsArray.slice(0, 10).map((item) => {
      if (!isObject(item)) {
        return {
          id: String(Date.now() + Math.random()),
          title: 'No title',
          summary: '',
          url: '',
          publishedAt: new Date().toISOString(),
          source: 'Unknown',
          image: '',
          category: 'general',
        };
      }

      const idRaw = item.id ?? item.datetime ?? `${Date.now()}-${Math.random()}`;
      const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : `${Date.now()}-${Math.random()}`;

      const title = getString(item, 'headline') || getString(item, 'title') || 'No title';
      const summary = getString(item, 'summary') || getString(item, 'description') || '';
      const url = getString(item, 'url') || '';

      // Finnhub returns datetime as UNIX seconds; try to coerce
      const dt = getNumber(item, 'datetime') ?? (typeof item['datetime'] === 'string' ? Number(item['datetime']) : undefined);
      const publishedAt = dt ? new Date(dt * 1000).toISOString() : new Date().toISOString();

      const source = getString(item, 'source') || 'Unknown';
      const image = getString(item, 'image') || '';
      const category = getString(item, 'category') || 'general';

      return {
        id,
        title,
        summary,
        url,
        publishedAt,
        source,
        image,
        category,
      };
    });

    let aiInsight = null;
    if (formattedNews.length > 0) {
      try {
        // AiService expects Array<Record<string, unknown>>
        const newsForAi: Array<Record<string, unknown>> = newsArray.slice(0, 10).map((n) => (isObject(n) ? n : {}));
        aiInsight = await AiService.summarizeNews(newsForAi, symbol);
      } catch (err) {
        console.error('AI insight generation failed:', err);
        aiInsight = null;
      }
    }

    return NextResponse.json({ news: formattedNews, aiInsight, total: formattedNews.length });
  } catch (error: unknown) {
    console.error('❌ News API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
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
