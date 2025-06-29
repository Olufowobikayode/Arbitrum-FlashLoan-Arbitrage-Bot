"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Eye, EyeOff, Rocket, Shield, Settings, Globe, Key, ExternalLink, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SetupConfig {
  privateKey: string
  arbitrumRpc: string
  arbiscanApiKey: string
  contractAddress: string
  reactAppRpc: string
  reportGas: boolean
  alchemyApiKey: string
  coingeckoApiKey: string
}

interface ValidationResult {
  isValid: boolean
  message: string
}

interface SetupWizardProps {
  onComplete?: () => void
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState<SetupConfig>({
    privateKey: "",
    arbitrumRpc: "https://arbitrum-one.publicnode.com",
    arbiscanApiKey: "",
    contractAddress: "",
    reactAppRpc: "https://arbitrum-one.publicnode.com",
    reportGas: true,
    alchemyApiKey: "",
    coingeckoApiKey: "",
  })
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showAlchemyKey, setShowAlchemyKey] = useState(false)
  const [showCoingeckoKey, setShowCoingeckoKey] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const totalSteps = 2
  const progress = (currentStep / totalSteps) * 100

  // Validation functions
  const validatePrivateKey = (key: string): ValidationResult => {
    if (!key) return { isValid: false, message: "Private key is required" }
    if (key.startsWith("0x")) return { isValid: false, message: "Remove 0x prefix from private key" }
    if (key.length !== 64) return { isValid: false, message: "Private key must be 64 characters long" }
    if (!/^[a-fA-F0-9]+$/.test(key)) return { isValid: false, message: "Private key must be hexadecimal" }
    return { isValid: true, message: "Valid private key" }
  }

  const validateRpcUrl = (url: string): ValidationResult => {
    if (!url) return { isValid: false, message: "RPC URL is required" }
    try {
      new URL(url)
      if (!url.startsWith("https://")) return { isValid: false, message: "RPC URL must use HTTPS" }
      return { isValid: true, message: "Valid RPC URL" }
    } catch {
      return { isValid: false, message: "Invalid URL format" }
    }
  }

  const validateApiKey = (key: string): ValidationResult => {
    if (!key) return { isValid: true, message: "API key is optional" }
    if (key.length < 10) return { isValid: false, message: "API key seems too short" }
    return { isValid: true, message: "Valid API key" }
  }

  // Real-time validation
  useEffect(() => {
    const errors: Record<string, string> = {}

    const privateKeyValidation = validatePrivateKey(config.privateKey)
    if (!privateKeyValidation.isValid) errors.privateKey = privateKeyValidation.message

    const rpcValidation = validateRpcUrl(config.arbitrumRpc)
    if (!rpcValidation.isValid) errors.arbitrumRpc = rpcValidation.message

    const apiKeyValidation = validateApiKey(config.arbiscanApiKey)
    if (!apiKeyValidation.isValid) errors.arbiscanApiKey = apiKeyValidation.message

    const alchemyValidation = validateApiKey(config.alchemyApiKey)
    if (!alchemyValidation.isValid) errors.alchemyApiKey = alchemyValidation.message

    const coingeckoValidation = validateApiKey(config.coingeckoApiKey)
    if (!coingeckoValidation.isValid) errors.coingeckoApiKey = coingeckoValidation.message

    setValidationErrors(errors)
  }, [config])

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return !validationErrors.privateKey && !validationErrors.arbitrumRpc
      default:
        return true
    }
  }

  const handleCompleteSetup = async () => {
    setIsProcessing(true)

    try {
      // Generate a mock contract address for demo purposes
      const mockContractAddress = "0x" + Math.random().toString(16).substr(2, 40)
      const finalConfig = {
        ...config,
        contractAddress: mockContractAddress,
      }

      // Save configuration to localStorage
      localStorage.setItem("botConfig", JSON.stringify(finalConfig))
      localStorage.setItem("setupComplete", "true")

      // Simulate deployment process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Setup Complete!",
        description: "Your bot is ready to use. Redirecting to dashboard...",
      })

      // Call the onComplete callback to trigger redirect
      if (onComplete) {
        setTimeout(() => {
          onComplete()
        }, 1500)
      }
    } catch (error) {
      console.error("Setup error:", error)
      toast({
        title: "Setup Error",
        description: "There was an error completing setup. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Quick Setup</h2>
                <p className="text-gray-600">Configure your wallet and API keys to get started</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Private Key */}
              <div className="space-y-2">
                <Label htmlFor="privateKey" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Private Key *
                </Label>
                <div className="relative">
                  <Input
                    id="privateKey"
                    type={showPrivateKey ? "text" : "password"}
                    value={config.privateKey}
                    onChange={(e) => setConfig((prev) => ({ ...prev, privateKey: e.target.value }))}
                    placeholder="Enter your wallet private key (without 0x)"
                    className={validationErrors.privateKey ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {validationErrors.privateKey && <p className="text-sm text-red-600">{validationErrors.privateKey}</p>}
                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription>
                    Your private key is stored locally and never transmitted to external servers.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Arbitrum RPC */}
              <div className="space-y-2">
                <Label htmlFor="arbitrumRpc" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Arbitrum RPC URL *
                </Label>
                <Input
                  id="arbitrumRpc"
                  value={config.arbitrumRpc}
                  onChange={(e) => setConfig((prev) => ({ ...prev, arbitrumRpc: e.target.value }))}
                  placeholder="https://arbitrum-one.publicnode.com"
                  className={validationErrors.arbitrumRpc ? "border-red-500" : ""}
                />
                {validationErrors.arbitrumRpc && <p className="text-sm text-red-600">{validationErrors.arbitrumRpc}</p>}
              </div>

              {/* API Keys */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alchemyApiKey" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Alchemy API Key (Optional)
                  </Label>
                  <div className="relative">
                    <Input
                      id="alchemyApiKey"
                      type={showAlchemyKey ? "text" : "password"}
                      value={config.alchemyApiKey}
                      onChange={(e) => setConfig((prev) => ({ ...prev, alchemyApiKey: e.target.value }))}
                      placeholder="Get from https://alchemy.com"
                      className={validationErrors.alchemyApiKey ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowAlchemyKey(!showAlchemyKey)}
                    >
                      {showAlchemyKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {validationErrors.alchemyApiKey && (
                    <p className="text-sm text-red-600">{validationErrors.alchemyApiKey}</p>
                  )}
                  <p className="text-sm text-gray-600">Enhanced blockchain data and faster transactions</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coingeckoApiKey" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    CoinGecko API Key (Optional)
                  </Label>
                  <div className="relative">
                    <Input
                      id="coingeckoApiKey"
                      type={showCoingeckoKey ? "text" : "password"}
                      value={config.coingeckoApiKey}
                      onChange={(e) => setConfig((prev) => ({ ...prev, coingeckoApiKey: e.target.value }))}
                      placeholder="Get from https://coingecko.com/api"
                      className={validationErrors.coingeckoApiKey ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowCoingeckoKey(!showCoingeckoKey)}
                    >
                      {showCoingeckoKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {validationErrors.coingeckoApiKey && (
                    <p className="text-sm text-red-600">{validationErrors.coingeckoApiKey}</p>
                  )}
                  <p className="text-sm text-gray-600">Real-time price data and market information</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arbiscanApiKey" className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Arbiscan API Key (Optional)
                  </Label>
                  <Input
                    id="arbiscanApiKey"
                    value={config.arbiscanApiKey}
                    onChange={(e) => setConfig((prev) => ({ ...prev, arbiscanApiKey: e.target.value }))}
                    placeholder="Get from https://arbiscan.io/apis"
                    className={validationErrors.arbiscanApiKey ? "border-red-500" : ""}
                  />
                  {validationErrors.arbiscanApiKey && (
                    <p className="text-sm text-red-600">{validationErrors.arbiscanApiKey}</p>
                  )}
                  <p className="text-sm text-gray-600">Contract verification on Arbiscan</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Ready to Launch</h2>
                <p className="text-gray-600">Review your configuration and start trading</p>
              </div>
            </div>

            {/* Configuration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration Summary</CardTitle>
                <CardDescription>Your bot will be configured with these settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Private Key:</span>
                    <Badge variant={config.privateKey ? "default" : "secondary"}>
                      {config.privateKey ? "Configured" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Arbitrum RPC:</span>
                    <Badge variant={config.arbitrumRpc ? "default" : "secondary"}>
                      {config.arbitrumRpc ? "Configured" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Alchemy API:</span>
                    <Badge variant={config.alchemyApiKey ? "default" : "outline"}>
                      {config.alchemyApiKey ? "Configured" : "Optional"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">CoinGecko API:</span>
                    <Badge variant={config.coingeckoApiKey ? "default" : "outline"}>
                      {config.coingeckoApiKey ? "Configured" : "Optional"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Arbiscan API:</span>
                    <Badge variant={config.arbiscanApiKey ? "default" : "outline"}>
                      {config.arbiscanApiKey ? "Configured" : "Optional"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Rocket className="w-4 h-4" />
              <AlertDescription>
                <strong>Ready to go!</strong> Your flashloan arbitrage bot will be automatically configured and ready to
                use. The system will generate a demo contract address and initialize all services.
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Click "Launch Bot" to complete setup and access your dashboard
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Flashloan Arbitrage Bot</h1>
          <p className="text-xl text-gray-600">Quick setup to get you trading in minutes</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step < currentStep
                      ? "bg-green-500 text-white"
                      : step === currentStep
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 2 && <div className={`w-16 h-1 mx-2 ${step < currentStep ? "bg-green-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="mb-8">
          <CardContent className="p-8">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || isProcessing}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep < totalSteps ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToStep(currentStep + 1) || isProcessing}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleCompleteSetup}
                disabled={Object.keys(validationErrors).length > 0 || isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Launch Bot
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <Alert className="mt-8">
          <Shield className="w-4 h-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> All configuration is stored locally in your browser. No sensitive data is
            transmitted to external servers. You can update your settings anytime from the dashboard.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
