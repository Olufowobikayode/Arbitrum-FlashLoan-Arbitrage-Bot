"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Zap, Shield, DollarSign, Gauge, Target, CheckCircle, Info } from "lucide-react"
import { useBot } from "../contexts/BotContext"
import TelegramConfigPanel from "./TelegramConfigPanel"

const ConfigPanel: React.FC = () => {
  const {
    botState,
    updateBotState,
    updateFlashloanConfig,
    updateGasSettings,
    updateSlippageSettings,
    updateAutoExecutionSettings,
    updateTelegramConfig,
    telegramService,
  } = useBot()

  const [tempGasPrice, setTempGasPrice] = useState(botState.currentGas)
  const [tempSlippage, setTempSlippage] = useState(1.5)
  const [isUpdatingGas, setIsUpdatingGas] = useState(false)
  const [isUpdatingSlippage, setIsUpdatingSlippage] = useState(false)

  const handleGasUpdate = async () => {
    setIsUpdatingGas(true)
    try {
      await updateGasSettings(tempGasPrice)
    } finally {
      setIsUpdatingGas(false)
    }
  }

  const handleSlippageUpdate = async () => {
    setIsUpdatingSlippage(true)
    try {
      await updateSlippageSettings(tempSlippage * 100) // Convert to basis points
    } finally {
      setIsUpdatingSlippage(false)
    }
  }

  const getGasRecommendation = (gasPrice: number) => {
    if (gasPrice < 50) return { level: "Low", color: "bg-green-500", description: "Slow confirmation" }
    if (gasPrice < 100) return { level: "Standard", color: "bg-yellow-500", description: "Normal speed" }
    if (gasPrice < 200) return { level: "Fast", color: "bg-orange-500", description: "Quick confirmation" }
    return { level: "Aggressive", color: "bg-red-500", description: "Fastest confirmation" }
  }

  const gasRec = getGasRecommendation(tempGasPrice)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Bot Configuration
          </CardTitle>
          <CardDescription>Configure trading parameters, security settings, and notifications</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="trading" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="gas">Gas & Fees</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Trading Configuration */}
        <TabsContent value="trading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Flashloan Configuration
              </CardTitle>
              <CardDescription>Configure flashloan parameters for arbitrage execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flashloanToken">Flashloan Token</Label>
                  <Select
                    value={botState.flashloanToken}
                    onValueChange={(value) => updateFlashloanConfig({ token: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="DAI">DAI</SelectItem>
                      <SelectItem value="WETH">WETH</SelectItem>
                      <SelectItem value="WBTC">WBTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flashloanAmount">Amount</Label>
                  <Input
                    id="flashloanAmount"
                    type="number"
                    value={botState.flashloanAmount}
                    onChange={(e) => updateFlashloanConfig({ amount: Number(e.target.value) })}
                    placeholder="250000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flashloanProvider">Provider</Label>
                  <Select
                    value={botState.flashloanProvider}
                    onValueChange={(value) => updateFlashloanConfig({ provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aave">Aave V3</SelectItem>
                      <SelectItem value="balancer">Balancer</SelectItem>
                      <SelectItem value="uniswap">Uniswap V3</SelectItem>
                      <SelectItem value="dydx">dYdX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Current Setup:</strong> {botState.flashloanAmount.toLocaleString()} {botState.flashloanToken}
                  from {botState.flashloanProvider.charAt(0).toUpperCase() + botState.flashloanProvider.slice(1)}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Trading Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Profit Threshold</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">$10</span>
                    <Slider
                      value={[botState.minProfitThreshold]}
                      onValueChange={([value]) => updateAutoExecutionSettings({ minProfitThreshold: value })}
                      max={500}
                      min={10}
                      step={10}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">$500</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Current: ${botState.minProfitThreshold}</p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Slippage</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">0.1%</span>
                    <Slider
                      value={[botState.maxSlippagePercent]}
                      onValueChange={([value]) => updateAutoExecutionSettings({ maxSlippagePercent: value })}
                      max={5}
                      min={0.1}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">5%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Current: {botState.maxSlippagePercent}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Simulation Mode</Label>
                  <p className="text-sm text-muted-foreground">Test trades before execution</p>
                </div>
                <Switch
                  checked={botState.simulationEnabled}
                  onCheckedChange={(checked) => updateBotState({ simulationEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gas & Fees Configuration */}
        <TabsContent value="gas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Gas Price Settings
              </CardTitle>
              <CardDescription>Configure gas prices for optimal transaction speed and cost</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Current Gas Price</Label>
                    <p className="text-sm text-muted-foreground">{botState.currentGas} Gwei</p>
                  </div>
                  <Badge className={gasRec.color}>{gasRec.level}</Badge>
                </div>

                <div className="space-y-2">
                  <Label>Gas Price (Gwei)</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">10</span>
                    <Slider
                      value={[tempGasPrice]}
                      onValueChange={([value]) => setTempGasPrice(value)}
                      max={500}
                      min={10}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">500</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{tempGasPrice} Gwei</span>
                    <span className={`px-2 py-1 rounded text-xs ${gasRec.color} text-white`}>{gasRec.description}</span>
                  </div>
                </div>

                <Button
                  onClick={handleGasUpdate}
                  disabled={isUpdatingGas || tempGasPrice === botState.currentGas}
                  className="w-full"
                >
                  {isUpdatingGas ? "Updating..." : "Update Gas Price"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label>Maximum Gas Price</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-sm text-muted-foreground">50</span>
                    <Slider
                      value={[botState.maxGasGwei]}
                      onValueChange={([value]) => updateAutoExecutionSettings({ maxGasGwei: value })}
                      max={1000}
                      min={50}
                      step={10}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">1000</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {botState.maxGasGwei} Gwei (Auto-execution limit)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Slippage Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Slippage Tolerance (%)</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">0.1</span>
                  <Slider
                    value={[tempSlippage]}
                    onValueChange={([value]) => setTempSlippage(value)}
                    max={5}
                    min={0.1}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">5.0</span>
                </div>
                <p className="text-sm text-muted-foreground">Current: {tempSlippage}%</p>
              </div>

              <Button onClick={handleSlippageUpdate} disabled={isUpdatingSlippage} className="w-full">
                {isUpdatingSlippage ? "Updating..." : "Update Slippage"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Configuration */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security measures and risk management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>MEV Protection</Label>
                    <p className="text-sm text-muted-foreground">Use private mempool for sensitive trades</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sandwich Attack Protection</Label>
                    <p className="text-sm text-muted-foreground">Monitor for sandwich attacks</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Emergency Stop on Consecutive Failures</Label>
                    <p className="text-sm text-muted-foreground">Auto-stop after 5 failed trades</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Token Security Validation</Label>
                    <p className="text-sm text-muted-foreground">Verify token contracts before trading</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Status:</strong> {botState.securityStatus}
                  <br />
                  All security measures are currently active and monitoring for threats.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Configuration */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Auto-Execution Settings
              </CardTitle>
              <CardDescription>Configure automated trading parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Auto-Execution</Label>
                  <p className="text-sm text-muted-foreground">Automatically execute profitable trades</p>
                </div>
                <Switch
                  checked={botState.autoExecuteEnabled}
                  onCheckedChange={(checked) => updateAutoExecutionSettings({ autoExecuteEnabled: checked })}
                />
              </div>

              {botState.autoExecuteEnabled && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Auto-execution is enabled.</strong> The bot will automatically execute trades that meet your
                    criteria.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <Label>Scan Interval</Label>
                  <Select defaultValue="15">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Simulation Success</Label>
                    <p className="text-sm text-muted-foreground">Only execute if simulation passes</p>
                  </div>
                  <Switch
                    checked={botState.autoExecuteAfterSimulation}
                    onCheckedChange={(checked) => updateBotState({ autoExecuteAfterSimulation: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Configuration */}
        <TabsContent value="notifications" className="space-y-4">
          <TelegramConfigPanel onConfigChange={updateTelegramConfig} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ConfigPanel
