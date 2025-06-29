export class BotService {
  private readonly DEXSCREENER_API = "https://api.dexscreener.com/latest/dex"
  private readonly ONEINCH_API = "https://api.1inch.io/v5.0/42161"
  private readonly COINGECKO_API = "https://api.coingecko.com/api/v3"

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

      // Use server API to fetch opportunities
      const response = await fetch("/api/arbitrage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "fetchOpportunities",
          flashloanToken,
          minLiquidity,
        }),
      })

      if (!response.ok) {
        throw new Error(`Server API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch opportunities")
      }

      console.log(`✅ Found ${data.opportunities.length} arbitrage opportunities`)

      // Save opportunities
      this.saveOpportunities(data.opportunities)

      return data.opportunities
    } catch (error) {
      console.error("Error fetching opportunities:", error)
      return this.loadOpportunities() // Return cached data on error
    }
  }

  // Keep all the existing private methods but remove ALCHEMY_API references
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

  async validateOpportunity(opportunity: any): Promise<boolean> {
    try {
      const response = await fetch("/api/arbitrage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "validateOpportunity",
          opportunity,
        }),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.valid
    } catch (error) {
      console.error("Error validating opportunity:", error)
      return false
    }
  }

  // Keep all other existing methods unchanged
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
