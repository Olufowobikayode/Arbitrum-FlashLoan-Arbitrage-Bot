"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

declare global {
  interface Window {
    ethereum?: any
  }
}

interface Web3ContextType {
  account: string | null
  isConnected: boolean
  isConnecting: boolean
  balance: string
  chainId: number | null
  gasPrice: string
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchNetwork: (chainId: number) => Promise<void>
  getBalance: () => Promise<void>
  error: string | null
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState("0")
  const [chainId, setChainId] = useState<number | null>(null)
  const [gasPrice, setGasPrice] = useState("0")
  const [error, setError] = useState<string | null>(null)

  // Check if wallet is already connected
  useEffect(() => {
    checkConnection()
    setupEventListeners()
  }, [])

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setIsConnected(true)
          await getChainId()
          await getBalance()
          await getGasPrice()
        }
      } catch (error) {
        console.error("Failed to check wallet connection:", error)
      }
    }
  }

  const setupEventListeners = () => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
      window.ethereum.on("disconnect", handleDisconnect)
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      setAccount(accounts[0])
      getBalance()
    }
  }

  const handleChainChanged = (chainId: string) => {
    setChainId(Number.parseInt(chainId, 16))
    getBalance()
    getGasPrice()
  }

  const handleDisconnect = () => {
    disconnectWallet()
  }

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to continue.")
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
        setIsConnected(true)
        await getChainId()
        await getBalance()
        await getGasPrice()

        // Try to switch to Arbitrum if not already
        const arbitrumChainId = 42161
        const currentChainId = await window.ethereum.request({ method: "eth_chainId" })

        if (Number.parseInt(currentChainId, 16) !== arbitrumChainId) {
          try {
            await switchNetwork(arbitrumChainId)
          } catch (switchError) {
            console.warn("Failed to switch to Arbitrum:", switchError)
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error)
      if (error.code === 4001) {
        setError("Connection rejected by user")
      } else {
        setError("Failed to connect wallet. Please try again.")
      }
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setIsConnected(false)
    setBalance("0")
    setChainId(null)
    setGasPrice("0")
    setError(null)
  }, [])

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, try to add it
        if (targetChainId === 42161) {
          // Add Arbitrum One
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xA4B1",
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
        }
      } else {
        throw error
      }
    }
  }, [])

  const getChainId = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: "eth_chainId" })
        setChainId(Number.parseInt(chainId, 16))
      } catch (error) {
        console.error("Failed to get chain ID:", error)
      }
    }
  }

  const getBalance = useCallback(async () => {
    if (window.ethereum && account) {
      try {
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [account, "latest"],
        })

        // Convert from wei to ETH
        const balanceInEth = Number.parseInt(balance, 16) / Math.pow(10, 18)
        setBalance(balanceInEth.toFixed(4))
      } catch (error) {
        console.error("Failed to get balance:", error)
        setBalance("0")
      }
    }
  }, [account])

  const getGasPrice = async () => {
    if (window.ethereum) {
      try {
        const gasPrice = await window.ethereum.request({ method: "eth_gasPrice" })
        const gasPriceInGwei = Number.parseInt(gasPrice, 16) / Math.pow(10, 9)
        setGasPrice(gasPriceInGwei.toFixed(2))
      } catch (error) {
        console.error("Failed to get gas price:", error)
        setGasPrice("0")
      }
    }
  }

  // Update gas price periodically
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(getGasPrice, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isConnected])

  const value: Web3ContextType = {
    account,
    isConnected,
    isConnecting,
    balance,
    chainId,
    gasPrice,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getBalance,
    error,
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
