"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, MessageSquare, Smartphone, Settings, TestTube, CheckCircle, AlertTriangle, Save } from "lucide-react"

interface NotificationSettings {
  email: {
    enabled: boolean
    address: string
    tradeAlerts: boolean
    profitAlerts: boolean
    errorAlerts: boolean
    dailyReports: boolean
  }
  telegram: {
    enabled: boolean
    botToken: string
    chatId: string
    tradeAlerts: boolean
    profitAlerts: boolean
    errorAlerts: boolean
  }
  push: {
    enabled: boolean
    tradeAlerts: boolean
    profitAlerts: boolean
    errorAlerts: boolean
  }
  thresholds: {
    minProfitAlert: number
    maxLossAlert: number
    gasThreshold: number
  }
}

const defaultSettings: NotificationSettings = {
  email: {
    enabled: false,
    address: "",
    tradeAlerts: true,
    profitAlerts: true,
    errorAlerts: true,
    dailyReports: false,
  },
  telegram: {
    enabled: false,
    botToken: "",
    chatId: "",
    tradeAlerts: true,
    profitAlerts: true,
    errorAlerts: true,
  },
  push: {
    enabled: true,
    tradeAlerts: true,
    profitAlerts: true,
    errorAlerts: true,
  },
  thresholds: {
    minProfitAlert: 50,
    maxLossAlert: 100,
    gasThreshold: 50,
  },
}

export default function NotificationSettingsPanel() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [testResults, setTestResults] = useState<{
    email?: "success" | "error"
    telegram?: "success" | "error"
    push?: "success" | "error"
  }>({})

  useEffect(() => {
    // Load settings from localStorage
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("notificationSettings")
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch (error) {
          console.error("Failed to load notification settings:", error)
        }
      }
    }
  }, [])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("notificationSettings", JSON.stringify(settings))
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      // Show success message
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestNotification = async (type: "email" | "telegram" | "push") => {
    try {
      // Simulate testing notification
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock success/failure
      const success = Math.random() > 0.3
      setTestResults((prev) => ({ ...prev, [type]: success ? "success" : "error" }))

      // Clear result after 5 seconds
      setTimeout(() => {
        setTestResults((prev) => ({ ...prev, [type]: undefined }))
      }, 5000)
    } catch (error) {
      setTestResults((prev) => ({ ...prev, [type]: "error" }))
    }
  }

  const updateSettings = (path: string, value: any) => {
    setSettings((prev) => {
      const keys = path.split(".")
      const newSettings = { ...prev }
      let current: any = newSettings

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">Configure alerts and notifications for your trading bot</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <Settings className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="alerts">Alert Types</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
        </TabsList>

        {/* Notification Channels */}
        <TabsContent value="channels" className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Receive trading alerts and reports via email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">Get notified about trades and important events</div>
                </div>
                <Switch
                  checked={settings.email.enabled}
                  onCheckedChange={(checked) => updateSettings("email.enabled", checked)}
                />
              </div>

              {settings.email.enabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="email-address">Email Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email-address"
                        type="email"
                        value={settings.email.address}
                        onChange={(e) => updateSettings("email.address", e.target.value)}
                        placeholder="your@email.com"
                      />
                      <Button
                        variant="outline"
                        onClick={() => handleTestNotification("email")}
                        disabled={!settings.email.address}
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                    </div>
                    {testResults.email && (
                      <div
                        className={`flex items-center gap-2 text-sm ${
                          testResults.email === "success" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {testResults.email === "success" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {testResults.email === "success" ? "Test email sent successfully" : "Failed to send test email"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Email Alert Types</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-trades">Trade Execution Alerts</Label>
                        <Switch
                          id="email-trades"
                          checked={settings.email.tradeAlerts}
                          onCheckedChange={(checked) => updateSettings("email.tradeAlerts", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-profits">Profit Alerts</Label>
                        <Switch
                          id="email-profits"
                          checked={settings.email.profitAlerts}
                          onCheckedChange={(checked) => updateSettings("email.profitAlerts", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-errors">Error Alerts</Label>
                        <Switch
                          id="email-errors"
                          checked={settings.email.errorAlerts}
                          onCheckedChange={(checked) => updateSettings("email.errorAlerts", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-reports">Daily Reports</Label>
                        <Switch
                          id="email-reports"
                          checked={settings.email.dailyReports}
                          onCheckedChange={(checked) => updateSettings("email.dailyReports", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Telegram Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Telegram Notifications
              </CardTitle>
              <CardDescription>Get instant notifications via Telegram bot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Telegram Notifications</Label>
                  <div className="text-sm text-muted-foreground">Receive real-time alerts on your phone</div>
                </div>
                <Switch
                  checked={settings.telegram.enabled}
                  onCheckedChange={(checked) => updateSettings("telegram.enabled", checked)}
                />
              </div>

              {settings.telegram.enabled && (
                <div className="space-y-4 pt-4 border-t">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      To set up Telegram notifications, create a bot with @BotFather and get your chat ID.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telegram-token">Bot Token</Label>
                      <Input
                        id="telegram-token"
                        type="password"
                        value={settings.telegram.botToken}
                        onChange={(e) => updateSettings("telegram.botToken", e.target.value)}
                        placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telegram-chat">Chat ID</Label>
                      <div className="flex gap-2">
                        <Input
                          id="telegram-chat"
                          value={settings.telegram.chatId}
                          onChange={(e) => updateSettings("telegram.chatId", e.target.value)}
                          placeholder="123456789"
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleTestNotification("telegram")}
                          disabled={!settings.telegram.botToken || !settings.telegram.chatId}
                        >
                          <TestTube className="w-4 h-4 mr-2" />
                          Test
                        </Button>
                      </div>
                      {testResults.telegram && (
                        <div
                          className={`flex items-center gap-2 text-sm ${
                            testResults.telegram === "success" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {testResults.telegram === "success" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                          {testResults.telegram === "success"
                            ? "Test message sent successfully"
                            : "Failed to send test message"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Telegram Alert Types</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="telegram-trades">Trade Execution Alerts</Label>
                        <Switch
                          id="telegram-trades"
                          checked={settings.telegram.tradeAlerts}
                          onCheckedChange={(checked) => updateSettings("telegram.tradeAlerts", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="telegram-profits">Profit Alerts</Label>
                        <Switch
                          id="telegram-profits"
                          checked={settings.telegram.profitAlerts}
                          onCheckedChange={(checked) => updateSettings("telegram.profitAlerts", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="telegram-errors">Error Alerts</Label>
                        <Switch
                          id="telegram-errors"
                          checked={settings.telegram.errorAlerts}
                          onCheckedChange={(checked) => updateSettings("telegram.errorAlerts", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Browser Push Notifications
              </CardTitle>
              <CardDescription>Get notifications directly in your browser</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Push Notifications</Label>
                  <div className="text-sm text-muted-foreground">Receive instant alerts in your browser</div>
                </div>
                <Switch
                  checked={settings.push.enabled}
                  onCheckedChange={(checked) => updateSettings("push.enabled", checked)}
                />
              </div>

              {settings.push.enabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => handleTestNotification("push")}>
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Push Notification
                    </Button>
                  </div>

                  {testResults.push && (
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        testResults.push === "success" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {testResults.push === "success" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      {testResults.push === "success"
                        ? "Test notification sent successfully"
                        : "Failed to send test notification"}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>Push Alert Types</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push-trades">Trade Execution Alerts</Label>
                        <Switch
                          id="push-trades"
                          checked={settings.push.tradeAlerts}
                          onCheckedChange={(checked) => updateSettings("push.tradeAlerts", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push-profits">Profit Alerts</Label>
                        <Switch
                          id="push-profits"
                          checked={settings.push.profitAlerts}
                          onCheckedChange={(checked) => updateSettings("push.profitAlerts", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push-errors">Error Alerts</Label>
                        <Switch
                          id="push-errors"
                          checked={settings.push.errorAlerts}
                          onCheckedChange={(checked) => updateSettings("push.errorAlerts", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Types */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>Configure when and how you receive different types of alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Trade Execution</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Successful Trades</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Failed Trades</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Large Trades</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Profit & Loss</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Profit Targets Hit</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Loss Limits Hit</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Daily P&L Summary</Label>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">System Events</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Bot Started/Stopped</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Connection Issues</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Low Balance Warnings</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thresholds */}
        <TabsContent value="thresholds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>Set minimum values that trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-profit">Minimum Profit Alert (USD)</Label>
                    <Input
                      id="min-profit"
                      type="number"
                      value={settings.thresholds.minProfitAlert}
                      onChange={(e) => updateSettings("thresholds.minProfitAlert", Number(e.target.value))}
                      placeholder="50"
                    />
                    <div className="text-sm text-muted-foreground">
                      Only send profit alerts for trades above this amount
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-loss">Maximum Loss Alert (USD)</Label>
                    <Input
                      id="max-loss"
                      type="number"
                      value={settings.thresholds.maxLossAlert}
                      onChange={(e) => updateSettings("thresholds.maxLossAlert", Number(e.target.value))}
                      placeholder="100"
                    />
                    <div className="text-sm text-muted-foreground">Send alerts when losses exceed this amount</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gas-threshold">Gas Price Alert (Gwei)</Label>
                    <Input
                      id="gas-threshold"
                      type="number"
                      value={settings.thresholds.gasThreshold}
                      onChange={(e) => updateSettings("thresholds.gasThreshold", Number(e.target.value))}
                      placeholder="50"
                    />
                    <div className="text-sm text-muted-foreground">Alert when gas prices exceed this threshold</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="balance-threshold">Low Balance Alert (%)</Label>
                    <Input id="balance-threshold" type="number" defaultValue={20} placeholder="20" />
                    <div className="text-sm text-muted-foreground">Alert when balance falls below this percentage</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
