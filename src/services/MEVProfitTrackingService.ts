export interface MEVProfitData {
  id: string
  timestamp: number
  blockNumber: number
  transactionHash: string
  protectionType: "flashbots" | "private_mempool" | "delay" | "slippage_protection" | "gas_optimization"
  tokenAddress: string
  tokenSymbol: string
  amountSaved: number // in USD
  potentialLoss: number // in USD
  actualProfit: number // in USD
  mevType: "sandwich" | "frontrun" | "backrun" | "liquidation" | "arbitrage"
  attackerAddress?: string
  gasUsed: number
  gasSaved: number
  slippageAvoided: number
  confidence: number // 0-100
}

export interface ProfitSummary {
  totalSaved: number
  totalTransactions: number
  averageSaving: number
  bestSaving: number
  savingsByProtectionType: { [key: string]: number }
  savingsByMEVType: { [key: string]: number }
  savingsByToken: { [key: string]: number }
  monthlyTrend: { month: string; saved: number }[]
  successRate: number
}

export interface MEVAttackPrevented {
  id: string
  timestamp: number
  attackType: string
  estimatedLoss: number
  protectionUsed: string
  confidence: number
  details: string
}

export class MEVProfitTrackingService {
  private profitData: MEVProfitData[] = []
  private attacksPrevented: MEVAttackPrevented[] = []
  private isTracking = false

  constructor() {
    this.loadStoredData()
    this.startTracking()
  }

  /**
   * Start profit tracking
   */
  startTracking() {
    if (this.isTracking) return

    this.isTracking = true
    console.log("MEV profit tracking started")

    // Auto-save data every 5 minutes
    setInterval(() => {
      this.saveData()
    }, 300000)
  }

  /**
   * Stop profit tracking
   */
  stopTracking() {
    this.isTracking = false
    this.saveData()
    console.log("MEV profit tracking stopped")
  }

  /**
   * Record MEV profit saved
   */
  recordProfitSaved(data: Omit<MEVProfitData, "id" | "timestamp">): string {
    const profitEntry: MEVProfitData = {
      id: `mev_profit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...data,
    }

    this.profitData.push(profitEntry)

    // Keep only last 1000 entries
    if (this.profitData.length > 1000) {
      this.profitData = this.profitData.slice(-1000)
    }

    console.log(`MEV profit recorded: $${data.amountSaved.toFixed(2)} saved using ${data.protectionType}`)

    return profitEntry.id
  }

  /**
   * Record MEV attack prevented
   */
  recordAttackPrevented(
    attackType: string,
    estimatedLoss: number,
    protectionUsed: string,
    confidence: number,
    details: string,
  ): string {
    const attack: MEVAttackPrevented = {
      id: `attack_prevented_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      attackType,
      estimatedLoss,
      protectionUsed,
      confidence,
      details,
    }

    this.attacksPrevented.push(attack)

    // Keep only last 500 entries
    if (this.attacksPrevented.length > 500) {
      this.attacksPrevented = this.attacksPrevented.slice(-500)
    }

    console.log(`MEV attack prevented: ${attackType}, estimated loss: $${estimatedLoss.toFixed(2)}`)

    return attack.id
  }

  /**
   * Calculate profit from flashloan arbitrage
   */
  calculateFlashloanProfit(
    initialAmount: number,
    finalAmount: number,
    flashloanFee: number,
    gasUsed: number,
    gasPrice: number,
    tokenPrice: number,
  ): {
    grossProfit: number
    netProfit: number
    gasCost: number
    totalFees: number
    profitMargin: number
  } {
    const gasCost = ((gasUsed * gasPrice) / 1e18) * tokenPrice
    const totalFees = flashloanFee + gasCost
    const grossProfit = finalAmount - initialAmount
    const netProfit = grossProfit - totalFees
    const profitMargin = (netProfit / initialAmount) * 100

    return {
      grossProfit,
      netProfit,
      gasCost,
      totalFees,
      profitMargin,
    }
  }

