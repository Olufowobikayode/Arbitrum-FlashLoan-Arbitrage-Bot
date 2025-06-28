import type Web3 from "web3"

export interface Token {
  address: string
  symbol: string
  decimals: number
  chainId: number
}

export interface DEXInfo {
  address: string
  name: string
  fee: number
  type: "v2" | "v3" | "stable" | "curve"
  isActive: boolean
}

export interface Edge {
  from: Token
  to: Token
  dex: DEXInfo
  price: number
  liquidity: number
  fee: number
  gasEstimate: number
  lastUpdate: number
}

export interface ArbitragePath {
  tokens: Token[]
  dexes: DEXInfo[]
  edges: Edge[]
  totalProfit: number
  totalGasCost: number
  netProfit: number
  profitRatio: number
  riskScore: number
  executionTime: number
  isValid: boolean
  pathId: string
}

export interface PathfindingConfig {
  maxHops: number
  minProfitThreshold: number
  maxGasPrice: number
  maxSlippage: number
  updateInterval: number
  enabledDEXes: string[]
  priorityTokens: string[]
}

export class ArbitragePathfindingService {
  private web3: Web3
  private config: PathfindingConfig
  private tokens: Map<string, Token> = new Map()
  private dexes: Map<string, DEXInfo> = new Map()
  private edges: Map<string, Edge> = new Map()
  private paths: Map<string, ArbitragePath> = new Map()
  private priceUpdateInterval: NodeJS.Timeout | null = null
  private isUpdating = false

  constructor(web3: Web3, config: PathfindingConfig) {
    this.web3 = web3
    this.config = config
    this.initializeTokensAndDEXes()
    this.startPriceUpdates()
  }

  /**
   * Initialize tokens and DEXes
   */
  private initializeTokensAndDEXes() {
    // Initialize common tokens
    const commonTokens: Token[] = [
      {
        address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        symbol: "WETH",
        decimals: 18,
        chainId: 42161,
      },
      {
        address: "0xA0b86a33E6441b8e776f1b0b8e8b8e8b8e8b8e8b",
        symbol: "USDC",
        decimals: 6,
        chainId: 42161,
      },
      {
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        symbol: "USDT",
        decimals: 6,
        chainId: 42161,
      },
      {
        address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        symbol: "DAI",
        decimals: 18,
        chainId: 42161,
      },
      {
        address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
        symbol: "WBTC",
        decimals: 8,
        chainId: 42161,
      },
    ]

    commonTokens.forEach((token) => {
      this.tokens.set(token.address.toLowerCase(), token)
    })

    // Initialize DEXes
    const dexList: DEXInfo[] = [
      {
        address: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        name: "Uniswap V2",
        fee: 30,
        type: "v2",
        isActive: true,
      },
      {
        address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        name: "Uniswap V3",
        fee: 30,
        type: "v3",
        isActive: true,
      },
      {
        address: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        name: "SushiSwap",
        fee: 30,
        type: "v2",
        isActive: true,
      },
      {
        address: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        name: "Balancer",
        fee: 25,
        type: "stable",
        isActive: true,
      },
    ]

    dexList.forEach((dex) => {
      this.dexes.set(dex.address.toLowerCase(), dex)
    })
  }

  /**
   * Start price updates
   */
  private startPriceUpdates() {
    if (this.priceUpdateInterval) return

    this.priceUpdateInterval = setInterval(() => {
      this.updatePrices()
    }, this.config.updateInterval)

    // Initial price update
    this.updatePrices()
  }

