// scripts/verify-cluster.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  // Proxy address
  const PROXY_ADDRESS = "0xb27a5d59255a65BEd9f21CB5e2499Cc8D5759b3e";
  
  try {
    // Get implementation address
    const implAddress = await upgrades.erc1967.getImplementationAddress(
      PROXY_ADDRESS
    );
    console.log("Implementation address:", implAddress);

    // Get the deployment transaction data
    const ClusterToken = await ethers.getContractFactory("ClusterTokenUpgradeable");
    const data = ClusterToken.interface.encodeFunctionData('initialize', [
      "0x2Ba1Bf6aB49c0d86CDb12D69A777B6dF39AB79D9" // owner address
    ]);

    console.log("Verifying implementation contract...");
    await hre.run("verify:verify", {
      address: implAddress,
      contract: "contracts/Cluster.sol:ClusterTokenUpgradeable"
    });

    console.log("Verifying proxy contract...");
    await hre.run("verify:verify", {
      address: PROXY_ADDRESS,
      constructorArguments: [
        implAddress,
        data
      ],
      contract: "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
    });

  } catch (error) {
    console.error("Error during verification:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });