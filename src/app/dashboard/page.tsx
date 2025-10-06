'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, ReferenceLine } from 'recharts';
import { 
  Search, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, RefreshCw,
  Brain, Newspaper, PieChart as PieChartIcon, Loader2, RotateCcw, MessageCircle, AlertTriangle,
  Settings, Zap, Target, Shield, ChevronRight, Info, ArrowUpRight, ArrowDownRight, Minimize,
  Maximize2, Download, Upload, Eye, EyeOff, CheckCircle, XCircle, Clock, Calendar, Filter,
  Sparkles, Star, Moon, Sun, Bell, User, Briefcase, TrendingUp as TrendingUpIcon, BarChart2,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { Inter } from 'next/font/google';
import AdvancedChatbot from '@/components/chatbot/advanced-chatbot';

// Load Inter font with fallback
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
});

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  lastUpdated: string;
  companyName?: string;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  type: string;
  addedAt: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
  matchScore?: string;
  marketOpen?: string;
  marketClose?: string;
}

interface ChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PortfolioItem {
  id: string;
  symbol: string;
  name?: string;
  quantity: number;
  buyPrice: number;
  currentPrice?: number;
  totalValue?: number;
  profit?: number;
  profitPercent?: number;
  type: string;
  createdAt: string;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  image: string;
  category: string;
}

interface AiInsight {
  id: string;
  symbol: string;
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  createdAt: string;
}

interface PortfolioAllocation {
  name: string;
  value: number;
  percentage: number;
}

interface PortfolioPerformance {
  date: string;
  value: number;
}

interface StockRecommendation {
  id: string;
  symbol: string;
  companyName?: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reason: string;
  priceTarget?: number;
  currentPrice?: number;
  upside?: number;
  downside?: number;
  timeHorizon: string;
  riskLevel: 'low' | 'medium' | 'high';
  sector?: string;
  marketCap?: string;
  peRatio?: number;
  dividendYield?: number;
  analystRating?: string;
  keyMetrics?: {
    marketCap?: number;
    volume?: number;
    avgVolume?: number;
    dayHigh?: number;
    dayLow?: number;
    week52High?: number;
    week52Low?: number;
  };
  isRead: boolean;
}

interface RecommendationSummary {
  totalRecommendations: number;
  buySignals: number;
  sellSignals: number;
  holdSignals: number;
  avgConfidence: number;
  lastUpdated: string;
}

interface MarketContext {
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  volatility: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface RecommendationResponse {
  recommendations: StockRecommendation[];
  summary: RecommendationSummary;
  marketContext?: MarketContext;
}

interface SocialMediaSentiment {
  overallSentiment: number;
  platformSentiments: Record<string, number>;
  keyTopics: string[];
  mentions: number;
}

interface PatternRecognitionResult {
  patternType: string;
  confidence: number;
  description: string;
  implications: string;
}

interface PricePredictionResult {
  prediction: number;
  confidence: number;
  timeframe: string;
  factors: string[];
}

interface FraudAlertResult {
  alertType: string;
  confidence: number;
  description: string;
  indicators: string[];
}

interface StrategyPerformance {
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  profitFactor: number;
  annualReturn: number;
}

interface EnhancedMarketTrendForecast {
  trend: string;
  confidence: number;
  keyIndicators: string[];
  catalysts: string[];
  sectorExpectations: Record<string, string>;
  riskFactors: string[];
  timeframe: string;
  lastUpdated: string;
  technicalAnalysis: {
    trendStrength: number;
    supportLevels: number[];
    resistanceLevels: number[];
    volumeAnalysis: string;
  };
  macroFactors: {
    interestRates: string;
    inflation: string;
    gdpGrowth: string;
    employment: string;
  };
}

interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  performance?: StrategyPerformance;
  isActive: boolean;
  createdAt: string;
  backtestResults?: StrategyPerformance;
  riskLevel: 'low' | 'medium' | 'high';
  expectedAnnualReturn?: number;
  maxDrawdown?: number;
  winRate?: number;
}

interface MarketTrendForecast {
  trend: string;
  confidence: number;
  keyIndicators: string[];
  catalysts: string[];
  sectorExpectations: Record<string, string>;
  riskFactors: string[];
}

