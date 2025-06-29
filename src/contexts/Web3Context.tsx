"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface Web3ContextType {
  account: string | null
  isConnected: boolean
  chainId: number | null
  balance: string
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: (chainId: number) => Promise<void>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState<string>("0")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  const isConnected = Boolean(account && chainId)

  // Check if wallet is already connected on mount
  useEffect(() => {
    if (isClient && typeof window !== "undefined" && window.ethereum) {
      checkConnection()
    }
  }, [isClient])

  const checkConnection = async () => {
    try {
      if (!window.ethereum) return

      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      if (accounts.length > 0) {
        setAccount(accounts[0])
        const chainId = await window.ethereum.request({ method: "eth_chainId" })
        setChainId(Number.parseInt(chainId, 16))
        await updateBalance(accounts[0])
      }
    } catch (error) {
      console.error("Error checking connection:", error)
    }
  }

  const updateBalance = async (address: string) => {
    try {
      if (!window.ethereum) return

      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })

      // Convert from wei to ETH
      const balanceInEth = (Number.parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)
      setBalance(balanceInEth)
    } catch (error) {
      console.error("Error updating balance:", error)
      setBalance("0")
    }
  }

  const connect = useCallback(async () => {
    if (!isClient || !window.ethereum) {
      setError("MetaMask is not installed")
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        setAccount(accounts[0])

        const chainId = await window.ethereum.request({ method: "eth_chainId" })
        const numericChainId = Number.parseInt(chainId, 16)
        setChainId(numericChainId)

        // Switch to Arbitrum if not already connected
        if (numericChainId !== 42161) {
          await switchNetwork(42161)
        }

        await updateBalance(accounts[0])
      }
    } catch (error: any) {
      console.error("Connection error:", error)
      setError(error.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }, [isClient])

  const disconnect = useCallback(() => {
    setAccount(null)
    setChainId(null)
    setBalance("0")
    setError(null)
  }, [])

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) {
      setError("MetaMask is not installed")
      return
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
      setChainId(targetChainId)
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added to MetaMask
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: "Arbitrum One",
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://arb1.arbitrum.io/rpc"],
                blockExplorerUrls: ["https://arbiscan.io/"],
              },
            ],
          })
          setChainId(targetChainId)
        } catch (addError) {
          console.error("Error adding network:", addError)
          setError("Failed to add Arbitrum network")
        }
      } else {
        console.error("Error switching network:", error)
        setError("Failed to switch network")
      }
    }
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (!isClient || !window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAccount(accounts[0])
        updateBalance(accounts[0])
      }
    }

    const handleChainChanged = (chainId: string) => {
      setChainId(Number.parseInt(chainId, 16))
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [isClient, disconnect])

  const value: Web3ContextType = {
    account,
    isConnected,
    chainId,
    balance,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}
