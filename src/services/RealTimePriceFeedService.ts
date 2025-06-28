export interface PriceData {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  timestamp: number
  source: string
  pair: string
  liquidity: number
  bid: number
  ask: number
  spread: number
}

export interface DEXPriceData {
  dex: string
  price: number
  liquidity: number
  volume24h: number
  fee: number
  timestamp: number
  poolAddress?: string
  token0: string
  token1: string
}

export interface AggregatedPriceData {
  symbol: string
  averagePrice: number
  bestBid: number
  bestAsk: number
  spread: number
  totalLiquidity: number
  totalVolume24h: number
  pricesByDEX: DEXPriceData[]
  lastUpdate: number
  priceHistory: { timestamp: number; price: number }[]
}

export class RealTimePriceFeedService {
  private priceData: Map<string, AggregatedPriceData> = new Map()
  private subscriptions: Map<string, ((data: AggregatedPriceData) => void)[]> = new Map()
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map()
  private isActive = false
  private websocketConnections: Map<string, WebSocket> = new Map()
  private apiKeys: Map<string, string> = new Map()
  private rateLimiters: Map<string, { lastCall: number; callCount: number }> = new Map()

  // Real API endpoints
  private readonly API_ENDPOINTS = {
    // The Graph Protocol endpoints
    uniswap_v3: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
    uniswap_v2: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
    sushiswap: "https://api.thegraph.com/subgraphs/name/sushiswap/exchange",

    // Direct API endpoints
    coingecko: "https://api.coingecko.com/api/v3",
    coinmarketcap: "https://pro-api.coinmarketcap.com/v1",
    dexscreener: "https://api.dexscreener.com/latest/dex",
    oneinch: "https://api.1inch.io/v5.0/42161", // Arbitrum

    // WebSocket endpoints
    binance_ws: "wss://stream.binance.com:9443/ws",
    coinbase_ws: "wss://ws-feed.exchange.coinbase.com",

    // Arbitrum specific
    arbitrum_rpc: "https://arbitrum-one.publicnode.com",
    alchemy_arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  }

  // Token addresses on Arbitrum
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

  constructor() {
    this.initializeAPIKeys()
    this.initializeRateLimiters()
  }

  private initializeAPIKeys() {
    this.apiKeys.set("coingecko", process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "")
    this.apiKeys.set("coinmarketcap", process.env.NEXT_PUBLIC_CMC_API_KEY || "")
    this.apiKeys.set("alchemy", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "")
    this.apiKeys.set("infura", process.env.NEXT_PUBLIC_INFURA_API_KEY || "")
  }

  private initializeRateLimiters() {
    // Initialize rate limiters for different APIs
    this.rateLimiters.set("coingecko", { lastCall: 0, callCount: 0 })
    this.rateLimiters.set("thegraph", { lastCall: 0, callCount: 0 })
    this.rateLimiters.set("dexscreener", { lastCall: 0, callCount: 0 })
  }

  private async checkRateLimit(apiName: string, maxCalls: number, windowMs: number): Promise<boolean> {
    const limiter = this.rateLimiters.get(apiName)
    if (!limiter) return true

    const now = Date.now()

    // Reset counter if window has passed
    if (now - limiter.lastCall > windowMs) {
      limiter.callCount = 0
      limiter.lastCall = now
    }

    if (limiter.callCount >= maxCalls) {
      console.warn(`Rate limit exceeded for ${apiName}`)
      return false
    }

    limiter.callCount++
    return true
  }

  async startPriceFeeds(symbols: string[] = ["WETH", "USDC", "USDT", "DAI", "WBTC", "ARB"]) {
    if (this.isActive) return

    this.isActive = true
    console.log("🚀 Starting real-time price feeds for:", symbols)

    // Initialize price data for each symbol
    for (const symbol of symbols) {
      await this.initializePriceData(symbol)
      this.startSymbolUpdates(symbol)
    }

    // Setup WebSocket connections
    await this.setupWebSocketConnections(symbols)

    console.log("✅ Real-time price feeds started")
  }

