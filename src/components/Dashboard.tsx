"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  DollarSign,
  TrendingUp,
  Zap,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  Target,
  Clock,
} from "lucide-react"
import { useBot } from "@/src/contexts/BotContext"
import { useWeb3 } from "@/src/contexts/Web3Context"

export default function Dashboard() {
  const { botState, opportunities, startBot, stopBot, executeArbitrage } = useBot()
  const { isConnected, balance } = useWeb3()
  const [isExecuting, setIsExecuting] = useState<string | null>(null)

  const handleBotToggle = () => {
    if (botState.running) {
      stopBot()
    } else {
      startBot()
    }
  }

  const handleExecuteOpportunity = async (opportunity: any) => {
    setIsExecuting(opportunity.id)
    try {
      await executeArbitrage(opportunity)
    } catch (error) {
      console.error("Failed to execute opportunity:", error)
    } finally {
      setIsExecuting(null)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your arbitrage bot performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={botState.running ? "default" : "secondary"} className="px-3 py-1">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${botState.running ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
            />
            {botState.running ? "Running" : "Stopped"}
          </Badge>
          <Button onClick={handleBotToggle} disabled={!isConnected}>
            {botState.running ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Bot
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Bot
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Connection Warning */}
      {!isConnected && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Wallet not connected</span>
            </div>
            <p className="text-yellow-700 mt-1">Connect your wallet to start trading</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${botState.totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botState.totalTrades}</div>
            <p className="text-xs text-muted-foreground">+3 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botState.successRate.toFixed(1)}%</div>
            <Progress value={botState.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botState.gasUsed.toFixed(3)} ETH</div>
            <p className="text-xs text-muted-foreground">Current balance: {balance} ETH</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities">Live Opportunities</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Live Arbitrage Opportunities
              </CardTitle>
              <CardDescription>
                {opportunities.length} opportunities found • Last updated: {formatTime(botState.lastUpdate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {botState.running ? (
                    <>
                      <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      Scanning for opportunities...
                    </>
                  ) : (
                    <>
                      <Target className="w-8 h-8 mx-auto mb-2" />
                      Start the bot to scan for opportunities
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {opportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {opportunity.tokenA}/{opportunity.tokenB}
                          </span>
                          <Badge variant="outline">{opportunity.exchangeA}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline">{opportunity.exchangeB}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Profit: ${opportunity.profitUSD.toFixed(2)} ({opportunity.profitPercent.toFixed(2)}%) • Gas:
                          {opportunity.gasEstimate.toFixed(4)} ETH
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={opportunity.profitPercent > 0.1 ? "default" : "secondary"}>
                          {opportunity.profitPercent.toFixed(2)}%
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleExecuteOpportunity(opportunity)}
                          disabled={isExecuting === opportunity.id || !isConnected}
                        >
                          {isExecuting === opportunity.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            "Execute"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest arbitrage trades and bot actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {botState.totalTrades === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2" />
                    No trades executed yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: Math.min(5, botState.totalTrades) }, (_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">Arbitrage Trade #{botState.totalTrades - i}</div>
                          <div className="text-sm text-muted-foreground">WETH/USDC • Uniswap → SushiSwap</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">+$12.45</div>
                          <div className="text-xs text-muted-foreground">2 min ago</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Average Profit per Trade</span>
                  <span className="font-medium">
                    ${botState.totalTrades > 0 ? (botState.totalProfit / botState.totalTrades).toFixed(2) : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Gas Spent</span>
                  <span className="font-medium">{botState.gasUsed.toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Net Profit (after gas)</span>
                  <span className="font-medium text-green-600">
                    ${(botState.totalProfit - botState.gasUsed * 2500).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bot Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant={botState.running ? "default" : "secondary"}>
                    {botState.running ? "Running" : "Stopped"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Last Update</span>
                  <span className="font-medium">{formatTime(botState.lastUpdate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Opportunities</span>
                  <span className="font-medium">{opportunities.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
