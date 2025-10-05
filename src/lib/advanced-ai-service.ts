// F:\finsight-ai\src\lib\advanced-ai-service.ts
import OpenAI from 'openai';
import { prisma } from './prisma';
import { MarketUtils } from './market-utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  data?: any;
  sources?: any[];
  confidence?: number;
  tokens?: number;
  responseTime?: number;
}

export interface ChatTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface ChatResponse {
  message: string;
  data?: any;
  sources?: any[];
  confidence: number;
  tokens: number;
  responseTime: number;
  followUpQuestions?: string[];
  relatedTopics?: string[];
}

export class AdvancedAIService {
  private static tools: Map<string, ChatTool> = new Map();
  private static knowledgeCache: Map<string, any> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Initialize the AI service with tools
   */
  static async initialize() {
    await this.loadTools();
    await this.loadKnowledgeBase();
  }

  /**
   * Load available tools from database
   */
  private static async loadTools() {
    try {
      const tools = await prisma.chatbotTool.findMany({
        where: { isActive: true }
      });

      for (const tool of tools) {
        // Convert JsonValue to Record<string, any>
        const parameters = tool.parameters as Record<string, any>;
        
        this.tools.set(tool.name, {
          name: tool.name,
          description: tool.description,
          parameters,
          execute: this.createToolExecutor(tool.name)
        });
      }
    } catch (error) {
      console.error('Error loading tools:', error);
    }
  }

  /**
   * Load knowledge base
   */
  private static async loadKnowledgeBase() {
    try {
      const knowledge = await prisma.chatbotKnowledge.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' }
      });

      for (const item of knowledge) {
        this.knowledgeCache.set(item.title, {
          category: item.category,
          content: item.content,
          keywords: item.keywords
        });
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  }

