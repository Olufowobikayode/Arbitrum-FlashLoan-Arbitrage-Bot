const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("FlashloanArbitrageBot", () => {
  let bot, owner, addr1, addr2
  let mockToken, mockAaveProvider

  const AAVE_ADDRESSES_PROVIDER = "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb"

  beforeEach(async () => {
    ;[owner, addr1, addr2] = await ethers.getSigners()

    // Deploy mock ERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20")
    mockToken = await MockERC20.deploy("Test Token", "TEST", 18)
    await mockToken.deployed()

    // Deploy the bot contract
    const FlashloanArbitrageBot = await ethers.getContractFactory("FlashloanArbitrageBot")
    bot = await FlashloanArbitrageBot.deploy(AAVE_ADDRESSES_PROVIDER)
    await bot.deployed()
  })

  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      expect(await bot.owner()).to.equal(owner.address)
    })

    it("Should initialize with correct default values", async () => {
      expect(await bot.maxGasPrice()).to.equal(ethers.utils.parseUnits("500", "gwei"))
      expect(await bot.slippageTolerance()).to.equal(300)
      expect(await bot.minProfitThreshold()).to.equal(ethers.utils.parseEther("0.001"))
      expect(await bot.emergencyStopActive()).to.equal(false)
    })
  })

  describe("Configuration", () => {
    it("Should allow owner to set gas price", async () => {
      const newGasPrice = ethers.utils.parseUnits("300", "gwei")
      await bot.setGasPrice(newGasPrice)
      expect(await bot.maxGasPrice()).to.equal(newGasPrice)
    })

    it("Should not allow non-owner to set gas price", async () => {
      const newGasPrice = ethers.utils.parseUnits("300", "gwei")
      await expect(bot.connect(addr1).setGasPrice(newGasPrice)).to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("Should allow owner to set slippage", async () => {
      await bot.setSlippage(500)
      expect(await bot.slippageTolerance()).to.equal(500)
    })

    it("Should not allow slippage above 10%", async () => {
      await expect(bot.setSlippage(1001)).to.be.revertedWith("Slippage too high")
    })

    it("Should allow owner to blacklist tokens", async () => {
      await bot.blacklistToken(mockToken.address, true)
      expect(await bot.blacklistedTokens(mockToken.address)).to.equal(true)
    })

    it("Should allow owner to set emergency stop", async () => {
      await bot.setEmergencyStop(true)
      expect(await bot.emergencyStopActive()).to.equal(true)
    })
  })

  describe("Security", () => {
    it("Should prevent execution when emergency stop is active", async () => {
      await bot.setEmergencyStop(true)

      const tokens = [mockToken.address, mockToken.address]
      const amounts = [ethers.utils.parseEther("1"), ethers.utils.parseEther("0.9")]
      const targets = [ethers.constants.AddressZero, ethers.constants.AddressZero]
      const calldatas = ["0x", "0x"]
      const useAaveFlags = [false, false]

      await expect(bot.executeBundle(tokens, amounts, targets, calldatas, useAaveFlags)).to.be.revertedWith(
        "Emergency stop is active",
      )
    })

    it("Should prevent execution with blacklisted tokens", async () => {
      await bot.blacklistToken(mockToken.address, true)

      const tokens = [mockToken.address, mockToken.address]
      const amounts = [ethers.utils.parseEther("1"), ethers.utils.parseEther("0.9")]
      const targets = [ethers.constants.AddressZero, ethers.constants.AddressZero]
      const calldatas = ["0x", "0x"]
      const useAaveFlags = [false, false]

      await expect(bot.executeBundle(tokens, amounts, targets, calldatas, useAaveFlags)).to.be.revertedWith(
        "Token blacklisted",
      )
    })

    it("Should prevent execution with invalid token addresses", async () => {
      const tokens = [ethers.constants.AddressZero, mockToken.address]
      const amounts = [ethers.utils.parseEther("1"), ethers.utils.parseEther("0.9")]
      const targets = [ethers.constants.AddressZero, ethers.constants.AddressZero]
      const calldatas = ["0x", "0x"]
      const useAaveFlags = [false, false]

      await expect(bot.executeBundle(tokens, amounts, targets, calldatas, useAaveFlags)).to.be.revertedWith(
        "Invalid token addresses",
      )
    })
  })

  describe("Statistics", () => {
    it("Should return correct initial statistics", async () => {
      const stats = await bot.getStats()
      expect(stats.trades).to.equal(0)
      expect(stats.profit).to.equal(0)
      expect(stats.failures).to.equal(0)
      expect(stats.lastExecution).to.equal(0)
      expect(stats.successRate).to.equal(0)
    })

    it("Should return correct configuration", async () => {
      const config = await bot.getConfiguration()
      expect(config.gasPrice).to.equal(ethers.utils.parseUnits("500", "gwei"))
      expect(config.slippage).to.equal(300)
      expect(config.minProfit).to.equal(ethers.utils.parseEther("0.001"))
      expect(config.emergencyStop).to.equal(false)
      expect(config.isPaused).to.equal(false)
    })
  })

  describe("Withdrawal", () => {
    beforeEach(async () => {
      // Send some tokens to the contract
      await mockToken.mint(bot.address, ethers.utils.parseEther("10"))
    })

    it("Should allow owner to withdraw tokens", async () => {
      const amount = ethers.utils.parseEther("5")
      const initialBalance = await mockToken.balanceOf(owner.address)

      await bot.withdrawToken(mockToken.address, amount)

      const finalBalance = await mockToken.balanceOf(owner.address)
      expect(finalBalance.sub(initialBalance)).to.equal(amount)
    })

    it("Should not allow non-owner to withdraw tokens", async () => {
      const amount = ethers.utils.parseEther("5")

      await expect(bot.connect(addr1).withdrawToken(mockToken.address, amount)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })

    it("Should allow owner to withdraw ETH", async () => {
      // Send ETH to contract
      await owner.sendTransaction({
        to: bot.address,
        value: ethers.utils.parseEther("1"),
      })

      const initialBalance = await owner.getBalance()
      const tx = await bot.withdrawETH(ethers.utils.parseEther("0.5"))
      const receipt = await tx.wait()
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice)

      const finalBalance = await owner.getBalance()
      const expectedBalance = initialBalance.add(ethers.utils.parseEther("0.5")).sub(gasUsed)

      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.utils.parseEther("0.001"))
    })
  })

  describe("Pause functionality", () => {
    it("Should allow owner to pause and unpause", async () => {
      await bot.pause()
      expect(await bot.paused()).to.equal(true)

      await bot.unpause()
      expect(await bot.paused()).to.equal(false)
    })

    it("Should prevent execution when paused", async () => {
      await bot.pause()

      const tokens = [mockToken.address, mockToken.address]
      const amounts = [ethers.utils.parseEther("1"), ethers.utils.parseEther("0.9")]
      const targets = [ethers.constants.AddressZero, ethers.constants.AddressZero]
      const calldatas = ["0x", "0x"]
      const useAaveFlags = [false, false]

      await expect(bot.executeBundle(tokens, amounts, targets, calldatas, useAaveFlags)).to.be.revertedWith(
        "Pausable: paused",
      )
    })
  })
})
