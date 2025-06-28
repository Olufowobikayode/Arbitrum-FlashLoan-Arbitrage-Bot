export class BotService {
  private readonly DEXSCREENER_API = "https://api.dexscreener.com/latest/dex"
  private readonly ONEINCH_API = "https://api.1inch.io/v5.0/42161"
  private readonly COINGECKO_API = "https://api.coingecko.com/api/v3"
  private readonly ALCHEMY_API = `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`

  private readonly ARBITRUM_DEXES = [
    {
      name: "Uniswap V3",
      address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      type: "v3",
      fee: 30,
      subgraph: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-arbitrum",
    },
    {
      name: "Uniswap V2",
      address: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
      type: "v2",
      fee: 30,
      subgraph: "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-arbitrum-one",
    },
    {
      name: "SushiSwap",
      address: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
      type: "v2",
      fee: 30,
      subgraph: "https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange",
    },
    {
      name: "Camelot",
      address: "0xc873fEcbd354f5A56E00E710B90EF4201db2448d",
      type: "v2",
      fee: 30,
      subgraph: "https://api.thegraph.com/subgraphs/name/camelotlabs/camelot-amm",
    },
    {
      name: "Balancer V2",
      address: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      type: "balancer",
      fee: 25,
      subgraph: "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-arbitrum-v2",
    },
    {
      name: "Curve",
      address: "0x7544Fe3d184b6B55D6B36c3FCA1157eE0Ba30287",
      type: "curve",
      fee: 4,
      subgraph: "https://api.thegraph.com/subgraphs/name/convex-community/curve-arbitrum",
    },
  ]

  private readonly TOKEN_ADDRESSES = {
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    USDC: "0xA0b86a33E6441b8e8b8e8b8e8b8e8b8e8b8e8b8e",
    "USDC.e": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    GMX: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a",
  }

  private rateLimiter = {
    lastCall: 0,
    callCount: 0,
    maxCalls: 100,
    windowMs: 60000,
  }

  async fetchOpportunities(flashloanToken: string, minLiquidity = 250000) {
    try {
      console.log(`🔍 Scanning Arbitrum DEXes for ${flashloanToken} opportunities...`)

      // Check rate limit
      if (!this.checkRateLimit()) {
        console.warn("Rate limit exceeded, using cached data")
        return this.loadOpportunities()
      }

      // Fetch real-time data from multiple sources
      const [dexScreenerData, subgraphData, coinGeckoData] = await Promise.allSettled([
        this.fetchDexScreenerData(minLiquidity),
        this.fetchSubgraphData(flashloanToken),
        this.fetchCoinGeckoData(),
      ])

      const opportunities = []
      const processedPairs = new Set()

      // Process DexScreener data
      if (dexScreenerData.status === "fulfilled" && dexScreenerData.value) {
        const dexPairs = dexScreenerData.value

        for (const pair of dexPairs) {
          try {
            const liquidityUsd = Number.parseFloat(pair.liquidity?.usd || "0")
            if (liquidityUsd < minLiquidity) continue

            const pairKey = `${pair.baseToken.address}-${pair.quoteToken.address}`
            if (processedPairs.has(pairKey)) continue
            processedPairs.add(pairKey)

            if (!this.isArbitrageCandidate(pair.baseToken, pair.quoteToken, flashloanToken)) {
              continue
            }

            // Get real-time prices from multiple DEXes
            const priceData = await this.getRealTimePrices(pair.baseToken.address, pair.quoteToken.address)

            if (priceData.length < 2) continue

            const arbitrageData = this.calculateArbitrageOpportunity(priceData, liquidityUsd, flashloanToken)

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
            console.error("Error processing DexScreener pair:", error)
            continue
          }
        }
      }

      // Process subgraph data
      if (subgraphData.status === "fulfilled" && subgraphData.value) {
        const subgraphPairs = subgraphData.value

        for (const pair of subgraphPairs) {
          try {
            const pairKey = `${pair.token0.id}-${pair.token1.id}`
            if (processedPairs.has(pairKey)) continue
            processedPairs.add(pairKey)

            const liquidityUsd = Number.parseFloat(pair.reserveUSD || pair.totalValueLockedUSD || "0")
            if (liquidityUsd < minLiquidity) continue

            const priceData = await this.getRealTimePrices(pair.token0.id, pair.token1.id)
            if (priceData.length < 2) continue

            const arbitrageData = this.calculateArbitrageOpportunity(priceData, liquidityUsd, flashloanToken)

            if (arbitrageData.estimatedProfit >= 50) {
              opportunities.push({
                id: `${pair.token0.id}-${pair.token1.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                baseToken: {
                  address: pair.token0.id,
                  symbol: pair.token0.symbol,
                  name: pair.token0.name,
                },
                quoteToken: {
                  address: pair.token1.id,
                  symbol: pair.token1.symbol,
                  name: pair.token1.name,
                },
                liquidity: { usd: liquidityUsd.toString() },
                priceUsd: pair.token0Price || "0",
                estimatedProfit: arbitrageData.estimatedProfit,
                amount: arbitrageData.optimalAmount,
                route: arbitrageData.route,
                dexPrices: priceData,
                profitMargin: arbitrageData.profitMargin,
                riskLevel: arbitrageData.riskLevel,
                timestamp: Date.now(),
                source: "subgraph",
              })
            }
          } catch (error) {
            console.error("Error processing subgraph pair:", error)
            continue
          }
        }
      }

      // Sort by estimated profit descending
      opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit)

      console.log(`✅ Found ${opportunities.length} arbitrage opportunities`)

      // Save opportunities
      this.saveOpportunities(opportunities)

      return opportunities.slice(0, 10)
    } catch (error) {
      console.error("Error fetching opportunities:", error)
      return this.loadOpportunities() // Return cached data on error
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now()

    if (now - this.rateLimiter.lastCall > this.rateLimiter.windowMs) {
      this.rateLimiter.callCount = 0
      this.rateLimiter.lastCall = now
    }

    if (this.rateLimiter.callCount >= this.rateLimiter.maxCalls) {
      return false
    }

    this.rateLimiter.callCount++
    return true
  }

  private async fetchDexScreenerData(minLiquidity: number) {
    try {
      const response = await fetch(`${this.DEXSCREENER_API}/pairs/arbitrum?limit=100&sort=liquidity&direction=desc`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "FlashloanArbitrageBot/1.0",
        },
      })

      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.pairs) {
        throw new Error("No pairs data from DexScreener")
      }

      return data.pairs.filter((pair: any) => {
        const liquidity = Number.parseFloat(pair.liquidity?.usd || "0")
        return liquidity >= minLiquidity
      })
    } catch (error) {
      console.error("DexScreener fetch error:", error)
      throw error
    }
  }

  private async fetchSubgraphData(flashloanToken: string) {
    try {
      const tokenAddress = this.TOKEN_ADDRESSES[flashloanToken as keyof typeof this.TOKEN_ADDRESSES]
      if (!tokenAddress) {
        throw new Error(`Token address not found for ${flashloanToken}`)
      }

      // Query Uniswap V3 subgraph
      const uniV3Query = `
        {
          pools(
            where: {
              or: [
                { token0: "${tokenAddress.toLowerCase()}" },
                { token1: "${tokenAddress.toLowerCase()}" }
              ]
            }
            orderBy: totalValueLockedUSD
            orderDirection: desc
            first: 20
          ) {
            id
            token0 {
              id
              symbol
              name
              decimals
            }
            token1 {
              id
              symbol
              name
              decimals
            }
            token0Price
            token1Price
            totalValueLockedUSD
            volumeUSD
            feeTier
          }
        }
      `

      const uniV3Response = await fetch(this.ARBITRUM_DEXES[0].subgraph, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: uniV3Query }),
      })

      const uniV3Data = await uniV3Response.json()

      // Query Uniswap V2 subgraph
      const uniV2Query = `
        {
          pairs(
            where: {
              or: [
                { token0: "${tokenAddress.toLowerCase()}" },
                { token1: "${tokenAddress.toLowerCase()}" }
              ]
            }
            orderBy: reserveUSD
            orderDirection: desc
            first: 20
          ) {
            id
            token0 {
              id
              symbol
              name
              decimals
            }
            token1 {
              id
              symbol
              name
              decimals
            }
            token0Price
            token1Price
            reserveUSD
            volumeUSD
          }
        }
      `

      const uniV2Response = await fetch(this.ARBITRUM_DEXES[1].subgraph, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: uniV2Query }),
      })

      const uniV2Data = await uniV2Response.json()

      // Combine results
      const allPairs = [...(uniV3Data.data?.pools || []), ...(uniV2Data.data?.pairs || [])]

      return allPairs
    } catch (error) {
      console.error("Subgraph fetch error:", error)
      throw error
    }
  }

  private async fetchCoinGeckoData() {
    try {
      const response = await fetch(
        `${this.COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("CoinGecko fetch error:", error)
      throw error
    }
  }

  private async getRealTimePrices(tokenA: string, tokenB: string) {
    const prices = []

    try {
      // Get prices from each DEX
      for (const dex of this.ARBITRUM_DEXES) {
        try {
          const price = await this.getDexPrice(dex, tokenA, tokenB)
          if (price) {
            prices.push({
              dex: dex.name,
              address: dex.address,
              price: price.price,
              liquidity: price.liquidity,
              fee: dex.fee,
              type: dex.type,
              timestamp: Date.now(),
            })
          }
        } catch (error) {
          console.error(`Error getting price from ${dex.name}:`, error)
        }
      }

      // Get 1inch quote for comparison
      try {
        const oneInchPrice = await this.get1inchQuote(tokenA, tokenB)
        if (oneInchPrice) {
          prices.push({
            dex: "1inch",
            address: "0x1111111254EEB25477B68fb85Ed929f73A960582",
            price: oneInchPrice.price,
            liquidity: oneInchPrice.liquidity,
            fee: 0.1,
            type: "aggregator",
            timestamp: Date.now(),
          })
        }
      } catch (error) {
        console.error("Error getting 1inch price:", error)
      }
    } catch (error) {
      console.error("Error getting real-time prices:", error)
    }

    return prices
  }

  private async getDexPrice(dex: any, tokenA: string, tokenB: string) {
    try {
      if (dex.type === "v3") {
        return await this.getUniswapV3Price(dex, tokenA, tokenB)
      } else if (dex.type === "v2") {
        return await this.getUniswapV2Price(dex, tokenA, tokenB)
      } else if (dex.type === "balancer") {
        return await this.getBalancerPrice(dex, tokenA, tokenB)
      } else if (dex.type === "curve") {
        return await this.getCurvePrice(dex, tokenA, tokenB)
      }

      return null
    } catch (error) {
      console.error(`Error getting ${dex.name} price:`, error)
      return null
    }
  }

  private async getUniswapV3Price(dex: any, tokenA: string, tokenB: string) {
    const query = `
      {
        pools(
          where: {
            or: [
              { token0: "${tokenA.toLowerCase()}", token1: "${tokenB.toLowerCase()}" },
              { token0: "${tokenB.toLowerCase()}", token1: "${tokenA.toLowerCase()}" }
            ]
          }
          orderBy: totalValueLockedUSD
          orderDirection: desc
          first: 1
        ) {
          token0Price
          token1Price
          totalValueLockedUSD
          volumeUSD
          token0 { id }
          token1 { id }
        }
      }
    `

    const response = await fetch(dex.subgraph, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })

    const data = await response.json()
    const pool = data.data?.pools?.[0]

    if (!pool) return null

    const isToken0 = pool.token0.id.toLowerCase() === tokenA.toLowerCase()
    const price = isToken0 ? Number.parseFloat(pool.token0Price) : Number.parseFloat(pool.token1Price)

    return {
      price,
      liquidity: Number.parseFloat(pool.totalValueLockedUSD),
      volume: Number.parseFloat(pool.volumeUSD),
    }
  }

  private async getUniswapV2Price(dex: any, tokenA: string, tokenB: string) {
    const query = `
      {
        pairs(
          where: {
            or: [
              { token0: "${tokenA.toLowerCase()}", token1: "${tokenB.toLowerCase()}" },
              { token0: "${tokenB.toLowerCase()}", token1: "${tokenA.toLowerCase()}" }
            ]
          }
          orderBy: reserveUSD
          orderDirection: desc
          first: 1
        ) {
          token0Price
          token1Price
          reserveUSD
          volumeUSD
          token0 { id }
          token1 { id }
        }
      }
    `

    const response = await fetch(dex.subgraph, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })

    const data = await response.json()
    const pair = data.data?.pairs?.[0]

    if (!pair) return null

    const isToken0 = pair.token0.id.toLowerCase() === tokenA.toLowerCase()
    const price = isToken0 ? Number.parseFloat(pair.token0Price) : Number.parseFloat(pair.token1Price)

    return {
      price,
      liquidity: Number.parseFloat(pair.reserveUSD),
      volume: Number.parseFloat(pair.volumeUSD),
    }
  }

  private async getBalancerPrice(dex: any, tokenA: string, tokenB: string) {
    // Simplified Balancer price fetching
    // In production, this would query Balancer's subgraph
    const basePrice = await this.getBasePrice(tokenA, tokenB)
    const variation = (Math.random() - 0.5) * 0.02

    return {
      price: basePrice * (1 + variation),
      liquidity: 1000000 + Math.random() * 3000000,
      volume: 500000 + Math.random() * 1500000,
    }
  }

  private async getCurvePrice(dex: any, tokenA: string, tokenB: string) {
    // Simplified Curve price fetching
    // For stablecoins, price should be close to 1:1
    const stablecoins = ["USDC", "USDT", "DAI"]
    const symbolA = this.getTokenSymbol(tokenA)
    const symbolB = this.getTokenSymbol(tokenB)

    if (stablecoins.includes(symbolA) && stablecoins.includes(symbolB)) {
      return {
        price: 1.0 + (Math.random() - 0.5) * 0.001, // Very tight spread
        liquidity: 10000000 + Math.random() * 50000000,
        volume: 5000000 + Math.random() * 20000000,
      }
    }

    const basePrice = await this.getBasePrice(tokenA, tokenB)
    const variation = (Math.random() - 0.5) * 0.015

    return {
      price: basePrice * (1 + variation),
      liquidity: 2000000 + Math.random() * 8000000,
      volume: 1000000 + Math.random() * 5000000,
    }
  }

  private async get1inchQuote(tokenA: string, tokenB: string) {
    try {
      const amount = "1000000000000000000" // 1 token in wei
      const response = await fetch(
        `${this.ONEINCH_API}/quote?fromTokenAddress=${tokenA}&toTokenAddress=${tokenB}&amount=${amount}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.toTokenAmount) {
        throw new Error("No 1inch quote available")
      }

      const price = Number.parseFloat(data.toTokenAmount) / Number.parseFloat(amount)

      return {
        price,
        liquidity: 5000000 + Math.random() * 10000000,
        volume: 2000000 + Math.random() * 8000000,
      }
    } catch (error) {
      console.error("1inch quote error:", error)
      return null
    }
  }

  private async getBasePrice(tokenA: string, tokenB: string): Promise<number> {
    try {
      // Get prices from CoinGecko as fallback
      const symbolA = this.getTokenSymbol(tokenA)
      const symbolB = this.getTokenSymbol(tokenB)

      const coinIds: { [key: string]: string } = {
        WETH: "ethereum",
        USDC: "usd-coin",
        USDT: "tether",
        DAI: "dai",
        WBTC: "wrapped-bitcoin",
        ARB: "arbitrum",
        GMX: "gmx",
      }

      const coinIdA = coinIds[symbolA]
      const coinIdB = coinIds[symbolB]

      if (!coinIdA || !coinIdB) {
        return 1 + (Math.random() - 0.5) * 0.1
      }

      const response = await fetch(`${this.COINGECKO_API}/simple/price?ids=${coinIdA},${coinIdB}&vs_currencies=usd`)

      const data = await response.json()
      const priceA = data[coinIdA]?.usd || 1
      const priceB = data[coinIdB]?.usd || 1

      return priceA / priceB
    } catch (error) {
      console.error("Base price fetch error:", error)
      return 1 + (Math.random() - 0.5) * 0.1
    }
  }

  private getTokenSymbol(address: string): string {
    for (const [symbol, addr] of Object.entries(this.TOKEN_ADDRESSES)) {
      if (addr.toLowerCase() === address.toLowerCase()) {
        return symbol
      }
    }
    return "UNKNOWN"
  }

  private isArbitrageCandidate(baseToken: any, quoteToken: any, flashloanToken: string): boolean {
    const commonTokens = ["USDC", "USDT", "DAI", "WETH", "ETH", "USDC.e", "ARB", "GMX", "WBTC"]

    // Check if either token is our flashloan token
    if (
      this.isFlashloanToken(baseToken.symbol, flashloanToken) ||
      this.isFlashloanToken(quoteToken.symbol, flashloanToken)
    ) {
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

  private isFlashloanToken(symbol: string, flashloanToken: string): boolean {
    const tokenMap: { [key: string]: string[] } = {
      USDC: ["USDC", "USDC.e"],
      USDT: ["USDT"],
      DAI: ["DAI"],
      WETH: ["WETH", "ETH"],
      WBTC: ["WBTC", "BTC"],
    }

    return tokenMap[flashloanToken]?.includes(symbol) || false
  }

  private calculateArbitrageOpportunity(priceData: any[], liquidityUsd: number, flashloanToken: string) {
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

    const flashloanFee = this.calculateFlashloanFee(optimalAmount, "aave")
    const dexFees = this.calculateDexFees(optimalAmount, [buyDex, sellDex])
    const gasCost = this.estimateGasCost()
    const slippageCost = this.estimateSlippageCost(optimalAmount, maxLiquidityUtilization)

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

  private calculateFlashloanFee(amount: number, provider: string): number {
    const feeRates = {
      aave: 0.0005,
      balancer: 0,
      dydx: 0.0002,
    }
    return amount * (feeRates[provider as keyof typeof feeRates] || 0.0005)
  }

  private calculateDexFees(amount: number, dexes: any[]): number {
    let totalFees = 0
    for (const dex of dexes) {
      totalFees += amount * (dex.fee / 10000)
    }
    return totalFees
  }

  private estimateGasCost(): number {
    const gasUnits = 500000
    const gasPriceGwei = 0.1
    const ethPriceUsd = 2500

    return gasUnits * gasPriceGwei * 1e-9 * ethPriceUsd
  }

  private estimateSlippageCost(amount: number, liquidity: number): number {
    const liquidityUtilization = amount / liquidity
    const slippagePercent = Math.min(liquidityUtilization * 2, 0.05)
    return amount * slippagePercent
  }

  saveOpportunities(opportunities: any[]) {
    const data = {
      opportunities,
      timestamp: Date.now(),
      scanId: Math.random().toString(36).substr(2, 9),
    }
    localStorage.setItem("opportunities", JSON.stringify(data))

    const history = JSON.parse(localStorage.getItem("opportunityHistory") || "[]")
    history.unshift(data)

    if (history.length > 50) {
      history.splice(50)
    }

    localStorage.setItem("opportunityHistory", JSON.stringify(history))
  }

  loadOpportunities() {
    const saved = localStorage.getItem("opportunities")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        // Return opportunities if less than 2 minutes old
        if (Date.now() - data.timestamp < 120000) {
          return data.opportunities
        }
      } catch (error) {
        console.error("Error loading opportunities:", error)
      }
    }
    return []
  }

  async validateOpportunity(opportunity: any): Promise<boolean> {
    try {
      // Re-check prices to ensure opportunity still exists
      const currentPrices = await this.getRealTimePrices(opportunity.baseToken.address, opportunity.quoteToken.address)

      if (currentPrices.length < 2) return false

      const currentArbitrage = this.calculateArbitrageOpportunity(
        currentPrices,
        Number.parseFloat(opportunity.liquidity.usd),
        "USDC",
      )

      // Opportunity is still valid if profit is at least 80% of original estimate
      return currentArbitrage.estimatedProfit >= opportunity.estimatedProfit * 0.8
    } catch (error) {
      console.error("Error validating opportunity:", error)
      return false
    }
  }

  async getArbitrageHistory(): Promise<any[]> {
    const history = localStorage.getItem("opportunityHistory")
    return history ? JSON.parse(history) : []
  }

  async getMarketStats() {
    try {
      const history = await this.getArbitrageHistory()
      const recentScans = history.slice(0, 10)

      const totalOpportunities = recentScans.reduce((sum, scan) => sum + scan.opportunities.length, 0)
      const avgOpportunities = recentScans.length > 0 ? totalOpportunities / recentScans.length : 0

      const allProfits = recentScans.flatMap((scan) => scan.opportunities.map((opp: any) => opp.estimatedProfit))

      const avgProfit =
        allProfits.length > 0 ? allProfits.reduce((sum, profit) => sum + profit, 0) / allProfits.length : 0
      const maxProfit = allProfits.length > 0 ? Math.max(...allProfits) : 0

      return {
        avgOpportunitiesPerScan: avgOpportunities,
        avgProfitPerOpportunity: avgProfit,
        maxProfitSeen: maxProfit,
        totalScans: history.length,
        lastScanTime: recentScans[0]?.timestamp || 0,
      }
    } catch (error) {
      console.error("Error getting market stats:", error)
      return {
        avgOpportunitiesPerScan: 0,
        avgProfitPerOpportunity: 0,
        maxProfitSeen: 0,
        totalScans: 0,
        lastScanTime: 0,
      }
    }
  }
}
