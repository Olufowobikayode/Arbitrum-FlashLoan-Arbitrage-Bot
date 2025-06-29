"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Activity,
  DollarSign,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  Settings,
  Play,
  Pause,
  Square,
  RefreshCw,
  Target,
  BarChart3,
  Gauge,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Timer,
} from "lucide-react"
import { useBot } from "../contexts/BotContext"
import { useWeb3 } from "../contexts/Web3Context"
import StatusCard from "./StatusCard"
import OpportunityList from "./OpportunityList"
import ProfitChart from "./ProfitChart"
import QuickActions from "./QuickActions"

const Dashboard: React.FC = () => {
  const {
    botState,
    opportunities,
    isScanning,
    autoExecutionStats,
    telegramService,
    startBot,
    stopBot,
    emergencyStop,
    scanOpportunities,
    updateBotState,
  } = useBot()

  const { balance, gasPrice, isConnected } = useWeb3()

  // Performance optimization with memoization
  const [scanInterval, setScanInterval] = useState(15) // seconds
  const [lastScanTime, setLastScanTime] = useState<number>(0)
  const [scanHistory, setScanHistory] = useState<Array<{ time: number; opportunities: number; duration: number }>>([])
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgScanTime: 0,
    avgOpportunitiesPerScan: 0,
    successRate: 0,
    profitPerHour: 0,
  })

  // Real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (botState.running && botState.autoTrade) {
      interval = setInterval(() => {
        const startTime = Date.now()
        scanOpportunities().then(() => {
          const duration = Date.now() - startTime
          setLastScanTime(Date.now())

          // Update scan history
          setScanHistory((prev) => {
            const newEntry = { time: Date.now(), opportunities: opportunities.length, duration }
            const updated = [...prev, newEntry].slice(-50) // Keep last 50 scans
            return updated
          })
        })
      }, scanInterval * 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [botState.running, botState.autoTrade, scanInterval, scanOpportunities, opportunities.length])

  // Calculate performance metrics
  const memoizedMetrics = useMemo(() => {
    if (scanHistory.length === 0) return performanceMetrics

    const avgScanTime = scanHistory.reduce((sum, scan) => sum + scan.duration, 0) / scanHistory.length
    const avgOpportunitiesPerScan = scanHistory.reduce((sum, scan) => sum + scan.opportunities, 0) / scanHistory.length
    const successRate =
      autoExecutionStats.totalExecutions > 0
        ? (autoExecutionStats.successfulExecutions / autoExecutionStats.totalExecutions) * 100
        : 0

    const uptimeHours = (Date.now() - botState.startTime) / (1000 * 60 * 60)
    const profitPerHour = uptimeHours > 0 ? botState.totalProfit / uptimeHours : 0

    return {
      avgScanTime: Math.round(avgScanTime),
      avgOpportunitiesPerScan: Math.round(avgOpportunitiesPerScan * 10) / 10,
      successRate: Math.round(successRate * 10) / 10,
      profitPerHour: Math.round(profitPerHour * 100) / 100,
    }
  }, [scanHistory, autoExecutionStats, botState.totalProfit, botState.startTime])

  // Update performance metrics when memoized values change
  useEffect(() => {
    setPerformanceMetrics(memoizedMetrics)
  }, [memoizedMetrics])

  const formatUptime = useCallback((startTime: number) => {
    const uptime = Date.now() - startTime
    const hours = Math.floor(uptime / (1000 * 60 * 60))
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }, [])

  const getNextScanCountdown = useCallback(() => {
    if (!botState.running || !lastScanTime) return scanInterval
    const elapsed = Math.floor((Date.now() - lastScanTime) / 1000)
    return Math.max(0, scanInterval - elapsed)
  }, [botState.running, lastScanTime, scanInterval])

  const [countdown, setCountdown] = useState(getNextScanCountdown())

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getNextScanCountdown())
    }, 1000)

    return () => clearInterval(interval)
  }, [getNextScanCountdown])

  const handleScanIntervalChange = (value: string) => {
    const newInterval = Number.parseInt(value)
    setScanInterval(newInterval)
    setLastScanTime(0) // Reset scan timer
  }

  const handleManualScan = async () => {
    const startTime = Date.now()
    await scanOpportunities()
    const duration = Date.now() - startTime
    setLastScanTime(Date.now())

    setScanHistory((prev) => {
      const newEntry = { time: Date.now(), opportunities: opportunities.length, duration }
      return [...prev, newEntry].slice(-50)
    })
  }

  const getTelegramStatus = () => {
    if (!telegramService) return { status: "Disabled", color: "bg-gray-500" }

    const connectionStatus = telegramService.getConnectionStatus()
    switch (connectionStatus) {
      case "connected":
        return { status: "Connected", color: "bg-green-500" }
      case "testing":
        return { status: "Testing", color: "bg-yellow-500" }
      default:
        return { status: "Disconnected", color: "bg-red-500" }
    }
  }

  const telegramStatus = getTelegramStatus()

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Arbitrage Dashboard</h1>
          <p className="text-muted-foreground">Real-time monitoring and control center</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={botState.running ? "default" : "secondary"} className="px-3 py-1">
            <div className={`w-2 h-2 rounded-full mr-2 ${botState.running ? "bg-green-400" : "bg-gray-400"}`} />
            {botState.status}
          </Badge>

          <Badge className={telegramStatus.color}>
            <MessageSquare className="w-3 h-3 mr-1" />
            {telegramStatus.status}
          </Badge>
        </div>
      </div>

      {/* Quick Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              {!botState.running ? (
                <Button onClick={startBot} disabled={!isConnected} className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Start Bot
                </Button>
              ) : (
                <Button onClick={stopBot} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Pause className="w-4 h-4" />
                  Stop Bot
                </Button>
              )}

              <Button onClick={emergencyStop} variant="destructive" className="flex items-center gap-2">
                <Square className="w-4 h-4" />
                Emergency Stop
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            <div className="flex items-center gap-2">
              <Label htmlFor="scanInterval" className="text-sm font-medium">
                Scan Interval:
              </Label>
              <Select value={scanInterval.toString()} onValueChange={handleScanIntervalChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleManualScan}
                disabled={isScanning}
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
                {isScanning ? "Scanning..." : "Manual Scan"}
              </Button>

              {botState.running && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="w-4 h-4" />
                  Next scan: {countdown}s
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatusCard
          title="Bot Status"
          value={botState.running ? "Running" : "Stopped"}
          icon={<Activity />}
          color={botState.running ? "green" : "red"}
          subtitle={`Auto-trade: ${botState.autoTrade ? "ON" : "OFF"}`}
        />

        <StatusCard
          title="Total Profit"
          value={`$${botState.totalProfit.toFixed(2)}`}
          icon={<DollarSign />}
          color="blue"
          subtitle="All-time earnings"
        />

        <StatusCard
          title="Opportunities"
          value={opportunities.length.toString()}
          icon={<TrendingUp />}
          color="purple"
          subtitle={isScanning ? "Scanning..." : "Available now"}
        />

        <StatusCard
          title="Gas Price"
          value={`${gasPrice} Gwei`}
          icon={<Zap />}
          color="orange"
          subtitle="Current network"
        />

        <StatusCard
          title="Success Rate"
          value={`${performanceMetrics.successRate}%`}
          icon={<Target />}
          color="green"
          subtitle={`${autoExecutionStats.successfulExecutions}/${autoExecutionStats.totalExecutions} trades`}
        />

        <StatusCard
          title="Uptime"
          value={formatUptime(botState.startTime)}
          icon={<Clock />}
          color="gray"
          subtitle="Current session"
        />
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Real-time system performance and efficiency metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Avg Scan Time</Label>
                <span className="text-sm text-muted-foreground">{performanceMetrics.avgScanTime}ms</span>
              </div>
              <Progress value={Math.min(100, performanceMetrics.avgScanTime / 50)} className="h-2" />
              <p className="text-xs text-muted-foreground">Target: &lt;2000ms</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Opportunities/Scan</Label>
                <span className="text-sm text-muted-foreground">{performanceMetrics.avgOpportunitiesPerScan}</span>
              </div>
              <Progress value={Math.min(100, performanceMetrics.avgOpportunitiesPerScan * 10)} className="h-2" />
              <p className="text-xs text-muted-foreground">Higher is better</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Success Rate</Label>
                <span className="text-sm text-muted-foreground">{performanceMetrics.successRate}%</span>
              </div>
              <Progress value={performanceMetrics.successRate} className="h-2" />
              <p className="text-xs text-muted-foreground">Target: &gt;80%</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Profit/Hour</Label>
                <span className="text-sm text-muted-foreground">${performanceMetrics.profitPerHour}</span>
              </div>
              <Progress value={Math.min(100, performanceMetrics.profitPerHour / 10)} className="h-2" />
              <p className="text-xs text-muted-foreground">Current rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <QuickActions />
              <OpportunityList opportunities={opportunities.slice(0, 5)} />
            </div>

            <div className="space-y-4">
              <ProfitChart />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Wallet Balance</Label>
                      <div className="text-lg font-semibold">{balance} ETH</div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Security Status</Label>
                      <Badge variant={botState.securityStatus.includes("Normal") ? "default" : "destructive"}>
                        {botState.securityStatus.includes("Normal") ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        )}
                        {botState.securityStatus}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Flashloan Token</span>
                      <Badge variant="outline">{botState.flashloanToken}</Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Flashloan Amount</span>
                      <span className="text-sm font-medium">${botState.flashloanAmount.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Provider</span>
                      <Badge variant="outline">{botState.flashloanProvider}</Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Last Scan</span>
                      <span className="text-sm text-muted-foreground">{botState.lastScan || "Never"}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Consecutive Failures</span>
                      <Badge variant={botState.consecutiveFailures > 3 ? "destructive" : "secondary"}>
                        {botState.consecutiveFailures}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <OpportunityList opportunities={opportunities} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfitChart />

            <Card>
              <CardHeader>
                <CardTitle>Scan History</CardTitle>
                <CardDescription>Recent scanning performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scanHistory
                    .slice(-10)
                    .reverse()
                    .map((scan, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{new Date(scan.time).toLocaleTimeString()}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{scan.opportunities} ops</Badge>
                          <span className="text-muted-foreground">{scan.duration}ms</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Bot Version</Label>
                    <div className="text-lg font-semibold">2.1.0</div>
                  </div>

                  <div>
                    <Label className="text-sm">Network</Label>
                    <div className="text-lg font-semibold">Arbitrum One</div>
                  </div>

                  <div>
                    <Label className="text-sm">Simulation Engine</Label>
                    <div className="text-lg font-semibold">Enhanced</div>
                  </div>

                  <div>
                    <Label className="text-sm">MEV Protection</Label>
                    <Badge variant="default">
                      <Shield className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Auto-execution</span>
                    <Badge variant={botState.autoExecuteEnabled ? "default" : "secondary"}>
                      {botState.autoExecuteEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Simulation Mode</span>
                    <Badge variant={botState.simulationEnabled ? "default" : "secondary"}>
                      {botState.simulationEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Telegram Notifications</span>
                    <Badge className={telegramStatus.color}>{telegramStatus.status}</Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Scan Interval</span>
                    <Badge variant="outline">{scanInterval}s</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Alerts */}
      {botState.consecutiveFailures >= 3 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> {botState.consecutiveFailures} consecutive execution failures detected. Consider
            checking your configuration or stopping the bot.
          </AlertDescription>
        </Alert>
      )}

      {!isConnected && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Wallet not connected:</strong> Please connect your wallet to enable trading functionality.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default Dashboard
