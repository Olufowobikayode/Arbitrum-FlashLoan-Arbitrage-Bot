"use client"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "./contexts/Web3Context"
import { BotProvider } from "./contexts/BotContext"

// Components
import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import Dashboard from "./components/Dashboard"
import TradingPanel from "./components/TradingPanel"
import MonitoringDashboard from "./components/MonitoringDashboard"
import PortfolioDashboard from "./components/PortfolioDashboard"
import StrategyBuilder from "./components/StrategyBuilder"
import NotificationSettingsPanel from "./components/NotificationSettingsPanel"
import SetupWizard from "./components/SetupWizard"
import ConfigPanel from "./components/ConfigPanel"

// Styles
import "./App.css"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Web3Provider>
        <BotProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 p-6">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/trading" element={<TradingPanel />} />
                    <Route path="/monitoring" element={<MonitoringDashboard />} />
                    <Route path="/portfolio" element={<PortfolioDashboard />} />
                    <Route path="/strategies" element={<StrategyBuilder />} />
                    <Route path="/notifications" element={<NotificationSettingsPanel />} />
                    <Route path="/setup" element={<SetupWizard />} />
                    <Route path="/config" element={<ConfigPanel />} />
                  </Routes>
                </main>
              </div>
              <Toaster />
            </div>
          </Router>
        </BotProvider>
      </Web3Provider>
    </ThemeProvider>
  )
}

export default App
