"use client"

import { useState, useEffect } from "react"
import { Web3Provider } from "./contexts/Web3Context"
import { BotProvider } from "./contexts/BotContext"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Dashboard from "./components/Dashboard"
import TradingPanel from "./components/TradingPanel"
import ConfigPanel from "./components/ConfigPanel"
import MonitoringDashboard from "./components/MonitoringDashboard"
import PortfolioDashboard from "./components/PortfolioDashboard"
import NotificationSettingsPanel from "./components/NotificationSettingsPanel"
import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import SetupWizard from "./components/SetupWizard"

type ActiveView = "dashboard" | "trading" | "config" | "monitoring" | "portfolio" | "notifications" | "setup"

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard")
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if setup is complete
  useEffect(() => {
    if (isClient) {
      const setupComplete = localStorage.getItem("setupComplete")
      setIsSetupComplete(setupComplete === "true")

      if (setupComplete !== "true") {
        setActiveView("setup")
      }
    }
  }, [isClient])

  const handleSetupComplete = () => {
    if (isClient) {
      localStorage.setItem("setupComplete", "true")
      setIsSetupComplete(true)
      setActiveView("dashboard")
    }
  }

  const renderContent = () => {
    switch (activeView) {
      case "setup":
        return <SetupWizard onComplete={handleSetupComplete} />
      case "dashboard":
        return <Dashboard />
      case "trading":
        return <TradingPanel />
      case "config":
        return <ConfigPanel />
      case "monitoring":
        return <MonitoringDashboard />
      case "portfolio":
        return <PortfolioDashboard />
      case "notifications":
        return <NotificationSettingsPanel />
      default:
        return <Dashboard />
    }
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Web3Provider>
        <BotProvider>
          <div className="min-h-screen bg-background">
            {!isSetupComplete ? (
              <div className="container mx-auto px-4 py-8">{renderContent()}</div>
            ) : (
              <div className="flex h-screen">
                <Sidebar activeView={activeView} onViewChange={setActiveView} />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
                </div>
              </div>
            )}
          </div>
          <Toaster />
        </BotProvider>
      </Web3Provider>
    </ThemeProvider>
  )
}
