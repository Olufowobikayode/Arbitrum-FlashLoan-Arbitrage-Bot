"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Settings, Save, RefreshCw, AlertTriangle, CheckCircle, Zap, Shield, Target } from "lucide-react"
import { useBot } from "@/src/contexts/BotContext"

interface ConfigSettings {
  trading: {
    minProfitThreshold: number
    maxSlippage: number
    gasLimit: number
    maxTradeSize: number
    riskLevel: "low" | "medium" | "high"
    autoExecute: boolean
  }
  exchanges: {
    uniswap: boolean
    sushiswap: boolean
    balancer: boolean
    curve: boolean
    oneinch: boolean
  }
  tokens: {
    WETH: boolean
    USDC: boolean
    USDT: boolean
    WBTC: boolean
    DAI: boolean
    ARB: boolean
  }
  advanced: {
    maxConcurrentTrades: number
    cooldownPeriod: number
    enableMEVProtection: boolean
    enableFlashbotsRelay: boolean
    priorityFee: number
  }
}

const defaultSettings: ConfigSettings = {
  trading: {
    minProfitThreshold: 10,
    maxSlippage: 0.5,
    gasLimit: 500000,
    maxTradeSize: 1000,
    riskLevel: "medium",
    autoExecute: false,
  },
  exchanges: {
    uniswap: true,
    sushiswap: true,
    balancer: false,
    curve: false,
    oneinch: false,
  },
  tokens: {
    WETH: true,
    USDC: true,
    USDT: true,
    WBTC: false,
    DAI: false,
    ARB: false,
  },
  advanced: {
    maxConcurrentTrades: 3,
    cooldownPeriod: 5,
    enableMEVProtection: true,
    enableFlashbotsRelay: false,
    priorityFee: 2,
  },
}

