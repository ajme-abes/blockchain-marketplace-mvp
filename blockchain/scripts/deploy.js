const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // ✅ Corrected balance method for Ethers v6
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // ✅ Corrected deployment method
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy();

  await marketplace.waitForDeployment(); // replaces `.deployed()`

  console.log("✅ Marketplace contract deployed successfully!");
  console.log("Contract address:", marketplace.target);
  console.log("Deployer address:", deployer.address);

  // ✅ Save contract info to file
  const contractInfo = {
    address: marketplace.target,
    deployer: deployer.address,
    network: "localhost",
  };
  fs.writeFileSync("../contract-info.json", JSON.stringify(contractInfo, null, 2));

  return marketplace.target;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
