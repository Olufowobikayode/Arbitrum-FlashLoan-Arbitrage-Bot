"use client"

import type React from "react"
import { useBot } from "../contexts/BotContext"
import { TrendingUp, DollarSign, Droplets } from "lucide-react"

interface Opportunity {
  id: string
  baseToken: {
    address: string
    symbol: string
  }
  quoteToken: {
    address: string
    symbol: string
  }
  liquidity: {
    usd: number
  }
  priceUsd: string
  estimatedProfit: number
  amount: number
}

interface OpportunityListProps {
  opportunities: Opportunity[]
}

const OpportunityList: React.FC<OpportunityListProps> = ({ opportunities }) => {
  const { executeTrade } = useBot()

  return (
    <div className="opportunities-section">
      <h3>
        <TrendingUp size={20} style={{ marginRight: "0.5rem" }} />
        Current Opportunities ({opportunities.length})
      </h3>

      <div className="opportunities-list">
        {opportunities.length === 0 ? (
          <div className="no-opportunities">
            <p>No profitable opportunities found</p>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.5rem" }}>
              The bot will automatically scan for new opportunities
            </p>
          </div>
        ) : (
          opportunities.map((opp) => (
            <div key={opp.id} className="opportunity-card">
              <div className="opportunity-header">
                <span className="token-pair">
                  {opp.baseToken.symbol} / {opp.quoteToken.symbol}
                </span>
                <span className="profit">
                  <DollarSign size={14} />
                  {opp.estimatedProfit.toFixed(2)}
                </span>
              </div>

              <div className="opportunity-details">
                <div className="detail">
                  <label>
                    <Droplets size={12} style={{ marginRight: "0.25rem" }} />
                    Liquidity:
                  </label>
                  <span>${opp.liquidity.usd.toLocaleString()}</span>
                </div>
                <div className="detail">
                  <label>Price:</label>
                  <span>${Number.parseFloat(opp.priceUsd).toFixed(4)}</span>
                </div>
                <div className="detail">
                  <label>Amount:</label>
                  <span>${opp.amount.toLocaleString()}</span>
                </div>
                <div className="detail">
                  <label>ROI:</label>
                  <span>{((opp.estimatedProfit / opp.amount) * 100).toFixed(2)}%</span>
                </div>
              </div>

              <button className="btn btn-success btn-sm" onClick={() => executeTrade(opp.id)} style={{ width: "100%" }}>
                Execute Trade
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default OpportunityList
