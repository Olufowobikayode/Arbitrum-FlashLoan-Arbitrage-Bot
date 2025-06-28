export interface PortfolioAsset {
  symbol: string
  address: string
  balance: number
  value: number
  price: number
  change24h: number
  allocation: number
  lastUpdate: number
}

export interface PortfolioTransaction {
  id: string
  type: "trade" | "deposit" | "withdrawal" | "fee" | "profit"
  symbol: string
  amount: number
  price: number
  value: number
  fee: number
  txHash?: string
  timestamp: number
  description: string
  profit?: number
  gasUsed?: number
}

export interface PortfolioMetrics {
  totalValue: number
  totalProfit: number
  totalFees: number
  profitLoss24h: number
  profitLossPercent24h: number
  totalTrades: number
  successfulTrades: number
  winRate: number
  averageProfit: number
  maxProfit: number
  maxLoss: number
  sharpeRatio: number
  maxDrawdown: number
  roi: number
  dailyPnL: { date: string; pnl: number }[]
  monthlyPnL: { month: string; pnl: number }[]
  assetAllocation: { symbol: string; percentage: number; value: number }[]
}

export interface PortfolioSnapshot {
  timestamp: number
  totalValue: number
  assets: PortfolioAsset[]
  metrics: PortfolioMetrics
}

export interface TradingPair {
  baseAsset: string
  quoteAsset: string
  totalTrades: number
  totalProfit: number
  winRate: number
  averageProfit: number
  bestTrade: number
  worstTrade: number
  lastTradeTime: number
}

export class PortfolioTrackingService {
  private assets: Map<string, PortfolioAsset> = new Map()
  private transactions: PortfolioTransaction[] = []
  private snapshots: PortfolioSnapshot[] = []
  private tradingPairs: Map<string, TradingPair> = new Map()
  private isTracking = false
  private updateInterval: NodeJS.Timeout | null = null
  private initialValue = 0

  constructor() {
    this.loadPortfolioData()
    this.startTracking()
  }

