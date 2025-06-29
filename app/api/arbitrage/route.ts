import { type NextRequest, NextResponse } from "next/server"

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY

export async function GET(request: NextRequest) {
  try {
    if (!ALCHEMY_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const tokenA = searchParams.get("tokenA")
    const tokenB = searchParams.get("tokenB")
    const amount = searchParams.get("amount")

    if (!tokenA || !tokenB || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Mock arbitrage opportunity data
    const opportunities = [
      {
        id: "1",
        tokenA,
        tokenB,
        amount: Number.parseFloat(amount),
        profit: Math.random() * 100,
        dexA: "Uniswap V3",
        dexB: "SushiSwap",
        gasEstimate: Math.floor(Math.random() * 200000) + 100000,
        timestamp: Date.now(),
      },
    ]

    return NextResponse.json({ opportunities })
  } catch (error) {
    console.error("Arbitrage API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()

    switch (action) {
      case "fetchOpportunities":
        return await handleFetchOpportunities(params)
      case "validateOpportunity":
        return await handleValidateOpportunity(params)
      case "getRealTimePrices":
        return await handleGetRealTimePrices(params)
      case "executeOpportunity":
        return await handleExecuteOpportunity(params)
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleFetchOpportunities({ flashloanToken, minLiquidity = 250000 }) {
  const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex"
  const COINGECKO_API = "https://api.coingecko.com/api/v3"

  try {
    // Fetch from DexScreener
    const dexResponse = await fetch(`${DEXSCREENER_API}/pairs/arbitrum?limit=100&sort=liquidity&direction=desc`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FlashloanArbitrageBot/1.0",
      },
    })

    const dexData = await dexResponse.json()

    // Fetch from CoinGecko
    const coinGeckoHeaders: HeadersInit = {
      Accept: "application/json",
    }

    if (COINGECKO_API_KEY) {
      coinGeckoHeaders["x-cg-demo-api-key"] = COINGECKO_API_KEY
    }

    const coinGeckoResponse = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`,
      { headers: coinGeckoHeaders },
    )

    const coinGeckoData = await coinGeckoResponse.json()

    // Process and filter opportunities
    const opportunities = processOpportunities(dexData.pairs || [], minLiquidity, flashloanToken)

    return NextResponse.json({
      success: true,
      opportunities: opportunities.slice(0, 10),
      marketData: coinGeckoData,
    })
  } catch (error) {
    console.error("Error fetching opportunities:", error)
    return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 })
  }
}

async function handleValidateOpportunity({ opportunity }) {
  try {
    // Re-validate the opportunity with current market data
    const currentPrices = await getRealTimePricesServer(opportunity.baseToken.address, opportunity.quoteToken.address)

    if (currentPrices.length < 2) {
      return NextResponse.json({ valid: false, reason: "Insufficient price data" })
    }

    const arbitrageData = calculateArbitrageOpportunity(
      currentPrices,
      Number.parseFloat(opportunity.liquidity.usd),
      "USDC",
    )

    const isValid = arbitrageData.estimatedProfit >= opportunity.estimatedProfit * 0.8

    return NextResponse.json({
      valid: isValid,
      currentProfit: arbitrageData.estimatedProfit,
      originalProfit: opportunity.estimatedProfit,
    })
  } catch (error) {
    console.error("Error validating opportunity:", error)
    return NextResponse.json({ valid: false, reason: "Validation failed" })
  }
}

async function handleGetRealTimePrices({ tokenA, tokenB }) {
  try {
    const prices = await getRealTimePricesServer(tokenA, tokenB)
    return NextResponse.json({ success: true, prices })
  } catch (error) {
    console.error("Error getting real-time prices:", error)
    return NextResponse.json({ error: "Failed to get prices" }, { status: 500 })
  }
}

async function handleExecuteOpportunity({ opportunityId, amount }) {
  try {
    if (!ALCHEMY_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Mock execution result
    const result = {
      success: true,
      transactionHash: "0x" + Math.random().toString(16).substr(2, 64),
      profit: Math.random() * 50,
      gasUsed: Math.floor(Math.random() * 150000) + 50000,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Arbitrage execution error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function processOpportunities(pairs: any[], minLiquidity: number, flashloanToken: string) {
  const opportunities = []
  const processedPairs = new Set()

  for (const pair of pairs) {
    try {
      const liquidityUsd = Number.parseFloat(pair.liquidity?.usd || "0")
      if (liquidityUsd < minLiquidity) continue

      const pairKey = `${pair.baseToken.address}-${pair.quoteToken.address}`
      if (processedPairs.has(pairKey)) continue
      processedPairs.add(pairKey)

      if (!isArbitrageCandidate(pair.baseToken, pair.quoteToken, flashloanToken)) {
        continue
      }

      // Simulate price data for demo purposes
      const priceData = generateMockPriceData(pair)

      if (priceData.length < 2) continue

      const arbitrageData = calculateArbitrageOpportunity(priceData, liquidityUsd, flashloanToken)

      if (arbitrageData.estimatedProfit >= 50) {
        opportunities.push({
          id: `${pair.baseToken.address}-${pair.quoteToken.address}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          baseToken: pair.baseToken,
          quoteToken: pair.quoteToken,
          liquidity: pair.liquidity,
          priceUsd: pair.priceUsd,
          estimatedProfit: arbitrageData.estimatedProfit,
          amount: arbitrageData.optimalAmount,
          route: arbitrageData.route,
          dexPrices: priceData,
          profitMargin: arbitrageData.profitMargin,
          riskLevel: arbitrageData.riskLevel,
          timestamp: Date.now(),
          source: "dexscreener",
        })
      }
    } catch (error) {
      console.error("Error processing pair:", error)
      continue
    }
  }

  return opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit)
}