  /**
   * Stop price updates
   */
  stopPriceUpdates() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
      this.priceUpdateInterval = null
    }
  }

  /**
   * Update prices for all token pairs
   */
  private async updatePrices() {
    if (this.isUpdating) return

    this.isUpdating = true

    try {
      const tokens = Array.from(this.tokens.values())
      const dexes = Array.from(this.dexes.values()).filter(
        (dex) => dex.isActive && this.config.enabledDEXes.includes(dex.name),
      )

      // Update prices for all token pairs on all DEXes
      for (let i = 0; i < tokens.length; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          const tokenA = tokens[i]
          const tokenB = tokens[j]

          for (const dex of dexes) {
            await this.updateTokenPairPrice(tokenA, tokenB, dex)
            await this.updateTokenPairPrice(tokenB, tokenA, dex) // Reverse direction
          }
        }
      }

      console.log(`Updated prices for ${this.edges.size} edges`)
    } catch (error) {
      console.error("Error updating prices:", error)
    } finally {
      this.isUpdating = false
    }
  }

  /**
   * Update price for a specific token pair on a DEX
   */
  private async updateTokenPairPrice(tokenA: Token, tokenB: Token, dex: DEXInfo) {
    try {
      const edgeKey = `${tokenA.address}_${tokenB.address}_${dex.address}`

      // Get price and liquidity from DEX
      const priceData = await this.fetchPriceFromDEX(tokenA, tokenB, dex)

      if (priceData) {
        const edge: Edge = {
          from: tokenA,
          to: tokenB,
          dex,
          price: priceData.price,
          liquidity: priceData.liquidity,
          fee: dex.fee,
          gasEstimate: this.estimateGasForSwap(dex),
          lastUpdate: Date.now(),
        }

        this.edges.set(edgeKey, edge)
      }
    } catch (error) {
      console.error(`Error updating price for ${tokenA.symbol}/${tokenB.symbol} on ${dex.name}:`, error)
    }
  }

  /**
   * Fetch price from DEX (simplified implementation)
   */
  private async fetchPriceFromDEX(
    tokenA: Token,
    tokenB: Token,
    dex: DEXInfo,
  ): Promise<{ price: number; liquidity: number } | null> {
    try {
      // Simplified price fetching - in production, query actual DEX contracts
      const mockPrices: { [key: string]: { [key: string]: number } } = {
        WETH: { USDC: 2500, USDT: 2500, DAI: 2500, WBTC: 0.055 },
        USDC: { WETH: 0.0004, USDT: 1.0, DAI: 1.0, WBTC: 0.000022 },
        USDT: { WETH: 0.0004, USDC: 1.0, DAI: 1.0, WBTC: 0.000022 },
        DAI: { WETH: 0.0004, USDC: 1.0, USDT: 1.0, WBTC: 0.000022 },
        WBTC: { WETH: 18, USDC: 45000, USDT: 45000, DAI: 45000 },
      }

      const basePrice = mockPrices[tokenA.symbol]?.[tokenB.symbol]
      if (!basePrice) return null

      // Add some variation based on DEX and random factors
      const dexVariation = this.getDEXPriceVariation(dex)
      const randomVariation = (Math.random() - 0.5) * 0.02 // ±1%

      const price = basePrice * (1 + dexVariation + randomVariation)
      const liquidity = Math.random() * 1000000 + 100000 // $100k - $1M

      return { price, liquidity }
    } catch (error) {
      console.error("Error fetching price from DEX:", error)
      return null
    }
  }

  /**
   * Get DEX-specific price variation
   */
  private getDEXPriceVariation(dex: DEXInfo): number {
    const variations: { [key: string]: number } = {
      "Uniswap V2": 0,
      "Uniswap V3": -0.001, // Slightly better prices
      SushiSwap: 0.002, // Slightly worse prices
      Balancer: -0.0005, // Slightly better for stable pairs
    }

    return variations[dex.name] || 0
  }

  /**
   * Estimate gas for swap
   */
  private estimateGasForSwap(dex: DEXInfo): number {
    const gasEstimates: { [key: string]: number } = {
      v2: 150000,
      v3: 180000,
      stable: 120000,
      curve: 200000,
    }

    return gasEstimates[dex.type] || 150000
  }

  /**
   * Find arbitrage paths using Bellman-Ford algorithm
   */
  async findArbitragePaths(startToken: string, amount: number, maxHops?: number): Promise<ArbitragePath[]> {
    const maxPathHops = maxHops || this.config.maxHops
    const startTokenObj = this.tokens.get(startToken.toLowerCase())

    if (!startTokenObj) {
      throw new Error(`Token ${startToken} not found`)
    }

    const paths: ArbitragePath[] = []

    // Initialize distances (negative log of exchange rates for Bellman-Ford)
    const distances = new Map<string, number>()
    const predecessors = new Map<string, Edge | null>()
    const tokens = Array.from(this.tokens.values())

    // Initialize distances
    tokens.forEach((token) => {
      distances.set(token.address, token.address === startTokenObj.address ? 0 : Number.POSITIVE_INFINITY)
      predecessors.set(token.address, null)
    })

    // Bellman-Ford algorithm for negative cycle detection
    for (let i = 0; i < tokens.length - 1; i++) {
      let updated = false

      for (const edge of this.edges.values()) {
        if (edge.lastUpdate < Date.now() - 60000) continue // Skip stale edges

        const fromDist = distances.get(edge.from.address) || Number.POSITIVE_INFINITY
        if (fromDist === Number.POSITIVE_INFINITY) continue

        // Calculate negative log of exchange rate (accounting for fees)
        const effectiveRate = edge.price * (1 - edge.fee / 10000)
        const weight = -Math.log(effectiveRate)
        const newDist = fromDist + weight

        const toDist = distances.get(edge.to.address) || Number.POSITIVE_INFINITY
        if (newDist < toDist) {
          distances.set(edge.to.address, newDist)
          predecessors.set(edge.to.address, edge)
          updated = true
        }
      }

      if (!updated) break
    }

    // Check for negative cycles (arbitrage opportunities)
    const arbitrageTokens = new Set<string>()

    for (const edge of this.edges.values()) {
      if (edge.lastUpdate < Date.now() - 60000) continue

      const fromDist = distances.get(edge.from.address) || Number.POSITIVE_INFINITY
      if (fromDist === Number.POSITIVE_INFINITY) continue

      const effectiveRate = edge.price * (1 - edge.fee / 10000)
      const weight = -Math.log(effectiveRate)
      const newDist = fromDist + weight

      const toDist = distances.get(edge.to.address) || Number.POSITIVE_INFINITY
      if (newDist < toDist) {
        arbitrageTokens.add(edge.to.address)
      }
    }

    // Reconstruct arbitrage paths
    for (const tokenAddress of arbitrageTokens) {
      const path = this.reconstructPath(startTokenObj.address, tokenAddress, predecessors, maxPathHops)

      if (path && path.tokens.length <= maxPathHops + 1) {
        const calculatedPath = await this.calculatePathProfitability(path, amount)

        if (calculatedPath && calculatedPath.netProfit > this.config.minProfitThreshold) {
          paths.push(calculatedPath)
        }
      }
    }

    // Sort by net profit descending
    paths.sort((a, b) => b.netProfit - a.netProfit)

    return paths.slice(0, 10) // Return top 10 paths
  }

  /**
   * Reconstruct path from predecessors
   */
  private reconstructPath(
    startToken: string,
    endToken: string,
    predecessors: Map<string, Edge | null>,
    maxHops: number,
  ): { tokens: Token[]; dexes: DEXInfo[]; edges: Edge[] } | null {
    const tokens: Token[] = []
    const dexes: DEXInfo[] = []
    const edges: Edge[] = []

    let current = endToken
    let hops = 0

    while (current !== startToken && hops < maxHops) {
      const edge = predecessors.get(current)
      if (!edge) break

      tokens.unshift(edge.to)
      dexes.unshift(edge.dex)
      edges.unshift(edge)

      current = edge.from.address
      hops++
    }

    if (current === startToken && hops > 0) {
      const startTokenObj = this.tokens.get(startToken)
      if (startTokenObj) {
        tokens.unshift(startTokenObj)
        return { tokens, dexes, edges }
      }
    }

    return null
  }

  /**
   * Calculate path profitability
   */
  private async calculatePathProfitability(
    path: { tokens: Token[]; dexes: DEXInfo[]; edges: Edge[] },
    amount: number,
  ): Promise<ArbitragePath | null> {
    try {
      let currentAmount = amount
      let totalGasCost = 0
      let totalFees = 0
      let riskScore = 0

      // Simulate execution through the path
      for (let i = 0; i < path.edges.length; i++) {
        const edge = path.edges[i]

        // Check liquidity
        if (currentAmount > edge.liquidity * 0.1) {
          // Don't use more than 10% of liquidity
          riskScore += 20
        }

        // Calculate output amount
        const feeAmount = currentAmount * (edge.fee / 10000)
        const outputAmount = (currentAmount - feeAmount) * edge.price

        // Apply slippage
        const slippage = this.calculateSlippage(currentAmount, edge.liquidity)
        const slippageAmount = outputAmount * slippage

        currentAmount = outputAmount - slippageAmount
        totalFees += feeAmount
        totalGasCost += ((edge.gasEstimate * this.config.maxGasPrice) / 1e18) * 2500 // Convert to USD

        // Add risk based on price age
        const priceAge = Date.now() - edge.lastUpdate
        if (priceAge > 30000) riskScore += 10 // 30 seconds old
        if (priceAge > 60000) riskScore += 20 // 1 minute old
      }

      const totalProfit = currentAmount - amount
      const netProfit = totalProfit - totalGasCost
      const profitRatio = netProfit / amount

      // Additional risk factors
      if (path.edges.length > 3) riskScore += 10 // Multi-hop risk
      if (totalGasCost > totalProfit * 0.5) riskScore += 20 // High gas cost

      const arbitragePath: ArbitragePath = {
        tokens: path.tokens,
        dexes: path.dexes,
        edges: path.edges,
        totalProfit,
        totalGasCost,
        netProfit,
        profitRatio,
        riskScore: Math.min(100, riskScore),
        executionTime: this.estimateExecutionTime(path.edges.length),
        isValid: netProfit > this.config.minProfitThreshold && riskScore < 80,
        pathId: this.generatePathId(path),
      }

      return arbitragePath
    } catch (error) {
      console.error("Error calculating path profitability:", error)
      return null
    }
  }

  /**
   * Calculate slippage based on trade size and liquidity
   */
  private calculateSlippage(amount: number, liquidity: number): number {
    const impactRatio = amount / liquidity

    if (impactRatio < 0.01) return 0.001 // 0.1% for small trades
    if (impactRatio < 0.05) return 0.005 // 0.5% for medium trades
    if (impactRatio < 0.1) return 0.01 // 1% for large trades

    return 0.02 // 2% for very large trades
  }

  /**
   * Estimate execution time
   */
  private estimateExecutionTime(hops: number): number {
    const baseTime = 15 // 15 seconds base
    const hopTime = 5 // 5 seconds per hop

    return baseTime + (hops - 1) * hopTime
  }

  /**
   * Generate path ID
   */
  private generatePathId(path: { tokens: Token[]; dexes: DEXInfo[] }): string {
    const tokenSymbols = path.tokens.map((t) => t.symbol).join("-")
    const dexNames = path.dexes.map((d) => d.name.replace(/\s+/g, "")).join("-")

    return `${tokenSymbols}_${dexNames}_${Date.now()}`
  }

  /**
   * Get all available tokens
   */
  getTokens(): Token[] {
    return Array.from(this.tokens.values())
  }

  /**
   * Get all available DEXes
   */
  getDEXes(): DEXInfo[] {
    return Array.from(this.dexes.values())
  }

  /**
   * Get current edges (price data)
   */
  getEdges(): Edge[] {
    return Array.from(this.edges.values()).filter((edge) => edge.lastUpdate > Date.now() - 300000) // Last 5 minutes
  }

  /**
   * Add custom token
   */
  addToken(token: Token) {
    this.tokens.set(token.address.toLowerCase(), token)
  }

  /**
   * Add custom DEX
   */
  addDEX(dex: DEXInfo) {
    this.dexes.set(dex.address.toLowerCase(), dex)
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PathfindingConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get configuration
   */
  getConfig(): PathfindingConfig {
    return { ...this.config }
  }

  /**
   * Clear old paths and edges
   */
  clearOldData() {
    const now = Date.now()

    // Remove edges older than 5 minutes
    for (const [key, edge] of this.edges) {
      if (now - edge.lastUpdate > 300000) {
        this.edges.delete(key)
      }
    }

    // Remove paths older than 1 minute
    for (const [key, path] of this.paths) {
      const pathTime = Number.parseInt(path.pathId.split("_").pop() || "0")
      if (now - pathTime > 60000) {
        this.paths.delete(key)
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopPriceUpdates()
    this.edges.clear()
    this.paths.clear()
  }
}
