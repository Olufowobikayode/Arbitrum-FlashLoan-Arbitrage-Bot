import type Web3 from "web3"

export interface GasOptimizationConfig {
  minGasPrice: number // in Gwei
  maxGasPrice: number // in Gwei
  targetConfirmationTime: number // in seconds
  mevProtectionMultiplier: number // 1.0 = no change, 1.5 = 50% increase
  networkCongestionThreshold: number // 0-100
  priceUpdateInterval: number // in milliseconds
  historicalDataPoints: number
  aggressiveMode: boolean
  priorityFeeEnabled: boolean
  maxPriorityFee: number // in Gwei
  gasLimitBuffer: number // percentage buffer for gas limit
}

export interface GasMetrics {
  currentGasPrice: number
  recommendedGasPrice: number
  priorityFee: number
  networkCongestion: number
  averageConfirmationTime: number
  mevRiskLevel: number
  priceHistory: number[]
  lastUpdate: number
  confidence: number
  volatility: number
  pendingTransactions: number
  blockUtilization: number
}

export interface GasStrategy {
  name: string
  description: string
  baseMultiplier: number
  priorityMultiplier: number
  conditions: string[]
  riskLevel: "low" | "medium" | "high"
  maxGasPrice: number
  targetConfirmationBlocks: number
}

export interface GasPrediction {
  nextBlockGasPrice: number
  next5BlocksGasPrice: number
  confidence: number
  trend: "increasing" | "decreasing" | "stable"
  volatilityScore: number
}

export class DynamicGasOptimizationService {
  private web3: Web3
  private config: GasOptimizationConfig
  private gasHistory: number[] = []
  private priorityFeeHistory: number[] = []
  private confirmationTimes: number[] = []
  private mevEvents: number[] = []
  private blockUtilization: number[] = []
  private pendingTxCounts: number[] = []
  private updateInterval: NodeJS.Timeout | null = null
  private isOptimizing = false
  private lastBlockNumber = 0

  // Enhanced gas strategies
  private strategies: Map<string, GasStrategy> = new Map([
    [
      "eco",
      {
        name: "Economy",
        description: "Lowest cost, longer confirmation times (5-10 blocks)",
        baseMultiplier: 0.9,
        priorityMultiplier: 0.5,
        conditions: ["Low network congestion", "No time pressure"],
        riskLevel: "low",
        maxGasPrice: 50,
        targetConfirmationBlocks: 8,
      },
    ],
    [
      "standard",
      {
        name: "Standard",
        description: "Balanced approach for normal conditions (2-5 blocks)",
        baseMultiplier: 1.1,
        priorityMultiplier: 1.0,
        conditions: ["Normal network conditions"],
        riskLevel: "medium",
        maxGasPrice: 100,
        targetConfirmationBlocks: 3,
      },
    ],
    [
      "fast",
      {
        name: "Fast",
        description: "Higher gas for faster confirmation (1-2 blocks)",
        baseMultiplier: 1.3,
        priorityMultiplier: 1.5,
        conditions: ["Time-sensitive trades", "Moderate congestion"],
        riskLevel: "medium",
        maxGasPrice: 200,
        targetConfirmationBlocks: 2,
      },
    ],
    [
      "aggressive",
      {
        name: "Aggressive",
        description: "Premium gas for immediate inclusion (next block)",
        baseMultiplier: 1.8,
        priorityMultiplier: 2.0,
        conditions: ["High network congestion", "Critical arbitrage"],
        riskLevel: "high",
        maxGasPrice: 300,
        targetConfirmationBlocks: 1,
      },
    ],
    [
      "mev_protection",
      {
        name: "MEV Protection",
        description: "Maximum gas to prevent MEV attacks",
        baseMultiplier: 2.5,
        priorityMultiplier: 3.0,
        conditions: ["MEV activity detected", "High-value transactions"],
        riskLevel: "high",
        maxGasPrice: 500,
        targetConfirmationBlocks: 1,
      },
    ],
    [
      "flashbot",
      {
        name: "Flashbot",
        description: "Optimized for private mempool submission",
        baseMultiplier: 1.0,
        priorityMultiplier: 0.1,
        conditions: ["Private mempool available", "MEV protection needed"],
        riskLevel: "low",
        maxGasPrice: 150,
        targetConfirmationBlocks: 1,
      },
    ],
  ])

