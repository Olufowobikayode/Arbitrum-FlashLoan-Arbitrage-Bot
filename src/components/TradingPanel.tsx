"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Play,
  Pause,
  Square,
  TrendingUp,
  DollarSign,
  Zap,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  BarChart3,
} from "lucide-react"
import { useBot } from "../contexts/BotContext"
import { useWeb3 } from "../contexts/Web3Context"
import OpportunityList from "./OpportunityList"
import ProfitChart from "./ProfitChart"
import MEVProtectionPanel from "./MEVProtectionPanel"
import GasOptimizationPanel from "./GasOptimizationPanel"

const TradingPanel: React.FC = () => {
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
    executeTrade,
  } = useBot()

  const { balance, gasPrice, isConnected } = useWeb3()
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const totalTrades = autoExecutionStats.totalExecutions
    const successRate = totalTrades > 0 ? (autoExecutionStats.successfulExecutions / totalTrades) * 100 : 0
    const avgProfitPerTrade =
      autoExecutionStats.successfulExecutions > 0
        ? autoExecutionStats.totalProfit / autoExecutionStats.successfulExecutions
        : 0
    const uptimeHours = (Date.now() - botState.startTime) / (1000 * 60 * 60)
    const profitPerHour = uptimeHours > 0 ? botState.totalProfit / uptimeHours : 0

    return {
      successRate: Math.round(successRate * 10) / 10,
      avgProfitPerTrade: Math.round(avgProfitPerTrade * 100) / 100,
      profitPerHour: Math.round(profitPerHour * 100) / 100,
      totalTrades,
    }
  }, [autoExecutionStats, botState.totalProfit, botState.startTime])

  const handleExecuteTrade = async (opportunityId?: string) => {
    setIsExecuting(true)
    try {
      await executeTrade(opportunityId || selectedOpportunity || undefined)
    } finally {
      setIsExecuting(false)
      setSelectedOpportunity(null)
    }
  }

  const getStatusColor = (status: string) => {
    if (status.includes("Operational")) return "bg-green-500"
    if (status.includes("Stopped")) return "bg-red-500"
    if (status.includes("EMERGENCY")) return "bg-red-600"
    return "bg-gray-500"
  }

  const getTelegramStatus = () => {
    if (!telegramService) return { status: "Disabled", variant: "secondary" as const }

    const connectionStatus = telegramService.getConnectionStatus()
    switch (connectionStatus) {
      case "connected":
        return { status: "Connected", variant: "default" as const }
      case "testing":
        return { status: "Testing", variant: "secondary" as const }
      default:
        return { status: "Disconnected", variant: "destructive" as const }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trading Control Center</h1>
          <p className="text-muted-foreground">Monitor and control your arbitrage trading operations</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(botState.status)}>
            <div className={`w-2 h-2 rounded-full mr-2 ${botState.running ? "bg-white" : "bg-gray-300"}`} />
            {botState.status}
          </Badge>

          <Badge variant={getTelegramStatus().variant}>{getTelegramStatus().status}</Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold">${botState.totalProfit.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{performanceMetrics.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Opportunities</p>
                <p className="text-2xl font-bold">{opportunities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Gas Price</p>
                <p className="text-2xl font-bold">{gasPrice} Gwei</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Bot Controls
          </CardTitle>
          <CardDescription>Start, stop, and manage your trading bot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {!botState.running ? (
              <Button onClick={startBot} disabled={!isConnected} className="flex items-center gap-2" size="lg">
                <Play className="w-4 h-4" />
                Start Trading Bot
              </Button>
            ) : (
              <Button onClick={stopBot} variant="outline" className="flex items-center gap-2 bg-transparent" size="lg">
                <Pause className="w-4 h-4" />
                Stop Bot
              </Button>
            )}

            <Button onClick={emergencyStop} variant="destructive" className="flex items-center gap-2" size="lg">
              <Square className="w-4 h-4" />
              Emergency Stop
            </Button>

            <Separator orientation="vertical" className="h-8" />

            <Button
              onClick={scanOpportunities}
              disabled={isScanning}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "Scanning..." : "Manual Scan"}
            </Button>

            {selectedOpportunity && (
              <Button onClick={() => handleExecuteTrade()} disabled={isExecuting} className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {isExecuting ? "Executing..." : "Execute Selected"}
              </Button>
            )}
          </div>

          {!isConnected && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Please connect your wallet to enable trading functionality.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Performance Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm text-muted-foreground">{performanceMetrics.successRate}%</span>
              </div>
              <Progress value={performanceMetrics.successRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {autoExecutionStats.successfulExecutions} successful out of {performanceMetrics.totalTrades} total
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Avg Profit/Trade</span>
                <span className="text-sm text-muted-foreground">${performanceMetrics.avgProfitPerTrade}</span>
              </div>
              <Progress value={Math.min(100, performanceMetrics.avgProfitPerTrade)} className="h-2" />
              <p className="text-xs text-muted-foreground">Per successful trade</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Profit/Hour</span>
                <span className="text-sm text-muted-foreground">${performanceMetrics.profitPerHour}</span>
              </div>
              <Progress value={Math.min(100, performanceMetrics.profitPerHour / 10)} className="h-2" />
              <p className="text-xs text-muted-foreground">Current rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="mev-protection">MEV Protection</TabsTrigger>
          <TabsTrigger value="gas-optimization">Gas Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <OpportunityList
                opportunities={opportunities}
                onSelect={setSelectedOpportunity}
                selectedId={selectedOpportunity}
              />
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Execute</CardTitle>
                  <CardDescription>Execute the most profitable opportunity</CardDescription>
                </CardHeader>
                <CardContent>
                  {opportunities.length > 0 ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Best Opportunity</span>
                          <Badge variant="default">${opportunities[0]?.estimatedProfit?.toFixed(2) || "0.00"}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {opportunities[0]?.baseToken?.symbol}/{opportunities[0]?.quoteToken?.symbol}
                        </p>
                      </div>

                      <Button
                        onClick={() => handleExecuteTrade(opportunities[0]?.id)}
                        disabled={isExecuting || !botState.running}
                        className="w-full"
                      >
                        {isExecuting ? "Executing..." : "Execute Best Opportunity"}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No opportunities available</p>
                      <p className="text-sm">Run a scan to find arbitrage opportunities</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                    <span className="text-sm">Security Status</span>
                    <Badge variant={botState.securityStatus.includes("Normal") ? "default" : "destructive"}>
                      {botState.securityStatus.includes("Normal") ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {botState.securityStatus.replace("🟢 ", "").replace("🔴 ", "")}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Consecutive Failures</span>
                    <Badge variant={botState.consecutiveFailures > 3 ? "destructive" : "secondary"}>
                      {botState.consecutiveFailures}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfitChart />

            <Card>
              <CardHeader>
                <CardTitle>Trading Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{autoExecutionStats.successfulExecutions}</div>
                    <div className="text-sm text-muted-foreground">Successful Trades</div>
                  </div>

                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-red-500">{autoExecutionStats.failedExecutions}</div>
                    <div className="text-sm text-muted-foreground">Failed Trades</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Profit</span>
                    <span className="font-medium">${autoExecutionStats.totalProfit.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm">Avg Profit/Trade</span>
                    <span className="font-medium">${performanceMetrics.avgProfitPerTrade}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm">Profit/Hour</span>
                    <span className="font-medium">${performanceMetrics.profitPerHour}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium">{performanceMetrics.successRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mev-protection">
          <MEVProtectionPanel />
        </TabsContent>

        <TabsContent value="gas-optimization">
          <GasOptimizationPanel />
        </TabsContent>
      </Tabs>

      {/* Alerts */}
      {botState.consecutiveFailures >= 3 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> {botState.consecutiveFailures} consecutive execution failures detected. Consider
            reviewing your settings or stopping the bot.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default TradingPanel
