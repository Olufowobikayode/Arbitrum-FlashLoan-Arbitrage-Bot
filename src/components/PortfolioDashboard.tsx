"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Wallet, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, RefreshCw, Eye, EyeOff } from "lucide-react"
import { useBot } from "@/src/contexts/BotContext"
import { useWeb3 } from "@/src/contexts/Web3Context"

interface TokenBalance {
  symbol: string
  balance: number
  value: number
  change24h: number
  allocation: number
}

interface PortfolioStats {
  totalValue: number
  totalProfit: number
  profitPercent: number
  bestPerformer: string
  worstPerformer: string
}

export default function PortfolioDashboard() {
  const { botState } = useBot()
  const { balance, isConnected } = useWeb3()
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalValue: 0,
    totalProfit: 0,
    profitPercent: 0,
    bestPerformer: "",
    worstPerformer: "",
  })
  const [showBalances, setShowBalances] = useState(true)

  useEffect(() => {
    // Generate mock token balances
    const mockBalances: TokenBalance[] = [
      {
        symbol: "ETH",
        balance: Number.parseFloat(balance),
        value: Number.parseFloat(balance) * 2450,
        change24h: 2.5,
        allocation: 45,
      },
      {
        symbol: "USDC",
        balance: 1250.0,
        value: 1250.0,
        change24h: 0.1,
        allocation: 25,
      },
      {
        symbol: "WBTC",
        balance: 0.05,
        value: 0.05 * 43250,
        change24h: -1.2,
        allocation: 20,
      },
      {
        symbol: "ARB",
        balance: 500.0,
        value: 500.0 * 1.85,
        change24h: 5.8,
        allocation: 10,
      },
    ]

    setTokenBalances(mockBalances)

    // Calculate portfolio stats
    const totalValue = mockBalances.reduce((sum, token) => sum + token.value, 0)
    const stats: PortfolioStats = {
      totalValue,
      totalProfit: botState.totalProfit,
      profitPercent: (botState.totalProfit / totalValue) * 100,
      bestPerformer: mockBalances.reduce((best, token) => (token.change24h > best.change24h ? token : best)).symbol,
      worstPerformer: mockBalances.reduce((worst, token) => (token.change24h < worst.change24h ? token : worst)).symbol,
    }

    setPortfolioStats(stats)
  }, [balance, botState.totalProfit])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Dashboard</h1>
          <p className="text-muted-foreground">Track your assets and trading performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowBalances(!showBalances)}>
            {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showBalances ? formatCurrency(portfolioStats.totalValue) : "••••••"}
            </div>
            <p className="text-xs text-muted-foreground">Across all assets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trading Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {showBalances ? formatCurrency(portfolioStats.totalProfit) : "••••••"}
            </div>
            <p className="text-xs text-muted-foreground">{formatPercent(portfolioStats.profitPercent)} of portfolio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioStats.bestPerformer}</div>
            <p className="text-xs text-green-600">
              {formatPercent(tokenBalances.find((t) => t.symbol === portfolioStats.bestPerformer)?.change24h || 0)} 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worst Performer</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioStats.worstPerformer}</div>
            <p className="text-xs text-red-600">
              {formatPercent(tokenBalances.find((t) => t.symbol === portfolioStats.worstPerformer)?.change24h || 0)} 24h
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="holdings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Holdings Tab */}
        <TabsContent value="holdings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Token Holdings
              </CardTitle>
              <CardDescription>Your current token balances and values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tokenBalances.map((token) => (
                  <div key={token.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-foreground">{token.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {showBalances ? token.balance.toFixed(4) : "••••••"} {token.symbol}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{showBalances ? formatCurrency(token.value) : "••••••"}</div>
                      <div className={`text-sm ${token.change24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatPercent(token.change24h)} 24h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Asset Allocation
                </CardTitle>
                <CardDescription>Distribution of your portfolio by asset</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tokenBalances.map((token) => (
                  <div key={token.symbol} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{token.symbol}</span>
                      <span>{token.allocation}%</span>
                    </div>
                    <Progress value={token.allocation} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Value Distribution
                </CardTitle>
                <CardDescription>Portfolio value by token</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tokenBalances.map((token) => (
                  <div key={token.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm font-medium">{token.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{showBalances ? formatCurrency(token.value) : "••••••"}</div>
                      <div className="text-xs text-muted-foreground">{token.allocation}%</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trading Performance</CardTitle>
                <CardDescription>Performance metrics from arbitrage trading</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Trades</span>
                    <span className="font-medium">{botState.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium">{botState.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Profit</span>
                    <span className="font-medium text-green-600">{formatCurrency(botState.totalProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Gas Spent</span>
                    <span className="font-medium">{botState.gasUsed.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Net Profit</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(botState.totalProfit - botState.gasUsed * 2500)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portfolio Metrics</CardTitle>
                <CardDescription>Overall portfolio performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Portfolio Value</span>
                    <span className="font-medium">
                      {showBalances ? formatCurrency(portfolioStats.totalValue) : "••••••"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Trading ROI</span>
                    <span className="font-medium text-green-600">{formatPercent(portfolioStats.profitPercent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Best Asset</span>
                    <span className="font-medium text-green-600">{portfolioStats.bestPerformer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Worst Asset</span>
                    <span className="font-medium text-red-600">{portfolioStats.worstPerformer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Diversification</span>
                    <span className="font-medium">{tokenBalances.length} assets</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
