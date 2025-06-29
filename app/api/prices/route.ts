import { type NextRequest, NextResponse } from "next/server"

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json()

    const priceData = await fetchPriceData(symbols)

    return NextResponse.json({
      success: true,
      data: priceData,
    })
  } catch (error) {
    console.error("Price API Error:", error)
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 })
  }
}

async function fetchPriceData(symbols: string[]) {
  const COINGECKO_API = "https://api.coingecko.com/api/v3"

  const coinIds: { [key: string]: string } = {
    WETH: "ethereum",
    USDC: "usd-coin",
    USDT: "tether",
    DAI: "dai",
    WBTC: "wrapped-bitcoin",
    ARB: "arbitrum",
    GMX: "gmx",
  }

  const validSymbols = symbols.filter((symbol) => coinIds[symbol])
  const coinIdsList = validSymbols.map((symbol) => coinIds[symbol]).join(",")

  if (!coinIdsList) {
    return {}
  }

  try {
    const headers: HeadersInit = {
      Accept: "application/json",
    }

    if (COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = COINGECKO_API_KEY
    }

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinIdsList}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`,
      { headers },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Transform data back to symbol keys
    const result: { [key: string]: any } = {}

    for (const symbol of validSymbols) {
      const coinId = coinIds[symbol]
      if (data[coinId]) {
        result[symbol] = {
          symbol,
          price: data[coinId].usd,
          change24h: data[coinId].usd_24h_change || 0,
          volume24h: data[coinId].usd_24h_vol || 0,
          marketCap: data[coinId].usd_market_cap || 0,
          timestamp: Date.now(),
          source: "coingecko",
        }
      }
    }

    return result
  } catch (error) {
    console.error("CoinGecko API error:", error)
    return {}
  }
}
