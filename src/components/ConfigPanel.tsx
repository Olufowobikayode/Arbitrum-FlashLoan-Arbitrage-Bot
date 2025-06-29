"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Zap, Shield, Bell, Network, AlertTriangle, Save, RotateCcw } from "lucide-react"
import { useBot } from "../contexts/BotContext"

export default function ConfigPanel() {
  const { botState, updateBotConfig } = useBot()
  const { toast } = useToast()
  const [config, setConfig] = useState({
    // Trading Parameters
    minProfitThreshold: botState.minProfitThreshold || 0.5,
    maxSlippage: botState.maxSlippage || 1.0,
    gasLimit: 500000,
    maxTradeSize: 10,
    riskLevel: botState.riskLevel || "medium",

    // Exchanges
    enabledExchanges: ["uniswap", "sushiswap"],

    // Tokens
    enabledTokens: ["WETH", "USDC", "DAI"],

    // Risk Management
    stopLoss: 5.0,
    takeProfit: 10.0,
    maxDailyLoss: 100,
    autoRebalance: true,

    // Notifications
    enableNotifications: true,
    telegramEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",
    emailNotifications: false,
    email: "",

    // Advanced
    enableMEVProtection: true,
    flashbotsEnabled: false,
    priorityFee: 2,
    maxGasPrice: 100,
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    loadConfig()
  }, [])

  const loadConfig = () => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("bot-config")
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig)
          setConfig((prev) => ({ ...prev, ...parsed }))
        } catch (error) {
          console.error("Failed to load config:", error)
        }
      }
    }
  }

  const saveConfig = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bot-config", JSON.stringify(config))
      updateBotConfig({
        minProfitThreshold: config.minProfitThreshold,
        maxSlippage: config.maxSlippage,
        riskLevel: config.riskLevel as "low" | "medium" | "high",
      })
      setHasChanges(false)
      toast({
        title: "Configuration Saved",
        description: "Your bot configuration has been updated successfully.",
      })
    }
  }

  const resetConfig = () => {
    setConfig({
      minProfitThreshold: 0.5,
      maxSlippage: 1.0,
      gasLimit: 500000,
      maxTradeSize: 10,
      riskLevel: "medium",
      enabledExchanges: ["uniswap", "sushiswap"],
      enabledTokens: ["WETH", "USDC", "DAI"],
      stopLoss: 5.0,
      takeProfit: 10.0,
      maxDailyLoss: 100,
      autoRebalance: true,
      enableNotifications: true,
      telegramEnabled: false,
      telegramBotToken: "",
      telegramChatId: "",
      emailNotifications: false,
      email: "",
      enableMEVProtection: true,
      flashbotsEnabled: false,
      priorityFee: 2,
      maxGasPrice: 100,
    })
    setHasChanges(true)
    toast({
      title: "Configuration Reset",
      description: "All settings have been reset to defaults.",
    })
  }

  const updateConfig = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const exchanges = [
    { id: "uniswap", name: "Uniswap V2/V3", enabled: true, fee: "0.3%" },
    { id: "sushiswap", name: "SushiSwap", enabled: true, fee: "0.3%" },
    { id: "balancer", name: "Balancer", enabled: false, fee: "Variable" },
    { id: "curve", name: "Curve", enabled: false, fee: "0.04%" },
    { id: "1inch", name: "1inch", enabled: false, fee: "Variable" },
  ]

  const tokens = [
    { id: "WETH", name: "Wrapped Ethereum", enabled: true, liquidity: "High" },
    { id: "USDC", name: "USD Coin", enabled: true, liquidity: "High" },
    { id: "DAI", name: "Dai Stablecoin", enabled: true, liquidity: "High" },
    { id: "USDT", name: "Tether USD", enabled: false, liquidity: "High" },
    { id: "WBTC", name: "Wrapped Bitcoin", enabled: false, liquidity: "Medium" },
    { id: "UNI", name: "Uniswap Token", enabled: false, liquidity: "Medium" },
  ]

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuration</h1>
          <p className="text-muted-foreground">Manage your bot settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetConfig}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveConfig} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>You have unsaved changes. Don't forget to save your configuration.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="trading" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trading" className="gap-2">
            <Zap className="w-4 h-4" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="exchanges" className="gap-2">
            <Network className="w-4 h-4" />
            Exchanges
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2">
            <Shield className="w-4 h-4" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Settings className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Parameters</CardTitle>
              <CardDescription>Configure your bot's trading behavior and thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Minimum Profit Threshold (%)</Label>
                  <div className="px-3">
                    <Slider
                      value={[config.minProfitThreshold]}
                      onValueChange={([value]) => updateConfig("minProfitThreshold", value)}
                      max={5}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>0.1%</span>
                      <span className="font-medium">{config.minProfitThreshold}%</span>
                      <span>5%</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Minimum profit required to execute a trade</p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Slippage (%)</Label>
                  <div className="px-3">
                    <Slider
                      value={[config.maxSlippage]}
                      onValueChange={([value]) => updateConfig("maxSlippage", value)}
                      max={5}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>0.1%</span>
                      <span className="font-medium">{config.maxSlippage}%</span>
                      <span>5%</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Maximum acceptable price slippage</p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Trade Size (ETH)</Label>
                  <Input
                    type="number"
                    value={config.maxTradeSize}
                    onChange={(e) => updateConfig("maxTradeSize", Number.parseFloat(e.target.value) || 0)}
                    min="0.1"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-sm text-muted-foreground">Maximum amount per trade in ETH</p>
                </div>

                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <Select value={config.riskLevel} onValueChange={(value) => updateConfig("riskLevel", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Overall risk tolerance for trading</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exchanges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supported Exchanges</CardTitle>
              <CardDescription>Enable or disable exchanges for arbitrage opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exchanges.map((exchange) => (
                  <div key={exchange.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">{exchange.name}</div>
                        <div className="text-sm text-muted-foreground">Fee: {exchange.fee}</div>
                      </div>
                      {!exchange.enabled && <Badge variant="secondary">Coming Soon</Badge>}
                    </div>
                    <Switch
                      checked={config.enabledExchanges.includes(exchange.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateConfig("enabledExchanges", [...config.enabledExchanges, exchange.id])
                        } else {
                          updateConfig(
                            "enabledExchanges",
                            config.enabledExchanges.filter((id) => id !== exchange.id),
                          )
                        }
                      }}
                      disabled={!exchange.enabled}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Tokens</CardTitle>
              <CardDescription>Select tokens to include in arbitrage scanning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tokens.map((token) => (
                  <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">{token.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {token.name} • Liquidity: {token.liquidity}
                        </div>
                      </div>
                      {!token.enabled && <Badge variant="secondary">Coming Soon</Badge>}
                    </div>
                    <Switch
                      checked={config.enabledTokens.includes(token.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateConfig("enabledTokens", [...config.enabledTokens, token.id])
                        } else {
                          updateConfig(
                            "enabledTokens",
                            config.enabledTokens.filter((id) => id !== token.id),
                          )
                        }
                      }}
                      disabled={!token.enabled}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>Configure stop-loss, take-profit, and other risk controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Stop Loss (%)</Label>
                  <Input
                    type="number"
                    value={config.stopLoss}
                    onChange={(e) => updateConfig("stopLoss", Number.parseFloat(e.target.value) || 0)}
                    min="0"
                    max="50"
                    step="0.5"
                  />
                  <p className="text-sm text-muted-foreground">Automatically stop trading after this loss percentage</p>
                </div>

                <div className="space-y-2">
                  <Label>Take Profit (%)</Label>
                  <Input
                    type="number"
                    value={config.takeProfit}
                    onChange={(e) => updateConfig("takeProfit", Number.parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.5"
                  />
                  <p className="text-sm text-muted-foreground">Take profit after reaching this percentage gain</p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Daily Loss ($)</Label>
                  <Input
                    type="number"
                    value={config.maxDailyLoss}
                    onChange={(e) => updateConfig("maxDailyLoss", Number.parseFloat(e.target.value) || 0)}
                    min="0"
                    step="10"
                  />
                  <p className="text-sm text-muted-foreground">Stop trading if daily losses exceed this amount</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Auto Rebalance</Label>
                    <Switch
                      checked={config.autoRebalance}
                      onCheckedChange={(checked) => updateConfig("autoRebalance", checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Automatically rebalance portfolio after trades</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure alerts and notifications for trading events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts for trades and errors</p>
                </div>
                <Switch
                  checked={config.enableNotifications}
                  onCheckedChange={(checked) => updateConfig("enableNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Telegram Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send alerts to Telegram</p>
                  </div>
                  <Switch
                    checked={config.telegramEnabled}
                    onCheckedChange={(checked) => updateConfig("telegramEnabled", checked)}
                  />
                </div>

                {config.telegramEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div className="space-y-2">
                      <Label>Bot Token</Label>
                      <Input
                        type="password"
                        value={config.telegramBotToken}
                        onChange={(e) => updateConfig("telegramBotToken", e.target.value)}
                        placeholder="Enter your Telegram bot token"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Chat ID</Label>
                      <Input
                        value={config.telegramChatId}
                        onChange={(e) => updateConfig("telegramChatId", e.target.value)}
                        placeholder="Enter your chat ID"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send alerts via email</p>
                  </div>
                  <Switch
                    checked={config.emailNotifications}
                    onCheckedChange={(checked) => updateConfig("emailNotifications", checked)}
                  />
                </div>

                {config.emailNotifications && (
                  <div className="ml-6">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        value={config.email}
                        onChange={(e) => updateConfig("email", e.target.value)}
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced trading and gas optimization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>MEV Protection</Label>
                    <p className="text-sm text-muted-foreground">Protect against MEV attacks and front-running</p>
                  </div>
                  <Switch
                    checked={config.enableMEVProtection}
                    onCheckedChange={(checked) => updateConfig("enableMEVProtection", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Flashbots Integration</Label>
                    <p className="text-sm text-muted-foreground">Use Flashbots for private mempool transactions</p>
                  </div>
                  <Switch
                    checked={config.flashbotsEnabled}
                    onCheckedChange={(checked) => updateConfig("flashbotsEnabled", checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Priority Fee (Gwei)</Label>
                  <Input
                    type="number"
                    value={config.priorityFee}
                    onChange={(e) => updateConfig("priorityFee", Number.parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-sm text-muted-foreground">Priority fee for faster transaction inclusion</p>
                </div>

                <div className="space-y-2">
                  <Label>Max Gas Price (Gwei)</Label>
                  <Input
                    type="number"
                    value={config.maxGasPrice}
                    onChange={(e) => updateConfig("maxGasPrice", Number.parseFloat(e.target.value) || 0)}
                    min="1"
                    max="1000"
                    step="1"
                  />
                  <p className="text-sm text-muted-foreground">Maximum gas price for transactions</p>
                </div>

                <div className="space-y-2">
                  <Label>Gas Limit</Label>
                  <Input
                    type="number"
                    value={config.gasLimit}
                    onChange={(e) => updateConfig("gasLimit", Number.parseInt(e.target.value) || 0)}
                    min="21000"
                    max="10000000"
                    step="1000"
                  />
                  <p className="text-sm text-muted-foreground">Gas limit for arbitrage transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