  /**
   * Create tool executor function
   */
  private static createToolExecutor(toolName: string) {
    return async (params: any) => {
      switch (toolName) {
        case 'stock_price':
          return await this.getStockPrice(params.symbol);
        case 'stock_chart':
          return await this.getStockChart(params.symbol, params.timeframe);
        case 'portfolio_analysis':
          return await this.getPortfolioAnalysis(params.userId);
        case 'market_sentiment':
          return await this.getMarketSentiment(params.symbol);
        case 'technical_indicators':
          return await this.getTechnicalIndicators(params.symbol);
        case 'fundamental_analysis':
          return await this.getFundamentalAnalysis(params.symbol);
        case 'market_news':
          return await this.getMarketNews(params.symbol, params.limit);
        case 'stock_comparison':
          return await this.compareStocks(params.symbols);
        case 'market_overview':
          return await this.getMarketOverview();
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    };
  }

  /**
   * Process chat message with advanced capabilities
   */
  static async processMessage(
    userId: string,
    message: string,
    conversationHistory: ChatMessage[] = [],
    context: any = {}
  ): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Analyze user intent and extract entities
      const intentAnalysis = await this.analyzeIntent(message);
      
      // Step 2: Gather relevant data using tools
      const toolResults = await this.executeTools(intentAnalysis.tools, intentAnalysis.entities);
      
      // Step 3: Retrieve relevant knowledge
      const knowledge = await this.retrieveKnowledge(intentAnalysis.keywords);
      
      // Step 4: Generate context-aware response
      const response = await this.generateResponse(
        message,
        conversationHistory,
        intentAnalysis,
        toolResults,
        knowledge,
        context
      );

      const responseTime = Date.now() - startTime;

      return {
        message: response.content,
        data: response.data,
        sources: response.sources,
        confidence: response.confidence || 0.8,
        tokens: response.tokens || 0,
        responseTime,
        followUpQuestions: response.followUpQuestions,
        relatedTopics: response.relatedTopics
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        message: 'I apologize, but I encountered an error while processing your request. Please try again.',
        confidence: 0.1,
        tokens: 0,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze user intent and extract entities
   */
  private static async analyzeIntent(message: string) {
    const prompt = `Analyze the following user message and extract:
1. Primary intent (what the user wants to know)
2. Entities (stock symbols, companies, timeframes, etc.)
3. Required tools to answer the question
4. Keywords for knowledge retrieval

Message: "${message}"

Respond in JSON format:
{
  "intent": "string",
  "entities": {
    "symbols": ["string"],
    "companies": ["string"],
    "timeframes": ["string"],
    "metrics": ["string"]
  },
  "tools": ["string"],
  "keywords": ["string"]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial analyst AI assistant. Analyze user queries and extract structured information.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.1
      });

      const response = completion.choices[0]?.message?.content;
      return response ? JSON.parse(response) : {
        intent: 'general_query',
        entities: {},
        tools: [],
        keywords: []
      };
    } catch (error) {
      console.error('Error analyzing intent:', error);
      return {
        intent: 'general_query',
        entities: {},
        tools: [],
        keywords: []
      };
    }
  }

  /**
   * Execute required tools
   */
  private static async executeTools(tools: string[], entities: any) {
    const results: any = {};

    for (const toolName of tools) {
      const tool = this.tools.get(toolName);
      if (tool) {
        try {
          const params = this.prepareToolParams(toolName, entities);
          results[toolName] = await tool.execute(params);
        } catch (error) {
          console.error(`Error executing tool ${toolName}:`, error);
          results[toolName] = { error: (error as Error).message };
        }
      }
    }

    return results;
  }

  /**
   * Prepare parameters for tool execution
   */
  private static prepareToolParams(toolName: string, entities: any) {
    switch (toolName) {
      case 'stock_price':
      case 'stock_chart':
      case 'market_sentiment':
      case 'technical_indicators':
      case 'fundamental_analysis':
      case 'market_news':
        return { symbol: entities.symbols?.[0] };
      case 'portfolio_analysis':
        return { userId: entities.userId };
      case 'stock_comparison':
        return { symbols: entities.symbols };
      case 'market_overview':
        return {};
      default:
        return {};
    }
  }

  /**
   * Retrieve relevant knowledge
   */
  private static async retrieveKnowledge(keywords: string[]) {
    const relevantKnowledge: any[] = [];

    for (const keyword of keywords) {
      for (const [title, knowledge] of this.knowledgeCache.entries()) {
        if (knowledge.keywords.some((k: string) => 
          k.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(k.toLowerCase())
        )) {
          relevantKnowledge.push({
            title,
            content: knowledge.content,
            category: knowledge.category
          });
        }
      }
    }

    return relevantKnowledge;
  }

  /**
   * Generate context-aware response
   */
  private static async generateResponse(
    message: string,
    history: ChatMessage[],
    intentAnalysis: any,
    toolResults: any,
    knowledge: any[],
    context: any
  ) {
    // Prepare context for the AI
    const systemPrompt = this.createSystemPrompt(intentAnalysis, toolResults, knowledge, context);
    
    // Build conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: 1000,
        temperature: 0.3,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Extract follow-up questions and related topics
      const followUpPrompt = `Based on this response: "${response}", generate 2-3 follow-up questions and 3-5 related topics. Respond in JSON:
{
  "followUpQuestions": ["question1", "question2"],
  "relatedTopics": ["topic1", "topic2", "topic3"]
}`;

      const followUpCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Generate relevant follow-up questions and topics.'
          },
          { role: 'user', content: followUpPrompt }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      const followUpData = followUpCompletion.choices[0]?.message?.content;
      const followUpParsed = followUpData ? JSON.parse(followUpData) : {};

      return {
        content: response,
        data: toolResults,
        sources: knowledge.map(k => ({ title: k.title, category: k.category })),
        confidence: 0.85,
        tokens: completion.usage?.total_tokens || 0,
        followUpQuestions: followUpParsed.followUpQuestions || [],
        relatedTopics: followUpParsed.relatedTopics || []
      };
    } catch (error) {
      console.error('Error generating response:', error);
      return {
        content: 'I apologize, but I encountered an error while generating a response. Please try again.',
        confidence: 0.1,
        tokens: 0
      };
    }
  }

  /**
   * Create system prompt with context
   */
  private static createSystemPrompt(intentAnalysis: any, toolResults: any, knowledge: any[], context: any) {
    const currentDate = new Date().toLocaleDateString();
    const marketStatus = MarketUtils.isMarketOpen() ? 'OPEN' : 'CLOSED';
    
    // Create a properly formatted string without duplicate properties
    const toolResultsStr = JSON.stringify(toolResults, null, 2);
    const knowledgeStr = knowledge.map(k => `- ${k.title}: ${k.content.substring(0, 100)}...`).join('\n');
    
    return `You are FinSight AI, an advanced financial assistant with real-time market data access. Today is ${currentDate} and the market is ${marketStatus}.\n\nCurrent Context:\n- User Intent: ${intentAnalysis.intent}\n- Available Data: ${Object.keys(toolResults).join(', ')}\n- Knowledge Base: ${knowledge.length} relevant articles found\n\nTool Results:\n ${toolResultsStr}\n\nKnowledge Base:\n ${knowledgeStr}\n\nGuidelines:\n1. Provide accurate, data-driven insights\n2. Always cite your sources when using specific data\n3. Include relevant metrics and numbers when available\n4. Be concise but thorough\n5. If data is unavailable, clearly state it\n6. Always include a disclaimer that this is not financial advice\n7. Use markdown formatting for better readability\n8. Include relevant charts or tables when appropriate\n\nRemember: You have access to real-time market data, so provide the most current information available.`;
  }

  // Tool implementations
  private static async getStockPrice(symbol: string) {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/stocks/${symbol}`);
      if (response.ok) {
        const data = await response.json();
        return {
          symbol: data.symbol,
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          volume: data.volume,
          high: data.high,
          low: data.low,
          open: data.open,
          previousClose: data.previousClose,
          lastUpdated: data.lastUpdated
        };
      }
      throw new Error('Failed to fetch stock price');
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  private static async getStockChart(symbol: string, timeframe: string = '1M') {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/stocks/${symbol}/chart?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        return {
          symbol,
          timeframe,
          data: data.slice(-30), // Last 30 data points
          lastUpdated: new Date().toISOString()
        };
      }
      throw new Error('Failed to fetch stock chart');
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  private static async getPortfolioAnalysis(userId: string) {
    try {
      const [portfolioResponse, watchlistResponse] = await Promise.all([
        fetch(`${process.env.NEXTAUTH_URL}/api/portfolio`),
        fetch(`${process.env.NEXTAUTH_URL}/api/watchlist`)
      ]);

      const portfolio = portfolioResponse.ok ? await portfolioResponse.json() : [];
      const watchlist = watchlistResponse.ok ? await watchlistResponse.json() : [];

      const totalValue = portfolio.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0);
      const totalProfit = portfolio.reduce((sum: number, item: any) => sum + (item.profit || 0), 0);
      const totalProfitPercent = totalValue > 0 ? (totalProfit / (totalValue - totalProfit)) * 100 : 0;

      return {
        totalValue,
        totalProfit,
        totalProfitPercent,
        holdings: portfolio.length,
        watchlistCount: watchlist.length,
        portfolio,
        watchlist
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  private static async getMarketSentiment(symbol: string) {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/sentiment?symbol=${symbol}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch market sentiment');
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  private static async getTechnicalIndicators(symbol: string) {
    try {
      const chartResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/stocks/${symbol}/chart`);
      if (chartResponse.ok) {
        const chartData = await chartResponse.json();
        const closes = chartData.map((d: any) => d.close);
        
        // Calculate basic indicators
        const sma20 = MarketUtils.calculateSMA(closes, 20);
        const sma50 = MarketUtils.calculateSMA(closes, 50);
        const rsi = MarketUtils.calculateRSI(closes);
        
        return {
          sma20: sma20[sma20.length - 1],
          sma50: sma50[sma50.length - 1],
          rsi: rsi[rsi.length - 1],
          currentPrice: closes[closes.length - 1]
        };
      }
      throw new Error('Failed to fetch technical indicators');
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  private static async getFundamentalAnalysis(symbol: string) {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/stocks/${symbol}`);
      if (response.ok) {
        const data = await response.json();
        return {
          symbol: data.symbol,
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          volume: data.volume
        };
      }
      throw new Error('Failed to fetch fundamental data');
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  private static async getMarketNews(symbol?: string, limit: number = 5) {
    try {
      const url = symbol 
        ? `${process.env.NEXTAUTH_URL}/api/news/${symbol}?limit=${limit}`
        : `${process.env.NEXTAUTH_URL}/api/news/market?limit=${limit}`;
      
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch market news');
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  private static async compareStocks(symbols: string[]) {
    try {
      const promises = symbols.map(symbol => 
        fetch(`${process.env.NEXTAUTH_URL}/api/stocks/${symbol}`)
      );
      
      const responses = await Promise.all(promises);
      const stocks = [];
      
      for (let i = 0; i < responses.length; i++) {
        if (responses[i].ok) {
          stocks.push(await responses[i].json());
        }
      }
      
      return {
        symbols,
        stocks,
        comparison: this.generateComparison(stocks)
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  private static async getMarketOverview() {
    try {
      // Get major indices
      const indices = ['SPY', 'QQQ', 'DIA'];
      const promises = indices.map(symbol => 
        fetch(`${process.env.NEXTAUTH_URL}/api/stocks/${symbol}`)
      );
      
      const responses = await Promise.all(promises);
      const marketData = [];
      
      for (let i = 0; i < responses.length; i++) {
        if (responses[i].ok) {
          marketData.push(await responses[i].json());
        }
      }
      
      return {
        indices: marketData,
        marketStatus: MarketUtils.isMarketOpen(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  private static generateComparison(stocks: any[]) {
    return stocks.map(stock => ({
      symbol: stock.symbol,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      performance: stock.changePercent > 0 ? 'positive' : 'negative'
    }));
  }
}
