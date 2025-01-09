const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Dataset NFT System", function () {
  let DatasetNFT, DatasetFactory, DatasetToken;
  let nft, factory;
  let owner, user1, user2;

  const oneEther = ethers.parseEther("1");
  const days30 = 30 * 24 * 60 * 60;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy NFT contract
    DatasetNFT = await ethers.getContractFactory("DatasetNFTUpgradeable");
    nft = await upgrades.deployProxy(DatasetNFT, [], {
      kind: 'uups',
      initializer: 'initialize'
    });
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();

    // Deploy Factory contract
    DatasetFactory = await ethers.getContractFactory("DatasetFactoryUpgradeable");
    factory = await upgrades.deployProxy(DatasetFactory, [nftAddress], {
      kind: 'uups',
      initializer: 'initialize'
    });
    await factory.waitForDeployment();

    // Set factory as authorized in NFT contract
    await nft.setFactory(await factory.getAddress());
  });

  describe("Dataset Creation", function () {
    it("Should create a new dataset with correct parameters", async function () {
      const datasetParams = {
        name: "Test Dataset",
        description: "Test Description",
        uri: "ipfs://test",
        fullAccessTokens: oneEther,
        d2cAccessTokens: ethers.parseEther("0.5"),
        expiryAccessTokens: ethers.parseEther("0.1"),
        expiryDuration: days30,
        tokenPrice: ethers.parseEther("0.01")
      };

      const tx = await factory.createDataset(
        datasetParams.name,
        datasetParams.description,
        datasetParams.uri,
        datasetParams.fullAccessTokens,
        datasetParams.d2cAccessTokens,
        datasetParams.expiryAccessTokens,
        datasetParams.expiryDuration,
        datasetParams.tokenPrice
      );

      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          return log.fragment.name === "DatasetCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      
      const datasetId = event.args[0];
      const dataset = await factory.datasets(datasetId);
      
      expect(dataset.name).to.equal(datasetParams.name);
      expect(dataset.description).to.equal(datasetParams.description);
      expect(dataset.uri).to.equal(datasetParams.uri);
      expect(dataset.active).to.be.true;
    });

    it("Should mint NFT to dataset creator", async function () {
      const tx = await factory.createDataset(
        "Test Dataset",
        "Description",
        "ipfs://test",
        oneEther,
        ethers.parseEther("0.5"),
        ethers.parseEther("0.1"),
        days30,
        ethers.parseEther("0.01")
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try { return log.fragment.name === "DatasetCreated"; } catch { return false; }
      });
      const datasetId = event.args[0];

      expect(await nft.ownerOf(datasetId)).to.equal(owner.address);
    });
  });

  describe("Token Operations", function () {
    let datasetToken;
    let datasetId;

    beforeEach(async function () {
      const tx = await factory.createDataset(
        "Test Dataset",
        "Description",
        "ipfs://test",
        oneEther,
        ethers.parseEther("0.5"),
        ethers.parseEther("0.1"),
        days30,
        ethers.parseEther("0.01")
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try { return log.fragment.name === "DatasetCreated"; } catch { return false; }
      });
      
      datasetId = event.args[0];
      const dataset = await factory.datasets(datasetId);
      datasetToken = await ethers.getContractAt("DatasetTokenUpgradeable", dataset.tokenAddress);
    });

    it("Should allow users to mint tokens", async function () {
      const mintValue = ethers.parseEther("0.1");
      await datasetToken.connect(user1).mintTokens({ value: mintValue });

      const tokenPrice = await datasetToken.tokenPrice();
      const expectedTokens = (mintValue * BigInt(10**18)) / tokenPrice;
      expect(await datasetToken.balanceOf(user1.address)).to.equal(expectedTokens);
    });

    it("Should transfer payment to token owner", async function () {
      const mintValue = ethers.parseEther("0.1");
      const initialBalance = await ethers.provider.getBalance(owner.address);

      await datasetToken.connect(user1).mintTokens({ value: mintValue });

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance - initialBalance).to.equal(mintValue);
    });
  });

  describe("Access Control", function () {
    let datasetToken;
    let datasetId;

    beforeEach(async function () {
      const tx = await factory.createDataset(
        "Test Dataset",
        "Description",
        "ipfs://test",
        oneEther,
        ethers.parseEther("0.5"),
        ethers.parseEther("0.1"),
        days30,
        ethers.parseEther("0.01")
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try { return log.fragment.name === "DatasetCreated"; } catch { return false; }
      });
      
      datasetId = event.args[0];
      const dataset = await factory.datasets(datasetId);
      datasetToken = await ethers.getContractAt("DatasetTokenUpgradeable", dataset.tokenAddress);

      // Mint and approve tokens for user1
      await datasetToken.connect(user1).mintTokens({ value: ethers.parseEther("1") });
      await datasetToken.connect(user1).approve(await factory.getAddress(), oneEther);
    });

    it("Should grant correct access rights", async function () {
      await factory.connect(user1).purchaseAccess(datasetId, 1); // AccessType.Expiry
      
      const access = await factory.accessRights(user1.address, datasetId);
      expect(access.accessType).to.equal(1); // AccessType.Expiry
      expect(access.active).to.be.true;
    });

    it("Should enforce expiry time", async function () {
      await factory.connect(user1).purchaseAccess(datasetId, 1); // AccessType.Expiry
      
      expect(await factory.checkAccess(user1.address, datasetId)).to.be.true;
      
      await time.increase(days30 + 1);
      
      expect(await factory.checkAccess(user1.address, datasetId)).to.be.false;
    });

    it("Should allow owner to revoke access", async function () {
      await factory.connect(user1).purchaseAccess(datasetId, 1);
      await factory.revokeAccess(user1.address, datasetId);
      
      expect(await factory.checkAccess(user1.address, datasetId)).to.be.false;
    });

    it("Should not allow non-owners to revoke access", async function () {
      await factory.connect(user1).purchaseAccess(datasetId, 1);
      
      await expect(
        factory.connect(user2).revokeAccess(user1.address, datasetId)
      ).to.be.revertedWith("Only dataset owner can revoke access");
    });
  });

  describe("Dataset Management", function () {
    let datasetId;

    beforeEach(async function () {
      const tx = await factory.createDataset(
        "Test Dataset",
        "Description",
        "ipfs://test",
        oneEther,
        ethers.parseEther("0.5"),
        ethers.parseEther("0.1"),
        days30,
        ethers.parseEther("0.01")
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try { return log.fragment.name === "DatasetCreated"; } catch { return false; }
      });
      datasetId = event.args[0];
    });

    it("Should allow owner to update URI", async function () {
      const newUri = "ipfs://newtest";
      await factory.updateDatasetURI(datasetId, newUri);
      
      const dataset = await factory.datasets(datasetId);
      expect(dataset.uri).to.equal(newUri);
      expect(dataset.version).to.equal(2);
    });

    it("Should not allow non-owners to update URI", async function () {
      await expect(
        factory.connect(user1).updateDatasetURI(datasetId, "ipfs://newtest")
      ).to.be.revertedWith("Only dataset owner can update URI");
    });
  });
});