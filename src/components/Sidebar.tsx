"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Settings, Wallet, Bell, Activity, Zap, Target, Home } from "lucide-react"
import { useBot } from "@/src/contexts/BotContext"

interface SidebarProps {
  currentView: string
  onViewChange: (view: string) => void
  collapsed: boolean
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    badge: null,
  },
  {
    id: "trading",
    label: "Trading Panel",
    icon: Bot,
    badge: "active",
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: Activity,
    badge: null,
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: Wallet,
    badge: null,
  },
  {
    id: "strategies",
    label: "Strategies",
    icon: Target,
    badge: null,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    badge: null,
  },
  {
    id: "config",
    label: "Configuration",
    icon: Settings,
    badge: null,
  },
]

export default function Sidebar({ currentView, onViewChange, collapsed }: SidebarProps) {
  const { botState, opportunities } = useBot()

  return (
    <div
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r border-border transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-sm">ArbitrageBot</h2>
                <p className="text-xs text-muted-foreground">v2.0</p>
              </div>
            )}
          </div>
        </div>

        {/* Bot Status */}
        {!collapsed && (
          <div className="p-4 border-b border-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bot Status</span>
                <Badge variant={botState.running ? "default" : "secondary"}>
                  {botState.running ? "Running" : "Stopped"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                <div>Profit: ${botState.totalProfit.toFixed(2)}</div>
                <div>Opportunities: {opportunities.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-2">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={cn("w-full justify-start gap-2 h-10", collapsed && "justify-center px-2")}
                  onClick={() => onViewChange(item.id)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge === "active" && botState.running && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                      {item.id === "notifications" && opportunities.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {opportunities.length}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              )
            })}
          </div>
        </nav>

        {/* Quick Stats */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted rounded p-2">
                  <div className="text-muted-foreground">Success Rate</div>
                  <div className="font-medium">{botState.successRate.toFixed(1)}%</div>
                </div>
                <div className="bg-muted rounded p-2">
                  <div className="text-muted-foreground">Gas Used</div>
                  <div className="font-medium">{botState.gasUsed.toFixed(3)} ETH</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
