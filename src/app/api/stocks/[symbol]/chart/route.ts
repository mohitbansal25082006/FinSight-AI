// src/app/api/stocks/[symbol]/chart/route.ts
import { NextRequest, NextResponse } from "next/server"

// Define type for a single chart data point
interface ChartPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Map our intervals to Yahoo Finance periods
function getYahooPeriod(interval: string): { period: string; interval: string } {
  switch (interval) {
    case "daily":
      return { period: "1mo", interval: "1d" } // 1 month of daily data
    case "weekly":
      return { period: "3mo", interval: "1wk" } // 3 months of weekly data
    case "monthly":
      return { period: "1y", interval: "1mo" } // 1 year of monthly data
    case "1":
      return { period: "1d", interval: "1m" } // 1 day of 1-minute data
    case "5":
      return { period: "5d", interval: "5m" } // 5 days of 5-minute data
    case "15":
      return { period: "5d", interval: "15m" } // 5 days of 15-minute data
    case "60":
      return { period: "5d", interval: "60m" } // 5 days of hourly data
    default:
      return { period: "1mo", interval: "1d" } // Default to daily
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await context.params
    const { searchParams } = new URL(request.url)
    const interval = searchParams.get("interval") || "daily"

    const { period, interval: yahooInterval } = getYahooPeriod(interval)

    console.log(
      `📊 Fetching Yahoo Finance chart for: ${symbol}, period: ${period}, interval: ${yahooInterval}`
    )

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=0&period2=9999999999&interval=${yahooInterval}&range=${period}`

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Yahoo Finance API error:", response.status, errorText)
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(
      "📈 Yahoo Finance response status:",
      data.chart?.result ? "success" : "failed"
    )

    const result = data.chart?.result?.[0]

    if (!result || !result.timestamp || result.timestamp.length === 0) {
      console.log("❌ No chart data found in response")
      return NextResponse.json(
        { error: "No chart data found for this symbol" },
        { status: 404 }
      )
    }

    const timestamps: number[] = result.timestamp
    const indicators = result.indicators?.quote?.[0]

    if (!indicators) {
      console.log("❌ No price indicators found")
      return NextResponse.json(
        { error: "No price data available" },
        { status: 404 }
      )
    }

    // Convert Yahoo Finance data to our chart format
    const chartData: ChartPoint[] = timestamps
      .map((timestamp: number, index: number): ChartPoint => {
        const date = new Date(timestamp * 1000)

        return {
          date: date.toISOString().split("T")[0], // YYYY-MM-DD format
          open: indicators.open?.[index] ?? 0,
          high: indicators.high?.[index] ?? 0,
          low: indicators.low?.[index] ?? 0,
          close: indicators.close?.[index] ?? 0,
          volume: indicators.volume?.[index] ?? 0,
        }
      })
      .filter((item: ChartPoint) => item.close > 0) // ✅ Strongly typed filter
      .slice(-30) // Keep only last 30 points for performance

    console.log(`✅ Formatted chart data: ${chartData.length} points`)

    if (chartData.length === 0) {
      return NextResponse.json(
        { error: "No valid chart data found" },
        { status: 404 }
      )
    }

    return NextResponse.json(chartData)
  } catch (error) {
    console.error("❌ Chart API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch chart data", details: (error as Error).message },
      { status: 500 }
    )
  }
}
