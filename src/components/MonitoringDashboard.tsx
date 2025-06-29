"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Zap, RefreshCw, Eye } from "lucide-react"
import { useBot } from "@/src/contexts/BotContext"
import { useWeb3 } from "@/src/contexts/Web3Context"

interface SystemMetric {
  name: string
  value: string
  status: "good" | "warning" | "error"
  description: string
}

interface TradeHistory {
  id: string
  timestamp: number
  pair: string
  profit: number
  gasUsed: number
  status: "success" | "failed" | "pending"
}

export default function MonitoringDashboard() {
  const { botState, opportunities } = useBot()
  const { isConnected, balance, gasPrice } = useWeb3()
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([])
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([])

  useEffect(() => {
    // Generate mock system metrics
    const metrics: SystemMetric[] = [
      {
        name: "Bot Status",
        value: botState.running ? "Running" : "Stopped",
        status: botState.running ? "good" : "warning",
        description: "Current bot operational status",
      },
      {
        name: "Wallet Balance",
        value: `${balance} ETH`,
        status: Number.parseFloat(balance) > 0.1 ? "good" : "warning",
        description: "Available balance for trading",
      },
      {
        name: "Gas Price",
        value: `${gasPrice} Gwei`,
        status: Number.parseFloat(gasPrice) < 50 ? "good" : "warning",
        description: "Current network gas price",
      },
      {
        name: "Active Opportunities",
        value: opportunities.length.toString(),
        status: opportunities.length > 0 ? "good" : "warning",
        description: "Currently available arbitrage opportunities",
      },
      {
        name: "Success Rate",
        value: `${botState.successRate.toFixed(1)}%`,
        status: botState.successRate > 80 ? "good" : botState.successRate > 60 ? "warning" : "error",
        description: "Trade execution success rate",
      },
      {
        name: "Network Status",
        value: "Connected",
        status: isConnected ? "good" : "error",
        description: "Blockchain network connection status",
      },
    ]

    setSystemMetrics(metrics)

    // Generate mock trade history
    const history: TradeHistory[] = Array.from({ length: 10 }, (_, i) => ({
      id: `trade_${i}`,
      timestamp: Date.now() - i * 300000, // 5 minutes apart
      pair: ["WETH/USDC", "WBTC/USDT", "ARB/USDC"][i % 3],
      profit: Math.random() * 50 + 5,
      gasUsed: Math.random() * 0.01 + 0.001,
      status: Math.random() > 0.1 ? "success" : "failed",
    }))

    setTradeHistory(history)
  }, [botState, opportunities, balance, gasPrice, isConnected])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "error":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Real-time system monitoring and performance metrics</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              {getStatusIcon(metric.status)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trades">Trade History</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Trading Performance
                </CardTitle>
                <CardDescription>Key performance indicators for your bot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Profit</span>
                    <span className="font-medium text-green-600">${botState.totalProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Trades</span>
                    <span className="font-medium">{botState.totalTrades}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span className="font-medium">{botState.successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={botState.successRate} className="mt-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Profit/Trade</span>
                    <span className="font-medium">
                      ${botState.totalTrades > 0 ? (botState.totalProfit / botState.totalTrades).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gas Efficiency</span>
                    <span className="font-medium">
                      {botState.gasUsed > 0 ? (botState.totalProfit / (botState.gasUsed * 2500)).toFixed(2) : "0.00"}x
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Real-time Metrics
                </CardTitle>
                <CardDescription>Live system performance data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Opportunities</span>
                    <Badge variant={opportunities.length > 0 ? "default" : "secondary"}>{opportunities.length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Current Gas Price</span>
                    <span className="font-medium">{gasPrice} Gwei</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Wallet Balance</span>
                    <span className="font-medium">{balance} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bot Status</span>
                    <Badge variant={botState.running ? "default" : "secondary"}>
                      {botState.running ? "Running" : "Stopped"}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Last Update</div>
                  <div className="text-sm font-medium">{formatTime(botState.lastUpdate)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trade History Tab */}
        <TabsContent value="trades" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Trades
              </CardTitle>
              <CardDescription>Complete history of executed arbitrage trades</CardDescription>
            </CardHeader>
            <CardContent>
              {tradeHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  No trades executed yet
                </div>
              ) : (
                <div className="space-y-3">
                  {tradeHistory.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            trade.status === "success"
                              ? "bg-green-500"
                              : trade.status === "failed"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="font-medium">{trade.pair}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(trade.timestamp)} at {formatTime(trade.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-medium ${
                            trade.status === "success"
                              ? "text-green-600"
                              : trade.status === "failed"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {trade.status === "success"
                            ? `+$${trade.profit.toFixed(2)}`
                            : trade.status === "failed"
                              ? "-$" + trade.gasUsed.toFixed(4)
                              : "Pending"}
                        </div>
                        <div className="text-xs text-muted-foreground">Gas: {trade.gasUsed.toFixed(4)} ETH</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  System Resources
                </CardTitle>
                <CardDescription>Monitor system performance and resource usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>23%</span>
                    </div>
                    <Progress value={23} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Network Latency</span>
                      <span>12ms</span>
                    </div>
                    <Progress value={12} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Connection Status
                </CardTitle>
                <CardDescription>Monitor external service connections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ethereum RPC</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uniswap V3</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SushiSwap</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Balancer</span>
                  <Badge variant="secondary">Disconnected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Price Feed</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                System Alerts
              </CardTitle>
              <CardDescription>Important notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!isConnected && (
                  <div className="flex items-center gap-3 p-3 border border-red-200 rounded-lg bg-red-50">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="font-medium text-red-800">Wallet Disconnected</div>
                      <div className="text-sm text-red-600">Connect your wallet to resume trading</div>
                    </div>
                  </div>
                )}

                {Number.parseFloat(balance) < 0.1 && (
                  <div className="flex items-center gap-3 p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="font-medium text-yellow-800">Low Balance Warning</div>
                      <div className="text-sm text-yellow-600">Wallet balance is low. Consider adding more ETH.</div>
                    </div>
                  </div>
                )}

                {Number.parseFloat(gasPrice) > 50 && (
                  <div className="flex items-center gap-3 p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="font-medium text-yellow-800">High Gas Prices</div>
                      <div className="text-sm text-yellow-600">
                        Current gas prices are high. Consider waiting for lower fees.
                      </div>
                    </div>
                  </div>
                )}

                {opportunities.length === 0 && botState.running && (
                  <div className="flex items-center gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <AlertTriangle className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-blue-800">No Opportunities Found</div>
                      <div className="text-sm text-blue-600">
                        Bot is running but no profitable opportunities detected.
                      </div>
                    </div>
                  </div>
                )}

                {systemMetrics.filter((m) => m.status === "good").length === systemMetrics.length && (
                  <div className="flex items-center gap-3 p-3 border border-green-200 rounded-lg bg-green-50">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium text-green-800">All Systems Operational</div>
                      <div className="text-sm text-green-600">
                        All systems are running normally with no issues detected.
                      </div>
                    </div>
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
