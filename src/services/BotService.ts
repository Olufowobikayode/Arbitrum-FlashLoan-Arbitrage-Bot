export class BotService {
  private baseUrl = "/api"

  async fetchOpportunities(token = "USDC") {
    try {
      const response = await fetch(`${this.baseUrl}/arbitrage?token=${token}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch opportunities")
      }

      return data.opportunities || []
    } catch (error) {
      console.error("Error fetching opportunities:", error)
      return []
    }
  }

  async executeArbitrage(params: {
    token: string
    amount: number
    provider: string
    opportunityId: string
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/arbitrage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to execute arbitrage")
      }

      return data
    } catch (error) {
      console.error("Error executing arbitrage:", error)
      throw error
    }
  }

  async getGasPrice() {
    try {
      // Mock gas price for now
      return {
        standard: 20,
        fast: 25,
        instant: 30,
      }
    } catch (error) {
      console.error("Error fetching gas price:", error)
      return {
        standard: 20,
        fast: 25,
        instant: 30,
      }
    }
  }

  async validateContract(address: string) {
    try {
      // Mock contract validation
      if (!address || !address.startsWith("0x") || address.length !== 42) {
        return { valid: false, error: "Invalid contract address format" }
      }

      return { valid: true, verified: true, name: "FlashloanArbitrageBot" }
    } catch (error) {
      console.error("Error validating contract:", error)
      return { valid: false, error: "Failed to validate contract" }
    }
  }
}
