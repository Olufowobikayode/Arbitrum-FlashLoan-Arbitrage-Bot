"use client"

import type React from "react"
import { useState } from "react"
import { SecurityService } from "../services/SecurityService"
import { Shield, AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react"
import toast from "react-hot-toast"

const SecurityPanel: React.FC = () => {
  const [calldata, setCalldata] = useState("")
  const [securityReport, setSecurityReport] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [blacklistItem, setBlacklistItem] = useState("")

  const securityService = new SecurityService()

  const analyzeTransaction = async () => {
    if (!calldata.trim()) {
      toast.error("Please enter calldata to analyze")
      return
    }

    setIsAnalyzing(true)
    try {
      const report = await securityService.analyzeTransaction(
        "0x0000000000000000000000000000000000000000",
        0,
        calldata,
        "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        1000000000000000000,
      )
      setSecurityReport(report)
    } catch (error) {
      toast.error("Analysis failed")
      console.error("Security analysis error:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const addToBlacklist = () => {
    if (!blacklistItem.trim()) {
      toast.error("Please enter an address or signature")
      return
    }

    securityService.addToBlacklist(blacklistItem)
    toast.success("Added to blacklist")
    setBlacklistItem("")
  }

  const getRiskColor = (level: number) => {
    if (level === 0) return "green"
    if (level === 1) return "blue"
    if (level === 2) return "orange"
    if (level >= 3) return "red"
    return "gray"
  }

  const getRiskLabel = (level: number) => {
    const labels = {
      0: "No Risk",
      1: "Low Risk",
      2: "Medium Risk",
      3: "High Risk",
      4: "Critical Risk",
    }
    return labels[level as keyof typeof labels] || "Unknown"
  }

  return (
    <div className="security-panel">
      <div className="panel-header">
        <h2>
          <Shield size={24} style={{ marginRight: "0.5rem" }} />
          Security Analysis
        </h2>
      </div>

      <div className="security-grid">
        {/* Transaction Analysis */}
        <div className="analysis-section">
          <h3>Transaction Analysis</h3>
          <div className="analysis-form">
            <div className="form-group">
              <label>Calldata (0x...)</label>
              <input
                type="text"
                value={calldata}
                onChange={(e) => setCalldata(e.target.value)}
                placeholder="0x38ed1739000000000000000000000000..."
              />
            </div>

            <button className="btn btn-primary" onClick={analyzeTransaction} disabled={isAnalyzing}>
              <Search size={16} />
              {isAnalyzing ? "Analyzing..." : "Analyze Transaction"}
            </button>
          </div>

          {securityReport && (
            <div className="security-report">
              <div className="report-header">
                <h4>Security Report</h4>
                <div className={`risk-badge ${getRiskColor(securityReport.riskLevel)}`}>
                  {securityReport.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {getRiskLabel(securityReport.riskLevel)}
                </div>
              </div>

              <div className="report-details">
                <div className="detail-item">
                  <label>Target:</label>
                  <span className="monospace">{securityReport.target}</span>
                </div>
                <div className="detail-item">
                  <label>Signature:</label>
                  <span className="monospace">{securityReport.signature}</span>
                </div>
                <div className="detail-item">
                  <label>Analysis:</label>
                  <span>{securityReport.signatureAnalysis}</span>
                </div>
              </div>

              {securityReport.vulnerabilities.length > 0 && (
                <div className="vulnerabilities">
                  <h5>
                    <AlertTriangle size={16} />
                    Vulnerabilities
                  </h5>
                  <ul>
                    {securityReport.vulnerabilities.map((vuln: string, index: number) => (
                      <li key={index}>{vuln}</li>
                    ))}
                  </ul>
                </div>
              )}

              {securityReport.warnings.length > 0 && (
                <div className="warnings">
                  <h5>Warnings</h5>
                  <ul>
                    {securityReport.warnings.map((warning: string, index: number) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Blacklist Management */}
        <div className="blacklist-section">
          <h3>Blacklist Management</h3>
          <div className="blacklist-form">
            <div className="form-group">
              <label>Address or Signature</label>
              <input
                type="text"
                value={blacklistItem}
                onChange={(e) => setBlacklistItem(e.target.value)}
                placeholder="0x1234... or 0xa55e55ed"
              />
            </div>

            <button className="btn btn-danger" onClick={addToBlacklist}>
              Add to Blacklist
            </button>
          </div>

          <div className="blacklist-info">
            <h4>Security Features</h4>
            <ul>
              <li>EthSig vulnerability scanning</li>
              <li>Honeypot pattern detection</li>
              <li>Uniswap V2 slippage warnings</li>
              <li>High-value transaction analysis</li>
              <li>Manual blacklist management</li>
            </ul>
          </div>
        </div>

        {/* Security Statistics */}
        <div className="security-stats">
          <h3>Security Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <label>Transactions Analyzed</label>
              <span className="value">0</span>
            </div>
            <div className="stat-item">
              <label>Threats Blocked</label>
              <span className="value">0</span>
            </div>
            <div className="stat-item">
              <label>Blacklisted Items</label>
              <span className="value">0</span>
            </div>
            <div className="stat-item">
              <label>Security Level</label>
              <span className="value enabled">High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurityPanel
