"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, ChevronDown, LogOut, Settings, User } from "lucide-react"
import { useWeb3 } from "../contexts/Web3Context"
import { useBot } from "../contexts/BotContext"

interface HeaderProps {
  activeSection: string
}

const Header: React.FC<HeaderProps> = ({ activeSection }) => {
  const { account, isConnected, isConnecting, chainId, balance, connectWallet, disconnectWallet } = useWeb3()
  const { isRunning, isEmergencyStop } = useBot()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum"
      case 137:
        return "Polygon"
      case 56:
        return "BSC"
      case 42161:
        return "Arbitrum"
      case 10:
        return "Optimism"
      default:
        return "Unknown"
    }
  }

  const getSectionTitle = (section: string) => {
    const titles: { [key: string]: string } = {
      dashboard: "Dashboard",
      trading: "Trading Panel",
      opportunities: "Opportunities",
      portfolio: "Portfolio",
      strategy: "Strategy Builder",
      monitoring: "Monitoring",
      notifications: "Notifications",
      security: "Security",
      "mev-protection": "MEV Protection",
      "gas-optimization": "Gas Optimization",
      flashbots: "Flashbots",
      analytics: "Analytics",
      configuration: "Configuration",
    }
    return titles[section] || "Dashboard"
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Left side - Section title and status */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{getSectionTitle(activeSection)}</h1>

        {/* Bot Status */}
        <div className="flex items-center gap-2">
          <Badge
            variant={isEmergencyStop ? "destructive" : isRunning ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isEmergencyStop ? "bg-red-500" : isRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {isEmergencyStop ? "Emergency Stop" : isRunning ? "Running" : "Stopped"}
          </Badge>
        </div>
      </div>

      {/* Right side - Wallet connection */}
      <div className="flex items-center gap-4">
        {isConnected ? (
          <div className="flex items-center gap-3">
            {/* Chain indicator */}
            {chainId && (
              <Badge variant="outline" className="text-xs">
                {getChainName(chainId)}
              </Badge>
            )}

            {/* Balance */}
            <div className="text-sm text-muted-foreground">{balance} ETH</div>

            {/* Account dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>
                      <User className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{formatAddress(account!)}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnectWallet}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Disconnect</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button onClick={connectWallet} disabled={isConnecting} className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
      </div>
    </header>
  )
}

export default Header
