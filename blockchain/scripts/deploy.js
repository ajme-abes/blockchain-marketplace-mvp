// scripts/deploy.js
import pkg from "hardhat";
const { ethers, run } = pkg;
import fs from "fs";

async function main() {
  console.log("🚀 Deploying Marketplace contract to Polygon Amoy...");

  // Get deployer info
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // Get balance using ethers v6 syntax
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "MATIC");

  // Check if we have enough balance
  if (balance === 0n) {
    console.log("❌ Insufficient balance! Get test MATIC from:");
    console.log("🔗 https://faucet.polygon.technology/ (select Amoy)");
    return;
  }

  // Deploy contract
  console.log("📦 Deploying Marketplace contract...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy();
  
  console.log("⏳ Waiting for deployment...");
  await marketplace.waitForDeployment();

  const contractAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed to:", contractAddress);

  const deploymentTx = marketplace.deploymentTransaction();
  console.log("📝 Transaction hash:", deploymentTx.hash);

  // Wait for block confirmations
  console.log("⏳ Waiting for 5 block confirmations...");
  await deploymentTx.wait(5);
  console.log("✅ Deployment confirmed!");

  // Verify contract on Polygonscan
  console.log("🔍 Verifying contract on Polygonscan...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on Polygonscan!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.log("⚠️ Contract verification skipped:", error.message);
    }
  }

  // Save deployment info
  const contractInfo = {
    address: contractAddress,
    deployer: deployer.address,
    network: "polygon-amoy",
    chainId: 80002,
    deploymentTime: new Date().toISOString(),
    transactionHash: deploymentTx.hash,
    blockNumber: deploymentTx.blockNumber,
  };

  fs.writeFileSync("contract-info.json", JSON.stringify(contractInfo, null, 2));
  console.log("📄 Contract info saved to contract-info.json");

  // Useful links
  console.log("\n🔗 Useful Links:");
  console.log(`📊 Polygonscan: https://amoy.polygonscan.com/address/${contractAddress}`);
  console.log(`🔄 Explorer: https://amoy.polygonscan.com/tx/${deploymentTx.hash}`);
  console.log(`🎉 Deployment successful!`);
}

// Run the deploy script
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});