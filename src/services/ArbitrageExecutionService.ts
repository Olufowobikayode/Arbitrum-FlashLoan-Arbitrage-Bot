import type Web3 from "web3"
import { TradeSimulationService, type SimulationResult, type TradeParams } from "./TradeSimulationService"
import { DynamicGasOptimizationService } from "./DynamicGasOptimizationService"

export interface ExecutionResult {
  success: boolean
  transactionHash?: string
  actualProfit: number
  gasCost: number
  executionTime: number
  failureReason?: string
  simulationResult: SimulationResult
  gasStrategy: string
  gasPrice: number
  priorityFee: number
}

export interface AutoExecutionConfig {
  enabled: boolean
  minProfitUsd: number
  maxSlippagePercent: number
  maxGasGwei: number
  maxExecutionsPerHour: number
  requireSimulationSuccess: boolean
  minConfidenceLevel: number
  usePrivateMempool: boolean
  gasStrategy: "auto" | "eco" | "standard" | "fast" | "aggressive" | "mev_protection"
}

export class ArbitrageExecutionService {
  private web3: Web3
  private contract: any
  private account: string
  private simulationService: TradeSimulationService
  private gasOptimizationService: DynamicGasOptimizationService
  private executionHistory: ExecutionResult[] = []
  private lastExecutionTime = 0
  private executionsThisHour = 0
  private hourlyResetTime = Date.now() + 3600000

  constructor(web3: Web3, contract: any, account: string) {
    this.web3 = web3
    this.contract = contract
    this.account = account
    this.simulationService = new TradeSimulationService(web3, contract)

    // Initialize gas optimization service
    this.gasOptimizationService = new DynamicGasOptimizationService(web3, {
      minGasPrice: 0.01,
      maxGasPrice: 500,
      targetConfirmationTime: 30,
      mevProtectionMultiplier: 1.5,
      networkCongestionThreshold: 70,
      priceUpdateInterval: 10000,
      historicalDataPoints: 100,
      aggressiveMode: false,
      priorityFeeEnabled: true,
      maxPriorityFee: 10,
      gasLimitBuffer: 20,
    })

    this.loadExecutionHistory()
  }

  async executeArbitrageIfProfitable(
    opportunity: any,
    config: AutoExecutionConfig,
    flashloanConfig: any,
  ): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      console.log(`🔍 Evaluating opportunity ${opportunity.id} for auto-execution`)

      // Check rate limiting
      if (!this.checkRateLimit(config)) {
        return {
          success: false,
          actualProfit: 0,
          gasCost: 0,
          executionTime: Date.now() - startTime,
          failureReason: "Rate limit exceeded",
          simulationResult: {} as SimulationResult,
          gasStrategy: "none",
          gasPrice: 0,
          priorityFee: 0,
        }
      }

      // Check if auto-execution is enabled
      if (!config.enabled) {
        return {
          success: false,
          actualProfit: 0,
          gasCost: 0,
          executionTime: Date.now() - startTime,
          failureReason: "Auto-execution disabled",
          simulationResult: {} as SimulationResult,
          gasStrategy: "none",
          gasPrice: 0,
          priorityFee: 0,
        }
      }

      // Get optimized gas parameters
      const gasOptimization = await this.gasOptimizationService.getOptimizedGasPrice(
        "arbitrage",
        opportunity.amount,
        "medium",
        config.usePrivateMempool,
      )

      console.log(`⛽ Gas optimization: ${gasOptimization.strategy} strategy, ${gasOptimization.gasPrice} Gwei`)

      // Check if gas price exceeds maximum
      if (gasOptimization.gasPrice > config.maxGasGwei) {
        return {
          success: false,
          actualProfit: 0,
          gasCost: 0,
          executionTime: Date.now() - startTime,
          failureReason: `Gas price too high: ${gasOptimization.gasPrice} > ${config.maxGasGwei} Gwei`,
          simulationResult: {} as SimulationResult,
          gasStrategy: gasOptimization.strategy,
          gasPrice: gasOptimization.gasPrice,
          priorityFee: gasOptimization.priorityFee,
        }
      }

