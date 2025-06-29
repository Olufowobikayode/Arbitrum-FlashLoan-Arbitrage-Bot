"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Bot, Settings, Play, Pause, RefreshCw, AlertTriangle, DollarSign, Zap, Target, TrendingUp } from "lucide-react"
import { useBot } from "@/src/contexts/BotContext"
import { useWeb3 } from "@/src/contexts/Web3Context"

interface TradingConfig {
  minProfitThreshold: number
  maxSlippage: number
  gasLimit: number
  autoExecute: boolean
  maxTradeSize: number
  enabledExchanges: string[]
  enabledTokens: string[]
}

const defaultConfig: TradingConfig = {
  minProfitThreshold: 10,
  maxSlippage: 0.5,
  gasLimit: 500000,
  autoExecute: false,
  maxTradeSize: 1000,
  enabledExchanges: ["uniswap", "sushiswap", "balancer"],
  enabledTokens: ["WETH", "USDC", "USDT", "WBTC"],
}

export default function TradingPanel() {
  const { botState, opportunities, startBot, stopBot, executeArbitrage } = useBot()
  const { isConnected, balance } = useWeb3()
  const [config, setConfig] = useState<TradingConfig>(defaultConfig)
  const [isExecuting, setIsExecuting] = useState<string | null>(null)

  const handleBotToggle = () => {
    if (botState.running) {
      stopBot()
    } else {
      startBot()
    }
  }

  const handleExecuteOpportunity = async (opportunity: any) => {
    setIsExecuting(opportunity.id)
    try {
      await executeArbitrage(opportunity)
    } catch (error) {
      console.error("Failed to execute opportunity:", error)
    } finally {
      setIsExecuting(null)
    }
  }

  const handleConfigChange = (key: keyof TradingConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading Panel</h1>
          <p className="text-muted-foreground">Configure and monitor your arbitrage trading bot</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={botState.running ? "default" : "secondary"} className="px-3 py-1">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${botState.running ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
            />
            {botState.running ? "Active" : "Inactive"}
          </Badge>
          <Button onClick={handleBotToggle} disabled={!isConnected} size="lg">
            {botState.running ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Trading
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Trading
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Connection Warning */}
      {!isConnected && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Connect your wallet to start trading. The bot requires wallet access to execute arbitrage transactions.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="opportunities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="opportunities">Live Opportunities</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="execution">Manual Execution</TabsTrigger>
        </TabsList>

        {/* Live Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{opportunities.length}</div>
                <p className="text-xs text-muted-foreground">Currently available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Opportunity</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {opportunities.length > 0
                    ? `${Math.max(...opportunities.map((o) => o.profitPercent)).toFixed(2)}%`
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">Profit potential</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${opportunities.reduce((sum, opp) => sum + opp.profitUSD, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Available profit</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Live Arbitrage Opportunities</CardTitle>
              <CardDescription>
                Real-time opportunities detected across DEXs • Auto-refresh every 5 seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <div className="text-center py-12">
                  {botState.running ? (
                    <div className="space-y-4">
                      <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground animate-spin" />
                      <div>
                        <h3 className="font-medium">Scanning for opportunities...</h3>
                        <p className="text-sm text-muted-foreground">
                          The bot is actively monitoring DEXs for arbitrage opportunities
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Bot className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Bot is not running</h3>
                        <p className="text-sm text-muted-foreground">
                          Start the bot to begin scanning for arbitrage opportunities
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {opportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-lg">
                            {opportunity.tokenA}/{opportunity.tokenB}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {opportunity.exchangeA}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                            <Badge variant="outline" className="text-xs">
                              {opportunity.exchangeB}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Price A: ${opportunity.priceA.toFixed(2)}</span>
                          <span>Price B: ${opportunity.priceB.toFixed(2)}</span>
                          <span>Gas: {opportunity.gasEstimate.toFixed(4)} ETH</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">+${opportunity.profitUSD.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {opportunity.profitPercent.toFixed(2)}% profit
                          </div>
                        </div>
                        <Button
                          onClick={() => handleExecuteOpportunity(opportunity)}
                          disabled={isExecuting === opportunity.id || !isConnected}
                          className="min-w-[100px]"
                        >
                          {isExecuting === opportunity.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Executing
                            </>
                          ) : (
                            "Execute"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Trading Parameters
                </CardTitle>
                <CardDescription>Configure your bot's trading behavior and risk management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Minimum Profit Threshold: ${config.minProfitThreshold}</Label>
                  <Slider
                    value={[config.minProfitThreshold]}
                    onValueChange={(value) => handleConfigChange("minProfitThreshold", value[0])}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Minimum profit required to execute a trade</p>
                </div>

                <div className="space-y-3">
                  <Label>Maximum Slippage: {config.maxSlippage}%</Label>
                  <Slider
                    value={[config.maxSlippage]}
                    onValueChange={(value) => handleConfigChange("maxSlippage", value[0])}
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
                    value={config.maxTradeSize}
                    onChange={(e) => handleConfigChange("maxTradeSize", Number(e.target.value))}
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
                    onChange={(e) => handleConfigChange("gasLimit", Number(e.target.value))}
                    min="100000"
                    max="1000000"
                  />
                  <p className="text-xs text-muted-foreground">Gas limit for arbitrage transactions</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoExecute"
                    checked={config.autoExecute}
                    onCheckedChange={(checked) => handleConfigChange("autoExecute", checked)}
                  />
                  <Label htmlFor="autoExecute">Enable automatic execution</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exchange & Token Settings</CardTitle>
                <CardDescription>Select which exchanges and tokens to monitor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Enabled Exchanges</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Uniswap V3", "SushiSwap", "Balancer", "Curve", "1inch", "Kyber"].map((exchange) => (
                      <div key={exchange} className="flex items-center space-x-2">
                        <Switch
                          id={exchange}
                          checked={config.enabledExchanges.includes(exchange.toLowerCase().replace(" ", ""))}
                          onCheckedChange={(checked) => {
                            const exchangeId = exchange.toLowerCase().replace(" ", "")
                            if (checked) {
                              handleConfigChange("enabledExchanges", [...config.enabledExchanges, exchangeId])
                            } else {
                              handleConfigChange(
                                "enabledExchanges",
                                config.enabledExchanges.filter((e) => e !== exchangeId),
                              )
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
                  <div className="grid grid-cols-2 gap-2">
                    {["WETH", "USDC", "USDT", "WBTC", "DAI", "ARB"].map((token) => (
                      <div key={token} className="flex items-center space-x-2">
                        <Switch
                          id={token}
                          checked={config.enabledTokens.includes(token)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleConfigChange("enabledTokens", [...config.enabledTokens, token])
                            } else {
                              handleConfigChange(
                                "enabledTokens",
                                config.enabledTokens.filter((t) => t !== token),
                              )
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
          </div>
        </TabsContent>

        {/* Manual Execution Tab */}
        <TabsContent value="execution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Manual Trade Execution
              </CardTitle>
              <CardDescription>Execute arbitrage trades manually with custom parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Token Pair</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select token pair" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weth-usdc">WETH/USDC</SelectItem>
                        <SelectItem value="wbtc-usdt">WBTC/USDT</SelectItem>
                        <SelectItem value="arb-usdc">ARB/USDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Source Exchange</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source exchange" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uniswap">Uniswap V3</SelectItem>
                        <SelectItem value="sushiswap">SushiSwap</SelectItem>
                        <SelectItem value="balancer">Balancer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Exchange</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target exchange" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uniswap">Uniswap V3</SelectItem>
                        <SelectItem value="sushiswap">SushiSwap</SelectItem>
                        <SelectItem value="balancer">Balancer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Trade Amount ($)</Label>
                    <Input type="number" placeholder="1000" min="100" max="10000" />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Slippage (%)</Label>
                    <Input type="number" placeholder="0.5" min="0.1" max="5" step="0.1" />
                  </div>

                  <div className="space-y-2">
                    <Label>Gas Price (Gwei)</Label>
                    <Input type="number" placeholder="20" min="1" max="100" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Estimated profit: <span className="font-medium text-green-600">$12.45 (0.24%)</span>
                </div>
                <Button disabled={!isConnected} size="lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Execute Trade
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
