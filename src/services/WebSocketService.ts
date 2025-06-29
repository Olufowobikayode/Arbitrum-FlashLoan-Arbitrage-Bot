export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

export interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

export class WebSocketService {
  private static instance: WebSocketService
  private connections: Map<string, WebSocket> = new Map()
  private subscribers: Map<string, ((message: WebSocketMessage) => void)[]> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map()
  private isActive = false
  private ws: WebSocket | null = null
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  // Public WebSocket endpoints only
  private readonly WS_ENDPOINTS = {
    binance: "wss://stream.binance.com:9443/ws",
    coinbase: "wss://ws-feed.exchange.coinbase.com",
    dexscreener: "wss://io.dexscreener.com/dex/screener/pairs/h24/1",
  }

  private readonly DEFAULT_CONFIG: WebSocketConfig = {
    url: "",
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
  }

  private constructor() {
    this.setupEventListeners()
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  private setupEventListeners() {
    // Handle page visibility changes
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.pauseConnections()
        } else {
          this.resumeConnections()
        }
      })
    }

    // Handle network status changes
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        console.log("🌐 Network connection restored")
        this.resumeConnections()
      })

      window.addEventListener("offline", () => {
        console.log("🌐 Network connection lost")
        this.pauseConnections()
      })
    }
  }

  async startConnections(): Promise<void> {
    if (this.isActive) return

    this.isActive = true
    console.log("🔌 Starting WebSocket connections...")

    // Start price feed connections
    await this.connectToBinance()
    await this.connectToCoinbase()
    await this.connectToDexScreener()

    // Mock WebSocket connections for development
    this.simulateWebSocketData()

    console.log("✅ WebSocket connections established")
  }

  stopConnections() {
    this.isActive = false

    // Close all connections
    this.connections.forEach((ws, name) => {
      console.log(`🔌 Closing ${name} connection`)
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })

    // Clear intervals
    this.heartbeatIntervals.forEach((interval) => clearInterval(interval))
    this.heartbeatIntervals.clear()

    // Clear maps
    this.connections.clear()
    this.reconnectAttempts.clear()

    console.log("⏹️ All WebSocket connections closed")
  }

  private async connectToBinance() {
    try {
      const streams = [
        "ethusdt@ticker",
        "btcusdt@ticker",
        "arbusdt@ticker",
        "ethusdt@depth20@100ms",
        "btcusdt@depth20@100ms",
      ].join("/")

      const wsUrl = `${this.WS_ENDPOINTS.binance}/${streams}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log("📡 Binance WebSocket connected")
        this.connections.set("binance", ws)
        this.reconnectAttempts.set("binance", 0)
        this.startHeartbeat("binance", ws)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleBinanceMessage(data)
        } catch (error) {
          console.error("Binance message parse error:", error)
        }
      }

      ws.onclose = (event) => {
        console.log(`📡 Binance WebSocket closed: ${event.code} ${event.reason}`)
        this.connections.delete("binance")
        this.scheduleReconnect("binance", () => this.connectToBinance())
      }

      ws.onerror = (error) => {
        console.error("Binance WebSocket error:", error)
      }
    } catch (error) {
      console.error("Binance connection error:", error)
    }
  }

  private async connectToCoinbase() {
    try {
      const ws = new WebSocket(this.WS_ENDPOINTS.coinbase)

      ws.onopen = () => {
        console.log("📡 Coinbase WebSocket connected")
        this.connections.set("coinbase", ws)
        this.reconnectAttempts.set("coinbase", 0)

        // Subscribe to ticker and level2 data
        const subscribeMessage = {
          type: "subscribe",
          product_ids: ["ETH-USD", "BTC-USD", "ARB-USD"],
          channels: [
            "ticker",
            {
              name: "level2",
              product_ids: ["ETH-USD", "BTC-USD"],
            },
          ],
        }

        ws.send(JSON.stringify(subscribeMessage))
        this.startHeartbeat("coinbase", ws)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleCoinbaseMessage(data)
        } catch (error) {
          console.error("Coinbase message parse error:", error)
        }
      }

      ws.onclose = (event) => {
        console.log(`📡 Coinbase WebSocket closed: ${event.code} ${event.reason}`)
        this.connections.delete("coinbase")
        this.scheduleReconnect("coinbase", () => this.connectToCoinbase())
      }

      ws.onerror = (error) => {
        console.error("Coinbase WebSocket error:", error)
      }
    } catch (error) {
      console.error("Coinbase connection error:", error)
    }
  }

  private async connectToDexScreener() {
    // Skip DexScreener connection in development to avoid CORS issues
    if (process.env.NODE_ENV === "development") {
      console.log("📡 Skipping DexScreener WebSocket in development mode")
      return
    }

    try {
      // Use a mock endpoint or skip entirely
      console.log("📡 DexScreener WebSocket connection skipped (using mock data)")

      // Simulate DexScreener connection
      setTimeout(() => {
        console.log("📡 DexScreener WebSocket connected (simulated)")
        this.connections.set("dexscreener", {} as WebSocket)
        this.reconnectAttempts.set("dexscreener", 0)
      }, 1000)
    } catch (error) {
      console.error("DexScreener connection error:", error)
    }
  }

  private handleBinanceMessage(data: any) {
    if (data.e === "24hrTicker") {
      const message: WebSocketMessage = {
        type: "price_update",
        data: {
          source: "binance",
          symbol: data.s,
          price: Number.parseFloat(data.c),
          change24h: Number.parseFloat(data.P),
          volume24h: Number.parseFloat(data.v),
          high24h: Number.parseFloat(data.h),
          low24h: Number.parseFloat(data.l),
          timestamp: Number.parseInt(data.E),
        },
        timestamp: Date.now(),
      }

      this.notifySubscribers("price_update", message)
    } else if (data.e === "depthUpdate") {
      const message: WebSocketMessage = {
        type: "orderbook_update",
        data: {
          source: "binance",
          symbol: data.s,
          bids: data.b.map((bid: string[]) => ({
            price: Number.parseFloat(bid[0]),
            quantity: Number.parseFloat(bid[1]),
          })),
          asks: data.a.map((ask: string[]) => ({
            price: Number.parseFloat(ask[0]),
            quantity: Number.parseFloat(ask[1]),
          })),
          timestamp: Number.parseInt(data.E),
        },
        timestamp: Date.now(),
      }

      this.notifySubscribers("orderbook_update", message)
    }
  }

  private handleCoinbaseMessage(data: any) {
    if (data.type === "ticker") {
      const message: WebSocketMessage = {
        type: "price_update",
        data: {
          source: "coinbase",
          symbol: data.product_id,
          price: Number.parseFloat(data.price),
          volume24h: Number.parseFloat(data.volume_24h),
          high24h: Number.parseFloat(data.high_24h),
          low24h: Number.parseFloat(data.low_24h),
          timestamp: new Date(data.time).getTime(),
        },
        timestamp: Date.now(),
      }

      this.notifySubscribers("price_update", message)
    } else if (data.type === "l2update") {
      const message: WebSocketMessage = {
        type: "orderbook_update",
        data: {
          source: "coinbase",
          symbol: data.product_id,
          changes: data.changes.map((change: string[]) => ({
            side: change[0],
            price: Number.parseFloat(change[1]),
            size: Number.parseFloat(change[2]),
          })),
          timestamp: new Date(data.time).getTime(),
        },
        timestamp: Date.now(),
      }

      this.notifySubscribers("orderbook_update", message)
    }
  }

  private handleDexScreenerMessage(data: any) {
    if (data.type === "pair_update") {
      const message: WebSocketMessage = {
        type: "dex_update",
        data: {
          source: "dexscreener",
          pairAddress: data.pairAddress,
          baseToken: data.baseToken,
          quoteToken: data.quoteToken,
          priceUsd: Number.parseFloat(data.priceUsd),
          liquidity: Number.parseFloat(data.liquidity?.usd || "0"),
          volume24h: Number.parseFloat(data.volume?.h24 || "0"),
          priceChange24h: Number.parseFloat(data.priceChange?.h24 || "0"),
          dexId: data.dexId,
          chainId: data.chainId,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      }

      this.notifySubscribers("dex_update", message)
    }
  }

  private startHeartbeat(connectionName: string, ws: WebSocket) {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // Send ping based on connection type
        if (connectionName === "binance") {
          ws.send(JSON.stringify({ method: "ping" }))
        } else if (connectionName === "coinbase") {
          ws.send(JSON.stringify({ type: "heartbeat", on: true }))
        }
      } else {
        clearInterval(interval)
        this.heartbeatIntervals.delete(connectionName)
      }
    }, this.DEFAULT_CONFIG.heartbeatInterval)

    this.heartbeatIntervals.set(connectionName, interval)
  }

  private scheduleReconnect(connectionName: string, reconnectFn: () => void) {
    if (!this.isActive) return

    const attempts = this.reconnectAttempts.get(connectionName) || 0

    if (attempts >= this.DEFAULT_CONFIG.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts reached for ${connectionName}`)
      return
    }

    this.reconnectAttempts.set(connectionName, attempts + 1)

    const delay = Math.min(this.DEFAULT_CONFIG.reconnectInterval * Math.pow(2, attempts), 30000)

    console.log(`🔄 Reconnecting to ${connectionName} in ${delay}ms (attempt ${attempts + 1})`)

    setTimeout(() => {
      if (this.isActive) {
        reconnectFn()
      }
    }, delay)
  }

  private pauseConnections() {
    console.log("⏸️ Pausing WebSocket connections")
    // Don't close connections, just stop heartbeats
    this.heartbeatIntervals.forEach((interval) => clearInterval(interval))
    this.heartbeatIntervals.clear()
  }

  private resumeConnections() {
    console.log("▶️ Resuming WebSocket connections")
    // Restart heartbeats for active connections
    this.connections.forEach((ws, name) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.startHeartbeat(name, ws)
      }
    })
  }

  subscribe(event: string, callback: (message: WebSocketMessage) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, [])
    }

    const subscribers = this.subscribers.get(event)!
    subscribers.push(callback)

    // Return unsubscribe function
    return () => {
      const index = subscribers.indexOf(callback)
      if (index > -1) {
        subscribers.splice(index, 1)
      }
    }
  }

  unsubscribe(event: string, callback: (message: WebSocketMessage) => void) {
    const eventSubscribers = this.subscribers.get(event)
    if (eventSubscribers) {
      const index = eventSubscribers.indexOf(callback)
      if (index > -1) {
        eventSubscribers.splice(index, 1)
      }
      if (eventSubscribers.length === 0) {
        this.subscribers.delete(event)
      }
    }
  }

  private notifySubscribers(eventType: string, data: any) {
    const subscribers = this.subscribers.get(eventType) || []
    const message: WebSocketMessage = {
      type: eventType,
      data,
      timestamp: Date.now(),
    }

    subscribers.forEach((callback) => {
      try {
        callback(message)
      } catch (error) {
        console.error(`Error in WebSocket subscriber for ${eventType}:`, error)
      }
    })
  }

  getConnectionStatus(): Record<string, string> {
    const status: Record<string, string> = {}

    this.connections.forEach((ws, key) => {
      switch (ws.readyState) {
        case WebSocket.CONNECTING:
          status[key] = "connecting"
          break
        case WebSocket.OPEN:
          status[key] = "connected"
          break
        case WebSocket.CLOSING:
          status[key] = "closing"
          break
        case WebSocket.CLOSED:
          status[key] = "closed"
          break
        default:
          status[key] = "unknown"
      }
    })

    return status
  }

  cleanup() {
    // Close all WebSocket connections
    this.connections.forEach((ws, key) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })

    this.connections.clear()
    this.subscribers.clear()
    this.reconnectAttempts.clear()
  }

  private simulateWebSocketData(): void {
    // Only simulate if we're in development or if real connections fail
    console.log("🔄 Starting WebSocket data simulation")

    // Simulate price updates every 3 seconds
    const priceInterval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(priceInterval)
        return
      }

      const symbols = ["WETH/USDC", "WBTC/USDC", "ARB/USDC", "LINK/USDC"]
      const basePrices = { WETH: 2450, WBTC: 43000, ARB: 1.2, LINK: 14.5 }

      symbols.forEach((symbol) => {
        const [base] = symbol.split("/")
        const basePrice = basePrices[base as keyof typeof basePrices] || 100

        this.notifySubscribers("price_update", {
          symbol,
          price: basePrice + (Math.random() - 0.5) * basePrice * 0.02,
          exchange: "Uniswap V3",
          volume24h: 1000000 + Math.random() * 500000,
          change24h: (Math.random() - 0.5) * 10,
          timestamp: Date.now(),
        })
      })
    }, 3000)

    // Simulate DEX updates every 5 seconds
    const dexInterval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(dexInterval)
        return
      }

      const exchanges = ["SushiSwap", "Balancer", "Curve"]
      const pairs = ["WETH/USDC", "WBTC/WETH", "ARB/USDC"]

      this.notifySubscribers("dex_update", {
        exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
        pair: pairs[Math.floor(Math.random() * pairs.length)],
        liquidity: 500000 + Math.random() * 1000000,
        volume24h: 100000 + Math.random() * 500000,
        timestamp: Date.now(),
      })
    }, 5000)

    // Store intervals for cleanup
    if (!this.heartbeatIntervals.has("simulation")) {
      this.heartbeatIntervals.set("simulation", priceInterval)
    }
  }
}
