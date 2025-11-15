import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import dotenv from "dotenv";

dotenv.config();

export default {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    amoy: {
      url: process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
    },
  },

  // ✅ CORRECT SETTINGS — using Etherscan API V2
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,  // <-- IMPORTANT
    customChains: [
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
  },

  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
};
