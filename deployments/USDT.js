const { ethers, upgrades } = require("hardhat");

async function main() {
    const deployer = "0x073043723Abd992080bbA483f6e5F6B36DcdF3b6";
    const USDTTokenUpgradeable = await ethers.getContractFactory("USDTTokenUpgradeable");
    
    // Ensure the deployer address is passed inside an array
    const usdtToken = await upgrades.deployProxy(USDTTokenUpgradeable, [deployer], { initializer: "initialize" });

    await usdtToken.waitForDeployment();
    console.log("USDTTokenUpgradeable deployed to:", await usdtToken.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
