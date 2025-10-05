// F:\finsight-ai\src\lib\market-utils.ts
export interface MarketData {
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
}

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  name: string;
  values: number[];
  signals: string[];
}

export interface PatternData {
  patternType: string;
  confidence: number;
  startPoint: number;
  endPoint: number;
  description: string;
}

export class MarketUtils {
  /**
   * Format currency values with proper locale and precision
   */
  static formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Format percentage values with proper sign and precision
   */
  static formatPercentage(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const sign = numValue >= 0 ? '+' : '';
    return `${sign}${numValue.toFixed(2)}%`;
  }

  /**
   * Format large volume numbers with K/M/B suffixes
   */
  static formatVolume(volume: number): string {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString();
  }

  /**
   * Get color class based on price change
   */
  static getChangeColor(change: number): string {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  }

  /**
   * Get background color class based on price change
   */
  static getChangeBgColor(change: number): string {
    return change >= 0 
      ? 'text-green-700 bg-green-100' 
      : 'text-red-700 bg-red-100';
  }

  /**
   * Calculate simple moving average
   */
  static calculateSMA(data: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  /**
   * Calculate exponential moving average
   */
  static calculateEMA(data: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for the first EMA value
    const initialSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(initialSMA);
    
    // Calculate EMA for the rest of the data
    for (let i = period; i < data.length; i++) {
      const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }
    
    return ema;
  }

  /**
   * Calculate Relative Strength Index (RSI)
   */
  static calculateRSI(data: number[], period: number = 14): number[] {
    if (data.length < period + 1) return [];
    
    const rsi: number[] = [];
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gains and losses
    for (let i = 1; i <= period; i++) {
      const difference = data[i] - data[i - 1];
      if (difference > 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate initial RSI
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
    
    // Calculate RSI for the rest of the data
    for (let i = period + 1; i < data.length; i++) {
      const difference = data[i] - data[i - 1];
      
      if (difference > 0) {
        avgGain = (avgGain * (period - 1) + difference) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - difference) / period;
      }
      
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
    
    return rsi;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  static calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
    macd: number[];
    signal: number[];
    histogram: number[];
  } {
    const fastEMA = this.calculateEMA(data, fastPeriod);
    const slowEMA = this.calculateEMA(data, slowPeriod);
    
    // Calculate MACD line
    const startIndex = slowPeriod - fastPeriod;
    const macd: number[] = [];
    for (let i = 0; i < fastEMA.length - startIndex; i++) {
      macd.push(fastEMA[i + startIndex] - slowEMA[i]);
    }
    
    // Calculate signal line
    const signal = this.calculateEMA(macd, signalPeriod);
    
    // Calculate histogram
    const histogram: number[] = [];
    for (let i = 0; i < signal.length; i++) {
      histogram.push(macd[i + (macd.length - signal.length)] - signal[i]);
    }
    
    return { macd, signal, histogram };
  }

  /**
   * Calculate Bollinger Bands
   */
  static calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2): {
    upperBand: number[];
    middleBand: number[];
    lowerBand: number[];
  } {
    const middleBand = this.calculateSMA(data, period);
    const upperBand: number[] = [];
    const lowerBand: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      
      // Calculate standard deviation
      const squaredDiffs = slice.map(value => Math.pow(value - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upperBand.push(mean + (standardDeviation * stdDev));
      lowerBand.push(mean - (standardDeviation * stdDev));
    }
    
    return { upperBand, middleBand, lowerBand };
  }

  /**
   * Identify support and resistance levels
   */
  static identifySupportResistance(data: ChartDataPoint[], windowSize: number = 5): {
    support: number[];
    resistance: number[];
  } {
    const support: number[] = [];
    const resistance: number[] = [];
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      const currentLow = data[i].low;
      const currentHigh = data[i].high;
      
      // Check if current low is the lowest in the window (support)
      let isSupport = true;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i && data[j].low < currentLow) {
          isSupport = false;
          break;
        }
      }
      
      if (isSupport) {
        support.push(currentLow);
      }
      
      // Check if current high is the highest in the window (resistance)
      let isResistance = true;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i && data[j].high > currentHigh) {
          isResistance = false;
          break;
        }
      }
      
