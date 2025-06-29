"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Settings, Shield, CheckCircle, ArrowRight, ArrowLeft, AlertTriangle, Zap } from "lucide-react"
import { useWeb3 } from "@/src/contexts/Web3Context"
import toast from "react-hot-toast"

interface SetupWizardProps {
  onComplete: () => void
}

interface SetupConfig {
  walletConnected: boolean
  rpcEndpoint: string
  flashloanProvider: string
  minProfitThreshold: number
  maxSlippage: number
  gasLimit: number
  enableNotifications: boolean
  telegramToken: string
  riskLevel: string
  autoExecute: boolean
}

const defaultConfig: SetupConfig = {
  walletConnected: false,
  rpcEndpoint: "https://arb1.arbitrum.io/rpc",
  flashloanProvider: "aave",
  minProfitThreshold: 10,
  maxSlippage: 0.5,
  gasLimit: 500000,
  enableNotifications: false,
  telegramToken: "",
  riskLevel: "medium",
  autoExecute: false,
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [config, setConfig] = useState<SetupConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(false)
  const { connectWallet, isConnected, account } = useWeb3()

  const steps = [
    {
      title: "Welcome",
      description: "Welcome to ArbitrageBot Setup",
      icon: Zap,
    },
    {
      title: "Wallet Connection",
      description: "Connect your wallet to get started",
      icon: Wallet,
    },
    {
      title: "Bot Configuration",
      description: "Configure your trading parameters",
      icon: Settings,
    },
    {
      title: "Security Settings",
      description: "Set up security and risk management",
      icon: Shield,
    },
    {
      title: "Complete",
      description: "Setup complete! Ready to start trading",
      icon: CheckCircle,
    },
  ]

  const handleWalletConnect = async () => {
    try {
      setIsLoading(true)
      await connectWallet()
      setConfig((prev) => ({ ...prev, walletConnected: true }))
      toast.success("Wallet connected successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to connect wallet")
    } finally {
      setIsLoading(false)
    }
  }

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
    localStorage.setItem("botConfig", JSON.stringify(config))
    localStorage.setItem("setupComplete", "true")

    toast.success("Setup completed successfully!")
    onComplete()
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isConnected
      case 2:
        return config.rpcEndpoint && config.flashloanProvider
      case 3:
        return config.minProfitThreshold > 0 && config.maxSlippage > 0
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
              <Zap className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to ArbitrageBot</h2>
              <p className="text-muted-foreground">
                Let's set up your automated arbitrage trading bot. This wizard will guide you through the essential
                configuration steps to get you started.
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-2">What you'll configure:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Wallet connection and network settings</li>
                <li>• Trading parameters and risk management</li>
                <li>• Security settings and notifications</li>
                <li>• Bot automation preferences</li>
              </ul>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground">Connect your MetaMask wallet to interact with DeFi protocols</p>
            </div>

            {!isConnected ? (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Make sure you have MetaMask installed and are on the Arbitrum network.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleWalletConnect} disabled={isLoading} className="w-full" size="lg">
                  <Wallet className="w-4 h-4 mr-2" />
                  {isLoading ? "Connecting..." : "Connect MetaMask"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Wallet connected successfully! Address: {account?.slice(0, 6)}...{account?.slice(-4)}
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
              <h2 className="text-xl font-bold mb-2">Bot Configuration</h2>
              <p className="text-muted-foreground">Configure your bot's trading parameters</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rpc-endpoint">RPC Endpoint</Label>
                <Input
                  id="rpc-endpoint"
                  value={config.rpcEndpoint}
                  onChange={(e) => setConfig((prev) => ({ ...prev, rpcEndpoint: e.target.value }))}
                  placeholder="https://arb1.arbitrum.io/rpc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flashloan-provider">Flashloan Provider</Label>
                <Select
                  value={config.flashloanProvider}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, flashloanProvider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aave">Aave</SelectItem>
                    <SelectItem value="balancer">Balancer</SelectItem>
                    <SelectItem value="dydx">dYdX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-profit">Min Profit ($)</Label>
                  <Input
                    id="min-profit"
                    type="number"
                    value={config.minProfitThreshold}
                    onChange={(e) => setConfig((prev) => ({ ...prev, minProfitThreshold: Number(e.target.value) }))}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-slippage">Max Slippage (%)</Label>
                  <Input
                    id="max-slippage"
                    type="number"
                    value={config.maxSlippage}
                    onChange={(e) => setConfig((prev) => ({ ...prev, maxSlippage: Number(e.target.value) }))}
                    min="0.1"
                    max="5"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-bold mb-2">Security Settings</h2>
              <p className="text-muted-foreground">Configure risk management and security options</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="risk-level">Risk Level</Label>
                <Select
                  value={config.riskLevel}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, riskLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Conservative trading</SelectItem>
                    <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                    <SelectItem value="high">High - Aggressive trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gas-limit">Gas Limit</Label>
                <Input
                  id="gas-limit"
                  type="number"
                  value={config.gasLimit}
                  onChange={(e) => setConfig((prev) => ({ ...prev, gasLimit: Number(e.target.value) }))}
                  min="100000"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-execute"
                    checked={config.autoExecute}
                    onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, autoExecute: !!checked }))}
                  />
                  <Label htmlFor="auto-execute">Enable automatic trade execution</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifications"
                    checked={config.enableNotifications}
                    onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enableNotifications: !!checked }))}
                  />
                  <Label htmlFor="notifications">Enable notifications</Label>
                </div>
              </div>

              {config.enableNotifications && (
                <div className="space-y-2">
                  <Label htmlFor="telegram-token">Telegram Bot Token (Optional)</Label>
                  <Input
                    id="telegram-token"
                    value={config.telegramToken}
                    onChange={(e) => setConfig((prev) => ({ ...prev, telegramToken: e.target.value }))}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                </div>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
              <p className="text-muted-foreground">Your arbitrage bot is now configured and ready to start trading.</p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-2">Configuration Summary:</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• Wallet: {isConnected ? "Connected" : "Not connected"}</div>
                <div>• Flashloan Provider: {config.flashloanProvider}</div>
                <div>• Min Profit: ${config.minProfitThreshold}</div>
                <div>• Max Slippage: {config.maxSlippage}%</div>
                <div>• Risk Level: {config.riskLevel}</div>
                <div>• Auto Execute: {config.autoExecute ? "Enabled" : "Disabled"}</div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(steps[currentStep].icon, { className: "w-5 h-5" })}
                  {steps[currentStep].title}
                </CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            <Progress value={(currentStep / (steps.length - 1)) * 100} />
          </CardHeader>

          <CardContent className="space-y-6">
            {renderStepContent()}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button onClick={handleComplete}>
                  Complete Setup
                  <CheckCircle className="w-4 h-4 ml-2" />
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
    </div>
  )
}
