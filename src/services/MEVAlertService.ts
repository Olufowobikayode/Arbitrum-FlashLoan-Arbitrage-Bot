import type Web3 from "web3"

export interface MEVAlert {
  id: string
  type: "sandwich" | "frontrun" | "backrun" | "liquidation" | "high_risk" | "cross_chain"
  severity: "low" | "medium" | "high" | "critical"
  message: string
  timestamp: number
  blockNumber: number
  txHash?: string
  attacker?: string
  token?: string
  amount?: number
  riskScore: number
  recommendation: string
  autoAction?: string
}

export interface AlertConfig {
  enabled: boolean
  minRiskScore: number
  alertTypes: string[]
  notificationMethods: ("browser" | "email" | "webhook" | "telegram")[]
  webhookUrl?: string
  telegramBotToken?: string
  telegramChatId?: string
  emailEndpoint?: string
  autoActions: {
    emergencyStop: boolean
    increaseSlippage: boolean
    useFlashbots: boolean
    delayExecution: boolean
  }
}

export class MEVAlertService {
  private web3: Web3
  private alerts: MEVAlert[] = []
  private config: AlertConfig
  private alertCallbacks: ((alert: MEVAlert) => void)[] = []
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor(web3: Web3, config: AlertConfig) {
    this.web3 = web3
    this.config = config
    this.startMonitoring()
  }

  /**
   * Start MEV monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.scanForMEVActivity()
    }, 5000) // Scan every 5 seconds

    console.log("MEV Alert Service started monitoring")
  }

  /**
   * Stop MEV monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    console.log("MEV Alert Service stopped monitoring")
  }

  /**
   * Add alert callback
   */
  onAlert(callback: (alert: MEVAlert) => void) {
    this.alertCallbacks.push(callback)
  }

  /**
   * Remove alert callback
   */
  removeAlertCallback(callback: (alert: MEVAlert) => void) {
    const index = this.alertCallbacks.indexOf(callback)
    if (index > -1) {
      this.alertCallbacks.splice(index, 1)
    }
  }

  /**
   * Scan for MEV activity
   */
  private async scanForMEVActivity() {
    try {
      const currentBlock = await this.web3.eth.getBlockNumber()
      const block = await this.web3.eth.getBlock(currentBlock, true)

      if (!block || !block.transactions) return

      // Analyze transactions for MEV patterns
      await this.analyzeBlockForMEV(block)

      // Check for high gas price spikes
      await this.checkGasPriceSpikes()

      // Monitor for suspicious addresses
      await this.monitorSuspiciousAddresses(block)

      // Cross-chain MEV detection
      await this.detectCrossChainMEV()
    } catch (error) {
      console.error("Error scanning for MEV activity:", error)
    }
  }

  /**
   * Analyze block for MEV patterns
   */
  private async analyzeBlockForMEV(block: any) {
    const transactions = block.transactions
    if (!Array.isArray(transactions)) return

    // Look for sandwich attacks
    await this.detectSandwichAttacks(transactions, block.number)

    // Look for frontrunning
    await this.detectFrontrunning(transactions, block.number)

    // Look for liquidation MEV
    await this.detectLiquidationMEV(transactions, block.number)
  }

  /**
   * Detect sandwich attacks
   */
  private async detectSandwichAttacks(transactions: any[], blockNumber: number) {
    for (let i = 0; i < transactions.length - 2; i++) {
      const tx1 = transactions[i]
      const tx2 = transactions[i + 1]
      const tx3 = transactions[i + 2]

      if (typeof tx1 !== "object" || typeof tx2 !== "object" || typeof tx3 !== "object") continue

      // Check if this looks like a sandwich pattern
      if (this.isSandwichPattern(tx1, tx2, tx3)) {
        const riskScore = this.calculateSandwichRiskScore(tx1, tx2, tx3)

        if (riskScore >= this.config.minRiskScore) {
          const alert: MEVAlert = {
            id: `sandwich_${Date.now()}_${i}`,
            type: "sandwich",
            severity: this.getSeverityFromRiskScore(riskScore),
            message: `Sandwich attack detected: ${tx1.from} -> ${tx2.from} -> ${tx3.from}`,
            timestamp: Date.now(),
            blockNumber,
            txHash: tx2.hash,
            attacker: tx1.from,
            riskScore,
            recommendation: "Consider using MEV protection or delaying execution",
            autoAction: riskScore >= 80 ? "emergency_stop" : "increase_slippage",
          }

          await this.triggerAlert(alert)
        }
      }
    }
  }

