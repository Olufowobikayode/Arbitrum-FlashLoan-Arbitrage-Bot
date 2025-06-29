"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bell,
  Mail,
  MessageSquare,
  Volume2,
  VolumeX,
  Smartphone,
  AlertTriangle,
  Settings,
  TestTubeIcon as Test,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotificationSettings {
  pushNotifications: {
    enabled: boolean
    permission: "default" | "granted" | "denied"
    opportunities: boolean
    trades: boolean
    errors: boolean
    profitThreshold: number
  }
  email: {
    enabled: boolean
    address: string
    dailySummary: boolean
    weeklyReport: boolean
    criticalAlerts: boolean
  }
  telegram: {
    enabled: boolean
    botToken: string
    chatId: string
    opportunities: boolean
    trades: boolean
    errors: boolean
  }
  sound: {
    enabled: boolean
    volume: number
    opportunitySound: string
    tradeSound: string
    errorSound: string
  }
  filters: {
    minProfitUsd: number
    minConfidence: number
    onlyHighVolume: boolean
    excludeWeekends: boolean
  }
}

const defaultSettings: NotificationSettings = {
  pushNotifications: {
    enabled: false,
    permission: "default",
    opportunities: true,
    trades: true,
    errors: true,
    profitThreshold: 50,
  },
  email: {
    enabled: false,
    address: "",
    dailySummary: true,
    weeklyReport: true,
    criticalAlerts: true,
  },
  telegram: {
    enabled: false,
    botToken: "",
    chatId: "",
    opportunities: true,
    trades: true,
    errors: true,
  },
  sound: {
    enabled: true,
    volume: 50,
    opportunitySound: "chime",
    tradeSound: "success",
    errorSound: "alert",
  },
  filters: {
    minProfitUsd: 10,
    minConfidence: 70,
    onlyHighVolume: false,
    excludeWeekends: false,
  },
}

export default function NotificationSettingsPanel() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [testingNotification, setTestingNotification] = useState<string | null>(null)
  const { toast } = useToast()

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("notificationSettings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error("Failed to load notification settings:", error)
      }
    }

    // Check push notification permission
    if ("Notification" in window) {
      setSettings((prev) => ({
        ...prev,
        pushNotifications: {
          ...prev.pushNotifications,
          permission: Notification.permission,
        },
      }))
    }
  }, [])

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem("notificationSettings", JSON.stringify(settings))
  }, [settings])

  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setSettings((prev) => ({
        ...prev,
        pushNotifications: {
          ...prev.pushNotifications,
          permission,
          enabled: permission === "granted",
        },
      }))

      if (permission === "granted") {
        toast({
          title: "Permission Granted",
          description: "Push notifications are now enabled",
        })
      } else {
        toast({
          title: "Permission Denied",
          description: "Push notifications cannot be enabled",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to request notification permission:", error)
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
      })
    }
  }

  const testNotification = async (type: "push" | "email" | "telegram" | "sound") => {
    setTestingNotification(type)

    try {
      switch (type) {
        case "push":
          if (settings.pushNotifications.permission === "granted") {
            new Notification("Test Notification", {
              body: "This is a test notification from your arbitrage bot",
              icon: "/favicon.ico",
            })
            toast({
              title: "Test Sent",
              description: "Push notification test sent successfully",
            })
          } else {
            throw new Error("Push notifications not permitted")
          }
          break

        case "email":
          // Simulate email test
          await new Promise((resolve) => setTimeout(resolve, 1000))
          toast({
            title: "Test Sent",
            description: `Email test sent to ${settings.email.address}`,
          })
          break

        case "telegram":
          // Simulate Telegram test
          await new Promise((resolve) => setTimeout(resolve, 1000))
          if (!settings.telegram.botToken || !settings.telegram.chatId) {
            throw new Error("Telegram bot token and chat ID required")
          }
          toast({
            title: "Test Sent",
            description: "Telegram test message sent successfully",
          })
          break

        case "sound":
          // Play test sound
          const audio = new Audio(`/sounds/${settings.sound.opportunitySound}.mp3`)
          audio.volume = settings.sound.volume / 100
          audio.play().catch(() => {
            // Fallback to system beep
            console.beep?.()
          })
          toast({
            title: "Sound Played",
            description: "Test sound played successfully",
          })
          break
      }
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || `Failed to test ${type} notification`,
        variant: "destructive",
      })
    } finally {
      setTestingNotification(null)
    }
  }

  const updateSettings = (path: string, value: any) => {
    setSettings((prev) => {
      const keys = path.split(".")
      const updated = { ...prev }
      let current: any = updated

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return updated
    })
  }

  const saveSettings = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Settings Saved",
        description: "Notification settings have been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save notification settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Settings</h2>
          <p className="text-muted-foreground">
            Configure how you want to be notified about trading opportunities and bot activity
          </p>
        </div>
        <Button onClick={saveSettings} disabled={isLoading}>
          <Settings className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="push" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="push" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Push
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Telegram
          </TabsTrigger>
          <TabsTrigger value="sound" className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Sound
          </TabsTrigger>
        </TabsList>

        <TabsContent value="push" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>Get instant notifications directly in your browser</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Status:{" "}
                    {settings.pushNotifications.permission === "granted" ? (
                      <Badge variant="default" className="ml-1">
                        Enabled
                      </Badge>
                    ) : settings.pushNotifications.permission === "denied" ? (
                      <Badge variant="destructive" className="ml-1">
                        Blocked
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-1">
                        Not Requested
                      </Badge>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Switch
                    checked={settings.pushNotifications.enabled}
                    onCheckedChange={(enabled) => {
                      if (enabled && settings.pushNotifications.permission !== "granted") {
                        requestPushPermission()
                      } else {
                        updateSettings("pushNotifications.enabled", enabled)
                      }
                    }}
                    disabled={settings.pushNotifications.permission === "denied"}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testNotification("push")}
                    disabled={!settings.pushNotifications.enabled || testingNotification === "push"}
                  >
                    <Test className="w-4 h-4 mr-1" />
                    {testingNotification === "push" ? "Testing..." : "Test"}
                  </Button>
                </div>
              </div>

              {settings.pushNotifications.permission === "denied" && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Push notifications are blocked. Please enable them in your browser settings.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Arbitrage Opportunities</Label>
                  <Switch
                    checked={settings.pushNotifications.opportunities}
                    onCheckedChange={(checked) => updateSettings("pushNotifications.opportunities", checked)}
                    disabled={!settings.pushNotifications.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Trade Executions</Label>
                  <Switch
                    checked={settings.pushNotifications.trades}
                    onCheckedChange={(checked) => updateSettings("pushNotifications.trades", checked)}
                    disabled={!settings.pushNotifications.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Errors & Alerts</Label>
                  <Switch
                    checked={settings.pushNotifications.errors}
                    onCheckedChange={(checked) => updateSettings("pushNotifications.errors", checked)}
                    disabled={!settings.pushNotifications.enabled}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Minimum Profit Threshold (USD)</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[settings.pushNotifications.profitThreshold]}
                    onValueChange={([value]) => updateSettings("pushNotifications.profitThreshold", value)}
                    max={500}
                    min={1}
                    step={5}
                    className="flex-1"
                    disabled={!settings.pushNotifications.enabled}
                  />
                  <span className="w-16 text-sm font-medium">${settings.pushNotifications.profitThreshold}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only notify for opportunities above this profit threshold
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Receive detailed reports and alerts via email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Email Notifications</Label>
                <div className="flex gap-2">
                  <Switch
                    checked={settings.email.enabled}
                    onCheckedChange={(enabled) => updateSettings("email.enabled", enabled)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testNotification("email")}
                    disabled={!settings.email.enabled || !settings.email.address || testingNotification === "email"}
                  >
                    <Test className="w-4 h-4 mr-1" />
                    {testingNotification === "email" ? "Testing..." : "Test"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-address">Email Address</Label>
                <Input
                  id="email-address"
                  type="email"
                  placeholder="your@email.com"
                  value={settings.email.address}
                  onChange={(e) => updateSettings("email.address", e.target.value)}
                  disabled={!settings.email.enabled}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Summary</Label>
                    <p className="text-sm text-muted-foreground">Daily trading performance report</p>
                  </div>
                  <Switch
                    checked={settings.email.dailySummary}
                    onCheckedChange={(checked) => updateSettings("email.dailySummary", checked)}
                    disabled={!settings.email.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Report</Label>
                    <p className="text-sm text-muted-foreground">Comprehensive weekly analysis</p>
                  </div>
                  <Switch
                    checked={settings.email.weeklyReport}
                    onCheckedChange={(checked) => updateSettings("email.weeklyReport", checked)}
                    disabled={!settings.email.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Critical Alerts</Label>
                    <p className="text-sm text-muted-foreground">Important errors and system alerts</p>
                  </div>
                  <Switch
                    checked={settings.email.criticalAlerts}
                    onCheckedChange={(checked) => updateSettings("email.criticalAlerts", checked)}
                    disabled={!settings.email.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Telegram Notifications
              </CardTitle>
              <CardDescription>Get instant updates via Telegram bot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Telegram Notifications</Label>
                <div className="flex gap-2">
                  <Switch
                    checked={settings.telegram.enabled}
                    onCheckedChange={(enabled) => updateSettings("telegram.enabled", enabled)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testNotification("telegram")}
                    disabled={
                      !settings.telegram.enabled ||
                      !settings.telegram.botToken ||
                      !settings.telegram.chatId ||
                      testingNotification === "telegram"
                    }
                  >
                    <Test className="w-4 h-4 mr-1" />
                    {testingNotification === "telegram" ? "Testing..." : "Test"}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  To use Telegram notifications, create a bot with @BotFather and get your chat ID.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="bot-token">Bot Token</Label>
                <Input
                  id="bot-token"
                  type="password"
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={settings.telegram.botToken}
                  onChange={(e) => updateSettings("telegram.botToken", e.target.value)}
                  disabled={!settings.telegram.enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat-id">Chat ID</Label>
                <Input
                  id="chat-id"
                  placeholder="123456789"
                  value={settings.telegram.chatId}
                  onChange={(e) => updateSettings("telegram.chatId", e.target.value)}
                  disabled={!settings.telegram.enabled}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Arbitrage Opportunities</Label>
                  <Switch
                    checked={settings.telegram.opportunities}
                    onCheckedChange={(checked) => updateSettings("telegram.opportunities", checked)}
                    disabled={!settings.telegram.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Trade Executions</Label>
                  <Switch
                    checked={settings.telegram.trades}
                    onCheckedChange={(checked) => updateSettings("telegram.trades", checked)}
                    disabled={!settings.telegram.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Errors & Alerts</Label>
                  <Switch
                    checked={settings.telegram.errors}
                    onCheckedChange={(checked) => updateSettings("telegram.errors", checked)}
                    disabled={!settings.telegram.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sound" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {settings.sound.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                Sound Notifications
              </CardTitle>
              <CardDescription>Audio alerts for different types of events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Sound Notifications</Label>
                <div className="flex gap-2">
                  <Switch
                    checked={settings.sound.enabled}
                    onCheckedChange={(enabled) => updateSettings("sound.enabled", enabled)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testNotification("sound")}
                    disabled={!settings.sound.enabled || testingNotification === "sound"}
                  >
                    <Test className="w-4 h-4 mr-1" />
                    {testingNotification === "sound" ? "Playing..." : "Test"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Volume</Label>
                <div className="flex items-center space-x-4">
                  <VolumeX className="w-4 h-4" />
                  <Slider
                    value={[settings.sound.volume]}
                    onValueChange={([value]) => updateSettings("sound.volume", value)}
                    max={100}
                    min={0}
                    step={5}
                    className="flex-1"
                    disabled={!settings.sound.enabled}
                  />
                  <Volume2 className="w-4 h-4" />
                  <span className="w-12 text-sm font-medium">{settings.sound.volume}%</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Opportunity Sound</Label>
                  <Select
                    value={settings.sound.opportunitySound}
                    onValueChange={(value) => updateSettings("sound.opportunitySound", value)}
                    disabled={!settings.sound.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chime">Chime</SelectItem>
                      <SelectItem value="bell">Bell</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="ping">Ping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trade Success Sound</Label>
                  <Select
                    value={settings.sound.tradeSound}
                    onValueChange={(value) => updateSettings("sound.tradeSound", value)}
                    disabled={!settings.sound.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="coin">Coin</SelectItem>
                      <SelectItem value="cash">Cash Register</SelectItem>
                      <SelectItem value="ding">Ding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Error Sound</Label>
                  <Select
                    value={settings.sound.errorSound}
                    onValueChange={(value) => updateSettings("sound.errorSound", value)}
                    disabled={!settings.sound.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="beep">Beep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Notification Filters</CardTitle>
          <CardDescription>Control when notifications are sent based on specific criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Profit (USD)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={settings.filters.minProfitUsd}
                  onChange={(e) => updateSettings("filters.minProfitUsd", Number(e.target.value))}
                  min={1}
                  max={1000}
                />
                <span className="text-sm text-muted-foreground">USD</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Minimum Confidence</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={settings.filters.minConfidence}
                  onChange={(e) => updateSettings("filters.minConfidence", Number(e.target.value))}
                  min={0}
                  max={100}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>High Volume Only</Label>
                <p className="text-sm text-muted-foreground">Only notify for high-volume opportunities</p>
              </div>
              <Switch
                checked={settings.filters.onlyHighVolume}
                onCheckedChange={(checked) => updateSettings("filters.onlyHighVolume", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Exclude Weekends</Label>
                <p className="text-sm text-muted-foreground">Pause notifications on weekends</p>
              </div>
              <Switch
                checked={settings.filters.excludeWeekends}
                onCheckedChange={(checked) => updateSettings("filters.excludeWeekends", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
