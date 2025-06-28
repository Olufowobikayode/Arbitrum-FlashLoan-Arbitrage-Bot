export interface TradingStrategy {
  id: string
  name: string
  description: string
  type: "arbitrage" | "momentum" | "mean_reversion" | "grid" | "dca" | "custom"
  isActive: boolean
  parameters: StrategyParameters
  performance: {
    totalTrades: number
    winRate: number
    totalProfit: number
    maxDrawdown: number
    sharpeRatio: number
  }
}

export interface StrategyParameters {
  minProfitThreshold: number
  maxSlippagePercent: number
  maxPositionSize: number
  maxGasPrice: number
  timeframe: string
  targetPairs: string[]
  excludedPairs: string[]
  minLiquidity: number
  maxSpread: number
  confidenceThreshold: number
}

export interface TradingRule {
  id: string
  name: string
  type: "entry" | "exit" | "risk" | "filter"
  condition: string
  action: string
  priority: number
  isActive: boolean
  parameters: Record<string, any>
}

export interface RiskManagement {
  maxDailyLoss: number
  maxDrawdown: number
  positionSizing: "fixed" | "percentage" | "kelly" | "volatility"
  stopLoss: number
  takeProfit: number
  maxConcurrentTrades: number
  cooldownPeriod: number
}

export interface BacktestResult {
  strategyId: string
  startDate: number
  endDate: number
  totalReturn: number
  totalTrades: number
  winRate: number
  maxDrawdown: number
  sharpeRatio: number
  profitFactor: number
  trades: Array<{
    timestamp: number
    pair: string
    type: "buy" | "sell"
    amount: number
    price: number
    profit: number
  }>
  metrics: {
    initialBalance?: number
    finalBalance?: number
    totalFees?: number
    averageProfit?: number
    bestTrade?: number
    worstTrade?: number
  }
}

export class TradingStrategyService {
  private strategies: Map<string, TradingStrategy> = new Map()
  private isEngineRunning = false

  constructor() {
    this.loadStrategies()
  }

  createStrategy(
    name: string,
    description: string,
    type: TradingStrategy["type"],
    parameters: StrategyParameters,
    rules: TradingRule[],
    riskManagement: RiskManagement,
  ): string {
    const id = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const strategy: TradingStrategy = {
      id,
      name,
      description,
      type,
      parameters,
      rules,
      riskManagement,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      performance: {
        totalTrades: 0,
        winRate: 0,
        totalProfit: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
      },
    }

    this.strategies.set(id, strategy)
    this.saveStrategies()
    return id
  }

  updateStrategy(id: string, updates: Partial<TradingStrategy>): boolean {
    const strategy = this.strategies.get(id)
    if (!strategy) return false

    const updatedStrategy = {
      ...strategy,
      ...updates,
      updatedAt: Date.now(),
    }

    this.strategies.set(id, updatedStrategy)
    this.saveStrategies()
    return true
  }

  deleteStrategy(id: string): boolean {
    const deleted = this.strategies.delete(id)
    if (deleted) {
      this.saveStrategies()
    }
    return deleted
  }

  getStrategy(id: string): TradingStrategy | null {
    return this.strategies.get(id) || null
  }

  getStrategies(): TradingStrategy[] {
    return Array.from(this.strategies.values())
  }

  activateStrategy(id: string): boolean {
    const strategy = this.strategies.get(id)
    if (!strategy) return false

    strategy.isActive = true
    strategy.updatedAt = Date.now()
    this.saveStrategies()
    return true
  }

  deactivateStrategy(id: string): boolean {
    const strategy = this.strategies.get(id)
    if (!strategy) return false

    strategy.isActive = false
    strategy.updatedAt = Date.now()
    this.saveStrategies()
    return true
  }

