"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, AlertCircle, CheckCircle, XCircle, RefreshCw, Plus, Search } from "lucide-react"
import {
  FlashloanProviderService,
  type FlashloanProvider,
  type ProviderQuery,
} from "../services/FlashloanProviderService"

interface FlashloanProviderPanelProps {
  web3?: any
  onProviderSelected?: (provider: string, token: string, amount: number) => void
}

export default function FlashloanProviderPanel({ web3, onProviderSelected }: FlashloanProviderPanelProps) {
  const [providers, setProviders] = useState<FlashloanProvider[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedToken, setSelectedToken] = useState("USDC")
  const [queryAmount, setQueryAmount] = useState(250000)
  const [queryResults, setQueryResults] = useState<ProviderQuery[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newProvider, setNewProvider] = useState({
    name: "",
    protocol: "",
    address: "",
    fee: 0,
    maxLiquidity: 1000000,
  })

  const providerService = new FlashloanProviderService(web3)

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    setIsLoading(true)
    try {
      const allProviders = await providerService.getAllProviders()
      setProviders(allProviders)
    } catch (error) {
      console.error("Error loading providers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuery = async () => {
    setIsLoading(true)
    try {
      const results = await providerService.queryAvailability(selectedToken, queryAmount)
      setQueryResults(results)
    } catch (error) {
      console.error("Error querying providers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await providerService.refreshProviderData()
      await loadProviders()
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProvider = async () => {
    try {
      const success = await providerService.addCustomProvider(newProvider)
      if (success) {
        await loadProviders()
        setIsAddDialogOpen(false)
        setNewProvider({
          name: "",
          protocol: "",
          address: "",
          fee: 0,
          maxLiquidity: 1000000,
        })
      }
    } catch (error) {
      console.error("Error adding provider:", error)
    }
  }

  const handleToggleProvider = async (name: string, active: boolean) => {
    try {
      await providerService.toggleProvider(name, active)
      await loadProviders()
    } catch (error) {
      console.error("Error toggling provider:", error)
    }
  }

  const handleSelectProvider = (provider: string, token: string, amount: number) => {
    onProviderSelected?.(provider, token, amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`
    return `$${num.toFixed(0)}`
  }

  const getProviderStatusIcon = (provider: FlashloanProvider) => {
    if (!provider.isActive) return <XCircle className="h-4 w-4 text-red-500" />
    if (provider.successRate >= 98) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const getProviderStatusColor = (provider: FlashloanProvider) => {
    if (!provider.isActive) return "bg-red-500"
    if (provider.successRate >= 98) return "bg-green-500"
    return "bg-yellow-500"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Flashloan Providers</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Flashloan Provider</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-name">Provider Name</Label>
                  <Input
                    id="provider-name"
                    placeholder="e.g., Custom Protocol"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider-protocol">Protocol</Label>
                  <Input
                    id="provider-protocol"
                    placeholder="e.g., aave, balancer, custom"
                    value={newProvider.protocol}
                    onChange={(e) => setNewProvider({ ...newProvider, protocol: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider-address">Contract Address</Label>
                  <Input
                    id="provider-address"
                    placeholder="0x..."
                    value={newProvider.address}
                    onChange={(e) => setNewProvider({ ...newProvider, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider-fee">Fee (basis points)</Label>
                    <Input
                      id="provider-fee"
                      type="number"
                      placeholder="5"
                      value={newProvider.fee}
                      onChange={(e) => setNewProvider({ ...newProvider, fee: Number.parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider-liquidity">Max Liquidity (USD)</Label>
                    <Input
                      id="provider-liquidity"
                      type="number"
                      placeholder="1000000"
                      value={newProvider.maxLiquidity}
                      onChange={(e) =>
                        setNewProvider({ ...newProvider, maxLiquidity: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddProvider}>Add Provider</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Query Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Query Availability</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="query-token">Token</Label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="DAI">DAI</SelectItem>
                  <SelectItem value="WETH">WETH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="query-amount">Amount (USD)</Label>
              <Input
                id="query-amount"
                type="number"
                value={queryAmount}
                onChange={(e) => setQueryAmount(Number.parseInt(e.target.value))}
                min="50000"
                max="3000000"
                step="10000"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleQuery} disabled={isLoading} className="w-full">
                {isLoading ? "Querying..." : "Query Providers"}
              </Button>
            </div>
          </div>

          {queryResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">
                Query Results for {formatNumber(queryAmount)} {selectedToken}
              </h3>
              <div className="grid gap-3">
                {queryResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {result.available ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <h4 className="font-semibold">{result.provider}</h4>
                          <p className="text-sm text-gray-600">
                            Fee: {(result.fee / 100).toFixed(2)}% | Gas: ~{result.estimatedGas.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={result.available ? "default" : "secondary"}>
                          {result.available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                      {result.available && (
                        <Button
                          size="sm"
                          onClick={() => handleSelectProvider(result.provider, result.token, result.amount)}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {providers.map((provider) => (
              <Card key={provider.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getProviderStatusIcon(provider)}
                      <h3 className="font-semibold">{provider.name}</h3>
                    </div>
                    <Switch
                      checked={provider.isActive}
                      onCheckedChange={(checked) => handleToggleProvider(provider.name, checked)}
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Protocol:</span>
                      <Badge variant="outline">{provider.protocol.toUpperCase()}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fee:</span>
                      <span className="font-semibold">{(provider.fee / 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Liquidity:</span>
                      <span className="font-semibold">{formatNumber(provider.maxLiquidity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-semibold">{provider.successRate.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Success Rate</span>
                      <span>{provider.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={provider.successRate} className="h-2" />
                  </div>

                  <div className="mt-3 text-xs text-gray-500">Supported Tokens: {provider.supportedTokens.length}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-4">
          <div className="grid gap-4">
            {providers
              .filter((p) => p.isActive)
              .map((provider) => (
                <Card key={provider.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{provider.name}</span>
                      <Badge className={getProviderStatusColor(provider)}>
                        {provider.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {provider.supportedTokens.map((token) => (
                        <div key={token.address} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{token.symbol}</h4>
                            <Badge variant="outline">{token.decimals} decimals</Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Available:</span>
                              <span className="font-semibold">{formatNumber(token.availableLiquidity)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Max Borrow:</span>
                              <span className="font-semibold">{formatNumber(token.maxBorrowAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Min Borrow:</span>
                              <span className="font-semibold">{formatNumber(token.minBorrowAmount)}</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Utilization</span>
                              <span>{token.utilizationRate.toFixed(1)}%</span>
                            </div>
                            <Progress value={token.utilizationRate} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Success Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers
                    .filter((p) => p.isActive)
                    .map((provider) => (
                      <div key={provider.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{provider.name}</span>
                          <span>{provider.successRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={provider.successRate} className="h-2" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers
                    .filter((p) => p.isActive)
                    .map((provider) => (
                      <div key={provider.name} className="flex items-center justify-between py-2 border-b">
                        <span className="font-medium">{provider.name}</span>
                        <div className="text-right">
                          <p className="font-semibold">{provider.avgResponseTime}ms</p>
                          <p className="text-sm text-gray-600">
                            {provider.avgResponseTime < 150
                              ? "Fast"
                              : provider.avgResponseTime < 250
                                ? "Normal"
                                : "Slow"}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fee Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers
                  .filter((p) => p.isActive)
                  .sort((a, b) => a.fee - b.fee)
                  .map((provider) => (
                    <div key={provider.name} className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{provider.protocol}</Badge>
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{(provider.fee / 100).toFixed(2)}%</p>
                        <p className="text-sm text-gray-600">
                          ${((queryAmount * provider.fee) / 10000).toFixed(2)} on {formatNumber(queryAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
