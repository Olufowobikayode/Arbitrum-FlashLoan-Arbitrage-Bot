"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Wallet, Settings, LogOut, ChevronDown, Activity, DollarSign, TrendingUp, Zap } from "lucide-react"
import { useWeb3 } from "@/src/contexts/Web3Context"
import { useBot } from "@/src/contexts/BotContext"

export default function Header() {
  const { account, isConnected, balance, connect, disconnect, chainId } = useWeb3()
  const { botState, startBot, stopBot } = useBot()
  const [isToggling, setIsToggling] = useState(false)

  const handleBotToggle = async () => {
    setIsToggling(true)
    try {
      if (botState.running) {
        stopBot()
      } else {
        await startBot()
      }
    } catch (error) {
      console.error("Failed to toggle bot:", error)
    } finally {
      setIsToggling(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 1:
        return "Ethereum"
      case 42161:
        return "Arbitrum"
      case 137:
        return "Polygon"
      default:
        return "Unknown"
    }
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Bot status and stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${botState.running ? "bg-green-500" : "bg-gray-400"}`} />
            <span className="text-sm font-medium">Bot {botState.running ? "Active" : "Inactive"}</span>
          </div>

          {botState.running && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-medium">${botState.totalProfit.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{botState.successRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-purple-600" />
                <span className="font-medium">{botState.totalTrades}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Controls and wallet */}
        <div className="flex items-center gap-4">
          {/* Bot Control */}
          {isConnected && (
            <Button
              onClick={handleBotToggle}
              disabled={isToggling}
              variant={botState.running ? "destructive" : "default"}
              size="sm"
            >
              {isToggling ? <Settings className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              {botState.running ? "Stop Bot" : "Start Bot"}
            </Button>
          )}

          {/* Wallet Connection */}
          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Wallet className="w-4 h-4" />
                  <div className="flex flex-col items-start">
                    <span className="text-xs">{formatAddress(account!)}</span>
                    <span className="text-xs text-muted-foreground">{balance} ETH</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{formatAddress(account!)}</p>
                    <p className="text-xs text-muted-foreground">{getNetworkName(chainId)} Network</p>
                    <p className="text-xs text-muted-foreground">Balance: {balance} ETH</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={disconnect}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={connect} className="gap-2">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}

          {/* Network Badge */}
          {isConnected && chainId && (
            <Badge variant={chainId === 42161 ? "default" : "destructive"}>{getNetworkName(chainId)}</Badge>
          )}
        </div>
      </div>
    </header>
  )
}
