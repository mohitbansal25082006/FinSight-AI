// src/app/api/stocks/[symbol]/route.ts
import { NextRequest, NextResponse } from "next/server"

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY

// Helper function: fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 8000
) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(id)
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> }
) {
  try {
    // ✅ Await params before destructuring
    const { symbol } = await context.params

    if (!FINNHUB_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      )
    }

    console.log("📊 Fetching data for:", symbol)

    // Get current quote with timeout
    const quoteResponse = await fetchWithTimeout(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
      {},
      8000
    )

    if (!quoteResponse.ok) {
      throw new Error("Failed to fetch stock data")
    }

    const quoteData = await quoteResponse.json()
    console.log("📈 Quote data:", quoteData)

    // Get company profile for additional info
    const profileResponse = await fetchWithTimeout(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
      {},
      8000
    )

    let profileData: Record<string, any> = {}
    if (profileResponse.ok) {
      profileData = await profileResponse.json()
    }

    // Check if we got valid data
    if (!quoteData.c && quoteData.c !== 0) {
      return NextResponse.json(
        { error: "No data found for symbol" },
        { status: 404 }
      )
    }

    // Format the response
    const stockData = {
      symbol: symbol.toUpperCase(),
      price: quoteData.c || 0, // Current price
      change: quoteData.d || 0, // Change
      changePercent: (quoteData.dp || 0).toFixed(2), // Change percent
      volume: 0, // Finnhub doesn't provide volume in quote endpoint
      previousClose: quoteData.pc || 0,
      open: quoteData.o || 0,
      high: quoteData.h || 0,
      low: quoteData.l || 0,
      lastUpdated: new Date().toISOString().split("T")[0],
      companyName: profileData?.name || symbol,
    }

    console.log("✅ Formatted stock data:", stockData)
    return NextResponse.json(stockData)
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("⏳ Request to Finnhub timed out")
      return NextResponse.json(
        { error: "Stock API request timed out" },
        { status: 504 }
      )
    }

    console.error("❌ Stock API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    )
  }
}
