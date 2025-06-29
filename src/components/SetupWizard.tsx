"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Wallet, Settings, Zap, ArrowRight, ArrowLeft } from "lucide-react"
import { useWeb3 } from "../contexts/Web3Context"
import { useBot } from "../contexts/BotContext"

interface SetupWizardProps {
  onComplete: () => void
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [config, setConfig] = useState({
    minProfitThreshold: 0.5,
    maxSlippage: 1.0,
    gasLimit: 500000,
    enabledExchanges: ["uniswap", "sushiswap"],
    enabledTokens: ["WETH", "USDC", "DAI"],
    riskLevel: "medium" as "low" | "medium" | "high",
    autoRebalance: true,
    stopLoss: 5.0,
    takeProfit: 10.0,
  })

  const { connectWallet, isConnected, account, isConnecting } = useWeb3()
  const { updateBotConfig } = useBot()

  const steps = [
    {
      title: "Welcome",
      description: "Let's set up your flashloan arbitrage bot",
      icon: Zap,
    },
    {
      title: "Connect Wallet",
      description: "Connect your MetaMask wallet to get started",
      icon: Wallet,
    },
    {
      title: "Configure Bot",
      description: "Set your trading parameters and risk preferences",
      icon: Settings,
    },
    {
      title: "Complete",
      description: "Your bot is ready to start trading",
      icon: CheckCircle,
    },
  ]

  const exchanges = [
    { id: "uniswap", name: "Uniswap V2/V3", enabled: true },
    { id: "sushiswap", name: "SushiSwap", enabled: true },
    { id: "balancer", name: "Balancer", enabled: false },
    { id: "curve", name: "Curve", enabled: false },
    { id: "1inch", name: "1inch", enabled: false },
  ]

  const tokens = [
    { id: "WETH", name: "Wrapped Ethereum", enabled: true },
    { id: "USDC", name: "USD Coin", enabled: true },
    { id: "DAI", name: "Dai Stablecoin", enabled: true },
    { id: "USDT", name: "Tether USD", enabled: false },
    { id: "WBTC", name: "Wrapped Bitcoin", enabled: false },
    { id: "UNI", name: "Uniswap Token", enabled: false },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    // Save configuration
    updateBotConfig({
      minProfitThreshold: config.minProfitThreshold,
      maxSlippage: config.maxSlippage,
      riskLevel: config.riskLevel,
    })

    // Mark setup as complete
    onComplete()
  }

  const toggleExchange = (exchangeId: string) => {
    setConfig((prev) => ({
      ...prev,
      enabledExchanges: prev.enabledExchanges.includes(exchangeId)
        ? prev.enabledExchanges.filter((id) => id !== exchangeId)
        : [...prev.enabledExchanges, exchangeId],
    }))
  }

  const toggleToken = (tokenId: string) => {
    setConfig((prev) => ({
      ...prev,
      enabledTokens: prev.enabledTokens.includes(tokenId)
        ? prev.enabledTokens.filter((id) => id !== tokenId)
        : [...prev.enabledTokens, tokenId],
    }))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to FlashBot</h2>
              <p className="text-muted-foreground">
                Your advanced flashloan arbitrage trading bot. Let's get you set up in just a few steps.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-1">Automated Trading</div>
                <div className="text-muted-foreground">24/7 arbitrage opportunity scanning</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-1">Risk Management</div>
                <div className="text-muted-foreground">Built-in stop-loss and take-profit</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-1">Multi-DEX Support</div>
                <div className="text-muted-foreground">Trade across multiple exchanges</div>
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Wallet className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground">Connect your MetaMask wallet to enable trading functionality.</p>
            </div>

            {isConnected ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Wallet Connected</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 font-mono">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button onClick={connectWallet} disabled={isConnecting} size="lg" className="w-full">
                  <Wallet className="w-4 h-4 mr-2" />
                  {isConnecting ? "Connecting..." : "Connect MetaMask"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Don't have MetaMask?{" "}
                  <a
                    href="https://metamask.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Install it here
                  </a>
                </p>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Configure Your Bot</h2>
              <p className="text-muted-foreground">Set your trading parameters and risk preferences.</p>
            </div>

            <div className="grid gap-6">
              {/* Trading Parameters */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trading Parameters</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Profit Threshold (%)</Label>
                    <div className="px-3">
                      <Slider
                        value={[config.minProfitThreshold]}
                        onValueChange={([value]) => setConfig((prev) => ({ ...prev, minProfitThreshold: value }))}
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
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Slippage (%)</Label>
                    <div className="px-3">
                      <Slider
                        value={[config.maxSlippage]}
                        onValueChange={([value]) => setConfig((prev) => ({ ...prev, maxSlippage: value }))}
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
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Risk Level</Label>
                    <div className="flex gap-2">
                      {["low", "medium", "high"].map((level) => (
                        <Button
                          key={level}
                          variant={config.riskLevel === level ? "default" : "outline"}
                          size="sm"
                          onClick={() => setConfig((prev) => ({ ...prev, riskLevel: level as any }))}
                          className="flex-1 capitalize"
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Stop Loss (%)</Label>
                    <Input
                      type="number"
                      value={config.stopLoss}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, stopLoss: Number.parseFloat(e.target.value) || 0 }))
                      }
                      min="0"
                      max="50"
                      step="0.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Take Profit (%)</Label>
                    <Input
                      type="number"
                      value={config.takeProfit}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, takeProfit: Number.parseFloat(e.target.value) || 0 }))
                      }
                      min="0"
                      max="100"
                      step="0.5"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Exchange Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Supported Exchanges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exchanges.map((exchange) => (
                    <div
                      key={exchange.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExchange(exchange.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{exchange.name}</div>
                        {!exchange.enabled && <Badge variant="secondary">Coming Soon</Badge>}
                      </div>
                      <Switch checked={config.enabledExchanges.includes(exchange.id)} disabled={!exchange.enabled} />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Token Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Supported Tokens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tokens.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleToken(token.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{token.id}</div>
                          <div className="text-sm text-muted-foreground">{token.name}</div>
                        </div>
                        {!token.enabled && <Badge variant="secondary">Coming Soon</Badge>}
                      </div>
                      <Switch checked={config.enabledTokens.includes(token.id)} disabled={!token.enabled} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
              <p className="text-muted-foreground">Your flashloan arbitrage bot is ready to start trading.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-2">Configuration Summary</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Min Profit: {config.minProfitThreshold}%</div>
                  <div>Max Slippage: {config.maxSlippage}%</div>
                  <div>Risk Level: {config.riskLevel}</div>
                  <div>Exchanges: {config.enabledExchanges.length}</div>
                  <div>Tokens: {config.enabledTokens.length}</div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-2">Next Steps</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• Review your dashboard</div>
                  <div>• Start the bot when ready</div>
                  <div>• Monitor performance</div>
                  <div>• Adjust settings as needed</div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isConnected
      case 2:
        return config.enabledExchanges.length > 0 && config.enabledTokens.length > 0
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {index < currentStep ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${index < currentStep ? "bg-primary" : "bg-muted-foreground/30"}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="w-full" />
          <CardTitle className="mt-4">{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStepContent()}

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button onClick={handleComplete} className="gap-2">
                Complete Setup
                <CheckCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
