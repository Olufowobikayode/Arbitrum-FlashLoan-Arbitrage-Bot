export interface TelegramConfig {
  botToken: string
  chatId: string
  enabled: boolean
  notifications: {
    tradeExecutions: boolean
    opportunities: boolean
    botStatus: boolean
    profitMilestones: boolean
    errors: boolean
    systemHealth: boolean
  }
  rateLimiting: {
    maxMessagesPerMinute: number
    lastMessageTime: number
    messageCount: number
  }
}

export interface NotificationMessage {
  id: string
  type: "trade" | "opportunity" | "status" | "milestone" | "error" | "health"
  priority: "low" | "medium" | "high" | "critical"
  message: string
  timestamp: number
  retryCount: number
}

export class TelegramNotificationService {
  private config: TelegramConfig
  private messageQueue: NotificationMessage[] = []
  private isProcessing = false
  private connectionStatus: "connected" | "disconnected" | "testing" = "disconnected"

  constructor(config: TelegramConfig) {
    this.config = config
    this.startMessageProcessor()
    this.testConnection()
  }

  /**
   * Test Telegram bot connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.config.botToken || !this.config.chatId) {
      this.connectionStatus = "disconnected"
      return false
    }

    this.connectionStatus = "testing"

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/getMe`)
      const data = await response.json()

      if (data.ok) {
        // Test sending a message
        await this.sendDirectMessage("🤖 Arbitrage Bot Connected!\n\nTelegram notifications are now active.")
        this.connectionStatus = "connected"
        return true
      } else {
        this.connectionStatus = "disconnected"
        return false
      }
    } catch (error) {
      console.error("Telegram connection test failed:", error)
      this.connectionStatus = "disconnected"
      return false
    }
  }

  /**
   * Send trade execution notification
   */
  async notifyTradeExecution(data: {
    success: boolean
    opportunityId: string
    baseToken: string
    quoteToken: string
    profit: number
    gasUsed: number
    txHash?: string
    failureReason?: string
  }) {
    if (!this.config.notifications.tradeExecutions) return

    const emoji = data.success ? "✅" : "❌"
    const status = data.success ? "SUCCESSFUL" : "FAILED"

    let message = `${emoji} **TRADE ${status}**\n\n`
    message += `🔄 Pair: ${data.baseToken}/${data.quoteToken}\n`
    message += `💰 Profit: $${data.profit.toFixed(2)}\n`
    message += `⛽ Gas Used: ${data.gasUsed.toLocaleString()}\n`

    if (data.success && data.txHash) {
      message += `🔗 TX: \`${data.txHash}\`\n`
    }

    if (!data.success && data.failureReason) {
      message += `❌ Reason: ${data.failureReason}\n`
    }

    message += `⏰ ${new Date().toLocaleTimeString()}`

    await this.queueMessage({
      type: "trade",
      priority: data.success ? "medium" : "high",
      message,
    })
  }

  /**
   * Send opportunity notification
   */
  async notifyOpportunity(data: {
    id: string
    baseToken: string
    quoteToken: string
    estimatedProfit: number
    liquidity: number
    confidence: number
    dexes: string[]
  }) {
    if (!this.config.notifications.opportunities) return

    let message = `🎯 **NEW OPPORTUNITY**\n\n`
    message += `💱 Pair: ${data.baseToken}/${data.quoteToken}\n`
    message += `💰 Est. Profit: $${data.estimatedProfit.toFixed(2)}\n`
    message += `💧 Liquidity: $${data.liquidity.toLocaleString()}\n`
    message += `📊 Confidence: ${data.confidence.toFixed(1)}%\n`
    message += `🏪 DEXes: ${data.dexes.join(" ↔ ")}\n`
    message += `⏰ ${new Date().toLocaleTimeString()}`

    await this.queueMessage({
      type: "opportunity",
      priority: data.estimatedProfit > 100 ? "high" : "medium",
      message,
    })
  }

  /**
   * Send bot status notification
   */
  async notifyBotStatus(data: {
    action: "started" | "stopped" | "emergency_stop"
    stats?: {
      totalProfit: number
      successfulTrades: number
      failedTrades: number
      uptime: number
    }
  }) {
    if (!this.config.notifications.botStatus) return

    let message = ""

    switch (data.action) {
      case "started":
        message = `🚀 **BOT STARTED**\n\n`
        message += `Status: Operational\n`
        message += `Auto-trading: Enabled\n`
        message += `⏰ ${new Date().toLocaleString()}`
        break

      case "stopped":
        message = `🛑 **BOT STOPPED**\n\n`
        if (data.stats) {
          message += `📊 **Session Summary:**\n`
          message += `💰 Total Profit: $${data.stats.totalProfit.toFixed(2)}\n`
          message += `✅ Successful: ${data.stats.successfulTrades}\n`
          message += `❌ Failed: ${data.stats.failedTrades}\n`
          message += `⏱️ Uptime: ${this.formatDuration(data.stats.uptime)}\n`
        }
        message += `⏰ ${new Date().toLocaleString()}`
        break

      case "emergency_stop":
        message = `🚨 **EMERGENCY STOP ACTIVATED**\n\n`
        message += `⚠️ Bot has been emergency stopped\n`
        message += `🔒 All trading halted\n`
        message += `⏰ ${new Date().toLocaleString()}`
        break
    }

    await this.queueMessage({
      type: "status",
      priority: data.action === "emergency_stop" ? "critical" : "medium",
      message,
    })
  }

