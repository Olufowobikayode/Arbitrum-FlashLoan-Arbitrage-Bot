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
  private connections: Map<string, WebSocket> = new Map()
  private messageHandlers: Map<string, ((message: WebSocketMessage) => void)[]> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map()
  private isActive = false

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

  constructor() {
    this.setupEventListeners()
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

  async startConnections() {
    if (this.isActive) return

    this.isActive = true
    console.log("🔌 Starting WebSocket connections...")

    // Start price feed connections
    await this.connectToBinance()
    await this.connectToCoinbase()
    await this.connectToDexScreener()

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
    try {
      const ws = new WebSocket(this.WS_ENDPOINTS.dexscreener)

      ws.onopen = () => {
        console.log("📡 DexScreener WebSocket connected")
        this.connections.set("dexscreener", ws)
        this.reconnectAttempts.set("dexscreener", 0)

        // Subscribe to Arbitrum pairs
        const subscribeMessage = {
          type: "subscribe",
          channel: "pairs",
          chainId: "arbitrum",
          filters: {
            minLiquidity: 100000,
            minVolume24h: 50000,
          },
        }

        ws.send(JSON.stringify(subscribeMessage))
        this.startHeartbeat("dexscreener", ws)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleDexScreenerMessage(data)
        } catch (error) {
          console.error("DexScreener message parse error:", error)
        }
      }

      ws.onclose = (event) => {
        console.log(`📡 DexScreener WebSocket closed: ${event.code} ${event.reason}`)
        this.connections.delete("dexscreener")
        this.scheduleReconnect("dexscreener", () => this.connectToDexScreener())
      }

      ws.onerror = (error) => {
        console.error("DexScreener WebSocket error:", error)
      }
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

      this.notifyHandlers("price_update", message)
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

      this.notifyHandlers("orderbook_update", message)
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

      this.notifyHandlers("price_update", message)
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

      this.notifyHandlers("orderbook_update", message)
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

      this.notifyHandlers("dex_update", message)
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

  subscribe(messageType: string, handler: (message: WebSocketMessage) => void) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, [])
    }
    this.messageHandlers.get(messageType)!.push(handler)
  }

  unsubscribe(messageType: string, handler: (message: WebSocketMessage) => void) {
    const handlers = this.messageHandlers.get(messageType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private notifyHandlers(messageType: string, message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(messageType)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message)
        } catch (error) {
          console.error(`Handler error for ${messageType}:`, error)
        }
      })
    }
  }

  getConnectionStatus(): { [key: string]: { connected: boolean; reconnectAttempts: number } } {
    const status: { [key: string]: { connected: boolean; reconnectAttempts: number } } = {}

    this.connections.forEach((ws, name) => {
      status[name] = {
        connected: ws.readyState === WebSocket.OPEN,
        reconnectAttempts: this.reconnectAttempts.get(name) || 0,
      }
    })

    return status
  }

  cleanup() {
    this.stopConnections()
    this.messageHandlers.clear()
  }
}
