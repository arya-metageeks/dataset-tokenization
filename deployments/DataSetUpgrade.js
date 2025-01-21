// Domain minting upgrade with existing proxy address
const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "0x70972322Ef49eDb6E11B77fA118EAcD499551da6";

  const DataFactory = await ethers.getContractFactory(
    "DatasetFactoryUpgradeable"
  );

  const upgraded = await upgrades.upgradeProxy(proxyAddress, DataFactory);

  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
  console.log("Admin (ProxyAdmin) Address:", adminAddress);

  // console.log("DomainMintingUpgradable has been upgraded to:", upgraded.target);
  console.log(
    "New Implementation Address:",
    await upgrades.erc1967.getImplementationAddress(proxyAddress)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
