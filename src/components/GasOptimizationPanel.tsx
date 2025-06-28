"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
} from "lucide-react"
import { useBot } from "../contexts/BotContext"
import { useWeb3 } from "../contexts/Web3Context"

const GasOptimizationPanel: React.FC = () => {
  const { botState } = useBot()
  const { web3, gasPrice } = useWeb3()

  const [gasMetrics, setGasMetrics] = useState({
    currentGasPrice: 0.1,
    recommendedGasPrice: 0.12,
    priorityFee: 0.01,
    networkCongestion: 25,
    averageConfirmationTime: 15,
    mevRiskLevel: 30,
    volatility: 15,
    confidence: 85,
  })

  const [gasConfig, setGasConfig] = useState({
    minGasPrice: 0.01,
    maxGasPrice: 500,
    targetConfirmationTime: 30,
    mevProtectionMultiplier: 1.5,
    priorityFeeEnabled: true,
    maxPriorityFee: 10,
    aggressiveMode: false,
  })

  const [strategies] = useState([
    {
      name: "Economy",
      description: "Lowest cost, longer confirmation (5-10 blocks)",
      gasPrice: 0.08,
      priorityFee: 0.005,
      estimatedCost: 0.15,
      confirmationTime: 120,
      effectiveness: 70,
    },
    {
      name: "Standard",
      description: "Balanced approach (2-5 blocks)",
      gasPrice: 0.12,
      priorityFee: 0.01,
      estimatedCost: 0.22,
      confirmationTime: 45,
      effectiveness: 85,
    },
    {
      name: "Fast",
      description: "Higher gas for faster confirmation (1-2 blocks)",
      gasPrice: 0.18,
      priorityFee: 0.02,
      estimatedCost: 0.35,
      confirmationTime: 20,
      effectiveness: 92,
    },
    {
      name: "Aggressive",
      description: "Premium gas for immediate inclusion",
      gasPrice: 0.25,
      priorityFee: 0.03,
      estimatedCost: 0.48,
      confirmationTime: 15,
      effectiveness: 95,
    },
    {
      name: "MEV Protection",
      description: "Maximum gas to prevent MEV attacks",
      gasPrice: 0.35,
      priorityFee: 0.05,
      estimatedCost: 0.68,
      confirmationTime: 12,
      effectiveness: 98,
    },
  ])

  const [selectedStrategy, setSelectedStrategy] = useState("Standard")
  const [predictions, setPredictions] = useState({
    nextBlockGasPrice: 0.13,
    next5BlocksGasPrice: 0.15,
    confidence: 78,
    trend: "increasing" as "increasing" | "decreasing" | "stable",
    volatilityScore: 22,
  })

  const [networkStats, setNetworkStats] = useState({
    averageGasPrice: 0.12,
    medianGasPrice: 0.11,
    averagePriorityFee: 0.01,
    volatility: 18,
    congestionLevel: 35,
    mevEvents: 12,
    blockUtilization: 78,
    pendingTransactions: 2500,
    confirmationTime: 18,
  })

  useEffect(() => {
    // Simulate real-time gas metrics updates
    const interval = setInterval(() => {
      setGasMetrics((prev) => ({
        ...prev,
        currentGasPrice: Math.max(0.01, prev.currentGasPrice + (Math.random() - 0.5) * 0.02),
        networkCongestion: Math.max(0, Math.min(100, prev.networkCongestion + (Math.random() - 0.5) * 10)),
        mevRiskLevel: Math.max(0, Math.min(100, prev.mevRiskLevel + (Math.random() - 0.5) * 15)),
      }))
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getStrategyColor = (effectiveness: number) => {
    if (effectiveness >= 95) return "bg-green-500"
    if (effectiveness >= 85) return "bg-blue-500"
    if (effectiveness >= 75) return "bg-yellow-500"
    return "bg-gray-500"
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-red-500" />
      case "decreasing":
        return <TrendingDown className="w-4 h-4 text-green-500" />
      default:
        return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  const getCongestionColor = (level: number) => {
    if (level > 80) return "text-red-500"
    if (level > 50) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Gas Optimization Center
          </CardTitle>
          <CardDescription>
            Advanced gas price optimization and network monitoring for maximum efficiency
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Gas Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Gas</p>
                    <p className="text-2xl font-bold">{gasMetrics.currentGasPrice.toFixed(3)} Gwei</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Recommended</p>
                    <p className="text-2xl font-bold">{gasMetrics.recommendedGasPrice.toFixed(3)} Gwei</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gauge className={`h-5 w-5 ${getCongestionColor(gasMetrics.networkCongestion)}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Congestion</p>
                    <p className="text-2xl font-bold">{gasMetrics.networkCongestion.toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Confirmation</p>
                    <p className="text-2xl font-bold">{gasMetrics.averageConfirmationTime}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gas Price Prediction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Gas Price Prediction
              </CardTitle>
              <CardDescription>AI-powered gas price forecasting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Next Block</Label>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(predictions.trend)}
                      <span className="font-medium">{predictions.nextBlockGasPrice.toFixed(3)} Gwei</span>
                    </div>
                  </div>
                  <Progress value={predictions.confidence} className="h-2" />
                  <p className="text-xs text-muted-foreground">Confidence: {predictions.confidence}%</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Next 5 Blocks</Label>
                    <span className="font-medium">{predictions.next5BlocksGasPrice.toFixed(3)} Gwei</span>
                  </div>
                  <Progress value={Math.max(0, predictions.confidence - 10)} className="h-2" />
                  <p className="text-xs text-muted-foreground">Trend: {predictions.trend}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Volatility Score</Label>
                    <span className="font-medium">{predictions.volatilityScore}%</span>
                  </div>
                  <Progress value={predictions.volatilityScore} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {predictions.volatilityScore > 30 ? "High volatility" : "Stable conditions"}
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommendation:</strong>{" "}
                  {predictions.trend === "increasing"
                    ? "Gas prices are rising. Consider using a higher strategy for time-sensitive trades."
                    : predictions.trend === "decreasing"
                      ? "Gas prices are falling. Economy strategy may be sufficient for non-urgent trades."
                      : "Gas prices are stable. Standard strategy recommended for most trades."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* MEV Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                MEV Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Current MEV Risk Level</span>
                  <span className="text-sm text-muted-foreground">{gasMetrics.mevRiskLevel}%</span>
                </div>
                <Progress
                  value={gasMetrics.mevRiskLevel}
                  className={`h-3 ${gasMetrics.mevRiskLevel > 70 ? "bg-red-100" : gasMetrics.mevRiskLevel > 40 ? "bg-yellow-100" : "bg-green-100"}`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low Risk</span>
                  <span>High Risk</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold">{networkStats.mevEvents}</div>
                  <div className="text-sm text-muted-foreground">MEV Events (1h)</div>
                </div>

                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold">{gasMetrics.volatility}%</div>
                  <div className="text-sm text-muted-foreground">Price Volatility</div>
                </div>
              </div>

              {gasMetrics.mevRiskLevel > 70 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>High MEV Risk Detected!</strong> Consider using MEV Protection strategy or private mempool
                    submission.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gas Strategy Selection</CardTitle>
              <CardDescription>Choose the optimal gas strategy for your trading needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {strategies.map((strategy) => (
                  <Card
                    key={strategy.name}
                    className={`cursor-pointer transition-all ${selectedStrategy === strategy.name ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => setSelectedStrategy(strategy.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{strategy.name}</h3>
                        <Badge className={getStrategyColor(strategy.effectiveness)}>
                          {strategy.effectiveness}% effective
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Gas Price:</span>
                          <span className="ml-1 font-medium">{strategy.gasPrice} Gwei</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Priority:</span>
                          <span className="ml-1 font-medium">{strategy.priorityFee} Gwei</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Cost:</span>
                          <span className="ml-1 font-medium">${strategy.estimatedCost}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time:</span>
                          <span className="ml-1 font-medium">{strategy.confirmationTime}s</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4">
                <div>
                  <Label className="text-base font-medium">Selected Strategy: {selectedStrategy}</Label>
                  <p className="text-sm text-muted-foreground">
                    {strategies.find((s) => s.name === selectedStrategy)?.description}
                  </p>
                </div>
                <Button>Apply Strategy</Button>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy Comparison</CardTitle>
              <CardDescription>Compare costs and performance across different strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategies.map((strategy) => (
                  <div key={strategy.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStrategyColor(strategy.effectiveness)}`} />
                      <div>
                        <span className="font-medium">{strategy.name}</span>
                        <p className="text-xs text-muted-foreground">{strategy.confirmationTime}s avg</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{strategy.gasPrice} Gwei</div>
                        <div className="text-xs text-muted-foreground">Gas Price</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">${strategy.estimatedCost}</div>
                        <div className="text-xs text-muted-foreground">Est. Cost</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{strategy.effectiveness}%</div>
                        <div className="text-xs text-muted-foreground">Effectiveness</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Network Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Network Analytics
              </CardTitle>
              <CardDescription>Comprehensive network performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Gas Price Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Average</span>
                      <span className="font-medium">{networkStats.averageGasPrice.toFixed(3)} Gwei</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Median</span>
                      <span className="font-medium">{networkStats.medianGasPrice.toFixed(3)} Gwei</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Priority Fee</span>
                      <span className="font-medium">{networkStats.averagePriorityFee.toFixed(3)} Gwei</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Volatility</span>
                      <span className="font-medium">{networkStats.volatility}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Network Activity</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Congestion Level</span>
                      <span className={`font-medium ${getCongestionColor(networkStats.congestionLevel)}`}>
                        {networkStats.congestionLevel}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Block Utilization</span>
                      <span className="font-medium">{networkStats.blockUtilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pending Transactions</span>
                      <span className="font-medium">{networkStats.pendingTransactions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Confirmation</span>
                      <span className="font-medium">{networkStats.confirmationTime}s</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">MEV Activity</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">MEV Events (1h)</span>
                      <span className="font-medium">{networkStats.mevEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Risk Level</span>
                      <Badge
                        variant={
                          gasMetrics.mevRiskLevel > 70
                            ? "destructive"
                            : gasMetrics.mevRiskLevel > 40
                              ? "secondary"
                              : "default"
                        }
                      >
                        {gasMetrics.mevRiskLevel > 70 ? "High" : gasMetrics.mevRiskLevel > 40 ? "Medium" : "Low"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Protection Active</span>
                      <Badge variant="default">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Yes
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gas Usage History */}
          <Card>
            <CardHeader>
              <CardTitle>Gas Usage History</CardTitle>
              <CardDescription>Your recent gas optimization performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">$12.45</div>
                    <div className="text-sm text-muted-foreground">Total Saved (24h)</div>
                  </div>

                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">0.125</div>
                    <div className="text-sm text-muted-foreground">Avg Gas Price</div>
                  </div>

                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">18s</div>
                    <div className="text-sm text-muted-foreground">Avg Confirmation</div>
                  </div>

                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">94%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Recent Optimizations</h4>
                  <div className="space-y-2">
                    {[
                      { time: "2 min ago", strategy: "Fast", saved: "$0.15", status: "success" },
                      { time: "5 min ago", strategy: "Standard", saved: "$0.08", status: "success" },
                      { time: "8 min ago", strategy: "MEV Protection", saved: "$0.22", status: "success" },
                      { time: "12 min ago", strategy: "Economy", saved: "$0.05", status: "success" },
                    ].map((opt, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{opt.strategy} strategy</span>
                          <span className="text-xs text-muted-foreground">{opt.time}</span>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          Saved {opt.saved}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gas Optimization Settings</CardTitle>
              <CardDescription>Configure gas optimization parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="minGasPrice">Minimum Gas Price (Gwei)</Label>
                    <Input
                      id="minGasPrice"
                      type="number"
                      step="0.001"
                      value={gasConfig.minGasPrice}
                      onChange={(e) =>
                        setGasConfig({ ...gasConfig, minGasPrice: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxGasPrice">Maximum Gas Price (Gwei)</Label>
                    <Input
                      id="maxGasPrice"
                      type="number"
                      step="0.1"
                      value={gasConfig.maxGasPrice}
                      onChange={(e) =>
                        setGasConfig({ ...gasConfig, maxGasPrice: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetConfirmationTime">Target Confirmation Time (seconds)</Label>
                    <Input
                      id="targetConfirmationTime"
                      type="number"
                      value={gasConfig.targetConfirmationTime}
                      onChange={(e) =>
                        setGasConfig({ ...gasConfig, targetConfirmationTime: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mevProtectionMultiplier">MEV Protection Multiplier</Label>
                    <Input
                      id="mevProtectionMultiplier"
                      type="number"
                      step="0.1"
                      value={gasConfig.mevProtectionMultiplier}
                      onChange={(e) =>
                        setGasConfig({ ...gasConfig, mevProtectionMultiplier: Number.parseFloat(e.target.value) || 1 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPriorityFee">Maximum Priority Fee (Gwei)</Label>
                    <Input
                      id="maxPriorityFee"
                      type="number"
                      step="0.001"
                      value={gasConfig.maxPriorityFee}
                      onChange={(e) =>
                        setGasConfig({ ...gasConfig, maxPriorityFee: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Priority Fee Enabled</Label>
                      <p className="text-sm text-muted-foreground">Use EIP-1559 priority fees</p>
                    </div>
                    <Switch
                      checked={gasConfig.priorityFeeEnabled}
                      onCheckedChange={(checked) => setGasConfig({ ...gasConfig, priorityFeeEnabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Aggressive Mode</Label>
                      <p className="text-sm text-muted-foreground">Use maximum gas for critical trades</p>
                    </div>
                    <Switch
                      checked={gasConfig.aggressiveMode}
                      onCheckedChange={(checked) => setGasConfig({ ...gasConfig, aggressiveMode: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Auto-optimization</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically adjust gas prices based on network conditions
                  </p>
                </div>
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GasOptimizationPanel