  /**
   * Detect frontrunning
   */
  private async detectFrontrunning(transactions: any[], blockNumber: number) {
    const gasThreshold = await this.getAverageGasPrice()

    for (let i = 0; i < transactions.length - 1; i++) {
      const tx1 = transactions[i]
      const tx2 = transactions[i + 1]

      if (typeof tx1 !== "object" || typeof tx2 !== "object") continue

      // Check for frontrunning pattern
      if (this.isFrontrunPattern(tx1, tx2, gasThreshold)) {
        const riskScore = this.calculateFrontrunRiskScore(tx1, tx2, gasThreshold)

        if (riskScore >= this.config.minRiskScore) {
          const alert: MEVAlert = {
            id: `frontrun_${Date.now()}_${i}`,
            type: "frontrun",
            severity: this.getSeverityFromRiskScore(riskScore),
            message: `Frontrunning detected: ${tx1.from} frontrunning ${tx2.from}`,
            timestamp: Date.now(),
            blockNumber,
            txHash: tx1.hash,
            attacker: tx1.from,
            riskScore,
            recommendation: "Use Flashbots or increase gas price",
            autoAction: riskScore >= 70 ? "use_flashbots" : "delay_execution",
          }

          await this.triggerAlert(alert)
        }
      }
    }
  }

  /**
   * Detect liquidation MEV
   */
  private async detectLiquidationMEV(transactions: any[], blockNumber: number) {
    for (const tx of transactions) {
      if (typeof tx !== "object") continue

      // Check if transaction involves liquidation
      if (this.isLiquidationTransaction(tx)) {
        const riskScore = this.calculateLiquidationRiskScore(tx)

        if (riskScore >= this.config.minRiskScore) {
          const alert: MEVAlert = {
            id: `liquidation_${Date.now()}_${tx.hash}`,
            type: "liquidation",
            severity: this.getSeverityFromRiskScore(riskScore),
            message: `Liquidation MEV detected: ${tx.from}`,
            timestamp: Date.now(),
            blockNumber,
            txHash: tx.hash,
            attacker: tx.from,
            riskScore,
            recommendation: "Monitor for liquidation opportunities",
            autoAction: "monitor",
          }

          await this.triggerAlert(alert)
        }
      }
    }
  }

  /**
   * Check for gas price spikes
   */
  private async checkGasPriceSpikes() {
    try {
      const currentGasPrice = await this.web3.eth.getGasPrice()
      const averageGasPrice = await this.getAverageGasPrice()

      const spike = (Number(currentGasPrice) - averageGasPrice) / averageGasPrice

      if (spike > 0.5) {
        // 50% spike
        const riskScore = Math.min(100, spike * 100)

        const alert: MEVAlert = {
          id: `gas_spike_${Date.now()}`,
          type: "high_risk",
          severity: this.getSeverityFromRiskScore(riskScore),
          message: `Gas price spike detected: ${spike.toFixed(2)}% increase`,
          timestamp: Date.now(),
          blockNumber: await this.web3.eth.getBlockNumber(),
          riskScore,
          recommendation: "Consider delaying transactions or using MEV protection",
          autoAction: riskScore >= 80 ? "emergency_stop" : "delay_execution",
        }

        await this.triggerAlert(alert)
      }
    } catch (error) {
      console.error("Error checking gas price spikes:", error)
    }
  }

  /**
   * Monitor suspicious addresses
   */
  private async monitorSuspiciousAddresses(block: any) {
    const knownMEVBots = [
      "0x5050e08626c499411b5d0e0b5af0e83d3fd82edf",
      "0x00000000003b3cc22af3ae1eac0440bcee416b40",
      // Add more known MEV bot addresses
    ]

    const transactions = block.transactions
    if (!Array.isArray(transactions)) return

    for (const tx of transactions) {
      if (typeof tx !== "object") continue

      if (knownMEVBots.includes(tx.from.toLowerCase())) {
        const alert: MEVAlert = {
          id: `suspicious_${Date.now()}_${tx.hash}`,
          type: "high_risk",
          severity: "high",
          message: `Known MEV bot activity detected: ${tx.from}`,
          timestamp: Date.now(),
          blockNumber: block.number,
          txHash: tx.hash,
          attacker: tx.from,
          riskScore: 85,
          recommendation: "Use MEV protection immediately",
          autoAction: "use_flashbots",
        }

        await this.triggerAlert(alert)
      }
    }
  }

