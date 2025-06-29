"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Settings, Play, Save, Copy, Trash2, Target, TrendingUp, Shield, Zap, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"

interface Strategy {
  id: string
  name: string
  description: string
  type: "arbitrage" | "dca" | "grid" | "custom"
  status: "active" | "inactive" | "draft"
  profitTarget: number
  stopLoss: number
  maxSlippage: number
  gasLimit: number
  minProfitThreshold: number
  tokens: string[]
  dexes: string[]
  riskLevel: "low" | "medium" | "high"
  createdAt: string
  lastModified: string
}

const StrategyBuilder: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: "1",
      name: "ETH-USDC Arbitrage",
      description: "Basic arbitrage strategy for ETH/USDC pair across major DEXes",
      type: "arbitrage",
      status: "active",
      profitTarget: 2.5,
      stopLoss: 1.0,
      maxSlippage: 0.5,
      gasLimit: 300000,
      minProfitThreshold: 50,
      tokens: ["ETH", "USDC"],
      dexes: ["Uniswap V3", "SushiSwap"],
      riskLevel: "medium",
      createdAt: "2024-01-15T10:30:00Z",
      lastModified: "2024-01-20T14:45:00Z",
    },
  ])

  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newStrategy, setNewStrategy] = useState<Partial<Strategy>>({
    name: "",
    description: "",
    type: "arbitrage",
    profitTarget: 2.0,
    stopLoss: 1.0,
    maxSlippage: 0.5,
    gasLimit: 250000,
    minProfitThreshold: 25,
    tokens: [],
    dexes: [],
    riskLevel: "medium",
  })

  const handleCreateStrategy = () => {
    console.log("Create strategy clicked")
    setIsCreating(true)
    setSelectedStrategy(null)
  }

  const handleSaveStrategy = () => {
    console.log("Save strategy clicked", newStrategy)

    if (!newStrategy.name || !newStrategy.description) {
      toast.error("Please fill in all required fields")
      return
    }

    const strategy: Strategy = {
      id: Date.now().toString(),
      name: newStrategy.name,
      description: newStrategy.description,
      type: newStrategy.type || "arbitrage",
      status: "draft",
      profitTarget: newStrategy.profitTarget || 2.0,
      stopLoss: newStrategy.stopLoss || 1.0,
      maxSlippage: newStrategy.maxSlippage || 0.5,
      gasLimit: newStrategy.gasLimit || 250000,
      minProfitThreshold: newStrategy.minProfitThreshold || 25,
      tokens: newStrategy.tokens || [],
      dexes: newStrategy.dexes || [],
      riskLevel: newStrategy.riskLevel || "medium",
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }

    setStrategies((prev) => [...prev, strategy])
    setIsCreating(false)
    setNewStrategy({
      name: "",
      description: "",
      type: "arbitrage",
      profitTarget: 2.0,
      stopLoss: 1.0,
      maxSlippage: 0.5,
      gasLimit: 250000,
      minProfitThreshold: 25,
      tokens: [],
      dexes: [],
      riskLevel: "medium",
    })

    toast.success("Strategy created successfully!")
  }

  const handleActivateStrategy = (strategyId: string) => {
    console.log("Activate strategy:", strategyId)
    setStrategies((prev) => prev.map((s) => (s.id === strategyId ? { ...s, status: "active" as const } : s)))
    toast.success("Strategy activated!")
  }

  const handleDeactivateStrategy = (strategyId: string) => {
    console.log("Deactivate strategy:", strategyId)
    setStrategies((prev) => prev.map((s) => (s.id === strategyId ? { ...s, status: "inactive" as const } : s)))
    toast.success("Strategy deactivated!")
  }

  const handleDeleteStrategy = (strategyId: string) => {
    console.log("Delete strategy:", strategyId)
    setStrategies((prev) => prev.filter((s) => s.id !== strategyId))
    if (selectedStrategy?.id === strategyId) {
      setSelectedStrategy(null)
    }
    toast.success("Strategy deleted!")
  }

  const handleCloneStrategy = (strategy: Strategy) => {
    console.log("Clone strategy:", strategy)
    const clonedStrategy: Strategy = {
      ...strategy,
      id: Date.now().toString(),
      name: `${strategy.name} (Copy)`,
      status: "draft",
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }
    setStrategies((prev) => [...prev, clonedStrategy])
    toast.success("Strategy cloned successfully!")
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-500"
      case "medium":
        return "text-yellow-500"
      case "high":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "draft":
        return "outline"
      default:
        return "secondary"
    }
  }

  if (strategies.length === 0 && !isCreating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Strategy Builder
          </CardTitle>
          <CardDescription>Create and manage your trading strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Strategies Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first trading strategy to get started with automated arbitrage
            </p>
            <Button onClick={handleCreateStrategy} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Strategy
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Strategy Builder
              </CardTitle>
              <CardDescription>Create, manage, and optimize your trading strategies</CardDescription>
            </div>
            <Button onClick={handleCreateStrategy} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Strategy
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Strategies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStrategy?.id === strategy.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedStrategy(strategy)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium truncate">{strategy.name}</h4>
                    <Badge variant={getStatusColor(strategy.status)}>{strategy.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{strategy.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{strategy.type}</span>
                    <span className={getRiskColor(strategy.riskLevel)}>{strategy.riskLevel} risk</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Strategy Details/Creator */}
        <div className="lg:col-span-2">
          {isCreating ? (
            <Card>
              <CardHeader>
                <CardTitle>Create New Strategy</CardTitle>
                <CardDescription>Configure your trading strategy parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    <TabsTrigger value="risk">Risk Management</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Strategy Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g., ETH-USDC Arbitrage"
                          value={newStrategy.name}
                          onChange={(e) => setNewStrategy((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="type">Strategy Type</Label>
                        <Select
                          value={newStrategy.type}
                          onValueChange={(value) => setNewStrategy((prev) => ({ ...prev, type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="arbitrage">Arbitrage</SelectItem>
                            <SelectItem value="dca">DCA (Dollar Cost Average)</SelectItem>
                            <SelectItem value="grid">Grid Trading</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your strategy..."
                        value={newStrategy.description}
                        onChange={(e) => setNewStrategy((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Profit Target (%)</Label>
                        <div className="px-3">
                          <Slider
                            value={[newStrategy.profitTarget || 2.0]}
                            onValueChange={([value]) => setNewStrategy((prev) => ({ ...prev, profitTarget: value }))}
                            max={10}
                            min={0.1}
                            step={0.1}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0.1%</span>
                            <span>{newStrategy.profitTarget}%</span>
                            <span>10%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Min Profit Threshold ($)</Label>
                        <Input
                          type="number"
                          value={newStrategy.minProfitThreshold}
                          onChange={(e) =>
                            setNewStrategy((prev) => ({ ...prev, minProfitThreshold: Number(e.target.value) }))
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Slippage (%)</Label>
                        <div className="px-3">
                          <Slider
                            value={[newStrategy.maxSlippage || 0.5]}
                            onValueChange={([value]) => setNewStrategy((prev) => ({ ...prev, maxSlippage: value }))}
                            max={5}
                            min={0.1}
                            step={0.1}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0.1%</span>
                            <span>{newStrategy.maxSlippage}%</span>
                            <span>5%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Gas Limit</Label>
                        <Input
                          type="number"
                          value={newStrategy.gasLimit}
                          onChange={(e) => setNewStrategy((prev) => ({ ...prev, gasLimit: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="risk" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Risk Level</Label>
                        <Select
                          value={newStrategy.riskLevel}
                          onValueChange={(value) => setNewStrategy((prev) => ({ ...prev, riskLevel: value as any }))}
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

                      <div className="space-y-2">
                        <Label>Stop Loss (%)</Label>
                        <div className="px-3">
                          <Slider
                            value={[newStrategy.stopLoss || 1.0]}
                            onValueChange={([value]) => setNewStrategy((prev) => ({ ...prev, stopLoss: value }))}
                            max={10}
                            min={0.1}
                            step={0.1}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0.1%</span>
                            <span>{newStrategy.stopLoss}%</span>
                            <span>10%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator className="my-6" />

                <div className="flex items-center gap-3">
                  <Button onClick={handleSaveStrategy} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Strategy
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedStrategy ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedStrategy.name}</CardTitle>
                    <CardDescription>{selectedStrategy.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(selectedStrategy.status)}>{selectedStrategy.status}</Badge>
                    <Badge variant="outline" className={getRiskColor(selectedStrategy.riskLevel)}>
                      {selectedStrategy.riskLevel} risk
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Strategy Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <p className="text-sm text-muted-foreground">Profit Target</p>
                    <p className="font-semibold">{selectedStrategy.profitTarget}%</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <Shield className="w-5 h-5 mx-auto mb-1 text-red-500" />
                    <p className="text-sm text-muted-foreground">Stop Loss</p>
                    <p className="font-semibold">{selectedStrategy.stopLoss}%</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <Zap className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-sm text-muted-foreground">Max Slippage</p>
                    <p className="font-semibold">{selectedStrategy.maxSlippage}%</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <Target className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-sm text-muted-foreground">Min Profit</p>
                    <p className="font-semibold">${selectedStrategy.minProfitThreshold}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {selectedStrategy.status === "active" ? (
                    <Button
                      variant="secondary"
                      onClick={() => handleDeactivateStrategy(selectedStrategy.id)}
                      className="flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleActivateStrategy(selectedStrategy.id)}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Activate Strategy
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => handleCloneStrategy(selectedStrategy)}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Clone
                  </Button>

                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Settings className="w-4 h-4" />
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteStrategy(selectedStrategy.id)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a strategy to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default StrategyBuilder
