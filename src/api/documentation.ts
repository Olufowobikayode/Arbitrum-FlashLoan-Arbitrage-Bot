/**
 * Arbitrage Bot API Documentation
 *
 * This file contains comprehensive API documentation for the Arbitrage Bot system.
 * All endpoints, types, and examples are documented here.
 */

export interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  path: string
  description: string
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Response[]
  examples: Example[]
  authentication?: AuthenticationMethod
  rateLimit?: RateLimit
}

export interface Parameter {
  name: string
  type: "string" | "number" | "boolean" | "array" | "object"
  required: boolean
  description: string
  example?: any
  validation?: ValidationRule[]
}

export interface RequestBody {
  contentType: string
  schema: any
  example: any
  description: string
}

export interface Response {
  statusCode: number
  description: string
  schema?: any
  example?: any
}

export interface Example {
  title: string
  description: string
  request: any
  response: any
}

export interface AuthenticationMethod {
  type: "bearer" | "api_key" | "oauth2"
  description: string
  location?: "header" | "query" | "body"
}

export interface RateLimit {
  requests: number
  window: string
  description: string
}

export interface ValidationRule {
  type: "min" | "max" | "pattern" | "enum"
  value: any
  message: string
}

/**
 * Complete API Documentation
 */
export const API_DOCUMENTATION: { [category: string]: APIEndpoint[] } = {
  // Bot Management Endpoints
  bot: [
    {
      method: "GET",
      path: "/api/bot/status",
      description: "Get current bot status and configuration",
      responses: [
        {
          statusCode: 200,
          description: "Bot status retrieved successfully",
          schema: {
            type: "object",
            properties: {
              running: { type: "boolean" },
              status: { type: "string" },
              autoTrade: { type: "boolean" },
              totalProfit: { type: "number" },
              startTime: { type: "number" },
              consecutiveFailures: { type: "number" },
              securityStatus: { type: "string" },
              flashloanToken: { type: "string" },
              flashloanAmount: { type: "number" },
              flashloanProvider: { type: "string" },
            },
          },
          example: {
            running: true,
            status: "🟢 Operational - Auto-trading enabled",
            autoTrade: true,
            totalProfit: 1247.85,
            startTime: 1703123456789,
            consecutiveFailures: 0,
            securityStatus: "🟢 Normal - All systems secure",
            flashloanToken: "USDC",
            flashloanAmount: 250000,
            flashloanProvider: "aave",
          },
        },
      ],
      examples: [
        {
          title: "Get Bot Status",
          description: "Retrieve current bot operational status",
          request: {
            method: "GET",
            url: "/api/bot/status",
            headers: {
              Authorization: "Bearer your-api-key",
            },
          },
          response: {
            status: 200,
            data: {
              running: true,
              status: "🟢 Operational - Auto-trading enabled",
              totalProfit: 1247.85,
            },
          },
        },
      ],
      authentication: {
        type: "bearer",
        description: "Requires valid API key in Authorization header",
      },
      rateLimit: {
        requests: 100,
        window: "1m",
        description: "100 requests per minute",
      },
    },
    {
      method: "POST",
      path: "/api/bot/start",
      description: "Start the arbitrage bot",
      requestBody: {
        contentType: "application/json",
        schema: {
          type: "object",
          properties: {
            autoTrade: { type: "boolean", default: true },
            flashloanToken: { type: "string", default: "USDC" },
            flashloanAmount: { type: "number", minimum: 50000, maximum: 3000000 },
            flashloanProvider: { type: "string", enum: ["aave", "balancer", "dydx"] },
            minProfitThreshold: { type: "number", minimum: 10 },
            maxSlippagePercent: { type: "number", minimum: 0.1, maximum: 5 },
          },
        },
        example: {
          autoTrade: true,
          flashloanToken: "USDC",
          flashloanAmount: 250000,
          flashloanProvider: "aave",
          minProfitThreshold: 50,
          maxSlippagePercent: 1.5,
        },
        description: "Configuration for starting the bot",
      },
      responses: [
        {
          statusCode: 200,
          description: "Bot started successfully",
          example: {
            success: true,
            message: "Bot started successfully",
            startTime: 1703123456789,
          },
        },
        {
          statusCode: 400,
          description: "Invalid configuration",
          example: {
            success: false,
            error: "Invalid flashloan amount. Must be between 50,000 and 3,000,000",
          },
        },
      ],
      examples: [
        {
          title: "Start Bot with Custom Config",
          description: "Start the bot with specific configuration",
          request: {
            method: "POST",
            url: "/api/bot/start",
            headers: {
              Authorization: "Bearer your-api-key",
              "Content-Type": "application/json",
            },
            body: {
              autoTrade: true,
              flashloanAmount: 500000,
              minProfitThreshold: 100,
            },
          },
          response: {
            status: 200,
            data: {
              success: true,
              message: "Bot started successfully",
            },
          },
        },
      ],
      authentication: {
        type: "bearer",
        description: "Requires valid API key",
      },
      rateLimit: {
        requests: 10,
        window: "1m",
        description: "10 requests per minute",
      },
    },
    {
      method: "POST",
      path: "/api/bot/stop",
      description: "Stop the arbitrage bot",
      responses: [
        {
          statusCode: 200,
          description: "Bot stopped successfully",
          example: {
            success: true,
            message: "Bot stopped successfully",
            stopTime: 1703123456789,
            sessionStats: {
              totalProfit: 1247.85,
              successfulTrades: 45,
              failedTrades: 3,
              uptime: 7200000,
            },
          },
        },
      ],
      examples: [
        {
          title: "Stop Bot",
          description: "Stop the running bot and get session statistics",
          request: {
            method: "POST",
            url: "/api/bot/stop",
          },
          response: {
            status: 200,
            data: {
              success: true,
              sessionStats: {
                totalProfit: 1247.85,
                successfulTrades: 45,
              },
            },
          },
        },
      ],
      authentication: {
        type: "bearer",
        description: "Requires valid API key",
      },
      rateLimit: {
        requests: 10,
        window: "1m",
        description: "10 requests per minute",
      },
    },
  ],

  // Opportunities Endpoints
  opportunities: [
    {
      method: "GET",
      path: "/api/opportunities",
      description: "Get current arbitrage opportunities",
      parameters: [
        {
          name: "limit",
          type: "number",
          required: false,
          description: "Maximum number of opportunities to return",
          example: 10,
          validation: [
            { type: "min", value: 1, message: "Limit must be at least 1" },
            { type: "max", value: 100, message: "Limit cannot exceed 100" },
          ],
        },
        {
          name: "minProfit",
          type: "number",
          required: false,
          description: "Minimum profit threshold in USD",
          example: 50,
        },
        {
          name: "token",
          type: "string",
          required: false,
          description: "Filter by specific token symbol",
          example: "USDC",
        },
      ],
      responses: [
        {
          statusCode: 200,
          description: "Opportunities retrieved successfully",
          schema: {
            type: "object",
            properties: {
              opportunities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    baseToken: { type: "object" },
                    quoteToken: { type: "object" },
                    estimatedProfit: { type: "number" },
                    liquidity: { type: "object" },
                    route: { type: "object" },
                    riskLevel: { type: "string" },
                    timestamp: { type: "number" },
                  },
                },
              },
              total: { type: "number" },
              lastScan: { type: "number" },
            },
          },
          example: {
            opportunities: [
              {
                id: "arb_1703123456789_abc123",
                baseToken: {
                  symbol: "USDC",
                  address: "0xA0b86a33E6441b8435b662303c0f6a4D2F23E6e1",
                },
                quoteToken: {
                  symbol: "WETH",
                  address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
                },
                estimatedProfit: 127.45,
                liquidity: {
                  usd: 2500000,
                },
                route: {
                  buyDex: "Uniswap V3",
                  sellDex: "SushiSwap",
                  priceSpread: 0.025,
                },
                riskLevel: "LOW",
                timestamp: 1703123456789,
              },
            ],
            total: 1,
            lastScan: 1703123456789,
          },
        },
      ],
      examples: [
        {
          title: "Get Top Opportunities",
          description: "Retrieve the most profitable arbitrage opportunities",
          request: {
            method: "GET",
            url: "/api/opportunities?limit=5&minProfit=100",
          },
          response: {
            status: 200,
            data: {
              opportunities: [
                {
                  id: "arb_1703123456789_abc123",
                  estimatedProfit: 127.45,
                  riskLevel: "LOW",
                },
              ],
              total: 1,
            },
          },
        },
      ],
      authentication: {
        type: "bearer",
        description: "Requires valid API key",
      },
      rateLimit: {
        requests: 60,
        window: "1m",
        description: "60 requests per minute",
      },
    },
    {
      method: "POST",
      path: "/api/opportunities/scan",
      description: "Trigger a manual opportunity scan",
      requestBody: {
        contentType: "application/json",
        schema: {
          type: "object",
          properties: {
            tokens: {
              type: "array",
              items: { type: "string" },
              description: "Specific tokens to scan for",
            },
            minLiquidity: {
              type: "number",
              description: "Minimum liquidity threshold",
            },
            maxSlippage: {
              type: "number",
              description: "Maximum acceptable slippage",
            },
          },
        },
        example: {
          tokens: ["USDC", "WETH", "USDT"],
          minLiquidity: 250000,
          maxSlippage: 1.5,
        },
        description: "Scan configuration parameters",
      },
      responses: [
        {
          statusCode: 200,
          description: "Scan completed successfully",
          example: {
            success: true,
            scanId: "scan_1703123456789",
            opportunitiesFound: 12,
            scanDuration: 2340,
            timestamp: 1703123456789,
          },
        },
      ],
      examples: [
        {
          title: "Manual Scan",
          description: "Trigger a manual scan for specific tokens",
          request: {
            method: "POST",
            url: "/api/opportunities/scan",
            body: {
              tokens: ["USDC", "WETH"],
              minLiquidity: 500000,
            },
          },
          response: {
            status: 200,
            data: {
              success: true,
              opportunitiesFound: 12,
            },
          },
        },
      ],
      authentication: {
        type: "bearer",
        description: "Requires valid API key",
      },
      rateLimit: {
        requests: 20,
        window: "1m",
        description: "20 requests per minute",
      },
    },
  ],

  // Trading Endpoints
  trading: [
    {
      method: "POST",
      path: "/api/trading/execute",
      description: "Execute a specific arbitrage opportunity",
      requestBody: {
        contentType: "application/json",
        schema: {
          type: "object",
          required: ["opportunityId"],
          properties: {
            opportunityId: { type: "string" },
            gasPrice: { type: "number" },
            slippageTolerance: { type: "number" },
            simulate: { type: "boolean", default: false },
          },
        },
        example: {
          opportunityId: "arb_1703123456789_abc123",
          gasPrice: 0.15,
          slippageTolerance: 1.5,
          simulate: false,
        },
        description: "Trade execution parameters",
      },
      responses: [
        {
          statusCode: 200,
          description: "Trade executed successfully",
          example: {
            success: true,
            transactionHash: "0x1234567890abcdef...",
            actualProfit: 125.3,
            gasCost: 2.15,
            executionTime: 15000,
            timestamp: 1703123456789,
          },
        },
        {
          statusCode: 400,
          description: "Trade execution failed",
          example: {
            success: false,
            error: "Insufficient liquidity",
            reason: "Market conditions changed",
          },
        },
      ],
      examples: [
        {
          title: "Execute Trade",
          description: "Execute a profitable arbitrage opportunity",
          request: {
            method: "POST",
            url: "/api/trading/execute",
            body: {
              opportunityId: "arb_1703123456789_abc123",
              gasPrice: 0.15,
            },
          },
          response: {
            status: 200,
            data: {
              success: true,
              actualProfit: 125.3,
              transactionHash: "0x1234567890abcdef...",
            },
          },
        },
      ],
      authentication: {
        type: "bearer",
        description: "Requires valid API key",
      },
      rateLimit: {
        requests: 30,
        window: "1m",
        description: "30 requests per minute",
      },
    },
    {
      method: "GET",
      path: "/api/trading/history",
      description: "Get trading history and statistics",
      parameters: [
        {
          name: "limit",
          type: "number",
          required: false,
          description: "Number of trades to return",
          example: 50,
        },
        {
          name: "from",
          type: "number",
          required: false,
          description: "Start timestamp for filtering",
          example: 1703000000000,
        },
        {
          name: "to",
          type: "number",
          required: false,
          description: "End timestamp for filtering",
          example: 1703123456789,
        },
        {
          name: "status",
          type: "string",
          required: false,
          description: "Filter by trade status",
          example: "success",
          validation: [{ type: "enum", value: ["success", "failed", "pending"], message: "Invalid status" }],
        },
      ],
      responses: [
        {
          statusCode: 200,
          description: "Trading history retrieved successfully",
          example: {
            trades: [
              {
                id: "trade_1703123456789",
                opportunityId: "arb_1703123456789_abc123",
                status: "success",
                profit: 125.3,
                gasCost: 2.15,
                transactionHash: "0x1234567890abcdef...",
                timestamp: 1703123456789,
              },
            ],
            statistics: {
              totalTrades: 48,
              successfulTrades: 45,
              failedTrades: 3,
              totalProfit: 1247.85,
              averageProfit: 27.73,
              successRate: 93.75,
            },
            pagination: {
              total: 48,
              page: 1,
              limit: 50,
            },
          },
        },
      ],
      examples: [
        {
          title: "Get Recent Trades",
          description: "Retrieve recent trading history",
          request: {
            method: "GET",
            url: "/api/trading/history?limit=10&status=success",
          },
          response: {
            status: 200,
            data: {
              trades: [
                {
                  id: "trade_1703123456789",
                  profit: 125.3,
                  status: "success",
                },
              ],
              statistics: {
                totalProfit: 1247.85,
                successRate: 93.75,
              },
            },
          },
        },
      ],
      authentication: {
        type: "bearer",
        description: "Requires valid API key",
      },
      rateLimit: {
        requests: 100,
        window: "1m",
        description: "100 requests per minute",
      },
    },
  ],

  // Analytics Endpoints
  analytics: [
    {
      method: "GET",
      path: "/api/analytics/performance",
      description: "Get detailed performance analytics",
      parameters: [
        {
          name: "timeframe",
          type: "string",
          required: false,
          description: "Time period for analytics",
          example: "24h",
          validation: [{ type: "enum", value: ["1h", "24h", "7d", "30d"], message: "Invalid timeframe" }],
        },
        {
          name: "metrics",
          type: "array",
          required: false,
          description: "Specific metrics to include",
          example: ["profit", "trades", "gas"],
        },
      ],
      responses: [
        {
          statusCode: 200,
          description: "Performance analytics retrieved successfully",
          example: {
            timeframe: "24h",
            metrics: {
              totalProfit: 1247.85,
              totalTrades: 48,
              successRate: 93.75,
              averageProfit: 27.73,
              totalGasCost: 45.6,
              profitPerHour: 51.99,
              bestTrade: {
                profit: 245.8,
                timestamp: 1703120000000,
              },
              worstTrade: {
                loss: -15.3,
                timestamp: 1703115000000,
              },
            },
            charts: {
              profitOverTime: [
                { timestamp: 1703080000000, profit: 125.3 },
                { timestamp: 1703083600000, profit: 89.45 },
              ],
              tradesPerHour: [
                { hour: 0, trades: 2 },
                { hour: 1, trades: 3 },
              ],
            },
          },
        },
      ],
      examples: [
        {
          title: "Get 24h Performance",
          description: "Retrieve performance metrics for the last 24 hours",
          request: {
            method: "GET",
            url: "/api/analytics/performance?timeframe=24h",
          },
          response: {
            status: 200,
            data: {
              metrics: {
                totalProfit: 1247.85,
                successRate: 93.75,
              },
            },
          },
        },
      ],
      authentication: {
        type: "bearer",
        description: "Requires valid API key",
      },
      rateLimit: {
        requests: 60,
        window: "1m",
        description: "60 requests per minute",
      },
    },
  ],

  // WebSocket Endpoints
  websocket: [
    {
      method: "GET",
      path: "/ws",
      description: "WebSocket connection for real-time updates",
      parameters: [
        {
          name: "token",
          type: "string",
          required: true,
          description: "Authentication token for WebSocket connection",
          example: "your-api-key",
        },
      ],
      responses: [
        {
          statusCode: 101,
          description: "WebSocket connection established",
          example: {
            type: "connection",
            status: "connected",
            timestamp: 1703123456789,
          },
        },
      ],
      examples: [
        {
          title: "WebSocket Connection",
          description: "Establish real-time WebSocket connection",
          request: {
            method: "GET",
            url: "/ws",
            headers: {
              Authorization: "Bearer your-api-key",
            },
          },
          response: {
            status: 101,
            data: {
              type: "connection",
              status: "connected",
            },
          },
        },
      ],
      authentication: {
        type: "bearer",
        description: "Requires valid API key",
      },
      rateLimit: {
        requests: 10,
        window: "1m",
        description: "10 requests per minute",
      },
    },
  ],
}
