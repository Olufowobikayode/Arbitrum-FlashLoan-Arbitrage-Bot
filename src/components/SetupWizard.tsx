"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ArrowRight, ArrowLeft, Wallet, Settings, Target, Shield, AlertTriangle } from "lucide-react"
import { useWeb3 } from "@/src/contexts/Web3Context"

interface SetupWizardProps {
  onComplete: () => void
}

const steps = [
  {
    id: 1,
    title: "Welcome",
    description: "Get started with ArbiBot",
  },
  {
    id: 2,
    title: "Connect Wallet",
    description: "Connect your Web3 wallet",
  },
  {
    id: 3,
    title: "Basic Configuration",
    description: "Set up trading parameters",
  },
  {
    id: 4,
    title: "Risk Management",
    description: "Configure safety settings",
  },
  {
    id: 5,
    title: "Complete Setup",
    description: "Review and finish",
  },
]

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState({
    minProfitThreshold: 10,
    maxSlippage: 0.5,
    riskLevel: "medium" as "low" | "medium" | "high",
    autoExecute: false,
    maxTradeSize: 1000,
    enabledExchanges: ["uniswap", "sushiswap"],
    enabledTokens: ["WETH", "USDC"],
  })

  const { connect, isConnected, account, chainId } = useWeb3()

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    // Save configuration
    if (typeof window !== "undefined") {
      localStorage.setItem("botConfig", JSON.stringify(config))
    }
    onComplete()
  }

  const canProceed = () => {
    switch (currentStep) {
      case 2:
        return isConnected && chainId === 42161
      case 3:
        return config.minProfitThreshold > 0 && config.maxSlippage > 0
      case 4:
        return true
      default:
        return true
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to ArbiBot</h2>
              <p className="text-muted-foreground">
                Your automated arbitrage trading bot for DeFi protocols. Let's get you set up in just a few steps.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 border rounded-lg">
                <Shield className="w-8 h-8 text-blue-500 mb-2" />
                <h3 className="font-medium">Secure</h3>
                <p className="text-muted-foreground">Your keys, your funds</p>
              </div>
              <div className="p-4 border rounded-lg">
                <Target className="w-8 h-8 text-green-500 mb-2" />
                <h3 className="font-medium">Automated</h3>
                <p className="text-muted-foreground">24/7 opportunity scanning</p>
              </div>
              <div className="p-4 border rounded-lg">
                <Settings className="w-8 h-8 text-purple-500 mb-2" />
                <h3 className="font-medium">Configurable</h3>
                <p className="text-muted-foreground">Customize to your needs</p>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Wallet className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground">
                Connect your Web3 wallet to start trading. We recommend using MetaMask.
              </p>
            </div>

            {!isConnected ? (
              <div className="space-y-4">
                <Button onClick={connect} className="w-full" size="lg">
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect MetaMask
                </Button>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Make sure you have MetaMask installed and are on the Arbitrum network.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Wallet connected successfully! Account: {account?.slice(0, 6)}...{account?.slice(-4)}
                  </AlertDescription>
                </Alert>

                {chainId !== 42161 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Please switch to the Arbitrum network to continue.</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Basic Configuration</h2>
              <p className="text-muted-foreground">Set up your basic trading parameters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="minProfit">Minimum Profit Threshold ($)</Label>
                  <Input
                    id="minProfit"
                    type="number"
                    value={config.minProfitThreshold}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        minProfitThreshold: Number(e.target.value),
                      }))
                    }
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
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        maxSlippage: Number(e.target.value),
                      }))
                    }
                    min="0.1"
                    max="5"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground">Maximum acceptable slippage for trades</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxTradeSize">Maximum Trade Size ($)</Label>
                  <Input
                    id="maxTradeSize"
                    type="number"
                    value={config.maxTradeSize}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        maxTradeSize: Number(e.target.value),
                      }))
                    }
                    min="100"
                    max="10000"
                  />
                  <p className="text-xs text-muted-foreground">Maximum amount to trade in a single transaction</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoExecute"
                    checked={config.autoExecute}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({
                        ...prev,
                        autoExecute: checked,
                      }))
                    }
                  />
                  <Label htmlFor="autoExecute">Enable automatic trade execution</Label>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Risk Management</h2>
              <p className="text-muted-foreground">Configure your risk tolerance and safety settings.</p>
            </div>

            <div className="space-y-6">
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
                  <strong>Important:</strong> Higher risk levels may yield higher profits but also increase potential
                  losses. Only trade with funds you can afford to lose.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Low Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Higher profit thresholds</li>
                      <li>• Conservative slippage limits</li>
                      <li>• Fewer but safer trades</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">High Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Lower profit thresholds</li>
                      <li>• Higher slippage tolerance</li>
                      <li>• More frequent trading</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
              <p className="text-muted-foreground">
                Your ArbiBot is ready to start trading. Review your settings below.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Configuration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Wallet:</span>
                    <p className="font-medium">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Network:</span>
                    <p className="font-medium">Arbitrum One</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min Profit:</span>
                    <p className="font-medium">${config.minProfitThreshold}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Slippage:</span>
                    <p className="font-medium">{config.maxSlippage}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk Level:</span>
                    <p className="font-medium capitalize">{config.riskLevel}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Auto Execute:</span>
                    <p className="font-medium">{config.autoExecute ? "Enabled" : "Disabled"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You can always modify these settings later in the Configuration panel.
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Setup Wizard</h1>
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
        </div>
        <Progress value={(currentStep / steps.length) * 100} className="mb-4" />
        <div className="flex justify-between text-sm">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                step.id <= currentStep ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  step.id < currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id === currentStep
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step.id < currentStep ? <CheckCircle className="w-4 h-4" /> : step.id}
              </div>
              <span className="text-xs text-center">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <Card className="mb-8">
        <CardContent className="p-8">{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep === steps.length ? (
          <Button onClick={handleComplete} size="lg">
            Complete Setup
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={nextStep} disabled={!canProceed()} size="lg">
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
