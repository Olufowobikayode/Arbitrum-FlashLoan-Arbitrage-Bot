"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import Web3 from "web3"
import type { Contract } from "web3-eth-contract"

interface Web3ContextType {
  web3: Web3 | null
  account: string | null
  contract: Contract | null
  isConnected: boolean
  chainId: number | null
  balance: string
  gasPrice: string
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToArbitrum: () => Promise<void>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || ""
const ARBITRUM_CHAIN_ID = 42161
const ARBITRUM_RPC = process.env.REACT_APP_ARBITRUM_RPC || "https://arbitrum-one.publicnode.com"

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "address[2]", name: "tokens", type: "address[2]" },
      { internalType: "uint256[2]", name: "amounts", type: "uint256[2]" },
      { internalType: "address[2]", name: "targets", type: "address[2]" },
      { internalType: "bytes[2]", name: "calldatas", type: "bytes[2]" },
      { internalType: "bool[2]", name: "useAaveFlags", type: "bool[2]" },
    ],
    name: "executeBundle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newGasPrice", type: "uint256" }],
    name: "setGasPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newSlippage", type: "uint256" }],
    name: "setSlippage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState("0")
  const [gasPrice, setGasPrice] = useState("0")

  useEffect(() => {
    initializeWeb3()
    setupEventListeners()
  }, [])

  useEffect(() => {
    if (web3 && account) {
      updateBalance()
      updateGasPrice()
      const interval = setInterval(() => {
        updateBalance()
        updateGasPrice()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [web3, account])

  const initializeWeb3 = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum)
      setWeb3(web3Instance)

      try {
        const accounts = await web3Instance.eth.getAccounts()
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setIsConnected(true)

          const networkId = await web3Instance.eth.getChainId()
          setChainId(networkId)

          if (CONTRACT_ADDRESS) {
            const contractInstance = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS)
            setContract(contractInstance)
          }
        }
      } catch (error) {
        console.error("Error initializing Web3:", error)
      }
    } else {
      // Fallback to Arbitrum RPC
      const web3Instance = new Web3(ARBITRUM_RPC)
      setWeb3(web3Instance)
    }
  }

  const setupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setIsConnected(true)
        } else {
          disconnectWallet()
        }
      })

      window.ethereum.on("chainChanged", (chainId: string) => {
        setChainId(Number.parseInt(chainId, 16))
        window.location.reload()
      })
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      setAccount(accounts[0])
      setIsConnected(true)

      const networkId = await web3!.eth.getChainId()
      setChainId(networkId)

      if (networkId !== ARBITRUM_CHAIN_ID) {
        await switchToArbitrum()
      }

      if (CONTRACT_ADDRESS) {
        const contractInstance = new web3!.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS)
        setContract(contractInstance)
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setContract(null)
    setIsConnected(false)
    setChainId(null)
    setBalance("0")
  }

  const switchToArbitrum = async () => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${ARBITRUM_CHAIN_ID.toString(16)}` }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${ARBITRUM_CHAIN_ID.toString(16)}`,
              chainName: "Arbitrum One",
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [ARBITRUM_RPC],
              blockExplorerUrls: ["https://arbiscan.io/"],
            },
          ],
        })
      }
    }
  }

  const updateBalance = async () => {
    if (web3 && account) {
      try {
        const balanceWei = await web3.eth.getBalance(account)
        const balanceEth = web3.utils.fromWei(balanceWei, "ether")
        setBalance(Number.parseFloat(balanceEth).toFixed(4))
      } catch (error) {
        console.error("Error updating balance:", error)
      }
    }
  }

  const updateGasPrice = async () => {
    if (web3) {
      try {
        const gasPriceWei = await web3.eth.getGasPrice()
        const gasPriceGwei = web3.utils.fromWei(gasPriceWei, "gwei")
        setGasPrice(Number.parseFloat(gasPriceGwei).toFixed(1))
      } catch (error) {
        console.error("Error updating gas price:", error)
      }
    }
  }

  return (
    <Web3Context.Provider
      value={{
        web3,
        account,
        contract,
        isConnected,
        chainId,
        balance,
        gasPrice,
        connectWallet,
        disconnectWallet,
        switchToArbitrum,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error("useWeb3 must be used within Web3Provider")
  }
  return context
}
