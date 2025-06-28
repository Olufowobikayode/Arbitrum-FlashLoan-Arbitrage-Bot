"use client"

import type React from "react"
import { useWeb3 } from "../contexts/Web3Context"
import { Menu, Wallet, LogOut } from "lucide-react"
import toast from "react-hot-toast"

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { account, balance, isConnected, connectWallet, disconnectWallet, chainId } = useWeb3()

  const handleConnectWallet = async () => {
    try {
      await connectWallet()
      toast.success("Wallet connected successfully!")
    } catch (error) {
      toast.error("Failed to connect wallet")
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <h1>Flashloan Arbitrage Bot</h1>
      </div>

      <div className="header-right">
        {isConnected ? (
          <div className="wallet-info">
            <div className="wallet-address">{formatAddress(account!)}</div>
            <div className="wallet-balance">{balance} ETH</div>
            {chainId !== 42161 && <span style={{ color: "#f59e0b", fontSize: "0.75rem" }}>Wrong Network</span>}
            <button className="btn btn-secondary btn-sm" onClick={disconnectWallet} style={{ marginLeft: "0.5rem" }}>
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={handleConnectWallet}>
            <Wallet size={16} />
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
