const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Deploying upgradeable contracts...");

  // Deploy NFT contract first
  console.log("Deploying NFT Contract...");
  const DatasetNFT = await ethers.getContractFactory("DatasetNFTUpgradeable");
  const nft = await upgrades.deployProxy(DatasetNFT, [], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("NFT Contract deployed to:", nftAddress);

  // Then, deploy the Factory contract
  console.log("Deploying Factory Contract...");
  const DatasetFactory = await ethers.getContractFactory("DatasetFactoryUpgradeable");
  const factory = await upgrades.deployProxy(DatasetFactory, [nftAddress], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory Contract deployed to:", factoryAddress);

  // Set factory address in NFT contract
  console.log("Setting factory permissions...");
  const setFactoryTx = await nft.setFactory(factoryAddress);
  await setFactoryTx.wait();
  console.log("Factory permissions set");

  // DatasetToken contract will be deployed by the factory when creating new datasets

  console.log("Waiting for deployments to be indexed...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds delay

  // Print all addresses
  console.log("\nDeployed Addresses:");
  console.log("====================");
  console.log("NFT Proxy:", nftAddress);
  console.log("NFT Implementation:", await upgrades.erc1967.getImplementationAddress(nftAddress));
  console.log("NFT Admin:", await upgrades.erc1967.getAdminAddress(nftAddress));
  console.log("Factory Proxy:", factoryAddress);
  console.log("Factory Implementation:", await upgrades.erc1967.getImplementationAddress(factoryAddress));
  console.log("Factory Admin:", await upgrades.erc1967.getAdminAddress(factoryAddress));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });