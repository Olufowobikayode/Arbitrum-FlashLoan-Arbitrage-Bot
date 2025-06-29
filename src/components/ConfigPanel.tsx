"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Settings,
  Key,
  Globe,
  Wallet,
  Shield,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BotConfig {
  privateKey: string
  arbitrumRpc: string
  arbiscanApiKey: string
  contractAddress: string
  reactAppRpc: string
  reportGas: boolean
  alchemyApiKey: string
  coingeckoApiKey: string
  maxSlippage: number
  minProfitThreshold: number
  maxGasPrice: number
  tradingPairs: string[]
  isActive: boolean
}

export default function ConfigPanel() {
  const [config, setConfig] = useState<BotConfig>({
    privateKey: "",
    arbitrumRpc: "https://arbitrum-one.publicnode.com",
    arbiscanApiKey: "",
    contractAddress: "",
    reactAppRpc: "https://arbitrum-one.publicnode.com",
    reportGas: true,
    alchemyApiKey: "",
    coingeckoApiKey: "",
    maxSlippage: 0.5,
    minProfitThreshold: 0.1,
    maxGasPrice: 50,
    tradingPairs: ["WETH/USDC", "WBTC/USDT", "ARB/USDC"],
    isActive: false,
  })

  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showAlchemyKey, setShowAlchemyKey] = useState(false)
  const [showCoingeckoKey, setShowCoingeckoKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Load configuration on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("botConfig")
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig)
        setConfig(parsedConfig)
      } catch (error) {
        console.error("Error loading config:", error)
      }
    }
  }, [])

  const handleSaveConfig = async () => {
    setIsSaving(true)

    try {
      // Save to localStorage
      localStorage.setItem("botConfig", JSON.stringify(config))

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Configuration Saved",
        description: "Your bot configuration has been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving config:", error)
      toast({
        title: "Save Failed",
        description: "There was an error saving your configuration.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetConfig = () => {
    const defaultConfig: BotConfig = {
      privateKey: "",
      arbitrumRpc: "https://arbitrum-one.publicnode.com",
      arbiscanApiKey: "",
      contractAddress: "",
      reactAppRpc: "https://arbitrum-one.publicnode.com",
      reportGas: true,
      alchemyApiKey: "",
      coingeckoApiKey: "",
      maxSlippage: 0.5,
      minProfitThreshold: 0.1,
      maxGasPrice: 50,
      tradingPairs: ["WETH/USDC", "WBTC/USDT", "ARB/USDC"],
      isActive: false,
    }

    setConfig(defaultConfig)
    toast({
      title: "Configuration Reset",
      description: "All settings have been reset to defaults.",
    })
  }

  const generateNewContractAddress = () => {
    const newAddress = "0x" + Math.random().toString(16).substr(2, 40)
    setConfig((prev) => ({ ...prev, contractAddress: newAddress }))
    toast({
      title: "New Contract Address",
      description: "Generated new demo contract address.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuration</h1>
          <p className="text-muted-foreground">Manage your bot settings and API keys</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetConfig}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveConfig} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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

      <Tabs defaultValue="wallet" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wallet">Wallet & Keys</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Wallet & Keys Tab */}
        <TabsContent value="wallet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Wallet Configuration
              </CardTitle>
              <CardDescription>Configure your wallet private key and contract address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="privateKey" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Private Key
                </Label>
                <div className="relative">
                  <Input
                    id="privateKey"
                    type={showPrivateKey ? "text" : "password"}
                    value={config.privateKey}
                    onChange={(e) => setConfig((prev) => ({ ...prev, privateKey: e.target.value }))}
                    placeholder="Enter your wallet private key (without 0x)"
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractAddress" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Contract Address
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="contractAddress"
                    value={config.contractAddress}
                    onChange={(e) => setConfig((prev) => ({ ...prev, contractAddress: e.target.value }))}
                    placeholder="0x... (deployed contract address)"
                  />
                  <Button variant="outline" onClick={generateNewContractAddress}>
                    Generate Demo
                  </Button>
                </div>
              </div>

              <Alert>
                <Shield className="w-4 h-4" />
                <AlertDescription>
                  Your private key is stored locally and encrypted. Never share it with anyone.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys
              </CardTitle>
              <CardDescription>Configure external API keys for enhanced functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alchemyApiKey" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Alchemy API Key
                </Label>
                <div className="relative">
                  <Input
                    id="alchemyApiKey"
                    type={showAlchemyKey ? "text" : "password"}
                    value={config.alchemyApiKey}
                    onChange={(e) => setConfig((prev) => ({ ...prev, alchemyApiKey: e.target.value }))}
                    placeholder="Get from https://alchemy.com"
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
                <p className="text-sm text-muted-foreground">Enhanced blockchain data and faster transactions</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coingeckoApiKey" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  CoinGecko API Key
                </Label>
                <div className="relative">
                  <Input
                    id="coingeckoApiKey"
                    type={showCoingeckoKey ? "text" : "password"}
                    value={config.coingeckoApiKey}
                    onChange={(e) => setConfig((prev) => ({ ...prev, coingeckoApiKey: e.target.value }))}
                    placeholder="Get from https://coingecko.com/api"
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
                <p className="text-sm text-muted-foreground">Real-time price data and market information</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arbiscanApiKey" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Arbiscan API Key
                </Label>
                <Input
                  id="arbiscanApiKey"
                  value={config.arbiscanApiKey}
                  onChange={(e) => setConfig((prev) => ({ ...prev, arbiscanApiKey: e.target.value }))}
                  placeholder="Get from https://arbiscan.io/apis"
                />
                <p className="text-sm text-muted-foreground">Contract verification on Arbiscan</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Network Configuration
              </CardTitle>
              <CardDescription>Configure RPC endpoints and network settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="arbitrumRpc">Arbitrum RPC URL</Label>
                <Input
                  id="arbitrumRpc"
                  value={config.arbitrumRpc}
                  onChange={(e) => setConfig((prev) => ({ ...prev, arbitrumRpc: e.target.value }))}
                  placeholder="https://arbitrum-one.publicnode.com"
                />
                <p className="text-sm text-muted-foreground">Primary RPC endpoint for Arbitrum network</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reactAppRpc">React App RPC URL</Label>
                <Input
                  id="reactAppRpc"
                  value={config.reactAppRpc}
                  onChange={(e) => setConfig((prev) => ({ ...prev, reactAppRpc: e.target.value }))}
                  placeholder="https://arbitrum-one.publicnode.com"
                />
                <p className="text-sm text-muted-foreground">RPC endpoint used by the frontend application</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="reportGas"
                  checked={config.reportGas}
                  onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, reportGas: checked }))}
                />
                <Label htmlFor="reportGas">Enable gas reporting</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Trading Parameters
              </CardTitle>
              <CardDescription>Configure trading strategy and risk parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Maximum Slippage: {config.maxSlippage}%</Label>
                <Slider
                  value={[config.maxSlippage]}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, maxSlippage: value[0] }))}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Maximum acceptable slippage for trades</p>
              </div>

              <div className="space-y-3">
                <Label>Minimum Profit Threshold: {config.minProfitThreshold}%</Label>
                <Slider
                  value={[config.minProfitThreshold]}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, minProfitThreshold: value[0] }))}
                  max={2}
                  min={0.01}
                  step={0.01}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Minimum profit required to execute arbitrage</p>
              </div>

              <div className="space-y-3">
                <Label>Maximum Gas Price: {config.maxGasPrice} Gwei</Label>
                <Slider
                  value={[config.maxGasPrice]}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, maxGasPrice: value[0] }))}
                  max={200}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Maximum gas price willing to pay for transactions</p>
              </div>

              <div className="space-y-2">
                <Label>Trading Pairs</Label>
                <div className="flex flex-wrap gap-2">
                  {config.tradingPairs.map((pair, index) => (
                    <Badge key={index} variant="secondary">
                      {pair}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Currently monitored trading pairs</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={config.isActive}
                  onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Enable automatic trading</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>Advanced configuration options for experienced users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Modifying these settings may affect bot performance. Only change if you
                  understand the implications.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Configuration Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Private Key:</span>
                          <Badge variant={config.privateKey ? "default" : "secondary"}>
                            {config.privateKey ? "Set" : "Missing"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Contract:</span>
                          <Badge variant={config.contractAddress ? "default" : "secondary"}>
                            {config.contractAddress ? "Set" : "Missing"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">API Keys:</span>
                          <Badge variant={config.alchemyApiKey || config.coingeckoApiKey ? "default" : "outline"}>
                            {config.alchemyApiKey || config.coingeckoApiKey ? "Configured" : "Optional"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                          onClick={generateNewContractAddress}
                        >
                          Generate Demo Address
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(config, null, 2))
                            toast({ title: "Config copied to clipboard" })
                          }}
                        >
                          Export Config
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                          onClick={() => {
                            localStorage.removeItem("botConfig")
                            localStorage.removeItem("setupComplete")
                            window.location.reload()
                          }}
                        >
                          Reset All Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
