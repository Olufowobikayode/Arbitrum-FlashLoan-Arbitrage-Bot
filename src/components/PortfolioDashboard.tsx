"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react"
import { useWeb3 } from "../contexts/Web3Context"
import { useBot } from "../contexts/BotContext"
import toast from "react-hot-toast"

interface TokenBalance {
  symbol: string
  name: string
  balance: string
  value: number
  change24h: number
  address: string
}

interface Transaction {
  id: string
  type: "trade" | "deposit" | "withdrawal"
  pair?: string
  amount: number
  profit?: number
  timestamp: string
  txHash: string
  status: "success" | "failed" | "pending"
}

const PortfolioDashboard: React.FC = () => {
  const { account, isConnected, balance } = useWeb3()
  const { stats, recentTrades } = useBot()
  const [isLoading, setIsLoading] = useState(false)
  const [showBalances, setShowBalances] = useState(true)
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: "2.5432",
      value: 6750.25,
      change24h: 3.2,
      address: "0x0000000000000000000000000000000000000000",
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: "15420.50",
      value: 15420.5,
      change24h: 0.1,
      address: "0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505",
    },
    {
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      balance: "0.1234",
      value: 8950.75,
      change24h: -1.8,
      address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    },
  ])

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "trade",
      pair: "WETH/USDC",
      amount: 1.5,
      profit: 125.5,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      txHash: "0x1234567890abcdef1234567890abcdef12345678",
      status: "success",
    },
    {
      id: "2",
      type: "trade",
      pair: "WBTC/USDC",
      amount: 0.05,
      profit: 89.25,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
      status: "success",
    },
    {
      id: "3",
      type: "trade",
      pair: "ETH/DAI",
      amount: 2.0,
      profit: -15.75,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      txHash: "0x567890abcdef1234567890abcdef1234567890ab",
      status: "failed",
    },
  ])

  useEffect(() => {
    if (isConnected && account) {
      refreshPortfolio()
    }
  }, [isConnected, account])

  const refreshPortfolio = async () => {
    setIsLoading(true)
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real app, this would fetch actual token balances
      setTokenBalances((prev) =>
        prev.map((token) => ({
          ...token,
          change24h: (Math.random() - 0.5) * 10, // Random change for demo
        })),
      )

      toast.success("Portfolio refreshed successfully")
    } catch (error) {
      console.error("Error refreshing portfolio:", error)
      toast.error("Failed to refresh portfolio")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getTotalPortfolioValue = () => {
    return tokenBalances.reduce((total, token) => total + token.value, 0)
  }

  const getPortfolioChange = () => {
    const totalValue = getTotalPortfolioValue()
    const totalChange = tokenBalances.reduce((total, token) => total + (token.value * token.change24h) / 100, 0)
    return (totalChange / totalValue) * 100
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Portfolio Dashboard
          </CardTitle>
          <CardDescription>Connect your wallet to view your portfolio and trading history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Please connect your wallet to continue</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showBalances ? formatCurrency(getTotalPortfolioValue()) : "••••••"}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {getPortfolioChange() >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={getPortfolioChange() >= 0 ? "text-green-500" : "text-red-500"}>
                {getPortfolioChange().toFixed(2)}% (24h)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {showBalances ? formatCurrency(stats.totalProfit) : "••••••"}
            </div>
            <p className="text-xs text-muted-foreground">From {stats.totalTrades} trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Portfolio Details
              </CardTitle>
              <CardDescription>Your token balances and trading history</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setShowBalances(!showBalances)}>
                {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={refreshPortfolio} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="balances" className="space-y-4">
            <TabsList>
              <TabsTrigger value="balances">Token Balances</TabsTrigger>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="balances" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {tokenBalances.map((token) => (
                    <div key={token.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{token.symbol}</span>
                        </div>
                        <div>
                          <p className="font-medium">{token.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {showBalances ? `${token.balance} ${token.symbol}` : "••••••"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{showBalances ? formatCurrency(token.value) : "••••••"}</p>
                        <div className="flex items-center gap-1">
                          {token.change24h >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className={`text-xs ${token.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {token.change24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(token.address)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${tx.status === "success" ? "bg-green-500" : tx.status === "failed" ? "bg-red-500" : "bg-yellow-500"}`}
                        />
                        <div>
                          <p className="font-medium capitalize">{tx.type}</p>
                          {tx.pair && <p className="text-sm text-muted-foreground">{tx.pair}</p>}
                          <p className="text-xs text-muted-foreground">{formatTime(tx.timestamp)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{tx.amount} ETH</p>
                        {tx.profit && (
                          <p className={`text-sm ${tx.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {tx.profit >= 0 ? "+" : ""}
                            {formatCurrency(tx.profit)}
                          </p>
                        )}
                        <Badge
                          variant={
                            tx.status === "success" ? "default" : tx.status === "failed" ? "destructive" : "secondary"
                          }
                        >
                          {tx.status}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`https://etherscan.io/tx/${tx.txHash}`, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Trading Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Trades</span>
                      <span className="font-medium">{stats.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Successful Trades</span>
                      <span className="font-medium text-green-500">{stats.successfulTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average Profit</span>
                      <span className="font-medium">{formatCurrency(stats.averageProfit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Today's Profit</span>
                      <span className="font-medium text-green-500">{formatCurrency(stats.todayProfit)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">System Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Uptime</span>
                      <span className="font-medium">{stats.uptime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Gas Used</span>
                      <span className="font-medium">{stats.gasUsed.toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="font-medium">{stats.successRate.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default PortfolioDashboard
