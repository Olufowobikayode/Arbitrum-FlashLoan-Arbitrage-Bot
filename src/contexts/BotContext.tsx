"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useWeb3 } from "./Web3Context"
import { WebSocketService } from "../services/WebSocketService"
import { RealTimeArbitrageScanner } from "../services/RealTimeArbitrageScanner"
import { ArbitrageExecutionService } from "../services/ArbitrageExecutionService"
import { TelegramNotificationService } from "../services/TelegramNotificationService"

export interface BotState {
  running: boolean
  autoTrade: boolean
  status: "idle" | "scanning" | "executing" | "error" | "stopped"
  totalProfit: number
  totalTrades: number
  successRate: number
  gasUsed: number
  lastUpdate: number
  currentStrategy: string
  riskLevel: "low" | "medium" | "high"
  maxSlippage: number
  minProfitThreshold: number
}

export interface ArbitrageOpportunity {
  id: string
  tokenA: string
  tokenB: string
  exchangeA: string
  exchangeB: string
  priceA: number
  priceB: number
  profitUsd: number
  profitPercentage: number
  gasEstimate: number
  confidence: number
  timestamp: number
  liquidity: number
  volume24h: number
}

export interface AutoExecutionStats {
  totalExecuted: number
  successfulTrades: number
  failedTrades: number
  totalProfit: number
  averageProfit: number
  gasSpent: number
  lastExecution: number
}

interface BotContextType {
  botState: BotState
  opportunities: ArbitrageOpportunity[]
  isScanning: boolean
  autoExecutionStats: AutoExecutionStats
  telegramService: any
  startBot: () => Promise<void>
  stopBot: () => void
  emergencyStop: () => void
  toggleAutoTrade: () => void
  updateBotConfig: (config: Partial<BotState>) => void
  executeArbitrage: (opportunity: ArbitrageOpportunity) => Promise<void>
  scanForOpportunities: () => Promise<void>
  clearOpportunities: () => void
  resetStats: () => void
}

