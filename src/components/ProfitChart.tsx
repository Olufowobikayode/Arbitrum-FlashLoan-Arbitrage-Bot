"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useBot } from "../contexts/BotContext"
import { TrendingUp, DollarSign } from "lucide-react"

const ProfitChart: React.FC = () => {
  const { botState } = useBot()
  const [profitHistory, setProfitHistory] = useState<Array<{ time: string; profit: number }>>([])

  useEffect(() => {
    // Load profit history from localStorage
    const saved = localStorage.getItem("profitHistory")
    if (saved) {
      try {
        setProfitHistory(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading profit history:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Update profit history when total profit changes
    if (botState.totalProfit > 0) {
      const newEntry = {
        time: new Date().toLocaleTimeString(),
        profit: botState.totalProfit,
      }

      setProfitHistory((prev) => {
        const updated = [...prev, newEntry].slice(-20) // Keep last 20 entries
        localStorage.setItem("profitHistory", JSON.stringify(updated))
        return updated
      })
    }
  }, [botState.totalProfit])

  const maxProfit = Math.max(...profitHistory.map((p) => p.profit), 100)
  const profitChange =
    profitHistory.length >= 2
      ? profitHistory[profitHistory.length - 1].profit - profitHistory[profitHistory.length - 2].profit
      : 0

  return (
    <div className="system-info">
      <h3>
        <TrendingUp size={20} style={{ marginRight: "0.5rem" }} />
        Profit Overview
      </h3>

      <div className="profit-summary">
        <div className="profit-main">
          <div className="profit-value">
            <DollarSign size={24} />
            {botState.totalProfit.toFixed(2)}
          </div>
          <div className="profit-label">Total Profit</div>
        </div>

        {profitChange !== 0 && (
          <div className={`profit-change ${profitChange > 0 ? "positive" : "negative"}`}>
            {profitChange > 0 ? "+" : ""}${profitChange.toFixed(2)}
            <span style={{ fontSize: "0.75rem", marginLeft: "0.25rem" }}>last trade</span>
          </div>
        )}
      </div>

      {profitHistory.length > 0 && (
        <div className="profit-chart">
          <div className="chart-container">
            {profitHistory.map((entry, index) => (
              <div
                key={index}
                className="chart-bar"
                style={{
                  height: `${(entry.profit / maxProfit) * 100}%`,
                  background: `linear-gradient(to top, #10b981, #34d399)`,
                }}
                title={`${entry.time}: $${entry.profit.toFixed(2)}`}
              />
            ))}
          </div>
          <div className="chart-labels">
            <span>Recent Trades</span>
            <span>${maxProfit.toFixed(0)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfitChart
