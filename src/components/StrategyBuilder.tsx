"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Target, Settings, Play, Save, Copy, Trash2, Plus, AlertTriangle, CheckCircle } from "lucide-react"

interface Strategy {
  id: string
  name: string
  description: string
  minProfitThreshold: number
  maxSlippage: number
  gasLimit: number
  enabledExchanges: string[]
  enabledTokens: string[]
  riskLevel: "low" | "medium" | "high"
  autoExecute: boolean
  maxTradeSize: number
  isActive: boolean
}

const defaultStrategy: Omit<Strategy, "id"> = {
  name: "",
  description: "",
  minProfitThreshold: 10,
  maxSlippage: 0.5,
  gasLimit: 500000,
  enabledExchanges: ["uniswap", "sushiswap"],
  enabledTokens: ["WETH", "USDC"],
  riskLevel: "medium",
  autoExecute: false,
  maxTradeSize: 1000,
  isActive: false,
}

export default function StrategyBuilder() {
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: "1",
      name: "Conservative Arbitrage",
      description: "Low-risk strategy focusing on stable pairs",
      minProfitThreshold: 15,
      maxSlippage: 0.3,
      gasLimit: 400000,
      enabledExchanges: ["uniswap", "sushiswap"],
      enabledTokens: ["WETH", "USDC", "USDT"],
      riskLevel: "low",
      autoExecute: true,
      maxTradeSize: 500,
      isActive: true,
    },
    {
      id: "2",
      name: "Aggressive Trading",
      description: "High-risk, high-reward strategy",
      minProfitThreshold: 5,
      maxSlippage: 1.0,
      gasLimit: 600000,
      enabledExchanges: ["uniswap", "sushiswap", "balancer"],
      enabledTokens: ["WETH", "WBTC", "ARB"],
      riskLevel: "high",
      autoExecute: false,
      maxTradeSize: 2000,
      isActive: false,
    },
  ])

  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState<Omit<Strategy, "id">>(defaultStrategy)

  const handleCreateStrategy = () => {
    setEditingStrategy(defaultStrategy)
    setIsEditing(true)
    setCurrentStrategy(null)
  }

  const handleEditStrategy = (strategy: Strategy) => {
    setEditingStrategy(strategy)
    setIsEditing(true)
    setCurrentStrategy(strategy)
  }

  const handleSaveStrategy = () => {
    if (currentStrategy) {
      // Update existing strategy
      setStrategies((prev) =>
        prev.map((s) => (s.id === currentStrategy.id ? { ...editingStrategy, id: currentStrategy.id } : s)),
      )
    } else {
      // Create new strategy
      const newStrategy: Strategy = {
        ...editingStrategy,
        id: Date.now().toString(),
      }
      setStrategies((prev) => [...prev, newStrategy])
    }
    setIsEditing(false)
    setCurrentStrategy(null)
  }

  const handleDeleteStrategy = (id: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id))
  }

  const handleToggleStrategy = (id: string) => {
    setStrategies((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)))
  }

  const handleDuplicateStrategy = (strategy: Strategy) => {
    const newStrategy: Strategy = {
      ...strategy,
      id: Date.now().toString(),
      name: `${strategy.name} (Copy)`,
      isActive: false,
    }
    setStrategies((prev) => [...prev, newStrategy])
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-600"
      case "medium":
        return "text-yellow-600"
      case "high":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case "low":
        return "default"
      case "medium":
        return "secondary"
      case "high":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Strategy Builder</h1>
          <p className="text-muted-foreground">Create and manage your arbitrage trading strategies</p>
        </div>
        <Button onClick={handleCreateStrategy}>
          <Plus className="w-4 h-4 mr-2" />
          New Strategy
        </Button>
      </div>

      {isEditing ? (
        /* Strategy Editor */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {currentStrategy ? "Edit Strategy" : "Create New Strategy"}
            </CardTitle>
            <CardDescription>Configure your arbitrage trading parameters and risk management settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="risk">Risk Management</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Strategy Name</Label>
                    <Input
                      id="name"
                      value={editingStrategy.name}
                      onChange={(e) => setEditingStrategy((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter strategy name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="riskLevel">Risk Level</Label>
                    <Select
                      value={editingStrategy.riskLevel}
                      onValueChange={(value: "low" | "medium" | "high") =>
                        setEditingStrategy((prev) => ({ ...prev, riskLevel: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={editingStrategy.description}
                    onChange={(e) => setEditingStrategy((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your strategy"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Min Profit Threshold: ${editingStrategy.minProfitThreshold}</Label>
                    <Slider
                      value={[editingStrategy.minProfitThreshold]}
                      onValueChange={(value) =>
                        setEditingStrategy((prev) => ({ ...prev, minProfitThreshold: value[0] }))
                      }
                      max={100}
                      min={1}
                      step={1}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Max Slippage: {editingStrategy.maxSlippage}%</Label>
                    <Slider
                      value={[editingStrategy.maxSlippage]}
                      onValueChange={(value) => setEditingStrategy((prev) => ({ ...prev, maxSlippage: value[0] }))}
                      max={5}
                      min={0.1}
                      step={0.1}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoExecute"
                    checked={editingStrategy.autoExecute}
                    onCheckedChange={(checked) => setEditingStrategy((prev) => ({ ...prev, autoExecute: checked }))}
                  />
                  <Label htmlFor="autoExecute">Enable automatic execution</Label>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxTradeSize">Max Trade Size ($)</Label>
                    <Input
                      id="maxTradeSize"
                      type="number"
                      value={editingStrategy.maxTradeSize}
                      onChange={(e) =>
                        setEditingStrategy((prev) => ({ ...prev, maxTradeSize: Number(e.target.value) }))
                      }
                      min="100"
                      max="10000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gasLimit">Gas Limit</Label>
                    <Input
                      id="gasLimit"
                      type="number"
                      value={editingStrategy.gasLimit}
                      onChange={(e) => setEditingStrategy((prev) => ({ ...prev, gasLimit: Number(e.target.value) }))}
                      min="100000"
                      max="1000000"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Enabled Exchanges</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {["uniswap", "sushiswap", "balancer", "curve", "1inch"].map((exchange) => (
                      <div key={exchange} className="flex items-center space-x-2">
                        <Switch
                          id={exchange}
                          checked={editingStrategy.enabledExchanges.includes(exchange)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEditingStrategy((prev) => ({
                                ...prev,
                                enabledExchanges: [...prev.enabledExchanges, exchange],
                              }))
                            } else {
                              setEditingStrategy((prev) => ({
                                ...prev,
                                enabledExchanges: prev.enabledExchanges.filter((e) => e !== exchange),
                              }))
                            }
                          }}
                        />
                        <Label htmlFor={exchange} className="text-sm capitalize">
                          {exchange}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Monitored Tokens</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["WETH", "USDC", "USDT", "WBTC", "DAI", "ARB", "GMX", "GRT"].map((token) => (
                      <div key={token} className="flex items-center space-x-2">
                        <Switch
                          id={token}
                          checked={editingStrategy.enabledTokens.includes(token)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEditingStrategy((prev) => ({
                                ...prev,
                                enabledTokens: [...prev.enabledTokens, token],
                              }))
                            } else {
                              setEditingStrategy((prev) => ({
                                ...prev,
                                enabledTokens: prev.enabledTokens.filter((t) => t !== token),
                              }))
                            }
                          }}
                        />
                        <Label htmlFor={token} className="text-sm">
                          {token}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Risk management settings help protect your capital. Higher risk levels may yield higher profits but
                    also increase potential losses.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Risk Assessment</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Profit Threshold:</span>
                        <span
                          className={
                            editingStrategy.minProfitThreshold > 20
                              ? "text-green-600"
                              : editingStrategy.minProfitThreshold > 10
                                ? "text-yellow-600"
                                : "text-red-600"
                          }
                        >
                          {editingStrategy.minProfitThreshold > 20
                            ? "Conservative"
                            : editingStrategy.minProfitThreshold > 10
                              ? "Moderate"
                              : "Aggressive"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Slippage Tolerance:</span>
                        <span
                          className={
                            editingStrategy.maxSlippage < 0.5
                              ? "text-green-600"
                              : editingStrategy.maxSlippage < 1
                                ? "text-yellow-600"
                                : "text-red-600"
                          }
                        >
                          {editingStrategy.maxSlippage < 0.5
                            ? "Low Risk"
                            : editingStrategy.maxSlippage < 1
                              ? "Medium Risk"
                              : "High Risk"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trade Size:</span>
                        <span
                          className={
                            editingStrategy.maxTradeSize < 1000
                              ? "text-green-600"
                              : editingStrategy.maxTradeSize < 2000
                                ? "text-yellow-600"
                                : "text-red-600"
                          }
                        >
                          {editingStrategy.maxTradeSize < 1000
                            ? "Conservative"
                            : editingStrategy.maxTradeSize < 2000
                              ? "Moderate"
                              : "Aggressive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStrategy}>
                <Save className="w-4 h-4 mr-2" />
                Save Strategy
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Strategy List */
        <div className="space-y-4">
          {strategies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No strategies created</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first arbitrage strategy to get started
                </p>
                <Button onClick={handleCreateStrategy}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Strategy
                </Button>
              </CardContent>
            </Card>
          ) : (
            strategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${strategy.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                      <div>
                        <CardTitle className="text-lg">{strategy.name}</CardTitle>
                        <CardDescription>{strategy.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRiskBadgeVariant(strategy.riskLevel)}>{strategy.riskLevel} risk</Badge>
                      {strategy.isActive && (
                        <Badge variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Min Profit</div>
                      <div className="font-medium">${strategy.minProfitThreshold}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Max Slippage</div>
                      <div className="font-medium">{strategy.maxSlippage}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Max Trade Size</div>
                      <div className="font-medium">${strategy.maxTradeSize}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Auto Execute</div>
                      <div className="font-medium">{strategy.autoExecute ? "Yes" : "No"}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Exchanges:</span>
                      <div className="flex gap-1">
                        {strategy.enabledExchanges.slice(0, 3).map((exchange) => (
                          <Badge key={exchange} variant="outline" className="text-xs">
                            {exchange}
                          </Badge>
                        ))}
                        {strategy.enabledExchanges.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{strategy.enabledExchanges.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleStrategy(strategy.id)}>
                        {strategy.isActive ? (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDuplicateStrategy(strategy)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditStrategy(strategy)}>
                        <Settings className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteStrategy(strategy.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