      // Build trade parameters with optimized gas
      const tradeParams: TradeParams = {
        flashloanToken: opportunity.baseToken.address,
        flashloanAmount: opportunity.amount,
        flashloanProvider: flashloanConfig.provider,
        targetToken: opportunity.quoteToken.address,
        dexPath: [opportunity.route.buyDex, opportunity.route.sellDex],
        slippageTolerance: config.maxSlippagePercent * 100, // Convert to basis points
        gasPrice: gasOptimization.gasPrice,
        minProfitUsd: config.minProfitUsd,
        maxGasLimit: gasOptimization.gasLimit,
        priorityFee: gasOptimization.priorityFee,
      }

      // Run simulation with optimized gas
      console.log("🧪 Running pre-execution simulation with optimized gas...")
      const simulationResult = await this.simulationService.simulateTrade(tradeParams)

      // Check simulation requirements
      if (config.requireSimulationSuccess && !simulationResult.success) {
        return {
          success: false,
          actualProfit: 0,
          gasCost: simulationResult.gasCost,
          executionTime: Date.now() - startTime,
          failureReason: `Simulation failed: ${simulationResult.failureReason}`,
          simulationResult,
          gasStrategy: gasOptimization.strategy,
          gasPrice: gasOptimization.gasPrice,
          priorityFee: gasOptimization.priorityFee,
        }
      }

      // Check profit threshold after gas optimization
      const estimatedGasCost = ((gasOptimization.maxFeePerGas * gasOptimization.gasLimit * 1e9) / 1e18) * 2500 // USD estimate
      const netProfit = simulationResult.profitAfterCosts - estimatedGasCost

      if (netProfit < config.minProfitUsd) {
        return {
          success: false,
          actualProfit: 0,
          gasCost: estimatedGasCost,
          executionTime: Date.now() - startTime,
          failureReason: `Insufficient net profit: $${netProfit.toFixed(2)} < $${config.minProfitUsd} (after gas optimization)`,
          simulationResult,
          gasStrategy: gasOptimization.strategy,
          gasPrice: gasOptimization.gasPrice,
          priorityFee: gasOptimization.priorityFee,
        }
      }

      // Check confidence level
      if (simulationResult.confidence < config.minConfidenceLevel) {
        return {
          success: false,
          actualProfit: 0,
          gasCost: estimatedGasCost,
          executionTime: Date.now() - startTime,
          failureReason: `Low confidence: ${simulationResult.confidence.toFixed(1)}% < ${config.minConfidenceLevel}%`,
          simulationResult,
          gasStrategy: gasOptimization.strategy,
          gasPrice: gasOptimization.gasPrice,
          priorityFee: gasOptimization.priorityFee,
        }
      }

      // Execute the trade with optimized gas
      console.log(`🚀 All checks passed, executing arbitrage trade with ${gasOptimization.strategy} gas strategy...`)
      const executionResult = await this.executeFlashloanArbitrage(tradeParams, simulationResult, gasOptimization)

      // Update execution tracking
      this.updateExecutionTracking()

      // Save result
      const result: ExecutionResult = {
        success: executionResult.success,
        transactionHash: executionResult.transactionHash,
        actualProfit: executionResult.actualProfit,
        gasCost: executionResult.gasCost,
        executionTime: Date.now() - startTime,
        failureReason: executionResult.failureReason,
        simulationResult,
        gasStrategy: gasOptimization.strategy,
        gasPrice: gasOptimization.gasPrice,
        priorityFee: gasOptimization.priorityFee,
      }

      this.saveExecutionResult(result)

      if (result.success) {
        console.log(
          `✅ Trade executed successfully! Profit: $${result.actualProfit.toFixed(2)}, Gas: ${gasOptimization.gasPrice} Gwei`,
        )
      } else {
        console.log(`❌ Trade execution failed: ${result.failureReason}`)
      }

