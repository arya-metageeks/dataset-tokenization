const { ethers, upgrades } = require("hardhat");

async function main() {

  // 1. Deploy USDT Token
  console.log("\nDeploying Inference Contract..");
  const InferenceRegistry = await ethers.getContractFactory("InferenceRegistry");
  const inferenceRegistry = await upgrades.deployProxy(InferenceRegistry, {
    initializer: 'initialize',
    kind: 'uups'
  });
  await inferenceRegistry.waitForDeployment();
  const inferenceRegistryAddress = await inferenceRegistry.getAddress();
  console.log("inferenceRegistryAddress deployed to:", inferenceRegistryAddress);

  console.log("\inferenceRegistry:");
  console.log("Proxy:", inferenceRegistryAddress);
  console.log("Implementation:", await upgrades.erc1967.getImplementationAddress(inferenceRegistryAddress));
  console.log("Admin:", await upgrades.erc1967.getAdminAddress(inferenceRegistryAddress));

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });