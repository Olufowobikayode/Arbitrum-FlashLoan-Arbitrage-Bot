"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useWeb3 } from "./Web3Context"
import { BotService } from "../services/BotService"
import { SecurityService } from "../services/SecurityService"
import { TokenService } from "../services/TokenService"
import { TradeSimulationService, type SimulationResult, type TradeParams } from "../services/TradeSimulationService"
import { FlashloanProviderService } from "../services/FlashloanProviderService"
import { ArbitrageExecutionService } from "../services/ArbitrageExecutionService"
import { TelegramNotificationService, type TelegramConfig } from "../services/TelegramNotificationService"
import toast from "react-hot-toast"

interface BotState {
  running: boolean
  autoTrade: boolean
  lastScan: string
  opportunities: number
  totalProfit: number
  consecutiveFailures: number
  startTime: number
  flashloanToken: string
  flashloanAmount: number
  flashloanProvider: string
  currentGas: number
  status: string
  securityStatus: string
  simulationEnabled: boolean
  autoExecuteAfterSimulation: boolean
  autoExecuteEnabled: boolean
  minProfitThreshold: number
  maxSlippagePercent: number
  maxGasGwei: number
}

interface Opportunity {
  id: string
  baseToken: {
    address: string
    symbol: string
  }
  quoteToken: {
    address: string
    symbol: string
  }
  liquidity: {
    usd: number
  }
  priceUsd: string
  estimatedProfit: number
  amount: number
  route?: any
  simulationResult?: SimulationResult
}

interface DEXInfo {
  address: string
  name: string
  fee: number
  type: "v2" | "v3" | "stable" | "curve"
  isActive: boolean
  addedTimestamp: number
}

interface AutoExecutionStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  totalProfit: number
}

interface BotContextType {
  botState: BotState
  opportunities: Opportunity[]
  registeredDEXes: DEXInfo[]
  isScanning: boolean
  autoExecutionStats: AutoExecutionStats
  telegramService: TelegramNotificationService | null
  updateBotState: (updates: Partial<BotState>) => void
  startBot: () => void
  stopBot: () => void
  emergencyStop: () => void
  executeTrade: (opportunityId?: string) => Promise<void>
  scanOpportunities: () => Promise<void>
  updateFlashloanConfig: (config: { token?: string; amount?: number; provider?: string }) => void
  updateGasSettings: (gasPrice: number) => Promise<void>
  updateSlippageSettings: (slippage: number) => Promise<void>
  addDEX: (dex: Omit<DEXInfo, "addedTimestamp">) => Promise<boolean>
  removeDEX: (address: string) => Promise<boolean>
  toggleDEX: (address: string, active: boolean) => Promise<boolean>
  simulateTrade: (opportunityId: string) => Promise<SimulationResult>
  queryFlashloanProviders: (token: string, amount: number) => Promise<any[]>
  updateAutoExecutionSettings: (settings: {
    autoExecuteEnabled?: boolean
    minProfitThreshold?: number
    maxSlippagePercent?: number
    maxGasGwei?: number
  }) => void
  updateTelegramConfig: (config: TelegramConfig) => void
}

const BotContext = createContext<BotContextType | undefined>(undefined)

const INITIAL_BOT_STATE: BotState = {
  running: false,
  autoTrade: false,
  lastScan: "",
  opportunities: 0,
  totalProfit: 0,
  consecutiveFailures: 0,
  startTime: Date.now(),
  flashloanToken: "USDC",
  flashloanAmount: 250000,
  flashloanProvider: "aave",
  currentGas: 150,
  status: "🔴 Stopped",
  securityStatus: "🟢 Normal",
  simulationEnabled: true,
  autoExecuteAfterSimulation: false,
  autoExecuteEnabled: false,
  minProfitThreshold: 50,
  maxSlippagePercent: 1.5,
  maxGasGwei: 200,
}

const INITIAL_DEXES: DEXInfo[] = [
  {
    address: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
    name: "Uniswap V2",
    fee: 30,
    type: "v2",
    isActive: true,
    addedTimestamp: Date.now() - 86400000,
  },
  {
    address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    name: "Uniswap V3",
    fee: 30,
    type: "v3",
    isActive: true,
    addedTimestamp: Date.now() - 172800000,
  },
  {
    address: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
    name: "SushiSwap",
    fee: 30,
    type: "v2",
    isActive: true,
    addedTimestamp: Date.now() - 259200000,
  },
]

