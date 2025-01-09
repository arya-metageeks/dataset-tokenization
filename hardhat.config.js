require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
// require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  // defaultNetwork: "localhost",

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
    },

    // sepolia: {
    //   url: "https://rpc.sepolia.org", // Ethereum Sepolia RPC URL
    //   accounts: [process.env.MASTER_PRIVATE_KEY_TESTNET], // Deployment wallet private key for Sepolia
    //   chainId: 11155111, // Sepolia chain ID
    // },

    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: ["3ef776252726ab9f543bcd4dc0cc3e447a58ac1b0fa6df14ba7cc18a022f7685"], 
      chainId: 421614,
      timeout: 100000, // 60 seconds
      confirmations: 2,
      // gasMultiplier: 1.2
    },

    // arbitrumOne: {
    //   url: "https://arb1.arbitrum.io/rpc",
    //   accounts: [process.env.MASTER_PRIVATE_KEY], 
    //   chainId: 42161, // Arbitrum One chain ID
    // },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: "KNIBW9U4QAQUCVZEP66GTNXQ7ZJS463A59",
      // sepolia: process.env.ETHERSCAN_API_KEY
    },
  },
};

// npx hardhat verify --network arbitrumSepolia 0xbF9cE208649Db0401977b362E235f87F36EF8b05

