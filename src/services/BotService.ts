export interface ArbitrageOpportunity {
  id: string
  tokenA: string
  tokenB: string
  amount: number
  profit: number
  dexA: string
  dexB: string
  gasEstimate: number
  timestamp: number
}

export interface ExecutionResult {
  success: boolean
  transactionHash?: string
  profit?: number
  gasUsed?: number
  error?: string
}

export class BotService {
  private static instance: BotService
  private isRunning = false
  private opportunities: ArbitrageOpportunity[] = []

  static getInstance(): BotService {
    if (!BotService.instance) {
      BotService.instance = new BotService()
    }
    return BotService.instance
  }

  async scanForOpportunities(tokenA: string, tokenB: string, amount: number): Promise<ArbitrageOpportunity[]> {
    try {
      const response = await fetch(`/api/arbitrage?tokenA=${tokenA}&tokenB=${tokenB}&amount=${amount}`)
      if (!response.ok) {
        throw new Error("Failed to fetch opportunities")
      }
      const data = await response.json()
      this.opportunities = data.opportunities || []
      return this.opportunities
    } catch (error) {
      console.error("Error scanning for opportunities:", error)
      return []
    }
  }

  async executeArbitrage(opportunityId: string, amount: number): Promise<ExecutionResult> {
    try {
      const response = await fetch("/api/arbitrage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ opportunityId, amount }),
      })

      if (!response.ok) {
        throw new Error("Failed to execute arbitrage")
      }

      return await response.json()
    } catch (error) {
      console.error("Error executing arbitrage:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  startBot(): void {
    this.isRunning = true
    console.log("Bot started")
  }

  stopBot(): void {
    this.isRunning = false
    console.log("Bot stopped")
  }

  isRunningBot(): boolean {
    return this.isRunning
  }

  getOpportunities(): ArbitrageOpportunity[] {
    return this.opportunities
  }
}