  /**
   * Start portfolio tracking
   */
  startTracking() {
    if (this.isTracking) return

    this.isTracking = true
    console.log("📊 Portfolio tracking started")

    // Update portfolio every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updatePortfolio()
    }, 30000)

    // Take snapshot every hour
    setInterval(() => {
      this.takeSnapshot()
    }, 3600000)

    // Initial update
    this.updatePortfolio()
  }

  /**
   * Stop portfolio tracking
   */
  stopTracking() {
    this.isTracking = false

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    console.log("📊 Portfolio tracking stopped")
  }

  /**
   * Add or update asset in portfolio
   */
  addAsset(symbol: string, address: string, balance: number, price: number) {
    const value = balance * price
    const existing = this.assets.get(symbol)

    const asset: PortfolioAsset = {
      symbol,
      address,
      balance,
      value,
      price,
      change24h: existing?.change24h || 0,
      allocation: 0, // Will be calculated in updatePortfolio
      lastUpdate: Date.now(),
    }

    this.assets.set(symbol, asset)
    this.updatePortfolio()

    console.log(`📊 Asset added/updated: ${symbol} - ${balance} tokens ($${value.toFixed(2)})`)
  }

  /**
   * Remove asset from portfolio
   */
  removeAsset(symbol: string) {
    this.assets.delete(symbol)
    this.updatePortfolio()
    console.log(`📊 Asset removed: ${symbol}`)
  }

  /**
   * Record a transaction
   */
  recordTransaction(transaction: Omit<PortfolioTransaction, "id">) {
    const tx: PortfolioTransaction = {
      ...transaction,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.transactions.unshift(tx)

    // Keep only last 1000 transactions
    if (this.transactions.length > 1000) {
      this.transactions.splice(1000)
    }

    // Update trading pair statistics
    if (tx.type === "trade" && tx.profit !== undefined) {
      this.updateTradingPairStats(tx)
    }

    this.savePortfolioData()
    console.log(`📊 Transaction recorded: ${tx.type} - ${tx.symbol} - $${tx.value.toFixed(2)}`)
  }

  /**
   * Record arbitrage trade
   */
  recordArbitrageTrade(data: {
    baseSymbol: string
    quoteSymbol: string
    amount: number
    buyPrice: number
    sellPrice: number
    profit: number
    fee: number
    gasUsed: number
    txHash?: string
    buyDEX: string
    sellDEX: string
  }) {
    const pairSymbol = `${data.baseSymbol}/${data.quoteSymbol}`

    // Record buy transaction
    this.recordTransaction({
      type: "trade",
      symbol: data.baseSymbol,
      amount: data.amount,
      price: data.buyPrice,
      value: data.amount * data.buyPrice,
      fee: data.fee / 2,
      txHash: data.txHash,
      timestamp: Date.now(),
      description: `Buy ${data.baseSymbol} on ${data.buyDEX}`,
      gasUsed: data.gasUsed / 2,
    })

    // Record sell transaction
    this.recordTransaction({
      type: "trade",
      symbol: data.baseSymbol,
      amount: -data.amount,
      price: data.sellPrice,
      value: data.amount * data.sellPrice,
      fee: data.fee / 2,
      txHash: data.txHash,
      timestamp: Date.now(),
      description: `Sell ${data.baseSymbol} on ${data.sellDEX}`,
      profit: data.profit,
      gasUsed: data.gasUsed / 2,
    })

    // Record profit transaction
    this.recordTransaction({
      type: "profit",
      symbol: data.quoteSymbol,
      amount: data.profit,
      price: 1,
      value: data.profit,
      fee: 0,
      txHash: data.txHash,
      timestamp: Date.now(),
      description: `Arbitrage profit from ${pairSymbol}`,
      profit: data.profit,
    })

    console.log(`📊 Arbitrage trade recorded: ${pairSymbol} - Profit: $${data.profit.toFixed(2)}`)
  }

  /**
   * Update portfolio values and metrics
   */
  private async updatePortfolio() {
    try {
      // Update asset prices and calculate total value
      let totalValue = 0
      const updatedAssets = new Map<string, PortfolioAsset>()

      for (const [symbol, asset] of this.assets) {
        // In a real implementation, fetch current price from price feed service
        const currentPrice = await this.getCurrentPrice(symbol)
        const change24h = await this.get24hChange(symbol)

        const updatedAsset: PortfolioAsset = {
          ...asset,
          price: currentPrice,
          value: asset.balance * currentPrice,
          change24h,
          lastUpdate: Date.now(),
        }

        updatedAssets.set(symbol, updatedAsset)
        totalValue += updatedAsset.value
      }

      // Calculate allocations
      for (const [symbol, asset] of updatedAssets) {
        asset.allocation = totalValue > 0 ? (asset.value / totalValue) * 100 : 0
      }

      this.assets = updatedAssets
      this.savePortfolioData()
    } catch (error) {
      console.error("Error updating portfolio:", error)
    }
  }

  /**
   * Get current price for an asset
   */
  private async getCurrentPrice(symbol: string): Promise<number> {
    // Mock implementation - in production, integrate with price feed service
    const mockPrices: { [key: string]: number } = {
      ETH: 2500 + (Math.random() - 0.5) * 100,
      WETH: 2500 + (Math.random() - 0.5) * 100,
      USDC: 1.0 + (Math.random() - 0.5) * 0.01,
      USDT: 1.0 + (Math.random() - 0.5) * 0.01,
      DAI: 1.0 + (Math.random() - 0.5) * 0.01,
      WBTC: 45000 + (Math.random() - 0.5) * 2000,
      ARB: 1.2 + (Math.random() - 0.5) * 0.2,
    }

    return mockPrices[symbol] || 100
  }

  /**
   * Get 24h price change for an asset
   */
  private async get24hChange(symbol: string): Promise<number> {
    // Mock implementation
    return (Math.random() - 0.5) * 10 // ±5% change
  }

  /**
   * Calculate portfolio metrics
   */
  calculateMetrics(): PortfolioMetrics {
    const totalValue = Array.from(this.assets.values()).reduce((sum, asset) => sum + asset.value, 0)

    // Calculate profit/loss
    const profitTransactions = this.transactions.filter((tx) => tx.type === "profit")
    const totalProfit = profitTransactions.reduce((sum, tx) => sum + tx.value, 0)

    const feeTransactions = this.transactions.filter((tx) => tx.fee > 0)
    const totalFees = feeTransactions.reduce((sum, tx) => sum + tx.fee, 0)

    // Calculate 24h P&L
    const yesterday = Date.now() - 24 * 60 * 60 * 1000
    const recent24hTxs = this.transactions.filter((tx) => tx.timestamp > yesterday)
    const profitLoss24h = recent24hTxs.filter((tx) => tx.type === "profit").reduce((sum, tx) => sum + tx.value, 0)

    // Calculate trading statistics
    const trades = this.transactions.filter((tx) => tx.type === "trade")
    const profitableTrades = trades.filter((tx) => tx.profit && tx.profit > 0)
    const totalTrades = trades.length / 2 // Each arbitrage = 2 trades (buy + sell)
    const successfulTrades = profitableTrades.length
    const winRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0

    const profits = profitTransactions.map((tx) => tx.value)
    const averageProfit = profits.length > 0 ? profits.reduce((sum, p) => sum + p, 0) / profits.length : 0
    const maxProfit = profits.length > 0 ? Math.max(...profits) : 0
    const maxLoss = profits.length > 0 ? Math.min(...profits) : 0

    // Calculate ROI
    const roi = this.initialValue > 0 ? ((totalValue - this.initialValue) / this.initialValue) * 100 : 0

    // Calculate daily P&L for last 30 days
    const dailyPnL = this.calculateDailyPnL(30)
    const monthlyPnL = this.calculateMonthlyPnL(12)

    // Calculate asset allocation
    const assetAllocation = Array.from(this.assets.values()).map((asset) => ({
      symbol: asset.symbol,
      percentage: asset.allocation,
      value: asset.value,
    }))

    // Calculate Sharpe ratio (simplified)
    const dailyReturns = dailyPnL.map((day) => day.pnl)
    const avgReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length
    const returnStdDev = this.calculateStandardDeviation(dailyReturns)
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0

    // Calculate max drawdown
    const maxDrawdown = this.calculateMaxDrawdown()

    return {
      totalValue,
      totalProfit,
      totalFees,
      profitLoss24h,
      profitLossPercent24h: this.initialValue > 0 ? (profitLoss24h / this.initialValue) * 100 : 0,
      totalTrades,
      successfulTrades,
      winRate,
      averageProfit,
      maxProfit,
      maxLoss,
      sharpeRatio,
      maxDrawdown,
      roi,
      dailyPnL,
      monthlyPnL,
      assetAllocation,
    }
  }

  /**
   * Calculate daily P&L for specified number of days
   */
  private calculateDailyPnL(days: number): { date: string; pnl: number }[] {
    const result: { date: string; pnl: number }[] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split("T")[0]

      const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime()
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime()

      const dayTransactions = this.transactions.filter(
        (tx) => tx.timestamp >= dayStart && tx.timestamp <= dayEnd && tx.type === "profit",
      )

      const pnl = dayTransactions.reduce((sum, tx) => sum + tx.value, 0)
      result.push({ date: dateStr, pnl })
    }

    return result
  }

  /**
   * Calculate monthly P&L for specified number of months
   */
  private calculateMonthlyPnL(months: number): { month: string; pnl: number }[] {
    const result: { month: string; pnl: number }[] = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = date.toISOString().slice(0, 7) // YYYY-MM format

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime()
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime()

      const monthTransactions = this.transactions.filter(
        (tx) => tx.timestamp >= monthStart && tx.timestamp <= monthEnd && tx.type === "profit",
      )

      const pnl = monthTransactions.reduce((sum, tx) => sum + tx.value, 0)
      result.push({ month: monthStr, pnl })
    }

    return result
  }

  /**
   * Calculate standard deviation of returns
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length

    return Math.sqrt(variance)
  }

  /**
   * Calculate maximum drawdown
   */
  private calculateMaxDrawdown(): number {
    if (this.snapshots.length < 2) return 0

    let maxDrawdown = 0
    let peak = 0

    for (const snapshot of this.snapshots) {
      if (snapshot.totalValue > peak) {
        peak = snapshot.totalValue
      }

      const drawdown = peak > 0 ? ((peak - snapshot.totalValue) / peak) * 100 : 0
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }

    return maxDrawdown
  }

  /**
   * Update trading pair statistics
   */
  private updateTradingPairStats(transaction: PortfolioTransaction) {
    // Extract pair from description or use symbol
    const pairKey = transaction.description.includes("/")
      ? transaction.description.split(" ")[0]
      : `${transaction.symbol}/USDC`

    const existing = this.tradingPairs.get(pairKey) || {
      baseAsset: transaction.symbol,
      quoteAsset: "USDC",
      totalTrades: 0,
      totalProfit: 0,
      winRate: 0,
      averageProfit: 0,
      bestTrade: 0,
      worstTrade: 0,
      lastTradeTime: 0,
    }

    const profit = transaction.profit || 0
    const isWin = profit > 0

    const updatedPair: TradingPair = {
      ...existing,
      totalTrades: existing.totalTrades + 1,
      totalProfit: existing.totalProfit + profit,
      bestTrade: Math.max(existing.bestTrade, profit),
      worstTrade: Math.min(existing.worstTrade, profit),
      lastTradeTime: transaction.timestamp,
    }

    // Recalculate win rate and average profit
    const profitableTrades = this.transactions.filter(
      (tx) => tx.description.includes(pairKey) && tx.profit && tx.profit > 0,
    ).length

    updatedPair.winRate = updatedPair.totalTrades > 0 ? (profitableTrades / updatedPair.totalTrades) * 100 : 0
    updatedPair.averageProfit = updatedPair.totalTrades > 0 ? updatedPair.totalProfit / updatedPair.totalTrades : 0

    this.tradingPairs.set(pairKey, updatedPair)
  }

  /**
   * Take portfolio snapshot
   */
  takeSnapshot() {
    const snapshot: PortfolioSnapshot = {
      timestamp: Date.now(),
      totalValue: Array.from(this.assets.values()).reduce((sum, asset) => sum + asset.value, 0),
      assets: Array.from(this.assets.values()),
      metrics: this.calculateMetrics(),
    }

    this.snapshots.push(snapshot)

    // Keep only last 1000 snapshots
    if (this.snapshots.length > 1000) {
      this.snapshots.splice(0, this.snapshots.length - 1000)
    }

    this.savePortfolioData()
    console.log(`📊 Portfolio snapshot taken: $${snapshot.totalValue.toFixed(2)}`)
  }

  /**
   * Get portfolio assets
   */
  getAssets(): PortfolioAsset[] {
    return Array.from(this.assets.values())
  }

  /**
   * Get portfolio transactions
   */
  getTransactions(limit = 100): PortfolioTransaction[] {
    return this.transactions.slice(0, limit)
  }

  /**
   * Get trading pair statistics
   */
  getTradingPairs(): TradingPair[] {
    return Array.from(this.tradingPairs.values()).sort((a, b) => b.totalProfit - a.totalProfit)
  }

  /**
   * Get portfolio snapshots
   */
  getSnapshots(limit = 100): PortfolioSnapshot[] {
    return this.snapshots.slice(-limit)
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): {
    totalReturn: number
    annualizedReturn: number
    volatility: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    profitFactor: number
    averageWin: number
    averageLoss: number
    largestWin: number
    largestLoss: number
  } {
    const metrics = this.calculateMetrics()
    const profits = this.transactions.filter((tx) => tx.type === "profit" && tx.value > 0)
    const losses = this.transactions.filter((tx) => tx.type === "profit" && tx.value < 0)

    const totalWins = profits.reduce((sum, tx) => sum + tx.value, 0)
    const totalLosses = Math.abs(losses.reduce((sum, tx) => sum + tx.value, 0))
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Number.POSITIVE_INFINITY : 0

    const averageWin = profits.length > 0 ? totalWins / profits.length : 0
    const averageLoss = losses.length > 0 ? totalLosses / losses.length : 0

    const largestWin = profits.length > 0 ? Math.max(...profits.map((tx) => tx.value)) : 0
    const largestLoss = losses.length > 0 ? Math.abs(Math.min(...losses.map((tx) => tx.value))) : 0

    // Calculate annualized return
    const firstSnapshot = this.snapshots[0]
    const lastSnapshot = this.snapshots[this.snapshots.length - 1]
    const daysDiff =
      firstSnapshot && lastSnapshot ? (lastSnapshot.timestamp - firstSnapshot.timestamp) / (1000 * 60 * 60 * 24) : 1

    const totalReturn = metrics.roi
    const annualizedReturn = daysDiff > 0 ? Math.pow(1 + totalReturn / 100, 365 / daysDiff) - 1 : 0

    // Calculate volatility (standard deviation of daily returns)
    const dailyReturns = metrics.dailyPnL.map((day) => day.pnl)
    const volatility = this.calculateStandardDeviation(dailyReturns) * Math.sqrt(365) // Annualized

    return {
      totalReturn,
      annualizedReturn: annualizedReturn * 100,
      volatility,
      sharpeRatio: metrics.sharpeRatio,
      maxDrawdown: metrics.maxDrawdown,
      winRate: metrics.winRate,
      profitFactor,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
    }
  }

  /**
   * Export portfolio data
   */
  exportData(): {
    assets: PortfolioAsset[]
    transactions: PortfolioTransaction[]
    snapshots: PortfolioSnapshot[]
    tradingPairs: TradingPair[]
    metrics: PortfolioMetrics
    exportTime: number
  } {
    return {
      assets: this.getAssets(),
      transactions: this.getTransactions(1000),
      snapshots: this.getSnapshots(1000),
      tradingPairs: this.getTradingPairs(),
      metrics: this.calculateMetrics(),
      exportTime: Date.now(),
    }
  }

  /**
   * Import portfolio data
   */
  importData(data: any) {
    try {
      if (data.assets) {
        this.assets.clear()
        data.assets.forEach((asset: PortfolioAsset) => {
          this.assets.set(asset.symbol, asset)
        })
      }

      if (data.transactions) {
        this.transactions = data.transactions
      }

      if (data.snapshots) {
        this.snapshots = data.snapshots
      }

      if (data.tradingPairs) {
        this.tradingPairs.clear()
        data.tradingPairs.forEach((pair: TradingPair) => {
          const key = `${pair.baseAsset}/${pair.quoteAsset}`
          this.tradingPairs.set(key, pair)
        })
      }

      this.savePortfolioData()
      console.log("📊 Portfolio data imported successfully")
    } catch (error) {
      console.error("Error importing portfolio data:", error)
    }
  }

  /**
   * Reset portfolio data
   */
  resetPortfolio() {
    this.assets.clear()
    this.transactions = []
    this.snapshots = []
    this.tradingPairs.clear()
    this.initialValue = 0
    this.savePortfolioData()
    console.log("📊 Portfolio data reset")
  }

  /**
   * Set initial portfolio value
   */
  setInitialValue(value: number) {
    this.initialValue = value
    this.savePortfolioData()
  }

  /**
   * Load portfolio data from storage
   */
  private loadPortfolioData() {
    try {
      const assetsData = localStorage.getItem("portfolioAssets")
      if (assetsData) {
        const assets = JSON.parse(assetsData)
        assets.forEach((asset: PortfolioAsset) => {
          this.assets.set(asset.symbol, asset)
        })
      }

      const transactionsData = localStorage.getItem("portfolioTransactions")
      if (transactionsData) {
        this.transactions = JSON.parse(transactionsData)
      }

      const snapshotsData = localStorage.getItem("portfolioSnapshots")
      if (snapshotsData) {
        this.snapshots = JSON.parse(snapshotsData)
      }

      const tradingPairsData = localStorage.getItem("portfolioTradingPairs")
      if (tradingPairsData) {
        const pairs = JSON.parse(tradingPairsData)
        pairs.forEach((pair: TradingPair) => {
          const key = `${pair.baseAsset}/${pair.quoteAsset}`
          this.tradingPairs.set(key, pair)
        })
      }

      const initialValueData = localStorage.getItem("portfolioInitialValue")
      if (initialValueData) {
        this.initialValue = Number.parseFloat(initialValueData)
      }

      console.log("📊 Portfolio data loaded from storage")
    } catch (error) {
      console.error("Error loading portfolio data:", error)
    }
  }

  /**
   * Save portfolio data to storage
   */
  private savePortfolioData() {
    try {
      localStorage.setItem("portfolioAssets", JSON.stringify(Array.from(this.assets.values())))
      localStorage.setItem("portfolioTransactions", JSON.stringify(this.transactions))
      localStorage.setItem("portfolioSnapshots", JSON.stringify(this.snapshots))
      localStorage.setItem("portfolioTradingPairs", JSON.stringify(Array.from(this.tradingPairs.values())))
      localStorage.setItem("portfolioInitialValue", this.initialValue.toString())
    } catch (error) {
      console.error("Error saving portfolio data:", error)
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopTracking()
    this.savePortfolioData()
  }
}
