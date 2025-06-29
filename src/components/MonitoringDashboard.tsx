"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert as UIAlert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Bell,
  BellOff,
  Server,
  Database,
  Globe,
  Monitor,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    temperature: number
    frequency: number
  }
  memory: {
    used: number
    total: number
    usage: number
    available: number
  }
  disk: {
    used: number
    total: number
    usage: number
    readSpeed: number
    writeSpeed: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    packetsIn: number
    packetsOut: number
    latency: number
    bandwidth: number
  }
  blockchain: {
    blockNumber: number
    gasPrice: number
    networkHashrate: string
    difficulty: string
    pendingTransactions: number
    blockTime: number
  }
  application: {
    uptime: number
    activeConnections: number
    requestsPerSecond: number
    errorRate: number
    responseTime: number
    memoryLeaks: number
  }
}

interface AlertItem {
  id: string
  type: "critical" | "warning" | "info"
  category: "system" | "network" | "blockchain" | "application" | "security"
  title: string
  message: string
  timestamp: number
  acknowledged: boolean
  resolved: boolean
}

interface PerformanceMetric {
  timestamp: number
  cpu: number
  memory: number
  network: number
  responseTime: number
  errorRate: number
}

const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 45, cores: 8, temperature: 65, frequency: 3.2 },
    memory: { used: 8192, total: 16384, usage: 50, available: 8192 },
    disk: { used: 256000, total: 512000, usage: 50, readSpeed: 150, writeSpeed: 120 },
    network: { bytesIn: 1024000, bytesOut: 512000, packetsIn: 1500, packetsOut: 1200, latency: 25, bandwidth: 1000 },
    blockchain: {
      blockNumber: 150234567,
      gasPrice: 0.12,
      networkHashrate: "185.5 TH/s",
      difficulty: "32.5T",
      pendingTransactions: 1250,
      blockTime: 12.5,
    },
    application: {
      uptime: 86400,
      activeConnections: 45,
      requestsPerSecond: 125,
      errorRate: 0.5,
      responseTime: 85,
      memoryLeaks: 0,
    },
  })

  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetric[]>([])
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5)
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h")
  const [alertsEnabled, setAlertsEnabled] = useState(true)

  useEffect(() => {
    generateMockAlerts()
    generateMockPerformanceHistory()
  }, [])

  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      updateMetrics()
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [isMonitoring, refreshInterval])

  const updateMetrics = () => {
    setMetrics((prev) => ({
      cpu: {
        usage: Math.max(0, Math.min(100, prev.cpu.usage + (Math.random() - 0.5) * 10)),
        cores: 8,
        temperature: 45 + Math.random() * 20,
        frequency: 2.4 + Math.random() * 1.6,
      },
      memory: {
        used: Math.max(0, Math.min(prev.memory.total, prev.memory.used + (Math.random() - 0.5) * 1024)),
        total: 16384,
        usage: 0,
        available: 0,
      },
      disk: {
        used: Math.max(0, Math.min(prev.disk.total, prev.disk.used + Math.random() * 100)),
        total: 512000,
        usage: 0,
        readSpeed: Math.random() * 500,
        writeSpeed: Math.random() * 300,
      },
      network: {
        bytesIn: prev.network.bytesIn + Math.random() * 1000000,
        bytesOut: prev.network.bytesOut + Math.random() * 500000,
        packetsIn: prev.network.packetsIn + Math.random() * 1000,
        packetsOut: prev.network.packetsOut + Math.random() * 800,
        latency: 10 + Math.random() * 50,
        bandwidth: 1000,
      },
      blockchain: {
        blockNumber: prev.blockchain.blockNumber + (Math.random() > 0.8 ? 1 : 0),
        gasPrice: Math.max(0.01, prev.blockchain.gasPrice + (Math.random() - 0.5) * 0.05),
        networkHashrate: (Math.random() * 200 + 150).toFixed(2) + " TH/s",
        difficulty: (Math.random() * 50 + 25).toFixed(2) + "T",
        pendingTransactions: Math.max(0, prev.blockchain.pendingTransactions + Math.floor((Math.random() - 0.5) * 100)),
        blockTime: 12 + (Math.random() - 0.5) * 4,
      },
      application: {
        uptime: prev.application.uptime + refreshInterval,
        activeConnections: Math.max(0, prev.application.activeConnections + Math.floor((Math.random() - 0.5) * 10)),
        requestsPerSecond: Math.max(0, prev.application.requestsPerSecond + (Math.random() - 0.5) * 20),
        errorRate: Math.max(0, Math.min(10, prev.application.errorRate + (Math.random() - 0.5) * 0.5)),
        responseTime: Math.max(10, prev.application.responseTime + (Math.random() - 0.5) * 50),
        memoryLeaks: prev.application.memoryLeaks + (Math.random() > 0.95 ? 1 : 0),
      },
    }))

    setMetrics((current) => ({
      ...current,
      memory: {
        ...current.memory,
        usage: (current.memory.used / current.memory.total) * 100,
        available: current.memory.total - current.memory.used,
      },
      disk: {
        ...current.disk,
        usage: (current.disk.used / current.disk.total) * 100,
      },
    }))

    setPerformanceHistory((prev) => {
      const newEntry: PerformanceMetric = {
        timestamp: Date.now(),
        cpu: metrics.cpu.usage,
        memory: metrics.memory.usage,
        network: metrics.network.latency,
        responseTime: metrics.application.responseTime,
        errorRate: metrics.application.errorRate,
      }

      const updated = [...prev, newEntry]
      return updated.slice(-100)
    })

    checkAndGenerateAlerts()
  }

  const generateMockAlerts = () => {
    const mockAlerts: AlertItem[] = [
      {
        id: "alert_1",
        type: "critical",
        category: "system",
        title: "High CPU Usage",
        message: "CPU usage has exceeded 90% for the last 5 minutes",
        timestamp: Date.now() - 300000,
        acknowledged: false,
        resolved: false,
      },
      {
        id: "alert_2",
        type: "warning",
        category: "blockchain",
        title: "High Gas Prices",
        message: "Network gas prices are above 200 Gwei",
        timestamp: Date.now() - 600000,
        acknowledged: true,
        resolved: false,
      },
      {
        id: "alert_3",
        type: "info",
        category: "application",
        title: "New Version Available",
        message: "Bot version 2.1.1 is available for update",
        timestamp: Date.now() - 900000,
        acknowledged: false,
        resolved: false,
      },
      {
        id: "alert_4",
        type: "warning",
        category: "network",
        title: "High Latency",
        message: "Network latency to Arbitrum RPC is above 500ms",
        timestamp: Date.now() - 1200000,
        acknowledged: true,
        resolved: true,
      },
      {
        id: "alert_5",
        type: "critical",
        category: "security",
        title: "Suspicious Activity",
        message: "Multiple failed authentication attempts detected",
        timestamp: Date.now() - 1800000,
        acknowledged: false,
        resolved: false,
      },
    ]

    setAlerts(mockAlerts)
  }

  const generateMockPerformanceHistory = () => {
    const mockHistory: PerformanceMetric[] = Array.from({ length: 100 }, (_, i) => ({
      timestamp: Date.now() - i * 60000,
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      network: Math.random() * 500,
      responseTime: Math.random() * 500,
      errorRate: Math.random() * 10,
    }))

    setPerformanceHistory(mockHistory.reverse())
  }

  const checkAndGenerateAlerts = () => {
    if (!alertsEnabled) return

    const newAlerts: AlertItem[] = []

    if (metrics.cpu.usage > 90) {
      newAlerts.push({
        id: `alert_cpu_${Date.now()}`,
        type: "critical",
        category: "system",
        title: "High CPU Usage",
        message: "CPU usage has exceeded 90%",
        timestamp: Date.now(),
        acknowledged: false,
        resolved: false,
      })
    }

    if (metrics.blockchain.gasPrice > 200) {
      newAlerts.push({
        id: `alert_gas_${Date.now()}`,
        type: "warning",
        category: "blockchain",
        title: "High Gas Prices",
        message: "Network gas prices are above 200 Gwei",
        timestamp: Date.now(),
        acknowledged: false,
        resolved: false,
      })
    }

    if (metrics.network.latency > 500) {
      newAlerts.push({
        id: `alert_latency_${Date.now()}`,
        type: "warning",
        category: "network",
        title: "High Latency",
        message: "Network latency is above 500ms",
        timestamp: Date.now(),
        acknowledged: false,
        resolved: false,
      })
    }

    if (metrics.application.errorRate > 5) {
      newAlerts.push({
        id: `alert_error_${Date.now()}`,
        type: "critical",
        category: "application",
        title: "High Error Rate",
        message: "Application error rate is above 5%",
        timestamp: Date.now(),
        acknowledged: false,
        resolved: false,
      })
    }

    if (newAlerts.length > 0) {
      setAlerts((prevAlerts) => [...newAlerts, ...prevAlerts].slice(0, 50))
    }
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))
  }

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, resolved: true, acknowledged: true } : alert)),
    )
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "text-red-500"
    if (value >= thresholds.warning) return "text-yellow-500"
    return "text-green-500"
  }

  const getProgressColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "bg-red-500"
    if (value >= thresholds.warning) return "bg-yellow-500"
    return "bg-green-500"
  }

  const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged && !alert.resolved)
  const criticalAlerts = alerts.filter((alert) => alert.type === "critical" && !alert.resolved)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            System Monitoring Dashboard
          </CardTitle>
          <CardDescription>
            Real-time monitoring of system performance, network status, and application health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isMonitoring ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm font-medium">{isMonitoring ? "Monitoring Active" : "Monitoring Stopped"}</span>
              </div>

              <div className="flex items-center gap-2">
                {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                <span className="text-sm">Alerts {alertsEnabled ? "Enabled" : "Disabled"}</span>
              </div>

              {unacknowledgedAlerts.length > 0 && (
                <Badge variant="destructive">
                  {unacknowledgedAlerts.length} Unacknowledged Alert{unacknowledgedAlerts.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(Number(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 second</SelectItem>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setAlertsEnabled(!alertsEnabled)}>
                {alertsEnabled ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </Button>

              <Button variant="outline" size="sm" onClick={() => setIsMonitoring(!isMonitoring)}>
                {isMonitoring ? <RefreshCw className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                {isMonitoring ? "Stop" : "Start"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <UIAlert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            <strong>
              {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? "s" : ""} Active:
            </strong>
            {criticalAlerts.slice(0, 2).map((alert) => (
              <span key={alert.id} className="ml-2">
                {alert.title}
              </span>
            ))}
            {criticalAlerts.length > 2 && <span className="ml-2">and {criticalAlerts.length - 2} more...</span>}
          </AlertDescription>
        </UIAlert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Cpu className={`h-5 w-5 ${getStatusColor(metrics.cpu.usage, { warning: 70, critical: 90 })}`} />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">CPU Usage</p>
                    <p className="text-2xl font-bold">{metrics.cpu.usage.toFixed(1)}%</p>
                    <Progress value={metrics.cpu.usage} className="h-2 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database
                    className={`h-5 w-5 ${getStatusColor(metrics.memory.usage, { warning: 70, critical: 90 })}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Memory Usage</p>
                    <p className="text-2xl font-bold">{metrics.memory.usage.toFixed(1)}%</p>
                    <Progress value={metrics.memory.usage} className="h-2 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wifi
                    className={`h-5 w-5 ${getStatusColor(metrics.network.latency, { warning: 100, critical: 500 })}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Network Latency</p>
                    <p className="text-2xl font-bold">{metrics.network.latency.toFixed(0)}ms</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics.network.latency < 50
                        ? "Excellent"
                        : metrics.network.latency < 100
                          ? "Good"
                          : metrics.network.latency < 200
                            ? "Fair"
                            : "Poor"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity
                    className={`h-5 w-5 ${getStatusColor(metrics.application.errorRate, { warning: 2, critical: 5 })}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold">{metrics.application.errorRate.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics.application.requestsPerSecond.toFixed(0)} req/s
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Performance</CardTitle>
                <CardDescription>CPU and Memory usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceHistory.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)}${name === "cpu" || name === "memory" ? "%" : "ms"}`,
                        name.toUpperCase(),
                      ]}
                    />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Metrics</CardTitle>
                <CardDescription>Response time and error rate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceHistory.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)}${name === "responseTime" ? "ms" : "%"}`,
                        name === "responseTime" ? "Response Time" : "Error Rate",
                      ]}
                    />
                    <Area type="monotone" dataKey="responseTime" stackId="1" stroke="#ffc658" fill="#ffc658" />
                    <Area type="monotone" dataKey="errorRate" stackId="2" stroke="#ff7300" fill="#ff7300" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">System Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-lg font-semibold">{formatUptime(metrics.application.uptime)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Started {new Date(Date.now() - metrics.application.uptime * 1000).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-lg font-semibold">{metrics.application.activeConnections}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.application.requestsPerSecond.toFixed(0)} requests per second
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Gas Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-lg font-semibold">{metrics.blockchain.gasPrice.toFixed(3)} Gwei</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Block #{metrics.blockchain.blockNumber.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  CPU Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Usage</span>
                    <span className={`font-medium ${getStatusColor(metrics.cpu.usage, { warning: 70, critical: 90 })}`}>
                      {metrics.cpu.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.cpu.usage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Cores:</span>
                    <span className="font-medium">{metrics.cpu.cores}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span className="font-medium">{metrics.cpu.temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <span className="font-medium">{metrics.cpu.frequency.toFixed(1)} GHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Load Average:</span>
                    <span className="font-medium">{((metrics.cpu.usage / 100) * metrics.cpu.cores).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Memory Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Usage</span>
                    <span
                      className={`font-medium ${getStatusColor(metrics.memory.usage, { warning: 70, critical: 90 })}`}
                    >
                      {metrics.memory.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.memory.usage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <span className="font-medium">{formatBytes(metrics.memory.used * 1024 * 1024)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{formatBytes(metrics.memory.total * 1024 * 1024)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-medium">{formatBytes(metrics.memory.available * 1024 * 1024)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Leaks:</span>
                    <span className="font-medium">{metrics.application.memoryLeaks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Disk Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Usage</span>
                    <span
                      className={`font-medium ${getStatusColor(metrics.disk.usage, { warning: 80, critical: 95 })}`}
                    >
                      {metrics.disk.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.disk.usage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <span className="font-medium">{formatBytes(metrics.disk.used * 1024 * 1024)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{formatBytes(metrics.disk.total * 1024 * 1024)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Read Speed:</span>
                    <span className="font-medium">{metrics.disk.readSpeed.toFixed(0)} MB/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Write Speed:</span>
                    <span className="font-medium">{metrics.disk.writeSpeed.toFixed(0)} MB/s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Application Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="font-medium">{formatUptime(metrics.application.uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connections:</span>
                    <span className="font-medium">{metrics.application.activeConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requests/sec:</span>
                    <span className="font-medium">{metrics.application.requestsPerSecond.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate:</span>
                    <span
                      className={`font-medium ${getStatusColor(metrics.application.errorRate, { warning: 2, critical: 5 })}`}
                    >
                      {metrics.application.errorRate.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span className="font-medium">{metrics.application.responseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Leaks:</span>
                    <span className="font-medium">{metrics.application.memoryLeaks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Network Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span
                      className={`font-medium ${getStatusColor(metrics.network.latency, { warning: 100, critical: 500 })}`}
                    >
                      {metrics.network.latency.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bandwidth:</span>
                    <span className="font-medium">{metrics.network.bandwidth} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bytes In:</span>
                    <span className="font-medium">{formatBytes(metrics.network.bytesIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bytes Out:</span>
                    <span className="font-medium">{formatBytes(metrics.network.bytesOut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packets In:</span>
                    <span className="font-medium">{metrics.network.packetsIn.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packets Out:</span>
                    <span className="font-medium">{metrics.network.packetsOut.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Traffic</CardTitle>
                <CardDescription>Real-time network activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceHistory.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value: number) => [`${value.toFixed(0)}ms`, "Latency"]}
                    />
                    <Area type="monotone" dataKey="network" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Blockchain Tab */}
        <TabsContent value="blockchain" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Blockchain Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Block Number:</span>
                    <span className="font-medium">{metrics.blockchain.blockNumber.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gas Price:</span>
                    <span className="font-medium">{metrics.blockchain.gasPrice.toFixed(3)} Gwei</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Hashrate:</span>
                    <span className="font-medium">{metrics.blockchain.networkHashrate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <span className="font-medium">{metrics.blockchain.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Txs:</span>
                    <span className="font-medium">{metrics.blockchain.pendingTransactions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Block Time:</span>
                    <span className="font-medium">{metrics.blockchain.blockTime.toFixed(1)}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gas Price Trend</CardTitle>
                <CardDescription>Gas price changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={performanceHistory.slice(-20).map((p) => ({
                      ...p,
                      gasPrice: 0.1 + Math.random() * 0.1,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value: number) => [`${value.toFixed(3)} Gwei`, "Gas Price"]}
                    />
                    <Line type="monotone" dataKey="gasPrice" stroke="#ff7300" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">System Alerts</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{alerts.filter((a) => !a.resolved).length} Active</Badge>
              <Badge variant="destructive">{criticalAlerts.length} Critical</Badge>
            </div>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`${
                    alert.type === "critical"
                      ? "border-red-500"
                      : alert.type === "warning"
                        ? "border-yellow-500"
                        : "border-blue-500"
                  } ${alert.resolved ? "opacity-50" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {alert.type === "critical" && <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />}
                        {alert.type === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />}
                        {alert.type === "info" && <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />}

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {alert.category}
                            </Badge>
                            {alert.acknowledged && (
                              <Badge variant="secondary" className="text-xs">
                                Acknowledged
                              </Badge>
                            )}
                            {alert.resolved && (
                              <Badge variant="default" className="text-xs">
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!alert.acknowledged && (
                          <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                        {!alert.resolved && (
                          <Button size="sm" variant="default" onClick={() => resolveAlert(alert.id)}>
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {alerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No alerts at this time</p>
                  <p className="text-xs">System is running normally</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MonitoringDashboard
