import { BotService } from "./BotService"
import { ArbitrageExecutionService, type AutoExecutionConfig } from "./ArbitrageExecutionService"
import { TradeSimulationService } from "./TradeSimulationService"

export interface ScannerConfig {
  scanIntervalMs: number
  minLiquidityUsd: number
  maxOpportunities: number
  enableAutoExecution: boolean
  flashloanConfig: {
    token: string
    amount: number
    provider: string
  }
  executionConfig: AutoExecutionConfig
}

export interface ScanResult {
  scanId: string
  timestamp: number
  opportunitiesFound: number
  opportunitiesExecuted: number
  totalProfitGenerated: number
  scanDuration: number
  errors: string[]
}

export class RealTimeArbitrageScanner {
  private botService: BotService
  private executionService: ArbitrageExecutionService | null = null
  private simulationService: TradeSimulationService
  private isScanning = false
  private scanInterval: NodeJS.Timeout | null = null
  private scanHistory: ScanResult[] = []
  private onOpportunityFound?: (opportunity: any) => void
  private onExecutionComplete?: (result: any) => void
  private onScanComplete?: (result: ScanResult) => void

  constructor(web3: any, contract: any, account?: string) {
    this.botService = new BotService()
    this.simulationService = new TradeSimulationService(web3, contract)

    if (web3 && contract && account) {
      this.executionService = new ArbitrageExecutionService(web3, contract, account)
    }
  }

  setEventHandlers(handlers: {
    onOpportunityFound?: (opportunity: any) => void
    onExecutionComplete?: (result: any) => void
    onScanComplete?: (result: ScanResult) => void
  }) {
    this.onOpportunityFound = handlers.onOpportunityFound
    this.onExecutionComplete = handlers.onExecutionComplete
    this.onScanComplete = handlers.onScanComplete
  }

  async startScanning(config: ScannerConfig): Promise<void> {
    if (this.isScanning) {
      console.log("Scanner already running")
      return
    }

    console.log("Starting real-time arbitrage scanner...")
    this.isScanning = true

    // Initial scan
    await this.performScan(config)

    // Set up recurring scans
    this.scanInterval = setInterval(async () => {
      if (this.isScanning) {
        await this.performScan(config)
      }
    }, config.scanIntervalMs)

    console.log(`Scanner started with ${config.scanIntervalMs}ms interval`)
  }

  async stopScanning(): Promise<void> {
    console.log("Stopping arbitrage scanner...")
    this.isScanning = false

    if (this.scanInterval) {
      clearInterval(this.scanInterval)
      this.scanInterval = null
    }

    console.log("Scanner stopped")
  }