      if (isResistance) {
        resistance.push(currentHigh);
      }
    }
    
    return { support, resistance };
  }

  /**
   * Detect chart patterns (simplified implementation)
   */
  static detectPatterns(data: ChartDataPoint[]): PatternData[] {
    const patterns: PatternData[] = [];
    
    // This is a simplified implementation
    // In a real application, you would use more sophisticated algorithms
    
    // Head and shoulders pattern detection (simplified)
    for (let i = 10; i < data.length - 10; i++) {
      const leftShoulder = data[i - 10].high;
      const head = data[i].high;
      const rightShoulder = data[i + 10].high;
      
      // Check if head is significantly higher than shoulders
      if (head > leftShoulder * 1.05 && head > rightShoulder * 1.05) {
        // Check if shoulders are roughly equal
        const shoulderRatio = Math.abs(leftShoulder - rightShoulder) / Math.max(leftShoulder, rightShoulder);
        
        if (shoulderRatio < 0.1) {
          patterns.push({
            patternType: 'head_and_shoulders',
            confidence: 0.7,
            startPoint: i - 10,
            endPoint: i + 10,
            description: 'A head and shoulders pattern, which typically signals a trend reversal from bullish to bearish.'
          });
        }
      }
    }
    
    // Double top/bottom pattern detection (simplified)
    for (let i = 5; i < data.length - 5; i++) {
      const firstTop = data[i - 5].high;
      const secondTop = data[i + 5].high;
      const trough = data[i].low;
      
      // Check if tops are roughly equal
      const topRatio = Math.abs(firstTop - secondTop) / Math.max(firstTop, secondTop);
      
      if (topRatio < 0.05 && trough < firstTop * 0.95) {
        patterns.push({
          patternType: 'double_top',
          confidence: 0.6,
          startPoint: i - 5,
          endPoint: i + 5,
          description: 'A double top pattern, which typically signals a trend reversal from bullish to bearish.'
        });
      }
      
      const firstBottom = data[i - 5].low;
      const secondBottom = data[i + 5].low;
      const peak = data[i].high;
      
      // Check if bottoms are roughly equal
      const bottomRatio = Math.abs(firstBottom - secondBottom) / Math.max(firstBottom, secondBottom);
      
      if (bottomRatio < 0.05 && peak > firstBottom * 1.05) {
        patterns.push({
          patternType: 'double_bottom',
          confidence: 0.6,
          startPoint: i - 5,
          endPoint: i + 5,
          description: 'A double bottom pattern, which typically signals a trend reversal from bearish to bullish.'
        });
      }
    }
    
    return patterns;
  }

  /**
   * Calculate price volatility (standard deviation)
   */
  static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const squaredDifferences = prices.map(price => Math.pow(price - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / prices.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Determine if market is open (simplified - US market hours)
   */
  static isMarketOpen(): boolean {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const est = new Date(utc.getTime() - 5 * 3600000); // EST offset (note: does not account for DST)
    
    const day = est.getDay();
    const hour = est.getHours();
    const minutes = est.getMinutes();
    
    // Market closed on weekends
    if (day === 0 || day === 6) return false;
    
    // Market hours: 9:30 AM - 4:00 PM EST
    if (hour < 9) return false;
    if (hour === 9 && minutes < 30) return false;
    if (hour > 16) return false;
    if (hour === 16) return false; // close at 16:00

    return true;
  }

  /**
   * Get market status text
   */
  static getMarketStatus(): { status: string; className: string } {
    const isOpen = this.isMarketOpen();
    return {
      status: isOpen ? 'OPEN' : 'CLOSED',
      className: isOpen ? 'text-green-600' : 'text-red-600'
    };
  }

  /**
   * Format date for chart display
   */
  static formatChartDate(dateString: string): string {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  /**
   * Format date for tooltip
   */
  static formatTooltipDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get chart statistics from data
   */
  static getChartStats(chartData: ChartDataPoint[]) {
    if (chartData.length === 0) return null;

    const highs = chartData.map(d => d.high);
    const lows = chartData.map(d => d.low);
    const volumes = chartData.map(d => d.volume);
    const closes = chartData.map(d => d.close);

    const periodHigh = Math.max(...highs);
    const periodLow = Math.min(...lows);
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const volatility = this.calculateVolatility(closes);

    return {
      periodHigh,
      periodLow,
      avgVolume,
      volatility,
      dataPoints: chartData.length
    };
  }

  /**
   * Validate stock symbol format
   */
  static isValidSymbol(symbol: string): boolean {
    // Basic validation for stock symbols (1-5 uppercase letters)
    return /^[A-Z]{1,5}$/.test(symbol.trim().toUpperCase());
  }

  /**
   * Clean and format symbol
   */
  static formatSymbol(symbol: string): string {
    return symbol.trim().toUpperCase();
  }

  /**
   * Generate random color for charts
   */
  static generateChartColor(index: number): string {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // emerald  
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f97316'  // orange
    ];
    return colors[index % colors.length];
  }

  /**
   * Debounce function for search
   */
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    return (...args: Parameters<T>): void => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId as unknown as number);
      }

      timeoutId = setTimeout(() => {
        func(...args);
      }, wait) as unknown as ReturnType<typeof setTimeout>;
    };
  }

  /**
   * Calculate performance metrics
   */
  static calculatePerformance(chartData: ChartDataPoint[]) {
    if (chartData.length < 2) return null;

    const firstPrice = chartData[0].close;
    const lastPrice = chartData[chartData.length - 1].close;
    const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Calculate daily returns
    const dailyReturns: number[] = [];
    for (let i = 1; i < chartData.length; i++) {
      const dailyReturn = ((chartData[i].close - chartData[i - 1].close) / chartData[i - 1].close) * 100;
      dailyReturns.push(dailyReturn);
    }

    const avgDailyReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const volatility = this.calculateVolatility(dailyReturns);

    return {
      totalReturn,
      avgDailyReturn,
      volatility,
      sharpeRatio: volatility > 0 ? avgDailyReturn / volatility : 0
    };
  }

  /**
   * Calculate portfolio beta
   */
  static calculatePortfolioBeta(portfolioReturns: number[], marketReturns: number[]): number {
    if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length === 0) {
      return 1; // Default to market beta if calculation is not possible
    }

    // Calculate covariance between portfolio and market
    const portfolioMean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
    const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;

    let covariance = 0;
    for (let i = 0; i < portfolioReturns.length; i++) {
      covariance += (portfolioReturns[i] - portfolioMean) * (marketReturns[i] - marketMean);
    }
    covariance /= portfolioReturns.length;

    // Calculate market variance
    let marketVariance = 0;
    for (let i = 0; i < marketReturns.length; i++) {
      marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
    }
    marketVariance /= marketReturns.length;

    return marketVariance !== 0 ? covariance / marketVariance : 1;
  }

  /**
   * Calculate portfolio alpha
   */
  static calculatePortfolioAlpha(
    portfolioReturns: number[], 
    marketReturns: number[], 
    riskFreeRate: number = 0.02
  ): number {
    if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length === 0) {
      return 0; // Default to zero alpha if calculation is not possible
    }

    const portfolioMean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
    const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;
    const beta = this.calculatePortfolioBeta(portfolioReturns, marketReturns);

    // Alpha = Portfolio Return - Risk Free Rate - Beta * (Market Return - Risk Free Rate)
    return portfolioMean - riskFreeRate - beta * (marketMean - riskFreeRate);
  }

  /**
   * Calculate Value at Risk (VaR)
   */
  static calculateVaR(returns: number[], confidenceLevel: number = 0.95): number {
    if (returns.length === 0) return 0;

    // Sort returns in ascending order
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    // Calculate the index for the confidence level
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    
    // Return the VaR as a positive number
    return Math.abs(sortedReturns[index]);
  }

  /**
   * Calculate Maximum Drawdown
   */
  static calculateMaxDrawdown(prices: number[]): number {
    if (prices.length === 0) return 0;

    let maxDrawdown = 0;
    let peak = prices[0];

    for (let i = 1; i < prices.length; i++) {
      // Update peak if we find a new high
      if (prices[i] > peak) {
        peak = prices[i];
      } else {
        // Calculate drawdown
        const drawdown = (peak - prices[i]) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }

    return maxDrawdown;
  }

  /**
   * Generate technical indicators for chart data
   */
  static generateTechnicalIndicators(data: ChartDataPoint[]): TechnicalIndicator[] {
    const closes = data.map(d => d.close);
    const indicators: TechnicalIndicator[] = [];

    // SMA indicators
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const sma200 = this.calculateSMA(closes, 200);

    indicators.push({
      name: 'SMA 20',
      values: new Array(closes.length - sma20.length).fill(null).concat(sma20),
      signals: []
    });

    indicators.push({
      name: 'SMA 50',
      values: new Array(closes.length - sma50.length).fill(null).concat(sma50),
      signals: []
    });

    indicators.push({
      name: 'SMA 200',
      values: new Array(closes.length - sma200.length).fill(null).concat(sma200),
      signals: []
    });

    // RSI indicator
    const rsi = this.calculateRSI(closes);
    const rsiSignals: string[] = new Array(closes.length).fill('');
    
    // Generate RSI signals
    for (let i = 0; i < rsi.length; i++) {
      if (rsi[i] > 70) {
        rsiSignals[i + (closes.length - rsi.length)] = 'overbought';
      } else if (rsi[i] < 30) {
        rsiSignals[i + (closes.length - rsi.length)] = 'oversold';
      }
    }

    indicators.push({
      name: 'RSI',
      values: new Array(closes.length - rsi.length).fill(null).concat(rsi),
      signals: rsiSignals
    });

    // MACD indicator
    const { macd, signal, histogram } = this.calculateMACD(closes);
    const macdSignals: string[] = new Array(closes.length).fill('');
    
    // Generate MACD signals
    for (let i = 1; i < histogram.length; i++) {
      const currentIndex = i + (closes.length - macd.length);
      if (histogram[i - 1] < 0 && histogram[i] >= 0) {
        macdSignals[currentIndex] = 'bullish_crossover';
      } else if (histogram[i - 1] > 0 && histogram[i] <= 0) {
        macdSignals[currentIndex] = 'bearish_crossover';
      }
    }

    indicators.push({
      name: 'MACD',
      values: new Array(closes.length - macd.length).fill(null).concat(macd),
      signals: macdSignals
    });

    // Bollinger Bands
    const { upperBand, lowerBand } = this.calculateBollingerBands(closes);
    const bbSignals: string[] = new Array(closes.length).fill('');
    
    // Generate Bollinger Band signals
    for (let i = 0; i < upperBand.length; i++) {
      const currentIndex = i + (closes.length - upperBand.length);
      if (closes[currentIndex] > upperBand[i]) {
        bbSignals[currentIndex] = 'above_upper_band';
      } else if (closes[currentIndex] < lowerBand[i]) {
        bbSignals[currentIndex] = 'below_lower_band';
      }
    }

    indicators.push({
      name: 'BB Upper',
      values: new Array(closes.length - upperBand.length).fill(null).concat(upperBand),
      signals: bbSignals
    });

    indicators.push({
      name: 'BB Lower',
      values: new Array(closes.length - lowerBand.length).fill(null).concat(lowerBand),
      signals: []
    });

    return indicators;
  }
}

/**
 * API Response wrapper for better error handling
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create standardized API responses
 */
export class ApiResponseHelper {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message
    };
  }

  static error(error: string, data?: unknown): ApiResponse<unknown> {
    return {
      success: false,
      error,
      data
    };
  }
}

/**
 * Cache manager for API responses
 */
export class CacheManager {
  private static cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  static set(key: string, data: unknown, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  static clear(): void {
    this.cache.clear();
  }

  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  static size(): number {
    return this.cache.size;
  }
}