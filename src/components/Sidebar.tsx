"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, TrendingUp, Settings, Wallet, Bell, Activity, Target } from "lucide-react"
import { useBot } from "@/src/contexts/BotContext"

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview and stats",
  },
  {
    id: "trading",
    label: "Trading",
    icon: TrendingUp,
    description: "Execute trades",
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: Activity,
    description: "Real-time data",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: Wallet,
    description: "Track performance",
  },
  {
    id: "config",
    label: "Configuration",
    icon: Settings,
    description: "Bot settings",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Alert settings",
  },
]

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { botState } = useBot()

  return (
    <div className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full flex-col">
        {/* Logo/Brand */}
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">ArbiBot</h1>
              <p className="text-xs text-muted-foreground">Arbitrage Trading</p>
            </div>
          </div>
        </div>

        {/* Bot Status Card */}
        <div className="p-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bot Status</span>
                  <Badge variant={botState.running ? "default" : "secondary"}>
                    {botState.running ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Profit</span>
                    <span className="font-medium text-green-600">${botState.totalProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium">{botState.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Trades</span>
                    <span className="font-medium">{botState.totalTrades}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start gap-3 h-12"
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="w-5 h-5" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </div>
              </Button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground text-center">
            <p>ArbiBot v1.0</p>
            <p>Arbitrage Trading Bot</p>
          </div>
        </div>
      </div>
    </div>
  )
}