  /**
   * Detect cross-chain MEV
   */
  private async detectCrossChainMEV() {
    // This would involve monitoring bridge transactions and cross-chain arbitrage
    // Implementation would depend on specific bridge protocols

    try {
      // Monitor for large bridge transactions that could indicate cross-chain arbitrage
      const bridgeAddresses = [
        "0x0000000000000000000000000000000000000001", // Example bridge
        "0x0000000000000000000000000000000000000002", // Example bridge
      ]

      // Check recent transactions to bridge addresses
      // This is a simplified implementation
    } catch (error) {
      console.error("Error detecting cross-chain MEV:", error)
    }
  }

  /**
   * Check if transactions form a sandwich pattern
   */
  private isSandwichPattern(tx1: any, tx2: any, tx3: any): boolean {
    // Check if tx1 and tx3 are from the same address (sandwich bot)
    if (tx1.from !== tx3.from) return false

    // Check if tx2 is the victim transaction
    const value1 = Number(tx1.value || 0)
    const value2 = Number(tx2.value || 0)
    const value3 = Number(tx3.value || 0)

    // Basic pattern: large -> small -> large
    return value1 > value2 && value3 > value2 && value1 > 0 && value3 > 0
  }

  /**
   * Check if transactions form a frontrun pattern
   */
  private isFrontrunPattern(tx1: any, tx2: any, gasThreshold: number): boolean {
    const gas1 = Number(tx1.gasPrice || 0)
    const gas2 = Number(tx2.gasPrice || 0)

    // tx1 has significantly higher gas price than tx2 and average
    return gas1 > gas2 * 1.2 && gas1 > gasThreshold * 1.5
  }

  /**
   * Check if transaction is a liquidation
   */
  private isLiquidationTransaction(tx: any): boolean {
    // Check transaction data for liquidation function signatures
    const liquidationSignatures = [
      "0x96cd4ddb", // liquidateBorrow
      "0x5c778605", // liquidate
      "0xaed30777", // liquidateExactTokensForTokens
    ]

    const data = tx.input || tx.data || ""
    return liquidationSignatures.some((sig) => data.startsWith(sig))
  }

  /**
   * Calculate sandwich risk score
   */
  private calculateSandwichRiskScore(tx1: any, tx2: any, tx3: any): number {
    let score = 30 // Base score for sandwich pattern

    // Higher score for larger value differences
    const value1 = Number(tx1.value || 0)
    const value2 = Number(tx2.value || 0)
    const value3 = Number(tx3.value || 0)

    if (value1 > value2 * 10) score += 20
    if (value3 > value2 * 10) score += 20

    // Higher score for gas price manipulation
    const gas1 = Number(tx1.gasPrice || 0)
    const gas2 = Number(tx2.gasPrice || 0)
    const gas3 = Number(tx3.gasPrice || 0)

    if (gas1 > gas2 * 1.5) score += 15
    if (gas3 < gas2 * 0.8) score += 15

    return Math.min(100, score)
  }

  /**
   * Calculate frontrun risk score
   */
  private calculateFrontrunRiskScore(tx1: any, tx2: any, gasThreshold: number): number {
    let score = 25 // Base score for frontrun pattern

    const gas1 = Number(tx1.gasPrice || 0)
    const gas2 = Number(tx2.gasPrice || 0)

    // Higher score for larger gas price differences
    const gasRatio = gas1 / Math.max(gas2, 1)
    if (gasRatio > 2) score += 25
    if (gasRatio > 5) score += 25

    // Higher score if significantly above average
    const avgRatio = gas1 / Math.max(gasThreshold, 1)
    if (avgRatio > 3) score += 25

    return Math.min(100, score)
  }

  /**
   * Calculate liquidation risk score
   */
  private calculateLiquidationRiskScore(tx: any): number {
    let score = 40 // Base score for liquidation

    const gasPrice = Number(tx.gasPrice || 0)
    const value = Number(tx.value || 0)

    // Higher score for high gas price (competitive liquidation)
    if (gasPrice > 100e9) score += 20 // > 100 Gwei
    if (gasPrice > 200e9) score += 20 // > 200 Gwei

    // Higher score for large value
    if (value > 1e18) score += 20 // > 1 ETH

    return Math.min(100, score)
  }

  /**
   * Get severity from risk score
   */
  private getSeverityFromRiskScore(riskScore: number): "low" | "medium" | "high" | "critical" {
    if (riskScore >= 90) return "critical"
    if (riskScore >= 70) return "high"
    if (riskScore >= 40) return "medium"
    return "low"
  }

