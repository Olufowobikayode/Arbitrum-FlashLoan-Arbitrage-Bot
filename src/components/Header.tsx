"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, Wallet, Settings, Bell, LogOut } from "lucide-react"
import { useWeb3 } from "@/src/contexts/Web3Context"
import { useBot } from "@/src/contexts/BotContext"

interface HeaderProps {
  onMenuToggle: () => void
  currentView: string
}

export default function Header({ onMenuToggle, currentView }: HeaderProps) {
  const { isConnected, account, balance, connectWallet, disconnectWallet } = useWeb3()
  const { botState } = useBot()

  const formatAccount = (account: string) => {
    return `${account.slice(0, 6)}...${account.slice(-4)}`
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onMenuToggle}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AB</span>
            </div>
            <span className="font-semibold">Arbitrage Bot</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Bot Status */}
          <Badge variant={botState.running ? "default" : "secondary"} className="hidden md:flex">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${botState.running ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
            />
            {botState.running ? "Running" : "Stopped"}
          </Badge>

          {/* Wallet Connection */}
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:block text-sm">
                <div className="font-medium">{formatAccount(account!)}</div>
                <div className="text-muted-foreground">{balance} ETH</div>
              </div>
              <Button variant="outline" size="sm" onClick={disconnectWallet}>
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connectWallet}>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="sm">
            <Bell className="w-5 h-5" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