  /**
   * Estimate MEV profit saved by using protection
   */
  estimateMEVProfitSaved(
    transactionAmount: number,
    protectionType: string,
    mevType: string,
    marketConditions: {
      volatility: number
      liquidityDepth: number
      gasPrice: number
      mevActivity: number
    },
  ): {
    estimatedSaving: number
    confidence: number
    reasoning: string[]
  } {
    let baseSaving = 0
    let confidence = 50
    const reasoning: string[] = []

    // Base saving calculation based on MEV type
    switch (mevType) {
      case "sandwich":
        baseSaving = transactionAmount * 0.005 // 0.5% typical sandwich profit
        reasoning.push("Sandwich attacks typically extract 0.3-1% of transaction value")
        break
      case "frontrun":
        baseSaving = transactionAmount * 0.002 // 0.2% typical frontrun profit
        reasoning.push("Frontrunning typically extracts 0.1-0.5% of transaction value")
        break
      case "backrun":
        baseSaving = transactionAmount * 0.001 // 0.1% typical backrun profit
        reasoning.push("Backrunning typically extracts 0.05-0.2% of transaction value")
        break
      case "liquidation":
        baseSaving = transactionAmount * 0.01 // 1% typical liquidation bonus
        reasoning.push("Liquidation MEV can extract 0.5-2% through bonus mechanisms")
        break
      case "arbitrage":
        baseSaving = transactionAmount * 0.003 // 0.3% typical arbitrage profit
        reasoning.push("Arbitrage MEV typically extracts 0.1-0.8% through price differences")
        break
      default:
        baseSaving = transactionAmount * 0.002
        reasoning.push("General MEV extraction averages 0.1-0.5% of transaction value")
    }

    // Adjust based on market conditions
    if (marketConditions.volatility > 0.05) {
      // High volatility
      baseSaving *= 1.5
      confidence += 15
      reasoning.push("High market volatility increases MEV opportunities")
    }

    if (marketConditions.liquidityDepth < 100000) {
      // Low liquidity
      baseSaving *= 1.3
      confidence += 10
      reasoning.push("Low liquidity increases slippage and MEV extraction")
    }

    if (marketConditions.gasPrice > 50e9) {
      // High gas price (>50 Gwei)
      baseSaving *= 1.2
      confidence += 10
      reasoning.push("High gas prices indicate MEV competition")
    }

    if (marketConditions.mevActivity > 70) {
      // High MEV activity
      baseSaving *= 1.4
      confidence += 20
      reasoning.push("High MEV activity detected in recent blocks")
    }

    // Adjust based on protection type effectiveness
    const protectionEffectiveness: { [key: string]: number } = {
      flashbots: 0.9, // 90% effective
      private_mempool: 0.85, // 85% effective
      delay: 0.7, // 70% effective
      slippage_protection: 0.6, // 60% effective
      gas_optimization: 0.4, // 40% effective
    }

    const effectiveness = protectionEffectiveness[protectionType] || 0.5
    const estimatedSaving = baseSaving * effectiveness

    // Adjust confidence based on protection type
    if (protectionType === "flashbots") confidence += 20
    else if (protectionType === "private_mempool") confidence += 15
    else if (protectionType === "delay") confidence += 10

    // Large transactions have higher confidence in estimates
    if (transactionAmount > 50000) confidence += 15
    else if (transactionAmount > 10000) confidence += 10

    return {
      estimatedSaving: Math.max(0, estimatedSaving),
      confidence: Math.min(100, Math.max(0, confidence)),
      reasoning,
    }
  }

