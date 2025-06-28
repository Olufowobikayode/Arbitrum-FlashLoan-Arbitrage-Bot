"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Droplets, Filter, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface LiquidityFilter {
  minLiquidityUsd: number
  maxLiquidityUsd: number
  minDailyVolumeUsd: number
  maxPriceImpact: number
  minMarketCap: number
  excludeNewTokens: boolean
  newTokenThresholdDays: number
  requireVerifiedTokens: boolean
  minHolders: number
  maxVolatility: number
  blacklistedTokens: string[]
  whitelistedTokens: string[]
  dexLiquidityRequirements: {
    [dexName: string]: number
  }
}

interface TokenLiquidityInfo {
  address: string
  symbol: string
  name: string
  totalLiquidityUsd: number
  dailyVolumeUsd: number
  marketCapUsd: number
  priceImpact1k: number
  priceImpact10k: number
  priceImpact100k: number
  holders: number
  volatility24h: number
  ageInDays: number
  isVerified: boolean
  isBlacklisted: boolean
  dexLiquidity: {
    [dexName: string]: number
  }
  riskScore: number
  liquidityScore: number
}

interface LiquidityFilterPanelProps {
  onFiltersChanged?: (filters: LiquidityFilter) => void
  onTokensFiltered?: (tokens: TokenLiquidityInfo[]) => void
}

export default function LiquidityFilterPanel({ onFiltersChanged, onTokensFiltered }: LiquidityFilterPanelProps) {
  const [filters, setFilters] = useState<LiquidityFilter>({
    minLiquidityUsd: 250000,
    maxLiquidityUsd: 50000000,
    minDailyVolumeUsd: 100000,
    maxPriceImpact: 3.0,
    minMarketCap: 1000000,
    excludeNewTokens: true,
    newTokenThresholdDays: 30,
    requireVerifiedTokens: true,
    minHolders: 1000,
    maxVolatility: 20,
    blacklistedTokens: [],
    whitelistedTokens: [],
    dexLiquidityRequirements: {
      "Uniswap V2": 100000,
      "Uniswap V3": 150000,
      SushiSwap: 75000,
      Curve: 200000,
      Balancer: 100000,
    },
  })

  const [tokenData, setTokenData] = useState<TokenLiquidityInfo[]>([])
  const [filteredTokens, setFilteredTokens] = useState<TokenLiquidityInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newBlacklistToken, setNewBlacklistToken] = useState("")
  const [newWhitelistToken, setNewWhitelistToken] = useState("")

  useEffect(() => {
    loadTokenData()
  }, [])

  useEffect(() => {
    applyFilters()
    onFiltersChanged?.(filters)
  }, [filters, tokenData])

  const loadTokenData = async () => {
    setIsLoading(true)
    try {
      // Mock token data - in real implementation, fetch from multiple sources
      const mockTokens: TokenLiquidityInfo[] = [
        {
          address: "0xA0b86a33E6441b8435b662303c0f6a4D2F23E6e1",
          symbol: "USDC",
          name: "USD Coin",
          totalLiquidityUsd: 15000000,
          dailyVolumeUsd: 5000000,
          marketCapUsd: 25000000000,
          priceImpact1k: 0.01,
          priceImpact10k: 0.05,
          priceImpact100k: 0.3,
          holders: 500000,
          volatility24h: 2.1,
          ageInDays: 1200,
          isVerified: true,
          isBlacklisted: false,
          dexLiquidity: {
            "Uniswap V2": 3000000,
            "Uniswap V3": 8000000,
            SushiSwap: 2000000,
            Curve: 1500000,
            Balancer: 500000,
          },
          riskScore: 15,
          liquidityScore: 95,
        },
        {
          address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
          symbol: "USDT",
          name: "Tether USD",
          totalLiquidityUsd: 12000000,
          dailyVolumeUsd: 4200000,
          marketCapUsd: 85000000000,
          priceImpact1k: 0.01,
          priceImpact10k: 0.04,
          priceImpact100k: 0.25,
          holders: 400000,
          volatility24h: 1.8,
          ageInDays: 1500,
          isVerified: true,
          isBlacklisted: false,
          dexLiquidity: {
            "Uniswap V2": 2500000,
            "Uniswap V3": 6000000,
            SushiSwap: 1800000,
            Curve: 1200000,
            Balancer: 500000,
          },
          riskScore: 12,
          liquidityScore: 92,
        },
        {
          address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
          symbol: "WETH",
          name: "Wrapped Ether",
          totalLiquidityUsd: 25000000,
          dailyVolumeUsd: 8000000,
          marketCapUsd: 300000000000,
          priceImpact1k: 0.02,
          priceImpact10k: 0.08,
          priceImpact100k: 0.5,
          holders: 250000,
          volatility24h: 8.5,
          ageInDays: 800,
          isVerified: true,
          isBlacklisted: false,
          dexLiquidity: {
            "Uniswap V2": 5000000,
            "Uniswap V3": 12000000,
            SushiSwap: 3000000,
            Curve: 2000000,
            Balancer: 3000000,
          },
          riskScore: 25,
          liquidityScore: 88,
        },
        {
          address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
          symbol: "ARB",
          name: "Arbitrum",
          totalLiquidityUsd: 8000000,
          dailyVolumeUsd: 2500000,
          marketCapUsd: 2000000000,
          priceImpact1k: 0.05,
          priceImpact10k: 0.2,
          priceImpact100k: 1.2,
          holders: 150000,
          volatility24h: 15.2,
          ageInDays: 180,
          isVerified: true,
          isBlacklisted: false,
          dexLiquidity: {
            "Uniswap V2": 1500000,
            "Uniswap V3": 4000000,
            SushiSwap: 1200000,
            Curve: 800000,
            Balancer: 500000,
          },
          riskScore: 45,
          liquidityScore: 75,
        },
        {
          address: "0x539bdE0d7Dbd336b79148AA742883198BBF60342",
          symbol: "MAGIC",
          name: "Magic Token",
          totalLiquidityUsd: 150000,
          dailyVolumeUsd: 50000,
          marketCapUsd: 50000000,
          priceImpact1k: 0.8,
          priceImpact10k: 4.5,
          priceImpact100k: 25.0,
          holders: 5000,
          volatility24h: 35.8,
          ageInDays: 15,
          isVerified: false,
          isBlacklisted: false,
          dexLiquidity: {
            "Uniswap V2": 50000,
            "Uniswap V3": 80000,
            SushiSwap: 20000,
            Curve: 0,
            Balancer: 0,
          },
          riskScore: 85,
          liquidityScore: 25,
        },
      ]

      setTokenData(mockTokens)
    } catch (error) {
      console.error("Error loading token data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...tokenData]

    // Apply liquidity filters
    filtered = filtered.filter(
      (token) =>
        token.totalLiquidityUsd >= filters.minLiquidityUsd && token.totalLiquidityUsd <= filters.maxLiquidityUsd,
    )

    // Apply volume filter
    filtered = filtered.filter((token) => token.dailyVolumeUsd >= filters.minDailyVolumeUsd)

    // Apply price impact filter
    filtered = filtered.filter((token) => token.priceImpact100k <= filters.maxPriceImpact)

    // Apply market cap filter
    filtered = filtered.filter((token) => token.marketCapUsd >= filters.minMarketCap)

    // Apply new token filter
    if (filters.excludeNewTokens) {
      filtered = filtered.filter((token) => token.ageInDays >= filters.newTokenThresholdDays)
    }

    // Apply verified token filter
    if (filters.requireVerifiedTokens) {
      filtered = filtered.filter((token) => token.isVerified)
    }

    // Apply holders filter
    filtered = filtered.filter((token) => token.holders >= filters.minHolders)

    // Apply volatility filter
    filtered = filtered.filter((token) => token.volatility24h <= filters.maxVolatility)

    // Apply blacklist filter
    filtered = filtered.filter(
      (token) => !filters.blacklistedTokens.includes(token.address.toLowerCase()) && !token.isBlacklisted,
    )

    // Apply whitelist filter (if whitelist exists, only include whitelisted tokens)
    if (filters.whitelistedTokens.length > 0) {
      filtered = filtered.filter((token) => filters.whitelistedTokens.includes(token.address.toLowerCase()))
    }

    // Apply DEX liquidity requirements
    filtered = filtered.filter((token) => {
      for (const [dexName, minLiquidity] of Object.entries(filters.dexLiquidityRequirements)) {
        if (minLiquidity > 0 && (token.dexLiquidity[dexName] || 0) < minLiquidity) {
          return false
        }
      }
      return true
    })

    setFilteredTokens(filtered)
    onTokensFiltered?.(filtered)
  }

  const updateFilter = (key: keyof LiquidityFilter, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const addToBlacklist = () => {
    if (newBlacklistToken && !filters.blacklistedTokens.includes(newBlacklistToken.toLowerCase())) {
      updateFilter("blacklistedTokens", [...filters.blacklistedTokens, newBlacklistToken.toLowerCase()])
      setNewBlacklistToken("")
    }
  }

  const removeFromBlacklist = (address: string) => {
    updateFilter(
      "blacklistedTokens",
      filters.blacklistedTokens.filter((addr) => addr !== address),
    )
  }

  const addToWhitelist = () => {
    if (newWhitelistToken && !filters.whitelistedTokens.includes(newWhitelistToken.toLowerCase())) {
      updateFilter("whitelistedTokens", [...filters.whitelistedTokens, newWhitelistToken.toLowerCase()])
      setNewWhitelistToken("")
    }
  }

  const removeFromWhitelist = (address: string) => {
    updateFilter(
      "whitelistedTokens",
      filters.whitelistedTokens.filter((addr) => addr !== address),
    )
  }

  const resetFilters = () => {
    setFilters({
      minLiquidityUsd: 250000,
      maxLiquidityUsd: 50000000,
      minDailyVolumeUsd: 100000,
      maxPriceImpact: 3.0,
      minMarketCap: 1000000,
      excludeNewTokens: true,
      newTokenThresholdDays: 30,
      requireVerifiedTokens: true,
      minHolders: 1000,
      maxVolatility: 20,
      blacklistedTokens: [],
      whitelistedTokens: [],
      dexLiquidityRequirements: {
        "Uniswap V2": 100000,
        "Uniswap V3": 150000,
        SushiSwap: 75000,
        Curve: 200000,
        Balancer: 100000,
      },
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`
    return `$${num.toFixed(0)}`
  }

  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-green-600"
    if (score <= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getLiquidityColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Droplets className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Liquidity Filtering</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {filteredTokens.length} / {tokenData.length} tokens
          </Badge>
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
          <Button onClick={loadTokenData} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Filters</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="lists">Black/Whitelist</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Liquidity Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Droplets className="h-5 w-5" />
                  <span>Liquidity Requirements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Minimum Liquidity (USD)</Label>
                  <Input
                    type="number"
                    value={filters.minLiquidityUsd}
                    onChange={(e) => updateFilter("minLiquidityUsd", Number.parseInt(e.target.value))}
                    min="0"
                    step="10000"
                  />
                  <div className="text-sm text-gray-600">Current: {formatNumber(filters.minLiquidityUsd)}</div>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Liquidity (USD)</Label>
                  <Input
                    type="number"
                    value={filters.maxLiquidityUsd}
                    onChange={(e) => updateFilter("maxLiquidityUsd", Number.parseInt(e.target.value))}
                    min="0"
                    step="1000000"
                  />
                  <div className="text-sm text-gray-600">Current: {formatNumber(filters.maxLiquidityUsd)}</div>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Daily Volume (USD)</Label>
                  <Input
                    type="number"
                    value={filters.minDailyVolumeUsd}
                    onChange={(e) => updateFilter("minDailyVolumeUsd", Number.parseInt(e.target.value))}
                    min="0"
                    step="10000"
                  />
                  <div className="text-sm text-gray-600">Current: {formatNumber(filters.minDailyVolumeUsd)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Risk Parameters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Maximum Price Impact (%)</Label>
                  <div className="px-3">
                    <Slider
                      value={[filters.maxPriceImpact]}
                      onValueChange={(value) => updateFilter("maxPriceImpact", value[0])}
                      max={10}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  <div className="text-sm text-gray-600">Current: {filters.maxPriceImpact.toFixed(1)}%</div>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Volatility (24h %)</Label>
                  <div className="px-3">
                    <Slider
                      value={[filters.maxVolatility]}
                      onValueChange={(value) => updateFilter("maxVolatility", value[0])}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="text-sm text-gray-600">Current: {filters.maxVolatility}%</div>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Market Cap (USD)</Label>
                  <Input
                    type="number"
                    value={filters.minMarketCap}
                    onChange={(e) => updateFilter("minMarketCap", Number.parseInt(e.target.value))}
                    min="0"
                    step="100000"
                  />
                  <div className="text-sm text-gray-600">Current: {formatNumber(filters.minMarketCap)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Token Quality */}
            <Card>
              <CardHeader>
                <CardTitle>Token Quality Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="verified-tokens">Require Verified Tokens</Label>
                  <Switch
                    id="verified-tokens"
                    checked={filters.requireVerifiedTokens}
                    onCheckedChange={(checked) => updateFilter("requireVerifiedTokens", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="exclude-new">Exclude New Tokens</Label>
                  <Switch
                    id="exclude-new"
                    checked={filters.excludeNewTokens}
                    onCheckedChange={(checked) => updateFilter("excludeNewTokens", checked)}
                  />
                </div>

                {filters.excludeNewTokens && (
                  <div className="space-y-2">
                    <Label>New Token Threshold (days)</Label>
                    <Input
                      type="number"
                      value={filters.newTokenThresholdDays}
                      onChange={(e) => updateFilter("newTokenThresholdDays", Number.parseInt(e.target.value))}
                      min="1"
                      max="365"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Minimum Holders</Label>
                  <Input
                    type="number"
                    value={filters.minHolders}
                    onChange={(e) => updateFilter("minHolders", Number.parseInt(e.target.value))}
                    min="0"
                    step="100"
                  />
                </div>
              </CardContent>
            </Card>

            {/* DEX Liquidity Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>DEX Liquidity Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(filters.dexLiquidityRequirements).map(([dexName, minLiquidity]) => (
                  <div key={dexName} className="space-y-2">
                    <Label>{dexName} Minimum Liquidity</Label>
                    <Input
                      type="number"
                      value={minLiquidity}
                      onChange={(e) =>
                        updateFilter("dexLiquidityRequirements", {
                          ...filters.dexLiquidityRequirements,
                          [dexName]: Number.parseInt(e.target.value),
                        })
                      }
                      min="0"
                      step="10000"
                    />
                    <div className="text-sm text-gray-600">Current: {formatNumber(minLiquidity)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lists" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blacklist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>Blacklisted Tokens</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Token address (0x...)"
                    value={newBlacklistToken}
                    onChange={(e) => setNewBlacklistToken(e.target.value)}
                  />
                  <Button onClick={addToBlacklist} disabled={!newBlacklistToken}>
                    Add
                  </Button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filters.blacklistedTokens.map((address) => (
                    <div key={address} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm font-mono">{address}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeFromBlacklist(address)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {filters.blacklistedTokens.length === 0 && (
                    <p className="text-sm text-gray-500">No blacklisted tokens</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Whitelist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Whitelisted Tokens</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Token address (0x...)"
                    value={newWhitelistToken}
                    onChange={(e) => setNewWhitelistToken(e.target.value)}
                  />
                  <Button onClick={addToWhitelist} disabled={!newWhitelistToken}>
                    Add
                  </Button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filters.whitelistedTokens.map((address) => (
                    <div key={address} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm font-mono">{address}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeFromWhitelist(address)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {filters.whitelistedTokens.length === 0 && (
                    <p className="text-sm text-gray-500">No whitelisted tokens (all tokens allowed)</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Filtered Token Results</span>
                <Badge variant="outline">{filteredTokens.length} tokens match criteria</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading token data...</p>
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="text-center py-8">
                  <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tokens match the current filter criteria</p>
                  <Button variant="outline" onClick={resetFilters} className="mt-4 bg-transparent">
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTokens.map((token) => (
                    <div key={token.address} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-semibold">{token.symbol}</h3>
                            <p className="text-sm text-gray-600">{token.name}</p>
                          </div>
                          {token.isVerified && <Badge variant="default">Verified</Badge>}
                          {token.isBlacklisted && <Badge variant="destructive">Blacklisted</Badge>}
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${getRiskColor(token.riskScore)}`}>
                            Risk: {token.riskScore}/100
                          </div>
                          <div className={`text-sm font-semibold ${getLiquidityColor(token.liquidityScore)}`}>
                            Liquidity: {token.liquidityScore}/100
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <label className="text-gray-600">Total Liquidity</label>
                          <p className="font-semibold">{formatNumber(token.totalLiquidityUsd)}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Daily Volume</label>
                          <p className="font-semibold">{formatNumber(token.dailyVolumeUsd)}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Market Cap</label>
                          <p className="font-semibold">{formatNumber(token.marketCapUsd)}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Price Impact (100k)</label>
                          <p className="font-semibold">{token.priceImpact100k.toFixed(2)}%</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="text-sm text-gray-600">DEX Liquidity Distribution</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                          {Object.entries(token.dexLiquidity).map(([dex, liquidity]) => (
                            <div key={dex} className="text-xs">
                              <div className="flex justify-between">
                                <span>{dex}</span>
                                <span>{formatNumber(liquidity)}</span>
                              </div>
                              <Progress value={(liquidity / token.totalLiquidityUsd) * 100} className="h-1 mt-1" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                        <span>Holders: {token.holders.toLocaleString()}</span>
                        <span>Age: {token.ageInDays} days</span>
                        <span>Volatility: {token.volatility24h.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
