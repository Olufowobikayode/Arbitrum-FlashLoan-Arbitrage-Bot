"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Copy, Target, BarChart3, Code, Save, Download, Upload, TestTube, Edit } from "lucide-react"
import {
  TradingStrategyService,
  type TradingStrategy,
  type TradingRule,
  type StrategyParameters,
  type RiskManagement,
  type BacktestResult,
} from "../services/TradingStrategyService"

interface StrategyBuilderProps {
  onStrategyCreated?: (strategyId: string) => void
  onStrategyUpdated?: (strategyId: string) => void
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ onStrategyCreated, onStrategyUpdated }) => {
  const [strategyService] = useState(() => new TradingStrategyService())
  const [strategies, setStrategies] = useState<TradingStrategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [backTestResults, setBackTestResults] = useState<BacktestResult | null>(null)

  // Form state for creating/editing strategies
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "arbitrage" as TradingStrategy["type"],
    parameters: {
      minProfitThreshold: 50,
      maxSlippagePercent: 1.5,
      maxPositionSize: 10000,
      maxGasPrice: 200,
      timeframe: "1m",
      targetPairs: ["WETH/USDC"],
      excludedPairs: [],
      minLiquidity: 100000,
      maxSpread: 5,
      confidenceThreshold: 70,
    } as StrategyParameters,
    rules: [] as TradingRule[],
    riskManagement: {
      maxDailyLoss: 500,
      maxDrawdown: 20,
      positionSizing: "fixed" as const,
      stopLoss: 5,
      takeProfit: 2,
      maxConcurrentTrades: 3,
      cooldownPeriod: 60,
    } as RiskManagement,
  })

  const [newRule, setNewRule] = useState({
    name: "",
    type: "entry" as TradingRule["type"],
    condition: "",
    action: "",
    priority: 5,
    isActive: true,
    parameters: {},
  })

  useEffect(() => {
    loadStrategies()
    strategyService.startStrategyEngine()

    return () => {
      strategyService.stopStrategyEngine()
    }
  }, [strategyService])

  const loadStrategies = () => {
    const allStrategies = strategyService.getStrategies()
    setStrategies(allStrategies)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "arbitrage",
      parameters: {
        minProfitThreshold: 50,
        maxSlippagePercent: 1.5,
        maxPositionSize: 10000,
        maxGasPrice: 200,
        timeframe: "1m",
        targetPairs: ["WETH/USDC"],
        excludedPairs: [],
        minLiquidity: 100000,
        maxSpread: 5,
        confidenceThreshold: 70,
      },
      rules: [],
      riskManagement: {
        maxDailyLoss: 500,
        maxDrawdown: 20,
        positionSizing: "fixed",
        stopLoss: 5,
        takeProfit: 2,
        maxConcurrentTrades: 3,
        cooldownPeriod: 60,
      },
    })
    setSelectedStrategy(null)
    setIsEditing(false)
    setIsCreating(false)
  }

  const handleCreateStrategy = () => {
    setIsCreating(true)
    resetForm()
  }

  const handleEditStrategy = (strategy: TradingStrategy) => {
    setSelectedStrategy(strategy)
    setFormData({
      name: strategy.name,
      description: strategy.description,
      type: strategy.type,
      parameters: { ...strategy.parameters },
      rules: [...strategy.rules],
      riskManagement: { ...strategy.riskManagement },
    })
    setIsEditing(true)
    setIsCreating(false)
  }

  const handleSaveStrategy = () => {
    if (isEditing && selectedStrategy) {
      // Update existing strategy
      const success = strategyService.updateStrategy(selectedStrategy.id, {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        parameters: formData.parameters,
        rules: formData.rules,
        riskManagement: formData.riskManagement,
      })

      if (success) {
        onStrategyUpdated?.(selectedStrategy.id)
        loadStrategies()
        resetForm()
      }
    } else {
      // Create new strategy
      const strategyId = strategyService.createStrategy(
        formData.name,
        formData.description,
        formData.type,
        formData.parameters,
        formData.rules,
        formData.riskManagement,
      )

      onStrategyCreated?.(strategyId)
      loadStrategies()
      resetForm()
    }
  }

  const handleDeleteStrategy = (strategyId: string) => {
    if (confirm("Are you sure you want to delete this strategy?")) {
      strategyService.deleteStrategy(strategyId)
      loadStrategies()
      if (selectedStrategy?.id === strategyId) {
        resetForm()
      }
    }
  }

  const handleCloneStrategy = (strategy: TradingStrategy) => {
    const newId = strategyService.cloneStrategy(strategy.id)
    if (newId) {
      loadStrategies()
    }
  }

  const handleToggleStrategy = (strategyId: string, isActive: boolean) => {
    if (isActive) {
      strategyService.activateStrategy(strategyId)
    } else {
      strategyService.deactivateStrategy(strategyId)
    }
    loadStrategies()
  }

  const handleAddRule = () => {
    if (!newRule.name || !newRule.condition || !newRule.action) return

    const rule: TradingRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...newRule,
    }

    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, rule],
    }))

    setNewRule({
      name: "",
      type: "entry",
      condition: "",
      action: "",
      priority: 5,
      isActive: true,
      parameters: {},
    })
  }

  const handleRemoveRule = (ruleId: string) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((rule) => rule.id !== ruleId),
    }))
  }

  const handleUpdateRule = (ruleId: string, updates: Partial<TradingRule>) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
    }))
  }

  const handleBacktest = async (strategy: TradingStrategy) => {
    setIsTesting(true)
    try {
      const endDate = Date.now()
      const startDate = endDate - 30 * 24 * 60 * 60 * 1000 // 30 days ago

      const results = await strategyService.backtestStrategy(strategy.id, startDate, endDate)
      setBackTestResults(results)
    } catch (error) {
      console.error("Backtest failed:", error)
    } finally {
      setIsTesting(false)
    }
  }

  const handleExportStrategy = (strategy: TradingStrategy) => {
    const exported = strategyService.exportStrategy(strategy.id)
    if (exported) {
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `strategy_${strategy.name.replace(/\s+/g, "_")}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImportStrategy = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const strategy = JSON.parse(e.target?.result as string)
        strategyService.importStrategy(strategy)
        loadStrategies()
      } catch (error) {
        console.error("Import failed:", error)
      }
    }
    reader.readAsText(file)
  }

  const ruleTemplates = [
    {
      name: "price_spread",
      label: "Price Spread",
      description: "Check minimum price spread between DEXes",
      condition: "spread >= minSpread",
      action: "generate_buy_signal",
      parameters: { minSpread: 0.5 },
    },
    {
      name: "liquidity_check",
      label: "Liquidity Filter",
      description: "Ensure minimum liquidity is available",
      condition: "liquidity >= minLiquidity",
      action: "allow_trade",
      parameters: { minLiquidity: 100000 },
    },
    {
      name: "gas_price_check",
      label: "Gas Price Filter",
      description: "Check gas price is within limits",
      condition: "gasPrice <= maxGasPrice",
      action: "allow_trade",
      parameters: { maxGasPrice: 200 },
    },
    {
      name: "volume_filter",
      label: "Volume Filter",
      description: "Check minimum 24h trading volume",
      condition: "volume >= minVolume",
      action: "allow_trade",
      parameters: { minVolume: 50000 },
    },
    {
      name: "volatility_filter",
      label: "Volatility Filter",
      description: "Limit trades during high volatility",
      condition: "volatility <= maxVolatility",
      action: "allow_trade",
      parameters: { maxVolatility: 10 },
    },
    {
      name: "time_filter",
      label: "Time Filter",
      description: "Restrict trading to specific hours",
      condition: "hour >= startHour && hour <= endHour",
      action: "allow_trade",
      parameters: { startHour: 9, endHour: 17 },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Strategy Builder
          </CardTitle>
          <CardDescription>Create, edit, and manage custom trading strategies with visual rule builder</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button onClick={handleCreateStrategy} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Strategy
            </Button>

            <input type="file" accept=".json" onChange={handleImportStrategy} className="hidden" id="import-strategy" />
            <Button variant="outline" onClick={() => document.getElementById("import-strategy")?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategies</CardTitle>
              <CardDescription>Manage your trading strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{strategy.name}</h4>
                      <p className="text-xs text-muted-foreground">{strategy.type}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={strategy.isActive ? "default" : "secondary"}>
                        {strategy.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Win Rate: {strategy.performance.winRate.toFixed(1)}%</span>
                    <span>Trades: {strategy.performance.totalTrades}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEditStrategy(strategy)} className="h-6 px-2">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCloneStrategy(strategy)}
                      className="h-6 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleBacktest(strategy)} className="h-6 px-2">
                      <TestTube className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExportStrategy(strategy)}
                      className="h-6 px-2"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteStrategy(strategy.id)}
                      className="h-6 px-2 text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <Switch
                      checked={strategy.isActive}
                      onCheckedChange={(checked) => handleToggleStrategy(strategy.id, checked)}
                      className="scale-75"
                    />
                  </div>
                </div>
              ))}

              {strategies.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No strategies created yet</p>
                  <p className="text-xs">Create your first strategy to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Strategy Editor */}
        <div className="lg:col-span-2">
          {(isCreating || isEditing) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{isEditing ? "Edit Strategy" : "Create Strategy"}</span>
                  <div className="flex items-center gap-2">
                    <Button onClick={resetForm} variant="outline" size="sm">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveStrategy} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="parameters">Parameters</TabsTrigger>
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                    <TabsTrigger value="risk">Risk</TabsTrigger>
                  </TabsList>

                  {/* Basic Information */}
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="strategyName">Strategy Name</Label>
                        <Input
                          id="strategyName"
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="My Arbitrage Strategy"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="strategyType">Strategy Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, type: value as TradingStrategy["type"] }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="arbitrage">Arbitrage</SelectItem>
                            <SelectItem value="momentum">Momentum</SelectItem>
                            <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                            <SelectItem value="grid">Grid Trading</SelectItem>
                            <SelectItem value="dca">DCA (Dollar Cost Average)</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="strategyDescription">Description</Label>
                      <Textarea
                        id="strategyDescription"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your strategy's approach and goals..."
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  {/* Parameters */}
                  <TabsContent value="parameters" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Min Profit Threshold ($)</Label>
                        <Input
                          type="number"
                          value={formData.parameters.minProfitThreshold}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              parameters: { ...prev.parameters, minProfitThreshold: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Slippage (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.parameters.maxSlippagePercent}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              parameters: { ...prev.parameters, maxSlippagePercent: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Position Size ($)</Label>
                        <Input
                          type="number"
                          value={formData.parameters.maxPositionSize}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              parameters: { ...prev.parameters, maxPositionSize: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Gas Price (Gwei)</Label>
                        <Input
                          type="number"
                          value={formData.parameters.maxGasPrice}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              parameters: { ...prev.parameters, maxGasPrice: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Min Liquidity ($)</Label>
                        <Input
                          type="number"
                          value={formData.parameters.minLiquidity}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              parameters: { ...prev.parameters, minLiquidity: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Timeframe</Label>
                        <Select
                          value={formData.parameters.timeframe}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              parameters: { ...prev.parameters, timeframe: value },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30s">30 seconds</SelectItem>
                            <SelectItem value="1m">1 minute</SelectItem>
                            <SelectItem value="5m">5 minutes</SelectItem>
                            <SelectItem value="15m">15 minutes</SelectItem>
                            <SelectItem value="1h">1 hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Confidence Threshold (%)</Label>
                      <div className="flex items-center space-x-4">
                        <Slider
                          value={[formData.parameters.confidenceThreshold]}
                          onValueChange={([value]) =>
                            setFormData((prev) => ({
                              ...prev,
                              parameters: { ...prev.parameters, confidenceThreshold: value },
                            }))
                          }
                          max={100}
                          min={0}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-12">{formData.parameters.confidenceThreshold}%</span>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Rules */}
                  <TabsContent value="rules" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Trading Rules</h4>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Rule
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Add Trading Rule</DialogTitle>
                              <DialogDescription>
                                Create a new rule to control when trades are executed
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Rule Name</Label>
                                  <Select
                                    value={newRule.name}
                                    onValueChange={(value) => {
                                      const template = ruleTemplates.find((t) => t.name === value)
                                      if (template) {
                                        setNewRule({
                                          ...newRule,
                                          name: template.name,
                                          condition: template.condition,
                                          action: template.action,
                                          parameters: template.parameters,
                                        })
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select rule template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ruleTemplates.map((template) => (
                                        <SelectItem key={template.name} value={template.name}>
                                          {template.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Rule Type</Label>
                                  <Select
                                    value={newRule.type}
                                    onValueChange={(value) =>
                                      setNewRule((prev) => ({ ...prev, type: value as TradingRule["type"] }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="entry">Entry</SelectItem>
                                      <SelectItem value="exit">Exit</SelectItem>
                                      <SelectItem value="risk">Risk</SelectItem>
                                      <SelectItem value="filter">Filter</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Condition</Label>
                                <Input
                                  value={newRule.condition}
                                  onChange={(e) => setNewRule((prev) => ({ ...prev, condition: e.target.value }))}
                                  placeholder="e.g., spread >= 0.5"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Action</Label>
                                <Input
                                  value={newRule.action}
                                  onChange={(e) => setNewRule((prev) => ({ ...prev, action: e.target.value }))}
                                  placeholder="e.g., generate_buy_signal"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Priority (1-10)</Label>
                                <Slider
                                  value={[newRule.priority]}
                                  onValueChange={([value]) => setNewRule((prev) => ({ ...prev, priority: value }))}
                                  max={10}
                                  min={1}
                                  step={1}
                                />
                                <p className="text-xs text-muted-foreground">Priority: {newRule.priority}</p>
                              </div>

                              <Button onClick={handleAddRule} className="w-full">
                                Add Rule
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="space-y-2">
                        {formData.rules.map((rule) => (
                          <div key={rule.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{rule.type}</Badge>
                                <span className="font-medium">{rule.name}</span>
                                <Badge variant={rule.isActive ? "default" : "secondary"}>
                                  {rule.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={rule.isActive}
                                  onCheckedChange={(checked) => handleUpdateRule(rule.id, { isActive: checked })}
                                  className="scale-75"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveRule(rule.id)}
                                  className="h-6 px-2 text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>
                                <strong>Condition:</strong> {rule.condition}
                              </p>
                              <p>
                                <strong>Action:</strong> {rule.action}
                              </p>
                              <p>
                                <strong>Priority:</strong> {rule.priority}
                              </p>
                            </div>
                          </div>
                        ))}

                        {formData.rules.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No rules defined yet</p>
                            <p className="text-xs">Add rules to control trading behavior</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Risk Management */}
                  <TabsContent value="risk" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Daily Loss ($)</Label>
                        <Input
                          type="number"
                          value={formData.riskManagement.maxDailyLoss}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              riskManagement: { ...prev.riskManagement, maxDailyLoss: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Drawdown (%)</Label>
                        <Input
                          type="number"
                          value={formData.riskManagement.maxDrawdown}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              riskManagement: { ...prev.riskManagement, maxDrawdown: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Position Sizing</Label>
                        <Select
                          value={formData.riskManagement.positionSizing}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              riskManagement: { ...prev.riskManagement, positionSizing: value as any },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="percentage">Percentage of Balance</SelectItem>
                            <SelectItem value="kelly">Kelly Criterion</SelectItem>
                            <SelectItem value="volatility">Volatility Based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Stop Loss (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.riskManagement.stopLoss}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              riskManagement: { ...prev.riskManagement, stopLoss: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Take Profit (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.riskManagement.takeProfit}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              riskManagement: { ...prev.riskManagement, takeProfit: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Concurrent Trades</Label>
                        <Input
                          type="number"
                          value={formData.riskManagement.maxConcurrentTrades}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              riskManagement: { ...prev.riskManagement, maxConcurrentTrades: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cooldown Period (seconds)</Label>
                        <Input
                          type="number"
                          value={formData.riskManagement.cooldownPeriod}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              riskManagement: { ...prev.riskManagement, cooldownPeriod: Number(e.target.value) },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Backtest Results */}
          {backTestResults && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Backtest Results
                </CardTitle>
                <CardDescription>Performance analysis for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{backTestResults.totalReturn.toFixed(2)}%</div>
                    <div className="text-sm text-muted-foreground">Total Return</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">{backTestResults.totalTrades}</div>
                    <div className="text-sm text-muted-foreground">Total Trades</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">{backTestResults.winRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-red-500">{backTestResults.maxDrawdown.toFixed(2)}%</div>
                    <div className="text-sm text-muted-foreground">Max Drawdown</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Performance Metrics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Sharpe Ratio:</span>
                        <span className="font-medium">{backTestResults.sharpeRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Factor:</span>
                        <span className="font-medium">{backTestResults.profitFactor.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Initial Balance:</span>
                        <span className="font-medium">${backTestResults.metrics.initialBalance?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Final Balance:</span>
                        <span className="font-medium">${backTestResults.metrics.finalBalance?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recent Trades</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {backTestResults.trades.slice(-10).map((trade, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 border rounded">
                          <div>
                            <span className="font-medium">{trade.pair}</span>
                            <span className="text-muted-foreground ml-2">
                              {new Date(trade.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={trade.profit > 0 ? "default" : "destructive"}>
                              {trade.profit > 0 ? "+" : ""}${trade.profit.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Default View */}
          {!isCreating && !isEditing && !backTestResults && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Strategy Builder</h3>
                  <p className="text-muted-foreground mb-4">
                    Create custom trading strategies with visual rule builder
                  </p>
                  <Button onClick={handleCreateStrategy}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Strategy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Testing Modal */}
      {isTesting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="font-medium mb-2">Running Backtest</h3>
              <p className="text-sm text-muted-foreground">Analyzing strategy performance over the last 30 days...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default StrategyBuilder
