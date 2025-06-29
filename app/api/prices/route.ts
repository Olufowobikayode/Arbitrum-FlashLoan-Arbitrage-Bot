import { type NextRequest, NextResponse } from "next/server"

// Mock price data for development
const mockPriceData = {
  WETH: {
    price: 2451.75,
    change24h: 2.34,
    volume24h: 1250000000,
    marketCap: 295000000000,
    exchanges: {
      "Uniswap V3": 2451.75,
      SushiSwap: 2449.2,
      Curve: 2452.1,
      Balancer: 2450.85,
    },
  },
  USDC: {
    price: 1.0002,
    change24h: 0.01,
    volume24h: 2100000000,
    marketCap: 32000000000,
    exchanges: {
      "Uniswap V3": 1.0002,
      SushiSwap: 1.0001,
      Curve: 1.0003,
      Balancer: 1.0001,
    },
  },
  WBTC: {
    price: 43225.5,
    change24h: -1.25,
    volume24h: 890000000,
    marketCap: 675000000000,
    exchanges: {
      "Uniswap V3": 43225.5,
      SushiSwap: 43220.75,
      Curve: 43230.25,
      Balancer: 43218.9,
    },
  },
  ARB: {
    price: 0.8945,
    change24h: 5.67,
    volume24h: 125000000,
    marketCap: 8900000000,
    exchanges: {
      "Uniswap V3": 0.8945,
      SushiSwap: 0.8942,
      Curve: 0.8948,
      Balancer: 0.894,
    },
  },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokens = searchParams.get("tokens")?.split(",") || ["WETH", "USDC", "WBTC", "ARB"]

    // Filter mock data based on requested tokens
    const filteredData = Object.fromEntries(Object.entries(mockPriceData).filter(([token]) => tokens.includes(token)))

    return NextResponse.json({
      success: true,
      data: filteredData,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Price API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch price data" }, { status: 500 })
  }
}