const INITIAL_AUTO_EXECUTION_STATS: AutoExecutionStats = {
  totalExecutions: 0,
  successfulExecutions: 0,
  failedExecutions: 0,
  totalProfit: 0,
}

const INITIAL_TELEGRAM_CONFIG: TelegramConfig = {
  botToken: "",
  chatId: "",
  enabled: false,
  notifications: {
    tradeExecutions: true,
    opportunities: true,
    botStatus: true,
    profitMilestones: true,
    errors: true,
    systemHealth: false,
  },
  rateLimiting: {
    maxMessagesPerMinute: 20,
    lastMessageTime: 0,
    messageCount: 0,
  },
}

export const BotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { web3, contract, account, isConnected } = useWeb3()
  const [botState, setBotState] = useState<BotState>(INITIAL_BOT_STATE)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [registeredDEXes, setRegisteredDEXes] = useState<DEXInfo[]>(INITIAL_DEXES)
  const [isScanning, setIsScanning] = useState(false)
  const [autoExecutionStats, setAutoExecutionStats] = useState<AutoExecutionStats>(INITIAL_AUTO_EXECUTION_STATS)
  const [telegramService, setTelegramService] = useState<TelegramNotificationService | null>(null)
  const [profitMilestones] = useState([100, 500, 1000, 2500, 5000, 10000])
  const [lastMilestone, setLastMilestone] = useState(0)

  const botService = new BotService()
  const securityService = new SecurityService()
  const tokenService = new TokenService()
  const simulationService = new TradeSimulationService(web3, contract)
  const flashloanService = new FlashloanProviderService(web3)
  const executionService = web3 && contract && account ? new ArbitrageExecutionService(web3, contract, account) : null

  useEffect(() => {
    loadBotState()
    loadRegisteredDEXes()
    loadAutoExecutionStats()
    loadTelegramConfig()
  }, [])

  useEffect(() => {
    if (botState.running && botState.autoTrade) {
      const interval = setInterval(() => {
        scanOpportunities()
      }, 15000) // Scan every 15 seconds

      return () => clearInterval(interval)
    }
  }, [botState.running, botState.autoTrade])

  // Check for profit milestones
  useEffect(() => {
    const currentMilestone = profitMilestones.find((m) => botState.totalProfit >= m && m > lastMilestone)
    if (currentMilestone && telegramService) {
      telegramService.notifyProfitMilestone({
        totalProfit: botState.totalProfit,
        milestone: currentMilestone,
        timeToReach: (Date.now() - botState.startTime) / 1000,
        averageProfitPerTrade:
          autoExecutionStats.totalExecutions > 0 ? botState.totalProfit / autoExecutionStats.totalExecutions : 0,
        totalTrades: autoExecutionStats.totalExecutions,
      })
      setLastMilestone(currentMilestone)
    }
  }, [botState.totalProfit, lastMilestone, telegramService, autoExecutionStats])

  const loadBotState = () => {
    const savedState = localStorage.getItem("botState")
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setBotState({ ...INITIAL_BOT_STATE, ...parsed })
      } catch (error) {
        console.error("Error loading bot state:", error)
      }
    }
  }

  const loadRegisteredDEXes = () => {
    const savedDEXes = localStorage.getItem("registeredDEXes")
    if (savedDEXes) {
      try {
        const parsed = JSON.parse(savedDEXes)
        setRegisteredDEXes(parsed)
      } catch (error) {
        console.error("Error loading DEXes:", error)
        setRegisteredDEXes(INITIAL_DEXES)
      }
    }
  }

  const loadAutoExecutionStats = () => {
    const savedStats = localStorage.getItem("autoExecutionStats")
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats)
        setAutoExecutionStats(parsed)
      } catch (error) {
        console.error("Error loading auto execution stats:", error)
        setAutoExecutionStats(INITIAL_AUTO_EXECUTION_STATS)
      }
    }
  }

  const loadTelegramConfig = () => {
    const savedConfig = localStorage.getItem("telegramConfig")
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        const config = { ...INITIAL_TELEGRAM_CONFIG, ...parsed }
        if (config.botToken && config.chatId) {
          const service = new TelegramNotificationService(config)
          setTelegramService(service)
        }
      } catch (error) {
        console.error("Error loading Telegram config:", error)
      }
    }
  }

  const saveBotState = (state: BotState) => {
    localStorage.setItem("botState", JSON.stringify(state))
  }

  const saveRegisteredDEXes = (dexes: DEXInfo[]) => {
    localStorage.setItem("registeredDEXes", JSON.stringify(dexes))
  }

  const saveAutoExecutionStats = (stats: AutoExecutionStats) => {
    localStorage.setItem("autoExecutionStats", JSON.stringify(stats))
  }

  const updateBotState = (updates: Partial<BotState>) => {
    setBotState((prev) => {
      const newState = { ...prev, ...updates }
      saveBotState(newState)
      return newState
    })
  }

  const updateTelegramConfig = (config: TelegramConfig) => {
    if (config.botToken && config.chatId && config.enabled) {
      const service = new TelegramNotificationService(config)
      setTelegramService(service)
    } else {
      setTelegramService(null)
    }
  }

  const startBot = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    const startTime = Date.now()
    updateBotState({
      running: true,
      autoTrade: true,
      status: "🟢 Operational",
      startTime,
    })

    // Send Telegram notification
    if (telegramService) {
      telegramService.notifyBotStatus({
        action: "started",
      })
    }

    toast.success("🚀 Bot started successfully - Auto-scanning for arbitrage opportunities")
  }

  const stopBot = () => {
    const sessionStats = {
      totalProfit: botState.totalProfit,
      successfulTrades: autoExecutionStats.successfulExecutions,
      failedTrades: autoExecutionStats.failedExecutions,
      uptime: (Date.now() - botState.startTime) / 1000,
    }

    updateBotState({
      running: false,
      autoTrade: false,
      status: "🔴 Stopped",
    })

    // Send Telegram notification
    if (telegramService) {
      telegramService.notifyBotStatus({
        action: "stopped",
        stats: sessionStats,
      })
    }

    toast.success("🛑 Bot stopped")
  }

  const emergencyStop = () => {
    updateBotState({
      running: false,
      autoTrade: false,
      status: "🚨 EMERGENCY STOP",
      securityStatus: "🔴 Lockdown",
    })

    setOpportunities([])

    // Send Telegram notification
    if (telegramService) {
      telegramService.notifyBotStatus({
        action: "emergency_stop",
      })
    }

    toast.error("🚨 Emergency stop activated!")
  }

  const scanOpportunities = async () => {
    if (isScanning) return

    setIsScanning(true)

    try {
      console.log("Scanning for arbitrage opportunities...")
      const activeDEXes = registeredDEXes.filter((dex) => dex.isActive)
      const newOpportunities = await botService.fetchOpportunities(botState.flashloanToken)

      // Filter and validate opportunities
      const validOpportunities = []
      for (const opp of newOpportunities) {
        // Security check
        const securityReport = await securityService.analyzeTransaction(
          opp.baseToken.address,
          0,
          "0x",
          opp.baseToken.address,
          opp.amount,
        )

        if (securityReport.passed) {
          // Run simulation if enabled
          if (botState.simulationEnabled) {
            const tradeParams: TradeParams = {
              flashloanToken: opp.baseToken.address,
              flashloanAmount: opp.amount,
              flashloanProvider: botState.flashloanProvider,
              targetToken: opp.quoteToken.address,
              dexPath: activeDEXes.map((dex) => dex.address),
              slippageTolerance: botState.maxSlippagePercent * 100,
              gasPrice: botState.maxGasGwei / 1000,
              minProfitUsd: botState.minProfitThreshold,
            }

            const simulationResult = await simulationService.simulateTrade(tradeParams)
            opp.simulationResult = simulationResult

            // Only include if simulation passes
            if (simulationResult.success && simulationResult.profitAfterCosts >= botState.minProfitThreshold) {
              validOpportunities.push(opp)

              // Send opportunity notification
              if (telegramService && opp.estimatedProfit >= botState.minProfitThreshold) {
                telegramService.notifyOpportunity({
                  id: opp.id,
                  baseToken: opp.baseToken.symbol,
                  quoteToken: opp.quoteToken.symbol,
                  estimatedProfit: opp.estimatedProfit,
                  liquidity: opp.liquidity.usd,
                  confidence: simulationResult.confidence || 85,
                  dexes: activeDEXes.map((dex) => dex.name),
                })
              }

              // Auto-execute if enabled and profitable opportunities found
              if (botState.autoExecuteEnabled && executionService) {
                console.log(`Auto-executing opportunity ${opp.id}...`)

                const executionResult = await executionService.executeArbitrageIfProfitable(
                  opp,
                  {
                    enabled: botState.autoExecuteEnabled,
                    minProfitUsd: botState.minProfitThreshold,
                    maxSlippagePercent: botState.maxSlippagePercent,
                    maxGasGwei: botState.maxGasGwei,
                    maxExecutionsPerHour: 10,
                    requireSimulationSuccess: true,
                    minConfidenceLevel: 80,
                  },
                  {
                    token: botState.flashloanToken,
                    amount: botState.flashloanAmount,
                    provider: botState.flashloanProvider,
                  },
                )

                // Update stats
                const newStats = {
                  ...autoExecutionStats,
                  totalExecutions: autoExecutionStats.totalExecutions + 1,
                  successfulExecutions: executionResult.success
                    ? autoExecutionStats.successfulExecutions + 1
                    : autoExecutionStats.successfulExecutions,
                  failedExecutions: !executionResult.success
                    ? autoExecutionStats.failedExecutions + 1
                    : autoExecutionStats.failedExecutions,
                  totalProfit: executionResult.success
                    ? autoExecutionStats.totalProfit + executionResult.actualProfit
                    : autoExecutionStats.totalProfit,
                }

                setAutoExecutionStats(newStats)
                saveAutoExecutionStats(newStats)

                // Send Telegram notification for trade execution
                if (telegramService) {
                  telegramService.notifyTradeExecution({
                    success: executionResult.success,
                    opportunityId: opp.id,
                    baseToken: opp.baseToken.symbol,
                    quoteToken: opp.quoteToken.symbol,
                    profit: executionResult.actualProfit,
                    gasUsed: executionResult.gasUsed || 0,
                    txHash: executionResult.txHash,
                    failureReason: executionResult.failureReason,
                  })
                }

                if (executionResult.success) {
                  updateBotState({
                    totalProfit: botState.totalProfit + executionResult.actualProfit,
                    consecutiveFailures: 0,
                  })
                  toast.success(`✅ Auto-executed trade! Profit: $${executionResult.actualProfit.toFixed(2)}`)
                } else {
                  updateBotState({
                    consecutiveFailures: botState.consecutiveFailures + 1,
                  })
                  console.log(`❌ Auto-execution failed: ${executionResult.failureReason}`)

                  // Send error notification for consecutive failures
                  if (botState.consecutiveFailures >= 3 && telegramService) {
                    telegramService.notifyError({
                      type: "execution",
                      message: `${botState.consecutiveFailures + 1} consecutive execution failures`,
                      details: executionResult.failureReason,
                      severity: "high",
                    })
                  }
                }
              }
            }
          } else {
            validOpportunities.push(opp)
          }
        }
      }

      setOpportunities(validOpportunities)
      updateBotState({
        opportunities: validOpportunities.length,
        lastScan: new Date().toLocaleTimeString(),
      })

      console.log(`Scan completed: ${validOpportunities.length} opportunities found`)
    } catch (error) {
      console.error("Error scanning opportunities:", error)
      toast.error("Failed to scan opportunities")

      // Send error notification
      if (telegramService) {
        telegramService.notifyError({
          type: "system",
          message: "Failed to scan opportunities",
          details: error instanceof Error ? error.message : "Unknown error",
          severity: "medium",
        })
      }
    } finally {
      setIsScanning(false)
    }
  }

  const simulateTrade = async (opportunityId: string): Promise<SimulationResult> => {
    const opportunity = opportunities.find((o) => o.id === opportunityId)
    if (!opportunity) {
      throw new Error("Opportunity not found")
    }

    const activeDEXes = registeredDEXes.filter((dex) => dex.isActive)
    const tradeParams: TradeParams = {
      flashloanToken: opportunity.baseToken.address,
      flashloanAmount: opportunity.amount,
      flashloanProvider: botState.flashloanProvider,
      targetToken: opportunity.quoteToken.address,
      dexPath: activeDEXes.map((dex) => dex.address),
      slippageTolerance: 150,
      gasPrice: botState.currentGas / 1000,
      minProfitUsd: 50,
    }

    const result = await simulationService.simulateTrade(tradeParams)

    // Update opportunity with simulation result
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === opportunityId ? { ...opp, simulationResult: result } : opp)),
    )

    return result
  }

  const executeTrade = async (opportunityId?: string) => {
    if (!contract || !account) {
      toast.error("Contract not connected")
      return
    }

    try {
      const opportunity = opportunityId ? opportunities.find((o) => o.id === opportunityId) : opportunities[0]

      if (!opportunity) {
        toast.error("No opportunity selected")
        return
      }

      // Check simulation result if available
      if (opportunity.simulationResult && !opportunity.simulationResult.success) {
        toast.error("❌ Trade failed simulation - execution blocked")
        return
      }

      toast.loading("Executing trade...", { id: "trade-execution" })

      const activeDEXes = registeredDEXes.filter((dex) => dex.isActive)
      const tokens = [opportunity.baseToken.address, opportunity.quoteToken.address]
      const amounts = [opportunity.amount, 0]
      const targets = activeDEXes.map((dex) => dex.address)
      const calldatas = targets.map(() => "0x") // Simplified for demo
      const useAaveFlags = targets.map(() => botState.flashloanProvider === "aave")

      // Execute transaction
      const tx = await contract.methods.executeBundle(tokens, amounts, targets, calldatas, useAaveFlags).send({
        from: account,
        gas: 3000000,
        gasPrice: web3!.utils.toWei((botState.currentGas / 1000).toString(), "gwei"),
      })

      // Update profit
      const actualProfit = opportunity.simulationResult?.profitAfterCosts || opportunity.estimatedProfit
      const newProfit = botState.totalProfit + actualProfit

      // Update auto-execution stats for manual trades too
      const newStats = {
        ...autoExecutionStats,
        totalExecutions: autoExecutionStats.totalExecutions + 1,
        successfulExecutions: autoExecutionStats.successfulExecutions + 1,
        totalProfit: autoExecutionStats.totalProfit + actualProfit,
      }

      setAutoExecutionStats(newStats)
      saveAutoExecutionStats(newStats)

      updateBotState({
        totalProfit: newProfit,
        consecutiveFailures: 0,
      })

      // Send Telegram notification for manual trade
      if (telegramService) {
        telegramService.notifyTradeExecution({
          success: true,
          opportunityId: opportunity.id,
          baseToken: opportunity.baseToken.symbol,
          quoteToken: opportunity.quoteToken.symbol,
          profit: actualProfit,
          gasUsed: tx.gasUsed || 0,
          txHash: tx.transactionHash,
        })
      }

      toast.success(`✅ Trade executed! Profit: $${actualProfit.toFixed(2)}`, {
        id: "trade-execution",
      })
    } catch (error) {
      console.error("Trade execution error:", error)
      updateBotState({
        consecutiveFailures: botState.consecutiveFailures + 1,
      })

      // Update auto-execution stats for failed trades
      const newStats = {
        ...autoExecutionStats,
        totalExecutions: autoExecutionStats.totalExecutions + 1,
        failedExecutions: autoExecutionStats.failedExecutions + 1,
      }

      setAutoExecutionStats(newStats)
      saveAutoExecutionStats(newStats)

      // Send Telegram notification for failed trade
      if (telegramService) {
        telegramService.notifyTradeExecution({
          success: false,
          opportunityId: opportunityId || "unknown",
          baseToken: "Unknown",
          quoteToken: "Unknown",
          profit: 0,
          gasUsed: 0,
          failureReason: error instanceof Error ? error.message : "Unknown error",
        })
      }

      toast.error("❌ Trade execution failed", { id: "trade-execution" })
    }
  }

  const updateFlashloanConfig = (config: { token?: string; amount?: number; provider?: string }) => {
    updateBotState({
      flashloanToken: config.token || botState.flashloanToken,
      flashloanAmount: config.amount || botState.flashloanAmount,
      flashloanProvider: config.provider || botState.flashloanProvider,
    })

    toast.success("Flashloan configuration updated")
  }

  const updateGasSettings = async (gasPrice: number) => {
    if (!contract || !account) {
      toast.error("Contract not connected")
      return
    }

    try {
      await contract.methods.setGasPrice(web3!.utils.toWei((gasPrice / 1000).toString(), "gwei")).send({
        from: account,
      })

      updateBotState({ currentGas: gasPrice })
      toast.success(`Gas price updated to ${gasPrice} Gwei`)
    } catch (error) {
      console.error("Gas update error:", error)
      toast.error("Failed to update gas price")
    }
  }

  const updateSlippageSettings = async (slippage: number) => {
    if (!contract || !account) {
      toast.error("Contract not connected")
      return
    }

    try {
      await contract.methods.setSlippage(slippage).send({
        from: account,
      })

      toast.success(`Slippage updated to ${(slippage / 100).toFixed(1)}%`)
    } catch (error) {
      console.error("Slippage update error:", error)
      toast.error("Failed to update slippage")
    }
  }

  const addDEX = async (dex: Omit<DEXInfo, "addedTimestamp">): Promise<boolean> => {
    try {
      const newDEX: DEXInfo = {
        ...dex,
        addedTimestamp: Date.now(),
      }

      const updatedDEXes = [...registeredDEXes, newDEX]
      setRegisteredDEXes(updatedDEXes)
      saveRegisteredDEXes(updatedDEXes)

      toast.success(`✅ Added ${dex.name} to registered DEXes`)
      return true
    } catch (error) {
      console.error("Error adding DEX:", error)
      toast.error("Failed to add DEX")
      return false
    }
  }

  const removeDEX = async (address: string): Promise<boolean> => {
    try {
      const dexToRemove = registeredDEXes.find((dex) => dex.address === address)
      const updatedDEXes = registeredDEXes.filter((dex) => dex.address !== address)

      setRegisteredDEXes(updatedDEXes)
      saveRegisteredDEXes(updatedDEXes)

      toast.success(`✅ Removed ${dexToRemove?.name || "DEX"} from registered DEXes`)
      return true
    } catch (error) {
      console.error("Error removing DEX:", error)
      toast.error("Failed to remove DEX")
      return false
    }
  }

  const toggleDEX = async (address: string, active: boolean): Promise<boolean> => {
    try {
      const updatedDEXes = registeredDEXes.map((dex) => (dex.address === address ? { ...dex, isActive: active } : dex))

      setRegisteredDEXes(updatedDEXes)
      saveRegisteredDEXes(updatedDEXes)

      const dex = registeredDEXes.find((d) => d.address === address)
      toast.success(`✅ ${dex?.name} ${active ? "activated" : "deactivated"}`)
      return true
    } catch (error) {
      console.error("Error toggling DEX:", error)
      toast.error("Failed to toggle DEX")
      return false
    }
  }

  const queryFlashloanProviders = async (token: string, amount: number) => {
    try {
      return await flashloanService.queryAvailability(token, amount)
    } catch (error) {
      console.error("Error querying flashloan providers:", error)
      return []
    }
  }

  const updateAutoExecutionSettings = (settings: {
    autoExecuteEnabled?: boolean
    minProfitThreshold?: number
    maxSlippagePercent?: number
    maxGasGwei?: number
  }) => {
    updateBotState({
      autoExecuteEnabled:
        settings.autoExecuteEnabled !== undefined ? settings.autoExecuteEnabled : botState.autoExecuteEnabled,
      minProfitThreshold:
        settings.minProfitThreshold !== undefined ? settings.minProfitThreshold : botState.minProfitThreshold,
      maxSlippagePercent:
        settings.maxSlippagePercent !== undefined ? settings.maxSlippagePercent : botState.maxSlippagePercent,
      maxGasGwei: settings.maxGasGwei !== undefined ? settings.maxGasGwei : botState.maxGasGwei,
    })

    toast.success("Auto-execution settings updated")
  }

  return (
    <BotContext.Provider
      value={{
        botState,
        opportunities,
        registeredDEXes,
        isScanning,
        autoExecutionStats,
        telegramService,
        updateBotState,
        startBot,
        stopBot,
        emergencyStop,
        executeTrade,
        scanOpportunities,
        updateFlashloanConfig,
        updateGasSettings,
        updateSlippageSettings,
        addDEX,
        removeDEX,
        toggleDEX,
        simulateTrade,
        queryFlashloanProviders,
        updateAutoExecutionSettings,
        updateTelegramConfig,
      }}
    >
      {children}
    </BotContext.Provider>
  )
}

export const useBot = () => {
  const context = useContext(BotContext)
  if (context === undefined) {
    throw new Error("useBot must be used within a BotProvider")
  }
  return context
}
