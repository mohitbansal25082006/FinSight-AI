// F:\finsight-ai\src\app\dashboard\page.tsx
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
  Maximize2, Download, Upload, Eye, EyeOff, CheckCircle, XCircle, Clock, Calendar, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { Inter } from 'next/font/google';

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

interface TradingStrategy {
  name: string;
  description: string;
  parameters: Record<string, any>;
  performance?: Record<string, any>;
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

  // Fetch initial data
  useEffect(() => {
    fetchWatchlist();
    fetchPortfolio();
    fetchStockRecommendations();
    fetchMarketTrendForecast();
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

  const fetchTradingStrategies = async () => {
    try {
      const response = await fetch('/api/ai/strategies');
      
      if (response.ok) {
        const data = await response.json();
        setTradingStrategies(data);
        toast.success('Trading strategies generated');
      } else {
        console.error('Failed to fetch trading strategies');
      }
    } catch (error) {
      console.error('Error fetching trading strategies:', error);
      toast.error('Failed to generate trading strategies');
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

  const fetchMarketTrendForecast = async () => {
    try {
      const response = await fetch('/api/ai/forecast');
      
      if (response.ok) {
        const data = await response.json();
        setMarketTrendForecast(data);
      } else {
        console.error('Failed to fetch market trend forecast');
      }
    } catch (error) {
      console.error('Error fetching market trend forecast:', error);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: string | number) => {
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

  const formatVolume = (volume: number | undefined) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading skeleton component
  const StockCardSkeleton = () => (
    <Card>
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
  const getSentimentColor = (sentiment: string) => {
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
  const getActionColor = (action: string) => {
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
  const getTrendColor = (trend: string) => {
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
  const getAlertTypeColor = (alertType: string) => {
    switch (alertType) {
      case 'pump_and_dump':
      case 'wash_trading':
      case 'insider_trading':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 ${inter.className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {session?.user?.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Track your investments and market insights
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <Button
              onClick={refreshStockData}
              disabled={refreshing || loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Badge variant="outline" className="text-sm">
              Real-time Data
            </Badge>
          </div>
        </div>
        
        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Stocks &amp; Crypto
            </CardTitle>
            <CardDescription>
              Find and add stocks or cryptocurrencies to your watchlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter symbol or company name (e.g., AAPL, Tesla, Microsoft)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchStocks()}
                className="flex-1"
              />
              <Button onClick={searchStocks} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Enhanced search results section */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">
                  Found {searchResults.length} results for &quot;{searchQuery}&quot;
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((stock, index) => (
                    <div key={`${stock.symbol}-${index}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-600">{stock.symbol}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{stock.type}</span>
                          {stock.matchScore && (
                            <span className="text-xs text-gray-500">
                              Match: {Math.round(parseFloat(stock.matchScore) * 100)}%
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-800 font-medium mt-1">{stock.name}</div>
                        <div className="text-xs text-gray-500">
                          {stock.region} • {stock.currency}
                          {stock.marketOpen && stock.marketClose && (
                            <> • Market: {stock.marketOpen} - {stock.marketClose}</>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => selectStock(stock.symbol)}
                          disabled={loading}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addToWatchlist(stock)}
                          className="flex items-center gap-1"
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
                  className="mt-2"
                >
                  Clear Results
                </Button>
              </div>
            )}
            
            {/* Add loading state display */}
            {loading && searchQuery && (
              <div className="mt-4 text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <span className="text-sm text-gray-500">Searching for &quot;{searchQuery}&quot;...</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Main Dashboard Content */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="watchlist" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Watchlist
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Features
            </TabsTrigger>
            <TabsTrigger value="strategies" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Strategies
            </TabsTrigger>
          </TabsList>
          
          {/* Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-4">
            {watchlist.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Your watchlist is empty
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by searching and adding stocks or cryptocurrencies above
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {watchlist.map((item) => {
                  const data = stockData[item.symbol];
                  const isLoading = loading && !data;
                  
                  if (isLoading) {
                    return <StockCardSkeleton key={item.id} />;
                  }
                  
                  return (
                    <Card key={item.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-bold">{item.symbol}</CardTitle>
                            <CardDescription className="text-sm line-clamp-1">
                              {item.name}
                            </CardDescription>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {item.type.toUpperCase()}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromWatchlist(item.symbol)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {data ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold">
                                {formatCurrency(data.price)}
                              </span>
                              <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
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
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex justify-between">
                                <span>Change:</span>
                                <span className={data.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {data.change >= 0 ? '+' : ''}{formatCurrency(data.change)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Open:</span>
                                <span>{formatCurrency(data.open)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>High:</span>
                                <span className="text-green-600">{formatCurrency(data.high)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Low:</span>
                                <span className="text-red-600">{formatCurrency(data.low)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Volume:</span>
                                <span>{formatVolume(data.volume)}</span>
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchChartData(item.symbol)}
                                disabled={chartLoading}
                                className="w-full flex items-center gap-2"
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
                          <div className="text-center py-4">
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
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {selectedStock} Price Chart
                      {stockData[selectedStock] && (
                        <div className={`ml-auto flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${
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
                        <SelectTrigger className="w-24">
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
                        <SelectTrigger className="w-24">
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
                      >
                        {showAdvancedChart ? <Minimize className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        {showAdvancedChart ? 'Simple' : 'Advanced'}
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Historical price data for the last 30 trading days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'line' ? (
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${value.toFixed(2)}`}
                          />
                          <Tooltip
                            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            formatter={(value: number, name) => [
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
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${value.toFixed(2)}`}
                          />
                          <Tooltip
                            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            formatter={(value: number, name) => [
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
                        // Candlestick chart would require a custom implementation
                        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${value.toFixed(2)}`}
                          />
                          <Tooltip
                            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
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
                          <Bar
                            dataKey="high"
                            fill="#10b981"
                            shape={(props: any) => {
                              const { x, y, width, payload } = props;
                              const height = y - payload.low * (y / payload.high);
                              return <rect x={x} y={payload.low * (y / payload.high)} width={width} height={height} fill="#10b981" />;
                            }}
                          />
                          <Bar
                            dataKey="low"
                            fill="#ef4444"
                            shape={(props: any) => {
                              const { x, y, width, payload } = props;
                              const height = payload.high * (y / payload.high) - y;
                              return <rect x={x} y={y} width={width} height={height} fill="#ef4444" />;
                            }}
                          />
                        </ComposedChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Chart Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    {chartData.length > 0 && (
                      <>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">30-Day High</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(Math.max(...chartData.map(d => d.high)))}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">30-Day Low</p>
                          <p className="text-lg font-semibold text-red-600">
                            {formatCurrency(Math.min(...chartData.map(d => d.low)))}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Avg Volume</p>
                          <p className="text-lg font-semibold">
                            {formatVolume(chartData.reduce((sum, d) => sum + d.volume, 0) / chartData.length)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Data Points</p>
                          <p className="text-lg font-semibold">
                            {chartData.length} days
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Advanced Chart Features */}
                  {showAdvancedChart && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Technical Indicators</h3>
                        <div className="flex items-center gap-2">
                          <Select value={chartIndicators.join(',')} onValueChange={(value) => setChartIndicators(value.split(','))}>
                            <SelectTrigger className="w-48">
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
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Analyze
                          </Button>
                        </div>
                      </div>
                      
                      {/* Pattern Recognition Results */}
                      {patternRecognition.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-md font-medium mb-2">Pattern Recognition</h4>
                          <div className="space-y-2">
                            {patternRecognition.map((pattern, index) => (
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
                          <h4 className="text-md font-medium mb-2">Price Prediction</h4>
                          <Alert className="bg-purple-50 border-purple-200">
                            <Target className="h-4 w-4 text-purple-600" />
                            <AlertTitle className="text-purple-800">
                              Predicted Price: {formatCurrency(pricePrediction.prediction)} ({pricePrediction.timeframe})
                            </AlertTitle>
                            <AlertDescription className="text-purple-700">
                              Confidence: {(pricePrediction.confidence * 100).toFixed(0)}%
                              <ul className="mt-2 list-disc list-inside">
                                {pricePrediction.factors.map((factor, index) => (
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
              <Card>
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
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No chart selected
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Click &quot;View Chart&quot; on any stock in your watchlist to display its price chart here
                  </p>
                  {watchlist.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {watchlist.slice(0, 5).map((item) => (
                        <Button
                          key={item.id}
                          variant="outline"
                          size="sm"
                          onClick={() => fetchChartData(item.symbol)}
                          disabled={chartLoading}
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
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Portfolio Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Value</span>
                      <span className="font-semibold">
                        {formatCurrency(portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Profit/Loss</span>
                      <span className={`font-semibold ${
                        portfolio.reduce((sum, item) => sum + (item.profit || 0), 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(portfolio.reduce((sum, item) => sum + (item.profit || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Today&apos;s Change</span>
                      <span className="font-semibold text-green-600">+1.2%</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cash</span>
                      <span className="font-semibold">
                        {formatCurrency(10000 - portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invested</span>
                      <span className="font-semibold">
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
                      className="w-full"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Optimize Portfolio
                    </Button>
                    <Dialog open={isPortfolioDialogOpen} onOpenChange={setIsPortfolioDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          onClick={openAddToPortfolioDialog}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Portfolio
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add to Portfolio</DialogTitle>
                          <DialogDescription>
                            Enter the details of your investment
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="symbol">Symbol</Label>
                            <Input
                              id="symbol"
                              placeholder="e.g., AAPL"
                              value={portfolioForm.symbol}
                              onChange={(e) => setPortfolioForm({...portfolioForm, symbol: e.target.value.toUpperCase()})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="quantity">Quantity</Label>
                              <Input
                                id="quantity"
                                type="number"
                                placeholder="0"
                                value={portfolioForm.quantity}
                                onChange={(e) => setPortfolioForm({...portfolioForm, quantity: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="buyPrice">Buy Price ($)</Label>
                              <Input
                                id="buyPrice"
                                type="number"
                                placeholder="0.00"
                                value={portfolioForm.buyPrice}
                                onChange={(e) => setPortfolioForm({...portfolioForm, buyPrice: e.target.value})}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="type">Type</Label>
                            <Select value={portfolioForm.type} onValueChange={(value) => setPortfolioForm({...portfolioForm, type: value})}>
                              <SelectTrigger>
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
                            className="w-full"
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
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Your Holdings</CardTitle>
                  <CardDescription>
                    Track your investments and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {portfolio.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Your portfolio is empty
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Add stocks or cryptocurrencies to start tracking your investments
                      </p>
                      <Dialog open={isPortfolioDialogOpen} onOpenChange={setIsPortfolioDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Portfolio
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add to Portfolio</DialogTitle>
                            <DialogDescription>
                              Enter the details of your investment
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="symbol">Symbol</Label>
                              <Input
                                id="symbol"
                                placeholder="e.g., AAPL"
                                value={portfolioForm.symbol}
                                onChange={(e) => setPortfolioForm({...portfolioForm, symbol: e.target.value.toUpperCase()})}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  placeholder="0"
                                  value={portfolioForm.quantity}
                                  onChange={(e) => setPortfolioForm({...portfolioForm, quantity: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="buyPrice">Buy Price ($)</Label>
                                <Input
                                  id="buyPrice"
                                  type="number"
                                  placeholder="0.00"
                                  value={portfolioForm.buyPrice}
                                  onChange={(e) => setPortfolioForm({...portfolioForm, buyPrice: e.target.value})}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="type">Type</Label>
                              <Select value={portfolioForm.type} onValueChange={(value) => setPortfolioForm({...portfolioForm, type: value})}>
                                <SelectTrigger>
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
                              className="w-full"
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
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Avg Cost</TableHead>
                            <TableHead>Current Price</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Profit/Loss</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {portfolio.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.symbol}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{formatCurrency(item.buyPrice)}</TableCell>
                              <TableCell>{formatCurrency(item.currentPrice || 0)}</TableCell>
                              <TableCell>{formatCurrency(item.totalValue || 0)}</TableCell>
                              <TableCell className={item.profit && item.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {item.profitPercent ? formatPercentage(item.profitPercent) : '0.00%'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromPortfolio(item.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {/* Portfolio Allocation */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
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
                                    {portfolioAllocation.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Portfolio Performance */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <TrendingUp className="h-5 w-5" />
                              Performance
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={portfolioPerformance}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                  <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Portfolio Optimization Results */}
                      {portfolioOptimization && (
                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Brain className="h-5 w-5" />
                              AI Portfolio Optimization
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Recommendations</h4>
                                <div className="space-y-2">
                                  {portfolioOptimization.recommendations && Array.isArray(portfolioOptimization.recommendations) ? (
                                    portfolioOptimization.recommendations.map((rec: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div>
                                          <span className="font-medium">{rec.symbol}</span>
                                          <span className={`ml-2 px-2 py-1 rounded text-xs ${getActionColor(rec.action)}`}>
                                            {rec.action.toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm">{rec.currentAllocation}% → {rec.recommendedAllocation}%</div>
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
                                <div>
                                  <h4 className="font-medium mb-2">Suggested Additions</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {portfolioOptimization.suggestedAdditions && Array.isArray(portfolioOptimization.suggestedAdditions) ? (
                                      portfolioOptimization.suggestedAdditions.map((symbol: string, index: number) => (
                                        <Badge key={index} variant="outline">{symbol}</Badge>
                                      ))
                                    ) : (
                                      <p className="text-gray-500">None</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Suggested Removals</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {portfolioOptimization.suggestedRemovals && Array.isArray(portfolioOptimization.suggestedRemovals) ? (
                                      portfolioOptimization.suggestedRemovals.map((symbol: string, index: number) => (
                                        <Badge key={index} variant="outline" className="text-red-600 border-red-600">{symbol}</Badge>
                                      ))
                                    ) : (
                                      <p className="text-gray-500">None</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Expected Improvement</h4>
                                <p className="text-sm text-gray-600">{portfolioOptimization.expectedImprovement}</p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Rebalancing Frequency</h4>
                                <p className="text-sm text-gray-600">{portfolioOptimization.rebalancingFrequency}</p>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Insights
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis and predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiInsights.length > 0 ? (
                    <div className="space-y-4">
                      {/* Action buttons for AI insights */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Current Insight</h3>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={regenerateAiInsight}
                            disabled={loadingAiInsightSymbol === currentInsightSymbol}
                            className="flex items-center gap-1"
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
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      
                      {aiInsights.map((insight, index) => (
                        <div key={`${insight.id}-${index}`} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{insight.title}</h3>
                            <Badge variant={
                              insight.sentiment === 'positive' ? 'default' : 
                              insight.sentiment === 'negative' ? 'destructive' : 'secondary'
                            }>
                              {insight.sentiment}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{insight.summary}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                            <span>{formatDate(insight.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No insights available
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Select a stock from your watchlist to generate AI insights
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchAiInsights(item.symbol)}
                              disabled={loadingAiInsightSymbol === item.symbol}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    Financial News
                  </CardTitle>
                  <CardDescription>
                    Latest news and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {news.length > 0 ? (
                    <div className="space-y-4">
                      {/* Action buttons for news */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Current News</h3>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={refreshNews}
                            disabled={loadingNewsSymbol === currentNewsSymbol}
                            className="flex items-center gap-1"
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
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {news.map((item, index) => (
                          <div key={`${item.id}-${index}`} className="border rounded-lg p-4 hover:bg-gray-50">
                            <h3 className="font-semibold mb-2">{item.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.summary}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{item.source}</span>
                              <span>{formatDate(item.publishedAt)}</span>
                            </div>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 h-auto text-blue-600"
                              onClick={() => window.open(item.url, '_blank')}
                            >
                              Read more
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Newspaper className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No news available
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Select a stock from your watchlist to view related news
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchNews(item.symbol)}
                              disabled={loadingNewsSymbol === item.symbol}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Stock Recommendations
                  </CardTitle>
                  <CardDescription>
                    Personalized stock recommendations based on your portfolio and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recommendationsData && recommendationsData.recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600">Total</p>
                          <p className="text-lg font-bold">{recommendationsData.summary.totalRecommendations}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600">Buy</p>
                          <p className="text-lg font-bold text-green-600">{recommendationsData.summary.buySignals}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600">Sell</p>
                          <p className="text-lg font-bold text-red-600">{recommendationsData.summary.sellSignals}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                          <p className="text-lg font-bold">{(recommendationsData.summary.avgConfidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                      
                      {/* Market Context */}
                      {recommendationsData.marketContext && (
                        <Alert className="mb-4">
                          <Activity className="h-4 w-4" />
                          <AlertTitle>Market Context</AlertTitle>
                          <AlertDescription>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="text-center">
                                <p className="font-medium">{recommendationsData.marketContext.marketTrend}</p>
                                <p className="text-xs text-gray-500">Trend</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium">{recommendationsData.marketContext.volatility}</p>
                                <p className="text-xs text-gray-500">Volatility</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium">{recommendationsData.marketContext.sentiment}</p>
                                <p className="text-xs text-gray-500">Sentiment</p>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Recommendations List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {recommendationsData.recommendations.map((rec) => (
                          <div key={rec.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{rec.symbol}</h3>
                                  {rec.companyName && <span className="text-sm text-gray-500">({rec.companyName})</span>}
                                </div>
                                <Badge className={getActionColor(rec.action)}>
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
                            <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              {rec.currentPrice && (
                                <div>
                                  <span className="text-gray-500">Current:</span>
                                  <div className="font-medium">{formatCurrency(rec.currentPrice)}</div>
                                </div>
                              )}
                              {rec.priceTarget && (
                                <div>
                                  <span className="text-gray-500">Target:</span>
                                  <div className="font-medium">{formatCurrency(rec.priceTarget)}</div>
                                </div>
                              )}
                              {rec.upside !== undefined && (
                                <div>
                                  <span className="text-gray-500">Upside:</span>
                                  <div className={`font-medium ${rec.upside >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatPercentage(rec.upside)}
                                  </div>
                                </div>
                              )}
                              {rec.timeHorizon && (
                                <div>
                                  <span className="text-gray-500">Horizon:</span>
                                  <div className="font-medium capitalize">{rec.timeHorizon}</div>
                                </div>
                              )}
                            </div>
                            {rec.keyMetrics && (
                              <div className="mt-2 pt-2 border-t text-xs">
                                <p className="font-medium mb-1">Key Metrics</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {rec.keyMetrics.marketCap && <div>Market Cap: ${rec.keyMetrics.marketCap.toLocaleString()}</div>}
                                  {rec.keyMetrics.volume && <div>Volume: {formatVolume(rec.keyMetrics.volume)}</div>}
                                  {rec.keyMetrics.dayHigh && <div>Day High: {formatCurrency(rec.keyMetrics.dayHigh)}</div>}
                                  {rec.keyMetrics.dayLow && <div>Day Low: {formatCurrency(rec.keyMetrics.dayLow)}</div>}
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
                        className="w-full"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Refresh Recommendations
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No recommendations available
                      </h3>
                      <p className="text-gray-600 mb-4">
                        We're analyzing your portfolio to generate personalized recommendations
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchStockRecommendations}
                      >
                        Generate Recommendations
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Social Media Sentiment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Social Media Sentiment
                  </CardTitle>
                  <CardDescription>
                    Analyze social media sentiment for stocks in your watchlist
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {socialMediaSentiment ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Overall Sentiment</h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Platform Sentiments</h4>
                        {Object.entries(socialMediaSentiment.platformSentiments).map(([platform, sentiment]) => (
                          <div key={platform} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{platform}</span>
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
                                ></div>
                              </div>
                              <span className="text-sm">{sentiment.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Key Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {socialMediaSentiment.keyTopics.map((topic, index) => (
                            <Badge key={index} variant="outline">{topic}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Total Mentions:</span>
                        <span className="font-medium">{socialMediaSentiment.mentions.toLocaleString()}</span>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          Select a stock from your watchlist to analyze its social media sentiment
                        </p>
                        {watchlist.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {watchlist.slice(0, 3).map((item) => (
                              <Button
                                key={item.id}
                                variant="outline"
                                size="sm"
                                onClick={() => fetchSocialMediaSentiment(item.symbol)}
                              >
                                Analyze {item.symbol}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No sentiment data available
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Select a stock from your watchlist to analyze its social media sentiment
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchSocialMediaSentiment(item.symbol)}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Pattern Recognition
                  </CardTitle>
                  <CardDescription>
                    Identify technical patterns in stock price charts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {patternRecognition.length > 0 ? (
                    <div className="space-y-4">
                      {patternRecognition.map((pattern, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{pattern.patternType.replace('_', ' ').toUpperCase()}</h3>
                            <span className="text-sm text-gray-500">
                              {(pattern.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{pattern.description}</p>
                          <p className="text-sm text-gray-500">{pattern.implications}</p>
                        </div>
                      ))}
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          Select a stock from your watchlist to recognize patterns in its chart
                        </p>
                        {watchlist.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {watchlist.slice(0, 3).map((item) => (
                              <Button
                                key={item.id}
                                variant="outline"
                                size="sm"
                                onClick={() => fetchPatternRecognition(item.symbol)}
                              >
                                Analyze {item.symbol}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No patterns detected
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Select a stock from your watchlist to recognize patterns in its chart
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchPatternRecognition(item.symbol)}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Price Prediction
                  </CardTitle>
                  <CardDescription>
                    AI-powered stock price predictions using machine learning models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pricePrediction ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Predicted Price</h3>
                        <span className="text-sm text-gray-500">
                          {pricePrediction.timeframe}
                        </span>
                      </div>
                      
                      <div className="text-center py-4">
                        <div className="text-3xl font-bold text-blue-600">
                          {formatCurrency(pricePrediction.prediction)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {(pricePrediction.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Key Factors</h4>
                        <ul className="space-y-1">
                          {pricePrediction.factors.map((factor, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          Select a stock from your watchlist to predict its price
                        </p>
                        {watchlist.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {watchlist.slice(0, 3).map((item) => (
                              <Button
                                key={item.id}
                                variant="outline"
                                size="sm"
                                onClick={() => fetchPricePrediction(item.symbol)}
                              >
                                Predict {item.symbol}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No predictions available
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Select a stock from your watchlist to predict its price
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchPricePrediction(item.symbol)}
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
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Fraud Detection
                  </CardTitle>
                  <CardDescription>
                    Detect potential fraudulent activities in trading patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fraudAlerts.length > 0 ? (
                    <div className="space-y-4">
                      {fraudAlerts.map((alert, index) => (
                        <Alert key={index} className={getAlertTypeColor(alert.alertType)}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>{alert.alertType.replace('_', ' ').toUpperCase()}</AlertTitle>
                          <AlertDescription>
                            <p>{alert.description}</p>
                            <p className="mt-2">Confidence: {(alert.confidence * 100).toFixed(0)}%</p>
                            {alert.indicators.length > 0 && (
                              <div className="mt-2">
                                <p className="font-medium">Indicators:</p>
                                <ul className="list-disc list-inside">
                                  {alert.indicators.map((indicator, i) => (
                                    <li key={i} className="text-sm">{indicator}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          Select a stock from your watchlist to detect potential fraud
                        </p>
                        {watchlist.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {watchlist.slice(0, 3).map((item) => (
                              <Button
                                key={item.id}
                                variant="outline"
                                size="sm"
                                onClick={() => fetchFraudAlerts(item.symbol)}
                              >
                                Analyze {item.symbol}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No fraud alerts detected
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Select a stock from your watchlist to detect potential fraud
                      </p>
                      {watchlist.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {watchlist.slice(0, 3).map((item) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              onClick={() => fetchFraudAlerts(item.symbol)}
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
            <div className="grid gap-4 md:grid-cols-2">
              {/* Trading Strategies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Automated Trading Strategies
                  </CardTitle>
                  <CardDescription>
                    AI-generated trading strategies based on your risk profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tradingStrategies.length > 0 ? (
                    <div className="space-y-4">
                      {tradingStrategies.map((strategy, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{strategy.name}</h3>
                            <Button size="sm" variant="outline">
                              {strategy.performance ? 'Active' : 'Activate'}
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                          
                          {strategy.parameters && (
                            <div className="space-y-2 mb-3">
                              <h4 className="font-medium text-sm">Parameters</h4>
                              <div className="bg-gray-50 p-2 rounded text-xs">
                                {Object.entries(strategy.parameters).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium">{key}:</span>
                                    <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {strategy.performance && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Performance</h4>
                              <div className="bg-gray-50 p-2 rounded text-xs">
                                {Object.entries(strategy.performance).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium">{key}:</span>
                                    <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchTradingStrategies}
                        className="w-full"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Refresh Strategies
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No strategies available
                      </h3>
                      <p className="text-gray-600 mb-4">
                        We're generating personalized trading strategies based on your risk profile
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchTradingStrategies}
                      >
                        Generate Strategies
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Market Trend Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Market Trend Forecast
                  </CardTitle>
                  <CardDescription>
                    AI-powered market trend analysis and predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {marketTrendForecast ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Overall Trend</h3>
                        <Badge className={getTrendColor(marketTrendForecast.trend)}>
                          {marketTrendForecast.trend.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="text-center py-2">
                        <div className="text-sm text-gray-500">
                          {(marketTrendForecast.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Key Indicators</h4>
                        <ul className="space-y-1">
                          {marketTrendForecast.keyIndicators.map((indicator, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {indicator}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Potential Catalysts</h4>
                        <ul className="space-y-1">
                          {marketTrendForecast.catalysts.map((catalyst, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {catalyst}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Sector Expectations</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(marketTrendForecast.sectorExpectations).map(([sector, expectation]) => (
                            <div key={sector} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{sector}:</span>
                              <Badge variant="outline" className={getTrendColor(expectation)}>
                                {expectation}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Risk Factors</h4>
                        <ul className="space-y-1">
                          {marketTrendForecast.riskFactors.map((risk, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchMarketTrendForecast}
                        className="w-full"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Refresh Forecast
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No forecast available
                      </h3>
                      <p className="text-gray-600 mb-4">
                        We're analyzing market data to generate trend forecasts
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchMarketTrendForecast}
                      >
                        Generate Forecast
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Financial Chatbot */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Financial Assistant Chatbot
                </CardTitle>
                <CardDescription>
                  Ask questions about your portfolio, stocks, or financial markets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                    {chatbotMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Ask me anything about your portfolio or the markets</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatbotMessages.map((message) => (
                          <div key={message.id} className="space-y-2">
                            <div className="flex justify-end">
                              <div className="max-w-xs bg-blue-500 text-white rounded-lg p-3">
                                <p className="text-sm">{message.query}</p>
                                <p className="text-xs opacity-75 mt-1 text-right">
                                  {formatTime(message.timestamp)}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-start">
                              <div className="max-w-xs bg-gray-200 text-gray-800 rounded-lg p-3">
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
                      className="flex-1"
                      rows={2}
                    />
                    <Button 
                      onClick={processChatbotQuery}
                      disabled={isProcessingChatbotQuery || !chatbotQuery.trim()}
                    >
                      {isProcessingChatbotQuery ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    This AI assistant provides general financial information and is not a substitute for professional financial advice.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Market Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Watchlist</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{watchlist.length}</div>
              <p className="text-xs text-muted-foreground">
                {watchlist.length === 1 ? '1 symbol tracked' : `${watchlist.length} symbols tracked`}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                {portfolio.length} holdings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Gain/Loss</CardTitle>
              {portfolio.reduce((sum, item) => sum + (item.profit || 0), 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
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
              <p className="text-xs text-muted-foreground">
                Average performance
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Open</div>
              <p className="text-xs text-muted-foreground">
                US Markets (Live Data)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}