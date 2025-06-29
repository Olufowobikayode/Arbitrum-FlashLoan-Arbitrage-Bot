"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart3,
  Bot,
  Settings,
  TrendingUp,
  Wallet,
  Bell,
  Shield,
  Zap,
  Menu,
  X,
  Home,
  Activity,
  Target,
  Layers,
  AlertTriangle,
} from "lucide-react"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  className?: string
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  const handleSectionClick = (section: string) => {
    onSectionChange(section)
    // Close mobile menu when section is selected
    if (isMobileOpen) {
      setIsMobileOpen(false)
    }
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "trading", label: "Trading Panel", icon: Bot },
    { id: "opportunities", label: "Opportunities", icon: Target },
    { id: "portfolio", label: "Portfolio", icon: Wallet },
    { id: "strategy", label: "Strategy Builder", icon: Layers },
    { id: "monitoring", label: "Monitoring", icon: Activity },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "mev-protection", label: "MEV Protection", icon: AlertTriangle },
    { id: "gas-optimization", label: "Gas Optimization", icon: Zap },
    { id: "flashbots", label: "Flashbots", icon: TrendingUp },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "configuration", label: "Configuration", icon: Settings },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden" onClick={toggleMobile}>
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full bg-background border-r transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className,
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">ArbitrageBot</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={toggleCollapse} className="hidden md:flex">
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-2 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-10",
                      isCollapsed && "px-2",
                      isActive && "bg-secondary text-secondary-foreground",
                    )}
                    onClick={() => handleSectionClick(item.id)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Button>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            {!isCollapsed && (
              <div className="text-xs text-muted-foreground">
                <p>Version 2.1.0</p>
                <p>© 2024 ArbitrageBot</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content spacer */}
      <div className={cn("transition-all duration-300 md:block hidden", isCollapsed ? "w-16" : "w-64")} />
    </>
  )
}

export default Sidebar
