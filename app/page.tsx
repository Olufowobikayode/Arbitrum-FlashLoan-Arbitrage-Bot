"use client"

import { useState, useEffect } from "react"
import { Toaster } from "react-hot-toast"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "@/src/contexts/Web3Context"
import { BotProvider } from "@/src/contexts/BotContext"

// Components
import Header from "@/src/components/Header"
import Sidebar from "@/src/components/Sidebar"
import Dashboard from "@/src/components/Dashboard"
import TradingPanel from "@/src/components/TradingPanel"
import MonitoringDashboard from "@/src/components/MonitoringDashboard"
import PortfolioDashboard from "@/src/components/PortfolioDashboard"
import StrategyBuilder from "@/src/components/StrategyBuilder"
import NotificationSettingsPanel from "@/src/components/NotificationSettingsPanel"
import SetupWizard from "@/src/components/SetupWizard"
import ConfigPanel from "@/src/components/ConfigPanel"

type ViewType =
  | "dashboard"
  | "trading"
  | "monitoring"
  | "portfolio"
  | "strategies"
  | "notifications"
  | "setup"
  | "config"

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isSetupComplete, setIsSetupComplete] = useState(true)

  useEffect(() => {
    // Check if setup is complete
    const setupComplete = localStorage.getItem("setupComplete")
    setIsSetupComplete(setupComplete === "true")
  }, [])

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
  }

  const handleSetupComplete = () => {
    localStorage.setItem("setupComplete", "true")
    setIsSetupComplete(true)
    setCurrentView("dashboard")
  }

  const renderCurrentView = () => {
    if (!isSetupComplete) {
      return <SetupWizard onComplete={handleSetupComplete} />
    }

    switch (currentView) {
      case "dashboard":
        return <Dashboard />
      case "trading":
        return <TradingPanel />
      case "monitoring":
        return <MonitoringDashboard />
      case "portfolio":
        return <PortfolioDashboard />
      case "strategies":
        return <StrategyBuilder />
      case "notifications":
        return <NotificationSettingsPanel />
      case "setup":
        return <SetupWizard onComplete={handleSetupComplete} />
      case "config":
        return <ConfigPanel />
      default:
        return <Dashboard />
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Web3Provider>
        <BotProvider>
          <div className="min-h-screen bg-background">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "hsl(var(--background))",
                  color: "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))",
                },
              }}
            />

            {isSetupComplete && (
              <Header onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} currentView={currentView} />
            )}

            <div className="flex">
              {isSetupComplete && (
                <Sidebar currentView={currentView} onViewChange={handleViewChange} collapsed={sidebarCollapsed} />
              )}

              <main
                className={`flex-1 ${isSetupComplete ? (sidebarCollapsed ? "ml-16" : "ml-64") : ""} ${isSetupComplete ? "pt-16" : ""}`}
              >
                <div className={isSetupComplete ? "p-6" : ""}>{renderCurrentView()}</div>
              </main>
            </div>
          </div>
        </BotProvider>
      </Web3Provider>
    </ThemeProvider>
  )
}
