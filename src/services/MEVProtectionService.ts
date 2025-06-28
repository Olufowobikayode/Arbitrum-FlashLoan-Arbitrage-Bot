import type Web3 from "web3"

export interface MEVTransaction {
  hash: string
  from: string
  to: string
  value: string
  gasPrice: string
  gasUsed: number
  blockNumber: number
  timestamp: number
  type: "sandwich" | "frontrun" | "backrun" | "liquidation" | "arbitrage"
  confidence: number // 0-100
}

export interface MEVDetectionResult {
  isMEV: boolean
  confidence: number
  type: string
  description: string
  recommendation: string
}

export interface SandwichAttack {
  frontrunTx: string
  victimTx: string
  backrunTx: string
  profit: number
  token: string
  detected: boolean
}

export class MEVProtectionService {
  private web3: Web3
  private knownMEVBots: Set<string>
  private suspiciousPatterns: Map<string, number>
  private recentTransactions: MEVTransaction[]

  constructor(web3: Web3) {
    this.web3 = web3
    this.knownMEVBots = new Set([
      "0x0000000000000000000000000000000000000001", // Example MEV bot addresses
      "0x0000000000000000000000000000000000000002",
      "0x5050e08626c499411b5d0e0b5af0e83d3fd82edf", // Known MEV bot
      "0x00000000003b3cc22af3ae1eac0440bcee416b40", // Another known MEV bot
    ])
    this.suspiciousPatterns = new Map()
    this.recentTransactions = []
  }

  /**
   * Analyze transaction for MEV activity
   */
  async analyzeMEVRisk(tokenAddress: string, amount: number, targetBlock?: number): Promise<MEVDetectionResult> {
    try {
      const currentBlock = targetBlock || (await this.web3.eth.getBlockNumber())

      // Get recent transactions for the token
      const recentTxs = await this.getRecentTransactions(tokenAddress, currentBlock, 5)

      // Analyze patterns
      const sandwichRisk = this.detectSandwichPattern(recentTxs, amount)
      const frontrunRisk = this.detectFrontrunPattern(recentTxs)
      const botActivity = this.detectBotActivity(recentTxs)

      // Calculate overall risk
      const totalRisk = Math.max(sandwichRisk, frontrunRisk, botActivity)

      let type = "unknown"
      let description = "No MEV activity detected"
      let recommendation = "Safe to proceed"

      if (totalRisk > 70) {
        type = "high_risk"
        description = "High MEV activity detected - multiple attack vectors present"
        recommendation = "Use Flashbots or delay execution"
      } else if (totalRisk > 40) {
        type = "medium_risk"
        description = "Moderate MEV risk - some suspicious activity detected"
        recommendation = "Consider using MEV protection or smaller amounts"
      } else if (totalRisk > 20) {
        type = "low_risk"
        description = "Low MEV risk - minimal suspicious activity"
        recommendation = "Proceed with caution, monitor execution"
      }

      return {
        isMEV: totalRisk > 20,
        confidence: totalRisk,
        type,
        description,
        recommendation,
      }
    } catch (error) {
      console.error("MEV analysis error:", error)
      return {
        isMEV: false,
        confidence: 0,
        type: "error",
        description: "Unable to analyze MEV risk",
        recommendation: "Proceed with extreme caution",
      }
    }
  }

  /**
   * Detect sandwich attack patterns
   */
  private detectSandwichPattern(transactions: MEVTransaction[], targetAmount: number): number {
    let riskScore = 0

    for (let i = 0; i < transactions.length - 2; i++) {
      const tx1 = transactions[i]
      const tx2 = transactions[i + 1]
      const tx3 = transactions[i + 2]

      // Look for sandwich pattern: large buy -> victim tx -> large sell
      if (this.isSandwichPattern(tx1, tx2, tx3, targetAmount)) {
        riskScore += 30

        // Higher risk if from known MEV bot
        if (this.knownMEVBots.has(tx1.from) || this.knownMEVBots.has(tx3.from)) {
          riskScore += 20
        }

        // Higher risk if similar to our transaction size
        const sizeSimilarity = this.calculateSizeSimilarity(targetAmount, Number.parseFloat(tx2.value))
        riskScore += sizeSimilarity * 20
      }
    }

    return Math.min(riskScore, 100)
  }

  /**
   * Detect frontrunning patterns
   */
  private detectFrontrunPattern(transactions: MEVTransaction[]): number {
    let riskScore = 0

    // Look for transactions with unusually high gas prices
    const avgGasPrice = transactions.reduce((sum, tx) => sum + Number.parseFloat(tx.gasPrice), 0) / transactions.length

    transactions.forEach((tx) => {
      const gasPrice = Number.parseFloat(tx.gasPrice)
      if (gasPrice > avgGasPrice * 1.5) {
        riskScore += 15

        // Higher risk if from known MEV bot
        if (this.knownMEVBots.has(tx.from)) {
          riskScore += 10
        }
      }
    })

    return Math.min(riskScore, 100)
  }

  /**
   * Detect bot activity
   */
  private detectBotActivity(transactions: MEVTransaction[]): number {
    let riskScore = 0

    transactions.forEach((tx) => {
      // Check if from known MEV bot
      if (this.knownMEVBots.has(tx.from)) {
        riskScore += 25
      }

      // Check for suspicious patterns (high frequency, similar amounts)
      const pattern = this.suspiciousPatterns.get(tx.from) || 0
      if (pattern > 5) {
        riskScore += 15
      }

      // Update pattern tracking
      this.suspiciousPatterns.set(tx.from, pattern + 1)
    })

    return Math.min(riskScore, 100)
  }

  /**
   * Check if three transactions form a sandwich pattern
   */
  private isSandwichPattern(
    tx1: MEVTransaction,
    tx2: MEVTransaction,
    tx3: MEVTransaction,
    targetAmount: number,
  ): boolean {
    // Basic sandwich detection logic
    const value1 = Number.parseFloat(tx1.value)
    const value2 = Number.parseFloat(tx2.value)
    const value3 = Number.parseFloat(tx3.value)

    // Check if tx1 and tx3 are from same address (sandwich bot)
    if (tx1.from !== tx3.from) return false

    // Check if tx2 (victim) is similar size to our target
    if (Math.abs(value2 - targetAmount) / targetAmount > 0.5) return false

    // Check if tx1 (frontrun) and tx3 (backrun) are larger than victim
    return value1 > value2 * 0.8 && value3 > value2 * 0.8
  }

  /**
   * Calculate similarity between transaction sizes
   */
  private calculateSizeSimilarity(amount1: number, amount2: number): number {
    const ratio = Math.min(amount1, amount2) / Math.max(amount1, amount2)
    return ratio
  }

  /**
   * Get recent transactions for analysis
   */
  private async getRecentTransactions(
    tokenAddress: string,
    currentBlock: number,
    blockRange: number,
  ): Promise<MEVTransaction[]> {
    const transactions: MEVTransaction[] = []

    try {
      for (let i = 0; i < blockRange; i++) {
        const blockNumber = currentBlock - i
        const block = await this.web3.eth.getBlock(blockNumber, true)

        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (typeof tx === "object" && tx.to?.toLowerCase() === tokenAddress.toLowerCase()) {
              transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to || "",
                value: tx.value,
                gasPrice: tx.gasPrice || "0",
                gasUsed: 0, // Would need receipt for actual gas used
                blockNumber: blockNumber,
                timestamp: Number.parseInt(block.timestamp.toString()),
                type: this.classifyTransaction(tx),
                confidence: 0,
              })
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching recent transactions:", error)
    }

    return transactions
  }

  /**
   * Classify transaction type
   */
  private classifyTransaction(tx: any): "sandwich" | "frontrun" | "backrun" | "liquidation" | "arbitrage" {
    // Simplified classification logic
    const gasPrice = Number.parseFloat(tx.gasPrice || "0")
    const value = Number.parseFloat(tx.value || "0")

    if (this.knownMEVBots.has(tx.from)) {
      if (gasPrice > 100e9) return "frontrun" // High gas price
      if (value > 1e18) return "sandwich" // Large value
      return "arbitrage"
    }

    return "arbitrage"
  }

  /**
   * Generate MEV protection recommendations
   */
  generateProtectionRecommendations(riskLevel: number): string[] {
    const recommendations: string[] = []

    if (riskLevel > 70) {
      recommendations.push("🚨 Use Flashbots private mempool")
      recommendations.push("⏰ Delay execution by 2-3 blocks")
      recommendations.push("💰 Increase slippage tolerance")
      recommendations.push("📊 Split transaction into smaller parts")
    } else if (riskLevel > 40) {
      recommendations.push("🛡️ Enable MEV protection")
      recommendations.push("⏰ Consider delayed execution")
      recommendations.push("💰 Adjust slippage tolerance")
    } else if (riskLevel > 20) {
      recommendations.push("👀 Monitor execution closely")
      recommendations.push("🛡️ Keep MEV protection enabled")
    } else {
      recommendations.push("✅ Safe to proceed normally")
    }

    return recommendations
  }

  /**
   * Add known MEV bot address
   */
  addMEVBot(address: string) {
    this.knownMEVBots.add(address.toLowerCase())
  }

  /**
   * Remove MEV bot address
   */
  removeMEVBot(address: string) {
    this.knownMEVBots.delete(address.toLowerCase())
  }

  /**
   * Get known MEV bots
   */
  getKnownMEVBots(): string[] {
    return Array.from(this.knownMEVBots)
  }

  /**
   * Clear suspicious patterns (reset tracking)
   */
  clearSuspiciousPatterns() {
    this.suspiciousPatterns.clear()
  }

  /**
   * Get suspicious patterns
   */
  getSuspiciousPatterns(): Map<string, number> {
    return new Map(this.suspiciousPatterns)
  }
}
