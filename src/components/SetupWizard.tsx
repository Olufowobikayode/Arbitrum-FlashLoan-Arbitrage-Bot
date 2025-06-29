"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, ArrowRight, ArrowLeft, Wallet, Settings, Target, AlertTriangle } from "lucide-react"
import { useWeb3 } from "@/src/contexts/Web3Context"

interface SetupWizardProps {
  onComplete: () => void
}

interface SetupData {
  walletConnected: boolean
  tradingSettings: {
    minProfitThreshold: number
    maxSlippage: number
    riskLevel: "low" | "medium" | "high"
  }
  notifications: {
    email: string
    enableAlerts: boolean
  }
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const { isConnected, connectWallet } = useWeb3()
  const [currentStep, setCurrentStep] = useState(0)
  const [setupData, setSetupData] = useState<SetupData>({
    walletConnected: false,
    tradingSettings: {
      minProfitThreshold: 10,
      maxSlippage: 0.5,
      riskLevel: "medium",
    },
    notifications: {
      email: "",
      enableAlerts: true,
    },
  })

  const steps = [
    {
      title: "Welcome",
      description: "Let's set up your arbitrage trading bot",
      icon: Target,
    },
    {
      title: "Connect Wallet",
      description: "Connect your wallet to start trading",
      icon: Wallet,
    },
    {
      title: "Trading Settings",
      description: "Configure your trading parameters",
      icon: Settings,
    },
    {
      title: "Complete Setup",
      description: "Review and finish setup",
      icon: CheckCircle,
    },
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
    onComplete()
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isConnected
      case 2:
        return setupData.tradingSettings.minProfitThreshold > 0
      default:
        return true
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
              <Target className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Arbitrage Bot</h2>
              <p className="text-muted-foreground">
                Your automated trading assistant for finding and executing profitable arbitrage opportunities across
                decentralized exchanges.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-1">Automated Trading</div>
                <div className="text-muted-foreground">Execute trades automatically when opportunities are found</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-1">Risk Management</div>
                <div className="text-muted-foreground">Built-in safety features to protect your capital</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-1">Real-time Monitoring</div>
                <div className="text-muted-foreground">Track performance and opportunities in real-time</div>
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground">
                Connect your wallet to enable trading functionality. We support MetaMask and other Web3 wallets.
              </p>
            </div>

            {!isConnected ? (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Make sure you have MetaMask or another Web3 wallet installed and set up before proceeding.
                  </AlertDescription>
                </Alert>
                <Button onClick={connectWallet} className="w-full" size="lg">
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Wallet connected successfully! You can now proceed to the next step.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-bold mb-2">Trading Settings</h2>
              <p className="text-muted-foreground">Configure your trading parameters and risk management settings.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minProfit">Minimum Profit Threshold ($)</Label>
                <Input
                  id="minProfit"
                  type="number"
                  value={setupData.tradingSettings.minProfitThreshold}
                  onChange={(e) =>
                    setSetupData((prev) => ({
                      ...prev,
                      tradingSettings: {
                        ...prev.tradingSettings,
                        minProfitThreshold: Number(e.target.value),
                      },
                    }))
                  }
                  min="1"
                  max="1000"
                />
                <p className="text-xs text-muted-foreground">Only execute trades with profit above this threshold</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSlippage">Maximum Slippage (%)</Label>
                <Input
                  id="maxSlippage"
                  type="number"
                  value={setupData.tradingSettings.maxSlippage}
                  onChange={(e) =>
                    setSetupData((prev) => ({
                      ...prev,
                      tradingSettings: {
                        ...prev.tradingSettings,
                        maxSlippage: Number(e.target.value),
                      },
                    }))
                  }
                  min="0.1"
                  max="5"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">Maximum acceptable slippage for trades</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskLevel">Risk Level</Label>
                <Select
                  value={setupData.tradingSettings.riskLevel}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setSetupData((prev) => ({
                      ...prev,
                      tradingSettings: {
                        ...prev.tradingSettings,
                        riskLevel: value,
                      },
                    }))
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

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={setupData.notifications.email}
                  onChange={(e) =>
                    setSetupData((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        email: e.target.value,
                      },
                    }))
                  }
                  placeholder="your@email.com"
                />
                <p className="text-xs text-muted-foreground">Receive trading alerts and reports</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableAlerts"
                  checked={setupData.notifications.enableAlerts}
                  onCheckedChange={(checked) =>
                    setSetupData((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        enableAlerts: checked,
                      },
                    }))
                  }
                />
                <Label htmlFor="enableAlerts">Enable trading alerts</Label>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-bold mb-2">Setup Complete!</h2>
              <p className="text-muted-foreground">Your arbitrage bot is now configured and ready to start trading.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Configuration Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Wallet:</span>
                    <span className="text-green-600">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Profit:</span>
                    <span>${setupData.tradingSettings.minProfitThreshold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Slippage:</span>
                    <span>{setupData.tradingSettings.maxSlippage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Level:</span>
                    <span className="capitalize">{setupData.tradingSettings.riskLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alerts:</span>
                    <span>{setupData.notifications.enableAlerts ? "Enabled" : "Disabled"}</span>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You can always modify these settings later from the configuration panel.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">Setup Wizard</CardTitle>
              <CardDescription>
                Step {currentStep + 1} of {steps.length}
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${isCompleted ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-8">{renderStepContent()}</div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button onClick={handleComplete}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Setup
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
