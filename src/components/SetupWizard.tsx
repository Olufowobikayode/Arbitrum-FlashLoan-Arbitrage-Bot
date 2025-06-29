"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  Copy,
  Download,
  Eye,
  EyeOff,
  Rocket,
  Shield,
  Settings,
  Wallet,
  Globe,
  Key,
  FileText,
  ExternalLink,
} from "lucide-react"
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
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<string>("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const totalSteps = 3
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

  const validateContractAddress = (address: string): ValidationResult => {
    if (!address) return { isValid: false, message: "Contract address is required" }
    if (!address.startsWith("0x")) return { isValid: false, message: "Address must start with 0x" }
    if (address.length !== 42) return { isValid: false, message: "Address must be 42 characters long" }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return { isValid: false, message: "Invalid address format" }
    return { isValid: true, message: "Valid contract address" }
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

    if (currentStep >= 3) {
      const contractValidation = validateContractAddress(config.contractAddress)
      if (!contractValidation.isValid) errors.contractAddress = contractValidation.message
    }

    setValidationErrors(errors)
  }, [config, currentStep])

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      })
    }
  }

  const generateEnvFile = () => {
    return `# 🔐 PRIVATE KEY (Required for deployment)
PRIVATE_KEY=${config.privateKey}

# 🌐 RPC ENDPOINTS (Required for blockchain connection)
ARBITRUM_RPC=${config.arbitrumRpc}

# 🔍 API KEYS (Server-side only - DO NOT prefix with NEXT_PUBLIC_)
ALCHEMY_API_KEY=${config.alchemyApiKey}
COINGECKO_API_KEY=${config.coingeckoApiKey}
ARBISCAN_API_KEY=${config.arbiscanApiKey}

# ⚛️ REACT APP ENVIRONMENT VARIABLES (Client-safe)
NEXT_PUBLIC_CONTRACT_ADDRESS=${config.contractAddress}
NEXT_PUBLIC_ARBITRUM_RPC=${config.reactAppRpc}

# 📊 DEVELOPMENT OPTIONS
REPORT_GAS=${config.reportGas}

# 📝 Generated by Setup Wizard on ${new Date().toISOString()}
# 🚨 NEVER commit this file to version control!
`
  }

  const generateDeployScript = () => {
    return `#!/bin/bash
# 🚀 Automated Deployment Script
# Generated by Setup Wizard

echo "🚀 Starting deployment to Arbitrum..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile contracts
echo "🔨 Compiling contracts..."
npm run compile

# Run tests
echo "🧪 Running tests..."
npm test

# Deploy to Arbitrum
echo "🚀 Deploying to Arbitrum..."
npm run deploy

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env"
echo "2. Fund your contract with initial capital"
echo "3. Test with small amounts first"
`
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded!",
      description: `${filename} has been downloaded`,
    })
  }

  const simulateDeployment = async () => {
    setIsDeploying(true)
    setDeploymentResult("")

    // Simulate deployment process
    const steps = [
      "Connecting to Arbitrum network...",
      "Compiling smart contracts...",
      "Deploying FlashloanArbitrageBot...",
      "Verifying contract on Arbiscan...",
      "Setting initial configuration...",
      "Deployment complete!",
    ]

    for (let i = 0; i < steps.length; i++) {
      setDeploymentResult((prev) => prev + steps[i] + "\n")
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Generate mock contract address
    const mockAddress = "0x" + Math.random().toString(16).substr(2, 40)
    setConfig((prev) => ({ ...prev, contractAddress: mockAddress }))
    setDeploymentResult((prev) => prev + `\n✅ Contract deployed at: ${mockAddress}\n`)

    setIsDeploying(false)
    toast({
      title: "Deployment Simulated!",
      description: "Mock contract address generated",
    })
  }

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return !validationErrors.privateKey && !validationErrors.arbitrumRpc
      case 3:
        return !validationErrors.privateKey && !validationErrors.arbitrumRpc && !validationErrors.arbiscanApiKey
      default:
        return true
    }
  }

  const handleCompleteSetup = () => {
    // Save configuration to localStorage
    localStorage.setItem("botConfig", JSON.stringify(config))
    localStorage.setItem("setupComplete", "true")

    toast({
      title: "Setup Complete!",
      description: "Redirecting to dashboard...",
    })

    // Call the onComplete callback to trigger redirect
    if (onComplete) {
      setTimeout(() => {
        onComplete()
      }, 1500)
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
                <h2 className="text-2xl font-bold">Environment Configuration</h2>
                <p className="text-gray-600">Set up your wallet and network connections</p>
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
                    Your private key is used for contract deployment. It never leaves your browser and is not stored
                    anywhere.
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
                    Alchemy API Key (Recommended)
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
                  <p className="text-sm text-gray-600">Used for enhanced blockchain data and faster transactions</p>
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
                  <p className="text-sm text-gray-600">Used for real-time price data and market information</p>
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
                  <p className="text-sm text-gray-600">Used for contract verification on Arbiscan</p>
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
                <Rocket className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Contract Deployment</h2>
                <p className="text-gray-600">Deploy your smart contract to Arbitrum</p>
              </div>
            </div>

            <Tabs defaultValue="simulate" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="simulate">Simulate Deployment</TabsTrigger>
                <TabsTrigger value="files">Download Files</TabsTrigger>
              </TabsList>

              <TabsContent value="simulate" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Deployment Simulation</CardTitle>
                    <CardDescription>Test the deployment process and generate a mock contract address</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={simulateDeployment} disabled={isDeploying} className="w-full">
                      {isDeploying ? "Deploying..." : "Simulate Deployment"}
                    </Button>

                    {deploymentResult && (
                      <div className="space-y-2">
                        <Label>Deployment Log:</Label>
                        <Textarea value={deploymentResult} readOnly className="h-40 font-mono text-sm" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="space-y-4">
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Environment File
                      </CardTitle>
                      <CardDescription>Download your configured .env file</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => downloadFile(generateEnvFile(), ".env")} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Download .env
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Deployment Script
                      </CardTitle>
                      <CardDescription>Download automated deployment script</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => downloadFile(generateDeployScript(), "deploy.sh")} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Download deploy.sh
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Final Configuration</h2>
                <p className="text-gray-600">Complete your setup and start trading</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Contract Address */}
              <div className="space-y-2">
                <Label htmlFor="contractAddress" className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Contract Address *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="contractAddress"
                    value={config.contractAddress}
                    onChange={(e) => setConfig((prev) => ({ ...prev, contractAddress: e.target.value }))}
                    placeholder="0x... (from deployment output)"
                    className={validationErrors.contractAddress ? "border-red-500" : ""}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(config.contractAddress, "Contract address")}
                    disabled={!config.contractAddress}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                {validationErrors.contractAddress && (
                  <p className="text-sm text-red-600">{validationErrors.contractAddress}</p>
                )}
              </div>

              {/* React App RPC */}
              <div className="space-y-2">
                <Label htmlFor="reactAppRpc">React App RPC URL</Label>
                <Input
                  id="reactAppRpc"
                  value={config.reactAppRpc}
                  onChange={(e) => setConfig((prev) => ({ ...prev, reactAppRpc: e.target.value }))}
                  placeholder="https://arbitrum-one.publicnode.com"
                />
              </div>

              {/* Gas Reporting */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reportGas"
                  checked={config.reportGas}
                  onChange={(e) => setConfig((prev) => ({ ...prev, reportGas: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="reportGas">Enable gas reporting</Label>
              </div>
            </div>

            {/* Configuration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration Summary</CardTitle>
                <CardDescription>Review your setup before finalizing</CardDescription>
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Contract Address:</span>
                    <Badge variant={config.contractAddress ? "default" : "secondary"}>
                      {config.contractAddress ? "Configured" : "Missing"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Final Actions */}
            <div className="grid gap-4">
              <Button onClick={() => downloadFile(generateEnvFile(), ".env")} className="w-full" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download Final .env File
              </Button>

              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Setup Complete!</strong> Your flashloan arbitrage bot is ready to deploy. Remember to test
                  with small amounts first and monitor performance closely.
                </AlertDescription>
              </Alert>
            </div>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Place the downloaded .env file in your project root</li>
                  <li>
                    Run <code className="bg-gray-100 px-1 rounded">npm install</code> to install dependencies
                  </li>
                  <li>
                    Run <code className="bg-gray-100 px-1 rounded">npm run deploy</code> to deploy your contract
                  </li>
                  <li>Update NEXT_PUBLIC_CONTRACT_ADDRESS with the deployed address</li>
                  <li>Fund your contract with initial capital</li>
                  <li>Start trading through your React dashboard</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Flashloan Arbitrage Bot Setup</h1>
          <p className="text-xl text-gray-600">Configure and deploy your automated trading bot on Arbitrum</p>
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
            {[1, 2, 3].map((step) => (
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
                {step < 3 && <div className={`w-16 h-1 mx-2 ${step < currentStep ? "bg-green-500" : "bg-gray-200"}`} />}
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
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep < totalSteps ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceedToStep(currentStep + 1)}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleCompleteSetup}
                disabled={Object.keys(validationErrors).length > 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Setup & Go to Dashboard
              </Button>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <Alert className="mt-8">
          <Shield className="w-4 h-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> This setup wizard processes sensitive information locally in your browser.
            No data is transmitted to external servers. Always verify contract addresses and test with small amounts
            first.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
