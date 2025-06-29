"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Save, RefreshCw, AlertTriangle } from "lucide-react"
import { useBot } from "@/src/contexts/BotContext"

export default function ConfigPanel() {
  const { botState, updateBotConfig } = useBot()
  const [config, setConfig] = useState({
    minProfitThreshold: botState.minProfitThreshold,
    maxSlippage: botState.maxSlippage,
    riskLevel: botState.riskLevel,
    autoExecuteEnabled: botState.autoExecuteEnabled,
    gasLimit: 500000,
    maxTradeSize: 1000,
    enabledExchanges: ["uniswap", "sushiswap", "balancer"],
    enabledTokens: ["WETH", "USDC", "USDT", "WBTC"],
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      updateBotConfig({
        minProfitThreshold: config.minProfitThreshold,
        maxSlippage: config.maxSlippage,
        riskLevel: config.riskLevel,
        autoExecuteEnabled: config.autoExecuteEnabled,
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error("Failed to save config:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setConfig({
      minProfitThreshold: 10,
      maxSlippage: 0.5,
      riskLevel: "medium",
      autoExecuteEnabled: false,
      gasLimit: 500000,
      maxTradeSize: 1000,
      enabledExchanges: ["uniswap", "sushiswap"],
      enabledTokens: ["WETH", "USDC"],
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuration</h1>
          <p className="text-muted-foreground">Manage your bot settings and trading parameters</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
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
          <TabsTrigger value="risk">Risk Management</TabsTrigger>
          <TabsTrigger value="exchanges">Exchanges</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Parameters</CardTitle>
              <CardDescription>Configure basic trading settings and thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minProfit">Minimum Profit Threshold ($)</Label>
                  <Input
                    id="minProfit"
                    type="number"
                    value={config.minProfitThreshold}
                    onChange={(e) => setConfig((prev) => ({ ...prev, minProfitThreshold: Number(e.target.value) }))}
                    min="1"
                    max="1000"
                  />
                  <p className="text-xs text-muted-foreground">Only execute trades with profit above this amount</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSlippage">Maximum Slippage (%)</Label>
                  <Input
                    id="maxSlippage"
                    type="number"
                    value={config.maxSlippage}
                    onChange={(e) => setConfig((prev) => ({ ...prev, maxSlippage: Number(e.target.value) }))}
                    min="0.1"
                    max="5"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground">Maximum acceptable slippage for trades</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTradeSize">Maximum Trade Size ($)</Label>
                  <Input
                    id="maxTradeSize"
                    type="number"
                    value={config.maxTradeSize}
                    onChange={(e) => setConfig((prev) => ({ ...prev, maxTradeSize: Number(e.target.value) }))}
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
                    value={config.gasLimit}
                    onChange={(e) => setConfig((prev) => ({ ...prev, gasLimit: Number(e.target.value) }))}
                    min="100000"
                    max="1000000"
                  />
                  <p className="text-xs text-muted-foreground">Gas limit for arbitrage transactions</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoExecute"
                  checked={config.autoExecuteEnabled}
                  onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, autoExecuteEnabled: checked }))}
                />
                <Label htmlFor="autoExecute">Enable automatic trade execution</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>Configure risk levels and safety parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="riskLevel">Risk Level</Label>
                <Select
                  value={config.riskLevel}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setConfig((prev) => ({ ...prev, riskLevel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk - Conservative trading</SelectItem>
                    <SelectItem value="medium">Medium Risk - Balanced approach</SelectItem>
                    <SelectItem value="high">High Risk - Aggressive trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Higher risk levels may yield higher profits but also increase potential losses. Always trade with
                  funds you can afford to lose.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exchanges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exchange Configuration</CardTitle>
              <CardDescription>Select which exchanges and tokens to monitor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Enabled Exchanges</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["Uniswap V3", "SushiSwap", "Balancer", "Curve", "1inch", "Kyber"].map((exchange) => (
                    <div key={exchange} className="flex items-center space-x-2">
                      <Switch
                        id={exchange}
                        checked={config.enabledExchanges.includes(exchange.toLowerCase().replace(" ", ""))}
                        onCheckedChange={(checked) => {
                          const exchangeId = exchange.toLowerCase().replace(" ", "")
                          if (checked) {
                            setConfig((prev) => ({
                              ...prev,
                              enabledExchanges: [...prev.enabledExchanges, exchangeId],
                            }))
                          } else {
                            setConfig((prev) => ({
                              ...prev,
                              enabledExchanges: prev.enabledExchanges.filter((e) => e !== exchangeId),
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={exchange} className="text-sm">
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
                        checked={config.enabledTokens.includes(token)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setConfig((prev) => ({
                              ...prev,
                              enabledTokens: [...prev.enabledTokens, token],
                            }))
                          } else {
                            setConfig((prev) => ({
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Advanced configuration options for experienced users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These settings are for advanced users only. Incorrect configuration may result in failed trades or
                  losses.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Current Configuration Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Bot Status:</span>
                      <span className={botState.running ? "text-green-600" : "text-gray-600"}>
                        {botState.running ? "Running" : "Stopped"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auto Execute:</span>
                      <span className={config.autoExecuteEnabled ? "text-green-600" : "text-gray-600"}>
                        {config.autoExecuteEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <span className="capitalize">{config.riskLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enabled Exchanges:</span>
                      <span>{config.enabledExchanges.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monitored Tokens:</span>
                      <span>{config.enabledTokens.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
