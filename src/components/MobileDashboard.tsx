"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Activity,
  DollarSign,
  TrendingUp,
  Zap,
  Shield,
  Settings,
  Play,
  Pause,
  Square,
  RefreshCw,
  Menu,
  Bell,
  Wifi,
  WifiOff,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react"
import { useBot } from "../contexts/BotContext"
import { useWeb3 } from "../contexts/Web3Context"
import { useIsMobile } from "../hooks/use-mobile"

const MobileDashboard: React.FC = () => {
  const {
    botState,
    opportunities,
    isScanning,
    autoExecutionStats,
    telegramService,
    startBot,
    stopBot,
    emergencyStop,
    scanOpportunities,
  } = useBot()

  const { balance, gasPrice, isConnected } = useWeb3()
  const isMobile = useIsMobile()

  const [activeTab, setActiveTab] = useState("overview")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline">("online")

  // Mobile-specific state
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")
  const [deviceType, setDeviceType] = useState<"mobile" | "tablet">("mobile")

  useEffect(() => {
    // Detect device orientation and type
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setOrientation(width > height ? "landscape" : "portrait")
      setDeviceType(width >= 768 ? "tablet" : "mobile")
    }

    updateDeviceInfo()
    window.addEventListener("resize", updateDeviceInfo)
    window.addEventListener("orientationchange", updateDeviceInfo)

    return () => {
      window.removeEventListener("resize", updateDeviceInfo)
      window.removeEventListener("orientationchange", updateDeviceInfo)
    }
  }, [])

  useEffect(() => {
    // Simulate connection status monitoring
    const checkConnection = () => {
      setConnectionStatus(navigator.onLine ? "online" : "offline")
    }

    checkConnection()
    window.addEventListener("online", checkConnection)
    window.addEventListener("offline", checkConnection)

    return () => {
      window.removeEventListener("online", checkConnection)
      window.removeEventListener("offline", checkConnection)
    }
  }, [])

  useEffect(() => {
    // Mock notifications for mobile
    const mockNotifications = [
      {
        id: 1,
        type: "success",
        title: "Trade Executed",
        message: "Arbitrage trade completed with $45.20 profit",
        timestamp: Date.now() - 300000,
      },
      {
        id: 2,
        type: "warning",
        title: "High Gas Price",
        message: "Network congestion detected - gas price at 0.15 Gwei",
        timestamp: Date.now() - 600000,
      },
      {
        id: 3,
        type: "info",
        title: "New Opportunity",
        message: "USDC/WETH arbitrage opportunity found",
        timestamp: Date.now() - 900000,
      },
    ]
    setNotifications(mockNotifications)
  }, [])

  const formatUptime = (startTime: number) => {
    const uptime = Date.now() - startTime
    const hours = Math.floor(uptime / (1000 * 60 * 60))
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const getStatusColor = (status: string) => {
    if (status.includes("Operational")) return "bg-green-500"
    if (status.includes("Stopped")) return "bg-red-500"
    if (status.includes("EMERGENCY")) return "bg-red-600"
    return "bg-gray-500"
  }

  const getSuccessRate = () => {
    const total = autoExecutionStats.totalExecutions
    if (total === 0) return 0
    return (autoExecutionStats.successfulExecutions / total) * 100
  }

  const getTelegramStatus = () => {
    if (!telegramService) return { status: "Disabled", color: "bg-gray-500" }

    const connectionStatus = telegramService.getConnectionStatus()
    switch (connectionStatus) {
      case "connected":
        return { status: "Connected", color: "bg-green-500" }
      case "testing":
        return { status: "Testing", color: "bg-yellow-500" }
      default:
        return { status: "Disconnected", color: "bg-red-500" }
    }
  }

  const telegramStatus = getTelegramStatus()

  // Mobile-optimized quick stats
  const quickStats = [
    {
      title: "Profit",
      value: `$${botState.totalProfit.toFixed(2)}`,
      icon: <DollarSign className="h-4 w-4" />,
      color: "text-green-600",
      change: "+12.5%",
    },
    {
      title: "Success",
      value: `${getSuccessRate().toFixed(1)}%`,
      icon: <Target className="h-4 w-4" />,
      color: "text-blue-600",
      change: "+2.1%",
    },
    {
      title: "Opportunities",
      value: opportunities.length.toString(),
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-purple-600",
      change: isScanning ? "Scanning..." : "Live",
    },
    {
      title: "Gas",
      value: `${gasPrice} Gwei`,
      icon: <Zap className="h-4 w-4" />,
      color: "text-orange-600",
      change: "Normal",
    },
  ]

  if (!isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Monitor className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <CardTitle>Desktop View Recommended</CardTitle>
            <CardDescription>
              For the best experience, please use the desktop version of the dashboard on larger screens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/dashboard")} className="w-full">
              Go to Desktop Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>Access all dashboard features</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Button
                    variant={activeTab === "overview" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("overview")
                      setIsMenuOpen(false)
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Overview
                  </Button>
                  <Button
                    variant={activeTab === "trading" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("trading")
                      setIsMenuOpen(false)
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trading
                  </Button>
                  <Button
                    variant={activeTab === "opportunities" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("opportunities")
                      setIsMenuOpen(false)
                    }}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Opportunities
                  </Button>
                  <Button
                    variant={activeTab === "settings" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("settings")
                      setIsMenuOpen(false)
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-lg font-semibold">ArbitrageBot</h1>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(botState.status)}`} />
                <span className="text-xs text-muted-foreground">{botState.status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {connectionStatus === "online" ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {notifications.length}
                    </div>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Notifications</SheetTitle>
                  <SheetDescription>Recent activity and alerts</SheetDescription>
                </SheetHeader>
                <ScrollArea className="mt-6 h-[calc(100vh-120px)]">
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-2">
                          {notification.type === "success" && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                          {notification.type === "warning" && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          )}
                          {notification.type === "info" && <Activity className="h-4 w-4 text-blue-500 mt-0.5" />}
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{notification.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {quickStats.map((stat, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
                <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>{stat.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              {!botState.running ? (
                <Button onClick={startBot} disabled={!isConnected} className="flex-1" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Start Bot
                </Button>
              ) : (
                <Button onClick={stopBot} variant="outline" className="flex-1 bg-transparent" size="sm">
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Bot
                </Button>
              )}

              <Button onClick={scanOpportunities} disabled={isScanning} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <Button onClick={emergencyStop} variant="destructive" className="w-full" size="sm">
              <Square className="h-4 w-4 mr-2" />
              Emergency Stop
            </Button>

            {!isConnected && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Wallet not connected. Connect to enable trading.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-xs py-2">
              <BarChart3 className="h-3 w-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trading" className="text-xs py-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="text-xs py-2">
              <Target className="h-3 w-3 mr-1" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs py-2">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Performance Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{getSuccessRate().toFixed(1)}%</span>
                  </div>
                  <Progress value={getSuccessRate()} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Trades</p>
                    <p className="font-semibold">{autoExecutionStats.totalExecutions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uptime</p>
                    <p className="font-semibold">{formatUptime(botState.startTime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Auto-execution</span>
                  <Badge variant={botState.autoExecuteEnabled ? "default" : "secondary"}>
                    {botState.autoExecuteEnabled ? "ON" : "OFF"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Telegram</span>
                  <Badge className={telegramStatus.color}>{telegramStatus.status}</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Security</span>
                  <Badge variant={botState.securityStatus.includes("Normal") ? "default" : "destructive"}>
                    {botState.securityStatus.includes("Normal") ? "Normal" : "Alert"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Balance</span>
                  <span className="text-sm font-semibold">{balance} ETH</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: "Trade Executed", amount: "$45.20", time: "2 min ago", status: "success" },
                    { action: "Opportunity Scanned", amount: "12 found", time: "5 min ago", status: "info" },
                    { action: "Gas Optimized", amount: "0.12 Gwei", time: "8 min ago", status: "info" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {activity.status === "success" && <CheckCircle className="h-3 w-3 text-green-500" />}
                        {activity.status === "info" && <Activity className="h-3 w-3 text-blue-500" />}
                        <div>
                          <p className="text-xs font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold">{activity.amount}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trading" className="space-y-4">
            {/* Trading Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Trading Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-xl font-bold text-green-500">{autoExecutionStats.successfulExecutions}</div>
                    <div className="text-xs text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-xl font-bold text-red-500">{autoExecutionStats.failedExecutions}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Flashloan Token</span>
                  <Badge variant="outline">{botState.flashloanToken}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Amount</span>
                  <span className="text-sm font-semibold">${botState.flashloanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Provider</span>
                  <Badge variant="outline">{botState.flashloanProvider}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Min Profit</span>
                  <span className="text-sm font-semibold">${botState.minProfitThreshold}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            {/* Opportunities List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Opportunities
                  <Badge variant="outline">{opportunities.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {opportunities.slice(0, 10).map((opportunity, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium">
                              {opportunity.baseToken?.symbol}/{opportunity.quoteToken?.symbol}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {opportunity.route?.buyDex} → {opportunity.route?.sellDex}
                            </p>
                          </div>
                          <Badge variant="default" className="text-xs">
                            ${opportunity.estimatedProfit?.toFixed(2) || "0.00"}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Liquidity: ${opportunity.liquidity?.usd?.toLocaleString() || "0"}</span>
                          <span>Risk: {opportunity.riskLevel || "Low"}</span>
                        </div>
                      </div>
                    ))}

                    {opportunities.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No opportunities found</p>
                        <p className="text-xs">Run a scan to find arbitrage opportunities</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {/* Device Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Device Type</span>
                  <div className="flex items-center gap-1">
                    {deviceType === "mobile" ? <Smartphone className="h-3 w-3" /> : <Tablet className="h-3 w-3" />}
                    <span className="text-sm capitalize">{deviceType}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Orientation</span>
                  <span className="text-sm capitalize">{orientation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Connection</span>
                  <Badge variant={connectionStatus === "online" ? "default" : "destructive"}>{connectionStatus}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* App Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">App Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Push Notifications</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Auto-refresh</span>
                  <Badge variant="default">On</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dark Mode</span>
                  <Badge variant="secondary">System</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Settings
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Notification Settings
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation for Mobile */}
      {deviceType === "mobile" && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-2">
          <div className="flex justify-around">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("overview")}
              className="flex-col h-auto py-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs mt-1">Overview</span>
            </Button>
            <Button
              variant={activeTab === "trading" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("trading")}
              className="flex-col h-auto py-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs mt-1">Trading</span>
            </Button>
            <Button
              variant={activeTab === "opportunities" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("opportunities")}
              className="flex-col h-auto py-2"
            >
              <Target className="h-4 w-4" />
              <span className="text-xs mt-1">Opportunities</span>
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("settings")}
              className="flex-col h-auto py-2"
            >
              <Settings className="h-4 w-4" />
              <span className="text-xs mt-1">Settings</span>
            </Button>
          </div>
        </div>
      )}

      {/* Add bottom padding when bottom nav is present */}
      {deviceType === "mobile" && <div className="h-20" />}
    </div>
  )
}

export default MobileDashboard
