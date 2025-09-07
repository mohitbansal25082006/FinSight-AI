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

export class AiService {
  static async summarizeNews(newsArticles: any[], symbol: string): Promise<AiInsight> {
    try {
      const newsText = newsArticles
        .slice(0, 5) // Limit to 5 articles to stay within token limits
        .map(article => `${article.headline || article.title}: ${article.summary || ''}`)
        .join('\n\n');

      const prompt = `
        Analyze the following financial news about ${symbol} and provide insights:
        News Articles:
        ${newsText}
        
        Please provide a JSON response with:
        1. A concise summary (max 200 words)
        2. Overall sentiment (positive, negative, or neutral)
        3. Confidence score (0-1)
        4. A brief prediction about the stock's direction
        5. 3-5 key points that investors should know
        
        Format your response as valid JSON:
        {
          "summary": "...",
          "sentiment": "positive|negative|neutral",
          "confidence": 0.8,
          "prediction": "...",
          "keyPoints": ["point1", "point2", "point3"]
        }
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a financial analyst AI that provides concise, accurate market insights. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI');
      }
      
      const aiInsight = JSON.parse(response);
      
      return {
        symbol,
        summary: aiInsight.summary,
        sentiment: aiInsight.sentiment,
        confidence: aiInsight.confidence,
        prediction: aiInsight.prediction,
        keyPoints: aiInsight.keyPoints,
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

  static async generateMarketPrediction(stockData: any, symbol: string): Promise<string> {
    try {
      const prompt = `
        Based on the following stock data for ${symbol}, provide a brief market prediction:
        
        Current Price: $${stockData.price}
        Change: ${stockData.changePercent}%
        Volume: ${stockData.volume}
        52-Week High: $${stockData.high}
        52-Week Low: $${stockData.low}
        
        Provide a 1-2 sentence prediction about the stock's short-term direction (next 1-2 weeks).
        Keep it professional and mention that this is not financial advice.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a financial analyst providing brief, professional market predictions. Always include a disclaimer about not being financial advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.4,
      });

      return completion.choices[0]?.message?.content || 
        `Technical analysis suggests ${symbol} may continue current trend. This is not financial advice.`;
    } catch (error) {
      console.error('Prediction generation error:', error);
      return `Market prediction unavailable for ${symbol}. This is not financial advice.`;
    }
  }
}