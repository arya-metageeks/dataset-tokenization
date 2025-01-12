const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Dataset NFT System", function () {
  let DatasetNFT, DatasetFactory, DatasetToken, USDT, CLUSTER;
  let nft, factory, usdt, cluster;
  let owner, user1, user2;

  const oneEther = ethers.parseEther("1");
  const days30 = 30 * 24 * 60 * 60;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy USDT contract
    const USDTContract = await ethers.getContractFactory("USDTTokenUpgradeable");
    usdt = await upgrades.deployProxy(USDTContract, [owner.address], {
      kind: 'uups',
      initializer: 'initialize'
    });
    await usdt.waitForDeployment();

    // Deploy CLUSTER token
    const ClusterContract = await ethers.getContractFactory("ClusterTokenUpgradeable");
    cluster = await upgrades.deployProxy(ClusterContract, [owner.address], {
      kind: 'uups',
      initializer: 'initialize'
    });
    await cluster.waitForDeployment();

    // Deploy NFT contract
    DatasetNFT = await ethers.getContractFactory("DatasetNFTUpgradeable");
    nft = await upgrades.deployProxy(DatasetNFT, [owner.address], {
      kind: 'uups',
      initializer: 'initialize'
    });
    await nft.waitForDeployment();

    // Deploy Factory contract
    DatasetFactory = await ethers.getContractFactory("DatasetFactoryUpgradeable");
    factory = await upgrades.deployProxy(
      DatasetFactory, 
      [await nft.getAddress(), await usdt.getAddress(), await cluster.getAddress()], 
      {
        kind: 'uups',
        initializer: 'initialize'
      }
    );
    await factory.waitForDeployment();

    // Set factory as authorized in NFT contract
    await nft.setFactory(await factory.getAddress());

    // Transfer some tokens to user1 for testing
    // Note: USDT uses 6 decimals
    await usdt.transfer(user1.address, ethers.parseUnits("1000", 6)); // 1000 USDT
    // CLUSTER uses 18 decimals
    await cluster.transfer(user1.address, ethers.parseEther("1000")); // 1000 CLUSTER
  });

  describe("Dataset Creation", function () {
    it("Should create a dataset with ETH payment mode", async function () {
      const datasetParams = {
        name: "ETH Dataset",
        description: "Test Description",
        uri: "ipfs://test",
        expiryDuration: days30,
        paymentMode: 0, // ETH
        prices: {
          fullAccessPrice: oneEther,
          d2cAccessPrice: ethers.parseEther("0.5"),
          expiryAccessPrice: ethers.parseEther("0.1")
        },
        customTokenSupply: 0
      };

      const tx = await factory.createDataset(
        datasetParams.name,
        datasetParams.description,
        datasetParams.uri,
        datasetParams.expiryDuration,
        datasetParams.paymentMode,
        datasetParams.prices,
        datasetParams.customTokenSupply
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return log.fragment.name === "DatasetCreated";
        } catch {
          return false;
        }
      });

      const dataset = await factory.datasets(event.args[0]);
      expect(dataset.paymentMode).to.equal(0); // ETH
      expect(dataset.customTokenAddress).to.equal(ethers.ZeroAddress);
    });

    it("Should create a dataset with USDT payment mode", async function () {
      const datasetParams = {
        name: "USDT Dataset",
        description: "Test Description",
        uri: "ipfs://test",
        expiryDuration: days30,
        paymentMode: 1, // USDT
        prices: {
          fullAccessPrice: ethers.parseUnits("10", 6), // 10 USDT
          d2cAccessPrice: ethers.parseUnits("5", 6),  // 5 USDT
          expiryAccessPrice: ethers.parseUnits("1", 6) // 1 USDT
        },
        customTokenSupply: 0
      };

      const tx = await factory.createDataset(
        datasetParams.name,
        datasetParams.description,
        datasetParams.uri,
        datasetParams.expiryDuration,
        datasetParams.paymentMode,
        datasetParams.prices,
        datasetParams.customTokenSupply
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return log.fragment.name === "DatasetCreated";
        } catch {
          return false;
        }
      });

      const dataset = await factory.datasets(event.args[0]);
      expect(dataset.paymentMode).to.equal(1); // USDT
      expect(dataset.prices.fullAccessPrice).to.equal(ethers.parseUnits("10", 6));
    });

    it("Should create a dataset with CLUSTER payment mode", async function () {
      const datasetParams = {
        name: "CLUSTER Dataset",
        description: "Test Description",
        uri: "ipfs://test",
        expiryDuration: days30,
        paymentMode: 2, // CLUSTER
        prices: {
          fullAccessPrice: ethers.parseEther("100"), // 100 CLUSTER
          d2cAccessPrice: ethers.parseEther("50"),   // 50 CLUSTER
          expiryAccessPrice: ethers.parseEther("10") // 10 CLUSTER
        },
        customTokenSupply: 0
      };

      const tx = await factory.createDataset(
        datasetParams.name,
        datasetParams.description,
        datasetParams.uri,
        datasetParams.expiryDuration,
        datasetParams.paymentMode,
        datasetParams.prices,
        datasetParams.customTokenSupply
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return log.fragment.name === "DatasetCreated";
        } catch {
          return false;
        }
      });

      const dataset = await factory.datasets(event.args[0]);
      expect(dataset.paymentMode).to.equal(2); // CLUSTER
      expect(dataset.prices.fullAccessPrice).to.equal(ethers.parseEther("100"));
    });
  });

  describe("Access Purchase", function () {
    let datasetId;

    beforeEach(async function () {
      // Create dataset with USDT payment mode
      const tx = await factory.createDataset(
        "USDT Dataset",
        "Description",
        "ipfs://test",
        days30,
        1, // USDT payment mode
        {
          fullAccessPrice: ethers.parseUnits("10", 6), // 10 USDT
          d2cAccessPrice: ethers.parseUnits("5", 6),   // 5 USDT
          expiryAccessPrice: ethers.parseUnits("1", 6)  // 1 USDT
        },
        0
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try { return log.fragment.name === "DatasetCreated"; } catch { return false; }
      });
      datasetId = event.args[0];
    });

    // it("Should allow USDT payment for access", async function () {
    //   // Approve USDT spending
    //   await usdt.connect(user1).approve(
    //     await factory.getAddress(), 
    //     ethers.parseUnits("1", 6) // 1 USDT for expiry access
    //   );

    //   await factory.connect(user1).purchaseAccess(datasetId, 1); // AccessType.Expiry
      
    //   const ownerBalance = await usdt.balanceOf(owner.address);
    //   expect(ownerBalance).to.equal(
    //     ethers.parseUnits("999000", 6) // Initial 1M - 1000 transferred to user1 + 1 received for access
    //   );
    //   expect(await factory.checkAccess(user1.address, datasetId)).to.be.true;
    // });

    it("Should allow CLUSTER payment for access", async function () {
      // Create dataset with CLUSTER payment mode
      const tx = await factory.createDataset(
        "CLUSTER Dataset",
        "Description",
        "ipfs://test",
        days30,
        2, // CLUSTER payment mode
        {
          fullAccessPrice: ethers.parseEther("100"),
          d2cAccessPrice: ethers.parseEther("50"),
          expiryAccessPrice: ethers.parseEther("10")
        },
        0
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try { return log.fragment.name === "DatasetCreated"; } catch { return false; }
      });
      const clusterId = event.args[0];

      // Approve CLUSTER spending
      await cluster.connect(user1).approve(
        await factory.getAddress(),
        ethers.parseEther("10") // 10 CLUSTER for expiry access
      );

      await factory.connect(user1).purchaseAccess(clusterId, 1); // AccessType.Expiry
      expect(await factory.checkAccess(user1.address, clusterId)).to.be.true;
    });

    it("Should handle expiry correctly", async function () {
      // Approve USDT spending
      await usdt.connect(user1).approve(
        await factory.getAddress(),
        ethers.parseUnits("1", 6)
      );

      await factory.connect(user1).purchaseAccess(datasetId, 1); // AccessType.Expiry
      expect(await factory.checkAccess(user1.address, datasetId)).to.be.true;
      
      await time.increase(days30 + 1);
      
      expect(await factory.checkAccess(user1.address, datasetId)).to.be.false;
    });

    it("Should prevent ETH payment for USDT dataset", async function () {
      await expect(
        factory.connect(user1).purchaseAccess(
          datasetId,
          1, // AccessType.Expiry
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWith("ETH not accepted for this dataset");
    });
  });

  describe("Custom Token Operations", function () {
    it("Should deploy custom token with correct supply", async function () {
      const customTokenSupply = ethers.parseEther("1000000"); // 1M tokens
      const tx = await factory.createDataset(
        "Custom Token Dataset",
        "Description",
        "ipfs://test",
        days30,
        3, // CUSTOM_TOKEN
        {
          fullAccessPrice: ethers.parseEther("100"),
          d2cAccessPrice: ethers.parseEther("50"),
          expiryAccessPrice: ethers.parseEther("10")
        },
        customTokenSupply
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try { return log.fragment.name === "DatasetCreated"; } catch { return false; }
      });

      const dataset = await factory.datasets(event.args[0]);
      const customToken = await ethers.getContractAt(
        "DatasetTokenUpgradeable",
        dataset.customTokenAddress
      );

      // Check if owner received all tokens
      // Check token name and symbol
      expect(await customToken.name()).to.equal("Dataset Token Custom Token Dataset");
      expect(await customToken.symbol()).to.equal("DTCustom Token Dataset");
      expect(await customToken.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000"));

    });
  });
});