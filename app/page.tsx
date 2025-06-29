"use client"

import { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Web3Provider } from "@/src/contexts/Web3Context"
import { BotProvider } from "@/src/contexts/BotContext"

// Components
import Sidebar from "@/src/components/Sidebar"
import Header from "@/src/components/Header"
import Dashboard from "@/src/components/Dashboard"
import TradingPanel from "@/src/components/TradingPanel"
import MonitoringDashboard from "@/src/components/MonitoringDashboard"
import PortfolioDashboard from "@/src/components/PortfolioDashboard"
import SetupWizard from "@/src/components/SetupWizard"
import ConfigPanel from "@/src/components/ConfigPanel"
import NotificationSettingsPanel from "@/src/components/NotificationSettingsPanel"
import StrategyBuilder from "@/src/components/StrategyBuilder"

// Services
import { RealTimePriceFeedService } from "@/src/services/RealTimePriceFeedService"
import { WebSocketService } from "@/src/services/WebSocketService"
import { BotService } from "@/src/services/BotService"

// Styles
import "@/src/App.css"

type ViewType =
  | "dashboard"
  | "trading"
  | "monitoring"
  | "portfolio"
  | "strategy-builder"
  | "config"
  | "notifications"
  | "setup"

function App() {
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")
  const [services, setServices] = useState<{
    priceFeed: RealTimePriceFeedService | null
    webSocket: WebSocketService | null
    bot: BotService | null
  }>({
    priceFeed: null,
    webSocket: null,
    bot: null,
  })

  useEffect(() => {
    // Check if setup is complete
    const setupData = localStorage.getItem("setupComplete")
    const hasSetup = setupData === "true"
    setIsSetupComplete(hasSetup)
    setIsLoading(false)

    // Initialize services
    if (hasSetup) {
      initializeServices()
    }

    return () => {
      // Cleanup services on unmount
      cleanupServices()
    }
  }, [])

  const initializeServices = async () => {
    try {
      console.log("🚀 Initializing real-time services...")

      // Initialize price feed service
      const priceFeedService = new RealTimePriceFeedService()

      // Initialize WebSocket service
      const webSocketService = new WebSocketService()

      // Initialize bot service
      const botService = new BotService()

      setServices({
        priceFeed: priceFeedService,
        webSocket: webSocketService,
        bot: botService,
      })

      // Start services
      await startServices(priceFeedService, webSocketService)

      console.log("✅ Services initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize services:", error)
    }
  }

  const startServices = async (priceFeedService: RealTimePriceFeedService, webSocketService: WebSocketService) => {
    try {
      // Start price feeds for common tokens
      await priceFeedService.startPriceFeeds(["WETH", "USDC", "USDT", "DAI", "WBTC", "ARB", "GMX"])

      // Start WebSocket connections
      await webSocketService.startConnections()

      // Setup cross-service communication
      setupServiceIntegration(priceFeedService, webSocketService)

      console.log("✅ All services started successfully")
    } catch (error) {
      console.error("❌ Failed to start services:", error)
    }
  }

  const setupServiceIntegration = (priceFeedService: RealTimePriceFeedService, webSocketService: WebSocketService) => {
    // Subscribe to WebSocket price updates and forward to price feed service
    webSocketService.subscribe("price_update", (message) => {
      // Handle real-time price updates from exchanges
      console.log("📈 Price update:", message.data)
    })

    webSocketService.subscribe("dex_update", (message) => {
      // Handle DEX-specific updates
      console.log("🔄 DEX update:", message.data)
    })

    webSocketService.subscribe("new_block", (message) => {
      // Handle new block notifications
      console.log("⛏️ New block:", message.data.blockNumber)
    })

    webSocketService.subscribe("pending_transaction", (message) => {
      // Handle pending transaction notifications for MEV detection
      console.log("⏳ Pending TX:", message.data.txHash)
    })
  }

  const cleanupServices = () => {
    if (services.priceFeed) {
      services.priceFeed.cleanup()
    }
    if (services.webSocket) {
      services.webSocket.cleanup()
    }
  }

  const handleSetupComplete = async () => {
    setIsSetupComplete(true)
    setCurrentView("dashboard")

    // Initialize services after setup
    await initializeServices()
  }

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
  }

  // Show loading state
  if (isLoading) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  // Show setup wizard if setup is not complete
  if (!isSetupComplete) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen bg-background">
          <SetupWizard onComplete={handleSetupComplete} />
          <Toaster />
        </div>
      </ThemeProvider>
    )
  }

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />
      case "trading":
        return <TradingPanel />
      case "monitoring":
        return <MonitoringDashboard />
      case "portfolio":
        return <PortfolioDashboard />
      case "strategy-builder":
        return <StrategyBuilder />
      case "config":
        return <ConfigPanel />
      case "notifications":
        return <NotificationSettingsPanel />
      case "setup":
        return <SetupWizard onComplete={handleSetupComplete} />
      default:
        return <Dashboard />
    }
  }

  // Show main application
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Web3Provider>
        <BotProvider>
          <div className="flex h-screen bg-background">
            <Sidebar onViewChange={handleViewChange} currentView={currentView} />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto p-6">{renderCurrentView()}</main>
            </div>
          </div>
          <Toaster />
        </BotProvider>
      </Web3Provider>
    </ThemeProvider>
  )
}

export default App
