import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface AiInsight {
  symbol: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  prediction: string;
  keyPoints: string[];
}

type CompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function toNumber(value: unknown): number | undefined {
  if (isNumber(value)) return value as number;
  if (isString(value)) {
    const parsed = Number(value as string);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isSentiment(value: unknown): value is 'positive' | 'negative' | 'neutral' {
  return value === 'positive' || value === 'negative' || value === 'neutral';
}

export class AiService {
  /**
   * Summarize an array of news-like objects (loose shape) into an AiInsight.
   * Accepts `Array<Record<string, unknown>>` so callers can pass different article shapes
   * (e.g. third-party API objects) without using `any`.
   */
  static async summarizeNews(
    newsArticles: Array<Record<string, unknown>>,
    symbol: string
  ): Promise<AiInsight> {
    try {
      const newsText = newsArticles
        .slice(0, 5)
        .map((article) => {
          const headline = isString((article as Record<string, unknown>).headline)
            ? (article as Record<string, unknown>).headline as string
            : isString((article as Record<string, unknown>).title)
            ? (article as Record<string, unknown>).title as string
            : 'Untitled';

          const summary = isString((article as Record<string, unknown>).summary)
            ? (article as Record<string, unknown>).summary as string
            : isString((article as Record<string, unknown>).description)
            ? (article as Record<string, unknown>).description as string
            : '';

          return `${headline}: ${summary}`;
        })
        .join('\n\n');

      const prompt = `Analyze the following financial news about ${symbol} and provide insights:\n\n${newsText}\n\nPlease provide a JSON response with:\n1. A concise summary (max 200 words)\n2. Overall sentiment (positive, negative, or neutral)\n3. Confidence score (0-1)\n4. A brief prediction about the stock's direction\n5. 3-5 key points that investors should know\n\nFormat your response as valid JSON:\n{\n  "summary": "...",\n  "sentiment": "positive|negative|neutral",\n  "confidence": 0.8,\n  "prediction": "...",\n  "keyPoints": ["point1", "point2", "point3"]\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a financial analyst AI that provides concise, accurate market insights. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;

      const summary = isString(parsed.summary) ? parsed.summary : `Analysis incomplete for ${symbol}`;
      const sentiment = isSentiment(parsed.sentiment) ? parsed.sentiment : 'neutral';
      const confidence = isNumber(parsed.confidence) ? parsed.confidence : (typeof parsed.confidence === 'string' ? Number(parsed.confidence) || 0.5 : 0.5);
      const prediction = isString(parsed.prediction) ? parsed.prediction : 'No prediction provided.';
      const keyPoints = isStringArray(parsed.keyPoints) ? parsed.keyPoints : (isString(parsed.keyPoints) ? [parsed.keyPoints] : ['No key points provided.']);

      return {
        symbol,
        summary,
        sentiment,
        confidence,
        prediction,
        keyPoints,
      };
    } catch (error) {
      console.error('AI summarization error:', error);
      return {
        symbol,
        summary: `Analysis unavailable for ${symbol}. Please try again later.`,
        sentiment: 'neutral',
        confidence: 0.5,
        prediction: 'Market direction uncertain due to analysis limitations.',
        keyPoints: ['Analysis temporarily unavailable'],
      };
    }
  }

  /**
   * Generate a short market prediction. Accepts a loose `Record<string, unknown>` instead of `any`.
   */
  static async generateMarketPrediction(
    stockData: Record<string, unknown>,
    symbol: string
  ): Promise<string> {
    try {
      const price = toNumber(stockData.price) ?? toNumber(stockData.currentPrice) ?? 0;
      const changePercent = toNumber(stockData.changePercent) ?? toNumber(stockData.change) ?? 0;
      const volume = toNumber(stockData.volume) ?? undefined;
      const high = toNumber(stockData.high) ?? undefined;
      const low = toNumber(stockData.low) ?? undefined;

      const prompt = `Based on the following stock data for ${symbol}, provide a brief market prediction:\n\nCurrent Price: $${price}\nChange: ${changePercent}%\nVolume: ${typeof volume === 'number' ? volume : 'N/A'}\n52-Week High: $${typeof high === 'number' ? high : 'N/A'}\n52-Week Low: $${typeof low === 'number' ? low : 'N/A'}\n\nProvide a 1-2 sentence prediction about the stock's short-term direction (next 1-2 weeks). Keep it professional and mention that this is not financial advice.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              "You are a financial analyst providing brief, professional market predictions. Always include a disclaimer about not being financial advice.",
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200,
        temperature: 0.4,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        return `Technical analysis suggests ${symbol} may continue current trend. This is not financial advice.`;
      }

      return raw;
    } catch (error) {
      console.error('Prediction generation error:', error);
      return `Market prediction unavailable for ${symbol}. This is not financial advice.`;
    }
  }
}
