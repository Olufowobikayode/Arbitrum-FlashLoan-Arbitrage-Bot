"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Shield, Bell, Settings, Activity, TrendingUp, Zap, Clock } from "lucide-react"
import type { MEVAlertService, MEVAlert, AlertConfig } from "../services/MEVAlertService"

interface MEVAlertPanelProps {
  alertService: MEVAlertService
  onConfigChange?: (config: AlertConfig) => void
}

export default function MEVAlertPanel({ alertService, onConfigChange }: MEVAlertPanelProps) {
  const [alerts, setAlerts] = useState<MEVAlert[]>([])
  const [config, setConfig] = useState<AlertConfig>(alertService.getConfig())
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [stats, setStats] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    alertsToday: 0,
    avgRiskScore: 0,
  })

  useEffect(() => {
    // Subscribe to alerts
    const handleAlert = (alert: MEVAlert) => {
      setAlerts((prev) => [alert, ...prev.slice(0, 49)]) // Keep last 50 alerts
      updateStats()
    }

    alertService.onAlert(handleAlert)

    // Initial data load
    setAlerts(alertService.getRecentAlerts(50))
    updateStats()

    // Update stats every 30 seconds
    const statsInterval = setInterval(updateStats, 30000)

    return () => {
      alertService.removeAlertCallback(handleAlert)
      clearInterval(statsInterval)
    }
  }, [alertService])

  const updateStats = () => {
    const recentAlerts = alertService.getRecentAlerts(100)
    const today = Date.now() - 24 * 60 * 60 * 1000
    const alertsToday = recentAlerts.filter((alert) => alert.timestamp >= today)
    const criticalAlerts = recentAlerts.filter((alert) => alert.severity === "critical")
    const avgRiskScore =
      recentAlerts.length > 0 ? recentAlerts.reduce((sum, alert) => sum + alert.riskScore, 0) / recentAlerts.length : 0

    setStats({
      totalAlerts: recentAlerts.length,
      criticalAlerts: criticalAlerts.length,
      alertsToday: alertsToday.length,
      avgRiskScore: Math.round(avgRiskScore),
    })
  }

  const handleConfigUpdate = (newConfig: Partial<AlertConfig>) => {
    const updatedConfig = { ...config, ...newConfig }
    setConfig(updatedConfig)
    alertService.updateConfig(updatedConfig)
    onConfigChange?.(updatedConfig)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      case "high":
        return <Zap className="h-4 w-4" />
      case "medium":
        return <Activity className="h-4 w-4" />
      case "low":
        return <Bell className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sandwich":
        return "🥪"
      case "frontrun":
        return "🏃"
      case "backrun":
        return "🔄"
      case "liquidation":
        return "💧"
      case "high_risk":
        return "⚠️"
      case "cross_chain":
        return "🌉"
      default:
        return "🔍"
    }
  }

  const clearAlerts = () => {
    alertService.clearAlerts()
    setAlerts([])
    updateStats()
  }

  const toggleMonitoring = () => {
    if (isMonitoring) {
      alertService.stopMonitoring()
    } else {
      alertService.startMonitoring()
    }
    setIsMonitoring(!isMonitoring)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">MEV Alert System</h2>
          <Badge variant={isMonitoring ? "default" : "secondary"}>{isMonitoring ? "Active" : "Inactive"}</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={clearAlerts} disabled={alerts.length === 0}>
            Clear Alerts
          </Button>
          <Button variant={isMonitoring ? "destructive" : "default"} size="sm" onClick={toggleMonitoring}>
            {isMonitoring ? "Stop" : "Start"} Monitoring
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold">{stats.totalAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-500">{stats.criticalAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">{stats.alertsToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Avg Risk Score</p>
                <p className="text-2xl font-bold">{stats.avgRiskScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent MEV Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alerts detected</p>
                  <p className="text-sm">Your transactions are protected</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {alerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      className="border-l-4"
                      style={{
                        borderLeftColor: getSeverityColor(alert.severity).replace("bg-", "#"),
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="flex items-center space-x-2">
                            {getSeverityIcon(alert.severity)}
                            <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                              <Badge variant="outline">{alert.type.replace("_", " ").toUpperCase()}</Badge>
                              <span className="text-sm text-gray-500">Block #{alert.blockNumber}</span>
                            </div>
                            <AlertDescription className="mb-2">{alert.message}</AlertDescription>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Risk: {alert.riskScore}/100</span>
                              <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                              {alert.txHash && (
                                <span className="font-mono text-xs">{alert.txHash.slice(0, 10)}...</span>
                              )}
                            </div>
                            <div className="mt-2">
                              <Progress value={alert.riskScore} className="h-2" />
                            </div>
                            <p className="text-sm text-blue-600 mt-2">💡 {alert.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Alert Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Settings</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enabled">Enable Alerts</Label>
                    <p className="text-sm text-gray-600">Turn on/off MEV alert monitoring</p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={config.enabled}
                    onCheckedChange={(enabled) => handleConfigUpdate({ enabled })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minRiskScore">Minimum Risk Score</Label>
                  <Input
                    id="minRiskScore"
                    type="number"
                    min="0"
                    max="100"
                    value={config.minRiskScore}
                    onChange={(e) => handleConfigUpdate({ minRiskScore: Number.parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-gray-600">Only show alerts above this risk score (0-100)</p>
                </div>
              </div>

              {/* Alert Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Alert Types</h3>
                <div className="grid grid-cols-2 gap-4">
                  {["sandwich", "frontrun", "backrun", "liquidation", "high_risk", "cross_chain"].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Switch
                        id={type}
                        checked={config.alertTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          const newTypes = checked
                            ? [...config.alertTypes, type]
                            : config.alertTypes.filter((t) => t !== type)
                          handleConfigUpdate({ alertTypes: newTypes })
                        }}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type.replace("_", " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Methods</h3>
                <div className="grid grid-cols-2 gap-4">
                  {["browser", "email", "webhook", "telegram"].map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Switch
                        id={method}
                        checked={config.notificationMethods.includes(method as any)}
                        onCheckedChange={(checked) => {
                          const newMethods = checked
                            ? [...config.notificationMethods, method as any]
                            : config.notificationMethods.filter((m) => m !== method)
                          handleConfigUpdate({ notificationMethods: newMethods })
                        }}
                      />
                      <Label htmlFor={method} className="capitalize">
                        {method}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook Configuration */}
              {config.notificationMethods.includes("webhook") && (
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://your-webhook-url.com"
                    value={config.webhookUrl || ""}
                    onChange={(e) => handleConfigUpdate({ webhookUrl: e.target.value })}
                  />
                </div>
              )}

              {/* Telegram Configuration */}
              {config.notificationMethods.includes("telegram") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="telegramBotToken">Telegram Bot Token</Label>
                    <Input
                      id="telegramBotToken"
                      type="password"
                      placeholder="Your bot token"
                      value={config.telegramBotToken || ""}
                      onChange={(e) => handleConfigUpdate({ telegramBotToken: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
                    <Input
                      id="telegramChatId"
                      placeholder="Your chat ID"
                      value={config.telegramChatId || ""}
                      onChange={(e) => handleConfigUpdate({ telegramChatId: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Auto Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Auto Actions</h3>
                <div className="space-y-3">
                  {Object.entries(config.autoActions).map(([action, enabled]) => (
                    <div key={action} className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={action} className="capitalize">
                          {action.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {action === "emergencyStop" && "Automatically stop trading when high-risk MEV detected"}
                          {action === "increaseSlippage" && "Increase slippage tolerance during MEV activity"}
                          {action === "useFlashbots" && "Switch to Flashbots when MEV detected"}
                          {action === "delayExecution" && "Delay transactions during high MEV periods"}
                        </p>
                      </div>
                      <Switch
                        id={action}
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          handleConfigUpdate({
                            autoActions: { ...config.autoActions, [action]: checked },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["critical", "high", "medium", "low"].map((severity) => {
                    const count = alerts.filter((alert) => alert.severity === severity).length
                    const percentage = alerts.length > 0 ? (count / alerts.length) * 100 : 0

                    return (
                      <div key={severity} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{severity}</span>
                          <span>
                            {count} ({percentage.toFixed(1)}%)
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
                <CardTitle>MEV Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["sandwich", "frontrun", "backrun", "liquidation", "high_risk"].map((type) => {
                    const count = alerts.filter((alert) => alert.type === type).length
                    const percentage = alerts.length > 0 ? (count / alerts.length) * 100 : 0

                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{type.replace("_", " ")}</span>
                          <span>
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getTypeIcon(alert.type)}</span>
                      <div>
                        <p className="font-medium">{alert.type.replace("_", " ")}</p>
                        <p className="text-sm text-gray-600">Risk: {alert.riskScore}/100</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      <p className="text-xs text-gray-500 mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
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
