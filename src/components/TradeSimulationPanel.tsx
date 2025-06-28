"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Zap, AlertTriangle, CheckCircle, XCircle, Clock, Activity } from "lucide-react"
import { TradeSimulationService, type SimulationResult, type TradeParams } from "../services/TradeSimulationService"
import { useWeb3 } from "../contexts/Web3Context"

interface TradeSimulationPanelProps {
  onSimulationComplete?: (result: SimulationResult) => void
  onExecuteTrade?: (params: TradeParams) => void
}

export default function TradeSimulationPanel({ onSimulationComplete, onExecuteTrade }: TradeSimulationPanelProps) {
  const { web3, contract } = useWeb3()
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [simulationHistory, setSimulationHistory] = useState<SimulationResult[]>([])

  const [tradeParams, setTradeParams] = useState<TradeParams>({
    flashloanToken: "0xA0b86a33E6441b8435b662303c0f6a4D2F23E6e1", // USDC
    flashloanAmount: 250000,
    flashloanProvider: "aave",
    targetToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH
    dexPath: ["0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"], // Uniswap V2
    slippageTolerance: 150, // 1.5%
    gasPrice: 0.1, // 0.1 Gwei
    minProfitUsd: 50,
  })

  const simulationService = new TradeSimulationService(web3, contract)

  useEffect(() => {
    loadSimulationHistory()
  }, [])

  const loadSimulationHistory = async () => {
    try {
      const history = await simulationService.getSimulationHistory()
      setSimulationHistory(history)
    } catch (error) {
      console.error("Error loading simulation history:", error)
    }
  }

  const handleSimulate = async () => {
    setIsSimulating(true)
    try {
      const result = await simulationService.simulateTrade(tradeParams)
      setSimulationResult(result)

      // Save to history
      await simulationService.saveSimulationResult(result)
      await loadSimulationHistory()

      onSimulationComplete?.(result)
    } catch (error) {
      console.error("Simulation error:", error)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleExecuteTrade = () => {
    if (simulationResult?.success) {
      onExecuteTrade?.(tradeParams)
    }
  }

  const getResultIcon = (result: SimulationResult) => {
    if (result.success && result.profitAfterCosts >= result.initialBalance * 0.01) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (result.success) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getResultColor = (result: SimulationResult) => {
    if (result.success && result.profitAfterCosts >= result.initialBalance * 0.01) {
      return "text-green-600"
    } else if (result.success) {
      return "text-yellow-600"
    } else {
      return "text-red-600"
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Trade Simulation</h2>
        </div>
        <Button onClick={handleSimulate} disabled={isSimulating}>
          {isSimulating ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Simulating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Simulation
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trade Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Flashloan Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Flashloan Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="flashloan-token">Flashloan Token</Label>
                    <Select
                      value={tradeParams.flashloanToken}
                      onValueChange={(value) => setTradeParams({ ...tradeParams, flashloanToken: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0xA0b86a33E6441b8435b662303c0f6a4D2F23E6e1">USDC</SelectItem>
                        <SelectItem value="0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9">USDT</SelectItem>
                        <SelectItem value="0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1">DAI</SelectItem>
                        <SelectItem value="0x82aF49447D8a07e3bd95BD0d56f35241523fBab1">WETH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flashloan-amount">Amount (USD)</Label>
                    <Input
                      id="flashloan-amount"
                      type="number"
                      value={tradeParams.flashloanAmount}
                      onChange={(e) =>
                        setTradeParams({ ...tradeParams, flashloanAmount: Number.parseInt(e.target.value) })
                      }
                      min="50000"
                      max="3000000"
                      step="10000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flashloan-provider">Provider</Label>
                    <Select
                      value={tradeParams.flashloanProvider}
                      onValueChange={(value) => setTradeParams({ ...tradeParams, flashloanProvider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aave">Aave V3</SelectItem>
                        <SelectItem value="balancer">Balancer V2</SelectItem>
                        <SelectItem value="dydx">dYdX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Trading Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trading Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target-token">Target Token</Label>
                    <Select
                      value={tradeParams.targetToken}
                      onValueChange={(value) => setTradeParams({ ...tradeParams, targetToken: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target token" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0x82aF49447D8a07e3bd95BD0d56f35241523fBab1">WETH</SelectItem>
                        <SelectItem value="0xA0b86a33E6441b8435b662303c0f6a4D2F23E6e1">USDC</SelectItem>
                        <SelectItem value="0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9">USDT</SelectItem>
                        <SelectItem value="0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1">DAI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-profit">Minimum Profit (USD)</Label>
                    <Input
                      id="min-profit"
                      type="number"
                      value={tradeParams.minProfitUsd}
                      onChange={(e) =>
                        setTradeParams({ ...tradeParams, minProfitUsd: Number.parseInt(e.target.value) })
                      }
                      min="10"
                      max="10000"
                      step="10"
                    />
                  </div>
                </div>
              </div>

              {/* Risk Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Risk Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slippage">Slippage Tolerance (basis points)</Label>
                    <Input
                      id="slippage"
                      type="number"
                      value={tradeParams.slippageTolerance}
                      onChange={(e) =>
                        setTradeParams({ ...tradeParams, slippageTolerance: Number.parseInt(e.target.value) })
                      }
                      min="10"
                      max="500"
                      step="10"
                    />
                    <p className="text-sm text-gray-600">
                      {(tradeParams.slippageTolerance / 100).toFixed(1)}% slippage tolerance
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gas-price">Gas Price (Gwei)</Label>
                    <Input
                      id="gas-price"
                      type="number"
                      step="0.01"
                      value={tradeParams.gasPrice}
                      onChange={(e) => setTradeParams({ ...tradeParams, gasPrice: Number.parseFloat(e.target.value) })}
                      min="0.05"
                      max="5"
                    />
                  </div>
                </div>
              </div>

              {/* DEX Path Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">DEX Path</h3>
                <div className="space-y-2">
                  <Label>Selected DEXes</Label>
                  <div className="flex flex-wrap gap-2">
                    {tradeParams.dexPath.map((dex, index) => (
                      <Badge key={index} variant="outline">
                        {dex === "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
                          ? "Uniswap V2"
                          : dex === "0xE592427A0AEce92De3Edee1F18E0157C05861564"
                            ? "Uniswap V3"
                            : dex === "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
                              ? "SushiSwap"
                              : "Unknown DEX"}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Trade will execute through {tradeParams.dexPath.length} DEX(es)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {simulationResult ? (
            <div className="space-y-4">
              {/* Result Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getResultIcon(simulationResult)}
                      <span>Simulation Result</span>
                    </div>
                    <Badge
                      variant={simulationResult.success ? "default" : "destructive"}
                      className={getResultColor(simulationResult)}
                    >
                      {simulationResult.success ? "PASS" : "FAIL"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Estimated Profit</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatNumber(simulationResult.estimatedProfit)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Actual Profit</p>
                      <p
                        className={`text-2xl font-bold ${simulationResult.actualProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatNumber(simulationResult.actualProfit)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Profit After Costs</p>
                      <p
                        className={`text-2xl font-bold ${simulationResult.profitAfterCosts >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatNumber(simulationResult.profitAfterCosts)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Profit Margin</p>
                      <p
                        className={`text-2xl font-bold ${simulationResult.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {simulationResult.profitMargin.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {simulationResult.failureReason && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Failure Reason:</strong> {simulationResult.failureReason}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gas Cost:</span>
                        <span className="font-semibold">{formatNumber(simulationResult.gasCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Flashloan Fee:</span>
                        <span className="font-semibold">{formatNumber(simulationResult.flashloanFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Slippage Cost:</span>
                        <span className="font-semibold">{formatNumber(simulationResult.slippageCost)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total Costs:</span>
                          <span>{formatNumber(simulationResult.totalCosts)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Risk Score</span>
                          <span>{simulationResult.riskScore}/100</span>
                        </div>
                        <Progress value={simulationResult.riskScore} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Confidence</span>
                          <span>{simulationResult.confidence.toFixed(1)}%</span>
                        </div>
                        <Progress value={simulationResult.confidence} className="h-2" />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price Impact:</span>
                          <span className="font-semibold">{simulationResult.priceImpact.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Liquidity Utilization:</span>
                          <span className="font-semibold">{simulationResult.liquidityUtilization.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gas Used:</span>
                          <span className="font-semibold">{simulationResult.gasUsed.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Execution Path */}
              <Card>
                <CardHeader>
                  <CardTitle>Execution Path</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Start</Badge>
                      <span className="text-sm">
                        Flashloan {formatNumber(tradeParams.flashloanAmount)} from {tradeParams.flashloanProvider}
                      </span>
                    </div>

                    {simulationResult.executionPath.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2 ml-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">
                          Execute swap on{" "}
                          {step === "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
                            ? "Uniswap V2"
                            : step === "0xE592427A0AEce92De3Edee1F18E0157C05861564"
                              ? "Uniswap V3"
                              : step === "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
                                ? "SushiSwap"
                                : "Unknown DEX"}
                        </span>
                      </div>
                    ))}

                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">End</Badge>
                      <span className="text-sm">Repay flashloan + profit</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                {simulationResult.success && simulationResult.profitAfterCosts >= tradeParams.minProfitUsd ? (
                  <Button onClick={handleExecuteTrade} className="bg-green-600 hover:bg-green-700">
                    <Zap className="h-4 w-4 mr-2" />
                    Execute Trade
                  </Button>
                ) : (
                  <Button disabled variant="outline">
                    <XCircle className="h-4 w-4 mr-2" />
                    Trade Not Profitable
                  </Button>
                )}

                <Button variant="outline" onClick={handleSimulate}>
                  <Play className="h-4 w-4 mr-2" />
                  Re-simulate
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Simulation Results</h3>
                <p className="text-gray-500 mb-4">Run a simulation to see detailed results and analysis</p>
                <Button onClick={handleSimulate} disabled={isSimulating}>
                  {isSimulating ? "Simulating..." : "Run First Simulation"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulation History</CardTitle>
            </CardHeader>
            <CardContent>
              {simulationHistory.length > 0 ? (
                <div className="space-y-3">
                  {simulationHistory.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getResultIcon(result)}
                          <span className="font-semibold">Simulation #{simulationHistory.length - index}</span>
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? "PASS" : "FAIL"}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date((result as any).timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount:</p>
                          <p className="font-semibold">{formatNumber(result.initialBalance)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Profit:</p>
                          <p
                            className={`font-semibold ${result.profitAfterCosts >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatNumber(result.profitAfterCosts)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Margin:</p>
                          <p
                            className={`font-semibold ${result.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {result.profitMargin.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Risk:</p>
                          <p className="font-semibold">{result.riskScore}/100</p>
                        </div>
                      </div>

                      {result.failureReason && (
                        <div className="mt-2 text-sm text-red-600">
                          <strong>Failure:</strong> {result.failureReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No History</h3>
                  <p className="text-gray-500">Simulation results will appear here after running simulations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