async function getRealTimePricesServer(tokenA: string, tokenB: string) {
  const prices = []

  // Mock price data for different DEXes
  const basePriceVariation = Math.random() * 0.1 + 0.95 // 0.95 to 1.05

  const dexes = [
    { name: "Uniswap V3", fee: 30, variation: 1.0 },
    { name: "Uniswap V2", fee: 30, variation: 1.02 },
    { name: "SushiSwap", fee: 30, variation: 0.98 },
    { name: "Camelot", fee: 30, variation: 1.01 },
    { name: "Balancer V2", fee: 25, variation: 0.99 },
  ]

  for (const dex of dexes) {
    prices.push({
      dex: dex.name,
      price: basePriceVariation * dex.variation,
      liquidity: 1000000 + Math.random() * 5000000,
      fee: dex.fee,
      timestamp: Date.now(),
    })
  }

  return prices
}

function generateMockPriceData(pair: any) {
  const basePrice = Number.parseFloat(pair.priceUsd || "1")
  const prices = []

  const dexes = [
    { name: "Uniswap V3", variation: 1.0 },
    { name: "Uniswap V2", variation: 1.015 },
    { name: "SushiSwap", variation: 0.995 },
    { name: "Camelot", variation: 1.008 },
  ]

  for (const dex of dexes) {
    prices.push({
      dex: dex.name,
      price: basePrice * dex.variation,
      liquidity: 500000 + Math.random() * 2000000,
      fee: 30,
      timestamp: Date.now(),
    })
  }

  return prices
}

function isArbitrageCandidate(baseToken: any, quoteToken: any, flashloanToken: string): boolean {
  const commonTokens = ["USDC", "USDT", "DAI", "WETH", "ETH", "USDC.e", "ARB", "GMX", "WBTC"]

  // Check if either token is our flashloan token
  if (isFlashloanToken(baseToken.symbol, flashloanToken) || isFlashloanToken(quoteToken.symbol, flashloanToken)) {
    return true
  }

  // Check if both tokens are commonly traded
  if (commonTokens.includes(baseToken.symbol) && commonTokens.includes(quoteToken.symbol)) {
    return true
  }

  // Check for high-volume pairs
  if (baseToken.symbol === "WETH" || quoteToken.symbol === "WETH") {
    return true
  }

  return false
}

function isFlashloanToken(symbol: string, flashloanToken: string): boolean {
  const tokenMap: { [key: string]: string[] } = {
    USDC: ["USDC", "USDC.e"],
    USDT: ["USDT"],
    DAI: ["DAI"],
    WETH: ["WETH", "ETH"],
    WBTC: ["WBTC", "BTC"],
  }

  return tokenMap[flashloanToken]?.includes(symbol) || false
}

function calculateArbitrageOpportunity(priceData: any[], liquidityUsd: number, flashloanToken: string) {
  if (priceData.length < 2) {
    return { estimatedProfit: 0, optimalAmount: 0, route: null, profitMargin: 0, riskLevel: "HIGH" }
  }

  const sortedPrices = [...priceData].sort((a, b) => a.price - b.price)
  const buyDex = sortedPrices[0]
  const sellDex = sortedPrices[sortedPrices.length - 1]

  const priceDifference = sellDex.price - buyDex.price
  const priceSpread = (priceDifference / buyDex.price) * 100

  const maxLiquidityUtilization = Math.min(buyDex.liquidity, sellDex.liquidity)
  const optimalAmount = Math.min(liquidityUsd * 0.04, maxLiquidityUtilization * 0.8, 3000000)

  const grossProfit = optimalAmount * (priceSpread / 100)

  const flashloanFee = optimalAmount * 0.0005 // 0.05% Aave fee
  const dexFees = optimalAmount * (60 / 10000) // Combined DEX fees
  const gasCost = 125 // Estimated gas cost in USD
  const slippageCost = optimalAmount * 0.01 // 1% slippage

  const totalCosts = flashloanFee + dexFees + gasCost + slippageCost
  const netProfit = grossProfit - totalCosts
  const profitMargin = optimalAmount > 0 ? (netProfit / optimalAmount) * 100 : 0

  let riskLevel = "LOW"
  if (priceSpread < 0.5 || profitMargin < 0.2) riskLevel = "HIGH"
  else if (priceSpread < 1.0 || profitMargin < 0.5) riskLevel = "MEDIUM"

  return {
    estimatedProfit: Math.max(0, netProfit),
    optimalAmount,
    route: {
      buyDex: buyDex.dex,
      sellDex: sellDex.dex,
      buyPrice: buyDex.price,
      sellPrice: sellDex.price,
      priceSpread,
      grossProfit,
      totalCosts,
    },
    profitMargin,
    riskLevel,
  }
}
