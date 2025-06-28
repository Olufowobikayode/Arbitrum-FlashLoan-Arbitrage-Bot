"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  TrendingUp,
  DollarSign,
  PieChartIcon as RechartsPieChart,
  BarChart3,
  Target,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Pie,
  AreaChart,
  Area,
  Cell,
} from "recharts"
import {
  PortfolioTrackingService,
  type PortfolioAsset,
  type PortfolioTransaction,
  type PortfolioMetrics,
  type TradingPair,
} from "../services/PortfolioTrackingService"

const PortfolioDashboard: React.FC = () => {
  const [portfolioService] = useState(() => new PortfolioTrackingService())
  const [assets, setAssets] = useState<PortfolioAsset[]>([])
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([])
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d")
  const [hideBalances, setHideBalances] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadPortfolioData()

    // Set up mock data if portfolio is empty
    if (assets.length === 0) {
      initializeMockData()
    }

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPortfolioData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadPortfolioData = () => {
    setAssets(portfolioService.getAssets())
    setTransactions(portfolioService.getTransactions(50))
    setMetrics(portfolioService.calculateMetrics())
    setTradingPairs(portfolioService.getTradingPairs())
  }

  const initializeMockData = () => {
    // Add mock assets
    portfolioService.addAsset("ETH", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 4.25, 2650)
    portfolioService.addAsset("USDC", "0xA0b86a33E6417c4c4c4c4c4c4c4c4c4c4c4c4c4c", 15000, 1.0)
    portfolioService.addAsset("WBTC", "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", 0.15, 45000)
    portfolioService.addAsset("ARB", "0x912CE59144191C1204E64559FE8253a0e49E6548", 2500, 1.25)

    // Set initial portfolio value
    portfolioService.setInitialValue(25000)

    // Add mock trading history
    for (let i = 0; i < 20; i++) {
      portfolioService.recordArbitrageTrade({
        baseSymbol: "ETH",
        quoteSymbol: "USDC",
        amount: 1 + Math.random() * 2,
        buyPrice: 2600 + Math.random() * 100,
        sellPrice: 2610 + Math.random() * 100,
        profit: 25 + Math.random() * 75,
        fee: 5 + Math.random() * 10,
        gasUsed: 150000 + Math.random() * 100000,
        buyDEX: "Uniswap V3",
        sellDEX: "SushiSwap",
      })
    }

    loadPortfolioData()
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      loadPortfolioData()
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    const data = portfolioService.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `portfolio_export_${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatCurrency = (amount: number, hideValue = false) => {
    if (hideValue) return "****"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : ""
    return `${sign}${value.toFixed(2)}%`
  }

  const getChangeColor = (value: number) => {
    if (value > 0) return "text-green-500"
    if (value < 0) return "text-red-500"
    return "text-gray-500"
  }

  const getChangeIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="w-4 h-4" />
    if (value < 0) return <ArrowDownRight className="w-4 h-4" />
    return null
  }

  const pieChartColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0"]

  const performanceData =
    metrics?.performanceHistory?.slice(-30).map((point, index) => ({
      date: new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      value: point.totalValue,
      profit: point.totalProfit,
      change: point.dailyChange,
    })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RechartsPieChart className="w-5 h-5" />
            Portfolio Dashboard
          </CardTitle>
          <CardDescription>Track your trading performance, asset allocation, and portfolio metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setHideBalances(!hideBalances)}>
                {hideBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {hideBalances ? "Show" : "Hide"} Balances
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.totalValue || 0, hideBalances)}</p>
                {metrics && (
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(metrics.totalChange24h)}`}>
                    {getChangeIcon(metrics.totalChange24h)}
                    {formatPercentage(metrics.totalChange24h)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.totalProfit || 0, hideBalances)}</p>
                {metrics && (
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(metrics.profitChange24h)}`}>
                    {getChangeIcon(metrics.profitChange24h)}
                    {formatPercentage(metrics.profitChange24h)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{metrics?.totalTrades || 0}</p>
                <p className="text-sm text-muted-foreground">{metrics?.winRate.toFixed(1)}% win rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className="text-2xl font-bold">{formatPercentage(metrics?.roi || 0)}</p>
                <p className="text-sm text-muted-foreground">Since inception</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portfolio Performance</CardTitle>
                <CardDescription>Total value over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "value" ? "Portfolio Value" : "Total Profit",
                      ]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Asset Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Asset Allocation</CardTitle>
                <CardDescription>Portfolio distribution by asset</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <Pie
                    data={assets.map((asset, index) => ({
                      name: asset.symbol,
                      value: asset.value,
                      color: pieChartColors[index % pieChartColors.length],
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  >
                    {assets.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest transactions and trades</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            tx.type === "buy" ? "bg-green-500" : tx.type === "sell" ? "bg-red-500" : "bg-blue-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium">
                            {tx.type.toUpperCase()} {tx.amount.toFixed(4)} {tx.symbol}
                          </p>
                          <p className="text-sm text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(tx.value, hideBalances)}</p>
                        {tx.profit && (
                          <p className={`text-sm ${getChangeColor(tx.profit)}`}>
                            {tx.profit > 0 ? "+" : ""}
                            {formatCurrency(tx.profit, hideBalances)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No transactions yet</p>
                      <p className="text-xs">Start trading to see your activity here</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {assets.map((asset) => (
              <Card key={asset.symbol}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{asset.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{asset.balance.toFixed(6)} tokens</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold">{formatCurrency(asset.value, hideBalances)}</p>
                      <p className="text-sm text-muted-foreground">@ {formatCurrency(asset.price)}</p>
                    </div>

                    <div className="text-right">
                      <div className={`flex items-center gap-1 ${getChangeColor(asset.change24h)}`}>
                        {getChangeIcon(asset.change24h)}
                        <span className="font-medium">{formatPercentage(asset.change24h)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {((asset.value / (metrics?.totalValue || 1)) * 100).toFixed(1)}% of portfolio
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Portfolio Weight</span>
                      <span>{((asset.value / (metrics?.totalValue || 1)) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(asset.value / (metrics?.totalValue || 1)) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {assets.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RechartsPieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Assets Found</h3>
                    <p className="text-muted-foreground mb-4">Start trading to build your portfolio</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <CardDescription>Complete record of all portfolio transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            tx.type === "buy" ? "bg-green-500" : tx.type === "sell" ? "bg-red-500" : "bg-blue-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium">
                            {tx.type.toUpperCase()} {tx.amount.toFixed(6)} {tx.symbol}
                          </p>
                          <p className="text-sm text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="font-medium">{formatCurrency(tx.price)}</p>
                        <p className="text-sm text-muted-foreground">Price</p>
                      </div>

                      <div className="text-center">
                        <p className="font-medium">{formatCurrency(tx.value, hideBalances)}</p>
                        <p className="text-sm text-muted-foreground">Value</p>
                      </div>

                      <div className="text-right">
                        {tx.profit && (
                          <>
                            <p className={`font-medium ${getChangeColor(tx.profit)}`}>
                              {tx.profit > 0 ? "+" : ""}
                              {formatCurrency(tx.profit, hideBalances)}
                            </p>
                            <p className="text-sm text-muted-foreground">P&L</p>
                          </>
                        )}
                      </div>

                      <div className="text-right">
                        <Badge
                          variant={tx.type === "buy" ? "default" : tx.type === "sell" ? "destructive" : "secondary"}
                        >
                          {tx.type}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No transactions found</p>
                      <p className="text-xs">Transaction history will appear here</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
                <CardDescription>Key portfolio statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-green-500">{formatPercentage(metrics?.roi || 0)}</p>
                    <p className="text-sm text-muted-foreground">Total ROI</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold">{metrics?.winRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold">{formatCurrency(metrics?.averageProfit || 0, hideBalances)}</p>
                    <p className="text-sm text-muted-foreground">Avg Profit</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-red-500">{formatPercentage(metrics?.maxDrawdown || 0)}</p>
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Sharpe Ratio:</span>
                    <span className="font-medium">{metrics?.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Factor:</span>
                    <span className="font-medium">{metrics?.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Fees Paid:</span>
                    <span className="font-medium">{formatCurrency(metrics?.totalFees || 0, hideBalances)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Trade:</span>
                    <span className="font-medium text-green-500">
                      {formatCurrency(metrics?.bestTrade || 0, hideBalances)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Worst Trade:</span>
                    <span className="font-medium text-red-500">
                      {formatCurrency(metrics?.worstTrade || 0, hideBalances)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profit/Loss Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profit & Loss</CardTitle>
                <CardDescription>Daily P&L over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Daily P&L"]} />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Trading Pairs Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trading Pairs Performance</CardTitle>
              <CardDescription>Performance breakdown by trading pair</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tradingPairs.map((pair) => (
                  <div key={pair.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{pair.symbol}</h4>
                      <p className="text-sm text-muted-foreground">{pair.totalTrades} trades</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{formatCurrency(pair.totalProfit, hideBalances)}</p>
                      <p className="text-sm text-muted-foreground">Total Profit</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{pair.winRate.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 ${getChangeColor(pair.profitMargin)}`}>
                        {getChangeIcon(pair.profitMargin)}
                        <span className="font-medium">{formatPercentage(pair.profitMargin)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Profit Margin</p>
                    </div>
                  </div>
                ))}

                {tradingPairs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No trading pairs data</p>
                    <p className="text-xs">Execute trades to see pair performance</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PortfolioDashboard