  private async performScan(config: ScannerConfig): Promise<ScanResult> {
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()
    const errors: string[] = []
    let opportunitiesExecuted = 0
    let totalProfitGenerated = 0

    try {
      console.log(`Starting scan ${scanId}...`)

      // Fetch opportunities from all Arbitrum DEXes
      const opportunities = await this.botService.fetchOpportunities(
        config.flashloanConfig.token,
        config.minLiquidityUsd,
      )

      console.log(`Found ${opportunities.length} potential opportunities`)

      // Process each opportunity
      for (const opportunity of opportunities.slice(0, config.maxOpportunities)) {
        try {
          // Notify about opportunity found
          if (this.onOpportunityFound) {
            this.onOpportunityFound(opportunity)
          }

          // Validate opportunity is still profitable
          const isValid = await this.botService.validateOpportunity(opportunity)
          if (!isValid) {
            console.log(`Opportunity ${opportunity.id} no longer valid, skipping`)
            continue
          }

          // Run detailed simulation
          const simulationResult = await this.simulationService.simulateTrade({
            flashloanToken: opportunity.baseToken.address,
            flashloanAmount: opportunity.amount,
            flashloanProvider: config.flashloanConfig.provider,
            targetToken: opportunity.quoteToken.address,
            dexPath: [opportunity.route?.buyDex || "", opportunity.route?.sellDex || ""].filter(Boolean),
            slippageTolerance: config.executionConfig.maxSlippagePercent * 100,
            gasPrice: config.executionConfig.maxGasGwei,
            minProfitUsd: config.executionConfig.minProfitUsd,
            maxGasLimit: 3000000,
            priorityFee: 2,
          })

          // Add simulation result to opportunity
          opportunity.simulationResult = simulationResult

          // Auto-execute if enabled and profitable
          if (
            config.enableAutoExecution &&
            this.executionService &&
            simulationResult.success &&
            simulationResult.profitAfterCosts >= config.executionConfig.minProfitUsd
          ) {
            console.log(`Auto-executing opportunity ${opportunity.id}...`)

            const executionResult = await this.executionService.executeArbitrageIfProfitable(
              opportunity,
              config.executionConfig,
              config.flashloanConfig,
            )

            if (executionResult.success) {
              opportunitiesExecuted++
              totalProfitGenerated += executionResult.actualProfit
              console.log(
                `✅ Successfully executed ${opportunity.id} for $${executionResult.actualProfit.toFixed(2)} profit`,
              )
            } else {
              console.log(`❌ Failed to execute ${opportunity.id}: ${executionResult.failureReason}`)
              errors.push(`Execution failed for ${opportunity.id}: ${executionResult.failureReason}`)
            }

            // Notify about execution completion
            if (this.onExecutionComplete) {
              this.onExecutionComplete({
                opportunity,
                executionResult,
                simulationResult,
              })
            }

            // Add delay between executions to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 5000))
          }
        } catch (error) {
          console.error(`Error processing opportunity ${opportunity.id}:`, error)
          errors.push(`Processing error for ${opportunity.id}: ${error.message}`)
        }
      }

      const scanResult: ScanResult = {
        scanId,
        timestamp: startTime,
        opportunitiesFound: opportunities.length,
        opportunitiesExecuted,
        totalProfitGenerated,
        scanDuration: Date.now() - startTime,
        errors,
      }

      // Save scan result
      this.scanHistory.unshift(scanResult)
      if (this.scanHistory.length > 100) {
        this.scanHistory.splice(100)
      }

      // Notify about scan completion
      if (this.onScanComplete) {
        this.onScanComplete(scanResult)
      }

      console.log(`Scan ${scanId} completed:`, {
        opportunities: opportunities.length,
        executed: opportunitiesExecuted,
        profit: totalProfitGenerated.toFixed(2),
        duration: scanResult.scanDuration,
      })

      return scanResult
    } catch (error) {
      console.error(`Scan ${scanId} failed:`, error)

      const scanResult: ScanResult = {
        scanId,
        timestamp: startTime,
        opportunitiesFound: 0,
        opportunitiesExecuted: 0,
        totalProfitGenerated: 0,
        scanDuration: Date.now() - startTime,
        errors: [`Scan failed: ${error.message}`],
      }

      this.scanHistory.unshift(scanResult)
      return scanResult
    }
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning
  }

  getScanHistory(limit = 20): ScanResult[] {
    return this.scanHistory.slice(0, limit)
  }

  getScanStats() {
    const totalScans = this.scanHistory.length
    const totalOpportunities = this.scanHistory.reduce((sum, scan) => sum + scan.opportunitiesFound, 0)
    const totalExecutions = this.scanHistory.reduce((sum, scan) => sum + scan.opportunitiesExecuted, 0)
    const totalProfit = this.scanHistory.reduce((sum, scan) => sum + scan.totalProfitGenerated, 0)
    const avgScanDuration =
      totalScans > 0 ? this.scanHistory.reduce((sum, scan) => sum + scan.scanDuration, 0) / totalScans : 0

    const successRate = totalOpportunities > 0 ? (totalExecutions / totalOpportunities) * 100 : 0

    return {
      totalScans,
      totalOpportunities,
      totalExecutions,
      totalProfit,
      avgScanDuration,
      successRate,
      avgOpportunitiesPerScan: totalScans > 0 ? totalOpportunities / totalScans : 0,
      avgProfitPerExecution: totalExecutions > 0 ? totalProfit / totalExecutions : 0,
    }
  }

  clearScanHistory(): void {
    this.scanHistory = []
  }

  async performManualScan(config: ScannerConfig): Promise<ScanResult> {
    console.log("Performing manual scan...")
    return await this.performScan(config)
  }

  updateExecutionService(web3: any, contract: any, account: string): void {
    this.executionService = new ArbitrageExecutionService(web3, contract, account)
  }
}
