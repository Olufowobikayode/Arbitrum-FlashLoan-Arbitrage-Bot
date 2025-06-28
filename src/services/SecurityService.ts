export interface SecurityReport {
  target: string
  value: number
  signature: string
  riskLevel: number
  vulnerabilities: string[]
  warnings: string[]
  passed: boolean
  signatureAnalysis: string
}

export class SecurityService {
  private readonly ETHSIG_API = "https://api.ethsig.com/v1/signatures/"
  private blacklist: Set<string> = new Set()

  constructor() {
    this.loadBlacklist()
  }

  async analyzeTransaction(
    target: string,
    value: number,
    calldata: string,
    tokenIn?: string,
    amountIn?: number,
  ): Promise<SecurityReport> {
    const report: SecurityReport = {
      target,
      value,
      signature: calldata.slice(0, 10),
      riskLevel: 0,
      vulnerabilities: [],
      warnings: [],
      passed: true,
      signatureAnalysis: "No significant risk detected",
    }

    // 1. Blacklist check
    if (this.isBlacklisted(target) || this.isBlacklisted(report.signature)) {
      report.vulnerabilities.push("Blacklisted contract or signature")
      report.riskLevel = Math.max(report.riskLevel, 4)
    }

    // 2. Signature analysis
    const signatureRisk = await this.analyzeSignature(report.signature)
    report.riskLevel = Math.max(report.riskLevel, signatureRisk.level)
    report.signatureAnalysis = signatureRisk.message

    if (signatureRisk.level >= 2) {
      report.vulnerabilities.push(`Signature risk: ${signatureRisk.message}`)
    }

    // 3. Value-based risk assessment
    const tokenValue = this.calculateTokenValue(amountIn, tokenIn)
    if (tokenValue > 100000 && report.riskLevel >= 2) {
      report.riskLevel = Math.max(report.riskLevel, 3)
      report.vulnerabilities.push("High-value transaction with known risks")
    }

    // 4. Pattern detection
    if (this.detectHoneypotPattern(calldata)) {
      report.vulnerabilities.push("Potential honeypot pattern detected")
      report.riskLevel = Math.max(report.riskLevel, 3)
    }

    if (this.detectUniswapV2Pattern(calldata)) {
      report.warnings.push("Uniswap V2 router detected - may have high slippage")
      report.riskLevel = Math.max(report.riskLevel, 1)
    }

    // 5. Empty calldata with value
    if ((!calldata || calldata === "0x") && value > 0) {
      report.warnings.push("Value transfer with no calldata")
      report.riskLevel = Math.max(report.riskLevel, 1)
    }

    // Final assessment
    report.passed = report.riskLevel < 3

    return report
  }

  private async analyzeSignature(signature: string): Promise<{ level: number; message: string }> {
    if (this.isBlacklisted(signature)) {
      return { level: 4, message: "Manually blacklisted signature" }
    }

    try {
      const response = await fetch(`${this.ETHSIG_API}${signature}`, {
        timeout: 3000,
      })

      if (response.ok) {
        const data = await response.json()
        const severity = data.severity || 0

        const messages = {
          0: "No significant risk detected",
          1: "Low risk: Known issues below threshold",
          2: "Medium risk: Potential vulnerability",
          3: "HIGH RISK: Known vulnerable pattern",
          4: "CRITICAL RISK: Blacklisted signature",
        }

        return {
          level: severity,
          message: messages[severity as keyof typeof messages] || "Unknown risk",
        }
      }
    } catch (error) {
      console.error("EthSig API error:", error)
    }

    return { level: 0, message: "Unknown signature" }
  }

  private calculateTokenValue(amount?: number, tokenAddress?: string): number {
    if (!amount || !tokenAddress) return 0

    // Simplified token value calculation
    // In a real implementation, this would fetch current token prices
    const tokenPrices: { [key: string]: number } = {
      "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1": 2000, // WETH
      "0xaf88d065e77c8cC2239327C5EDb3A432268e5831": 1, // USDC
      "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9": 1, // USDT
      "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1": 1, // DAI
    }

    const price = tokenPrices[tokenAddress] || 1
    return (amount / 1e18) * price // Assuming 18 decimals
  }

  private detectHoneypotPattern(calldata: string): boolean {
    const honeypotPatterns = [
      /00000000.*00000000/i, // Excessive zeros
      /deadbeef/i, // Suspicious constants
      /c0ffee/i,
      /12345678/i,
      /a55e55ed/i, // Known honeypot signature
    ]

    return honeypotPatterns.some((pattern) => pattern.test(calldata))
  }

  private detectUniswapV2Pattern(calldata: string): boolean {
    const uniswapV2Patterns = [
      /a9059cbb/i, // transfer
      /095ea7b3/i, // approve
      /38ed1739/i, // swapExactTokensForTokens
      /8803dbee/i, // swapTokensForExactTokens
      /5c11d795/i, // swapExactTokensForTokensSupportingFeeOnTransferTokens
      /18cbafe5/i, // swapExactTokensForETH
    ]

    return uniswapV2Patterns.some((pattern) => pattern.test(calldata))
  }

  private isBlacklisted(item: string): boolean {
    return this.blacklist.has(item.toLowerCase())
  }

  addToBlacklist(item: string) {
    this.blacklist.add(item.toLowerCase())
    this.saveBlacklist()
  }

  removeFromBlacklist(item: string) {
    this.blacklist.delete(item.toLowerCase())
    this.saveBlacklist()
  }

  private loadBlacklist() {
    const saved = localStorage.getItem("securityBlacklist")
    if (saved) {
      try {
        const items = JSON.parse(saved)
        this.blacklist = new Set(items)
      } catch (error) {
        console.error("Error loading blacklist:", error)
      }
    }
  }

  private saveBlacklist() {
    const items = Array.from(this.blacklist)
    localStorage.setItem("securityBlacklist", JSON.stringify(items))
  }

  generateSecurityReport(report: SecurityReport): string {
    const status = report.passed ? "✅ SAFE" : "❌ UNSAFE"
    const output = [
      `Security Report: ${status}`,
      `Target: ${report.target}`,
      `Signature: ${report.signature}`,
      `Risk Level: ${report.riskLevel}`,
      `Analysis: ${report.signatureAnalysis}`,
    ]

    if (report.vulnerabilities.length > 0) {
      output.push("\nVulnerabilities:")
      report.vulnerabilities.forEach((vuln) => {
        output.push(`- ${vuln}`)
      })
    }

    if (report.warnings.length > 0) {
      output.push("\nWarnings:")
      report.warnings.forEach((warning) => {
        output.push(`- ${warning}`)
      })
    }

    return output.join("\n")
  }
}
