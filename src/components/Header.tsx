"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Menu,
  Wallet,
  Activity,
  TrendingUp,
  Monitor,
  Briefcase,
  Settings,
  Play,
  Square,
  AlertTriangle,
  ChevronDown,
  Bot,
  DollarSign,
  BarChart3,
  Zap,
} from "lucide-react"
import { useWeb3 } from "../contexts/Web3Context"
import { useBot } from "../contexts/BotContext"

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: Activity },
  { id: "trading", label: "Trading", icon: TrendingUp },
  { id: "monitoring", label: "Monitoring", icon: Monitor },
  { id: "portfolio", label: "Portfolio", icon: Briefcase },
  { id: "strategy", label: "Strategy", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
]

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { account, isConnected, balance, connectWallet, disconnectWallet, isConnecting, chainId } = useWeb3()
  const { botState, startBot, stopBot, emergencyStop } = useBot()

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 1:
        return "Ethereum"
      case 42161:
        return "Arbitrum"
      case 137:
        return "Polygon"
      case 10:
        return "Optimism"
      default:
        return "Unknown"
    }
  }

  const handleBotToggle = async () => {
    try {
      if (botState.running) {
        stopBot()
      } else {
        await startBot()
      }
    } catch (error) {
      console.error("Failed to toggle bot:", error)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      {/* Top Bar */}
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and Bot Status */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">FlashBot</span>
            </div>

            {/* Bot Status */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    botState.running
                      ? "bg-green-500 animate-pulse"
                      : botState.status === "error"
                        ? "bg-red-500"
                        : "bg-gray-400"
                  }`}
                />
                <span className="text-sm font-medium">
                  {botState.running ? "Running" : botState.status === "error" ? "Error" : "Stopped"}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="font-medium">${botState.totalProfit.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{botState.totalTrades}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">{botState.successRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bot Controls and Wallet */}
          <div className="flex items-center gap-3">
            {/* Bot Controls */}
            {isConnected && (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  onClick={handleBotToggle}
                  variant={botState.running ? "destructive" : "default"}
                  size="sm"
                  className="gap-2"
                >
                  {botState.running ? (
                    <>
                      <Square className="h-4 w-4" />
                      Stop Bot
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Bot
                    </>
                  )}
                </Button>

                <Button
                  onClick={emergencyStop}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-red-600 bg-transparent"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Emergency
                </Button>
              </div>
            )}

            {/* Wallet Connection */}
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Wallet className="h-4 w-4" />
                    <div className="hidden sm:block text-left">
                      <div className="text-xs text-muted-foreground">{getNetworkName(chainId)}</div>
                      <div className="font-mono text-sm">
                        {account?.slice(0, 6)}...{account?.slice(-4)}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="p-3">
                    <div className="text-sm font-medium">Connected Wallet</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{account}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm">Balance:</span>
                      <span className="font-medium">{balance} ETH</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Network:</span>
                      <Badge variant="secondary">{getNetworkName(chainId)}</Badge>
                    </div>
                  </div>
                  <Separator />
                  <DropdownMenuItem onClick={disconnectWallet} className="text-red-600">
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={connectWallet} disabled={isConnecting} className="gap-2">
                <Wallet className="h-4 w-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden bg-transparent">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="py-6">
                  <div className="space-y-4">
                    {/* Mobile Bot Status */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Bot Status</span>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              botState.running
                                ? "bg-green-500 animate-pulse"
                                : botState.status === "error"
                                  ? "bg-red-500"
                                  : "bg-gray-400"
                            }`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Profit</div>
                            <div className="font-medium">${botState.totalProfit.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Trades</div>
                            <div className="font-medium">{botState.totalTrades}</div>
                          </div>
                        </div>
                        {isConnected && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              onClick={handleBotToggle}
                              variant={botState.running ? "destructive" : "default"}
                              size="sm"
                              className="flex-1"
                            >
                              {botState.running ? "Stop" : "Start"}
                            </Button>
                            <Button
                              onClick={emergencyStop}
                              variant="outline"
                              size="sm"
                              className="text-red-600 bg-transparent"
                            >
                              Emergency
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Mobile Navigation */}
                    <div className="space-y-2">
                      {navigationItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Button
                            key={item.id}
                            variant={activeTab === item.id ? "default" : "ghost"}
                            className="w-full justify-start gap-3"
                            onClick={() => {
                              onTabChange(item.id)
                              setMobileMenuOpen(false)
                            }}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Desktop Only */}
      <div className="hidden md:block px-4 py-2 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