const BotContext = createContext<BotContextType | undefined>(undefined)

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, isConnected } = useWeb3()

  const [botState, setBotState] = useState<BotState>({
    running: false,
    autoTrade: false,
    status: "idle",
    totalProfit: 0,
    totalTrades: 0,
    successRate: 0,
    gasUsed: 0,
    lastUpdate: Date.now(),
    currentStrategy: "conservative",
    riskLevel: "medium",
    maxSlippage: 0.5,
    minProfitThreshold: 10,
  })

  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [autoExecutionStats, setAutoExecutionStats] = useState<AutoExecutionStats>({
    totalExecuted: 0,
    successfulTrades: 0,
    failedTrades: 0,
    totalProfit: 0,
    averageProfit: 0,
    gasSpent: 0,
    lastExecution: 0,
  })

  // Services
  const [webSocketService] = useState(() => WebSocketService.getInstance())
  const [scanner] = useState(() => new RealTimeArbitrageScanner())
  const [executionService] = useState(() => new ArbitrageExecutionService())
  const [telegramService] = useState(() => new TelegramNotificationService())

  // Load saved state
  useEffect(() => {
    const savedState = localStorage.getItem("botState")
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setBotState((prev) => ({ ...prev, ...parsed, running: false, status: "idle" }))
      } catch (error) {
        console.error("Failed to load bot state:", error)
      }
    }

    const savedStats = localStorage.getItem("autoExecutionStats")
    if (savedStats) {
      try {
        setAutoExecutionStats(JSON.parse(savedStats))
      } catch (error) {
        console.error("Failed to load execution stats:", error)
      }
    }
  }, [])

  // Save state changes
  useEffect(() => {
    localStorage.setItem("botState", JSON.stringify(botState))
  }, [botState])

  useEffect(() => {
    localStorage.setItem("autoExecutionStats", JSON.stringify(autoExecutionStats))
  }, [autoExecutionStats])

  // WebSocket message handler
  useEffect(() => {
    const unsubscribePriceUpdate = webSocketService.subscribe("price_update", (message) => {
      if (botState.running && isScanning) {
        // Trigger opportunity scan on price updates
        scanForOpportunities()
      }
    })

    const unsubscribeDexUpdate = webSocketService.subscribe("dex_update", (message) => {
      if (botState.running && isScanning) {
        // Process DEX updates for arbitrage opportunities
        processNewOpportunity(message.data)
      }
    })

    return () => {
      unsubscribePriceUpdate()
      unsubscribeDexUpdate()
    }
  }, [botState.running, isScanning])

  const processNewOpportunity = useCallback(
    (data: any) => {
      // Mock opportunity generation based on real data
      const opportunity: ArbitrageOpportunity = {
        id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tokenA: data.baseToken?.symbol || "WETH",
        tokenB: data.quoteToken?.symbol || "USDC",
        exchangeA: data.dexId || "Uniswap V3",
        exchangeB: "SushiSwap",
        priceA: data.priceUsd || 2450 + Math.random() * 10,
        priceB: data.priceUsd ? data.priceUsd * (1 + (Math.random() - 0.5) * 0.02) : 2455 + Math.random() * 10,
        profitUsd: 15 + Math.random() * 50,
        profitPercentage: 0.5 + Math.random() * 2,
        gasEstimate: 0.002 + Math.random() * 0.003,
        confidence: 0.7 + Math.random() * 0.3,
        timestamp: Date.now(),
        liquidity: data.liquidity || 100000 + Math.random() * 500000,
        volume24h: data.volume24h || 50000 + Math.random() * 200000,
      }

      // Only add profitable opportunities above threshold
      if (opportunity.profitUsd >= botState.minProfitThreshold) {
        setOpportunities((prev) => {
          const updated = [opportunity, ...prev.slice(0, 19)] // Keep last 20
          return updated.sort((a, b) => b.profitUsd - a.profitUsd)
        })

        // Auto-execute if enabled and conditions are met
        if (botState.autoTrade && opportunity.confidence > 0.8 && opportunity.profitUsd > 20) {
          executeArbitrage(opportunity)
        }
      }
    },
    [botState.minProfitThreshold, botState.autoTrade],
  )

  const startBot = useCallback(async () => {
    if (!isConnected || !account) {
      throw new Error("Wallet not connected")
    }

    try {
      setBotState((prev) => ({ ...prev, running: true, status: "scanning" }))
      setIsScanning(true)

      // Start WebSocket connections
      await webSocketService.startConnections()

      // Start scanning
      await scanForOpportunities()

      console.log("🤖 Bot started successfully")
    } catch (error) {
      console.error("Failed to start bot:", error)
      setBotState((prev) => ({ ...prev, running: false, status: "error" }))
      setIsScanning(false)
      throw error
    }
  }, [isConnected, account, webSocketService])

  const stopBot = useCallback(() => {
    setBotState((prev) => ({ ...prev, running: false, status: "stopped" }))
    setIsScanning(false)
    webSocketService.stopConnections()
    console.log("🤖 Bot stopped")
  }, [webSocketService])

  const emergencyStop = useCallback(() => {
    setBotState((prev) => ({
      ...prev,
      running: false,
      autoTrade: false,
      status: "stopped",
    }))
    setIsScanning(false)
    setOpportunities([])
    webSocketService.stopConnections()
    console.log("🚨 Emergency stop activated")
  }, [webSocketService])

  const toggleAutoTrade = useCallback(() => {
    setBotState((prev) => ({ ...prev, autoTrade: !prev.autoTrade }))
  }, [])

  const updateBotConfig = useCallback((config: Partial<BotState>) => {
    setBotState((prev) => ({ ...prev, ...config, lastUpdate: Date.now() }))
  }, [])

  const executeArbitrage = useCallback(
    async (opportunity: ArbitrageOpportunity) => {
      if (!isConnected || !account) {
        throw new Error("Wallet not connected")
      }

      try {
        setBotState((prev) => ({ ...prev, status: "executing" }))

        // Simulate execution
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const success = Math.random() > 0.2 // 80% success rate

        if (success) {
          const actualProfit = opportunity.profitUsd * (0.8 + Math.random() * 0.4)
          const gasUsed = opportunity.gasEstimate

          setBotState((prev) => ({
            ...prev,
            totalProfit: prev.totalProfit + actualProfit,
            totalTrades: prev.totalTrades + 1,
            gasUsed: prev.gasUsed + gasUsed,
            successRate: (prev.totalTrades * prev.successRate + 100) / (prev.totalTrades + 1),
            status: "scanning",
          }))

          setAutoExecutionStats((prev) => ({
            ...prev,
            totalExecuted: prev.totalExecuted + 1,
            successfulTrades: prev.successfulTrades + 1,
            totalProfit: prev.totalProfit + actualProfit,
            averageProfit: (prev.totalProfit + actualProfit) / (prev.successfulTrades + 1),
            gasSpent: prev.gasSpent + gasUsed,
            lastExecution: Date.now(),
          }))

          // Send notification
          await telegramService.sendTradeNotification({
            type: "success",
            opportunity,
            actualProfit,
            gasUsed,
          })

          console.log(`✅ Arbitrage executed successfully: $${actualProfit.toFixed(2)} profit`)
        } else {
          setBotState((prev) => ({
            ...prev,
            totalTrades: prev.totalTrades + 1,
            successRate: (prev.totalTrades * prev.successRate + 0) / (prev.totalTrades + 1),
            status: "scanning",
          }))

          setAutoExecutionStats((prev) => ({
            ...prev,
            totalExecuted: prev.totalExecuted + 1,
            failedTrades: prev.failedTrades + 1,
            lastExecution: Date.now(),
          }))

          throw new Error("Trade execution failed")
        }

        // Remove executed opportunity
        setOpportunities((prev) => prev.filter((opp) => opp.id !== opportunity.id))
      } catch (error) {
        console.error("Arbitrage execution failed:", error)
        setBotState((prev) => ({ ...prev, status: "scanning" }))
        throw error
      }
    },
    [isConnected, account, telegramService],
  )

  const scanForOpportunities = useCallback(async () => {
    if (!botState.running) return

    try {
      setIsScanning(true)

      // Simulate scanning delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate mock opportunities
      const mockOpportunities: ArbitrageOpportunity[] = []
      const numOpportunities = Math.floor(Math.random() * 3) + 1

      for (let i = 0; i < numOpportunities; i++) {
        const tokens = [
          { symbol: "WETH", price: 2450 + Math.random() * 100 },
          { symbol: "WBTC", price: 43000 + Math.random() * 2000 },
          { symbol: "USDC", price: 1 },
          { symbol: "ARB", price: 1.2 + Math.random() * 0.3 },
        ]

        const exchanges = ["Uniswap V3", "SushiSwap", "Balancer", "Curve"]
        const tokenA = tokens[Math.floor(Math.random() * tokens.length)]
        const tokenB = tokens[Math.floor(Math.random() * tokens.length)]

        if (tokenA.symbol !== tokenB.symbol) {
          const profitUsd = 5 + Math.random() * 45

          if (profitUsd >= botState.minProfitThreshold) {
            mockOpportunities.push({
              id: `opp_${Date.now()}_${i}`,
              tokenA: tokenA.symbol,
              tokenB: tokenB.symbol,
              exchangeA: exchanges[Math.floor(Math.random() * exchanges.length)],
              exchangeB: exchanges[Math.floor(Math.random() * exchanges.length)],
              priceA: tokenA.price,
              priceB: tokenA.price * (1 + (Math.random() - 0.5) * 0.03),
              profitUsd,
              profitPercentage: (profitUsd / (tokenA.price * 100)) * 100,
              gasEstimate: 0.001 + Math.random() * 0.004,
              confidence: 0.6 + Math.random() * 0.4,
              timestamp: Date.now(),
              liquidity: 50000 + Math.random() * 500000,
              volume24h: 25000 + Math.random() * 200000,
            })
          }
        }
      }

      if (mockOpportunities.length > 0) {
        setOpportunities((prev) => {
          const combined = [...mockOpportunities, ...prev]
          return combined.sort((a, b) => b.profitUsd - a.profitUsd).slice(0, 20)
        })
      }
    } catch (error) {
      console.error("Scan failed:", error)
    } finally {
      setIsScanning(false)
    }
  }, [botState.running, botState.minProfitThreshold])

  const clearOpportunities = useCallback(() => {
    setOpportunities([])
  }, [])

  const resetStats = useCallback(() => {
    setBotState((prev) => ({
      ...prev,
      totalProfit: 0,
      totalTrades: 0,
      successRate: 0,
      gasUsed: 0,
    }))
    setAutoExecutionStats({
      totalExecuted: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalProfit: 0,
      averageProfit: 0,
      gasSpent: 0,
      lastExecution: 0,
    })
  }, [])

  const value: BotContextType = {
    botState,
    opportunities,
    isScanning,
    autoExecutionStats,
    telegramService,
    startBot,
    stopBot,
    emergencyStop,
    toggleAutoTrade,
    updateBotConfig,
    executeArbitrage,
    scanForOpportunities,
    clearOpportunities,
    resetStats,
  }

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>
}

export const useBot = () => {
  const context = useContext(BotContext)
  if (context === undefined) {
    throw new Error("useBot must be used within a BotProvider")
  }
  return context
}
