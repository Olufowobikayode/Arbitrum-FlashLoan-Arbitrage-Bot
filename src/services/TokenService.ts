export class TokenService {
  private cache: Map<string, any> = new Map()
  private readonly CACHE_EXPIRY = 3600000 // 1 hour

  private readonly POPULAR_TOKENS = {
    "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1": "WETH",
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831": "USDC",
    "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8": "USDC.e",
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9": "USDT",
    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1": "DAI",
    "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f": "WBTC",
    "0x912CE59144191C1204E64559FE8253a0e49E6548": "ARB",
  }

  constructor() {
    this.loadCache()
  }

  async getTokenPrice(tokenAddress: string): Promise<number | null> {
    const cacheKey = `price_${tokenAddress}`
    const cached = this.getFromCache(cacheKey)

    if (cached) {
      return cached.price
    }

    try {
      // Try DexScreener first
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)
      const data = await response.json()

      if (data.pairs && data.pairs.length > 0) {
        const validPairs = data.pairs.filter((p: any) => p.liquidity?.usd)
        if (validPairs.length > 0) {
          const highestLiquidityPair = validPairs.reduce((max: any, pair: any) =>
            Number.parseFloat(pair.liquidity.usd) > Number.parseFloat(max.liquidity.usd) ? pair : max,
          )

          const price = Number.parseFloat(highestLiquidityPair.priceUsd)
          this.setCache(cacheKey, { price, timestamp: Date.now() })
          return price
        }
      }
    } catch (error) {
      console.error("Error fetching token price:", error)
    }

    return null
  }

  getTokenSymbol(tokenAddress: string): string {
    return (
      this.POPULAR_TOKENS[tokenAddress as keyof typeof this.POPULAR_TOKENS] ||
      `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`
    )
  }

  getTokenDecimals(tokenAddress: string): number {
    // Most tokens use 18 decimals, USDC/USDT use 6
    if (
      tokenAddress === "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" || // USDC
      tokenAddress === "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8" || // USDC.e
      tokenAddress === "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
    ) {
      // USDT
      return 6
    }
    return 18
  }

  async getTokenMetadata(tokenAddress: string) {
    const cacheKey = `metadata_${tokenAddress}`
    const cached = this.getFromCache(cacheKey)

    if (cached) {
      return cached
    }

    const metadata = {
      symbol: this.getTokenSymbol(tokenAddress),
      decimals: this.getTokenDecimals(tokenAddress),
      price: await this.getTokenPrice(tokenAddress),
    }

    this.setCache(cacheKey, { ...metadata, timestamp: Date.now() })
    return metadata
  }

  calculateUSDValue(tokenAddress: string, balance: string): number {
    const decimals = this.getTokenDecimals(tokenAddress)
    const normalizedBalance = Number.parseFloat(balance) / Math.pow(10, decimals)

    const cacheKey = `price_${tokenAddress}`
    const cached = this.getFromCache(cacheKey)

    if (cached && cached.price) {
      return normalizedBalance * cached.price
    }

    return 0
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
      return cached
    }
    return null
  }

  private setCache(key: string, value: any) {
    this.cache.set(key, value)
    this.saveCache()
  }

  private loadCache() {
    const saved = localStorage.getItem("tokenCache")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        this.cache = new Map(Object.entries(data))
      } catch (error) {
        console.error("Error loading token cache:", error)
      }
    }
  }

  private saveCache() {
    const data = Object.fromEntries(this.cache)
    localStorage.setItem("tokenCache", JSON.stringify(data))
  }
}
