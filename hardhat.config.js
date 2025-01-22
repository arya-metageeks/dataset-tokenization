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

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
    },

    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: ["3ef776252726ab9f543bcd4dc0cc3e447a58ac1b0fa6df14ba7cc18a022f7685"], 
      chainId: 421614,
      timeout: 100000, // 60 seconds
      confirmations: 2,
      // gasMultiplier: 1.2
    },

    paradoxChain: {
      url: "https://paradoxchain.rpc.caldera.xyz/http",
      accounts: ["96084ec963b94053c4f6b44c370aaf64552accf551a78442dbdf022a9241499d"], 
      chainId:  5302405,
      timeout: 100000, // 60 seconds
      confirmations: 2,
      // gasMultiplier: 1.2
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: "KNIBW9U4QAQUCVZEP66GTNXQ7ZJS463A59",
    },
  },
};

// npx hardhat verify --network arbitrumSepolia 0xbF9cE208649Db0401977b362E235f87F36EF8b05

