// Domain minting upgrade with existing proxy address
const { ethers, upgrades } = require("hardhat");

async function main() {

  const proxyAddressCluster = "0xFBD9A9a879e8249aACc522dc23F67408F7bA3e18"; 
  const proxyAddressNFT = "0xa5C712dcd099B18f1230fB34211Cd39ad788e68C"; 
  const proxyAddressFactory = "0xB1427E552024fF906eF00D7B6972B61B8E689849"; 

  const adminAddressCluster = await upgrades.erc1967.getAdminAddress(proxyAddressCluster);
  const adminAddressNFT = await upgrades.erc1967.getAdminAddress(proxyAddressNFT);
  const adminAddressFactory = await upgrades.erc1967.getAdminAddress(proxyAddressFactory);
  
  console.log("Admin CLUSTER (ProxyAdmin) Address:", adminAddressCluster);
  console.log("Admin NFT (ProxyAdmin) Address:", adminAddressNFT);
  console.log("Admin FACTORY (ProxyAdmin) Address:", adminAddressFactory);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });