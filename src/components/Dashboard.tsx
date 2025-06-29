"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  DollarSign,
  TrendingUp,
  Zap,
  Play,
  Square,
  AlertTriangle,
  Target,
  Clock,
  BarChart3,
} from "lucide-react"
import { useBot } from "@/src/contexts/BotContext"
import { useWeb3 } from "@/src/contexts/Web3Context"
import toast from "react-hot-toast"

export default function Dashboard() {
  const {
    botState,
    opportunities,
    isScanning,
    autoExecutionStats,
    startBot,
    stopBot,
    emergencyStop,
    scanForOpportunities,
  } = useBot()

  const { isConnected, account, balance } = useWeb3()
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    // Generate mock recent activity
    const mockActivity = [
      {
        id: 1,
        type: "trade",
        description: "Executed WETH/USDC arbitrage",
        profit: 125.5,
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        status: "success",
      },
      {
        id: 2,
        type: "opportunity",
        description: "New WBTC/USDT opportunity detected",
        profit: 89.25,
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        status: "pending",
      },
      {
        id: 3,
        type: "scan",
        description: "Completed market scan",
        profit: 0,
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        status: "info",
      },
    ]
    setRecentActivity(mockActivity)
  }, [])

  const handleStartBot = async () => {
    try {
      await startBot()
      toast.success("Bot started successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to start bot")
    }
  }

  const handleStopBot = () => {
    stopBot()
    toast.success("Bot stopped")
  }

  const handleEmergencyStop = () => {
    emergencyStop()
    toast.error("Emergency stop activated!")
  }

  const handleScanNow = async () => {
    try {
      await scanForOpportunities()
      toast.success("Manual scan completed")
    } catch (error) {
      toast.error("Scan failed")
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-500"
      case "error":
        return "text-red-500"
      case "pending":
        return "text-yellow-500"
      default:
        return "text-blue-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your arbitrage bot performance and manage operations</p>
        </div>

        <div className="flex items-center gap-2">
          {!isConnected ? (
            <Badge variant="destructive">Wallet Not Connected</Badge>
          ) : (
            <Badge variant="default">Connected</Badge>
          )}

          <Badge variant={botState.running ? "default" : "secondary"}>{botState.running ? "Running" : "Stopped"}</Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {!botState.running ? (
              <Button onClick={handleStartBot} disabled={!isConnected} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start Bot
              </Button>
            ) : (
              <Button onClick={handleStopBot} variant="outline" className="flex items-center gap-2 bg-transparent">
                <Square className="w-4 h-4" />
                Stop Bot
              </Button>
            )}

            <Button onClick={handleEmergencyStop} variant="destructive" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Emergency Stop
            </Button>

            <Button
              onClick={handleScanNow}
              disabled={isScanning}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Target className="w-4 h-4" />
              {isScanning ? "Scanning..." : "Scan Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${botState.totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last week</p>
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
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities.length}</div>
            <p className="text-xs text-muted-foreground">{isScanning ? "Scanning..." : "Last scan: 2m ago"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botState.totalTrades}</div>
            <p className="text-xs text-muted-foreground">{autoExecutionStats.successfulTrades} successful</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Current Opportunities
              </CardTitle>
              <CardDescription>Live arbitrage opportunities detected by the bot</CardDescription>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No opportunities found</p>
                  <p className="text-sm">The bot will automatically scan for new opportunities</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {opportunities.slice(0, 5).map((opportunity) => (
                    <div key={opportunity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {opportunity.tokenA}/{opportunity.tokenB}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {opportunity.exchangeA} → {opportunity.exchangeB}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-500">+${opportunity.profitUsd.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {(opportunity.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      {activity.profit > 0 && <p className="text-sm text-green-500">+${activity.profit.toFixed(2)}</p>}
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Wallet Info */}
          {isConnected && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Wallet Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-mono">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance:</span>
                    <span>{balance} ETH</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Bot performance metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Performance chart will be displayed here</p>
              <p className="text-sm">Historical data and analytics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