export default function ConfigPanel() {
  const { updateBotConfig, botState } = useBot()
  const [settings, setSettings] = useState<ConfigSettings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Load settings from localStorage only on client
    if (isClient) {
      try {
        const savedSettings = localStorage.getItem("botConfig")
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings({ ...defaultSettings, ...parsed })
        }
      } catch (error) {
        console.error("Failed to load config:", error)
        setSettings(defaultSettings)
      }
    }
  }, [isClient])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage
      if (isClient) {
        localStorage.setItem("botConfig", JSON.stringify(settings))
      }

      // Update bot config
      updateBotConfig({
        minProfitThreshold: settings.trading.minProfitThreshold,
        maxSlippage: settings.trading.maxSlippage,
        riskLevel: settings.trading.riskLevel,
        autoExecuteEnabled: settings.trading.autoExecute,
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setLastSaved(new Date())
      setHasChanges(false)
    } catch (error) {
      console.error("Failed to save config:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  const updateSetting = (path: string, value: any) => {
    setSettings((prev) => {
      const keys = path.split(".")
      const newSettings = { ...prev }
      let current: any = newSettings

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newSettings
    })
    setHasChanges(true)
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

  const getEnabledExchangesCount = () => {
    return Object.values(settings.exchanges).filter(Boolean).length
  }

  const getEnabledTokensCount = () => {
    return Object.values(settings.tokens).filter(Boolean).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuration</h1>
          <p className="text-muted-foreground">Configure your arbitrage bot settings and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && <Badge variant="secondary">Unsaved Changes</Badge>}
          {lastSaved && (
            <span className="text-sm text-muted-foreground">Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="trading" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="exchanges">Exchanges</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Trading Settings */}
        <TabsContent value="trading" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Basic Trading Parameters
                </CardTitle>
                <CardDescription>Configure core trading settings and risk management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Minimum Profit Threshold: ${settings.trading.minProfitThreshold}</Label>
                  <Slider
                    value={[settings.trading.minProfitThreshold]}
                    onValueChange={(value) => updateSetting("trading.minProfitThreshold", value[0])}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Minimum profit required to execute a trade</p>
                </div>

                <div className="space-y-3">
                  <Label>Maximum Slippage: {settings.trading.maxSlippage}%</Label>
                  <Slider
                    value={[settings.trading.maxSlippage]}
                    onValueChange={(value) => updateSetting("trading.maxSlippage", value[0])}
                    max={5}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Maximum acceptable slippage for trades</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTradeSize">Maximum Trade Size ($)</Label>
                  <Input
                    id="maxTradeSize"
                    type="number"
                    value={settings.trading.maxTradeSize}
                    onChange={(e) => updateSetting("trading.maxTradeSize", Number(e.target.value))}
                    min="100"
                    max="10000"
                  />
                  <p className="text-xs text-muted-foreground">Maximum amount to trade in a single transaction</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gasLimit">Gas Limit</Label>
                  <Input
                    id="gasLimit"
                    type="number"
                    value={settings.trading.gasLimit}
                    onChange={(e) => updateSetting("trading.gasLimit", Number(e.target.value))}
                    min="100000"
                    max="1000000"
                  />
                  <p className="text-xs text-muted-foreground">Gas limit for arbitrage transactions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Risk Management
                </CardTitle>
                <CardDescription>Configure risk level and safety settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="riskLevel">Risk Level</Label>
                  <Select
                    value={settings.trading.riskLevel}
                    onValueChange={(value: "low" | "medium" | "high") => updateSetting("trading.riskLevel", value)}
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
                  <p className={`text-xs ${getRiskColor(settings.trading.riskLevel)}`}>
                    {settings.trading.riskLevel === "low" && "Conservative trading with higher profit thresholds"}
                    {settings.trading.riskLevel === "medium" && "Balanced approach with moderate risk"}
                    {settings.trading.riskLevel === "high" && "Aggressive trading with lower thresholds"}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Enable Auto-Execute</Label>
                    <div className="text-sm text-muted-foreground">Automatically execute profitable trades</div>
                  </div>
                  <Switch
                    checked={settings.trading.autoExecute}
                    onCheckedChange={(checked) => updateSetting("trading.autoExecute", checked)}
                  />
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Higher risk levels may yield higher profits but also increase potential losses. Always ensure you
                    understand the risks involved.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Exchange Settings */}
        <TabsContent value="exchanges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supported Exchanges</CardTitle>
              <CardDescription>
                Select which decentralized exchanges to monitor for arbitrage opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(settings.exchanges).map(([exchange, enabled]) => (
                  <div key={exchange} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{exchange.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-medium capitalize">{exchange}</div>
                        <div className="text-sm text-muted-foreground">
                          {exchange === "uniswap" && "V3 Protocol"}
                          {exchange === "sushiswap" && "AMM Protocol"}
                          {exchange === "balancer" && "Weighted Pools"}
                          {exchange === "curve" && "Stable Swaps"}
                          {exchange === "oneinch" && "DEX Aggregator"}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => updateSetting(`exchanges.${exchange}`, checked)}
                    />
                  </div>
                ))}
              </div>

              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Enable at least 2 exchanges to find arbitrage opportunities. Currently enabled:{" "}
                  {getEnabledExchangesCount()}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Token Settings */}
        <TabsContent value="tokens" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monitored Tokens</CardTitle>
              <CardDescription>Select which tokens to monitor for arbitrage opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(settings.tokens).map(([token, enabled]) => (
                  <div key={token} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{token}</span>
                      </div>
                      <div>
                        <div className="font-medium">{token}</div>
                        <div className="text-sm text-muted-foreground">
                          {token === "WETH" && "Wrapped Ethereum"}
                          {token === "USDC" && "USD Coin"}
                          {token === "USDT" && "Tether USD"}
                          {token === "WBTC" && "Wrapped Bitcoin"}
                          {token === "DAI" && "Dai Stablecoin"}
                          {token === "ARB" && "Arbitrum Token"}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => updateSetting(`tokens.${token}`, checked)}
                    />
                  </div>
                ))}
              </div>

              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Enable popular trading pairs like WETH/USDC for better arbitrage opportunities. Currently enabled:{" "}
                  {getEnabledTokensCount()}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Performance Settings
                </CardTitle>
                <CardDescription>Advanced performance and execution settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrent">Max Concurrent Trades</Label>
                  <Input
                    id="maxConcurrent"
                    type="number"
                    value={settings.advanced.maxConcurrentTrades}
                    onChange={(e) => updateSetting("advanced.maxConcurrentTrades", Number(e.target.value))}
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-muted-foreground">Maximum number of trades to execute simultaneously</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cooldown">Cooldown Period (seconds)</Label>
                  <Input
                    id="cooldown"
                    type="number"
                    value={settings.advanced.cooldownPeriod}
                    onChange={(e) => updateSetting("advanced.cooldownPeriod", Number(e.target.value))}
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-muted-foreground">Wait time between trade executions</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priorityFee">Priority Fee (Gwei)</Label>
                  <Input
                    id="priorityFee"
                    type="number"
                    value={settings.advanced.priorityFee}
                    onChange={(e) => updateSetting("advanced.priorityFee", Number(e.target.value))}
                    min="0"
                    max="50"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground">Additional fee to prioritize transactions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  MEV Protection
                </CardTitle>
                <CardDescription>Configure MEV protection and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Enable MEV Protection</Label>
                    <div className="text-sm text-muted-foreground">Protect against front-running attacks</div>
                  </div>
                  <Switch
                    checked={settings.advanced.enableMEVProtection}
                    onCheckedChange={(checked) => updateSetting("advanced.enableMEVProtection", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Enable Flashbots Relay</Label>
                    <div className="text-sm text-muted-foreground">Use Flashbots for private mempool</div>
                  </div>
                  <Switch
                    checked={settings.advanced.enableFlashbotsRelay}
                    onCheckedChange={(checked) => updateSetting("advanced.enableFlashbotsRelay", checked)}
                  />
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    MEV protection helps prevent front-running but may slightly increase transaction costs.
                  </AlertDescription>
                </Alert>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Current Status</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Bot Status:</span>
                      <span className={botState.running ? "text-green-600" : "text-gray-600"}>
                        {botState.running ? "Running" : "Stopped"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auto Execute:</span>
                      <span className={settings.trading.autoExecute ? "text-green-600" : "text-gray-600"}>
                        {settings.trading.autoExecute ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <span className={`capitalize ${getRiskColor(settings.trading.riskLevel)}`}>
                        {settings.trading.riskLevel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exchanges:</span>
                      <span>{getEnabledExchangesCount()} enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tokens:</span>
                      <span>{getEnabledTokensCount()} monitored</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
