import { type NextRequest, NextResponse } from "next/server"

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY

export async function GET(request: NextRequest) {
  try {
    if (!ALCHEMY_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const tokens = searchParams.get("tokens")?.split(",") || []

    if (tokens.length === 0) {
      return NextResponse.json({ error: "No tokens specified" }, { status: 400 })
    }

    // Mock price data
    const prices: Record<string, number> = {}
    tokens.forEach((token) => {
      prices[token] = Math.random() * 1000 + 100
    })

    return NextResponse.json({ prices, timestamp: Date.now() })
  } catch (error) {
    console.error("Prices API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokens, exchanges } = body

    // Mock real-time price updates
    const priceUpdates = tokens.map((token: string) => ({
      token,
      price: Math.random() * 1000 + 100,
      change24h: (Math.random() - 0.5) * 20,
      volume24h: Math.random() * 1000000,
      timestamp: Date.now(),
    }))

    return NextResponse.json({ priceUpdates })
  } catch (error) {
    console.error("Price updates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