interface ChatbotMessage {
  id: string;
  query: string;
  response: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [stockData, setStockData] = useState<{ [key: string]: StockData }>({});
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
  const [recommendationsData, setRecommendationsData] = useState<RecommendationResponse | null>(null);
  const [socialMediaSentiment, setSocialMediaSentiment] = useState<SocialMediaSentiment | null>(null);
  const [patternRecognition, setPatternRecognition] = useState<PatternRecognitionResult[]>([]);
  const [pricePrediction, setPricePrediction] = useState<PricePredictionResult | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlertResult[]>([]);
  const [tradingStrategies, setTradingStrategies] = useState<TradingStrategy[]>([]);
  const [portfolioOptimization, setPortfolioOptimization] = useState<Record<string, any> | null>(null);
  const [marketTrendForecast, setMarketTrendForecast] = useState<MarketTrendForecast | null>(null);
  const [chatbotMessages, setChatbotMessages] = useState<ChatbotMessage[]>([]);
  const [chatbotQuery, setChatbotQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('watchlist');
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    symbol: '',
    quantity: '',
    buyPrice: '',
    type: 'stock'
  });
  const [isAddingToPortfolio, setIsAddingToPortfolio] = useState(false);
  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false);
  const [activeStock, setActiveStock] = useState<StockData | null>(null);
  const [loadingAiInsightSymbol, setLoadingAiInsightSymbol] = useState<string | null>(null);
  const [loadingNewsSymbol, setLoadingNewsSymbol] = useState<string | null>(null);
  const [currentInsightSymbol, setCurrentInsightSymbol] = useState<string | null>(null);
  const [currentNewsSymbol, setCurrentNewsSymbol] = useState<string | null>(null);
  const [chartIndicators, setChartIndicators] = useState<string[]>(['SMA 20', 'SMA 50']);
  const [chartTimeframe, setChartTimeframe] = useState('1M');
  const [chartType, setChartType] = useState('line');
  const [showAdvancedChart, setShowAdvancedChart] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isProcessingChatbotQuery, setIsProcessingChatbotQuery] = useState(false);
  const [portfolioAllocation, setPortfolioAllocation] = useState<PortfolioAllocation[]>([]);
  const [portfolioPerformance, setPortfolioPerformance] = useState<PortfolioPerformance[]>([]);
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformance | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [backtestTimeframe, setBacktestTimeframe] = useState('1Y');
  const [isActivatingStrategy, setIsActivatingStrategy] = useState(false);
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);
  const [enhancedMarketForecast, setEnhancedMarketForecast] = useState<EnhancedMarketTrendForecast | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchWatchlist();
    fetchPortfolio();
    fetchStockRecommendations();
    fetchEnhancedMarketTrendForecast();
    fetchTradingStrategies();
  }, []);

  // Memoize functions to prevent unnecessary re-renders
  const fetchStockDataForWatchlist = useCallback(async () => {
    setLoading(true);
    try {
      const promises = watchlist.map(async (item) => {
        const response = await fetch(`/api/stocks/${item.symbol}`);
        if (response.ok) {
          const data = await response.json();
          return { symbol: item.symbol, data };
        }
        return null;
      });
      
      const results = await Promise.all(promises);
      const newStockData: { [key: string]: StockData } = {};
      
      results.forEach((result) => {
        if (result) {
          newStockData[result.symbol] = result.data;
        }
      });
      
      setStockData(newStockData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  const calculatePortfolioMetrics = useCallback(() => {
    // Calculate portfolio allocation
    const allocation = portfolio.map(item => ({
      name: item.symbol,
      value: item.totalValue || 0,
      percentage: ((item.totalValue || 0) / portfolio.reduce((sum, p) => sum + (p.totalValue || 0), 0)) * 100
    }));
    
    setPortfolioAllocation(allocation);
    
    // Calculate portfolio performance over time (mock data for now)
    const performance = [
      { date: 'Jan', value: 10000 },
      { date: 'Feb', value: 12000 },
      { date: 'Mar', value: 11500 },
      { date: 'Apr', value: 13000 },
      { date: 'May', value: 14500 },
      { date: 'Jun', value: portfolio.reduce((sum, p) => sum + (p.totalValue || 0), 0) }
    ];
    
    setPortfolioPerformance(performance);
  }, [portfolio]);

  // Fetch stock data for watchlist items
  useEffect(() => {
    if (watchlist.length > 0) {
      fetchStockDataForWatchlist();
    }
  }, [watchlist, fetchStockDataForWatchlist]);

  // Fetch portfolio data
  useEffect(() => {
    if (portfolio.length > 0) {
      calculatePortfolioMetrics();
    }
  }, [portfolio, calculatePortfolioMetrics]);

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast.error('Failed to load watchlist');
    }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await fetch('/api/portfolio');
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Failed to load portfolio');
    }
  };

  const refreshStockData = async () => {
    setRefreshing(true);
    await fetchStockDataForWatchlist();
    await fetchPortfolio();
    setRefreshing(false);
    toast.success('Stock data refreshed');
  };

  const searchStocks = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    
    setLoading(true);
    setSearchResults([]);
    
    try {
      console.log('🔍 Searching for:', searchQuery);
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
      
      console.log('📡 Search response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Search results received:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          setSearchResults(data);
          toast.success(`Found ${data.length} results for "${searchQuery}"`);
        } else {
          toast.error('No results found. Try a different search term.');
          setSearchResults([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Search failed:', errorData);
        
        if (response.status === 429) {
          toast.error('Too many requests. Please wait a minute and try again.');
        } else if (response.status === 404) {
          toast.error('No results found for this search term.');
        } else {
          toast.error(errorData.error || 'Search failed. Please try again.');
        }
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      toast.error('Network error. Please check your connection.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (stock: SearchResult) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          type: stock.type.toLowerCase()
        })
      });
      
      if (response.ok) {
        toast.success(`${stock.symbol} added to watchlist`);
        fetchWatchlist();
        setSearchResults([]);
        setSearchQuery('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add to watchlist');
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      const response = await fetch(`/api/watchlist/${symbol}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success(`${symbol} removed from watchlist`);
        fetchWatchlist();
        setStockData(prev => {
          const newData = { ...prev };
          delete newData[symbol];
          return newData;
        });
        
        // Clear chart if the removed symbol was selected
        if (selectedStock === symbol) {
          setSelectedStock(null);
          setChartData([]);
        }
      } else {
        toast.error('Failed to remove from watchlist');
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    }
  };

  const fetchChartData = async (symbol: string) => {
    setChartLoading(true);
    
    try {
      const response = await fetch(`/api/stocks/${symbol}/chart`);
      
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
        setSelectedStock(symbol);
        
        // Switch to charts tab
        setCurrentTab('charts');
        toast.success(`Chart loaded for ${symbol}`);
      } else {
        toast.error('Failed to load chart data');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Failed to load chart data');
    } finally {
      setChartLoading(false);
    }
  };

  const fetchNews = async (symbol: string) => {
    setLoadingNewsSymbol(symbol);
    setCurrentNewsSymbol(symbol);
    try {
      // Fetch news
      const newsResponse = await fetch(`/api/news/${symbol}`);
      
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        console.log('News data received:', newsData);
        
        // Handle different possible response formats
        if (Array.isArray(newsData)) {
          // If response is directly an array of news items
          setNews(newsData);
        } else if (newsData && Array.isArray(newsData.news)) {
          // If response has a news property that is an array
          setNews(newsData.news);
        } else if (newsData && Array.isArray(newsData.articles)) {
          // If response has an articles property that is an array
          setNews(newsData.articles);
        } else {
          // If none of the expected formats, show error
          console.error('Unexpected news data format:', newsData);
          setNews([]);
          toast.error('Unexpected news data format');
          return;
        }
        
        toast.success(`News loaded for ${symbol}`);
      } else {
        const errorData = await newsResponse.json().catch(() => ({}));
        console.error('Failed to fetch news:', errorData);
        toast.error(errorData.error || 'Failed to load news');
        setNews([]);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to load news');
      setNews([]);
    } finally {
      setLoadingNewsSymbol(null);
    }
  };

  const fetchAiInsights = async (symbol: string) => {
    setLoadingAiInsightSymbol(symbol);
    setCurrentInsightSymbol(symbol);
    try {
      const insightsResponse = await fetch(`/api/ai/insights?symbol=${symbol}`);
      
      if (insightsResponse.ok) {
        const insightData = await insightsResponse.json();
        setAiInsights([{
          id: `ai-${Date.now()}-${symbol}`,
          symbol: symbol,
          title: `AI Analysis for ${symbol}`,
          summary: insightData.summary,
          sentiment: insightData.sentiment,
          confidence: insightData.confidence,
          createdAt: new Date().toISOString()
        }]);
        toast.success(`AI insights loaded for ${symbol}`);
      } else {
        console.error('Failed to fetch AI insights:', insightsResponse.status);
        // Create a fallback insight
        setAiInsights([{
          id: `fallback-${Date.now()}-${symbol}`,
          symbol: symbol,
          title: `Analysis for ${symbol}`,
          summary: `AI analysis is currently unavailable for ${symbol}. Please try again later.`,
          sentiment: 'neutral',
          confidence: 0.5,
          createdAt: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      toast.error('Failed to load AI insights');
      
      // Create a fallback insight
      setAiInsights([{
        id: `fallback-${Date.now()}-${symbol}`,
        symbol: symbol,
        title: `Analysis for ${symbol}`,
        summary: `AI analysis is currently unavailable for ${symbol}. Please try again later.`,
        sentiment: 'neutral',
        confidence: 0.5,
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setLoadingAiInsightSymbol(null);
    }
  };

  const fetchStockRecommendations = async () => {
    try {
      const response = await fetch('/api/ai/recommendations');
      
      if (response.ok) {
        const data: RecommendationResponse = await response.json();
        setRecommendationsData(data);
        toast.success(`Loaded ${data.recommendations.length} recommendations`);
      } else {
        console.error('Failed to fetch stock recommendations');
        toast.error('Failed to load recommendations');
      }
    } catch (error) {
      console.error('Error fetching stock recommendations:', error);
      toast.error('Failed to load recommendations');
    }
  };

  const fetchSocialMediaSentiment = async (symbol: string) => {
    try {
      const response = await fetch(`/api/ai/sentiment?symbol=${symbol}`);
      
      if (response.ok) {
        const data = await response.json();
        setSocialMediaSentiment(data);
        toast.success(`Social media sentiment analyzed for ${symbol}`);
      } else {
        console.error('Failed to fetch social media sentiment');
      }
    } catch (error) {
      console.error('Error fetching social media sentiment:', error);
      toast.error('Failed to analyze social media sentiment');
    }
  };

  const fetchPatternRecognition = async (symbol: string) => {
    try {
      const response = await fetch(`/api/ai/patterns?symbol=${symbol}`);
      
      if (response.ok) {
        const data = await response.json();
        setPatternRecognition(data);
        toast.success(`Pattern recognition completed for ${symbol}`);
      } else {
        console.error('Failed to fetch pattern recognition');
      }
    } catch (error) {
      console.error('Error fetching pattern recognition:', error);
      toast.error('Failed to recognize patterns');
    }
  };

  const fetchPricePrediction = async (symbol: string, timeframe: string = '1w') => {
    try {
      const response = await fetch(`/api/ai/prediction?symbol=${symbol}&timeframe=${timeframe}`);
      
      if (response.ok) {
        const data = await response.json();
        setPricePrediction(data);
        toast.success(`Price prediction generated for ${symbol}`);
      } else {
        console.error('Failed to fetch price prediction');
      }
    } catch (error) {
      console.error('Error fetching price prediction:', error);
      toast.error('Failed to predict stock price');
    }
  };

  const fetchFraudAlerts = async (symbol: string) => {
    try {
      const response = await fetch(`/api/ai/fraud?symbol=${symbol}`);
      
      if (response.ok) {
        const data = await response.json();
        setFraudAlerts(data);
        toast.success(`Fraud detection completed for ${symbol}`);
      } else {
        console.error('Failed to fetch fraud alerts');
      }
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
      toast.error('Failed to detect fraud');
    }
  };

  const activateStrategy = async (strategyId: string) => {
    setIsActivatingStrategy(true);
    try {
      const response = await fetch('/api/ai/strategies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId, isActive: true }),
      });
      
      if (response.ok) {
        toast.success('Strategy activated successfully');
        fetchTradingStrategies();
      } else {
        toast.error('Failed to activate strategy');
      }
    } catch (error) {
      console.error('Error activating strategy:', error);
      toast.error('Failed to activate strategy');
    } finally {
      setIsActivatingStrategy(false);
    }
  };

  const deactivateStrategy = async (strategyId: string) => {
    setIsActivatingStrategy(true);
    try {
      const response = await fetch('/api/ai/strategies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId, isActive: false }),
      });
      
      if (response.ok) {
        toast.success('Strategy deactivated');
        fetchTradingStrategies();
      } else {
        toast.error('Failed to deactivate strategy');
      }
    } catch (error) {
      console.error('Error deactivating strategy:', error);
      toast.error('Failed to deactivate strategy');
    } finally {
      setIsActivatingStrategy(false);
    }
  };

  const runBacktest = async (strategyId: string) => {
    setIsRunningBacktest(true);
    try {
      const response = await fetch('/api/ai/strategies/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId, timeframe: backtestTimeframe }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setStrategyPerformance(data.performance);
        toast.success('Backtest completed successfully');
      } else {
        toast.error('Failed to run backtest');
      }
    } catch (error) {
      console.error('Error running backtest:', error);
      toast.error('Failed to run backtest');
    } finally {
      setIsRunningBacktest(false);
    }
  };

  const fetchEnhancedMarketTrendForecast = async () => {
    try {
      const response = await fetch('/api/ai/forecast?enhanced=true');
      
      if (response.ok) {
        const data = await response.json();
        setEnhancedMarketForecast(data);
      } else {
        console.error('Failed to fetch enhanced market forecast');
      }
    } catch (error) {
      console.error('Error fetching enhanced market forecast:', error);
    }
  };

  const fetchTradingStrategies = async () => {
    try {
      const response = await fetch('/api/ai/strategies');
      
      if (response.ok) {
        const data = await response.json();
        setTradingStrategies(data.strategies || []);
      } else {
        console.error('Failed to fetch trading strategies');
        setTradingStrategies([]);
      }
    } catch (error) {
      console.error('Error fetching trading strategies:', error);
      toast.error('Failed to generate trading strategies');
      setTradingStrategies([]);
    }
  };

  const fetchPortfolioOptimization = async () => {
    try {
      const response = await fetch('/api/ai/optimize');
      
      if (response.ok) {
        const data = await response.json();
        setPortfolioOptimization(data);
        toast.success('Portfolio optimization completed');
      } else {
        console.error('Failed to fetch portfolio optimization');
      }
    } catch (error) {
      console.error('Error fetching portfolio optimization:', error);
      toast.error('Failed to optimize portfolio');
    }
  };

  const processChatbotQuery = async () => {
    if (!chatbotQuery.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    setIsProcessingChatbotQuery(true);
    
    try {
      const response = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: chatbotQuery })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const newMessage: ChatbotMessage = {
          id: Date.now().toString(),
          query: chatbotQuery,
          response: data.response,
          timestamp: new Date().toISOString()
        };
        
        setChatbotMessages(prev => [...prev, newMessage]);
        setChatbotQuery('');
      } else {
        toast.error('Failed to process your question');
      }
    } catch (error) {
      console.error('Error processing chatbot query:', error);
      toast.error('Failed to process your question');
    } finally {
      setIsProcessingChatbotQuery(false);
    }
  };

  const regenerateAiInsight = () => {
    if (currentInsightSymbol) {
      fetchAiInsights(currentInsightSymbol);
    }
  };

  const refreshNews = () => {
    if (currentNewsSymbol) {
      fetchNews(currentNewsSymbol);
    }
  };

  const clearAiInsights = () => {
    setAiInsights([]);
    setCurrentInsightSymbol(null);
  };

  const clearNews = () => {
    setNews([]);
    setCurrentNewsSymbol(null);
  };

  const addToPortfolio = async () => {
    if (!portfolioForm.symbol || !portfolioForm.quantity || !portfolioForm.buyPrice) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsAddingToPortfolio(true);
    
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioForm),
      });
      
      if (response.ok) {
        toast.success('Added to portfolio successfully');
        setPortfolioForm({ symbol: '', quantity: '', buyPrice: '', type: 'stock' });
        fetchPortfolio();
        setIsPortfolioDialogOpen(false); // Close the dialog after successful addition
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add to portfolio');
      }
    } catch (error) {
      console.error('Portfolio error:', error);
      toast.error('Failed to add to portfolio');
    } finally {
      setIsAddingToPortfolio(false);
    }
  };

  const removeFromPortfolio = async (id: string) => {
    try {
      const response = await fetch(`/api/portfolio/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Removed from portfolio');
        fetchPortfolio();
      } else {
        toast.error('Failed to remove from portfolio');
      }
    } catch (error) {
      console.error('Portfolio removal error:', error);
      toast.error('Failed to remove from portfolio');
    }
  };

  const selectStock = async (symbol: string) => {
    try {
      // Fetch stock data
      const stockResponse = await fetch(`/api/stocks/${symbol}`);
      
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        setActiveStock(stockData);
      }
      
      // Fetch chart data
      const chartResponse = await fetch(`/api/stocks/${symbol}/chart?interval=daily`);
      
      if (chartResponse.ok) {
        const chartData = await chartResponse.json();
        setChartData(chartData);
      }
      
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error selecting stock:', error);
      toast.error('Failed to load stock data');
    }
  };

  const openAddToPortfolioDialog = () => {
    setPortfolioForm({
      symbol: '',
      quantity: '',
      buyPrice: '',
      type: 'stock'
    });
    setIsPortfolioDialogOpen(true);
  };

  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: string | number | undefined | null): string => {
    // Handle undefined or null values
    if (value === undefined || value === null) {
      return 'N/A';
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Handle NaN values
    if (isNaN(numValue)) {
      return 'N/A';
    }
    
    return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(2)}%`;
  };

  const formatVolume = (volume: number | undefined | null): string => {
    // Handle undefined or null values
    if (volume === undefined || volume === null) {
      return 'N/A';
    }
    
    // Handle NaN values
    if (isNaN(volume)) {
      return 'N/A';
    }
    
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString();
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading skeleton component
  const StockCardSkeleton = () => (
    <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  // Portfolio allocation chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
  // Sentiment colors
  const getSentimentColor = (sentiment: string | undefined): string => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get action color
  const getActionColor = (action: string | undefined): string => {
    switch (action) {
      case 'buy':
        return 'text-green-600 bg-green-100';
      case 'sell':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get trend color
  const getTrendColor = (trend: string | undefined): string => {
    switch (trend) {
      case 'bullish':
        return 'text-green-600 bg-green-100';
      case 'bearish':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get alert type color
  const getAlertTypeColor = (alertType: string | undefined): string => {
    switch (alertType) {
      case 'pump_and_dump':
      case 'wash_trading':
      case 'insider_trading':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  // Get performance color
  const getPerformanceColor = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return 'text-gray-600';
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const renderTradingStrategiesTab = () => {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {/* Trading Strategies */}
        <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Target className="h-5 w-5" />
              Automated Trading Strategies
            </CardTitle>
            <CardDescription className="text-blue-600">
              AI-generated trading strategies based on your risk profile
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {tradingStrategies.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Your Strategies</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTradingStrategies}
                    className="flex items-center gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {tradingStrategies.map((strategy: TradingStrategy) => (
                    <div 
                      key={strategy.id} 
                      className={`border rounded-xl p-4 transition-all duration-300 hover:shadow-md ${
                        strategy.isActive 
                          ? 'border-blue-300 bg-blue-50 shadow-sm' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">{strategy.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={strategy.isActive ? "default" : "outline"} className={
                            strategy.isActive 
                              ? "bg-blue-600 hover:bg-blue-700" 
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }>
                            {strategy.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className={
                            strategy.riskLevel === 'high' ? 'text-red-600 border-red-600 bg-red-50' : 
                            strategy.riskLevel === 'low' ? 'text-green-600 border-green-600 bg-green-50' : 
                            'text-yellow-600 border-yellow-600 bg-yellow-50'
                          }>
                            {strategy.riskLevel?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                      
                      {strategy.performance && (
                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <span className="text-gray-500">Win Rate:</span>
                            <div className="font-medium">{(strategy.performance.winRate * 100).toFixed(1)}%</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <span className="text-gray-500">Annual Return:</span>
                            <div className={`font-medium ${getPerformanceColor(strategy.performance.annualReturn)}`}>
                              {strategy.performance.annualReturn ? `${strategy.performance.annualReturn > 0 ? '+' : ''}${(strategy.performance.annualReturn * 100).toFixed(1)}%` : 'N/A'}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <span className="text-gray-500">Max Drawdown:</span>
                            <div className="font-medium text-red-600">
                              {strategy.performance.maxDrawdown ? `${(strategy.performance.maxDrawdown * 100).toFixed(1)}%` : 'N/A'}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <span className="text-gray-500">Sharpe Ratio:</span>
                            <div className="font-medium">{strategy.performance.sharpeRatio?.toFixed(2) || 'N/A'}</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">{formatDate(strategy.createdAt)}</span>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedStrategy(strategy.id)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-100"
                          >
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant={strategy.isActive ? "destructive" : "default"}
                            onClick={() => strategy.isActive ? deactivateStrategy(strategy.id) : activateStrategy(strategy.id)}
                            disabled={isActivatingStrategy}
                            className={
                              strategy.isActive 
                                ? "bg-red-600 hover:bg-red-700" 
                                : "bg-blue-600 hover:bg-blue-700"
                            }
                          >
                            {isActivatingStrategy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              strategy.isActive ? 'Deactivate' : 'Activate'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Strategy Details Dialog */}
                {selectedStrategy && (
                  <Dialog open={!!selectedStrategy} onOpenChange={() => setSelectedStrategy(null)}>
                    <DialogContent className="max-w-2xl border-0 shadow-xl">
                      <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-xl">
                        <DialogTitle className="text-xl text-blue-800">
                          {tradingStrategies.find(s => s.id === selectedStrategy)?.name}
                        </DialogTitle>
                        <DialogDescription className="text-blue-600">
                          Detailed view of the trading strategy
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 p-6">
                        {(() => {
                          const strategy = tradingStrategies.find(s => s.id === selectedStrategy);
                          if (!strategy) return null;
                          
                          return (
                            <>
                              <div className="space-y-3">
                                <h4 className="font-medium text-gray-800 text-lg flex items-center gap-2">
                                  <Info className="h-5 w-5 text-blue-500" />
                                  Description
                                </h4>
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                                  {strategy.description}
                                </p>
                              </div>
                              
                              <div className="space-y-3">
                                <h4 className="font-medium text-gray-800 text-lg flex items-center gap-2">
                                  <Settings className="h-5 w-5 text-blue-500" />
                                  Parameters
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  {Object.entries(strategy.parameters).map(([key, value]) => (
                                    <div key={key} className="flex justify-between py-3 border-b border-gray-200 last:border-b-0">
                                      <span className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                      <span className="text-gray-900 font-mono text-sm">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {strategy.performance && (
                                <div className="space-y-3">
                                  <h4 className="font-medium text-gray-800 text-lg flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-500" />
                                    Performance Metrics
                                  </h4>
                                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="flex justify-between py-2 border-b border-green-200 last:border-b-0">
                                        <span className="font-medium text-gray-700">Win Rate:</span>
                                        <span className="font-semibold text-green-700">{(strategy.performance.winRate * 100).toFixed(1)}%</span>
                                      </div>
                                      <div className="flex justify-between py-2 border-b border-green-200 last:border-b-0">
                                        <span className="font-medium text-gray-700">Profit Factor:</span>
                                        <span className="font-semibold text-green-700">{strategy.performance.profitFactor?.toFixed(2) || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between py-2 border-b border-green-200 last:border-b-0">
                                        <span className="font-medium text-gray-700">Max Drawdown:</span>
                                        <span className="font-semibold text-red-600">{(strategy.performance.maxDrawdown * 100).toFixed(1)}%</span>
                                      </div>
                                      <div className="flex justify-between py-2 border-b border-green-200 last:border-b-0">
                                        <span className="font-medium text-gray-700">Sharpe Ratio:</span>
                                        <span className="font-semibold text-green-700">{strategy.performance.sharpeRatio?.toFixed(2) || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between py-2">
                                        <span className="font-medium text-gray-700">Annual Return:</span>
                                        <span className={`font-semibold ${getPerformanceColor(strategy.performance.annualReturn)}`}>
                                          {strategy.performance.annualReturn ? `${strategy.performance.annualReturn > 0 ? '+' : ''}${(strategy.performance.annualReturn * 100).toFixed(1)}%` : 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Created: {formatDate(strategy.createdAt)}
                                </span>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => runBacktest(strategy.id)}
                                    disabled={isRunningBacktest}
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                  >
                                    {isRunningBacktest ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Backtesting...
                                      </>
                                    ) : (
                                      <>
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Run Backtest
                                      </>
                                    )}
                                  </Button>
                                  <Select value={backtestTimeframe} onValueChange={setBacktestTimeframe}>
                                    <SelectTrigger className="w-24 border-gray-300">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1M">1 Month</SelectItem>
                                      <SelectItem value="3M">3 Months</SelectItem>
                                      <SelectItem value="6M">6 Months</SelectItem>
                                      <SelectItem value="1Y">1 Year</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              {strategyPerformance && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                  <h4 className="font-medium mb-3 text-blue-800 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Backtest Results
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex justify-between">
                                      <span className="text-gray-700">Total Return:</span>
                                      <span className={`font-semibold ${getPerformanceColor(strategyPerformance.totalReturn)}`}>
                                        {strategyPerformance.totalReturn > 0 ? '+' : ''}{(strategyPerformance.totalReturn * 100).toFixed(2)}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-700">Win Rate:</span>
                                      <span className="font-semibold">{(strategyPerformance.winRate * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-700">Max Drawdown:</span>
                                      <span className="font-semibold text-red-600">{(strategyPerformance.maxDrawdown * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-700">Sharpe Ratio:</span>
                                      <span className="font-semibold">{strategyPerformance.sharpeRatio?.toFixed(2) || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  No strategies available
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We're generating personalized trading strategies based on your risk profile
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchTradingStrategies}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Generate Strategies
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Backtest Results */}
        {strategyPerformance && (
          <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-4">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <BarChart3 className="h-5 w-5" />
                Backtest Results
              </CardTitle>
              <CardDescription className="text-green-600">
                Performance analysis of your trading strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Total Return</p>
                    <p className={`text-2xl font-bold ${getPerformanceColor(strategyPerformance.totalReturn)}`}>
                      {strategyPerformance.totalReturn > 0 ? '+' : ''}{(strategyPerformance.totalReturn * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Win Rate</p>
                    <p className="text-2xl font-bold">{(strategyPerformance.winRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200">
                    <p className="text-sm text-gray-600 mb-1">Max Drawdown</p>
                    <p className="text-2xl font-bold text-red-600">{(strategyPerformance.maxDrawdown * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">Sharpe Ratio</p>
                    <p className="text-2xl font-bold">{strategyPerformance.sharpeRatio?.toFixed(2) || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart 
                      data={Array.from({ length: 12 }, (_, i) => ({
                        month: `Month ${i + 1}`,
                        value: 10000 * (1 + (strategyPerformance.totalReturn / 100) * (i / 12))
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${Number(value).toFixed(0)}`} />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Portfolio Value']} 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderMarketTrendForecast = () => {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 pb-4">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <TrendingUp className="h-5 w-5" />
            Market Trend Forecast
          </CardTitle>
          <CardDescription className="text-purple-600">
            AI-powered market trend analysis and predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {enhancedMarketForecast ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Overall Trend</h3>
                <div className="flex items-center gap-3">
                  <Badge className={`${getTrendColor(enhancedMarketForecast.trend)} text-sm px-3 py-1.5 rounded-full`}>
                    {enhancedMarketForecast.trend.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600 font-medium">
                    Confidence: {(enhancedMarketForecast.confidence * 100).toFixed(0)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchEnhancedMarketTrendForecast}
                    className="flex items-center gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                  <h4 className="font-medium mb-3 text-blue-800 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Trend Strength
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            enhancedMarketForecast.technicalAnalysis.trendStrength > 0.7 
                              ? 'bg-green-500' 
                              : enhancedMarketForecast.technicalAnalysis.trendStrength > 0.3 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${enhancedMarketForecast.technicalAnalysis.trendStrength * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {enhancedMarketForecast.technicalAnalysis.trendStrength > 0.7 ? 'Strong' : 
                         enhancedMarketForecast.technicalAnalysis.trendStrength > 0.3 ? 'Moderate' : 'Weak'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {enhancedMarketForecast.technicalAnalysis.trendStrength > 0.7 ? 'Strong momentum detected' : 
                       enhancedMarketForecast.technicalAnalysis.trendStrength > 0.3 ? 'Moderate trend strength' : 'Weak trend, watch for reversal'}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-5 rounded-xl border border-purple-200">
                  <h4 className="font-medium mb-3 text-purple-800 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeframe
                  </h4>
                  <p className="text-sm font-medium text-gray-800">{enhancedMarketForecast.timeframe}</p>
                  <p className="text-xs text-gray-600 mt-1">Forecast duration</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
                    <h4 className="font-medium mb-3 text-green-800 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Key Indicators
                    </h4>
                    <ul className="space-y-2">
                      {enhancedMarketForecast.keyIndicators.map((indicator: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-green-500 mr-2 mt-1">•</span>
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-200">
                    <h4 className="font-medium mb-3 text-amber-800 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Potential Catalysts
                    </h4>
                    <ul className="space-y-2">
                      {enhancedMarketForecast.catalysts.map((catalyst: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-amber-500 mr-2 mt-1">•</span>
                          {catalyst}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                    <h4 className="font-medium mb-3 text-blue-800 flex items-center gap-2">
                      <BarChart2 className="h-4 w-4" />
                      Technical Analysis
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Support Levels</p>
                          <div className="flex flex-wrap gap-1">
                            {enhancedMarketForecast.technicalAnalysis.supportLevels.map((level: number, index: number) => (
                              <Badge key={index} variant="outline" className="text-green-600 border-green-600 bg-green-50">
                                ${formatCurrency(level)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Resistance Levels</p>
                          <div className="flex flex-wrap gap-1">
                            {enhancedMarketForecast.technicalAnalysis.resistanceLevels.map((level: number, index: number) => (
                              <Badge key={index} variant="outline" className="text-red-600 border-red-600 bg-red-50">
                                {formatCurrency(level)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Volume Analysis</p>
                        <p className="text-sm">{enhancedMarketForecast.technicalAnalysis.volumeAnalysis}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-5 rounded-xl border border-rose-200">
                    <h4 className="font-medium mb-3 text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Risk Factors
                    </h4>
                    <ul className="space-y-2">
                      {enhancedMarketForecast.riskFactors.map((risk: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-rose-500 mr-2 mt-1">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-5 rounded-xl border border-gray-200">
                  <h4 className="font-medium mb-3 text-gray-800 flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
                    Sector Expectations
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(enhancedMarketForecast.sectorExpectations).map(([sector, expectation]) => (
                      <div key={sector} className="flex items-center justify-between text-sm p-2 bg-white rounded-lg border border-gray-200">
                        <span className="capitalize text-gray-700">{sector}:</span>
                        <Badge variant="outline" className={`${getTrendColor(expectation)} text-xs`}>
                          {expectation}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-5 rounded-xl border border-cyan-200">
                  <h4 className="font-medium mb-3 text-cyan-800 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Macro Factors
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-500 block text-xs mb-1">Interest Rates:</span>
                      <p className="font-medium">{enhancedMarketForecast.macroFactors.interestRates}</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-500 block text-xs mb-1">Inflation:</span>
                      <p className="font-medium">{enhancedMarketForecast.macroFactors.inflation}</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-500 block text-xs mb-1">GDP Growth:</span>
                      <p className="font-medium">{enhancedMarketForecast.macroFactors.gdpGrowth}</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-500 block text-xs mb-1">Employment:</span>
                      <p className="font-medium">{enhancedMarketForecast.macroFactors.employment}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-4 flex items-center justify-center">
                <Calendar className="h-3 w-3 mr-1" />
                Last updated: {formatDate(enhancedMarketForecast.lastUpdated)}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No forecast available
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We're analyzing market data to generate trend forecasts
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchEnhancedMarketTrendForecast}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                Generate Forecast
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8 ${inter.className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-2 rounded-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              Welcome back, {session?.user?.name}
            </h1>
            <p className="text-gray-600 mt-2 ml-11">
              Track your investments and market insights
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <Button
              onClick={refreshStockData}
              disabled={refreshing || loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Badge variant="outline" className="text-sm bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200">
              Real-time Data
            </Badge>
          </div>
        </div>
        
        {/* Search Section */}
        <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Search className="h-5 w-5" />
              Search Stocks &amp; Crypto
            </CardTitle>
            <CardDescription className="text-blue-600">
              Find and add stocks or cryptocurrencies to your watchlist
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter symbol or company name (e.g., AAPL, Tesla, Microsoft)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchStocks()}
                className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button onClick={searchStocks} disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Enhanced search results section */}
            {searchResults.length > 0 && (
              <div className="mt-6">
                <div className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Found {searchResults.length} results for &quot;{searchQuery}&quot;
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {searchResults.map((stock: SearchResult, index: number) => (
                    <div key={`${stock.symbol}-${index}`} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-blue-600">{stock.symbol}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{stock.type}</span>
                          {stock.matchScore && (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                              Match: {Math.round(parseFloat(stock.matchScore) * 100)}%
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-800 font-medium mb-1">{stock.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>{stock.region}</span>
                          <span>•</span>
                          <span>{stock.currency}</span>
                          {stock.marketOpen && stock.marketClose && (
                            <>
                              <span>•</span>
                              <span>Market: {stock.marketOpen} - {stock.marketClose}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => selectStock(stock.symbol)}
                          disabled={loading}
                          className="border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addToWatchlist(stock)}
                          className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                          disabled={loading}
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  className="mt-4 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Clear Results
                </Button>
              </div>
            )}
            
            {/* Add loading state display */}
            {loading && searchQuery && (
              <div className="mt-6 text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <span className="text-gray-600">Searching for &quot;{searchQuery}&quot;...</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Main Dashboard Content */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-max min-w-full grid-flow-col auto-cols-fr bg-white p-1 rounded-xl shadow-md">
              <TabsTrigger value="watchlist" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white">
                <Activity className="h-4 w-4" />
                Watchlist
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white">
                <DollarSign className="h-4 w-4" />
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white">
                <Brain className="h-4 w-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white">
                <Zap className="h-4 w-4" />
                AI Features
              </TabsTrigger>
              <TabsTrigger value="strategies" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white">
                <Target className="h-4 w-4" />
                Strategies
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-4">
            {watchlist.length === 0 ? (
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardContent className="py-16 text-center">
                  <Activity className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Your watchlist is empty
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Start by searching and adding stocks or cryptocurrencies above
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {watchlist.map((item: WatchlistItem) => {
                  const data = stockData[item.symbol];
                  const isLoading = loading && !data;
                  
                  if (isLoading) {
                    return <StockCardSkeleton key={item.id} />;
                  }
                  
                  return (
                    <Card key={item.id} className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-bold text-gray-900">{item.symbol}</CardTitle>
                            <CardDescription className="text-sm line-clamp-1 text-gray-600">
                              {item.name}
                            </CardDescription>
                            <Badge variant="outline" className="mt-1 text-xs bg-gray-100 text-gray-800 border-gray-300">
                              {item.type.toUpperCase()}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromWatchlist(item.symbol)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {data ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-gray-900">
                                {formatCurrency(data.price)}
                              </span>
                              <div className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full ${
                                data.change >= 0 
                                  ? 'text-green-700 bg-green-100' 
                                  : 'text-red-700 bg-red-100'
                              }`}>
                                {data.change >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                {formatPercentage(data.changePercent)}
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-2">
                              <div className="flex justify-between py-1 border-b border-gray-100">
                                <span>Change:</span>
                                <span className={data.change >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                  {data.change >= 0 ? '+' : ''}{formatCurrency(data.change)}
                                </span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-gray-100">
                                <span>Open:</span>
                                <span className="font-medium">{formatCurrency(data.open)}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-gray-100">
                                <span>High:</span>
                                <span className="font-medium text-green-600">{formatCurrency(data.high)}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-gray-100">
                                <span>Low:</span>
                                <span className="font-medium text-red-600">{formatCurrency(data.low)}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span>Volume:</span>
                                <span className="font-medium">{formatVolume(data.volume)}</span>
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-100">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchChartData(item.symbol)}
                                disabled={chartLoading}
                                className="w-full flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                              >
                                <BarChart3 className="h-4 w-4" />
                                {chartLoading && selectedStock === item.symbol 
                                  ? 'Loading Chart...' 
                                  : 'View Chart'
                                }
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <span className="text-sm text-gray-500">Loading data...</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-4">
            {selectedStock && chartData.length > 0 ? (
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      {selectedStock} Price Chart
                      {stockData[selectedStock] && (
                        <div className={`ml-auto flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full ${
                          stockData[selectedStock].change >= 0 
                            ? 'text-green-700 bg-green-100' 
                            : 'text-red-700 bg-red-100'
                        }`}>
                          {stockData[selectedStock].change >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {formatCurrency(stockData[selectedStock].price)} 
                          ({formatPercentage(stockData[selectedStock].changePercent)})
                        </div>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <Select value={chartTimeframe} onValueChange={setChartTimeframe}>
                        <SelectTrigger className="w-24 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1D">1D</SelectItem>
                          <SelectItem value="1W">1W</SelectItem>
                          <SelectItem value="1M">1M</SelectItem>
                          <SelectItem value="3M">3M</SelectItem>
                          <SelectItem value="6M">6M</SelectItem>
                          <SelectItem value="1Y">1Y</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={chartType} onValueChange={setChartType}>
                        <SelectTrigger className="w-24 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="line">Line</SelectItem>
                          <SelectItem value="area">Area</SelectItem>
                          <SelectItem value="candlestick">Candlestick</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdvancedChart(!showAdvancedChart)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        {showAdvancedChart ? <Minimize className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        {showAdvancedChart ? 'Simple' : 'Advanced'}
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-gray-600">
                    Historical price data for the last 30 trading days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 w-full bg-white p-4 rounded-xl border border-gray-200">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'line' ? (
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value: string) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
                          />
                          <Tooltip
                            labelFormatter={(value: string) => new Date(value).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            formatter={(value: number, name: string) => [
                              formatCurrency(value),
                              name === 'close' ? 'Close Price' : 
                              name === 'high' ? 'High' :
                              name === 'low' ? 'Low' : 'Open'
                            ]}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="close"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                          />
                          {showAdvancedChart && (
                            <>
                              <Line
                                type="monotone"
                                dataKey="high"
                                stroke="#10b981"
                                strokeWidth={1}
                                strokeDasharray="2 2"
                                dot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="low"
                                stroke="#ef4444"
                                strokeWidth={1}
                                strokeDasharray="2 2"
                                dot={false}
                              />
                            </>
                          )}
                        </LineChart>
                      ) : chartType === 'area' ? (
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value: string) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
                          />
                          <Tooltip
                            labelFormatter={(value: string) => new Date(value).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            formatter={(value: number, name: string) => [
                              formatCurrency(value),
                              name === 'close' ? 'Close Price' : 
                              name === 'high' ? 'High' :
                              name === 'low' ? 'Low' : 'Open'
                            ]}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="close"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#colorPrice)"
                          />
                          {showAdvancedChart && (
                            <>
                              <Line
                                type="monotone"
                                dataKey="high"
                                stroke="#10b981"
                                strokeWidth={1}
                                strokeDasharray="2 2"
                                dot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="low"
                                stroke="#ef4444"
                                strokeWidth={1}
                                strokeDasharray="2 2"
                                dot={false}
                              />
                            </>
                          )}
                        </AreaChart>
                      ) : (
                        // Simplified candlestick as composed chart
                        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value: string) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
                          />
                          <Tooltip
                            labelFormatter={(value: string) => new Date(value).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Bar dataKey="high" fill="#10b981" />
                          <Bar dataKey="low" fill="#ef4444" />
                          <Line type="monotone" dataKey="close" stroke="#3b82f6" />
                        </ComposedChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Chart Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4">
                    {chartData.length > 0 && (
                      <>
                        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <p className="text-sm text-gray-600">30-Day High</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(Math.max(...chartData.map((d: ChartData) => d.high)))}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200">
                          <p className="text-sm text-gray-600">30-Day Low</p>
                          <p className="text-lg font-semibold text-red-600">
                            {formatCurrency(Math.min(...chartData.map((d: ChartData) => d.low)))}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                          <p className="text-sm text-gray-600">Avg Volume</p>
                          <p className="text-lg font-semibold">
                            {formatVolume(chartData.reduce((sum, d) => sum + d.volume, 0) / chartData.length)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                          <p className="text-sm text-gray-600">Data Points</p>
                          <p className="text-lg font-semibold">
                            {chartData.length} days
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Advanced Chart Features */}
                  {showAdvancedChart && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Technical Indicators</h3>
                        <div className="flex items-center gap-2">
                          <Select value={chartIndicators.join(',')} onValueChange={(value: string) => setChartIndicators(value.split(','))}>
                            <SelectTrigger className="w-48 border-gray-300">
                              <SelectValue placeholder="Select indicators" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SMA 20">SMA 20</SelectItem>
                              <SelectItem value="SMA 50">SMA 50</SelectItem>
                              <SelectItem value="SMA 200">SMA 200</SelectItem>
                              <SelectItem value="RSI">RSI</SelectItem>
                              <SelectItem value="MACD">MACD</SelectItem>
                              <SelectItem value="BB Upper">Bollinger Bands</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (selectedStock) {
                                fetchPatternRecognition(selectedStock);
                                fetchPricePrediction(selectedStock);
                              }
                            }}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Analyze
                          </Button>
                        </div>
                      </div>
                      
                      {/* Pattern Recognition Results */}
                      {patternRecognition.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-md font-medium mb-3 text-gray-800 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-blue-500" />
                            Pattern Recognition
                          </h4>
                          <div className="space-y-3">
                            {patternRecognition.map((pattern: PatternRecognitionResult, index: number) => (
                              <Alert key={index} className="bg-blue-50 border-blue-200">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-800">{pattern.patternType.replace('_', ' ').toUpperCase()}</AlertTitle>
                                <AlertDescription className="text-blue-700">
                                  {pattern.description} Confidence: {(pattern.confidence * 100).toFixed(0)}%
                                </AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Price Prediction Results */}
                      {pricePrediction && (
                        <div className="mb-4">
                          <h4 className="text-md font-medium mb-3 text-gray-800 flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-500" />
                            Price Prediction
                          </h4>
                          <Alert className="bg-purple-50 border-purple-200">
                            <Target className="h-4 w-4 text-purple-600" />
                            <AlertTitle className="text-purple-800">
                              Predicted Price: {formatCurrency(pricePrediction.prediction)} ({pricePrediction.timeframe})
                            </AlertTitle>
                            <AlertDescription className="text-purple-700">
                              Confidence: {(pricePrediction.confidence * 100).toFixed(0)}%
                              <ul className="mt-2 list-disc list-inside">
                                {pricePrediction.factors.map((factor: string, index: number) => (
                                  <li key={index}>{factor}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : chartLoading ? (
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardHeader>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardContent className="py-16 text-center">
                  <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No chart selected
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Click &quot;View Chart&quot; on any stock in your watchlist to display its price chart here
                  </p>
                  {watchlist.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {watchlist.slice(0, 5).map((item: WatchlistItem) => (
                        <Button
                          key={item.id}
                          variant="outline"
                          size="sm"
                          onClick={() => fetchChartData(item.symbol)}
                          disabled={chartLoading}
                          className="border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          View {item.symbol}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Portfolio Summary */}
              <Card className="md:col-span-1 bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <DollarSign className="h-5 w-5" />
                    Portfolio Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Total Value</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Total Profit/Loss</span>
                      <span className={`font-semibold ${
                        portfolio.reduce((sum, item) => sum + (item.profit || 0), 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(portfolio.reduce((sum, item) => sum + (item.profit || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Today&apos;s Change</span>
                      <span className="font-semibold text-green-600">+1.2%</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Cash</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(10000 - portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Invested</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(portfolio.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0))}
                      </span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchPortfolioOptimization}
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Optimize Portfolio
                    </Button>
                    <Dialog open={isPortfolioDialogOpen} onOpenChange={setIsPortfolioDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800" 
                          onClick={openAddToPortfolioDialog}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Portfolio
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-0 shadow-xl">
                        <DialogHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-t-xl">
                          <DialogTitle className="text-xl text-green-800">Add to Portfolio</DialogTitle>
                          <DialogDescription className="text-green-600">
                            Enter the details of your investment
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 p-6">
                          <div>
                            <Label htmlFor="symbol" className="text-gray-700">Symbol</Label>
                            <Input
                              id="symbol"
                              placeholder="e.g., AAPL"
                              value={portfolioForm.symbol}
                              onChange={(e) => setPortfolioForm({...portfolioForm, symbol: e.target.value.toUpperCase()})}
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="quantity" className="text-gray-700">Quantity</Label>
                              <Input
                                id="quantity"
                                type="number"
                                placeholder="0"
                                value={portfolioForm.quantity}
                                onChange={(e) => setPortfolioForm({...portfolioForm, quantity: e.target.value})}
                                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="buyPrice" className="text-gray-700">Buy Price ($)</Label>
                              <Input
                                id="buyPrice"
                                type="number"
                                placeholder="0.00"
                                value={portfolioForm.buyPrice}
                                onChange={(e) => setPortfolioForm({...portfolioForm, buyPrice: e.target.value})}
                                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="type" className="text-gray-700">Type</Label>
                            <Select value={portfolioForm.type} onValueChange={(value) => setPortfolioForm({...portfolioForm, type: value})}>
                              <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="stock">Stock</SelectItem>
                                <SelectItem value="crypto">Cryptocurrency</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            onClick={addToPortfolio} 
                            disabled={isAddingToPortfolio || !portfolioForm.symbol || !portfolioForm.quantity || !portfolioForm.buyPrice}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                          >
                            {isAddingToPortfolio ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : 'Add to Portfolio'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
              
              {/* Portfolio Holdings */}
              <Card className="md:col-span-2 bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
                  <CardTitle className="text-blue-800">Your Holdings</CardTitle>
                  <CardDescription className="text-blue-600">
                    Track your investments and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {portfolio.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Your portfolio is empty
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Add stocks or cryptocurrencies to start tracking your investments
                      </p>
                      <Dialog open={isPortfolioDialogOpen} onOpenChange={setIsPortfolioDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800">
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Portfolio
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-0 shadow-xl">
                          <DialogHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-t-xl">
                            <DialogTitle className="text-xl text-green-800">Add to Portfolio</DialogTitle>
                            <DialogDescription className="text-green-600">
                              Enter the details of your investment
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 p-6">
                            <div>
                              <Label htmlFor="symbol" className="text-gray-700">Symbol</Label>
                              <Input
                                id="symbol"
                                placeholder="e.g., AAPL"
                                value={portfolioForm.symbol}
                                onChange={(e) => setPortfolioForm({...portfolioForm, symbol: e.target.value.toUpperCase()})}
                                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="quantity" className="text-gray-700">Quantity</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  placeholder="0"
                                  value={portfolioForm.quantity}
                                  onChange={(e) => setPortfolioForm({...portfolioForm, quantity: e.target.value})}
                                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </div>
                              <div>
                                <Label htmlFor="buyPrice" className="text-gray-700">Buy Price ($)</Label>
                                <Input
                                  id="buyPrice"
                                  type="number"
                                  placeholder="0.00"
                                  value={portfolioForm.buyPrice}
                                  onChange={(e) => setPortfolioForm({...portfolioForm, buyPrice: e.target.value})}
                                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="type" className="text-gray-700">Type</Label>
                              <Select value={portfolioForm.type} onValueChange={(value) => setPortfolioForm({...portfolioForm, type: value})}>
                                <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="stock">Stock</SelectItem>
                                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button 
                              onClick={addToPortfolio} 
                              disabled={isAddingToPortfolio || !portfolioForm.symbol || !portfolioForm.quantity || !portfolioForm.buyPrice}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                            >
                              {isAddingToPortfolio ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : 'Add to Portfolio'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="text-gray-700 font-medium">Symbol</TableHead>
                              <TableHead className="text-gray-700 font-medium">Quantity</TableHead>
                              <TableHead className="text-gray-700 font-medium">Avg Cost</TableHead>
                              <TableHead className="text-gray-700 font-medium">Current Price</TableHead>
                              <TableHead className="text-gray-700 font-medium">Value</TableHead>
                              <TableHead className="text-gray-700 font-medium">Profit/Loss</TableHead>
                              <TableHead className="w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {portfolio.map((item: PortfolioItem) => (
                              <TableRow key={item.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium text-gray-900">{item.symbol}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{formatCurrency(item.buyPrice)}</TableCell>
                                <TableCell>{formatCurrency(item.currentPrice || 0)}</TableCell>
                                <TableCell>{formatCurrency(item.totalValue || 0)}</TableCell>
                                <TableCell className={item.profit && item.profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                  {item.profitPercent ? formatPercentage(item.profitPercent) : '0.00%'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFromPortfolio(item.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {/* Portfolio Allocation */}
                        <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-md overflow-hidden">
                          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                              <PieChartIcon className="h-5 w-5" />
                              Allocation
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={portfolioAllocation}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  >
                                    {portfolioAllocation.map((entry: PortfolioAllocation, index: number) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Portfolio Performance */}
                        <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-md overflow-hidden">
                          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                              <TrendingUp className="h-5 w-5" />
                              Performance
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={portfolioPerformance}>
                                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                  <XAxis dataKey="date" />
                                  <YAxis tickFormatter={(value) => `$${Number(value / 1000).toFixed(0)}k`} />
                                  <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                                  <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Portfolio Optimization Results */}
                      {portfolioOptimization && (
                        <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden mt-4">
                          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                              <Brain className="h-5 w-5" />
                              AI Portfolio Optimization
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              <div>
                                <h4 className="font-medium mb-3 text-gray-800 flex items-center gap-2">
                                  <Target className="h-4 w-4 text-blue-500" />
                                  Recommendations
                                </h4>
                                <div className="space-y-3">
                                  {portfolioOptimization.recommendations && Array.isArray(portfolioOptimization.recommendations) ? (
                                    portfolioOptimization.recommendations.map((rec: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                        <div>
                                          <span className="font-medium text-gray-900">{rec.symbol}</span>
                                          <span className={`ml-2 px-2 py-1 rounded text-xs ${getActionColor(rec.action)}`}>
                                            {rec.action?.toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm font-medium">{rec.currentAllocation}% → {rec.recommendedAllocation}%</div>
                                          <div className="text-xs text-gray-500">{rec.reason}</div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-500">No recommendations available</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                                  <h4 className="font-medium mb-3 text-green-800">Suggested Additions</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {portfolioOptimization.suggestedAdditions && Array.isArray(portfolioOptimization.suggestedAdditions) ? (
                                      portfolioOptimization.suggestedAdditions.map((symbol: string, index: number) => (
                                        <Badge key={index} variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                          {symbol}
                                        </Badge>
                                      ))
                                    ) : (
                                      <p className="text-gray-500">None</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-200">
                                  <h4 className="font-medium mb-3 text-red-800">Suggested Removals</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {portfolioOptimization.suggestedRemovals && Array.isArray(portfolioOptimization.suggestedRemovals) ? (
                                      portfolioOptimization.suggestedRemovals.map((symbol: string, index: number) => (
                                        <Badge key={index} variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                          {symbol}
                                        </Badge>
                                      ))
                                    ) : (
                                      <p className="text-gray-500">None</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                                <h4 className="font-medium mb-2 text-blue-800">Expected Improvement</h4>
                                <p className="text-sm text-gray-700">{portfolioOptimization.expectedImprovement}</p>
                              </div>
                              
                              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
                                <h4 className="font-medium mb-2 text-purple-800">Rebalancing Frequency</h4>
                                <p className="text-sm text-gray-700">{portfolioOptimization.rebalancingFrequency}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* AI Insights */}
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Brain className="h-5 w-5" />
                    AI Insights
                  </CardTitle>
                  <CardDescription className="text-purple-600">
                    AI-powered analysis and predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiInsights.length > 0 ? (
                    <div className="space-y-4">
                      {/* Action buttons for AI insights */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Current Insight</h3>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={regenerateAiInsight}
                            disabled={loadingAiInsightSymbol === currentInsightSymbol}
                            className="flex items-center gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            {loadingAiInsightSymbol === currentInsightSymbol ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="h-4 w-4" />
                                Regenerate
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={clearAiInsights}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      
                      {aiInsights.map((insight: AiInsight, index: number) => (
                        <div key={`${insight.id}-${index}`} className="border rounded-xl p-4 bg-white hover:shadow-md transition-all duration-300">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                            <Badge variant={
                              insight.sentiment === 'positive' ? 'default' : 
                              insight.sentiment === 'negative' ? 'destructive' : 'secondary'
                            } className={
                              insight.sentiment === 'positive' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                              insight.sentiment === 'negative' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 
                              'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }>
                              {insight.sentiment}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-4">{insight.summary}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                            <span>{formatDate(insight.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        No insights available
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Select a stock from your watchlist to generate AI insights
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item: WatchlistItem) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchAiInsights(item.symbol)}
                              disabled={loadingAiInsightSymbol === item.symbol}
                              className="border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                              {loadingAiInsightSymbol === item.symbol ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                `Analyze ${item.symbol}`
                              )}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* News Feed */}
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Newspaper className="h-5 w-5" />
                    Financial News
                  </CardTitle>
                  <CardDescription className="text-amber-600">
                    Latest news and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {news.length > 0 ? (
                    <div className="space-y-4">
                      {/* Action buttons for news */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Current News</h3>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={refreshNews}
                            disabled={loadingNewsSymbol === currentNewsSymbol}
                            className="flex items-center gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                          >
                            {loadingNewsSymbol === currentNewsSymbol ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Refreshing...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="h-4 w-4" />
                                Refresh
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={clearNews}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {news.map((item: NewsItem, index: number) => (
                          <div key={`${item.id}-${index}`} className="border rounded-xl p-4 bg-white hover:shadow-md transition-all duration-300">
                            <h3 className="font-semibold mb-2 text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{item.summary}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <span className="bg-gray-100 px-2 py-1 rounded">{item.source}</span>
                              <span>{formatDate(item.publishedAt)}</span>
                            </div>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 h-auto text-blue-600 hover:text-blue-800"
                              onClick={() => window.open(item.url, '_blank')}
                            >
                              Read more
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Newspaper className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        No news available
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Select a stock from your watchlist to view related news
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item: WatchlistItem) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchNews(item.symbol)}
                              disabled={loadingNewsSymbol === item.symbol}
                              className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            >
                              {loadingNewsSymbol === item.symbol ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                `View ${item.symbol} News`
                              )}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* AI Features Tab */}
          <TabsContent value="ai" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Stock Recommendations */}
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Target className="h-5 w-5" />
                    Stock Recommendations
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Personalized stock recommendations based on your portfolio and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recommendationsData && recommendationsData.recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="text-center p-2">
                          <p className="text-sm font-medium text-gray-600">Total</p>
                          <p className="text-lg font-bold text-gray-900">{recommendationsData.summary.totalRecommendations}</p>
                        </div>
                        <div className="text-center p-2">
                          <p className="text-sm font-medium text-gray-600">Buy</p>
                          <p className="text-lg font-bold text-green-600">{recommendationsData.summary.buySignals}</p>
                        </div>
                        <div className="text-center p-2">
                          <p className="text-sm font-medium text-gray-600">Sell</p>
                          <p className="text-lg font-bold text-red-600">{recommendationsData.summary.sellSignals}</p>
                        </div>
                        <div className="text-center p-2">
                          <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                          <p className="text-lg font-bold text-gray-900">{(recommendationsData.summary.avgConfidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                      
                      {/* Market Context */}
                      {recommendationsData.marketContext && (
                        <Alert className="mb-4 bg-blue-50 border-blue-200">
                          <Activity className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800">Market Context</AlertTitle>
                          <AlertDescription className="text-blue-700">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="text-center p-2 bg-white rounded-lg">
                                <p className="font-medium">{recommendationsData.marketContext.marketTrend}</p>
                                <p className="text-xs text-gray-500">Trend</p>
                              </div>
                              <div className="text-center p-2 bg-white rounded-lg">
                                <p className="font-medium">{recommendationsData.marketContext.volatility}</p>
                                <p className="text-xs text-gray-500">Volatility</p>
                              </div>
                              <div className="text-center p-2 bg-white rounded-lg">
                                <p className="font-medium">{recommendationsData.marketContext.sentiment}</p>
                                <p className="text-xs text-gray-500">Sentiment</p>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Recommendations List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {recommendationsData.recommendations.map((rec: StockRecommendation) => (
                          <div key={rec.id} className="border rounded-xl p-4 bg-white hover:shadow-md transition-all duration-300">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg text-gray-900">{rec.symbol}</h3>
                                  {rec.companyName && <span className="text-sm text-gray-500">({rec.companyName})</span>}
                                </div>
                                <Badge className={`${getActionColor(rec.action)} text-xs`}>
                                  {rec.action.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                                  rec.confidence > 0.7 ? 'bg-green-100 text-green-700' : 
                                  rec.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {rec.isRead ? <EyeOff className="h-3 w-3 inline mr-1" /> : <Eye className="h-3 w-3 inline mr-1" />}
                                  {(rec.confidence * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-4">{rec.reason}</p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                              {rec.currentPrice && (
                                <div className="p-2 bg-gray-50 rounded-lg">
                                  <span className="text-gray-500 block text-xs">Current:</span>
                                  <div className="font-medium">{formatCurrency(rec.currentPrice)}</div>
                                </div>
                              )}
                              {rec.priceTarget && (
                                <div className="p-2 bg-gray-50 rounded-lg">
                                  <span className="text-gray-500 block text-xs">Target:</span>
                                  <div className="font-medium">{formatCurrency(rec.priceTarget)}</div>
                                </div>
                              )}
                              {rec.upside !== undefined && (
                                <div className="p-2 bg-gray-50 rounded-lg">
                                  <span className="text-gray-500 block text-xs">Upside:</span>
                                  <div className={`font-medium ${rec.upside >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatPercentage(rec.upside)}
                                  </div>
                                </div>
                              )}
                              {rec.downside !== undefined && (
                                <div className="p-2 bg-gray-50 rounded-lg">
                                  <span className="text-gray-500 block text-xs">Downside:</span>
                                  <div className={`font-medium ${rec.downside >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatPercentage(rec.downside)}
                                  </div>
                                </div>
                              )}
                              {rec.timeHorizon && (
                                <div className="p-2 bg-gray-50 rounded-lg">
                                  <span className="text-gray-500 block text-xs">Horizon:</span>
                                  <div className="font-medium capitalize">{rec.timeHorizon}</div>
                                </div>
                              )}
                            </div>
                            {rec.keyMetrics && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="font-medium text-sm text-gray-700 mb-2">Key Metrics</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {rec.keyMetrics.marketCap && <div className="text-xs">Market Cap: ${rec.keyMetrics.marketCap.toLocaleString()}</div>}
                                  {rec.keyMetrics.volume && <div className="text-xs">Volume: {formatVolume(rec.keyMetrics.volume)}</div>}
                                  {rec.keyMetrics.dayHigh && <div className="text-xs">Day High: {formatCurrency(rec.keyMetrics.dayHigh)}</div>}
                                  {rec.keyMetrics.dayLow && <div className="text-xs">Day Low: {formatCurrency(rec.keyMetrics.dayLow)}</div>}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchStockRecommendations}
                        className="w-full border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Refresh Recommendations
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        No recommendations available
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        We're analyzing your portfolio to generate personalized recommendations
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchStockRecommendations}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        Generate Recommendations
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Social Media Sentiment */}
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <MessageCircle className="h-5 w-5" />
                    Social Media Sentiment
                  </CardTitle>
                  <CardDescription className="text-blue-600">
                    Analyze social media sentiment for stocks in your watchlist
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {socialMediaSentiment ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">Overall Sentiment</h3>
                        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          socialMediaSentiment.overallSentiment > 0.1 
                            ? 'text-green-700 bg-green-100' 
                            : socialMediaSentiment.overallSentiment < -0.1 
                            ? 'text-red-700 bg-red-100' 
                            : 'text-gray-700 bg-gray-100'
                        }`}>
                          {socialMediaSentiment.overallSentiment > 0.1 
                            ? 'Positive' 
                            : socialMediaSentiment.overallSentiment < -0.1 
                            ? 'Negative' 
                            : 'Neutral'}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-800">Platform Sentiments</h4>
                        {Object.entries(socialMediaSentiment.platformSentiments).map(([platform, sentiment]) => (
                          <div key={platform} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                            <span className="text-sm capitalize text-gray-700">{platform}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    sentiment > 0.1 
                                      ? 'bg-green-500' 
                                      : sentiment < -0.1 
                                      ? 'bg-red-500' 
                                      : 'bg-gray-500'
                                  }`}
                                  style={{ width: `${Math.abs(sentiment) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{sentiment.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-800">Key Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {socialMediaSentiment.keyTopics.map((topic: string, index: number) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <span className="text-sm text-gray-600">Total Mentions:</span>
                        <span className="font-medium text-gray-900">{socialMediaSentiment.mentions.toLocaleString()}</span>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Select a stock from your watchlist to analyze its social media sentiment
                        </p>
                        {watchlist.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {watchlist.slice(0, 3).map((item: WatchlistItem) => (
                              <Button
                                key={item.id}
                                variant="outline"
                                size="sm"
                                onClick={() => fetchSocialMediaSentiment(item.symbol)}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                Analyze {item.symbol}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        No sentiment data available
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Select a stock from your watchlist to analyze its social media sentiment
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item: WatchlistItem) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchSocialMediaSentiment(item.symbol)}
                              className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              Analyze {item.symbol}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Pattern Recognition */}
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <BarChart3 className="h-5 w-5" />
                    Pattern Recognition
                  </CardTitle>
                  <CardDescription className="text-purple-600">
                    Identify technical patterns in stock price charts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {patternRecognition.length > 0 ? (
                    <div className="space-y-4">
                      {patternRecognition.map((pattern: PatternRecognitionResult, index: number) => (
                        <div key={index} className="border rounded-xl p-4 bg-white hover:shadow-md transition-all duration-300">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{pattern.patternType.replace('_', ' ').toUpperCase()}</h3>
                            <span className="text-sm text-gray-500">
                              {(pattern.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{pattern.description}</p>
                          <p className="text-sm text-gray-600">{pattern.implications}</p>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Select a stock from your watchlist to recognize patterns in its chart
                        </p>
                        {watchlist.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {watchlist.slice(0, 3).map((item: WatchlistItem) => (
                              <Button
                                key={item.id}
                                variant="outline"
                                size="sm"
                                onClick={() => fetchPatternRecognition(item.symbol)}
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                              >
                                Analyze {item.symbol}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        No patterns detected
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Select a stock from your watchlist to recognize patterns in its chart
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item: WatchlistItem) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchPatternRecognition(item.symbol)}
                              className="border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                              Analyze {item.symbol}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Price Prediction */}
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <TrendingUp className="h-5 w-5" />
                    Price Prediction
                  </CardTitle>
                  <CardDescription className="text-amber-600">
                    AI-powered stock price predictions using machine learning models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pricePrediction ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">Predicted Price</h3>
                        <span className="text-sm text-gray-500">
                          {pricePrediction.timeframe}
                        </span>
                      </div>
                      
                      <div className="text-center py-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                        <div className="text-3xl font-bold text-amber-700">
                          {formatCurrency(pricePrediction.prediction)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {(pricePrediction.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-800">Key Factors</h4>
                        <ul className="space-y-2">
                          {pricePrediction.factors.map((factor: string, index: number) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start">
                              <span className="text-amber-500 mr-2 mt-1">•</span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Select a stock from your watchlist to predict its price
                        </p>
                        {watchlist.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {watchlist.slice(0, 3).map((item: WatchlistItem) => (
                              <Button
                                key={item.id}
                                variant="outline"
                                size="sm"
                                onClick={() => fetchPricePrediction(item.symbol)}
                                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                              >
                                Predict {item.symbol}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        No predictions available
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Select a stock from your watchlist to predict its price
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item: WatchlistItem) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchPricePrediction(item.symbol)}
                              className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            >
                              Predict {item.symbol}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Fraud Detection */}
              <Card className="md:col-span-2 bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <Shield className="h-5 w-5" />
                    Fraud Detection
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    Detect potential fraudulent activities in trading patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fraudAlerts.length > 0 ? (
                    <div className="space-y-4">
                      {fraudAlerts.map((alert: FraudAlertResult, index: number) => (
                        <Alert key={index} className={`${getAlertTypeColor(alert.alertType)} border-l-4`}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>{alert.alertType.replace('_', ' ').toUpperCase()}</AlertTitle>
                          <AlertDescription>
                            <p className="mb-2">{alert.description}</p>
                            <p className="mb-2">Confidence: {(alert.confidence * 100).toFixed(0)}%</p>
                            {alert.indicators.length > 0 && (
                              <div className="mt-2">
                                <p className="font-medium mb-1">Indicators:</p>
                                <ul className="list-disc list-inside">
                                  {alert.indicators.map((indicator: string, i: number) => (
                                    <li key={i} className="text-sm">{indicator}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Select a stock from your watchlist to detect potential fraud
                        </p>
                        {watchlist.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {watchlist.slice(0, 3).map((item: WatchlistItem) => (
                              <Button
                                key={item.id}
                                variant="outline"
                                size="sm"
                                onClick={() => fetchFraudAlerts(item.symbol)}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                Analyze {item.symbol}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        No fraud alerts detected
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Select a stock from your watchlist to detect potential fraud
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item: WatchlistItem) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchFraudAlerts(item.symbol)}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              Analyze {item.symbol}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Trading Strategies Tab */}
          <TabsContent value="strategies" className="space-y-4">
            {renderTradingStrategiesTab()}
            {renderMarketTrendForecast()}
            
            {/* Financial Chatbot */}
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 pb-4">
                <CardTitle className="flex items-center gap-2 text-indigo-800">
                  <MessageCircle className="h-5 w-5" />
                  Financial Assistant Chatbot
                </CardTitle>
                <CardDescription className="text-indigo-600">
                  Ask questions about your portfolio, stocks, or financial markets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-64 overflow-y-auto border rounded-xl p-4 bg-gradient-to-b from-gray-50 to-gray-100">
                    {chatbotMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Ask me anything about your portfolio or the markets</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatbotMessages.map((message: ChatbotMessage) => (
                          <div key={message.id} className="space-y-2">
                            <div className="flex justify-end">
                              <div className="max-w-xs bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-3">
                                <p className="text-sm">{message.query}</p>
                                <p className="text-xs opacity-75 mt-1 text-right">
                                  {formatTime(message.timestamp)}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-start">
                              <div className="max-w-xs bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-xl p-3">
                                <p className="text-sm">{message.response}</p>
                                <p className="text-xs opacity-75 mt-1">
                                  {formatTime(message.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask a question about your portfolio or the markets..."
                      value={chatbotQuery}
                      onChange={(e) => setChatbotQuery(e.target.value)}
                      className="flex-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      rows={2}
                    />
                    <Button 
                      onClick={processChatbotQuery}
                      disabled={isProcessingChatbotQuery || !chatbotQuery.trim()}
                      className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800"
                    >
                      {isProcessingChatbotQuery ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
                    This AI assistant provides general financial information and is not a substitute for professional financial advice.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Market Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Watchlist</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{watchlist.length}</div>
              <p className="text-xs text-gray-500">
                {watchlist.length === 1 ? '1 symbol tracked' : `${watchlist.length} symbols tracked`}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0))}
              </div>
              <p className="text-xs text-gray-500">
                {portfolio.length} holdings
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Today&apos;s Gain/Loss</CardTitle>
              {portfolio.reduce((sum, item) => sum + (item.profit || 0), 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                portfolio.reduce((sum, item) => sum + (item.profit || 0), 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatPercentage(portfolio.reduce((sum, item) => sum + (item.profitPercent || 0), 0) / portfolio.length || 0)}
              </div>
              <p className="text-xs text-gray-500">
                Average performance
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Market Status</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Open</div>
              <p className="text-xs text-gray-500">
                US Markets (Live Data)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Floating Chatbot Button */}
        <Button
          className="fixed bottom-6 right-6 z-40 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800"
          onClick={() => setIsChatbotOpen(true)}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>

        {/* Advanced Chatbot Component */}
        {isChatbotOpen && (
          <AdvancedChatbot
            isOpen={isChatbotOpen}
            onClose={() => setIsChatbotOpen(false)}
          />
        )}
      </div>
    </div>
  );
}