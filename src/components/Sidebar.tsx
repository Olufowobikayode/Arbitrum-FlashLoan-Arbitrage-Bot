"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Bot,
  Settings,
  TrendingUp,
  Wallet,
  Activity,
  Bell,
  Layers,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react"

interface SidebarProps {
  onViewChange: (view: string) => void
  currentView: string
}

export default function Sidebar({ onViewChange, currentView }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

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
      icon: TrendingUp,
      badge: null,
    },
    {
      id: "monitoring",
      label: "Monitoring",
      icon: Activity,
      badge: "Live",
    },
    {
      id: "portfolio",
      label: "Portfolio",
      icon: Wallet,
      badge: null,
    },
    {
      id: "strategy-builder",
      label: "Strategy Builder",
      icon: Layers,
      badge: "New",
    },
  ]

  const settingsItems = [
    {
      id: "config",
      label: "Configuration",
      icon: Settings,
      badge: null,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: null,
    },
  ]

  const handleItemClick = (itemId: string) => {
    onViewChange(itemId)
  }

  return (
    <div
      className={`bg-card border-r border-border transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } flex flex-col h-full`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Bot className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-lg font-bold">ArbiBot</h1>
                <p className="text-xs text-muted-foreground">Flashloan Arbitrage</p>
              </div>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="ml-auto">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {/* Main Menu */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main</p>
            )}
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isCollapsed ? "px-2" : "px-3"} ${
                    isActive ? "bg-secondary text-secondary-foreground" : ""
                  }`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <Icon className={`w-4 h-4 ${isCollapsed ? "" : "mr-3"}`} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              )
            })}
          </div>

          <Separator className="my-4" />

          {/* Settings Menu */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Settings</p>
            )}
            {settingsItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isCollapsed ? "px-2" : "px-3"} ${
                    isActive ? "bg-secondary text-secondary-foreground" : ""
                  }`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <Icon className={`w-4 h-4 ${isCollapsed ? "" : "mr-3"}`} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Status */}
      <div className="p-4 border-t border-border">
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bot Status</span>
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Network</span>
              <span className="text-foreground">Arbitrum</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