  stopPriceFeeds() {
    this.isActive = false

    this.updateIntervals.forEach((interval) => clearInterval(interval))
    this.updateIntervals.clear()

    this.websocketConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })
    this.websocketConnections.clear()

    console.log("⏹️ Price feeds stopped")
  }

  private async initializePriceData(symbol: string) {
    const initialData: AggregatedPriceData = {
      symbol,
      averagePrice: 0,
      bestBid: 0,
      bestAsk: 0,
      spread: 0,
      totalLiquidity: 0,
      totalVolume24h: 0,
      pricesByDEX: [],
      lastUpdate: Date.now(),
      priceHistory: [],
    }

    this.priceData.set(symbol, initialData)
    await this.updatePriceData(symbol)
  }

  private startSymbolUpdates(symbol: string) {
    const interval = setInterval(async () => {
      if (this.isActive) {
        await this.updatePriceData(symbol)
      }
    }, 10000) // Update every 10 seconds to respect rate limits

    this.updateIntervals.set(symbol, interval)
  }

  private async updatePriceData(symbol: string) {
    try {
      const dexPrices = await Promise.allSettled([
        this.fetchUniswapV3Price(symbol),
        this.fetchUniswapV2Price(symbol),
        this.fetchSushiSwapPrice(symbol),
        this.fetchDexScreenerPrice(symbol),
        this.fetchCoinGeckoPrice(symbol),
      ])

      const validPrices: DEXPriceData[] = dexPrices
        .filter((result) => result.status === "fulfilled")
        .map((result) => (result as PromiseFulfilledResult<DEXPriceData>).value)
        .filter((price) => price && price.price > 0)

      if (validPrices.length === 0) {
        console.warn(`No valid prices found for ${symbol}`)
        return
      }

      const aggregatedData = this.aggregatePriceData(symbol, validPrices)
      this.priceData.set(symbol, aggregatedData)
      this.notifySubscribers(symbol, aggregatedData)
    } catch (error) {
      console.error(`Error updating price data for ${symbol}:`, error)
    }
  }

  private async fetchUniswapV3Price(symbol: string): Promise<DEXPriceData> {
    if (!(await this.checkRateLimit("thegraph", 100, 60000))) {
      throw new Error("Rate limit exceeded for The Graph")
    }

    try {
      const tokenAddress = this.TOKEN_ADDRESSES[symbol as keyof typeof this.TOKEN_ADDRESSES]
      const usdcAddress = this.TOKEN_ADDRESSES.USDC

      if (!tokenAddress || !usdcAddress) {
        throw new Error(`Token address not found for ${symbol}`)
      }

      const query = `
        {
          pools(
            where: {
              or: [
                { token0: "${tokenAddress.toLowerCase()}", token1: "${usdcAddress.toLowerCase()}" },
                { token0: "${usdcAddress.toLowerCase()}", token1: "${tokenAddress.toLowerCase()}" }
              ]
            }
            orderBy: totalValueLockedUSD
            orderDirection: desc
            first: 1
          ) {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            token0Price
            token1Price
            totalValueLockedUSD
            volumeUSD
            feeTier
            tick
            sqrtPrice
          }
        }
      `

      const response = await fetch(this.API_ENDPOINTS.uniswap_v3, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
      }

      const pool = data.data?.pools?.[0]
      if (!pool) {
        throw new Error(`No Uniswap V3 pool found for ${symbol}`)
      }

      // Determine which token is our target and get the correct price
      const isToken0 = pool.token0.symbol === symbol
      const price = isToken0 ? Number.parseFloat(pool.token0Price) : Number.parseFloat(pool.token1Price)

      return {
        dex: "Uniswap V3",
        price,
        liquidity: Number.parseFloat(pool.totalValueLockedUSD),
        volume24h: Number.parseFloat(pool.volumeUSD),
        fee: Number.parseInt(pool.feeTier) / 10000,
        timestamp: Date.now(),
        poolAddress: pool.id,
        token0: pool.token0.symbol,
        token1: pool.token1.symbol,
      }
    } catch (error) {
      console.error(`Uniswap V3 price fetch error for ${symbol}:`, error)
      throw error
    }
  }

  private async fetchUniswapV2Price(symbol: string): Promise<DEXPriceData> {
    if (!(await this.checkRateLimit("thegraph", 100, 60000))) {
      throw new Error("Rate limit exceeded for The Graph")
    }

    try {
      const tokenAddress = this.TOKEN_ADDRESSES[symbol as keyof typeof this.TOKEN_ADDRESSES]
      const usdcAddress = this.TOKEN_ADDRESSES.USDC

      if (!tokenAddress || !usdcAddress) {
        throw new Error(`Token address not found for ${symbol}`)
      }

      const query = `
        {
          pairs(
            where: {
              or: [
                { token0: "${tokenAddress.toLowerCase()}", token1: "${usdcAddress.toLowerCase()}" },
                { token0: "${usdcAddress.toLowerCase()}", token1: "${tokenAddress.toLowerCase()}" }
              ]
            }
            orderBy: reserveUSD
            orderDirection: desc
            first: 1
          ) {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            token0Price
            token1Price
            reserveUSD
            volumeUSD
            reserve0
            reserve1
          }
        }
      `

      const response = await fetch(this.API_ENDPOINTS.uniswap_v2, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
      }

      const pair = data.data?.pairs?.[0]
      if (!pair) {
        throw new Error(`No Uniswap V2 pair found for ${symbol}`)
      }

      const isToken0 = pair.token0.symbol === symbol
      const price = isToken0 ? Number.parseFloat(pair.token0Price) : Number.parseFloat(pair.token1Price)

      return {
        dex: "Uniswap V2",
        price,
        liquidity: Number.parseFloat(pair.reserveUSD),
        volume24h: Number.parseFloat(pair.volumeUSD),
        fee: 0.3,
        timestamp: Date.now(),
        poolAddress: pair.id,
        token0: pair.token0.symbol,
        token1: pair.token1.symbol,
      }
    } catch (error) {
      console.error(`Uniswap V2 price fetch error for ${symbol}:`, error)
      throw error
    }
  }

  private async fetchSushiSwapPrice(symbol: string): Promise<DEXPriceData> {
    if (!(await this.checkRateLimit("thegraph", 100, 60000))) {
      throw new Error("Rate limit exceeded for The Graph")
    }

    try {
      const tokenAddress = this.TOKEN_ADDRESSES[symbol as keyof typeof this.TOKEN_ADDRESSES]
      const usdcAddress = this.TOKEN_ADDRESSES.USDC

      if (!tokenAddress || !usdcAddress) {
        throw new Error(`Token address not found for ${symbol}`)
      }

      const query = `
        {
          pairs(
            where: {
              or: [
                { token0: "${tokenAddress.toLowerCase()}", token1: "${usdcAddress.toLowerCase()}" },
                { token0: "${usdcAddress.toLowerCase()}", token1: "${tokenAddress.toLowerCase()}" }
              ]
            }
            orderBy: reserveUSD
            orderDirection: desc
            first: 1
          ) {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            token0Price
            token1Price
            reserveUSD
            volumeUSD
          }
        }
      `

      const response = await fetch(this.API_ENDPOINTS.sushiswap, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
      }

      const pair = data.data?.pairs?.[0]
      if (!pair) {
        throw new Error(`No SushiSwap pair found for ${symbol}`)
      }

      const isToken0 = pair.token0.symbol === symbol
      const price = isToken0 ? Number.parseFloat(pair.token0Price) : Number.parseFloat(pair.token1Price)

      return {
        dex: "SushiSwap",
        price,
        liquidity: Number.parseFloat(pair.reserveUSD),
        volume24h: Number.parseFloat(pair.volumeUSD),
        fee: 0.3,
        timestamp: Date.now(),
        poolAddress: pair.id,
        token0: pair.token0.symbol,
        token1: pair.token1.symbol,
      }
    } catch (error) {
      console.error(`SushiSwap price fetch error for ${symbol}:`, error)
      throw error
    }
  }

  private async fetchDexScreenerPrice(symbol: string): Promise<DEXPriceData> {
    if (!(await this.checkRateLimit("dexscreener", 300, 60000))) {
      throw new Error("Rate limit exceeded for DexScreener")
    }

    try {
      const tokenAddress = this.TOKEN_ADDRESSES[symbol as keyof typeof this.TOKEN_ADDRESSES]
      if (!tokenAddress) {
        throw new Error(`Token address not found for ${symbol}`)
      }

      const response = await fetch(`${this.API_ENDPOINTS.dexscreener}/tokens/${tokenAddress}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "FlashloanArbitrageBot/1.0",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.pairs || data.pairs.length === 0) {
        throw new Error(`No DexScreener pairs found for ${symbol}`)
      }

      // Find the pair with highest liquidity
      const bestPair = data.pairs
        .filter((pair: any) => pair.chainId === "arbitrum")
        .sort(
          (a: any, b: any) => Number.parseFloat(b.liquidity?.usd || "0") - Number.parseFloat(a.liquidity?.usd || "0"),
        )[0]

      if (!bestPair) {
        throw new Error(`No suitable DexScreener pair found for ${symbol}`)
      }

      return {
        dex: `DexScreener (${bestPair.dexId})`,
        price: Number.parseFloat(bestPair.priceUsd),
        liquidity: Number.parseFloat(bestPair.liquidity?.usd || "0"),
        volume24h: Number.parseFloat(bestPair.volume?.h24 || "0"),
        fee: 0.3, // Default fee
        timestamp: Date.now(),
        poolAddress: bestPair.pairAddress,
        token0: bestPair.baseToken.symbol,
        token1: bestPair.quoteToken.symbol,
      }
    } catch (error) {
      console.error(`DexScreener price fetch error for ${symbol}:`, error)
      throw error
    }
  }

  private async fetchCoinGeckoPrice(symbol: string): Promise<DEXPriceData> {
    if (!(await this.checkRateLimit("coingecko", 50, 60000))) {
      throw new Error("Rate limit exceeded for CoinGecko")
    }

    try {
      const coinIds: { [key: string]: string } = {
        WETH: "ethereum",
        USDC: "usd-coin",
        USDT: "tether",
        DAI: "dai",
        WBTC: "wrapped-bitcoin",
        ARB: "arbitrum",
        GMX: "gmx",
      }

      const coinId = coinIds[symbol]
      if (!coinId) {
        throw new Error(`CoinGecko ID not found for ${symbol}`)
      }

      const apiKey = this.apiKeys.get("coingecko")
      const url = `${this.API_ENDPOINTS.coingecko}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`

      const headers: HeadersInit = {
        Accept: "application/json",
      }

      if (apiKey) {
        headers["x-cg-demo-api-key"] = apiKey
      }

      const response = await fetch(url, { headers })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const coinData = data[coinId]

      if (!coinData) {
        throw new Error(`No CoinGecko data found for ${symbol}`)
      }

      return {
        dex: "CoinGecko",
        price: coinData.usd,
        liquidity: coinData.usd_market_cap || 0,
        volume24h: coinData.usd_24h_vol || 0,
        fee: 0,
        timestamp: Date.now(),
        token0: symbol,
        token1: "USD",
      }
    } catch (error) {
      console.error(`CoinGecko price fetch error for ${symbol}:`, error)
      throw error
    }
  }

  private aggregatePriceData(symbol: string, dexPrices: DEXPriceData[]): AggregatedPriceData {
    const currentData = this.priceData.get(symbol)
    const totalLiquidity = dexPrices.reduce((sum, price) => sum + price.liquidity, 0)
    const totalVolume24h = dexPrices.reduce((sum, price) => sum + price.volume24h, 0)

    // Calculate weighted average price based on liquidity
    const weightedPrice =
      totalLiquidity > 0
        ? dexPrices.reduce((sum, price) => sum + price.price * price.liquidity, 0) / totalLiquidity
        : dexPrices.reduce((sum, price) => sum + price.price, 0) / dexPrices.length

    // Find best bid and ask
    const prices = dexPrices.map((p) => p.price).sort((a, b) => a - b)
    const bestBid = prices[0] || 0
    const bestAsk = prices[prices.length - 1] || 0
    const spread = bestBid > 0 ? ((bestAsk - bestBid) / bestBid) * 100 : 0

    // Update price history
    const priceHistory = currentData?.priceHistory || []
    priceHistory.push({ timestamp: Date.now(), price: weightedPrice })

    // Keep only last 100 price points
    if (priceHistory.length > 100) {
      priceHistory.splice(0, priceHistory.length - 100)
    }

    return {
      symbol,
      averagePrice: weightedPrice,
      bestBid,
      bestAsk,
      spread,
      totalLiquidity,
      totalVolume24h,
      pricesByDEX: dexPrices.sort((a, b) => b.liquidity - a.liquidity),
      lastUpdate: Date.now(),
      priceHistory,
    }
  }

  private async setupWebSocketConnections(symbols: string[]) {
    // Setup Binance WebSocket for major crypto prices
    try {
      const streams = symbols
        .filter((symbol) => ["WETH", "WBTC"].includes(symbol))
        .map((symbol) => {
          const binanceSymbol = symbol === "WETH" ? "ethusdt" : "btcusdt"
          return `${binanceSymbol}@ticker`
        })
        .join("/")

      if (streams) {
        const wsUrl = `${this.API_ENDPOINTS.binance_ws}/${streams}`
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log("📡 Binance WebSocket connected")
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleBinanceWebSocketUpdate(data)
          } catch (error) {
            console.error("Binance WebSocket message parse error:", error)
          }
        }

        ws.onclose = () => {
          console.log("📡 Binance WebSocket disconnected")
          // Attempt reconnection after 5 seconds
          setTimeout(() => {
            if (this.isActive) {
              this.setupWebSocketConnections(symbols)
            }
          }, 5000)
        }

        ws.onerror = (error) => {
          console.error("Binance WebSocket error:", error)
        }

        this.websocketConnections.set("binance", ws)
      }
    } catch (error) {
      console.error("Binance WebSocket setup error:", error)
    }

    // Setup Coinbase WebSocket for additional price feeds
    try {
      const ws = new WebSocket(this.API_ENDPOINTS.coinbase_ws)

      ws.onopen = () => {
        console.log("📡 Coinbase WebSocket connected")

        const subscribeMessage = {
          type: "subscribe",
          product_ids: ["ETH-USD", "BTC-USD"],
          channels: ["ticker"],
        }

        ws.send(JSON.stringify(subscribeMessage))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleCoinbaseWebSocketUpdate(data)
        } catch (error) {
          console.error("Coinbase WebSocket message parse error:", error)
        }
      }

      ws.onclose = () => {
        console.log("📡 Coinbase WebSocket disconnected")
      }

      this.websocketConnections.set("coinbase", ws)
    } catch (error) {
      console.error("Coinbase WebSocket setup error:", error)
    }
  }

  private handleBinanceWebSocketUpdate(data: any) {
    if (data.e === "24hrTicker") {
      const symbol = data.s === "ETHUSDT" ? "WETH" : data.s === "BTCUSDT" ? "WBTC" : null

      if (symbol) {
        const currentData = this.priceData.get(symbol)
        if (currentData) {
          const price = Number.parseFloat(data.c) // Current price

          // Update price history
          currentData.priceHistory.push({
            timestamp: Date.now(),
            price,
          })

          // Keep only last 100 points
          if (currentData.priceHistory.length > 100) {
            currentData.priceHistory.splice(0, currentData.priceHistory.length - 100)
          }

          // Update average price with WebSocket data
          currentData.averagePrice = price
          currentData.lastUpdate = Date.now()

          this.priceData.set(symbol, currentData)
          this.notifySubscribers(symbol, currentData)
        }
      }
    }
  }

  private handleCoinbaseWebSocketUpdate(data: any) {
    if (data.type === "ticker") {
      const symbol = data.product_id === "ETH-USD" ? "WETH" : data.product_id === "BTC-USD" ? "WBTC" : null

      if (symbol) {
        const currentData = this.priceData.get(symbol)
        if (currentData) {
          const price = Number.parseFloat(data.price)

          // Update price history
          currentData.priceHistory.push({
            timestamp: Date.now(),
            price,
          })

          // Keep only last 100 points
          if (currentData.priceHistory.length > 100) {
            currentData.priceHistory.splice(0, currentData.priceHistory.length - 100)
          }

          currentData.averagePrice = price
          currentData.lastUpdate = Date.now()

          this.priceData.set(symbol, currentData)
          this.notifySubscribers(symbol, currentData)
        }
      }
    }
  }

  subscribe(symbol: string, callback: (data: AggregatedPriceData) => void) {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, [])
    }
    this.subscriptions.get(symbol)!.push(callback)

    const currentData = this.priceData.get(symbol)
    if (currentData) {
      callback(currentData)
    }
  }

  unsubscribe(symbol: string, callback: (data: AggregatedPriceData) => void) {
    const callbacks = this.subscriptions.get(symbol)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private notifySubscribers(symbol: string, data: AggregatedPriceData) {
    const callbacks = this.subscriptions.get(symbol)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error("Subscriber callback error:", error)
        }
      })
    }
  }

  getPriceData(symbol: string): AggregatedPriceData | null {
    return this.priceData.get(symbol) || null
  }

  getAllPriceData(): Map<string, AggregatedPriceData> {
    return new Map(this.priceData)
  }

  getPriceComparison(symbol: string): {
    symbol: string
    bestPrice: { dex: string; price: number }
    worstPrice: { dex: string; price: number }
    spread: number
    arbitrageOpportunity: boolean
  } | null {
    const data = this.priceData.get(symbol)
    if (!data || data.pricesByDEX.length < 2) return null

    const prices = data.pricesByDEX.map((p) => ({ dex: p.dex, price: p.price }))
    const sortedPrices = prices.sort((a, b) => a.price - b.price)

    const bestPrice = sortedPrices[0]
    const worstPrice = sortedPrices[sortedPrices.length - 1]
    const spread = ((worstPrice.price - bestPrice.price) / bestPrice.price) * 100

    return {
      symbol,
      bestPrice,
      worstPrice,
      spread,
      arbitrageOpportunity: spread > 0.5,
    }
  }

  cleanup() {
    this.stopPriceFeeds()
    this.priceData.clear()
    this.subscriptions.clear()
    this.rateLimiters.clear()
  }
}