  cloneStrategy(id: string): string | null {
    const strategy = this.strategies.get(id)
    if (!strategy) return null

    const clonedId = this.createStrategy(
      `${strategy.name} (Copy)`,
      strategy.description,
      strategy.type,
      { ...strategy.parameters },
      strategy.rules.map((rule) => ({ ...rule, id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` })),
      { ...strategy.riskManagement },
    )

    return clonedId
  }

  async backtestStrategy(id: string, startDate: number, endDate: number): Promise<BacktestResult> {
    const strategy = this.strategies.get(id)
    if (!strategy) {
      throw new Error("Strategy not found")
    }

    // Simulate backtest with mock data
    const trades = this.generateMockTrades(startDate, endDate, strategy)
    const metrics = this.calculateBacktestMetrics(trades)

    const result: BacktestResult = {
      strategyId: id,
      startDate,
      endDate,
      totalReturn: metrics.totalReturn,
      totalTrades: trades.length,
      winRate: metrics.winRate,
      maxDrawdown: metrics.maxDrawdown,
      sharpeRatio: metrics.sharpeRatio,
      profitFactor: metrics.profitFactor,
      trades,
      metrics: {
        initialBalance: 10000,
        finalBalance: 10000 + metrics.totalProfit,
        totalFees: metrics.totalFees,
        averageProfit: metrics.averageProfit,
        bestTrade: metrics.bestTrade,
        worstTrade: metrics.worstTrade,
      },
    }

    // Update strategy performance
    strategy.performance = {
      totalTrades: trades.length,
      winRate: metrics.winRate,
      totalProfit: metrics.totalProfit,
      maxDrawdown: metrics.maxDrawdown,
      sharpeRatio: metrics.sharpeRatio,
    }

    this.saveStrategies()
    return result
  }

  exportStrategy(id: string): TradingStrategy | null {
    return this.strategies.get(id) || null
  }

  importStrategy(strategy: TradingStrategy): string {
    const newId = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const importedStrategy = {
      ...strategy,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: false,
    }

    this.strategies.set(newId, importedStrategy)
    this.saveStrategies()
    return newId
  }

  startStrategyEngine(): void {
    this.isEngineRunning = true
    console.log("Strategy engine started")
  }

  stopStrategyEngine(): void {
    this.isEngineRunning = false
    console.log("Strategy engine stopped")
  }

  private generateMockTrades(startDate: number, endDate: number, strategy: TradingStrategy) {
    const trades = []
    const duration = endDate - startDate
    const numTrades = Math.floor(duration / (24 * 60 * 60 * 1000)) * 2 // 2 trades per day

    for (let i = 0; i < numTrades; i++) {
      const timestamp = startDate + (i / numTrades) * duration
      const profit = (Math.random() - 0.3) * 200 // Slightly positive bias

      trades.push({
        timestamp,
        pair: strategy.parameters.targetPairs[0] || "ETH/USDC",
        type: Math.random() > 0.5 ? "buy" : ("sell" as const),
        amount: 1 + Math.random() * 5,
        price: 2500 + Math.random() * 500,
        profit,
      })
    }

    return trades
  }

  private calculateBacktestMetrics(trades: any[]) {
    const profits = trades.map((t) => t.profit)
    const totalProfit = profits.reduce((sum, p) => sum + p, 0)
    const winningTrades = profits.filter((p) => p > 0)
    const losingTrades = profits.filter((p) => p < 0)

    const winRate = (winningTrades.length / trades.length) * 100
    const totalReturn = (totalProfit / 10000) * 100
    const maxDrawdown =
      (Math.min(...profits.map((_, i) => profits.slice(0, i + 1).reduce((sum, p) => sum + p, 0))) / 10000) * 100

    const averageProfit = totalProfit / trades.length
    const bestTrade = Math.max(...profits)
    const worstTrade = Math.min(...profits)
    const totalFees = trades.length * 5 // $5 per trade

    const sharpeRatio =
      averageProfit / (profits.reduce((sum, p) => sum + Math.pow(p - averageProfit, 2), 0) / profits.length)
    const profitFactor =
      winningTrades.reduce((sum, p) => sum + p, 0) / Math.abs(losingTrades.reduce((sum, p) => sum + p, 0))

    return {
      totalReturn,
      winRate,
      maxDrawdown,
      sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
      profitFactor: isNaN(profitFactor) ? 0 : profitFactor,
      totalProfit,
      averageProfit,
      bestTrade,
      worstTrade,
      totalFees,
    }
  }

  private loadStrategies(): void {
    try {
      const saved = localStorage.getItem("tradingStrategies")
      if (saved) {
        const strategies = JSON.parse(saved)
        this.strategies = new Map(Object.entries(strategies))
      }
    } catch (error) {
      console.error("Failed to load strategies:", error)
    }
  }

  private saveStrategies(): void {
    try {
      const strategies = Object.fromEntries(this.strategies)
      localStorage.setItem("tradingStrategies", JSON.stringify(strategies))
    } catch (error) {
      console.error("Failed to save strategies:", error)
    }
  }
}
