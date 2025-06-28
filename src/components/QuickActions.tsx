"use client"

import type React from "react"
import { useBot } from "../contexts/BotContext"
import { useWeb3 } from "../contexts/Web3Context"
import { Play, Square, AlertTriangle, RefreshCw } from "lucide-react"

const QuickActions: React.FC = () => {
  const { botState, startBot, stopBot, emergencyStop, scanOpportunities, isScanning } = useBot()
  const { isConnected } = useWeb3()

  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>
      <div className="quick-actions-grid">
        <button
          className={`btn ${botState.running ? "btn-danger" : "btn-success"}`}
          onClick={botState.running ? stopBot : startBot}
          disabled={!isConnected}
        >
          {botState.running ? (
            <>
              <Square size={16} />
              Stop Bot
            </>
          ) : (
            <>
              <Play size={16} />
              Start Bot
            </>
          )}
        </button>

        <button className="btn btn-warning" onClick={emergencyStop}>
          <AlertTriangle size={16} />
          Emergency
        </button>

        <button className="btn btn-secondary" onClick={scanOpportunities} disabled={isScanning}>
          <RefreshCw size={16} className={isScanning ? "loading" : ""} />
          {isScanning ? "Scanning..." : "Scan Now"}
        </button>

        <button className="btn btn-primary" disabled={!botState.running}>
          Manual Trade
        </button>
      </div>
    </div>
  )
}

export default QuickActions
