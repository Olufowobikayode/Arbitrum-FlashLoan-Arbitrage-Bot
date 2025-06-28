import Web3 from "web3"

export interface ChainConfig {
  chainId: number
  name: string
  symbol: string
  rpcUrl: string
  explorerUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  dexes: DEXConfig[]
  flashloanProviders: FlashloanProviderConfig[]
  gasSettings: {
    gasPrice: number
    gasLimit: number
    maxFeePerGas?: number
    maxPriorityFeePerGas?: number
  }
  bridgeContracts: BridgeConfig[]
  isActive: boolean
  blockTime: number
  confirmations: number
}

export interface DEXConfig {
  name: string
  address: string
  type: "uniswap_v2" | "uniswap_v3" | "curve" | "balancer" | "sushiswap"
  fee: number
  isActive: boolean
  routerAddress: string
  factoryAddress: string
}

export interface FlashloanProviderConfig {
  name: string
  address: string
  fee: number
  maxAmount: number
  supportedTokens: string[]
  isActive: boolean
}

export interface BridgeConfig {
  name: string
  address: string
  supportedChains: number[]
  fee: number
  minAmount: number
  maxAmount: number
}

export interface CrossChainOpportunity {
  id: string
  sourceChain: number
  targetChain: number
  sourceToken: string
  targetToken: string
  sourceDEX: string
  targetDEX: string
  sourcePrice: number
  targetPrice: number
  priceSpread: number
  estimatedProfit: number
  bridgeFee: number
  gasEstimate: number
  timeEstimate: number
  riskLevel: number
  confidence: number
  bridgeProtocol: string
  timestamp: number
}

export class MultiChainService {
  private chains: Map<number, ChainConfig> = new Map()
  private web3Instances: Map<number, Web3> = new Map()
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private crossChainOpportunities: CrossChainOpportunity[] = []

  constructor() {
    this.initializeChains()
  }

  /**
   * Initialize supported blockchain networks
   */
  private initializeChains() {
    const chainConfigs: ChainConfig[] = [
      {
        chainId: 1,
        name: "Ethereum",
        symbol: "ETH",
        rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC || "https://eth.llamarpc.com",
        explorerUrl: "https://etherscan.io",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        dexes: [
          {
            name: "Uniswap V3",
            address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
            type: "uniswap_v3",
            fee: 30,
            isActive: true,
            routerAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
            factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
          },
          {
            name: "Uniswap V2",
            address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
            type: "uniswap_v2",
            fee: 30,
            isActive: true,
            routerAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
            factoryAddress: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
          },
        ],
        flashloanProviders: [
          {
            name: "Aave V3",
            address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
            fee: 5,
            maxAmount: 100000000,
            supportedTokens: ["USDC", "USDT", "DAI", "WETH"],
            isActive: true,
          },
        ],
        gasSettings: {
          gasPrice: 20000000000,
          gasLimit: 500000,
          maxFeePerGas: 30000000000,
          maxPriorityFeePerGas: 2000000000,
        },
        bridgeContracts: [],
        isActive: true,
        blockTime: 12,
        confirmations: 12,
      },
      {
        chainId: 42161,
        name: "Arbitrum One",
        symbol: "ETH",
        rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC || "https://arbitrum-one.publicnode.com",
        explorerUrl: "https://arbiscan.io",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        dexes: [
          {
            name: "Uniswap V3",
            address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
            type: "uniswap_v3",
            fee: 30,
            isActive: true,
            routerAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
            factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
          },
          {
            name: "SushiSwap",
            address: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
            type: "sushiswap",
            fee: 30,
            isActive: true,
            routerAddress: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
            factoryAddress: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
          },
        ],
        flashloanProviders: [
          {
            name: "Aave V3",
            address: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
            fee: 5,
            maxAmount: 50000000,
            supportedTokens: ["USDC", "USDT", "DAI", "WETH"],
            isActive: true,
          },
        ],
        gasSettings: {
          gasPrice: 100000000,
          gasLimit: 800000,
        },
        bridgeContracts: [
          {
            name: "Arbitrum Bridge",
            address: "0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a",
            supportedChains: [1],
            fee: 0.1,
            minAmount: 0.01,
            maxAmount: 1000,
          },
        ],
        isActive: true,
        blockTime: 0.25,
        confirmations: 1,
      },
      {
        chainId: 137,
        name: "Polygon",
        symbol: "MATIC",
        rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC || "https://polygon-rpc.com",
        explorerUrl: "https://polygonscan.com",
        nativeCurrency: { name: "Polygon", symbol: "MATIC", decimals: 18 },
        dexes: [
          {
            name: "Uniswap V3",
            address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
            type: "uniswap_v3",
            fee: 30,
            isActive: true,
            routerAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
            factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
          },
          {
            name: "SushiSwap",
            address: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
            type: "sushiswap",
            fee: 30,
            isActive: true,
            routerAddress: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
            factoryAddress: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
          },
        ],
        flashloanProviders: [
          {
            name: "Aave V3",
            address: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
            fee: 5,
            maxAmount: 25000000,
            supportedTokens: ["USDC", "USDT", "DAI", "WETH"],
            isActive: true,
          },
        ],
        gasSettings: {
          gasPrice: 30000000000,
          gasLimit: 500000,
          maxFeePerGas: 40000000000,
          maxPriorityFeePerGas: 30000000000,
        },
        bridgeContracts: [
          {
            name: "Polygon Bridge",
            address: "0xA0c68C638235ee32657e8f720a23ceC1bFc77C77",
            supportedChains: [1],
            fee: 0.05,
            minAmount: 0.01,
            maxAmount: 1000,
          },
        ],
        isActive: true,
        blockTime: 2,
        confirmations: 3,
      },
      {
        chainId: 56,
        name: "BNB Smart Chain",
        symbol: "BNB",
        rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC || "https://bsc-dataseed.binance.org",
        explorerUrl: "https://bscscan.com",
        nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
        dexes: [
          {
            name: "PancakeSwap V3",
            address: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4",
            type: "uniswap_v3",
            fee: 25,
            isActive: true,
            routerAddress: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4",
            factoryAddress: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865",
          },
          {
            name: "PancakeSwap V2",
            address: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
            type: "uniswap_v2",
            fee: 25,
            isActive: true,
            routerAddress: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
            factoryAddress: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
          },
        ],
        flashloanProviders: [
          {
            name: "Venus",
            address: "0xfD36E2c2a6789Db23113685031d7F16329158384",
            fee: 3,
            maxAmount: 20000000,
            supportedTokens: ["USDC", "USDT", "BUSD", "WBNB"],
            isActive: true,
          },
        ],
        gasSettings: {
          gasPrice: 5000000000,
          gasLimit: 500000,
        },
        bridgeContracts: [
          {
            name: "BSC Bridge",
            address: "0x533e3c0e6b48010873B947bddC4721b1bDFF9648",
            supportedChains: [1],
            fee: 0.1,
            minAmount: 0.01,
            maxAmount: 1000,
          },
        ],
        isActive: true,
        blockTime: 3,
        confirmations: 3,
      },
      {
        chainId: 43114,
        name: "Avalanche",
        symbol: "AVAX",
        rpcUrl: process.env.NEXT_PUBLIC_AVALANCHE_RPC || "https://api.avax.network/ext/bc/C/rpc",
        explorerUrl: "https://snowtrace.io",
        nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
        dexes: [
          {
            name: "Trader Joe",
            address: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
            type: "uniswap_v2",
            fee: 30,
            isActive: true,
            routerAddress: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
            factoryAddress: "0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10",
          },
        ],
        flashloanProviders: [
          {
            name: "Aave V3",
            address: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
            fee: 5,
            maxAmount: 15000000,
            supportedTokens: ["USDC", "USDT", "DAI", "WAVAX"],
            isActive: true,
          },
        ],
        gasSettings: {
          gasPrice: 25000000000,
          gasLimit: 500000,
          maxFeePerGas: 30000000000,
          maxPriorityFeePerGas: 2000000000,
        },
        bridgeContracts: [
          {
            name: "Avalanche Bridge",
            address: "0x8EB8a3b98659Cce290402893d0123abb75E3ab28",
            supportedChains: [1],
            fee: 0.1,
            minAmount: 0.01,
            maxAmount: 1000,
          },
        ],
        isActive: true,
        blockTime: 2,
        confirmations: 3,
      },
    ]

    chainConfigs.forEach((config) => {
      this.chains.set(config.chainId, config)
      if (config.isActive) {
        this.initializeWeb3Instance(config)
      }
    })
  }

  /**
   * Initialize Web3 instance for a chain
   */
  private initializeWeb3Instance(config: ChainConfig) {
    try {
      const web3 = new Web3(config.rpcUrl)
      this.web3Instances.set(config.chainId, web3)
      console.log(`✅ Initialized Web3 for ${config.name}`)
    } catch (error) {
      console.error(`❌ Failed to initialize Web3 for ${config.name}:`, error)
    }
  }

  /**
   * Start cross-chain monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.scanCrossChainOpportunities()
    }, 30000) // Scan every 30 seconds

    console.log("🔍 Multi-chain monitoring started")
  }

  /**
   * Stop cross-chain monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log("⏹️ Multi-chain monitoring stopped")
  }

  /**
   * Scan for cross-chain arbitrage opportunities
   */
  private async scanCrossChainOpportunities() {
    const activeChains = Array.from(this.chains.values()).filter((chain) => chain.isActive)

    for (let i = 0; i < activeChains.length; i++) {
      for (let j = i + 1; j < activeChains.length; j++) {
        const sourceChain = activeChains[i]
        const targetChain = activeChains[j]

        await this.findArbitrageOpportunities(sourceChain, targetChain)
        await this.findArbitrageOpportunities(targetChain, sourceChain) // Reverse direction
      }
    }

    // Clean old opportunities
    this.cleanOldOpportunities()
  }

  /**
   * Find arbitrage opportunities between two chains
   */
  private async findArbitrageOpportunities(sourceChain: ChainConfig, targetChain: ChainConfig) {
    try {
      const sourceWeb3 = this.web3Instances.get(sourceChain.chainId)
      const targetWeb3 = this.web3Instances.get(targetChain.chainId)

      if (!sourceWeb3 || !targetWeb3) return

      // Get common tokens between chains
      const commonTokens = this.getCommonTokens(sourceChain, targetChain)

      for (const token of commonTokens) {
        // Get prices on both chains
        const sourcePrice = await this.getTokenPrice(sourceChain, token)
        const targetPrice = await this.getTokenPrice(targetChain, token)

        if (sourcePrice && targetPrice) {
          const priceSpread = Math.abs(targetPrice - sourcePrice) / sourcePrice

          if (priceSpread > 0.02) {
            // 2% minimum spread
            const opportunity = await this.calculateCrossChainOpportunity(
              sourceChain,
              targetChain,
              token,
              sourcePrice,
              targetPrice,
            )

            if (opportunity && opportunity.estimatedProfit > 50) {
              this.crossChainOpportunities.push(opportunity)
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error finding opportunities ${sourceChain.name} -> ${targetChain.name}:`, error)
    }
  }

  /**
   * Calculate cross-chain arbitrage opportunity
   */
  private async calculateCrossChainOpportunity(
    sourceChain: ChainConfig,
    targetChain: ChainConfig,
    token: string,
    sourcePrice: number,
    targetPrice: number,
  ): Promise<CrossChainOpportunity | null> {
    try {
      const bridgeConfig = this.getBestBridge(sourceChain.chainId, targetChain.chainId)
      if (!bridgeConfig) return null

      const amount = Math.min(bridgeConfig.maxAmount * 1000, 100000) // Max $100k
      if (amount < bridgeConfig.minAmount * 1000) return null

      const priceSpread = Math.abs(targetPrice - sourcePrice) / sourcePrice
      const grossProfit = amount * priceSpread
      const bridgeFee = amount * (bridgeConfig.fee / 100)
      const gasEstimate = this.estimateGasCosts(sourceChain, targetChain)
      const timeEstimate = this.estimateExecutionTime(sourceChain, targetChain)

      const netProfit = grossProfit - bridgeFee - gasEstimate
      const riskLevel = this.calculateRiskLevel(sourceChain, targetChain, amount, timeEstimate)
      const confidence = this.calculateConfidence(priceSpread, riskLevel)

      return {
        id: `cross_${Date.now()}_${sourceChain.chainId}_${targetChain.chainId}`,
        sourceChain: sourceChain.chainId,
        targetChain: targetChain.chainId,
        sourceToken: token,
        targetToken: token,
        sourceDEX: sourceChain.dexes[0]?.name || "Unknown",
        targetDEX: targetChain.dexes[0]?.name || "Unknown",
        sourcePrice,
        targetPrice,
        priceSpread: priceSpread * 100,
        estimatedProfit: netProfit,
        bridgeFee,
        gasEstimate,
        timeEstimate,
        riskLevel,
        confidence,
        bridgeProtocol: bridgeConfig.name,
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error("Error calculating cross-chain opportunity:", error)
      return null
    }
  }

  /**
   * Get common tokens between chains
   */
  private getCommonTokens(sourceChain: ChainConfig, targetChain: ChainConfig): string[] {
    // Common tokens across most chains
    return ["USDC", "USDT", "WETH", "DAI"]
  }

  /**
   * Get token price on a specific chain
   */
  private async getTokenPrice(chain: ChainConfig, token: string): Promise<number | null> {
    try {
      // Mock price data - in production, query actual DEX prices
      const basePrices: { [key: string]: number } = {
        USDC: 1.0,
        USDT: 1.0,
        DAI: 1.0,
        WETH: 2500,
      }

      const basePrice = basePrices[token] || 0
      // Add chain-specific variation
      const chainVariation = (Math.random() - 0.5) * 0.05 // ±2.5%

      return basePrice * (1 + chainVariation)
    } catch (error) {
      console.error(`Error getting price for ${token} on ${chain.name}:`, error)
      return null
    }
  }

  /**
   * Get best bridge between chains
   */
  private getBestBridge(sourceChainId: number, targetChainId: number): BridgeConfig | null {
    const sourceChain = this.chains.get(sourceChainId)
    if (!sourceChain) return null

    // Find bridge that supports target chain
    return sourceChain.bridgeContracts.find((bridge) => bridge.supportedChains.includes(targetChainId)) || null
  }

  /**
   * Estimate gas costs for cross-chain transaction
   */
  private estimateGasCosts(sourceChain: ChainConfig, targetChain: ChainConfig): number {
    const sourceGasCost = (sourceChain.gasSettings.gasPrice * sourceChain.gasSettings.gasLimit) / 1e18
    const targetGasCost = (targetChain.gasSettings.gasPrice * targetChain.gasSettings.gasLimit) / 1e18

    // Convert to USD (simplified)
    const ethPrice = 2500
    return (sourceGasCost + targetGasCost) * ethPrice
  }

  /**
   * Estimate execution time
   */
  private estimateExecutionTime(sourceChain: ChainConfig, targetChain: ChainConfig): number {
    const sourceConfirmationTime = sourceChain.blockTime * sourceChain.confirmations
    const targetConfirmationTime = targetChain.blockTime * targetChain.confirmations
    const bridgeTime = 300 // 5 minutes bridge processing

    return sourceConfirmationTime + bridgeTime + targetConfirmationTime
  }

  /**
   * Calculate risk level
   */
  private calculateRiskLevel(
    sourceChain: ChainConfig,
    targetChain: ChainConfig,
    amount: number,
    timeEstimate: number,
  ): number {
    let risk = 20 // Base risk

    // Higher risk for larger amounts
    if (amount > 50000) risk += 20
    if (amount > 100000) risk += 20

    // Higher risk for longer execution times
    if (timeEstimate > 600) risk += 15
    if (timeEstimate > 1800) risk += 15

    // Chain-specific risks
    const chainRisks: { [key: number]: number } = {
      1: 5, // Ethereum - low risk
      42161: 5, // Arbitrum - low risk
      137: 10, // Polygon - medium risk
      56: 15, // BSC - higher risk
      43114: 10, // Avalanche - medium risk
    }

    risk += (chainRisks[sourceChain.chainId] || 20) + (chainRisks[targetChain.chainId] || 20)

    return Math.min(100, risk)
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(priceSpread: number, riskLevel: number): number {
    let confidence = 50

    // Higher spread = higher confidence
    if (priceSpread > 0.05) confidence += 30
    else if (priceSpread > 0.03) confidence += 20
    else if (priceSpread > 0.02) confidence += 10

    // Lower risk = higher confidence
    confidence += Math.max(0, (100 - riskLevel) / 2)

    return Math.min(100, confidence)
  }

  /**
   * Clean old opportunities
   */
  private cleanOldOpportunities() {
    const fiveMinutesAgo = Date.now() - 300000
    this.crossChainOpportunities = this.crossChainOpportunities.filter((opp) => opp.timestamp > fiveMinutesAgo)
  }

  /**
   * Get all supported chains
   */
  getChains(): ChainConfig[] {
    return Array.from(this.chains.values())
  }

  /**
   * Get active chains
   */
  getActiveChains(): ChainConfig[] {
    return Array.from(this.chains.values()).filter((chain) => chain.isActive)
  }

  /**
   * Get chain by ID
   */
  getChain(chainId: number): ChainConfig | null {
    return this.chains.get(chainId) || null
  }

  /**
   * Get Web3 instance for chain
   */
  getWeb3Instance(chainId: number): Web3 | null {
    return this.web3Instances.get(chainId) || null
  }

  /**
   * Get cross-chain opportunities
   */
  getCrossChainOpportunities(): CrossChainOpportunity[] {
    return this.crossChainOpportunities.slice().sort((a, b) => b.estimatedProfit - a.estimatedProfit)
  }

  /**
   * Toggle chain active status
   */
  toggleChain(chainId: number, active: boolean) {
    const chain = this.chains.get(chainId)
    if (chain) {
      chain.isActive = active
      if (active && !this.web3Instances.has(chainId)) {
        this.initializeWeb3Instance(chain)
      }
    }
  }

  /**
   * Update chain configuration
   */
  updateChainConfig(chainId: number, updates: Partial<ChainConfig>) {
    const chain = this.chains.get(chainId)
    if (chain) {
      Object.assign(chain, updates)
      if (updates.rpcUrl) {
        this.initializeWeb3Instance(chain)
      }
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean
    activeChains: number
    totalOpportunities: number
    lastScanTime: number
  } {
    return {
      isMonitoring: this.isMonitoring,
      activeChains: this.getActiveChains().length,
      totalOpportunities: this.crossChainOpportunities.length,
      lastScanTime: Date.now(),
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopMonitoring()
    this.web3Instances.clear()
    this.crossChainOpportunities = []
  }
}
