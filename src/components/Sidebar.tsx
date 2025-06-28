"use client"

import type React from "react"
import {
  TrendingUp,
  Settings,
  Shield,
  Zap,
  Database,
  Filter,
  TestTube,
  Fuel,
  MessageSquare,
  Bell,
  Code,
  Monitor,
  PieChart,
  Home,
  Activity,
  Layers,
  Shuffle,
  Lock,
} from "lucide-react"

interface SidebarProps {
  currentView: string
  onViewChange: (view: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navigationItems = [
    {
      category: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "portfolio", label: "Portfolio", icon: PieChart },
        { id: "monitoring", label: "Monitoring", icon: Monitor },
      ],
    },
    {
      category: "Trading",
      items: [
        { id: "trading", label: "Trading Panel", icon: TrendingUp },
        { id: "strategy-builder", label: "Strategy Builder", icon: Code },
        { id: "trade-simulation", label: "Trade Simulation", icon: TestTube },
        { id: "queue-management", label: "Queue Management", icon: Layers },
      ],
    },
    {
      category: "Configuration",
      items: [
        { id: "config", label: "Bot Config", icon: Settings },
        { id: "dex-management", label: "DEX Management", icon: Shuffle },
        { id: "flashloan-provider", label: "Flashloan Providers", icon: Database },
        { id: "liquidity-filter", label: "Liquidity Filters", icon: Filter },
      ],
    },
    {
      category: "Security & MEV",
      items: [
        { id: "security", label: "Security", icon: Shield },
        { id: "mev-protection", label: "MEV Protection", icon: Lock },
        { id: "flashbots", label: "Flashbots", icon: Zap },
      ],
    },
    {
      category: "Optimization",
      items: [{ id: "gas-optimization", label: "Gas Optimization", icon: Fuel }],
    },
    {
      category: "Notifications",
      items: [
        { id: "notifications", label: "Notification Settings", icon: Bell },
        { id: "telegram-config", label: "Telegram Config", icon: MessageSquare },
      ],
    },
  ]

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Arbitrage Bot</h1>
        <p className="text-sm text-muted-foreground">Advanced Trading System</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navigationItems.map((category) => (
          <div key={category.category}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {category.category}
            </h3>
            <div className="space-y-1">
              {category.items.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentView === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
          <Activity className="w-4 h-4 text-green-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">System Status</p>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
