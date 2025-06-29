export interface BotConfig {
  maxSlippage: number
  minProfitThreshold: number
  maxGasPrice: number
  tradingPairs: string[]
  isActive: boolean
}

export interface TradeResult {
  id: string
  timestamp: number
  tokenPair: string
  profitUsd: number
  gasUsed: number
  status: "success" | "failed" | "pending"
  transactionHash?: string
}

export class BotService {
  private config: BotConfig
  private isRunning = false
  private trades: TradeResult[] = []

  constructor() {
    // Load config from localStorage or use defaults
    const savedConfig = localStorage.getItem("botConfig")
    this.config = savedConfig
      ? JSON.parse(savedConfig)
      : {
          maxSlippage: 0.5,
          minProfitThreshold: 0.1,
          maxGasPrice: 50,
          tradingPairs: ["WETH/USDC", "WBTC/USDT", "ARB/USDC"],
          isActive: false,
        }
  }

  async start(): Promise<void> {
    if (this.isRunning) return

    this.isRunning = true
    this.config.isActive = true
    this.saveConfig()

    console.log("🤖 Bot started with config:", this.config)

    // Start monitoring for arbitrage opportunities
    this.monitorOpportunities()
  }

  async stop(): Promise<void> {
    this.isRunning = false
    this.config.isActive = false
    this.saveConfig()

    console.log("🛑 Bot stopped")
  }

  private async monitorOpportunities(): Promise<void> {
    if (!this.isRunning) return

    try {
      // Fetch arbitrage opportunities from API
      const response = await fetch("/api/arbitrage")
      const data = await response.json()

      if (data.success && data.data.opportunities) {
        for (const opportunity of data.data.opportunities) {
          if (opportunity.profitPercentage >= this.config.minProfitThreshold / 100) {
            await this.executeArbitrage(opportunity)
          }
        }
      }
    } catch (error) {
      console.error("Error monitoring opportunities:", error)
    }

    // Continue monitoring
    setTimeout(() => this.monitorOpportunities(), 5000)
  }

  private async executeArbitrage(opportunity: any): Promise<void> {
    try {
      console.log("🚀 Executing arbitrage for:", opportunity.tokenPair)

      const response = await fetch("/api/arbitrage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenPair: opportunity.tokenPair,
          amount: 1000, // Default amount
          maxGasPrice: this.config.maxGasPrice,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const trade: TradeResult = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          tokenPair: opportunity.tokenPair,
          profitUsd: result.data.estimatedProfit,
          gasUsed: result.data.gasUsed,
          status: "pending",
          transactionHash: result.data.transactionHash,
        }

        this.trades.unshift(trade)
        console.log("✅ Arbitrage executed:", trade)
      }
    } catch (error) {
      console.error("Error executing arbitrage:", error)
    }
  }

  getConfig(): BotConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<BotConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()
  }

  private saveConfig(): void {
    localStorage.setItem("botConfig", JSON.stringify(this.config))
  }

  getTrades(): TradeResult[] {
    return [...this.trades]
  }

  getStats() {
    const successfulTrades = this.trades.filter((t) => t.status === "success")
    const totalProfit = successfulTrades.reduce((sum, trade) => sum + trade.profitUsd, 0)
    const totalGasUsed = this.trades.reduce((sum, trade) => sum + trade.gasUsed, 0)

    return {
      totalTrades: this.trades.length,
      successfulTrades: successfulTrades.length,
      totalProfit,
      totalGasUsed,
      isRunning: this.isRunning,
    }
  }
}
