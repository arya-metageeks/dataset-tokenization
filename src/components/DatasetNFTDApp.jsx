import React, { useState, useEffect } from "react";
import {
  BrowserProvider,
  Contract,
  formatEther,
  formatUnits,
  parseEther,
} from "ethers";
import {
  FACTORY_ADDRESS,
  NFT_ADDRESS,
  FACTORY_ABI,
  NFT_ABI,
  TOKEN_ABI,
} from "../contracts/Constants";
import { DatasetCard } from "./DatasetCard";
import { CreateDatasetForm } from "./CreateDataset";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { TokenPurchase } from "./TokenPurchase";

const DatasetNFTDApp = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDatasets, setUserDatasets] = useState([]);
  const [accessibleDatasets, setAccessibleDatasets] = useState([]);

  const [selectedDataset, setSelectedDataset] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    uri: "",
    fullAccessTokens: "",
    d2cAccessTokens: "",
    expiryAccessTokens: "",
    expiryDuration: "",
    tokenPrice: "",
  });

  useEffect(() => {
    const initEthers = async () => {
      if (window.ethereum) {
        try {
          const browserProvider = new BrowserProvider(window.ethereum);
          const signer = await browserProvider.getSigner();
          const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

          setProvider(browserProvider);
          setSigner(signer);
          setFactoryContract(contract);

          const address = await signer.getAddress();
          setAccount(address);

          setLoading(false);
        } catch (error) {
          console.error("Error initializing:", error);
        }
      }
    };

    initEthers();
  }, []);

  const handlePurchaseClick = async (datasetId, accessType) => {
    try {
      const dataset = datasets.find((d) => d.id === datasetId);
      if (!dataset) return;

      // Create token contract instance
      const newTokenContract = new Contract(
        dataset.tokenAddress,
        TOKEN_ABI,
        signer
      );
      setTokenContract(newTokenContract);
      setSelectedDataset(dataset);
    } catch (error) {
      console.error("Error setting up token purchase:", error);
    }
  };

  const loadDatasets = async () => {
    if (!factoryContract || !account) return;

    try {
      setLoading(true);
      const datasetCount = await factoryContract._datasetIds();
      const loadedDatasets = [];
      const userOwnedDatasets = [];
      const userAccessibleDatasets = [];

      for (let i = 1; i <= datasetCount; i++) {
        const dataset = await factoryContract.datasets(i);
        console.log("DataSet price", formatEther(dataset.tokenPrice));
        if (dataset.active) {
          const formattedDataset = {
            id: i,
            name: dataset.name,
            description: dataset.description,
            uri: dataset.uri,
            fullAccessTokens: formatEther(dataset.fullAccessTokens),
            d2cAccessTokens: formatEther(dataset.d2cAccessTokens),
            expiryAccessTokens: formatEther(dataset.expiryAccessTokens),
            expiryDuration: dataset.expiryDuration.toString(),
            version: dataset.version.toString(),
            tokenAddress: dataset.tokenAddress,
            tokenPrice: formatEther(dataset.tokenPrice),
          };

          loadedDatasets.push(formattedDataset);

          // Check if user owns this dataset's NFT
          try {
            const nftContract = new Contract(NFT_ADDRESS, NFT_ABI, provider);
            const owner = await nftContract.ownerOf(i);
            if (owner.toLowerCase() === account.toLowerCase()) {
              userOwnedDatasets.push(formattedDataset);
            }
          } catch (error) {
            console.error(
              `Error checking NFT ownership for dataset ${i}:`,
              error
            );
          }

          // Check if user has access to this dataset
          try {
            const hasAccess = await factoryContract.checkAccess(account, i);
            if (hasAccess) {
              userAccessibleDatasets.push(formattedDataset);
            }
          } catch (error) {
            console.error(`Error checking access for dataset ${i}:`, error);
          }
        }
      }

      setDatasets(loadedDatasets);
      setUserDatasets(userOwnedDatasets);
      setAccessibleDatasets(userAccessibleDatasets);
    } catch (error) {
      console.error("Error loading datasets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (factoryContract && account) {
      loadDatasets();
    }
  }, [factoryContract, account]);

  const connectWallet = async () => {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const browserProvider = new BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();

      setSigner(signer);
      setAccount(address);

      const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      setFactoryContract(contract);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  const createDataset = async (formDataToSubmit) => {
    try {
      setLoading(true);
      const gasEstimate = await factoryContract.createDataset.estimateGas(
        formDataToSubmit.name,
        formDataToSubmit.description,
        formDataToSubmit.uri,
        parseEther(formDataToSubmit.fullAccessTokens.toString()),
        parseEther(formDataToSubmit.d2cAccessTokens.toString()),
        parseEther(formDataToSubmit.expiryAccessTokens.toString()),
        Number(formDataToSubmit.expiryDuration) * 24 * 60 * 60,
        parseEther(formDataToSubmit.tokenPrice.toString())
      );

      const gasLimit = parseInt(Number(gasEstimate) * 1.2);
      console.log("GAS:", gasLimit);
      const tx = await factoryContract.createDataset(
        formDataToSubmit.name,
        formDataToSubmit.description,
        formDataToSubmit.uri,
        parseEther(formDataToSubmit.fullAccessTokens.toString()),
        parseEther(formDataToSubmit.d2cAccessTokens.toString()),
        parseEther(formDataToSubmit.expiryAccessTokens.toString()),
        Number(formDataToSubmit.expiryDuration) * 24 * 60 * 60,
        parseEther(formDataToSubmit.tokenPrice.toString()),
        { gasLimit: 10000000}
      );

      const receipt = await tx.wait();
      console.log("RECEIPT:", receipt);
      await loadDatasets();
      setFormData({
        name: "",
        description: "",
        uri: "",
        fullAccessTokens: "",
        d2cAccessTokens: "",
        expiryAccessTokens: "",
        expiryDuration: "",
        tokenPrice: "",
      });
    } catch (err) {
      console.error("Failed to create dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessPurchase = async (datasetId, accessType) => {
    try {
      setLoading(true);
      const dataset = datasets.find((d) => d.id === datasetId);
      if (!dataset) return;
   
      const accessTypeMap = {
        full: 3,
        d2c: 2, 
        expiry: 1
      };
   
      const tokenContract = new Contract(
        dataset.tokenAddress,
        TOKEN_ABI,
        signer
      );
   
      const requiredTokens = parseEther(
        accessType === "expiry" 
          ? dataset.expiryAccessTokens
          : accessType === "d2c"
          ? dataset.d2cAccessTokens 
          : dataset.fullAccessTokens
      );
   
      const userBalance = await tokenContract.balanceOf(account);
      console.log("Initial balance:", formatEther(userBalance));
   
      if (userBalance < requiredTokens) {
        alert("Insufficient Balance. Please Purchase More Tokens");
        return;
      }
   
      const approveTx = await tokenContract.approve(FACTORY_ADDRESS, requiredTokens);
      await approveTx.wait();
   
      const tx = await factoryContract.purchaseAccess(
        datasetId,
        accessTypeMap[accessType],
        { gasLimit: 1000000 }
      );
      await tx.wait();
   
      const updatedBalance = await tokenContract.balanceOf(account);
      console.log("Updated balance:", formatEther(updatedBalance));
   
      await loadDatasets();
      
      // Refresh UI with new balance
      const refreshedContract = new Contract(dataset.tokenAddress, TOKEN_ABI, signer);
      const finalBalance = await refreshedContract.balanceOf(account);
      console.log("Final balance check:", formatEther(finalBalance));
   
    } catch (error) {
      console.error("Failed to purchase access:", error);
      alert("Failed to purchase access: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
   };

   
  const purchaseAccess = async (datasetId, accessType) => {
    try {
      setLoading(true);
      const dataset = await factoryContract.datasets(datasetId);

      // Get token contract
      const tokenContract = new Contract(
        dataset.tokenAddress,
        TOKEN_ABI,
        signer
      );

      // First mint tokens if needed
      const requiredTokens =
        accessType === 1
          ? dataset.expiryAccessTokens
          : accessType === 2
          ? dataset.d2cAccessTokens
          : dataset.fullAccessTokens;

      // Approve tokens
      const approveTx = await tokenContract.approve(
        FACTORY_ADDRESS,
        requiredTokens
      );
      await approveTx.wait();

      // Purchase access
      const tx = await factoryContract.purchaseAccess(datasetId, accessType);
      await tx.wait();

      await loadDatasets();
    } catch (err) {
      console.error("Failed to purchase access:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <nav className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Dataset NFT DApp</h1>
          {!account ? (
            <Button
              onClick={connectWallet}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Connect Wallet
            </Button>
          ) : (
            <Badge variant="secondary">
              {`${account.slice(0, 6)}...${account.slice(-4)}`}
            </Badge>
          )}
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <Tabs defaultValue="browse">
          <TabsList>
            <TabsTrigger value="browse">Browse Datasets</TabsTrigger>
            <TabsTrigger value="create">Create Dataset</TabsTrigger>
            <TabsTrigger value="owned">My Datasets</TabsTrigger>
            <TabsTrigger value="access">My Access</TabsTrigger>
          </TabsList>

          {/* Browse Datasets Tab */}
          <TabsContent value="browse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets.map((dataset, index) => (
                <DatasetCard
                  key={index}
                  dataset={dataset}
                  onPurchaseAccess={handleAccessPurchase}
                  loading={loading}
                  tokenAbi={TOKEN_ABI}
                  signer={signer}
                />
              ))}
            </div>
          </TabsContent>

          {/* Create Dataset Tab */}
          <TabsContent value="create">
            <CreateDatasetForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={createDataset} // Now this will receive the form data correctly
              loading={loading}
            />
          </TabsContent>

          {/* My Datasets Tab */}
          <TabsContent value="owned">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userDatasets.map((dataset, index) => (
                <DatasetCard
                  key={index}
                  dataset={dataset}
                  isOwner={true}
                  loading={loading}
                />
              ))}
            </div>
          </TabsContent>

          {/* My Access Tab */}
          <TabsContent value="access">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accessibleDatasets.map((dataset, index) => (
                <DatasetCard
                  key={index}
                  dataset={dataset}
                  hasAccess={true}
                  loading={loading}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DatasetNFTDApp;
