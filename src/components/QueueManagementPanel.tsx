"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Play,
  Pause,
  Square,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Settings,
} from "lucide-react"
import { QueueManagerService, type TradeJob, type QueueStats } from "../services/QueueManagerService"

interface QueueManagementPanelProps {
  onJobExecuted?: (job: TradeJob) => void
}

export default function QueueManagementPanel({ onJobExecuted }: QueueManagementPanelProps) {
  const [queueManager] = useState(() => new QueueManagerService())
  const [jobs, setJobs] = useState<TradeJob[]>([])
  const [stats, setStats] = useState<QueueStats>({
    totalJobs: 0,
    pendingJobs: 0,
    processingJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageProcessingTime: 0,
    successRate: 0,
    queueHealth: "healthy",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pending" | "processing" | "completed" | "failed">("all")
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadData()

    if (autoRefresh) {
      const interval = setInterval(loadData, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedFilter])

  const loadData = async () => {
    try {
      const [jobsData, statsData] = await Promise.all([
        queueManager.getJobs({
          status: selectedFilter === "all" ? undefined : selectedFilter,
          limit: 50,
        }),
        queueManager.getQueueStats(),
      ])

      setJobs(jobsData)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading queue data:", error)
    }
  }

  const handleAddJob = async () => {
    setIsLoading(true)
    try {
      await queueManager.addJob({
        type: "arbitrage",
        priority: 50,
        scheduledAt: Date.now(),
        maxAttempts: 3,
        flashloanToken: "0xA0b86a33E6441b8435b662303c0f6a4D2F23E6e1",
        flashloanAmount: 250000,
        flashloanProvider: "aave",
        targetToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        dexPath: ["0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"],
        slippageTolerance: 150,
        gasPrice: 100,
        minProfitUsd: 50,
        source: "manual",
        tags: ["test", "manual"],
      })

      await loadData()
    } catch (error) {
      console.error("Error adding job:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelJob = async (jobId: string) => {
    try {
      await queueManager.cancelJob(jobId)
      await loadData()
    } catch (error) {
      console.error("Error cancelling job:", error)
    }
  }

  const handlePauseQueue = async () => {
    try {
      await queueManager.pause()
      await loadData()
    } catch (error) {
      console.error("Error pausing queue:", error)
    }
  }

  const handleResumeQueue = async () => {
    try {
      await queueManager.resume()
      await loadData()
    } catch (error) {
      console.error("Error resuming queue:", error)
    }
  }

  const handleClearQueue = async () => {
    try {
      await queueManager.clear()
      await loadData()
    } catch (error) {
      console.error("Error clearing queue:", error)
    }
  }

  const getStatusIcon = (status: TradeJob["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "cancelled":
        return <Square className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TradeJob["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "processing":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "failed":
        return "bg-red-500"
      case "cancelled":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getHealthColor = (health: QueueStats["queueHealth"]) => {
    switch (health) {
      case "healthy":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
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
          <BarChart3 className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Queue Management</h2>
          <Badge className={getHealthColor(stats.queueHealth)}>{stats.queueHealth.toUpperCase()}</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddJob} disabled={isLoading}>
            Add Test Job
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-sm text-gray-600">Total Jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingJobs}</div>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.processingJobs}</div>
            <p className="text-sm text-gray-600">Processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failedJobs}</div>
            <p className="text-sm text-gray-600">Failed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-sm text-gray-600">Success Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatDuration(stats.averageProcessingTime)}</div>
            <p className="text-sm text-gray-600">Avg Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Queue Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button onClick={handleResumeQueue} variant="default">
              <Play className="h-4 w-4 mr-2" />
              Resume Queue
            </Button>
            <Button onClick={handlePauseQueue} variant="outline">
              <Pause className="h-4 w-4 mr-2" />
              Pause Queue
            </Button>
            <Button onClick={handleClearQueue} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Queue
            </Button>
            <div className="flex items-center space-x-2 ml-auto">
              <Label>Filter:</Label>
              <Select value={selectedFilter} onValueChange={(value: any) => setSelectedFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs">Job Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Queue ({jobs.length} jobs)</CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No jobs in queue</p>
                  <Button onClick={handleAddJob} className="mt-4">
                    Add Test Job
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h4 className="font-semibold">{job.id}</h4>
                            <p className="text-sm text-gray-600">
                              {job.type} • Priority: {job.priority} • Attempt {job.attempts}/{job.maxAttempts}
                            </p>
                          </div>
                          <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                          <Badge variant="outline">{job.source}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          {job.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => handleCancelJob(job.id)}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <label className="text-gray-600">Flashloan Amount</label>
                          <p className="font-semibold">{formatNumber(job.flashloanAmount)}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Provider</label>
                          <p className="font-semibold">{job.flashloanProvider}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Min Profit</label>
                          <p className="font-semibold">{formatNumber(job.minProfitUsd)}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Created</label>
                          <p className="font-semibold">{new Date(job.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>

                      {job.error && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-600">{job.error}</p>
                        </div>
                      )}

                      {job.executionResult && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <label className="text-gray-600">Profit</label>
                              <p className="font-semibold text-green-600">{formatNumber(job.executionResult.profit)}</p>
                            </div>
                            <div>
                              <label className="text-gray-600">Processing Time</label>
                              <p className="font-semibold">{formatDuration(job.executionResult.processingTime)}</p>
                            </div>
                            <div>
                              <label className="text-gray-600">Completed</label>
                              <p className="font-semibold">
                                {new Date(job.executionResult.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {job.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {job.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Success Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Overall Success Rate</span>
                    <span className="font-semibold">{stats.successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.successRate} className="h-2" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-600">Completed</label>
                      <p className="font-semibold text-green-600">{stats.completedJobs}</p>
                    </div>
                    <div>
                      <label className="text-gray-600">Failed</label>
                      <p className="font-semibold text-red-600">{stats.failedJobs}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Processing Time</span>
                    <span className="font-semibold">{formatDuration(stats.averageProcessingTime)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-600">Queue Health</label>
                      <p className={`font-semibold ${getHealthColor(stats.queueHealth)}`}>
                        {stats.queueHealth.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <label className="text-gray-600">Active Jobs</label>
                      <p className="font-semibold">{stats.processingJobs}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Concurrency</Label>
                    <Input type="number" defaultValue="3" min="1" max="10" />
                    <p className="text-sm text-gray-600">Number of concurrent workers</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Retries</Label>
                    <Input type="number" defaultValue="3" min="0" max="10" />
                    <p className="text-sm text-gray-600">Maximum retry attempts per job</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Job Timeout (seconds)</Label>
                    <Input type="number" defaultValue="30" min="5" max="300" />
                    <p className="text-sm text-gray-600">Maximum execution time per job</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Retry Delay (ms)</Label>
                    <Input type="number" defaultValue="5000" min="1000" max="60000" />
                    <p className="text-sm text-gray-600">Delay between retry attempts</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Health Check Interval (ms)</Label>
                    <Input type="number" defaultValue="10000" min="5000" max="60000" />
                    <p className="text-sm text-gray-600">Frequency of health checks</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Cleanup Interval (ms)</Label>
                    <Input type="number" defaultValue="60000" min="30000" max="300000" />
                    <p className="text-sm text-gray-600">Frequency of queue cleanup</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline">Reset to Defaults</Button>
                <Button>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
