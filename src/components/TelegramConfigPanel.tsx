"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  MessageSquare,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  ExternalLink,
  Info,
  Bell,
  BellOff,
} from "lucide-react"
import { useBot } from "../contexts/BotContext"
import { TelegramNotificationService, type TelegramConfig } from "../services/TelegramNotificationService"

interface TelegramConfigPanelProps {
  onConfigChange: (config: TelegramConfig) => void
}

const TelegramConfigPanel: React.FC<TelegramConfigPanelProps> = ({ onConfigChange }) => {
  const { telegramService } = useBot()

  const [config, setConfig] = useState<TelegramConfig>({
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

  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "testing">("disconnected")
  const [queueStatus, setQueueStatus] = useState({ pending: 0, processing: false, rateLimitRemaining: 20 })

  useEffect(() => {
    // Load saved config
    const savedConfig = localStorage.getItem("telegramConfig")
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
      } catch (error) {
        console.error("Error loading Telegram config:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Update status from service
    if (telegramService) {
      setConnectionStatus(telegramService.getConnectionStatus())
      setQueueStatus(telegramService.getQueueStatus())

      // Update status every 5 seconds
      const interval = setInterval(() => {
        setConnectionStatus(telegramService.getConnectionStatus())
        setQueueStatus(telegramService.getQueueStatus())
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [telegramService])

  const saveConfig = (newConfig: TelegramConfig) => {
    setConfig(newConfig)
    localStorage.setItem("telegramConfig", JSON.stringify(newConfig))
    onConfigChange(newConfig)
  }

  const handleTestConnection = async () => {
    if (!config.botToken || !config.chatId) {
      alert("Please enter both Bot Token and Chat ID")
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus("testing")

    try {
      const testService = new TelegramNotificationService(config)
      const success = await testService.testConnection()

      if (success) {
        setConnectionStatus("connected")
        saveConfig({ ...config, enabled: true })
      } else {
        setConnectionStatus("disconnected")
        alert("Connection test failed. Please check your Bot Token and Chat ID.")
      }
    } catch (error) {
      setConnectionStatus("disconnected")
      alert("Connection test failed: " + error.message)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleClearQueue = () => {
    if (telegramService) {
      telegramService.clearQueue()
      setQueueStatus({ ...queueStatus, pending: 0 })
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        )
      case "testing":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            Testing
          </Badge>
        )
      case "disconnected":
      default:
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Telegram Notifications
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>Configure Telegram bot notifications for real-time trading alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Setup Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup Instructions:</strong>
            <br />
            1. Create a bot by messaging @BotFather on Telegram
            <br />
            2. Get your Chat ID by messaging @userinfobot
            <br />
            3. Enter the details below and test the connection
            <br />
            <a
              href="https://core.telegram.org/bots#creating-a-new-bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-500 hover:underline mt-2"
            >
              📖 Full Setup Guide <ExternalLink className="w-3 h-3" />
            </a>
          </AlertDescription>
        </Alert>

        {/* Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="botToken">Bot Token</Label>
            <Input
              id="botToken"
              type="password"
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={config.botToken}
              onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chatId">Chat ID</Label>
            <Input
              id="chatId"
              placeholder="123456789"
              value={config.chatId}
              onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !config.botToken || !config.chatId}
              className="flex-1"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isTestingConnection ? "Testing..." : "Test Connection"}
            </Button>

            <Button variant="outline" onClick={() => saveConfig(config)} disabled={!config.botToken || !config.chatId}>
              <Settings className="w-4 h-4 mr-2" />
              Save Config
            </Button>
          </div>
        </div>

        <Separator />

        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Notifications</Label>
            <p className="text-sm text-muted-foreground">Turn on/off all Telegram notifications</p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => saveConfig({ ...config, enabled: checked })}
            disabled={connectionStatus !== "connected"}
          />
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Notification Types</Label>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <div>
                  <Label>Trade Executions</Label>
                  <p className="text-xs text-muted-foreground">Success/failure notifications</p>
                </div>
              </div>
              <Switch
                checked={config.notifications.tradeExecutions}
                onCheckedChange={(checked) =>
                  saveConfig({
                    ...config,
                    notifications: { ...config.notifications, tradeExecutions: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <div>
                  <Label>New Opportunities</Label>
                  <p className="text-xs text-muted-foreground">Arbitrage opportunities found</p>
                </div>
              </div>
              <Switch
                checked={config.notifications.opportunities}
                onCheckedChange={(checked) =>
                  saveConfig({
                    ...config,
                    notifications: { ...config.notifications, opportunities: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <div>
                  <Label>Bot Status Changes</Label>
                  <p className="text-xs text-muted-foreground">Start/stop/emergency alerts</p>
                </div>
              </div>
              <Switch
                checked={config.notifications.botStatus}
                onCheckedChange={(checked) =>
                  saveConfig({
                    ...config,
                    notifications: { ...config.notifications, botStatus: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <div>
                  <Label>Profit Milestones</Label>
                  <p className="text-xs text-muted-foreground">Achievement notifications</p>
                </div>
              </div>
              <Switch
                checked={config.notifications.profitMilestones}
                onCheckedChange={(checked) =>
                  saveConfig({
                    ...config,
                    notifications: { ...config.notifications, profitMilestones: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <div>
                  <Label>Error Alerts</Label>
                  <p className="text-xs text-muted-foreground">System errors and warnings</p>
                </div>
              </div>
              <Switch
                checked={config.notifications.errors}
                onCheckedChange={(checked) =>
                  saveConfig({
                    ...config,
                    notifications: { ...config.notifications, errors: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellOff className="w-4 h-4" />
                <div>
                  <Label>System Health</Label>
                  <p className="text-xs text-muted-foreground">Performance metrics (low priority)</p>
                </div>
              </div>
              <Switch
                checked={config.notifications.systemHealth}
                onCheckedChange={(checked) =>
                  saveConfig({
                    ...config,
                    notifications: { ...config.notifications, systemHealth: checked },
                  })
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Rate Limiting */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Rate Limiting</Label>

          <div className="space-y-2">
            <Label>Max Messages Per Minute</Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={config.rateLimiting.maxMessagesPerMinute}
              onChange={(e) =>
                saveConfig({
                  ...config,
                  rateLimiting: {
                    ...config.rateLimiting,
                    maxMessagesPerMinute: Number.parseInt(e.target.value) || 20,
                  },
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Telegram allows up to 30 messages per second, but we recommend 20 per minute for stability
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Rate Limit Usage</span>
              <span>
                {config.rateLimiting.maxMessagesPerMinute - queueStatus.rateLimitRemaining}/
                {config.rateLimiting.maxMessagesPerMinute}
              </span>
            </div>
            <Progress
              value={
                ((config.rateLimiting.maxMessagesPerMinute - queueStatus.rateLimitRemaining) /
                  config.rateLimiting.maxMessagesPerMinute) *
                100
              }
              className="h-2"
            />
          </div>
        </div>

        <Separator />

        {/* Queue Status */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Message Queue Status</Label>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{queueStatus.pending}</div>
              <div className="text-sm text-muted-foreground">Pending Messages</div>
            </div>

            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{queueStatus.rateLimitRemaining}</div>
              <div className="text-sm text-muted-foreground">Rate Limit Remaining</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Queue Processing</Label>
              <p className="text-sm text-muted-foreground">
                {queueStatus.processing ? "Processing messages..." : "Idle"}
              </p>
            </div>
            <Badge variant={queueStatus.processing ? "default" : "secondary"}>
              {queueStatus.processing ? "Active" : "Idle"}
            </Badge>
          </div>

          <Button
            variant="outline"
            onClick={handleClearQueue}
            disabled={queueStatus.pending === 0}
            className="w-full bg-transparent"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Queue ({queueStatus.pending} messages)
          </Button>
        </div>

        {/* Status Summary */}
        {config.enabled && connectionStatus === "connected" && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Telegram notifications are active!</strong>
              <br />
              You'll receive real-time alerts for all enabled notification types.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default TelegramConfigPanel
