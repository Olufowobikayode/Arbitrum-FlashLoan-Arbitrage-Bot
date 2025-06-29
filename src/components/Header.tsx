"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, Wallet, Settings, User, LogOut, Bell, Activity, DollarSign } from "lucide-react"
import { useWeb3 } from "@/src/contexts/Web3Context"
import { useBot } from "@/src/contexts/BotContext"
import toast from "react-hot-toast"

interface HeaderProps {
  onMenuToggle: () => void
  currentView: string
}

export default function Header({ onMenuToggle, currentView }: HeaderProps) {
  const { account, isConnected, isConnecting, balance, connectWallet, disconnectWallet } = useWeb3()
  const { botState } = useBot()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleWalletConnect = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast.error("Failed to connect wallet")
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getViewTitle = (view: string) => {
    switch (view) {
      case "dashboard":
        return "Dashboard"
      case "trading":
        return "Trading Panel"
      case "monitoring":
        return "Monitoring"
      case "portfolio":
        return "Portfolio"
      case "strategies":
        return "Strategy Builder"
      case "notifications":
        return "Notifications"
      case "config":
        return "Configuration"
      default:
        return "Dashboard"
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onMenuToggle} className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{getViewTitle(currentView)}</h1>
            {botState.running && (
              <Badge variant="default" className="bg-green-500">
                <Activity className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Bot Status */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="font-medium">${botState.totalProfit.toFixed(2)}</span>
            </div>
            <div className="text-muted-foreground">{botState.totalTrades} trades</div>
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {botState.running && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
          </Button>

          {/* Wallet Connection */}
          {!isConnected ? (
            <Button onClick={handleWalletConnect} disabled={isConnecting} className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Wallet className="w-4 h-4" />
                  <span className="hidden md:inline">{formatAddress(account!)}</span>
                  <Badge variant="secondary" className="hidden md:inline">
                    {balance} ETH
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">Connected Wallet</p>
                  <p className="text-xs text-muted-foreground">{account}</p>
                  <p className="text-xs text-muted-foreground">Balance: {balance} ETH</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnectWallet}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