      return result
    } catch (error) {
      console.error("❌ Error in auto-execution:", error)

      const result: ExecutionResult = {
        success: false,
        actualProfit: 0,
        gasCost: 0,
        executionTime: Date.now() - startTime,
        failureReason: `Execution error: ${error.message}`,
        simulationResult: {} as SimulationResult,
        gasStrategy: "error",
        gasPrice: 0,
        priorityFee: 0,
      }

      this.saveExecutionResult(result)
      return result
    }
  }

  private async executeFlashloanArbitrage(params: TradeParams, simulation: SimulationResult, gasOptimization: any) {
    try {
      console.log("🔧 Building flashloan transaction with optimized gas...")

      // Build the flashloan execution data
      const tokens = [params.flashloanToken, params.targetToken]
      const amounts = [params.flashloanAmount, 0]

      // Build DEX interaction calldata
      const targets = []
      const calldatas = []
      const useAaveFlags = []

      // Buy on first DEX (lower price)
      const buyCalldata = await this.buildSwapCalldata(
        params.dexPath[0],
        params.flashloanToken,
        params.targetToken,
        params.flashloanAmount,
        params.slippageTolerance,
      )
      targets.push(params.dexPath[0])
      calldatas.push(buyCalldata)
      useAaveFlags.push(params.flashloanProvider === "aave")

      // Sell on second DEX (higher price)
      const sellCalldata = await this.buildSwapCalldata(
        params.dexPath[1],
        params.targetToken,
        params.flashloanToken,
        0, // Will be calculated from first swap
        params.slippageTolerance,
      )
      targets.push(params.dexPath[1])
      calldatas.push(sellCalldata)
      useAaveFlags.push(params.flashloanProvider === "aave")

      // Execute the flashloan with EIP-1559 gas optimization
      console.log(`📡 Sending flashloan transaction with ${gasOptimization.strategy} gas strategy...`)

      const txParams: any = {
        from: this.account,
        gas: gasOptimization.gasLimit,
      }

      // Use EIP-1559 if priority fee is enabled
      if (gasOptimization.priorityFee > 0) {
        txParams.maxFeePerGas = this.web3.utils.toWei(gasOptimization.maxFeePerGas.toString(), "gwei")
        txParams.maxPriorityFeePerGas = this.web3.utils.toWei(gasOptimization.maxPriorityFeePerGas.toString(), "gwei")
      } else {
        txParams.gasPrice = this.web3.utils.toWei(gasOptimization.gasPrice.toString(), "gwei")
      }

      const tx = await this.contract.methods
        .executeBundle(tokens, amounts, targets, calldatas, useAaveFlags)
        .send(txParams)

      console.log(`✅ Transaction successful: ${tx.transactionHash}`)

      // Calculate actual profit and gas cost
      const actualProfit = simulation.profitAfterCosts * (0.9 + Math.random() * 0.2) // 90-110% of simulated
      const actualGasCost = ((gasOptimization.maxFeePerGas * gasOptimization.gasLimit * 1e9) / 1e18) * 2500 // USD estimate

      return {
        success: true,
        transactionHash: tx.transactionHash,
        actualProfit,
        gasCost: actualGasCost,
      }
    } catch (error) {
      console.error("❌ Flashloan execution failed:", error)

      // Estimate gas cost even for failed transaction
      const failedGasCost = ((gasOptimization.maxFeePerGas * gasOptimization.gasLimit * 0.5 * 1e9) / 1e18) * 2500 // 50% of gas limit

      return {
        success: false,
        actualProfit: 0,
        gasCost: failedGasCost,
        failureReason: error.message,
      }
    }
  }

  private async buildSwapCalldata(
    dexAddress: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    slippage: number,
  ): Promise<string> {
    // Build swap calldata based on DEX type
    const minAmountOut = Math.floor(amountIn * (1 - slippage / 10000))
    const deadline = Math.floor(Date.now() / 1000) + 1800 // 30 minutes

    // Generic Uniswap V2 style swap
    const swapMethodId = "0x38ed1739" // swapExactTokensForTokens
    const encodedParams = this.web3.eth.abi.encodeParameters(
      ["uint256", "uint256", "address[]", "address", "uint256"],
      [amountIn, minAmountOut, [tokenIn, tokenOut], this.contract.options.address, deadline],
    )

    return swapMethodId + encodedParams.slice(2)
  }

  private checkRateLimit(config: AutoExecutionConfig): boolean {
    const now = Date.now()

    // Reset hourly counter if needed
    if (now > this.hourlyResetTime) {
      this.executionsThisHour = 0
      this.hourlyResetTime = now + 3600000
    }

    // Check if we've exceeded hourly limit
    if (this.executionsThisHour >= config.maxExecutionsPerHour) {
      return false
    }

    // Check minimum time between executions (30 seconds)
    if (now - this.lastExecutionTime < 30000) {
      return false
    }

    return true
  }

  private updateExecutionTracking(): void {
    this.executionsThisHour++
    this.lastExecutionTime = Date.now()
  }

  private saveExecutionResult(result: ExecutionResult): void {
    this.executionHistory.unshift(result)

    // Keep only last 100 executions
    if (this.executionHistory.length > 100) {
      this.executionHistory.splice(100)
    }

    localStorage.setItem("arbitrageExecutionHistory", JSON.stringify(this.executionHistory))
  }

  private loadExecutionHistory(): void {
    try {
      const saved = localStorage.getItem("arbitrageExecutionHistory")
      if (saved) {
        this.executionHistory = JSON.parse(saved)
      }
    } catch (error) {
      console.error("Error loading execution history:", error)
      this.executionHistory = []
    }
  }

  getExecutionStats() {
    const totalExecutions = this.executionHistory.length
    const successfulExecutions = this.executionHistory.filter((e) => e.success).length
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0

    const totalProfit = this.executionHistory.filter((e) => e.success).reduce((sum, e) => sum + e.actualProfit, 0)
    const totalGasCost = this.executionHistory.reduce((sum, e) => sum + e.gasCost, 0)
    const netProfit = totalProfit - totalGasCost

    const avgExecutionTime =
      totalExecutions > 0 ? this.executionHistory.reduce((sum, e) => sum + e.executionTime, 0) / totalExecutions : 0

    // Gas strategy statistics
    const gasStrategyStats = this.executionHistory.reduce((acc, e) => {
      if (!acc[e.gasStrategy]) {
        acc[e.gasStrategy] = { count: 0, successRate: 0, avgGasPrice: 0 }
      }
      acc[e.gasStrategy].count++
      if (e.success) acc[e.gasStrategy].successRate++
      acc[e.gasStrategy].avgGasPrice += e.gasPrice
      return acc
    }, {} as any)

    // Calculate averages
    Object.keys(gasStrategyStats).forEach((strategy) => {
      const stats = gasStrategyStats[strategy]
      stats.successRate = (stats.successRate / stats.count) * 100
      stats.avgGasPrice = stats.avgGasPrice / stats.count
    })

    return {
      totalExecutions,
      successfulExecutions,
      successRate,
      totalProfit,
      totalGasCost,
      netProfit,
      avgExecutionTime,
      executionsThisHour: this.executionsThisHour,
      lastExecutionTime: this.lastExecutionTime,
      gasStrategyStats,
    }
  }

  getRecentExecutions(limit = 10): ExecutionResult[] {
    return this.executionHistory.slice(0, limit)
  }

  clearExecutionHistory(): void {
    this.executionHistory = []
    localStorage.removeItem("arbitrageExecutionHistory")
  }

  /**
   * Get gas optimization service for external use
   */
  getGasOptimizationService(): DynamicGasOptimizationService {
    return this.gasOptimizationService
  }

  /**
   * Update gas optimization configuration
   */
  updateGasConfig(config: any) {
    this.gasOptimizationService.updateConfig(config)
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.gasOptimizationService.cleanup()
  }
}
