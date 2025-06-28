export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: any
  actions?: NotificationAction[]
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  timestamp?: number
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationSettings {
  enabled: boolean
  tradeExecutions: boolean
  opportunities: boolean
  priceAlerts: boolean
  systemAlerts: boolean
  profitMilestones: boolean
  gasAlerts: boolean
  mevAlerts: boolean
  sound: boolean
  vibration: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null
  private settings: NotificationSettings
  private notificationQueue: NotificationPayload[] = []
  private isProcessingQueue = false
  private vapidPublicKey: string

  constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
    this.settings = this.loadSettings()
    this.initializeServiceWorker()
  }

  /**
   * Initialize service worker for push notifications
   */
  private async initializeServiceWorker() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported")
      return
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js")
      console.log("✅ Service Worker registered")

      // Check for existing subscription
      const existingSubscription = await this.registration.pushManager.getSubscription()
      if (existingSubscription) {
        this.subscription = existingSubscription
        console.log("📱 Existing push subscription found")
      }

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", this.handleServiceWorkerMessage.bind(this))
    } catch (error) {
      console.error("Service Worker registration failed:", error)
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported")
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission === "denied") {
      console.warn("Notification permission denied")
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<boolean> {
    if (!this.registration || !this.vapidPublicKey) {
      console.error("Service Worker or VAPID key not available")
      return false
    }

    try {
      const hasPermission = await this.requestPermission()
      if (!hasPermission) {
        return false
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      })

      this.subscription = subscription
      console.log("📱 Push notification subscription created")

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)

      this.updateSettings({ enabled: true })
      return true
    } catch (error) {
      console.error("Push subscription failed:", error)
      return false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true
    }

    try {
      await this.subscription.unsubscribe()
      this.subscription = null
      console.log("📱 Push notification subscription removed")

      this.updateSettings({ enabled: false })
      return true
    } catch (error) {
      console.error("Push unsubscription failed:", error)
      return false
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(payload: NotificationPayload) {
    if (!this.settings.enabled || !this.canSendNotification()) {
      return
    }

    try {
      // Check if we're in quiet hours
      if (this.isQuietHours()) {
        this.queueNotification(payload)
        return
      }

      if (this.registration && this.registration.active) {
        // Send through service worker for better control
        this.registration.active.postMessage({
          type: "SHOW_NOTIFICATION",
          payload: {
            ...payload,
            timestamp: Date.now(),
          },
        })
      } else {
        // Fallback to direct notification
        await this.showDirectNotification(payload)
      }

      console.log("📱 Local notification sent:", payload.title)
    } catch (error) {
      console.error("Local notification error:", error)
    }
  }

  /**
   * Send trade execution notification
   */
  async notifyTradeExecution(data: {
    success: boolean
    profit: number
    pair: string
    txHash?: string
    failureReason?: string
  }) {
    if (!this.settings.tradeExecutions) return

    const payload: NotificationPayload = {
      title: data.success ? "🎉 Trade Executed Successfully!" : "❌ Trade Execution Failed",
      body: data.success
        ? `Profit: $${data.profit.toFixed(2)} from ${data.pair} arbitrage`
        : `Failed to execute ${data.pair} trade: ${data.failureReason}`,
      icon: "/icons/trade-icon.png",
      badge: "/icons/badge.png",
      tag: "trade-execution",
      data: {
        type: "trade",
        success: data.success,
        profit: data.profit,
        pair: data.pair,
        txHash: data.txHash,
      },
      actions: data.success
        ? [
            { action: "view-tx", title: "View Transaction", icon: "/icons/link.png" },
            { action: "view-dashboard", title: "Open Dashboard", icon: "/icons/dashboard.png" },
          ]
        : [{ action: "view-dashboard", title: "Check Status", icon: "/icons/dashboard.png" }],
    }

    await this.sendLocalNotification(payload)
  }

  /**
   * Send opportunity notification
   */
  async notifyOpportunity(data: {
    pair: string
    profit: number
    spread: number
    dexes: string[]
    confidence: number
  }) {
    if (!this.settings.opportunities) return

    const payload: NotificationPayload = {
      title: "🎯 New Arbitrage Opportunity",
      body: `${data.pair}: $${data.profit.toFixed(2)} profit (${data.spread.toFixed(2)}% spread)`,
      icon: "/icons/opportunity-icon.png",
      badge: "/icons/badge.png",
      tag: "opportunity",
      data: {
        type: "opportunity",
        pair: data.pair,
        profit: data.profit,
        spread: data.spread,
        dexes: data.dexes,
        confidence: data.confidence,
      },
      actions: [
        { action: "execute-trade", title: "Execute Trade", icon: "/icons/execute.png" },
        { action: "view-details", title: "View Details", icon: "/icons/details.png" },
      ],
    }

    await this.sendLocalNotification(payload)
  }

  /**
   * Send price alert notification
   */
  async notifyPriceAlert(data: {
    symbol: string
    currentPrice: number
    changePercent: number
    direction: "up" | "down"
  }) {
    if (!this.settings.priceAlerts) return

    const emoji = data.direction === "up" ? "📈" : "📉"
    const payload: NotificationPayload = {
      title: `${emoji} Price Alert: ${data.symbol}`,
      body: `${data.symbol} ${data.direction === "up" ? "increased" : "decreased"} by ${Math.abs(data.changePercent).toFixed(2)}% to $${data.currentPrice.toFixed(2)}`,
      icon: "/icons/price-alert-icon.png",
      badge: "/icons/badge.png",
      tag: "price-alert",
      data: {
        type: "price-alert",
        symbol: data.symbol,
        currentPrice: data.currentPrice,
        changePercent: data.changePercent,
        direction: data.direction,
      },
      actions: [{ action: "view-chart", title: "View Chart", icon: "/icons/chart.png" }],
    }

    await this.sendLocalNotification(payload)
  }

  /**
   * Send system alert notification
   */
  async notifySystemAlert(data: {
    type: "error" | "warning" | "info"
    title: string
    message: string
    severity: "low" | "medium" | "high" | "critical"
  }) {
    if (!this.settings.systemAlerts) return

    const emojis = { error: "🚨", warning: "⚠️", info: "ℹ️" }
    const payload: NotificationPayload = {
      title: `${emojis[data.type]} ${data.title}`,
      body: data.message,
      icon: "/icons/system-alert-icon.png",
      badge: "/icons/badge.png",
      tag: "system-alert",
      requireInteraction: data.severity === "critical",
      data: {
        type: "system-alert",
        alertType: data.type,
        severity: data.severity,
        message: data.message,
      },
      actions: [{ action: "view-dashboard", title: "Check System", icon: "/icons/dashboard.png" }],
    }

    await this.sendLocalNotification(payload)
  }

  /**
   * Send profit milestone notification
   */
  async notifyProfitMilestone(data: {
    totalProfit: number
    milestone: number
    timeToReach: number
    totalTrades: number
  }) {
    if (!this.settings.profitMilestones) return

    const payload: NotificationPayload = {
      title: "🎉 Profit Milestone Reached!",
      body: `Congratulations! You've reached $${data.milestone} in total profit. Current: $${data.totalProfit.toFixed(2)}`,
      icon: "/icons/milestone-icon.png",
      badge: "/icons/badge.png",
      tag: "profit-milestone",
      requireInteraction: true,
      data: {
        type: "milestone",
        totalProfit: data.totalProfit,
        milestone: data.milestone,
        timeToReach: data.timeToReach,
        totalTrades: data.totalTrades,
      },
      actions: [
        { action: "view-stats", title: "View Statistics", icon: "/icons/stats.png" },
        { action: "share-achievement", title: "Share", icon: "/icons/share.png" },
      ],
    }

    await this.sendLocalNotification(payload)
  }

  /**
   * Send gas alert notification
   */
  async notifyGasAlert(data: { currentGas: number; threshold: number; recommendation: string }) {
    if (!this.settings.gasAlerts) return

    const payload: NotificationPayload = {
      title: "⛽ Gas Price Alert",
      body: `Gas price is ${data.currentGas} Gwei (threshold: ${data.threshold}). ${data.recommendation}`,
      icon: "/icons/gas-alert-icon.png",
      badge: "/icons/badge.png",
      tag: "gas-alert",
      data: {
        type: "gas-alert",
        currentGas: data.currentGas,
        threshold: data.threshold,
        recommendation: data.recommendation,
      },
      actions: [{ action: "adjust-gas", title: "Adjust Settings", icon: "/icons/settings.png" }],
    }

    await this.sendLocalNotification(payload)
  }

  /**
   * Send MEV alert notification
   */
  async notifyMEVAlert(data: { type: string; severity: string; description: string; txHash?: string }) {
    if (!this.settings.mevAlerts) return

    const payload: NotificationPayload = {
      title: "🛡️ MEV Activity Detected",
      body: `${data.type} detected with ${data.severity} severity. ${data.description}`,
      icon: "/icons/mev-alert-icon.png",
      badge: "/icons/badge.png",
      tag: "mev-alert",
      requireInteraction: data.severity === "high",
      data: {
        type: "mev-alert",
        mevType: data.type,
        severity: data.severity,
        description: data.description,
        txHash: data.txHash,
      },
      actions: [{ action: "view-protection", title: "View Protection", icon: "/icons/shield.png" }],
    }

    await this.sendLocalNotification(payload)
  }

  /**
   * Show direct notification (fallback)
   */
  private async showDirectNotification(payload: NotificationPayload) {
    if (Notification.permission !== "granted") return

    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      image: payload.image,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction,
      silent: payload.silent,
      data: payload.data,
    })

    // Handle notification click
    notification.onclick = () => {
      this.handleNotificationClick(payload)
      notification.close()
    }

    // Auto-close after 10 seconds if not requiring interaction
    if (!payload.requireInteraction) {
      setTimeout(() => notification.close(), 10000)
    }
  }

  /**
   * Handle notification click events
   */
  private handleNotificationClick(payload: NotificationPayload) {
    // Focus the window
    if (window.focus) {
      window.focus()
    }

    // Handle different notification types
    switch (payload.data?.type) {
      case "trade":
        if (payload.data.txHash) {
          window.open(`https://arbiscan.io/tx/${payload.data.txHash}`, "_blank")
        } else {
          window.location.href = "/trading"
        }
        break
      case "opportunity":
        window.location.href = "/trading"
        break
      case "price-alert":
        window.location.href = "/dashboard"
        break
      case "system-alert":
        window.location.href = "/dashboard"
        break
      case "milestone":
        window.location.href = "/dashboard"
        break
      default:
        window.location.href = "/dashboard"
    }
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage(event: MessageEvent) {
    const { type, action, data } = event.data

    switch (type) {
      case "NOTIFICATION_CLICK":
        this.handleNotificationAction(action, data)
        break
      case "NOTIFICATION_CLOSE":
        console.log("Notification closed:", data)
        break
    }
  }

  /**
   * Handle notification action clicks
   */
  private handleNotificationAction(action: string, data: any) {
    switch (action) {
      case "view-tx":
        if (data.txHash) {
          window.open(`https://arbiscan.io/tx/${data.txHash}`, "_blank")
        }
        break
      case "execute-trade":
        window.location.href = "/trading"
        // Trigger trade execution logic
        break
      case "view-dashboard":
        window.location.href = "/dashboard"
        break
      case "view-details":
        window.location.href = "/trading"
        break
      case "view-chart":
        window.location.href = "/dashboard"
        break
      case "adjust-gas":
        window.location.href = "/config"
        break
      case "view-protection":
        window.location.href = "/security"
        break
      case "view-stats":
        window.location.href = "/dashboard"
        break
      case "share-achievement":
        this.shareAchievement(data)
        break
    }
  }

  /**
   * Share achievement on social media
   */
  private shareAchievement(data: any) {
    const text = `🎉 Just reached $${data.milestone} in arbitrage trading profits! #DeFi #Arbitrage #Trading`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, "_blank")
  }

  /**
   * Queue notification for later delivery
   */
  private queueNotification(payload: NotificationPayload) {
    this.notificationQueue.push(payload)
    console.log("📱 Notification queued for quiet hours")
  }

  /**
   * Process queued notifications
   */
  async processQueuedNotifications() {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) return

    this.isProcessingQueue = true

    try {
      while (this.notificationQueue.length > 0) {
        const payload = this.notificationQueue.shift()
        if (payload) {
          await this.sendLocalNotification(payload)
          // Small delay between notifications
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    } finally {
      this.isProcessingQueue = false
    }
  }

  /**
   * Check if notifications can be sent
   */
  private canSendNotification(): boolean {
    return (
      this.settings.enabled && Notification.permission === "granted" && document.visibilityState === "hidden" // Only show when app is not visible
    )
  }

  /**
   * Check if we're in quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) return false

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const [startHour, startMin] = this.settings.quietHours.start.split(":").map(Number)
    const [endHour, endMin] = this.settings.quietHours.end.split(":").map(Number)

    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime
    }
  }

  /**
   * Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      await fetch("/api/push-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      })
    } catch (error) {
      console.error("Failed to send subscription to server:", error)
    }
  }

  /**
   * Load notification settings
   */
  private loadSettings(): NotificationSettings {
    const defaultSettings: NotificationSettings = {
      enabled: false,
      tradeExecutions: true,
      opportunities: true,
      priceAlerts: true,
      systemAlerts: true,
      profitMilestones: true,
      gasAlerts: true,
      mevAlerts: true,
      sound: true,
      vibration: true,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
      },
    }

    try {
      const saved = localStorage.getItem("notificationSettings")
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
    } catch (error) {
      console.error("Error loading notification settings:", error)
      return defaultSettings
    }
  }

  /**
   * Update notification settings
   */
  updateSettings(updates: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...updates }
    localStorage.setItem("notificationSettings", JSON.stringify(this.settings))

    // Process queued notifications if quiet hours were disabled
    if (updates.quietHours?.enabled === false) {
      this.processQueuedNotifications()
    }
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings }
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(): {
    supported: boolean
    permission: NotificationPermission
    subscribed: boolean
    endpoint?: string
  } {
    return {
      supported: "serviceWorker" in navigator && "PushManager" in window,
      permission: Notification.permission,
      subscribed: !!this.subscription,
      endpoint: this.subscription?.endpoint,
    }
  }

  /**
   * Test notification
   */
  async testNotification() {
    await this.sendLocalNotification({
      title: "🧪 Test Notification",
      body: "This is a test notification from your arbitrage bot!",
      icon: "/icons/test-icon.png",
      tag: "test",
      data: { type: "test" },
    })
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.notificationQueue = []
    if (this.subscription) {
      this.unsubscribe()
    }
  }
}
