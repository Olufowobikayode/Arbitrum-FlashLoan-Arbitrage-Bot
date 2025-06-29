"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Square, AlertTriangle, Target, Settings, Zap, RefreshCw, Activity } from "lucide-react"
import { useBot } from "@/src/contexts/BotContext"
import { useWeb3 } from "@/src/contexts/Web3Context"
import toast from "react-hot-toast"

export default function TradingPanel() {
  const {
    botState,
    opportunities,
    isScanning,
    startBot,
    stopBot,
    emergencyStop,
    scanForOpportunities,
    executeArbitrage,
    updateBotConfig,
  } = useBot()

  const { isConnected } = useWeb3()
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null)
  const [tradingSettings, setTradingSettings] = useState({
    minProfitThreshold: botState.minProfitThreshold,
    maxSlippage: botState.maxSlippage,
    autoExecute: botState.autoExecuteEnabled,
    riskLevel: botState.riskLevel,
  })

  const handleStartBot = async () => {
    try {
      await startBot()
      toast.success("Trading bot started successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to start bot")
    }
  }

  const handleStopBot = () => {
    stopBot()
    toast.success("Trading bot stopped")
  }

  const handleEmergencyStop = () => {
    emergencyStop()
    toast.error("Emergency stop activated!")
  }

  const handleScanNow = async () => {
    try {
      await scanForOpportunities()
      toast.success("Market scan completed")
    } catch (error) {
      toast.error("Scan failed")
    }
  }

  const handleExecuteTrade = async (opportunityId: string) => {
    const opportunity = opportunities.find((opp) => opp.id === opportunityId)
    if (!opportunity) return

    try {
      await executeArbitrage(opportunity)
      toast.success(`Trade executed: +$${opportunity.profitUsd.toFixed(2)}`)
    } catch (error: any) {
      toast.error(error.message || "Trade execution failed")
    }
  }

  const handleSettingsUpdate = () => {
    updateBotConfig({
      minProfitThreshold: tradingSettings.minProfitThreshold,
      maxSlippage: tradingSettings.maxSlippage,
      autoExecuteEnabled: tradingSettings.autoExecute,
      riskLevel: tradingSettings.riskLevel,
    })
    toast.success("Trading settings updated")
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    return `${Math.floor(diffInMinutes / 60)}h ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading Panel</h1>
          <p className="text-muted-foreground">Monitor and control your arbitrage trading operations</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={botState.running ? "default" : "secondary"}>{botState.running ? "Active" : "Inactive"}</Badge>
          <Badge variant={isConnected ? "default" : "destructive"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
        </div>
      </div>

      {/* Bot Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Bot Controls
          </CardTitle>
          <CardDescription>Start, stop, and manage your trading bot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {!botState.running ? (
              <Button onClick={handleStartBot} disabled={!isConnected} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start Trading
              </Button>
            ) : (
              <Button onClick={handleStopBot} variant="outline" className="flex items-center gap-2 bg-transparent">
                <Square className="w-4 h-4" />
                Stop Trading
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
              <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "Scanning..." : "Manual Scan"}
            </Button>
          </div>

          {!isConnected && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Please connect your wallet to start trading.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Active Opportunities
                <Badge variant="secondary">{opportunities.length}</Badge>
              </CardTitle>
              <CardDescription>Current arbitrage opportunities detected by the bot</CardDescription>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No opportunities found</p>
                  <p className="text-sm">
                    {botState.running ? "Bot is scanning for opportunities..." : "Start the bot to begin scanning"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {opportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedOpportunity === opportunity.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedOpportunity(opportunity.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {opportunity.tokenA}/{opportunity.tokenB}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {(opportunity.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {opportunity.exchangeA} → {opportunity.exchangeB}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Liquidity: ${opportunity.liquidity.toLocaleString()} • Gas:{" "}
                            {opportunity.gasEstimate.toFixed(4)} ETH
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-green-500 text-lg">+${opportunity.profitUsd.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {opportunity.profitPercentage.toFixed(2)}% profit
                          </div>
                          <div className="text-xs text-muted-foreground">{formatTimeAgo(opportunity.timestamp)}</div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-3">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExecuteTrade(opportunity.id)
                          }}
                          disabled={!isConnected || !botState.running}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Execute
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings & Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Profit</span>
                <span className="font-medium text-green-500">${botState.totalProfit.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="font-medium">{botState.successRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Trades</span>
                <span className="font-medium">{botState.totalTrades}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Gas Used</span>
                <span className="font-medium">{botState.gasUsed.toFixed(3)} ETH</span>
              </div>
            </CardContent>
          </Card>

          {/* Trading Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4" />
                Trading Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-profit">Min Profit Threshold ($)</Label>
                <Input
                  id="min-profit"
                  type="number"
                  value={tradingSettings.minProfitThreshold}
                  onChange={(e) =>
                    setTradingSettings((prev) => ({
                      ...prev,
                      minProfitThreshold: Number(e.target.value),
                    }))
                  }
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-slippage">Max Slippage (%)</Label>
                <Input
                  id="max-slippage"
                  type="number"
                  value={tradingSettings.maxSlippage}
                  onChange={(e) =>
                    setTradingSettings((prev) => ({
                      ...prev,
                      maxSlippage: Number(e.target.value),
                    }))
                  }
                  min="0.1"
                  max="5"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk-level">Risk Level</Label>
                <Select
                  value={tradingSettings.riskLevel}
                  onValueChange={(value) =>
                    setTradingSettings((prev) => ({
                      ...prev,
                      riskLevel: value as "low" | "medium" | "high",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-execute">Auto Execute</Label>
                <Switch
                  id="auto-execute"
                  checked={tradingSettings.autoExecute}
                  onCheckedChange={(checked) =>
                    setTradingSettings((prev) => ({
                      ...prev,
                      autoExecute: checked,
                    }))
                  }
                />
              </div>

              <Button onClick={handleSettingsUpdate} className="w-full" size="sm">
                Update Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