  /**
   * Get average gas price
   */
  private async getAverageGasPrice(): Promise<number> {
    try {
      const gasPrice = await this.web3.eth.getGasPrice()
      return Number(gasPrice)
    } catch (error) {
      return 20e9 // 20 Gwei default
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(alert: MEVAlert) {
    if (!this.config.enabled) return
    if (!this.config.alertTypes.includes(alert.type)) return

    // Add to alerts array
    this.alerts.unshift(alert)

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100)
    }

    // Execute auto actions
    await this.executeAutoActions(alert)

    // Send notifications
    await this.sendNotifications(alert)

    // Trigger callbacks
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(alert)
      } catch (error) {
        console.error("Error in alert callback:", error)
      }
    })

    console.log(`MEV Alert triggered: ${alert.type} - ${alert.severity} - ${alert.message}`)
  }

  /**
   * Execute auto actions
   */
  private async executeAutoActions(alert: MEVAlert) {
    if (!alert.autoAction) return

    try {
      switch (alert.autoAction) {
        case "emergency_stop":
          if (this.config.autoActions.emergencyStop) {
            // Trigger emergency stop
            console.log("Auto action: Emergency stop triggered")
          }
          break

        case "increase_slippage":
          if (this.config.autoActions.increaseSlippage) {
            // Increase slippage tolerance
            console.log("Auto action: Increasing slippage tolerance")
          }
          break

        case "use_flashbots":
          if (this.config.autoActions.useFlashbots) {
            // Switch to Flashbots
            console.log("Auto action: Switching to Flashbots")
          }
          break

        case "delay_execution":
          if (this.config.autoActions.delayExecution) {
            // Delay next execution
            console.log("Auto action: Delaying execution")
          }
          break
      }
    } catch (error) {
      console.error("Error executing auto action:", error)
    }
  }

  /**
   * Send notifications
   */
  private async sendNotifications(alert: MEVAlert) {
    for (const method of this.config.notificationMethods) {
      try {
        switch (method) {
          case "browser":
            await this.sendBrowserNotification(alert)
            break

          case "webhook":
            if (this.config.webhookUrl) {
              await this.sendWebhookNotification(alert)
            }
            break

          case "telegram":
            if (this.config.telegramBotToken && this.config.telegramChatId) {
              await this.sendTelegramNotification(alert)
            }
            break

          case "email":
            if (this.config.emailEndpoint) {
              await this.sendEmailNotification(alert)
            }
            break
        }
      } catch (error) {
        console.error(`Error sending ${method} notification:`, error)
      }
    }
  }

  /**
   * Send browser notification
   */
  private async sendBrowserNotification(alert: MEVAlert) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`MEV Alert: ${alert.type}`, {
        body: alert.message,
        icon: "/favicon.ico",
        tag: alert.id,
      })
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: MEVAlert) {
    if (!this.config.webhookUrl) return

    await fetch(this.config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        alert,
        timestamp: new Date().toISOString(),
        source: "MEVAlertService",
      }),
    })
  }

  /**
   * Send Telegram notification
   */
  private async sendTelegramNotification(alert: MEVAlert) {
    if (!this.config.telegramBotToken || !this.config.telegramChatId) return

    const message =
      `🚨 MEV Alert: ${alert.type.toUpperCase()}\n\n` +
      `Severity: ${alert.severity}\n` +
      `Risk Score: ${alert.riskScore}/100\n` +
      `Message: ${alert.message}\n` +
      `Block: ${alert.blockNumber}\n` +
      `Recommendation: ${alert.recommendation}`

    const url = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: this.config.telegramChatId,
        text: message,
        parse_mode: "HTML",
      }),
    })
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: MEVAlert) {
    if (!this.config.emailEndpoint) return

    await fetch(this.config.emailEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: `MEV Alert: ${alert.type} - ${alert.severity}`,
        message: alert.message,
        alert,
        timestamp: new Date().toI` - ${alert.severity}`,
        message: alert.message,
        alert,
        timestamp: new Date().toISOString(),
      }),
    })
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 50): MEVAlert[] {
    return this.alerts.slice(0, limit)
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: string): MEVAlert[] {
    return this.alerts.filter((alert) => alert.type === type)
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: string): MEVAlert[] {
    return this.alerts.filter((alert) => alert.severity === severity)
  }

  /**
   * Clear alerts
   */
  clearAlerts() {
    this.alerts = []
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AlertConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return false
  }
}