  constructor(web3: Web3, config: GasOptimizationConfig) {
    this.web3 = web3
    this.config = config
    this.startOptimization()
  }

  /**
   * Start gas optimization monitoring
   */
  startOptimization() {
    if (this.updateInterval) return

    this.updateInterval = setInterval(() => {
      this.updateGasMetrics()
    }, this.config.priceUpdateInterval)

    // Initial update
    this.updateGasMetrics()
    console.log("🚀 Dynamic gas optimization started")
  }

  /**
   * Stop gas optimization monitoring
   */
  stopOptimization() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    console.log("⏹️ Dynamic gas optimization stopped")
  }

  /**
   * Update gas metrics with comprehensive network analysis
   */
  private async updateGasMetrics() {
    if (this.isOptimizing) return

    this.isOptimizing = true

    try {
      // Get current gas price and priority fee
      const [currentGasPrice, priorityFee] = await Promise.all([
        this.getCurrentGasPrice(),
        this.getCurrentPriorityFee(),
      ])

      // Update price histories
      this.gasHistory.push(currentGasPrice)
      this.priorityFeeHistory.push(priorityFee)

      if (this.gasHistory.length > this.config.historicalDataPoints) {
        this.gasHistory.shift()
        this.priorityFeeHistory.shift()
      }

      // Get network metrics
      const [networkCongestion, blockUtilization, pendingTxCount] = await Promise.all([
        this.calculateNetworkCongestion(),
        this.getBlockUtilization(),
        this.getPendingTransactionCount(),
      ])

      this.blockUtilization.push(blockUtilization)
      this.pendingTxCounts.push(pendingTxCount)

      if (this.blockUtilization.length > 20) {
        this.blockUtilization.shift()
        this.pendingTxCounts.shift()
      }

      // Update confirmation times
      await this.updateConfirmationTimes()

      // Update MEV events
      this.updateMEVEvents()

      console.log(
        `📊 Gas metrics updated: ${currentGasPrice.toFixed(2)} Gwei base, ${priorityFee.toFixed(2)} Gwei priority, ${networkCongestion.toFixed(1)}% congestion`,
      )
    } catch (error) {
      console.error("❌ Error updating gas metrics:", error)
    } finally {
      this.isOptimizing = false
    }
  }

  /**
   * Get current gas price from network
   */
  private async getCurrentGasPrice(): Promise<number> {
    try {
      const gasPrice = await this.web3.eth.getGasPrice()
      return Number(gasPrice) / 1e9 // Convert to Gwei
    } catch (error) {
      console.error("Error getting gas price:", error)
      return 0.1 // Default Arbitrum gas price
    }
  }

  /**
   * Get current priority fee (EIP-1559)
   */
  private async getCurrentPriorityFee(): Promise<number> {
    try {
      // For Arbitrum, priority fees are typically very low
      const block = await this.web3.eth.getBlock("latest", true)
      if (block && block.transactions && block.transactions.length > 0) {
        // Calculate average priority fee from recent transactions
        let totalPriorityFee = 0
        let count = 0

        for (const tx of block.transactions.slice(0, 10)) {
          if (typeof tx === "object" && tx.maxPriorityFeePerGas) {
            totalPriorityFee += Number(tx.maxPriorityFeePerGas)
            count++
          }
        }

        if (count > 0) {
          return totalPriorityFee / count / 1e9 // Convert to Gwei
        }
      }

      return 0.01 // Default 0.01 Gwei for Arbitrum
    } catch (error) {
      console.error("Error getting priority fee:", error)
      return 0.01
    }
  }

  /**
   * Calculate network congestion level with multiple factors
   */
  private async calculateNetworkCongestion(): Promise<number> {
    if (this.gasHistory.length < 5) return 50 // Default 50%

    const recent = this.gasHistory.slice(-10)
    const average = recent.reduce((sum, price) => sum + price, 0) / recent.length
    const current = recent[recent.length - 1]

    // Factor 1: Gas price ratio
    const gasPriceRatio = current / average
    let gasCongestion = 0
    if (gasPriceRatio > 3.0) gasCongestion = 100
    else if (gasPriceRatio > 2.0) gasCongestion = 85
    else if (gasPriceRatio > 1.5) gasCongestion = 70
    else if (gasPriceRatio > 1.2) gasCongestion = 50
    else if (gasPriceRatio > 1.0) gasCongestion = 30
    else gasCongestion = 15

    // Factor 2: Block utilization
    const avgBlockUtilization =
      this.blockUtilization.length > 0
        ? this.blockUtilization.reduce((sum, util) => sum + util, 0) / this.blockUtilization.length
        : 50

    // Factor 3: Pending transaction count
    const avgPendingTx =
      this.pendingTxCounts.length > 0
        ? this.pendingTxCounts.reduce((sum, count) => sum + count, 0) / this.pendingTxCounts.length
        : 1000

    const pendingCongestion = Math.min(100, (avgPendingTx / 5000) * 100) // Normalize to 0-100

    // Weighted average of all factors
    const finalCongestion = gasCongestion * 0.5 + avgBlockUtilization * 0.3 + pendingCongestion * 0.2

    return Math.min(100, Math.max(0, finalCongestion))
  }

  /**
   * Get block utilization percentage
   */
  private async getBlockUtilization(): Promise<number> {
    try {
      const block = await this.web3.eth.getBlock("latest")
      if (block && block.gasUsed && block.gasLimit) {
        return (Number(block.gasUsed) / Number(block.gasLimit)) * 100
      }
      return 50 // Default 50%
    } catch (error) {
      console.error("Error getting block utilization:", error)
      return 50
    }
  }

  /**
   * Get pending transaction count
   */
  private async getPendingTransactionCount(): Promise<number> {
    try {
      // This is an approximation since we can't directly get pending tx count
      const currentBlock = await this.web3.eth.getBlockNumber()
      const block = await this.web3.eth.getBlock(currentBlock, true)

      if (block && block.transactions) {
        return block.transactions.length * 10 // Estimate pending as 10x current block
      }

      return 1000 // Default estimate
    } catch (error) {
      console.error("Error getting pending transaction count:", error)
      return 1000
    }
  }

  /**
   * Update confirmation times based on recent blocks
   */
  private async updateConfirmationTimes() {
    try {
      const currentBlock = await this.web3.eth.getBlockNumber()

      if (this.lastBlockNumber === 0) {
        this.lastBlockNumber = currentBlock
        return
      }

      // Calculate time between blocks
      if (currentBlock > this.lastBlockNumber) {
        const blocks = []
        for (let i = 0; i < Math.min(5, currentBlock - this.lastBlockNumber); i++) {
          const block = await this.web3.eth.getBlock(currentBlock - i)
          if (block) blocks.push(block)
        }

        if (blocks.length > 1) {
          const timeDiffs = []
          for (let i = 0; i < blocks.length - 1; i++) {
            const timeDiff = Number(blocks[i].timestamp) - Number(blocks[i + 1].timestamp)
            timeDiffs.push(timeDiff)
          }

          const avgBlockTime = timeDiffs.reduce((sum, time) => sum + time, 0) / timeDiffs.length
          this.confirmationTimes.push(avgBlockTime)

          if (this.confirmationTimes.length > 20) {
            this.confirmationTimes.shift()
          }
        }

        this.lastBlockNumber = currentBlock
      }
    } catch (error) {
      console.error("Error updating confirmation times:", error)
    }
  }

  /**
   * Update MEV events tracking
   */
  private updateMEVEvents() {
    const currentGasPrice = this.gasHistory[this.gasHistory.length - 1]
    const avgGasPrice = this.gasHistory.reduce((sum, price) => sum + price, 0) / this.gasHistory.length

    // Detect potential MEV activity through gas price spikes
    if (currentGasPrice > avgGasPrice * 2.0) {
      this.mevEvents.push(Date.now())
      console.log("🚨 Potential MEV activity detected - gas price spike")
    }

    // Keep only recent MEV events (last hour)
    const oneHourAgo = Date.now() - 3600000
    this.mevEvents = this.mevEvents.filter((timestamp) => timestamp > oneHourAgo)
  }

  /**
   * Get optimized gas price for a transaction with advanced logic
   */
  async getOptimizedGasPrice(
    transactionType: "arbitrage" | "flashloan" | "swap" | "emergency",
    amount: number,
    urgency: "low" | "medium" | "high" = "medium",
    usePrivateMempool = false,
  ): Promise<{
    gasPrice: number
    priorityFee: number
    maxFeePerGas: number
    maxPriorityFeePerGas: number
    strategy: string
    confidence: number
    reasoning: string[]
    estimatedConfirmationTime: number
    gasLimit: number
  }> {
    const metrics = await this.getCurrentMetrics()
    const strategy = this.selectOptimalStrategy(transactionType, amount, urgency, metrics, usePrivateMempool)
    const strategyConfig = this.strategies.get(strategy)!

    const reasoning: string[] = []
    const baseGasPrice = metrics.currentGasPrice
    const priorityFee = metrics.priorityFee

    // Apply strategy multipliers
    let gasMultiplier = strategyConfig.baseMultiplier
    let priorityMultiplier = strategyConfig.priorityMultiplier

    reasoning.push(`Using ${strategyConfig.name} strategy`)

    // Adjust based on network congestion
    if (metrics.networkCongestion > 80) {
      gasMultiplier *= 1.4
      priorityMultiplier *= 1.6
      reasoning.push("High network congestion detected (+40% gas, +60% priority)")
    } else if (metrics.networkCongestion > 60) {
      gasMultiplier *= 1.2
      priorityMultiplier *= 1.3
      reasoning.push("Moderate network congestion (+20% gas, +30% priority)")
    } else if (metrics.networkCongestion < 20) {
      gasMultiplier *= 0.9
      priorityMultiplier *= 0.8
      reasoning.push("Low network congestion (-10% gas, -20% priority)")
    }

    // Adjust based on MEV risk
    if (metrics.mevRiskLevel > 70) {
      gasMultiplier *= this.config.mevProtectionMultiplier
      priorityMultiplier *= 2.0
      reasoning.push(
        `High MEV risk detected (+${((this.config.mevProtectionMultiplier - 1) * 100).toFixed(0)}% gas, +100% priority)`,
      )
    } else if (metrics.mevRiskLevel > 40) {
      gasMultiplier *= 1.15
      priorityMultiplier *= 1.4
      reasoning.push("Moderate MEV risk (+15% gas, +40% priority)")
    }

    // Adjust based on transaction amount
    if (amount > 100000) {
      gasMultiplier *= 1.25
      priorityMultiplier *= 1.5
      reasoning.push("Large transaction amount (+25% gas, +50% priority)")
    } else if (amount > 50000) {
      gasMultiplier *= 1.1
      priorityMultiplier *= 1.2
      reasoning.push("Medium transaction amount (+10% gas, +20% priority)")
    }

    // Adjust based on volatility
    if (metrics.volatility > 0.3) {
      gasMultiplier *= 1.2
      priorityMultiplier *= 1.3
      reasoning.push("High price volatility detected (+20% gas, +30% priority)")
    }

    // Adjust based on block utilization
    if (metrics.blockUtilization > 90) {
      gasMultiplier *= 1.3
      priorityMultiplier *= 1.5
      reasoning.push("Blocks nearly full (+30% gas, +50% priority)")
    }

    // Calculate final prices
    let finalGasPrice = baseGasPrice * gasMultiplier
    let finalPriorityFee = priorityFee * priorityMultiplier

    // Apply bounds
    finalGasPrice = Math.max(this.config.minGasPrice, Math.min(strategyConfig.maxGasPrice, finalGasPrice))
    finalPriorityFee = Math.max(0.01, Math.min(this.config.maxPriorityFee, finalPriorityFee))

    // EIP-1559 calculations
    const maxFeePerGas = finalGasPrice + finalPriorityFee
    const maxPriorityFeePerGas = finalPriorityFee

    // Estimate gas limit with buffer
    const baseGasLimit = this.estimateGasLimit(transactionType)
    const gasLimit = Math.floor(baseGasLimit * (1 + this.config.gasLimitBuffer / 100))

    // Calculate confidence and estimated confirmation time
    const confidence = this.calculateConfidence(metrics, strategy)
    const estimatedConfirmationTime = this.estimateConfirmationTime(finalGasPrice, metrics)

    return {
      gasPrice: Math.round(finalGasPrice * 100) / 100,
      priorityFee: Math.round(finalPriorityFee * 100) / 100,
      maxFeePerGas: Math.round(maxFeePerGas * 100) / 100,
      maxPriorityFeePerGas: Math.round(maxPriorityFeePerGas * 100) / 100,
      strategy,
      confidence,
      reasoning,
      estimatedConfirmationTime,
      gasLimit,
    }
  }

  /**
   * Select optimal strategy based on comprehensive conditions
   */
  private selectOptimalStrategy(
    transactionType: string,
    amount: number,
    urgency: string,
    metrics: GasMetrics,
    usePrivateMempool: boolean,
  ): string {
    // Private mempool optimization
    if (usePrivateMempool) {
      return "flashbot"
    }

    // Emergency conditions
    if (urgency === "high" && amount > 50000) {
      return "mev_protection"
    }

    // MEV protection conditions
    if (metrics.mevRiskLevel > 60 || this.mevEvents.length > 3) {
      return "mev_protection"
    }

    // High congestion conditions
    if (metrics.networkCongestion > 85) {
      return "aggressive"
    }

    // Transaction type specific logic
    if (transactionType === "flashloan" || transactionType === "arbitrage") {
      if (urgency === "high" || amount > 25000) {
        return metrics.networkCongestion > 50 ? "aggressive" : "fast"
      }
      return metrics.networkCongestion > 30 ? "standard" : "eco"
    }

    // Default strategy selection
    if (metrics.networkCongestion < 20 && metrics.mevRiskLevel < 20) {
      return "eco"
    } else if (metrics.networkCongestion > 70) {
      return "fast"
    }

    return "standard"
  }

  /**
   * Estimate gas limit based on transaction type
   */
  private estimateGasLimit(transactionType: string): number {
    const gasLimits = {
      arbitrage: 300000,
      flashloan: 500000,
      swap: 150000,
      emergency: 800000,
    }

    return gasLimits[transactionType] || 200000
  }

  /**
   * Calculate confidence in gas price recommendation
   */
  private calculateConfidence(metrics: GasMetrics, strategy: string): number {
    let confidence = 100

    // Reduce confidence for stale data
    const dataAge = Date.now() - metrics.lastUpdate
    if (dataAge > 30000) confidence -= 20
    if (dataAge > 60000) confidence -= 30

    // Reduce confidence for insufficient historical data
    if (this.gasHistory.length < 20) {
      confidence -= (20 - this.gasHistory.length) * 2
    }

    // Reduce confidence during high volatility
    if (metrics.volatility > 0.3) confidence -= 25
    else if (metrics.volatility > 0.2) confidence -= 15

    // Reduce confidence during MEV activity
    if (metrics.mevRiskLevel > 70) confidence -= 20
    else if (metrics.mevRiskLevel > 40) confidence -= 10

    // Strategy-specific confidence adjustments
    if (strategy === "mev_protection") confidence += 10
    if (strategy === "eco" && metrics.networkCongestion > 50) confidence -= 15

    return Math.max(0, Math.min(100, confidence))
  }

  /**
   * Estimate confirmation time based on gas price and network conditions
   */
  private estimateConfirmationTime(gasPrice: number, metrics: GasMetrics): number {
    const currentGasPrice = metrics.currentGasPrice
    const ratio = gasPrice / currentGasPrice

    const baseTime = 15 // Arbitrum average block time

    if (ratio >= 3.0) return baseTime * 1 // Next block
    if (ratio >= 2.0) return baseTime * 1.5
    if (ratio >= 1.5) return baseTime * 2
    if (ratio >= 1.2) return baseTime * 3
    if (ratio >= 1.0) return baseTime * 5

    return baseTime * 8 // Low gas price
  }

  /**
   * Calculate price volatility
   */
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0

    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length
    const standardDeviation = Math.sqrt(variance)

    return standardDeviation / mean // Coefficient of variation
  }

  /**
   * Get current comprehensive gas metrics
   */
  async getCurrentMetrics(): Promise<GasMetrics> {
    const currentGasPrice = this.gasHistory[this.gasHistory.length - 1] || (await this.getCurrentGasPrice())
    const priorityFee =
      this.priorityFeeHistory[this.priorityFeeHistory.length - 1] || (await this.getCurrentPriorityFee())
    const networkCongestion = await this.calculateNetworkCongestion()
    const mevRiskLevel = this.calculateMEVRiskLevel()
    const avgConfirmationTime = this.calculateAverageConfirmationTime()
    const volatility = this.calculateVolatility(this.gasHistory)
    const blockUtilization = this.blockUtilization[this.blockUtilization.length - 1] || 50
    const pendingTransactions = this.pendingTxCounts[this.pendingTxCounts.length - 1] || 1000

    const recommendedGasPrice = await this.getOptimizedGasPrice("arbitrage", 50000, "medium")

    return {
      currentGasPrice,
      recommendedGasPrice: recommendedGasPrice.gasPrice,
      priorityFee,
      networkCongestion,
      averageConfirmationTime: avgConfirmationTime,
      mevRiskLevel,
      priceHistory: [...this.gasHistory],
      lastUpdate: Date.now(),
      confidence: this.calculateConfidence(
        {
          currentGasPrice,
          recommendedGasPrice: recommendedGasPrice.gasPrice,
          priorityFee,
          networkCongestion,
          averageConfirmationTime: avgConfirmationTime,
          mevRiskLevel,
          priceHistory: this.gasHistory,
          lastUpdate: Date.now(),
          confidence: 0,
          volatility,
          pendingTransactions,
          blockUtilization,
        },
        "standard",
      ),
      volatility,
      pendingTransactions,
      blockUtilization,
    }
  }

  /**
   * Calculate MEV risk level with enhanced detection
   */
  private calculateMEVRiskLevel(): number {
    const recentMEVEvents = this.mevEvents.filter(
      (timestamp) => timestamp > Date.now() - 300000, // Last 5 minutes
    ).length

    if (recentMEVEvents >= 3) return 95
    if (recentMEVEvents >= 2) return 80
    if (recentMEVEvents >= 1) return 60

    // Check gas price spikes as MEV indicator
    if (this.gasHistory.length >= 5) {
      const recent = this.gasHistory.slice(-5)
      const current = recent[recent.length - 1]
      const average = recent.slice(0, -1).reduce((sum, price) => sum + price, 0) / (recent.length - 1)

      if (current > average * 3) return 90
      if (current > average * 2) return 75
      if (current > average * 1.5) return 50
      if (current > average * 1.2) return 30
    }

    // Check priority fee spikes
    if (this.priorityFeeHistory.length >= 5) {
      const recent = this.priorityFeeHistory.slice(-5)
      const current = recent[recent.length - 1]
      const average = recent.slice(0, -1).reduce((sum, fee) => sum + fee, 0) / (recent.length - 1)

      if (current > average * 5) return 85
      if (current > average * 3) return 65
      if (current > average * 2) return 45
    }

    return 15
  }

  /**
   * Calculate average confirmation time
   */
  private calculateAverageConfirmationTime(): number {
    if (this.confirmationTimes.length === 0) return 15 // Default 15 seconds

    return this.confirmationTimes.reduce((sum, time) => sum + time, 0) / this.confirmationTimes.length
  }

  /**
   * Predict future gas prices
   */
  async predictGasPrices(): Promise<GasPrediction> {
    if (this.gasHistory.length < 10) {
      return {
        nextBlockGasPrice: this.gasHistory[this.gasHistory.length - 1] || 0.1,
        next5BlocksGasPrice: this.gasHistory[this.gasHistory.length - 1] || 0.1,
        confidence: 50,
        trend: "stable",
        volatilityScore: 0,
      }
    }

    const recent = this.gasHistory.slice(-10)
    const current = recent[recent.length - 1]
    const previous = recent[recent.length - 2]
    const volatility = this.calculateVolatility(recent)

    // Simple trend analysis
    let trend: "increasing" | "decreasing" | "stable" = "stable"
    if (current > previous * 1.1) trend = "increasing"
    else if (current < previous * 0.9) trend = "decreasing"

    // Linear regression for prediction
    const x = recent.map((_, i) => i)
    const y = recent
    const n = recent.length
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
    const sumXX = x.reduce((sum, val) => sum + val * val, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    const nextBlockGasPrice = Math.max(0.01, slope * n + intercept)
    const next5BlocksGasPrice = Math.max(0.01, slope * (n + 4) + intercept)

    // Confidence based on volatility and trend consistency
    let confidence = 100 - volatility * 200 // Lower confidence for high volatility
    confidence = Math.max(20, Math.min(95, confidence))

    return {
      nextBlockGasPrice: Math.round(nextBlockGasPrice * 100) / 100,
      next5BlocksGasPrice: Math.round(next5BlocksGasPrice * 100) / 100,
      confidence: Math.round(confidence),
      trend,
      volatilityScore: Math.round(volatility * 100),
    }
  }

  /**
   * Get available strategies
   */
  getStrategies(): GasStrategy[] {
    return Array.from(this.strategies.values())
  }

  /**
   * Get comprehensive network statistics
   */
  getNetworkStats(): {
    averageGasPrice: number
    medianGasPrice: number
    averagePriorityFee: number
    volatility: number
    congestionLevel: number
    mevEvents: number
    blockUtilization: number
    pendingTransactions: number
    confirmationTime: number
  } {
    const sorted = [...this.gasHistory].sort((a, b) => a - b)
    const average = this.gasHistory.reduce((sum, price) => sum + price, 0) / this.gasHistory.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const avgPriorityFee = this.priorityFeeHistory.reduce((sum, fee) => sum + fee, 0) / this.priorityFeeHistory.length
    const volatility = this.calculateVolatility(this.gasHistory)
    const congestionLevel = this.calculateNetworkCongestion()
    const mevEvents = this.mevEvents.length
    const blockUtilization = this.blockUtilization.reduce((sum, util) => sum + util, 0) / this.blockUtilization.length
    const pendingTransactions =
      this.pendingTxCounts.reduce((sum, count) => sum + count, 0) / this.pendingTxCounts.length
    const confirmationTime = this.calculateAverageConfirmationTime()

    return {
      averageGasPrice: Math.round(average * 100) / 100,
      medianGasPrice: Math.round(median * 100) / 100,
      averagePriorityFee: Math.round(avgPriorityFee * 100) / 100,
      volatility: Math.round(volatility * 10000) / 100, // As percentage
      congestionLevel: Math.round(congestionLevel * 10) / 10,
      mevEvents,
      blockUtilization: Math.round(blockUtilization * 10) / 10,
      pendingTransactions: Math.round(pendingTransactions),
      confirmationTime: Math.round(confirmationTime * 10) / 10,
    }
  }

  /**
   * Simulate gas costs for different strategies
   */
  async simulateStrategyCosts(
    amount: number,
    transactionType = "arbitrage",
  ): Promise<
    {
      strategy: string
      gasPrice: number
      priorityFee: number
      totalGasCost: number
      estimatedConfirmationTime: number
      confidence: number
    }[]
  > {
    const results = []
    const metrics = await this.getCurrentMetrics()

    for (const [strategyName] of this.strategies) {
      try {
        const gasData = await this.getOptimizedGasPrice(transactionType as any, amount, "medium")
        const gasLimit = this.estimateGasLimit(transactionType)
        const totalGasCost = ((gasData.maxFeePerGas * 1e9 * gasLimit) / 1e18) * 2500 // Estimate in USD (ETH price ~$2500)

        results.push({
          strategy: strategyName,
          gasPrice: gasData.gasPrice,
          priorityFee: gasData.priorityFee,
          totalGasCost: Math.round(totalGasCost * 100) / 100,
          estimatedConfirmationTime: gasData.estimatedConfirmationTime,
          confidence: gasData.confidence,
        })
      } catch (error) {
        console.error(`Error simulating strategy ${strategyName}:`, error)
      }
    }

    return results.sort((a, b) => a.totalGasCost - b.totalGasCost)
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GasOptimizationConfig>) {
    this.config = { ...this.config, ...newConfig }
    console.log("⚙️ Gas optimization config updated")
  }

  /**
   * Get configuration
   */
  getConfig(): GasOptimizationConfig {
    return { ...this.config }
  }

  /**
   * Add MEV event (called by MEV detection service)
   */
  addMEVEvent() {
    this.mevEvents.push(Date.now())
    console.log("🚨 MEV event recorded")
  }

  /**
   * Clear historical data
   */
  clearHistory() {
    this.gasHistory = []
    this.priorityFeeHistory = []
    this.confirmationTimes = []
    this.mevEvents = []
    this.blockUtilization = []
    this.pendingTxCounts = []
    console.log("🗑️ Gas optimization history cleared")
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<{
    currentStrategy: string
    recommendedStrategy: string
    reasoning: string[]
    potentialSavings: number
    riskLevel: string
  }> {
    const metrics = await this.getCurrentMetrics()
    const currentStrategy = this.selectOptimalStrategy("arbitrage", 50000, "medium", metrics, false)

    let recommendedStrategy = currentStrategy
    const reasoning: string[] = []
    let potentialSavings = 0

    // Analyze if we can use a cheaper strategy
    if (metrics.networkCongestion < 30 && metrics.mevRiskLevel < 20) {
      if (currentStrategy !== "eco") {
        recommendedStrategy = "eco"
        reasoning.push("Network conditions allow for economy strategy")
        potentialSavings = 25
      }
    }

    // Check if we need more aggressive strategy
    if (metrics.mevRiskLevel > 60 && currentStrategy !== "mev_protection") {
      recommendedStrategy = "mev_protection"
      reasoning.push("High MEV risk detected - protection recommended")
      potentialSavings = -50 // Negative savings (higher cost for protection)
    }

    const strategyConfig = this.strategies.get(recommendedStrategy)!

    return {
      currentStrategy,
      recommendedStrategy,
      reasoning,
      potentialSavings,
      riskLevel: strategyConfig.riskLevel,
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopOptimization()
    this.clearHistory()
    console.log("🧹 Gas optimization service cleaned up")
  }
}
