"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Smartphone,
  MessageSquare,
  Settings,
  TestTube,
  Clock,
  Shield,
  TrendingUp,
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react"
import { PushNotificationService, type NotificationSettings } from "../services/PushNotificationService"
import { TelegramNotificationService, type TelegramConfig } from "../services/TelegramNotificationService"

interface NotificationSettingsPanelProps {
  onSettingsChange?: (settings: NotificationSettings) => void
}

const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({ onSettingsChange }) => {
  const [pushService] = useState(() => new PushNotificationService())
  const [telegramService, setTelegramService] = useState<TelegramNotificationService | null>(null)
  const [settings, setSettings] = useState<NotificationSettings>(pushService.getSettings())
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    botToken: "",
    chatId: "",
    enabled: false,
    notifications: {
      tradeExecutions: true,
      opportunities: true,
      botStatus: true,
      profitMilestones: true,
      errors: true,
      systemHealth: false,
    },
    rateLimiting: {
      maxMessagesPerMinute: 20,
      lastMessageTime: 0,
      messageCount: 0,
    },
  })

  const [subscriptionStatus, setSubscriptionStatus] = useState(pushService.getSubscriptionStatus())
  const [isTestingNotifications, setIsTestingNotifications] = useState(false)
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    // Load saved Telegram config
    const savedTelegramConfig = localStorage.getItem("telegramConfig")
    if (savedTelegramConfig) {
      try {
        const config = JSON.parse(savedTelegramConfig)
        setTelegramConfig(config)
        if (config.botToken && config.chatId && config.enabled) {
          const service = new TelegramNotificationService(config)
          setTelegramService(service)
        }
      } catch (error) {
        console.error("Error loading Telegram config:", error)
      }
    }

    // Update subscription status periodically
    const interval = setInterval(() => {
      setSubscriptionStatus(pushService.getSubscriptionStatus())
    }, 5000)

    return () => clearInterval(interval)
  }, [pushService])

  const updateSettings = (updates: Partial<NotificationSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    pushService.updateSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  const updateTelegramConfig = (updates: Partial<TelegramConfig>) => {
    const newConfig = { ...telegramConfig, ...updates }
    setTelegramConfig(newConfig)
    localStorage.setItem("telegramConfig", JSON.stringify(newConfig))

    if (newConfig.botToken && newConfig.chatId && newConfig.enabled) {
      const service = new TelegramNotificationService(newConfig)
      setTelegramService(service)
    } else {
      setTelegramService(null)
    }
  }

  const handleSubscribePush = async () => {
    const success = await pushService.subscribe()
    if (success) {
      setSubscriptionStatus(pushService.getSubscriptionStatus())
      updateSettings({ enabled: true })
    }
  }

  const handleUnsubscribePush = async () => {
    const success = await pushService.unsubscribe()
    if (success) {
      setSubscriptionStatus(pushService.getSubscriptionStatus())
      updateSettings({ enabled: false })
    }
  }

  const testNotification = async (type: string) => {
    setIsTestingNotifications(true)
    try {
      switch (type) {
        case "push":
          await pushService.testNotification()
          setTestResults((prev) => ({ ...prev, push: true }))
          break
        case "telegram":
          if (telegramService) {
            await telegramService.testConnection()
            setTestResults((prev) => ({ ...prev, telegram: true }))
          }
          break
        case "trade":
          await pushService.notifyTradeExecution({
            success: true,
            profit: 125.5,
            pair: "WETH/USDC",
            txHash: "0x1234567890abcdef",
          })
          setTestResults((prev) => ({ ...prev, trade: true }))
          break
        case "opportunity":
          await pushService.notifyOpportunity({
            pair: "WBTC/USDC",
            profit: 89.25,
            spread: 1.2,
            dexes: ["Uniswap V3", "SushiSwap"],
            confidence: 85,
          })
          setTestResults((prev) => ({ ...prev, opportunity: true }))
          break
        case "price":
          await pushService.notifyPriceAlert({
            symbol: "ETH",
            currentPrice: 2650,
            changePercent: 5.2,
            direction: "up",
          })
          setTestResults((prev) => ({ ...prev, price: true }))
          break
        case "system":
          await pushService.notifySystemAlert({
            type: "warning",
            title: "Test System Alert",
            message: "This is a test system alert notification",
            severity: "medium",
          })
          setTestResults((prev) => ({ ...prev, system: true }))
          break
      }
    } catch (error) {
      console.error(`Test notification failed for ${type}:`, error)
      setTestResults((prev) => ({ ...prev, [type]: false }))
    } finally {
      setIsTestingNotifications(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how and when you receive notifications about trading activities, opportunities, and system events
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="push" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="push">Push Notifications</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        {/* Push Notifications Tab */}
        <TabsContent value="push" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Browser Push Notifications
              </CardTitle>
              <CardDescription>
                Receive real-time notifications directly in your browser, even when the app is closed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subscription Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {subscriptionStatus.subscribed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">{subscriptionStatus.subscribed ? "Subscribed" : "Not Subscribed"}</p>
                    <p className="text-sm text-muted-foreground">
                      {subscriptionStatus.supported
                        ? subscriptionStatus.subscribed
                          ? "You'll receive push notifications"
                          : "Click subscribe to enable notifications"
                        : "Push notifications not supported in this browser"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={subscriptionStatus.permission === "granted" ? "default" : "destructive"}>
                    {subscriptionStatus.permission}
                  </Badge>
                  {subscriptionStatus.supported && (
                    <>
                      {!subscriptionStatus.subscribed ? (
                        <Button onClick={handleSubscribePush}>Subscribe</Button>
                      ) : (
                        <Button onClick={handleUnsubscribePush} variant="outline">
                          Unsubscribe
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {!subscriptionStatus.supported && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Push notifications are not supported in this browser. Consider using Chrome, Firefox, or Edge for
                    the best experience.
                  </AlertDescription>
                </Alert>
              )}

              {/* Notification Types */}
              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <div>
                        <Label className="font-medium">Trade Executions</Label>
                        <p className="text-xs text-muted-foreground">Successful and failed trades</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.tradeExecutions}
                      onCheckedChange={(checked) => updateSettings({ tradeExecutions: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <div>
                        <Label className="font-medium">Opportunities</Label>
                        <p className="text-xs text-muted-foreground">New arbitrage opportunities</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.opportunities}
                      onCheckedChange={(checked) => updateSettings({ opportunities: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <div>
                        <Label className="font-medium">Price Alerts</Label>
                        <p className="text-xs text-muted-foreground">Significant price movements</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.priceAlerts}
                      onCheckedChange={(checked) => updateSettings({ priceAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-red-500" />
                      <div>
                        <Label className="font-medium">System Alerts</Label>
                        <p className="text-xs text-muted-foreground">Errors and warnings</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.systemAlerts}
                      onCheckedChange={(checked) => updateSettings({ systemAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-yellow-500" />
                      <div>
                        <Label className="font-medium">Profit Milestones</Label>
                        <p className="text-xs text-muted-foreground">Achievement notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.profitMilestones}
                      onCheckedChange={(checked) => updateSettings({ profitMilestones: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-orange-500" />
                      <div>
                        <Label className="font-medium">Gas Alerts</Label>
                        <p className="text-xs text-muted-foreground">High gas price warnings</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.gasAlerts}
                      onCheckedChange={(checked) => updateSettings({ gasAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-red-600" />
                      <div>
                        <Label className="font-medium">MEV Alerts</Label>
                        <p className="text-xs text-muted-foreground">MEV activity detection</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.mevAlerts}
                      onCheckedChange={(checked) => updateSettings({ mevAlerts: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Tab */}
        <TabsContent value="telegram" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Telegram Notifications
              </CardTitle>
              <CardDescription>Receive notifications via Telegram bot for important events and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Telegram Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Enable Telegram Notifications</Label>
                  <Switch
                    checked={telegramConfig.enabled}
                    onCheckedChange={(checked) => updateTelegramConfig({ enabled: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="botToken">Bot Token</Label>
                    <Input
                      id="botToken"
                      type="password"
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={telegramConfig.botToken}
                      onChange={(e) => updateTelegramConfig({ botToken: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Get your bot token from @BotFather on Telegram</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chatId">Chat ID</Label>
                    <Input
                      id="chatId"
                      placeholder="-1001234567890"
                      value={telegramConfig.chatId}
                      onChange={(e) => updateTelegramConfig({ chatId: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Your personal chat ID or group chat ID</p>
                  </div>
                </div>

                {telegramConfig.enabled && (!telegramConfig.botToken || !telegramConfig.chatId) && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      To set up Telegram notifications:
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Message @BotFather on Telegram and create a new bot</li>
                        <li>Copy the bot token and paste it above</li>
                        <li>Message @userinfobot to get your chat ID</li>
                        <li>Paste your chat ID above</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Telegram Notification Types */}
                {telegramConfig.enabled && telegramConfig.botToken && telegramConfig.chatId && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Telegram Notification Types</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Trade Executions</Label>
                          <p className="text-xs text-muted-foreground">Trade results and profits</p>
                        </div>
                        <Switch
                          checked={telegramConfig.notifications.tradeExecutions}
                          onCheckedChange={(checked) =>
                            updateTelegramConfig({
                              notifications: { ...telegramConfig.notifications, tradeExecutions: checked },
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Opportunities</Label>
                          <p className="text-xs text-muted-foreground">New arbitrage opportunities</p>
                        </div>
                        <Switch
                          checked={telegramConfig.notifications.opportunities}
                          onCheckedChange={(checked) =>
                            updateTelegramConfig({
                              notifications: { ...telegramConfig.notifications, opportunities: checked },
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Bot Status</Label>
                          <p className="text-xs text-muted-foreground">Start/stop notifications</p>
                        </div>
                        <Switch
                          checked={telegramConfig.notifications.botStatus}
                          onCheckedChange={(checked) =>
                            updateTelegramConfig({
                              notifications: { ...telegramConfig.notifications, botStatus: checked },
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Profit Milestones</Label>
                          <p className="text-xs text-muted-foreground">Achievement celebrations</p>
                        </div>
                        <Switch
                          checked={telegramConfig.notifications.profitMilestones}
                          onCheckedChange={(checked) =>
                            updateTelegramConfig({
                              notifications: { ...telegramConfig.notifications, profitMilestones: checked },
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Errors</Label>
                          <p className="text-xs text-muted-foreground">Critical errors and failures</p>
                        </div>
                        <Switch
                          checked={telegramConfig.notifications.errors}
                          onCheckedChange={(checked) =>
                            updateTelegramConfig({
                              notifications: { ...telegramConfig.notifications, errors: checked },
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">System Health</Label>
                          <p className="text-xs text-muted-foreground">Performance metrics</p>
                        </div>
                        <Switch
                          checked={telegramConfig.notifications.systemHealth}
                          onCheckedChange={(checked) =>
                            updateTelegramConfig({
                              notifications: { ...telegramConfig.notifications, systemHealth: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Rate Limiting */}
                {telegramConfig.enabled && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Rate Limiting</h4>
                    <div className="space-y-2">
                      <Label>Maximum Messages Per Minute</Label>
                      <div className="flex items-center space-x-4">
                        <Slider
                          value={[telegramConfig.rateLimiting.maxMessagesPerMinute]}
                          onValueChange={([value]) =>
                            updateTelegramConfig({
                              rateLimiting: { ...telegramConfig.rateLimiting, maxMessagesPerMinute: value },
                            })
                          }
                          max={60}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-12">
                          {telegramConfig.rateLimiting.maxMessagesPerMinute}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Limit the number of messages sent per minute to avoid spam
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Customize how notifications are delivered and when you receive them</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sound and Vibration */}
              <div className="space-y-4">
                <h4 className="font-medium">Sound & Vibration</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {settings.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      <div>
                        <Label className="font-medium">Sound</Label>
                        <p className="text-xs text-muted-foreground">Play notification sounds</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.sound}
                      onCheckedChange={(checked) => updateSettings({ sound: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4" />
                      <div>
                        <Label className="font-medium">Vibration</Label>
                        <p className="text-xs text-muted-foreground">Vibrate on mobile devices</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.vibration}
                      onCheckedChange={(checked) => updateSettings({ vibration: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quiet Hours */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <h4 className="font-medium">Quiet Hours</h4>
                  </div>
                  <Switch
                    checked={settings.quietHours.enabled}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        quietHours: { ...settings.quietHours, enabled: checked },
                      })
                    }
                  />
                </div>

                {settings.quietHours.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quietStart">Start Time</Label>
                      <Input
                        id="quietStart"
                        type="time"
                        value={settings.quietHours.start}
                        onChange={(e) =>
                          updateSettings({
                            quietHours: { ...settings.quietHours, start: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quietEnd">End Time</Label>
                      <Input
                        id="quietEnd"
                        type="time"
                        value={settings.quietHours.end}
                        onChange={(e) =>
                          updateSettings({
                            quietHours: { ...settings.quietHours, end: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {settings.quietHours.enabled && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Notifications will be silenced from {formatTime(settings.quietHours.start)} to{" "}
                      {formatTime(settings.quietHours.end)} and delivered when quiet hours end.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                Test Notifications
              </CardTitle>
              <CardDescription>
                Test different types of notifications to ensure they're working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => testNotification("push")}
                  disabled={isTestingNotifications || !subscriptionStatus.subscribed}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Test Push Notification
                  {testResults.push === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {testResults.push === false && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </Button>

                <Button
                  onClick={() => testNotification("telegram")}
                  disabled={isTestingNotifications || !telegramService}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Test Telegram
                  {testResults.telegram === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {testResults.telegram === false && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </Button>

                <Button
                  onClick={() => testNotification("trade")}
                  disabled={isTestingNotifications}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Test Trade Notification
                  {testResults.trade === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {testResults.trade === false && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </Button>

                <Button
                  onClick={() => testNotification("opportunity")}
                  disabled={isTestingNotifications}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Test Opportunity
                  {testResults.opportunity === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {testResults.opportunity === false && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </Button>

                <Button
                  onClick={() => testNotification("price")}
                  disabled={isTestingNotifications}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Test Price Alert
                  {testResults.price === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {testResults.price === false && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </Button>

                <Button
                  onClick={() => testNotification("system")}
                  disabled={isTestingNotifications}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Test System Alert
                  {testResults.system === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {testResults.system === false && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </Button>
              </div>

              {Object.keys(testResults).length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Test results are shown with green checkmarks for success and red triangles for failures. If tests
                    fail, check your notification settings and permissions.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default NotificationSettingsPanel