  /**
   * Send profit milestone notification
   */
  async notifyProfitMilestone(data: {
    totalProfit: number
    milestone: number
    timeToReach: number
    averageProfitPerTrade: number
    totalTrades: number
  }) {
    if (!this.config.notifications.profitMilestones) return

    let message = `🎉 **MILESTONE REACHED!**\n\n`
    message += `💰 Total Profit: $${data.totalProfit.toFixed(2)}\n`
    message += `🎯 Milestone: $${data.milestone}\n`
    message += `⏱️ Time to reach: ${this.formatDuration(data.timeToReach)}\n`
    message += `📊 Avg per trade: $${data.averageProfitPerTrade.toFixed(2)}\n`
    message += `🔢 Total trades: ${data.totalTrades}\n`
    message += `⏰ ${new Date().toLocaleString()}`

    await this.queueMessage({
      type: "milestone",
      priority: "high",
      message,
    })
  }

  /**
   * Send error notification
   */
  async notifyError(data: {
    type: "system" | "execution" | "network" | "security"
    message: string
    details?: string
    severity: "low" | "medium" | "high" | "critical"
  }) {
    if (!this.config.notifications.errors) return

    const emoji = data.severity === "critical" ? "🚨" : data.severity === "high" ? "⚠️" : "⚡"

    let message = `${emoji} **ERROR ALERT**\n\n`
    message += `🔴 Type: ${data.type.toUpperCase()}\n`
    message += `📝 Message: ${data.message}\n`

    if (data.details) {
      message += `📋 Details: ${data.details}\n`
    }

    message += `⚡ Severity: ${data.severity.toUpperCase()}\n`
    message += `⏰ ${new Date().toLocaleString()}`

    await this.queueMessage({
      type: "error",
      priority: data.severity === "critical" ? "critical" : "high",
      message,
    })
  }

  /**
   * Send system health notification
   */
  async notifySystemHealth(data: {
    cpuUsage: number
    memoryUsage: number
    networkLatency: number
    gasPrice: number
    blockNumber: number
  }) {
    if (!this.config.notifications.systemHealth) return

    let message = `💚 **SYSTEM HEALTH**\n\n`
    message += `🖥️ CPU: ${data.cpuUsage.toFixed(1)}%\n`
    message += `💾 Memory: ${data.memoryUsage.toFixed(1)}%\n`
    message += `🌐 Latency: ${data.networkLatency}ms\n`
    message += `⛽ Gas Price: ${data.gasPrice} Gwei\n`
    message += `🧱 Block: ${data.blockNumber}\n`
    message += `⏰ ${new Date().toLocaleString()}`

    await this.queueMessage({
      type: "health",
      priority: "low",
      message,
    })
  }

  /**
   * Queue a message for sending
   */
  private async queueMessage(data: {
    type: NotificationMessage["type"]
    priority: NotificationMessage["priority"]
    message: string
  }) {
    const message: NotificationMessage = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type,
      priority: data.priority,
      message: data.message,
      timestamp: Date.now(),
      retryCount: 0,
    }

    // Insert based on priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const insertIndex = this.messageQueue.findIndex(
      (msg) => priorityOrder[msg.priority] > priorityOrder[message.priority],
    )

    if (insertIndex === -1) {
      this.messageQueue.push(message)
    } else {
      this.messageQueue.splice(insertIndex, 0, message)
    }

    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue = this.messageQueue.slice(0, 100)
    }
  }

  /**
   * Start message processor
   */
  private startMessageProcessor() {
    setInterval(async () => {
      if (!this.isProcessing && this.messageQueue.length > 0) {
        await this.processMessageQueue()
      }
    }, 2000) // Process every 2 seconds
  }

  /**
   * Process message queue
   */
  private async processMessageQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) return

    this.isProcessing = true

    try {
      // Check rate limiting
      const now = Date.now()
      const oneMinuteAgo = now - 60000

      // Reset counter if more than a minute has passed
      if (now - this.config.rateLimiting.lastMessageTime > 60000) {
        this.config.rateLimiting.messageCount = 0
      }

      // Check if we can send more messages
      if (this.config.rateLimiting.messageCount >= this.config.rateLimiting.maxMessagesPerMinute) {
        console.log("Rate limit reached, waiting...")
        return
      }

      // Get next message
      const message = this.messageQueue.shift()
      if (!message) return

      // Send message
      const success = await this.sendDirectMessage(message.message)

      if (success) {
        this.config.rateLimiting.messageCount++
        this.config.rateLimiting.lastMessageTime = now
      } else {
        // Retry logic
        message.retryCount++
        if (message.retryCount < 3) {
          this.messageQueue.unshift(message) // Put back at front
        }
      }
    } catch (error) {
      console.error("Error processing message queue:", error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Send message directly to Telegram
   */
  private async sendDirectMessage(message: string): Promise<boolean> {
    if (!this.config.enabled || !this.config.botToken || !this.config.chatId) {
      return false
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      })

      const data = await response.json()
      return data.ok
    } catch (error) {
      console.error("Failed to send Telegram message:", error)
      return false
    }
  }

  /**
   * Format duration in seconds to human readable
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): "connected" | "disconnected" | "testing" {
    return this.connectionStatus
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number
    processing: boolean
    rateLimitRemaining: number
  } {
    const rateLimitRemaining = Math.max(
      0,
      this.config.rateLimiting.maxMessagesPerMinute - this.config.rateLimiting.messageCount,
    )

    return {
      pending: this.messageQueue.length,
      processing: this.isProcessing,
      rateLimitRemaining,
    }
  }

  /**
   * Clear message queue
   */
  clearQueue() {
    this.messageQueue = []
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TelegramConfig>) {
    this.config = { ...this.config, ...newConfig }

    if (newConfig.botToken || newConfig.chatId) {
      this.testConnection()
    }
  }

  /**
   * Get configuration
   */
  getConfig(): TelegramConfig {
    return { ...this.config }
  }
}
