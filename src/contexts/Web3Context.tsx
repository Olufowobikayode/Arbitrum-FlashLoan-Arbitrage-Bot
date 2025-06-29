"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

interface Web3ContextType {
  account: string | null
  isConnected: boolean
  chainId: number | null
  balance: string
  isConnecting: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchNetwork: (chainId: number) => Promise<void>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState("0.0")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()

  const isConnected = Boolean(account)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && typeof window !== "undefined" && window.ethereum) {
      checkConnection()
      setupEventListeners()
    }
  }, [isClient])

  const checkConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setAccount(accounts[0])
          await updateChainId()
          await updateBalance(accounts[0])
        }
      }
    } catch (error) {
      console.error("Error checking connection:", error)
    }
  }

  const setupEventListeners = () => {
    if (window.ethereum) {
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
      updateBalance(accounts[0])
    }
  }

  const handleChainChanged = (chainId: string) => {
    setChainId(Number.parseInt(chainId, 16))
  }

  const handleDisconnect = () => {
    disconnectWallet()
  }

  const updateChainId = async () => {
    try {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: "eth_chainId" })
        setChainId(Number.parseInt(chainId, 16))
      }
    } catch (error) {
      console.error("Error getting chain ID:", error)
    }
  }

  const updateBalance = async (address: string) => {
    try {
      if (window.ethereum) {
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        })
        const balanceInEth = Number.parseInt(balance, 16) / Math.pow(10, 18)
        setBalance(balanceInEth.toFixed(4))
      }
    } catch (error) {
      console.error("Error getting balance:", error)
    }
  }

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        setAccount(accounts[0])
        await updateChainId()
        await updateBalance(accounts[0])

        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        })
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }, [toast])

  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setChainId(null)
    setBalance("0.0")
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    })
  }, [toast])

  const switchNetwork = useCallback(
    async (targetChainId: number) => {
      if (!window.ethereum) return

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        })
      } catch (error: any) {
        if (error.code === 4902) {
          toast({
            title: "Network Not Added",
            description: "Please add this network to MetaMask first.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Network Switch Failed",
            description: error.message || "Failed to switch network",
            variant: "destructive",
          })
        }
      }
    },
    [toast],
  )

  if (!isClient) {
    return (
      <Web3Context.Provider
        value={{
          account: null,
          isConnected: false,
          chainId: null,
          balance: "0.0",
          isConnecting: false,
          connectWallet: async () => {},
          disconnectWallet: () => {},
          switchNetwork: async () => {},
        }}
      >
        {children}
      </Web3Context.Provider>
    )
  }

  return (
    <Web3Context.Provider
      value={{
        account,
        isConnected,
        chainId,
        balance,
        isConnecting,
        connectWallet,
        disconnectWallet,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}

declare global {
  interface Window {
    ethereum?: any
  }
}
