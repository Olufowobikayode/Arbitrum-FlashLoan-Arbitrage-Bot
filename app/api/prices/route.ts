import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokens = searchParams.get("tokens")?.split(",") || []

    // Mock price data for now
    // In production, this would use the ALCHEMY_API_KEY or COINGECKO_API_KEY server-side
    const mockPrices: Record<string, any> = {
      WETH: {
        symbol: "WETH",
        price: 2450.75 + (Math.random() - 0.5) * 100,
        change24h: (Math.random() - 0.5) * 10,
        volume24h: 1250000000,
        marketCap: 295000000000,
      },
      USDC: {
        symbol: "USDC",
        price: 1.0001 + (Math.random() - 0.5) * 0.01,
        change24h: (Math.random() - 0.5) * 0.5,
        volume24h: 2100000000,
        marketCap: 25000000000,
      },
      USDT: {
        symbol: "USDT",
        price: 0.9999 + (Math.random() - 0.5) * 0.01,
        change24h: (Math.random() - 0.5) * 0.3,
        volume24h: 3200000000,
        marketCap: 83000000000,
      },
      DAI: {
        symbol: "DAI",
        price: 1.0002 + (Math.random() - 0.5) * 0.01,
        change24h: (Math.random() - 0.5) * 0.4,
        volume24h: 180000000,
        marketCap: 5300000000,
      },
      WBTC: {
        symbol: "WBTC",
        price: 43250.5 + (Math.random() - 0.5) * 1000,
        change24h: (Math.random() - 0.5) * 8,
        volume24h: 850000000,
        marketCap: 8200000000,
      },
      ARB: {
        symbol: "ARB",
        price: 1.25 + (Math.random() - 0.5) * 0.2,
        change24h: (Math.random() - 0.5) * 15,
        volume24h: 125000000,
        marketCap: 1800000000,
      },
    }

    const result =
      tokens.length > 0
        ? tokens.reduce(
            (acc, token) => {
              if (mockPrices[token.toUpperCase()]) {
                acc[token.toUpperCase()] = mockPrices[token.toUpperCase()]
              }
              return acc
            },
            {} as Record<string, any>,
          )
        : mockPrices

    return NextResponse.json({
      success: true,
      prices: result,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Error fetching prices:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch prices" }, { status: 500 })
  }
}