  /**
   * Get profit summary
   */
  getProfitSummary(timeframe?: { start: number; end: number }): ProfitSummary {
    let data = this.profitData

    if (timeframe) {
      data = data.filter((entry) => entry.timestamp >= timeframe.start && entry.timestamp <= timeframe.end)
    }

    const totalSaved = data.reduce((sum, entry) => sum + entry.amountSaved, 0)
    const totalTransactions = data.length
    const averageSaving = totalTransactions > 0 ? totalSaved / totalTransactions : 0
    const bestSaving = data.length > 0 ? Math.max(...data.map((entry) => entry.amountSaved)) : 0

    // Group by protection type
    const savingsByProtectionType: { [key: string]: number } = {}
    data.forEach((entry) => {
      savingsByProtectionType[entry.protectionType] =
        (savingsByProtectionType[entry.protectionType] || 0) + entry.amountSaved
    })

    // Group by MEV type
    const savingsByMEVType: { [key: string]: number } = {}
    data.forEach((entry) => {
      savingsByMEVType[entry.mevType] = (savingsByMEVType[entry.mevType] || 0) + entry.amountSaved
    })

    // Group by token
    const savingsByToken: { [key: string]: number } = {}
    data.forEach((entry) => {
      savingsByToken[entry.tokenSymbol] = (savingsByToken[entry.tokenSymbol] || 0) + entry.amountSaved
    })

    // Monthly trend (last 12 months)
    const monthlyTrend = this.calculateMonthlyTrend(data)

    // Success rate (entries with confidence > 70)
    const highConfidenceEntries = data.filter((entry) => entry.confidence > 70).length
    const successRate = totalTransactions > 0 ? (highConfidenceEntries / totalTransactions) * 100 : 0

    return {
      totalSaved,
      totalTransactions,
      averageSaving,
      bestSaving,
      savingsByProtectionType,
      savingsByMEVType,
      savingsByToken,
      monthlyTrend,
      successRate,
    }
  }

  /**
   * Calculate monthly trend
   */
  private calculateMonthlyTrend(data: MEVProfitData[]): { month: string; saved: number }[] {
    const monthlyData = new Map<string, number>()

    data.forEach((entry) => {
      const date = new Date(entry.timestamp)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + entry.amountSaved)
    })

    // Get last 12 months
    const result = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

