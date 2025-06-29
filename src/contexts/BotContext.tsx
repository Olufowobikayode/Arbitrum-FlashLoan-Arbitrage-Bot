"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

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
  successfulTrades: number
  todayProfit: number
  uptime: string
  averageProfit: number
  autoExecuteEnabled: boolean
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
  profitUSD: number
  profitPercent: number
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
  recentTrades: any[]
  stats: BotState
  startBot: () => Promise<void>
  stopBot: () => void
  emergencyStop: () => void
  toggleAutoTrade: () => void
  updateBotConfig: (config: Partial<BotState>) => void
  executeArbitrage: (opportunity: ArbitrageOpportunity) => Promise<void>
  scanForOpportunities: () => Promise<void>
  clearOpportunities: () => void
  resetStats: () => void
  updateBotState: (state: Partial<BotState>) => void
}

const BotContext = createContext<BotContextType | undefined>(undefined)

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast()

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
    successfulTrades: 0,
    todayProfit: 0,
    uptime: "0h 0m",
    averageProfit: 0,
    autoExecuteEnabled: false,
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
  const [recentTrades, setRecentTrades] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load saved state from localStorage (client-side only)
  useEffect(() => {
    if (isClient) {
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
    }
  }, [isClient])

  // Save state changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("botState", JSON.stringify(botState))
    }
  }, [botState, isClient])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("autoExecutionStats", JSON.stringify(autoExecutionStats))
    }
  }, [autoExecutionStats, isClient])

  // Simulate opportunity scanning when bot is running
  useEffect(() => {
    if (botState.running) {
      const interval = setInterval(() => {
        generateMockOpportunities()
        setBotState((prev) => ({ ...prev, lastUpdate: Date.now() }))
      }, 5000) // Update every 5 seconds

      return () => clearInterval(interval)
    } else {
      setOpportunities([])
    }
  }, [botState.running])

  const generateMockOpportunities = useCallback(() => {
    const mockOpportunities: ArbitrageOpportunity[] = []
    const numOpportunities = Math.floor(Math.random() * 3) + 1

    const tokens = [
      { symbol: "WETH", price: 2450 + Math.random() * 100 },
      { symbol: "WBTC", price: 43000 + Math.random() * 2000 },
      { symbol: "USDC", price: 1 },
      { symbol: "ARB", price: 1.2 + Math.random() * 0.3 },
    ]

    const exchanges = ["Uniswap V3", "SushiSwap", "Balancer", "Curve"]

    for (let i = 0; i < numOpportunities; i++) {
      const tokenA = tokens[Math.floor(Math.random() * tokens.length)]
      const tokenB = tokens[Math.floor(Math.random() * tokens.length)]

      if (tokenA.symbol !== tokenB.symbol) {
        const profitUsd = 5 + Math.random() * 45

        if (profitUsd >= botState.minProfitThreshold) {
          const opportunity: ArbitrageOpportunity = {
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
            profitUSD: profitUsd,
            profitPercent: (profitUsd / (tokenA.price * 100)) * 100,
          }

          mockOpportunities.push(opportunity)
        }
      }
    }

    if (mockOpportunities.length > 0) {
      setOpportunities((prev) => {
        const combined = [...mockOpportunities, ...prev]
        return combined.sort((a, b) => b.profitUsd - a.profitUsd).slice(0, 20)
      })
    }
  }, [botState.minProfitThreshold])

  const startBot = useCallback(async () => {
    try {
      setBotState((prev) => ({ ...prev, running: true, status: "scanning" }))
      setIsScanning(true)

      // Start scanning
      await scanForOpportunities()

      toast({
        title: "Bot Started",
        description: "Arbitrage bot is now scanning for opportunities.",
      })

      console.log("🤖 Bot started successfully")
    } catch (error) {
      console.error("Failed to start bot:", error)
      setBotState((prev) => ({ ...prev, running: false, status: "error" }))
      setIsScanning(false)
      toast({
        title: "Error",
        description: "Failed to start the bot. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }, [toast])

  const stopBot = useCallback(() => {
    setBotState((prev) => ({ ...prev, running: false, status: "stopped" }))
    setIsScanning(false)
    toast({
      title: "Bot Stopped",
      description: "Arbitrage bot has been stopped.",
    })
    console.log("🤖 Bot stopped")
  }, [toast])

  const emergencyStop = useCallback(() => {
    setBotState((prev) => ({
      ...prev,
      running: false,
      autoTrade: false,
      status: "stopped",
    }))
    setIsScanning(false)
    setOpportunities([])
    toast({
      title: "Emergency Stop",
      description: "Bot has been emergency stopped and all trades halted.",
      variant: "destructive",
    })
    console.log("🚨 Emergency stop activated")
  }, [toast])

  const toggleAutoTrade = useCallback(() => {
    setBotState((prev) => ({ ...prev, autoTrade: !prev.autoTrade }))
  }, [])

  const updateBotConfig = useCallback((config: Partial<BotState>) => {
    setBotState((prev) => ({ ...prev, ...config, lastUpdate: Date.now() }))
  }, [])

  const executeArbitrage = useCallback(
    async (opportunity: ArbitrageOpportunity) => {
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
            successfulTrades: prev.successfulTrades + 1,
            successRate: ((prev.successfulTrades + 1) / (prev.totalTrades + 1)) * 100,
            averageProfit: (prev.totalProfit + actualProfit) / (prev.totalTrades + 1),
            todayProfit: prev.todayProfit + actualProfit,
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

          // Add to recent trades
          setRecentTrades((prev) => [
            {
              id: Date.now().toString(),
              pair: `${opportunity.tokenA}/${opportunity.tokenB}`,
              profit: actualProfit,
              timestamp: new Date().toISOString(),
              status: "success",
            },
            ...prev.slice(0, 9),
          ])

          toast({
            title: "Trade Executed",
            description: `Profit: $${actualProfit.toFixed(2)}`,
          })

          console.log(`✅ Arbitrage executed successfully: $${actualProfit.toFixed(2)} profit`)
        } else {
          setBotState((prev) => ({
            ...prev,
            totalTrades: prev.totalTrades + 1,
            successRate: (prev.successfulTrades / (prev.totalTrades + 1)) * 100,
            status: "scanning",
          }))

          setAutoExecutionStats((prev) => ({
            ...prev,
            totalExecuted: prev.totalExecuted + 1,
            failedTrades: prev.failedTrades + 1,
            lastExecution: Date.now(),
          }))

          toast({
            title: "Trade Failed",
            description: "The arbitrage trade was not successful.",
            variant: "destructive",
          })

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
    [toast],
  )

  const scanForOpportunities = useCallback(async () => {
    if (!botState.running) return

    try {
      setIsScanning(true)

      // Simulate scanning delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      generateMockOpportunities()
    } catch (error) {
      console.error("Scan failed:", error)
    } finally {
      setIsScanning(false)
    }
  }, [botState.running, generateMockOpportunities])

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
      successfulTrades: 0,
      todayProfit: 0,
      averageProfit: 0,
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
    setRecentTrades([])
  }, [])

  const updateBotState = useCallback((state: Partial<BotState>) => {
    setBotState((prev) => ({ ...prev, ...state, lastUpdate: Date.now() }))
  }, [])

  const value: BotContextType = {
    botState,
    opportunities,
    isScanning,
    autoExecutionStats,
    recentTrades,
    stats: botState,
    startBot,
    stopBot,
    emergencyStop,
    toggleAutoTrade,
    updateBotConfig,
    executeArbitrage,
    scanForOpportunities,
    clearOpportunities,
    resetStats,
    updateBotState,
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
