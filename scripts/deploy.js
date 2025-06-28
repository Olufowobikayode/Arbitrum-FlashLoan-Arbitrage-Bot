const { ethers } = require("hardhat")
const hre = require("hardhat")

async function main() {
  console.log("🚀 Deploying FlashloanArbitrageBot to Arbitrum...")

  // Arbitrum Aave V3 Pool Addresses Provider
  const AAVE_ADDRESSES_PROVIDER = "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb"

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("📝 Deploying with account:", deployer.address)
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH")

  // Get the contract factory
  const FlashloanArbitrageBot = await ethers.getContractFactory("FlashloanArbitrageBot")

  // Deploy the contract
  console.log("⏳ Deploying contract...")
  const bot = await FlashloanArbitrageBot.deploy(AAVE_ADDRESSES_PROVIDER)
  await bot.deployed()

  console.log("✅ FlashloanArbitrageBot deployed to:", bot.address)
  console.log("🔗 Transaction hash:", bot.deployTransaction.hash)

  // Wait for confirmations
  console.log("⏳ Waiting for block confirmations...")
  await bot.deployTransaction.wait(3)

  // Verify contract on Arbiscan (optional)
  if (process.env.ARBISCAN_API_KEY) {
    console.log("🔍 Verifying contract on Arbiscan...")
    try {
      await hre.run("verify:verify", {
        address: bot.address,
        constructorArguments: [AAVE_ADDRESSES_PROVIDER],
      })
      console.log("✅ Contract verified successfully")
    } catch (error) {
      console.log("❌ Verification failed:", error.message)
    }
  } else {
    console.log("⚠️  Skipping verification (no ARBISCAN_API_KEY)")
  }

  // Set initial configuration
  console.log("⚙️  Setting initial configuration...")

  try {
    // Set gas price to 200 Gwei
    const gasPriceTx = await bot.setGasPrice(ethers.utils.parseUnits("200", "gwei"))
    await gasPriceTx.wait()
    console.log("✅ Gas price set to 200 Gwei")

    // Set slippage to 1.5%
    const slippageTx = await bot.setSlippage(150)
    await slippageTx.wait()
    console.log("✅ Slippage set to 1.5%")

    // Set minimum profit threshold to 0.001 ETH
    const profitTx = await bot.setMinProfitThreshold(ethers.utils.parseEther("0.001"))
    await profitTx.wait()
    console.log("✅ Minimum profit threshold set to 0.001 ETH")
  } catch (error) {
    console.log("⚠️  Configuration failed:", error.message)
  }

  console.log("\n🎉 Deployment and configuration complete!")
  console.log("📋 Contract Details:")
  console.log("   Address:", bot.address)
  console.log("   Owner:", await bot.owner())
  console.log("   Network: Arbitrum One (Chain ID: 42161)")

  console.log("\n📝 Next Steps:")
  console.log("1. Update your .env file with:")
  console.log(`   REACT_APP_CONTRACT_ADDRESS=${bot.address}`)
  console.log("2. Fund the contract with initial capital")
  console.log("3. Test with small amounts first")
  console.log("4. Monitor through your React dashboard")

  return bot.address
}

main()
  .then((address) => {
    console.log(`\n🚀 Contract deployed successfully at: ${address}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Deployment failed:", error)
    process.exit(1)
  })
