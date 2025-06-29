"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Bot, Settings, Wallet, Target, Bell, Activity } from "lucide-react"
import { useBot } from "@/src/contexts/BotContext"

interface SidebarProps {
  currentView: string
  onViewChange: (view: string) => void
  collapsed: boolean
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "trading", label: "Trading", icon: Bot },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "portfolio", label: "Portfolio", icon: Wallet },
  { id: "strategies", label: "Strategies", icon: Target },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "config", label: "Configuration", icon: Settings },
]

export default function Sidebar({ currentView, onViewChange, collapsed }: SidebarProps) {
  const { botState, opportunities } = useBot()

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 bg-background border-r transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              const showBadge = item.id === "trading" && opportunities.length > 0

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${collapsed ? "px-2" : "px-3"}`}
                  onClick={() => onViewChange(item.id)}
                >
                  <Icon className={`w-5 h-5 ${collapsed ? "" : "mr-3"}`} />
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      {showBadge && (
                        <Badge variant="secondary" className="ml-auto">
                          {opportunities.length}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Bot Status */}
        {!collapsed && (
          <div className="p-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bot Status</span>
                <Badge variant={botState.running ? "default" : "secondary"} className="text-xs">
                  {botState.running ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Profit</span>
                <span className="font-medium text-green-600">${botState.totalProfit.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium">{botState.successRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
