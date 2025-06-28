"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useWeb3 } from "../contexts/Web3Context"
import { FlashbotsService, type FlashbotsBundle } from "../services/FlashbotsService"
import { Zap, Send, Clock, CheckCircle, AlertCircle, Activity, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BundleSubmission {
  id: string
  bundleHash: string
  blockNumber: number
  status: "pending" | "included" | "failed" | "expired"
  submittedAt: number
  priorityFee: number
  transactions: string[]
}

const FlashbotsPanel: React.FC = () => {
  const { web3, account } = useWeb3()

  const [flashbotsService, setFlashbotsService] = useState<FlashbotsService | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [bundleSubmissions, setBundleSubmissions] = useState<BundleSubmission[]>([])
  const [currentBundle, setCurrentBundle] = useState<FlashbotsBundle>({
    transactions: [],
    blockNumber: 0,
  })

  const [bundleForm, setBundleForm] = useState({
    priorityFee: 50, // Gwei
    maxFeePerGas: 200, // Gwei
    gasLimit: 4000000,
    targetBlock: 0,
    rawTransactions: "",
  })

  const [stats, setStats] = useState({
    totalSubmissions: 0,
    successfulInclusions: 0,
    averageInclusionTime: 0,
    totalPriorityFeesPaid: 0,
  })

  useEffect(() => {
    if (web3) {
      const service = new FlashbotsService(web3, {
        enabled: true,
        minExecutionDelay: 2,
        maxPriorityFee: 100,
        detectionWindow: 5,
        sandwichProtectionSlippage: 50,
        useFlashbots: true,
        flashbotsEndpoint: "https://relay.flashbots.net",
      })

      setFlashbotsService(service)
      checkFlashbotsConnection(service)
    }
  }, [web3])

  useEffect(() => {
    if (web3) {
      getCurrentBlock()
    }
  }, [web3])

  const checkFlashbotsConnection = async (service: FlashbotsService) => {
    try {
      const available = await service.isFlashbotsAvailable()
      setIsConnected(available)

      if (!available) {
        console.error("Flashbots relay is not available")
      }
    } catch (error) {
      console.error("Flashbots connection check failed:", error)
      setIsConnected(false)
    }
  }

  const getCurrentBlock = async () => {
    if (!web3) return

    try {
      const blockNumber = await web3.eth.getBlockNumber()
      setBundleForm((prev) => ({ ...prev, targetBlock: blockNumber + 1 }))
      setCurrentBundle((prev) => ({ ...prev, blockNumber: blockNumber + 1 }))
    } catch (error) {
      console.error("Error getting current block:", error)
    }
  }

  const createBundle = async () => {
    if (!flashbotsService || !account) {
      return
    }

    try {
      // Parse raw transactions
      const transactions = bundleForm.rawTransactions
        .split("\n")
        .filter((tx) => tx.trim().length > 0)
        .map((tx) => tx.trim())

      if (transactions.length === 0) {
        return
      }

      const bundle: FlashbotsBundle = {
        transactions,
        blockNumber: bundleForm.targetBlock,
        minTimestamp: Math.floor(Date.now() / 1000),
        maxTimestamp: Math.floor(Date.now() / 1000) + 120, // 2 minutes
      }

      setCurrentBundle(bundle)
    } catch (error) {
      console.error("Bundle creation error:", error)
    }
  }

  const simulateBundle = async () => {
    if (!flashbotsService || currentBundle.transactions.length === 0) {
      return
    }

    try {
      const result = await flashbotsService.simulateBundle(currentBundle)

      if (result.success) {
        // Show simulation results
        const gasUsed = result.results.reduce((sum: number, r: any) => sum + Number.parseInt(r.gasUsed), 0)
        const totalValue = result.results.reduce((sum: number, r: any) => sum + Number.parseInt(r.value || "0"), 0)

        console.log(`Simulation: ${gasUsed} gas, ${web3?.utils.fromWei(totalValue.toString(), "ether")} ETH`)
      }
    } catch (error) {
      console.error("Bundle simulation error:", error)
    }
  }

  const submitBundle = async () => {
    if (!flashbotsService || currentBundle.transactions.length === 0) {
      return
    }

    try {
      const result = await flashbotsService.submitBundle(currentBundle)

      // Add to submissions tracking
      const submission: BundleSubmission = {
        id: Date.now().toString(),
        bundleHash: result.bundleHash,
        blockNumber: currentBundle.blockNumber,
        status: "pending",
        submittedAt: Date.now(),
        priorityFee: bundleForm.priorityFee,
        transactions: currentBundle.transactions,
      }

      setBundleSubmissions((prev) => [submission, ...prev])

      // Start monitoring bundle status
      monitorBundleStatus(submission)
    } catch (error) {
      console.error("Bundle submission error:", error)
    }
  }

  const monitorBundleStatus = async (submission: BundleSubmission) => {
    if (!flashbotsService) return

    const checkStatus = async () => {
      try {
        const stats = await flashbotsService.getBundleStats(submission.bundleHash)

        if (stats.isIncluded) {
          updateSubmissionStatus(submission.id, "included")
        } else if (stats.isExpired) {
          updateSubmissionStatus(submission.id, "expired")
        }
      } catch (error) {
        console.error("Bundle status check error:", error)
      }
    }

    // Check status every 12 seconds (block time)
    const interval = setInterval(checkStatus, 12000)

    // Stop monitoring after 5 minutes
    setTimeout(() => {
      clearInterval(interval)
      if (submission.status === "pending") {
        updateSubmissionStatus(submission.id, "expired")
      }
    }, 300000)
  }

  const updateSubmissionStatus = (id: string, status: BundleSubmission["status"]) => {
    setBundleSubmissions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, status } : sub)))
  }

  const getStatusColor = (status: BundleSubmission["status"]) => {
    switch (status) {
      case "included":
        return "text-green-500"
      case "failed":
        return "text-red-500"
      case "expired":
        return "text-gray-500"
      default:
        return "text-yellow-500"
    }
  }

  const getStatusIcon = (status: BundleSubmission["status"]) => {
    switch (status) {
      case "included":
        return <CheckCircle className="h-4 w-4" />
      case "failed":
        return <AlertCircle className="h-4 w-4" />
      case "expired":
        return <Clock className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4 animate-spin" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Flashbots Integration
          </h2>
          <p className="text-muted-foreground">Submit transaction bundles to Flashbots private mempool</p>
        </div>
        <Badge variant={isConnected ? "default" : "destructive"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
      </div>

      {!isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Flashbots relay is not available. Check your connection and try again.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bundle Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Create Bundle
            </CardTitle>
            <CardDescription>Create and submit transaction bundles for MEV protection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority-fee">Priority Fee (Gwei)</Label>
                <Input
                  id="priority-fee"
                  type="number"
                  min="1"
                  max="200"
                  value={bundleForm.priorityFee}
                  onChange={(e) =>
                    setBundleForm((prev) => ({
                      ...prev,
                      priorityFee: Number.parseInt(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-block">Target Block</Label>
                <Input
                  id="target-block"
                  type="number"
                  value={bundleForm.targetBlock}
                  onChange={(e) =>
                    setBundleForm((prev) => ({
                      ...prev,
                      targetBlock: Number.parseInt(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="raw-transactions">Raw Transactions (one per line)</Label>
              <Textarea
                id="raw-transactions"
                placeholder="0x02f8b1..."
                rows={6}
                value={bundleForm.rawTransactions}
                onChange={(e) =>
                  setBundleForm((prev) => ({
                    ...prev,
                    rawTransactions: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">Enter signed transaction hex strings, one per line</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={createBundle} variant="outline" className="flex-1 bg-transparent">
                Create Bundle
              </Button>
              <Button onClick={simulateBundle} variant="outline" className="flex-1 bg-transparent">
                Simulate
              </Button>
              <Button onClick={submitBundle} disabled={!isConnected} className="flex-1">
                <Zap className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bundle Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Bundle Status
            </CardTitle>
            <CardDescription>Monitor submitted bundle status and inclusion</CardDescription>
          </CardHeader>
          <CardContent>
            {bundleSubmissions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bundleSubmissions.map((submission) => (
                  <div key={submission.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm">{submission.bundleHash.slice(0, 16)}...</code>
                      <div className={`flex items-center gap-1 ${getStatusColor(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        <span className="text-sm capitalize">{submission.status}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Block: {submission.blockNumber}</p>
                      <p>Priority Fee: {submission.priorityFee} Gwei</p>
                      <p>Transactions: {submission.transactions.length}</p>
                      <p>Submitted: {new Date(submission.submittedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No bundles submitted yet</p>
                <p className="text-sm">Create and submit a bundle to see status here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Flashbots Statistics
          </CardTitle>
          <CardDescription>Performance metrics for Flashbots submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">{bundleSubmissions.length}</p>
              <p className="text-sm text-muted-foreground">Total Submissions</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-500">
                {bundleSubmissions.filter((s) => s.status === "included").length}
              </p>
              <p className="text-sm text-muted-foreground">Successful Inclusions</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-blue-500">
                {bundleSubmissions.length > 0
                  ? Math.round(
                      (bundleSubmissions.filter((s) => s.status === "included").length / bundleSubmissions.length) *
                        100,
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-orange-500">
                {bundleSubmissions.reduce((sum, s) => sum + s.priorityFee, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Priority Fees (Gwei)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FlashbotsPanel
