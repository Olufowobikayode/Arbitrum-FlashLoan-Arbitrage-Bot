"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Web3Provider } from "./contexts/Web3Context"
import { BotProvider } from "./contexts/BotContext"
import Header from "./components/Header"
import Dashboard from "./components/Dashboard"
import TradingPanel from "./components/TradingPanel"
import MonitoringDashboard from "./components/MonitoringDashboard"
import PortfolioDashboard from "./components/PortfolioDashboard"
import StrategyBuilder from "./components/StrategyBuilder"
import ConfigPanel from "./components/ConfigPanel"
import SetupWizard from "./components/SetupWizard"

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showSetup, setShowSetup] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Check if setup is needed
    const setupComplete = localStorage.getItem("setup-complete")
    if (!setupComplete) {
      setShowSetup(true)
    }
  }, [])

  const handleSetupComplete = () => {
    localStorage.setItem("setup-complete", "true")
    setShowSetup(false)
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />
      case "trading":
        return <TradingPanel />
      case "monitoring":
        return <MonitoringDashboard />
      case "portfolio":
        return <PortfolioDashboard />
      case "strategy":
        return <StrategyBuilder />
      case "settings":
        return <ConfigPanel />
      default:
        return <Dashboard />
    }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Web3Provider>
        <BotProvider>
          <div className="min-h-screen bg-background">
            {showSetup ? (
              <SetupWizard onComplete={handleSetupComplete} />
            ) : (
              <>
                <Header activeTab={activeTab} onTabChange={setActiveTab} />
                <main className="pt-32 px-4 pb-8">
                  <div className="max-w-7xl mx-auto">{renderContent()}</div>
                </main>
              </>
            )}
          </div>
          <Toaster />
        </BotProvider>
      </Web3Provider>
    </ThemeProvider>
  )
}
