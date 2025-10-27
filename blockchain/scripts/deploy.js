import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";

async function main() {
  console.log("🚀 Deploying Marketplace contract...");

  // ✅ Get signers
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // ✅ Deploy contract (Ethers v5 syntax)
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy();

  // ✅ Wait for deployment (Ethers v5 syntax)
  await marketplace.deployed();
  console.log("✅ Marketplace deployed to:", marketplace.address);

  // ✅ Get network info
  const network = await ethers.provider.getNetwork();

  // Save contract info to file
  const contractInfo = {
    address: marketplace.address,
    deployer: deployer.address,
    network: network.name || "localhost",
    chainId: network.chainId,
    deploymentTime: new Date().toISOString()
  };

  fs.writeFileSync("contract-info.json", JSON.stringify(contractInfo, null, 2));
  console.log("📄 Contract info saved to contract-info.json");
}

// ✅ Always wrap main in catch block
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});