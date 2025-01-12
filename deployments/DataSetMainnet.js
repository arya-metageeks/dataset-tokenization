const { ethers, upgrades } = require("hardhat");

async function main() {

  const usdtAddress = "0x01f83Ee1FFC925c45AF7e307CDa248fFd3EF00A7"
  const owner = "0x2Ba1Bf6aB49c0d86CDb12D69A777B6dF39AB79D9"
  // 1. Deploy CLUSTER Token
  console.log("\nDeploying CLUSTER Token...");
  const ClusterToken = await ethers.getContractFactory("ClusterTokenUpgradeable");
  const cluster = await upgrades.deployProxy(ClusterToken, [owner], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await cluster.waitForDeployment();
  const clusterAddress = await cluster.getAddress();
  console.log("CLUSTER Token deployed to:", clusterAddress);

  // 2. Deploy NFT contract
  console.log("\nDeploying NFT Contract...");
  const DatasetNFT = await ethers.getContractFactory("DatasetNFTUpgradeable");
  const nft = await upgrades.deployProxy(DatasetNFT, [owner], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("NFT Contract deployed to:", nftAddress);

  // 3. Deploy Factory contract with token addresses
  console.log("\nDeploying Factory Contract...");
  const DatasetFactory = await ethers.getContractFactory("DatasetFactoryUpgradeable");
  const factory = await upgrades.deployProxy(
    DatasetFactory, 
    [nftAddress, usdtAddress, clusterAddress], 
    {
      initializer: 'initialize',
      kind: 'uups'
    }
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory Contract deployed to:", factoryAddress);

  // 4. Set factory address in NFT contract
  console.log("\nSetting factory permissions...");
  const setFactoryTx = await nft.setFactory(factoryAddress);
  await setFactoryTx.wait();
  console.log("Factory permissions set");

  console.log("\nWaiting for deployments to be indexed...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds delay

  // Print all deployment information
  console.log("\nDeployment Summary:");
  console.log("===================");

  console.log("\nCLUSTER Token:");
  console.log("Proxy:", clusterAddress);
  console.log("Implementation:", await upgrades.erc1967.getImplementationAddress(clusterAddress));
  console.log("Admin:", await upgrades.erc1967.getAdminAddress(clusterAddress));
  console.log("Initial Supply:", await cluster.totalSupply());
  console.log("Decimals:", await cluster.decimals());

  console.log("\nDataset NFT:");
  console.log("Proxy:", nftAddress);
  console.log("Implementation:", await upgrades.erc1967.getImplementationAddress(nftAddress));
  console.log("Admin:", await upgrades.erc1967.getAdminAddress(nftAddress));

  console.log("\nDataset Factory:");
  console.log("Proxy:", factoryAddress);
  console.log("Implementation:", await upgrades.erc1967.getImplementationAddress(factoryAddress));
  console.log("Admin:", await upgrades.erc1967.getAdminAddress(factoryAddress));

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });