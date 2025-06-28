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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Plus, Activity, TrendingUp, DollarSign, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface DEXInfo {
  address: string
  name: string
  fee: number
  type: "v2" | "v3" | "stable" | "curve"
  isActive: boolean
  addedTimestamp: number
  volume24h?: number
  liquidity?: number
  avgGasUsed?: number
  successRate?: number
}

interface DEXStats {
  totalDEXes: number
  activeDEXes: number
  totalVolume: number
  avgFee: number
  bestPerformer: string
}

interface DEXManagementPanelProps {
  onDEXAdded?: (dex: DEXInfo) => void
  onDEXUpdated?: (address: string, updates: Partial<DEXInfo>) => void
  onDEXRemoved?: (address: string) => void
}

export default function DEXManagementPanel({ onDEXAdded, onDEXUpdated, onDEXRemoved }: DEXManagementPanelProps) {
  const [dexes, setDEXes] = useState<DEXInfo[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newDEX, setNewDEX] = useState<Partial<DEXInfo>>({
    name: "",
    address: "",
    fee: 30,
    type: "v2",
    isActive: true,
  })
  const [stats, setStats] = useState<DEXStats>({
    totalDEXes: 0,
    activeDEXes: 0,
    totalVolume: 0,
    avgFee: 0,
    bestPerformer: "None",
  })

  // Initialize with default DEXes
  useEffect(() => {
    const defaultDEXes: DEXInfo[] = [
      {
        address: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        name: "Uniswap V2",
        fee: 30,
        type: "v2",
        isActive: true,
        addedTimestamp: Date.now() - 86400000,
        volume24h: 1250000,
        liquidity: 45000000,
        avgGasUsed: 150000,
        successRate: 98.5,
      },
      {
        address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        name: "Uniswap V3",
        fee: 30,
        type: "v3",
        isActive: true,
        addedTimestamp: Date.now() - 172800000,
        volume24h: 2100000,
        liquidity: 78000000,
        avgGasUsed: 180000,
        successRate: 97.8,
      },
      {
        address: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        name: "SushiSwap",
        fee: 30,
        type: "v2",
        isActive: true,
        addedTimestamp: Date.now() - 259200000,
        volume24h: 850000,
        liquidity: 32000000,
        avgGasUsed: 145000,
        successRate: 96.2,
      },
      {
        address: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        name: "Balancer",
        fee: 25,
        type: "stable",
        isActive: true,
        addedTimestamp: Date.now() - 345600000,
        volume24h: 650000,
        liquidity: 28000000,
        avgGasUsed: 120000,
        successRate: 99.1,
      },
      {
        address: "0x0000000000000000000000000000000000000000",
        name: "Curve Finance",
        fee: 4,
        type: "curve",
        isActive: false,
        addedTimestamp: Date.now() - 432000000,
        volume24h: 420000,
        liquidity: 15000000,
        avgGasUsed: 200000,
        successRate: 94.7,
      },
    ]

    setDEXes(defaultDEXes)
    updateStats(defaultDEXes)
  }, [])

  const updateStats = (dexList: DEXInfo[]) => {
    const activeDEXes = dexList.filter((dex) => dex.isActive)
    const totalVolume = dexList.reduce((sum, dex) => sum + (dex.volume24h || 0), 0)
    const avgFee = dexList.length > 0 ? dexList.reduce((sum, dex) => sum + dex.fee, 0) / dexList.length : 0

    const bestPerformer = dexList.reduce(
      (best, current) => ((current.successRate || 0) > (best.successRate || 0) ? current : best),
      dexList[0] || { name: "None" },
    )

    setStats({
      totalDEXes: dexList.length,
      activeDEXes: activeDEXes.length,
      totalVolume,
      avgFee,
      bestPerformer: bestPerformer.name,
    })
  }

  const handleAddDEX = () => {
    if (!newDEX.name || !newDEX.address) return

    const dexInfo: DEXInfo = {
      address: newDEX.address!,
      name: newDEX.name!,
      fee: newDEX.fee || 30,
      type: newDEX.type || "v2",
      isActive: newDEX.isActive !== false,
      addedTimestamp: Date.now(),
      volume24h: 0,
      liquidity: 0,
      avgGasUsed: 150000,
      successRate: 0,
    }

    const updatedDEXes = [...dexes, dexInfo]
    setDEXes(updatedDEXes)
    updateStats(updatedDEXes)
    onDEXAdded?.(dexInfo)

    // Reset form
    setNewDEX({
      name: "",
      address: "",
      fee: 30,
      type: "v2",
      isActive: true,
    })
    setIsAddDialogOpen(false)
  }

  const handleUpdateDEX = (address: string, updates: Partial<DEXInfo>) => {
    const updatedDEXes = dexes.map((dex) => (dex.address === address ? { ...dex, ...updates } : dex))
    setDEXes(updatedDEXes)
    updateStats(updatedDEXes)
    onDEXUpdated?.(address, updates)
  }

  const handleRemoveDEX = (address: string) => {
    const updatedDEXes = dexes.filter((dex) => dex.address !== address)
    setDEXes(updatedDEXes)
    updateStats(updatedDEXes)
    onDEXRemoved?.(address)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "v2":
        return "bg-blue-500"
      case "v3":
        return "bg-purple-500"
      case "stable":
        return "bg-green-500"
      case "curve":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (isActive: boolean, successRate?: number) => {
    if (!isActive) return <XCircle className="h-4 w-4 text-red-500" />
    if ((successRate || 0) >= 95) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`
    return `$${num.toFixed(0)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">DEX Management</h2>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add DEX
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New DEX</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dex-name">DEX Name</Label>
                <Input
                  id="dex-name"
                  placeholder="e.g., Uniswap V2"
                  value={newDEX.name || ""}
                  onChange={(e) => setNewDEX({ ...newDEX, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dex-address">Contract Address</Label>
                <Input
                  id="dex-address"
                  placeholder="0x..."
                  value={newDEX.address || ""}
                  onChange={(e) => setNewDEX({ ...newDEX, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dex-fee">Fee (basis points)</Label>
                  <Input
                    id="dex-fee"
                    type="number"
                    placeholder="30"
                    value={newDEX.fee || ""}
                    onChange={(e) => setNewDEX({ ...newDEX, fee: Number.parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dex-type">Type</Label>
                  <select
                    id="dex-type"
                    className="w-full p-2 border rounded-md"
                    value={newDEX.type || "v2"}
                    onChange={(e) => setNewDEX({ ...newDEX, type: e.target.value as any })}
                  >
                    <option value="v2">Uniswap V2</option>
                    <option value="v3">Uniswap V3</option>
                    <option value="stable">Stable Swap</option>
                    <option value="curve">Curve</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="dex-active"
                  checked={newDEX.isActive !== false}
                  onCheckedChange={(checked) => setNewDEX({ ...newDEX, isActive: checked })}
                />
                <Label htmlFor="dex-active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDEX}>Add DEX</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total DEXes</p>
                <p className="text-2xl font-bold">{stats.totalDEXes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active DEXes</p>
                <p className="text-2xl font-bold text-green-500">{stats.activeDEXes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">24h Volume</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalVolume)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Best Performer</p>
                <p className="text-lg font-bold">{stats.bestPerformer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered DEXes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dexes.map((dex) => (
                  <div key={dex.address} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(dex.isActive, dex.successRate)}
                        <div>
                          <h3 className="font-semibold">{dex.name}</h3>
                          <p className="text-sm text-gray-600 font-mono">
                            {dex.address.slice(0, 10)}...{dex.address.slice(-8)}
                          </p>
                        </div>
                        <Badge className={getTypeColor(dex.type)}>{dex.type.toUpperCase()}</Badge>
                        <Badge variant={dex.isActive ? "default" : "secondary"}>
                          {dex.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={dex.isActive}
                          onCheckedChange={(checked) => handleUpdateDEX(dex.address, { isActive: checked })}
                        />
                        <Button variant="outline" size="sm" onClick={() => handleRemoveDEX(dex.address)}>
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Fee</p>
                        <p className="font-semibold">{(dex.fee / 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">24h Volume</p>
                        <p className="font-semibold">{formatNumber(dex.volume24h || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Liquidity</p>
                        <p className="font-semibold">{formatNumber(dex.liquidity || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Success Rate</p>
                        <p className="font-semibold">{(dex.successRate || 0).toFixed(1)}%</p>
                      </div>
                    </div>

                    {dex.successRate && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Success Rate</span>
                          <span>{dex.successRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={dex.successRate} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Volume Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dexes
                    .filter((dex) => dex.isActive)
                    .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
                    .map((dex) => {
                      const percentage = stats.totalVolume > 0 ? ((dex.volume24h || 0) / stats.totalVolume) * 100 : 0

                      return (
                        <div key={dex.address} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{dex.name}</span>
                            <span>
                              {formatNumber(dex.volume24h || 0)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dexes
                    .filter((dex) => dex.isActive)
                    .sort((a, b) => (b.successRate || 0) - (a.successRate || 0))
                    .map((dex) => (
                      <div key={dex.address} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{dex.name}</span>
                          <span>{(dex.successRate || 0).toFixed(1)}%</span>
                        </div>
                        <Progress value={dex.successRate || 0} className="h-2" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gas Usage Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dexes
                  .filter((dex) => dex.isActive)
                  .sort((a, b) => (a.avgGasUsed || 0) - (b.avgGasUsed || 0))
                  .map((dex) => (
                    <div key={dex.address} className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center space-x-3">
                        <Badge className={getTypeColor(dex.type)}>{dex.type}</Badge>
                        <span className="font-medium">{dex.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{(dex.avgGasUsed || 0).toLocaleString()} gas</p>
                        <p className="text-sm text-gray-600">~${((dex.avgGasUsed || 0) * 20e-9 * 2500).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global DEX Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Default Settings</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultFee">Default Fee (basis points)</Label>
                    <Input id="defaultFee" type="number" placeholder="30" defaultValue="30" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultGasLimit">Default Gas Limit</Label>
                    <Input id="defaultGasLimit" type="number" placeholder="150000" defaultValue="150000" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Auto-Discovery</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoDiscovery">Enable Auto-Discovery</Label>
                    <p className="text-sm text-gray-600">Automatically discover new DEXes</p>
                  </div>
                  <Switch id="autoDiscovery" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoActivation">Auto-Activate New DEXes</Label>
                    <p className="text-sm text-gray-600">Automatically activate discovered DEXes</p>
                  </div>
                  <Switch id="autoActivation" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance Monitoring</h3>

                <div className="space-y-2">
                  <Label htmlFor="minSuccessRate">Minimum Success Rate (%)</Label>
                  <Input id="minSuccessRate" type="number" min="0" max="100" placeholder="90" defaultValue="90" />
                  <p className="text-sm text-gray-600">DEXes below this success rate will be flagged</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoDeactivate">Auto-Deactivate Poor Performers</Label>
                    <p className="text-sm text-gray-600">Automatically deactivate underperforming DEXes</p>
                  </div>
                  <Switch id="autoDeactivate" />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Changes to DEX settings will affect all future arbitrage operations. Make sure to test new
                  configurations before enabling them for live trading.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