      result.push({
        month: monthName,
        saved: monthlyData.get(monthKey) || 0,
      })
    }

    return result
  }

  /**
   * Get recent profit entries
   */
  getRecentProfits(limit = 50): MEVProfitData[] {
    return this.profitData.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  }

  /**
   * Get profits by protection type
   */
  getProfitsByProtectionType(protectionType: string): MEVProfitData[] {
    return this.profitData.filter((entry) => entry.protectionType === protectionType)
  }

  /**
   * Get profits by MEV type
   */
  getProfitsByMEVType(mevType: string): MEVProfitData[] {
    return this.profitData.filter((entry) => entry.mevType === mevType)
  }

  /**
   * Get profits by token
   */
  getProfitsByToken(tokenSymbol: string): MEVProfitData[] {
    return this.profitData.filter((entry) => entry.tokenSymbol === tokenSymbol)
  }

  /**
   * Get attacks prevented
   */
  getAttacksPrevented(limit = 50): MEVAttackPrevented[] {
    return this.attacksPrevented.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  }

  /**
   * Calculate ROI of MEV protection
   */
  calculateProtectionROI(
    protectionCosts: { [protectionType: string]: number },
    timeframe?: { start: number; end: number },
  ): {
    totalCosts: number
    totalSavings: number
    roi: number
    roiByProtectionType: { [key: string]: number }
  } {
    const summary = this.getProfitSummary(timeframe)

    let totalCosts = 0
    const roiByProtectionType: { [key: string]: number } = {}

    for (const [protectionType, savings] of Object.entries(summary.savingsByProtectionType)) {
      const cost = protectionCosts[protectionType] || 0
      totalCosts += cost

      if (cost > 0) {
        roiByProtectionType[protectionType] = ((savings - cost) / cost) * 100
      } else {
        roiByProtectionType[protectionType] = savings > 0 ? Number.POSITIVE_INFINITY : 0
      }
    }

    const roi = totalCosts > 0 ? ((summary.totalSaved - totalCosts) / totalCosts) * 100 : 0

    return {
      totalCosts,
      totalSavings: summary.totalSaved,
      roi,
      roiByProtectionType,
    }
  }

  /**
   * Export profit data
   */
  exportData(format: "json" | "csv" = "json"): string {
    if (format === "csv") {
      const headers = [
        "ID",
        "Timestamp",
        "Block Number",
        "Transaction Hash",
        "Protection Type",
        "Token Symbol",
        "Amount Saved",
        "Potential Loss",
        "Actual Profit",
        "MEV Type",
        "Gas Used",
        "Gas Saved",
        "Slippage Avoided",
        "Confidence",
      ]

      const rows = this.profitData.map((entry) => [
        entry.id,
        new Date(entry.timestamp).toISOString(),
        entry.blockNumber,
        entry.transactionHash,
        entry.protectionType,
        entry.tokenSymbol,
        entry.amountSaved,
        entry.potentialLoss,
        entry.actualProfit,
        entry.mevType,
        entry.gasUsed,
        entry.gasSaved,
        entry.slippageAvoided,
        entry.confidence,
      ])

      return [headers, ...rows].map((row) => row.join(",")).join("\n")
    }

    return JSON.stringify(
      {
        profitData: this.profitData,
        attacksPrevented: this.attacksPrevented,
        summary: this.getProfitSummary(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    )
  }

  /**
   * Import profit data
   */
  importData(data: string, format: "json" | "csv" = "json"): boolean {
    try {
      if (format === "json") {
        const parsed = JSON.parse(data)
        if (parsed.profitData && Array.isArray(parsed.profitData)) {
          this.profitData = [...this.profitData, ...parsed.profitData]
        }
        if (parsed.attacksPrevented && Array.isArray(parsed.attacksPrevented)) {
          this.attacksPrevented = [...this.attacksPrevented, ...parsed.attacksPrevented]
        }
      } else {
        // CSV import implementation would go here
        console.log("CSV import not implemented yet")
        return false
      }

      this.saveData()
      return true
    } catch (error) {
      console.error("Error importing data:", error)
      return false
    }
  }

  /**
   * Clear all data
   */
  clearData() {
    this.profitData = []
    this.attacksPrevented = []
    this.saveData()
  }

  /**
   * Save data to localStorage
   */
  private saveData() {
    try {
      const data = {
        profitData: this.profitData,
        attacksPrevented: this.attacksPrevented,
        lastSaved: Date.now(),
      }
      localStorage.setItem("mev_profit_tracking", JSON.stringify(data))
    } catch (error) {
      console.error("Error saving MEV profit data:", error)
    }
  }

  /**
   * Load data from localStorage
   */
  private loadStoredData() {
    try {
      const stored = localStorage.getItem("mev_profit_tracking")
      if (stored) {
        const data = JSON.parse(stored)
        this.profitData = data.profitData || []
        this.attacksPrevented = data.attacksPrevented || []
        console.log(
          `Loaded ${this.profitData.length} profit entries and ${this.attacksPrevented.length} prevented attacks`,
        )
      }
    } catch (error) {
      console.error("Error loading MEV profit data:", error)
    }
  }

  /**
   * Get statistics for dashboard
   */
  getDashboardStats(): {
    totalSavedToday: number
    totalSavedThisWeek: number
    totalSavedThisMonth: number
    attacksPreventedToday: number
    topProtectionMethod: string
    averageSavingPerTransaction: number
  } {
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000

    const todayData = this.profitData.filter((entry) => entry.timestamp >= oneDayAgo)
    const weekData = this.profitData.filter((entry) => entry.timestamp >= oneWeekAgo)
    const monthData = this.profitData.filter((entry) => entry.timestamp >= oneMonthAgo)

    const totalSavedToday = todayData.reduce((sum, entry) => sum + entry.amountSaved, 0)
    const totalSavedThisWeek = weekData.reduce((sum, entry) => sum + entry.amountSaved, 0)
    const totalSavedThisMonth = monthData.reduce((sum, entry) => sum + entry.amountSaved, 0)

    const attacksPreventedToday = this.attacksPrevented.filter((attack) => attack.timestamp >= oneDayAgo).length

    // Find top protection method
    const protectionCounts: { [key: string]: number } = {}
    monthData.forEach((entry) => {
      protectionCounts[entry.protectionType] = (protectionCounts[entry.protectionType] || 0) + 1
    })

    const topProtectionMethod = Object.entries(protectionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "None"

    const averageSavingPerTransaction = monthData.length > 0 ? totalSavedThisMonth / monthData.length : 0

    return {
      totalSavedToday,
      totalSavedThisWeek,
      totalSavedThisMonth,
      attacksPreventedToday,
      topProtectionMethod,
      averageSavingPerTransaction,
    }
  }
}
