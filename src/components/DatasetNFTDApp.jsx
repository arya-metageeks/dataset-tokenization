// DatasetNFTDApp.jsx
/* global BigInt */
import React, { useState, useEffect } from "react";
import {
  BrowserProvider,
  Contract,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from "ethers";
import {
  FACTORY_ADDRESS,
  NFT_ADDRESS,
  FACTORY_ABI,
  NFT_ABI,
  TOKEN_ABI,
  USDT_ADDRESS,
  CLUSTER_ADDRESS,
  INFERENCE_ADDRESS,
  INFERENCE_ABI,
} from "../contracts/Constants";
import { DatasetCard } from "./DatasetCard";
import { CreateDatasetForm } from "./CreateDataset";
import { InferenceRegistrationForm } from "./InferenceRegistrationForm";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";

const DatasetNFTDApp = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);
  const [nftContract, setNftContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDatasets, setUserDatasets] = useState([]);
  const [accessibleDatasets, setAccessibleDatasets] = useState([]);
  const [inferenceContract, setInferenceContract] = useState(null);
  const [inferenceStats, setInferenceStats] = useState({
    totalInferences: 0,
    recentInferences: [],
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    uri: "",
    paymentMode: "0",
    prices: {
      fullAccessPrice: "",
      d2cAccessPrice: "",
    },
    expiryTiers: [],
    fullBuyPrice: "",
    customTokenEnabled: false,
    fullBuyEnabled: false,
    customTokenSupply: "",
  });

  useEffect(() => {
    const initEthers = async () => {
      if (window.ethereum) {
        try {
          const browserProvider = new BrowserProvider(window.ethereum);
          const signer = await browserProvider.getSigner();
          const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
          const nftContractInstance = new Contract(
            NFT_ADDRESS,
            NFT_ABI,
            signer
          );
          const inferenceContractInstance = new Contract(
            INFERENCE_ADDRESS,
            INFERENCE_ABI,
            signer
          );

          setProvider(browserProvider);
          setSigner(signer);
          setFactoryContract(contract);
          setNftContract(nftContractInstance);
          setInferenceContract(inferenceContractInstance);
          setAccount(await signer.getAddress());
          setLoading(false);
        } catch (error) {
          console.error("Error initializing:", error);
        }
      }
    };

    initEthers();
  }, []);

  const loadDatasets = async () => {
    if (!factoryContract || !account) return;

    try {
      setLoading(true);
      const datasetCount = await factoryContract._datasetIds();
      const loadedDatasets = [];
      const userOwnedDatasets = [];
      const userAccessibleDatasets = [];

      for (let i = 1; i <= datasetCount; i++) {
        try {
          const dataset = await factoryContract.datasets(i);
          if (dataset.active) {
            const formattedDataset = {
              id: i,
              name: dataset.name || "",
              description: dataset.description || "",
              uri: dataset.uri || "",
              version: dataset.version?.toString() || "1",
              active: dataset.active || false,
              paymentMode: Number(dataset.paymentMode) || 0,
              customTokenAddress: dataset.customTokenAddress || "",
              prices: {
                fullAccessPrice: formatUnits(
                  dataset.prices?.fullAccessPrice || 0,
                  Number(dataset.paymentMode) === 1 ? 6 : 18
                ),
                d2cAccessPrice: formatUnits(
                  dataset.prices?.d2cAccessPrice || 0,
                  Number(dataset.paymentMode) === 1 ? 6 : 18
                ),
              },
              expiryTiers: Array.isArray(dataset.expiryTiers)
                ? dataset.expiryTiers.map((tier) => ({
                    price: formatUnits(
                      tier.price || 0,
                      Number(dataset.paymentMode) === 1 ? 6 : 18
                    ),
                    expiryDays: (tier.expiryDays || 0).toString(),
                  }))
                : [],
              fullBuyPrice: formatUnits(
                dataset.fullBuyPrice || 0,
                Number(dataset.paymentMode) === 1 ? 6 : 18
              ),
              customTokenEnabled: dataset.customTokenEnabled || false,
              fullBuyEnabled: dataset.fullBuyEnabled || false,
            };

            loadedDatasets.push(formattedDataset);

            try {
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

            try {
              const [hasAccess, accessType] = await factoryContract.checkAccess(
                account,
                i
              );
              if (hasAccess) {
                userAccessibleDatasets.push({
                  ...formattedDataset,
                  accessType:
                    ["None", "Expiry", "D2C", "Full"][Number(accessType)] ||
                    "None",
                });
              }
            } catch (error) {
              console.error(`Error checking access for dataset ${i}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error loading dataset ${i}:`, error);
          continue;
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

  const loadRegisteredInferences = async (inferenceId) => {
    if (!inferenceContract || !account) return;

    try {
      const inference = await inferenceContract.getInference(inferenceId);
      const [id, modelType, timestamp] = inference;

      setInferenceStats({
        id: id.toString(),
        modelType: Number(modelType),
        timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
      });
    } catch (error) {
      console.error(`Error loading inference ${inferenceId}:`, error);
    }
  };

  useEffect(() => {
    if (factoryContract && account) {
      loadDatasets();
    }
  }, [factoryContract, account]);

  useEffect(() => {
    if (inferenceContract && account) {
      loadRegisteredInferences();
    }
  }, [inferenceContract, account]);

  const connectWallet = async () => {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const browserProvider = new BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const nftContractInstance = new Contract(NFT_ADDRESS, NFT_ABI, signer);
      const inferenceContractInstance = new Contract(
        INFERENCE_ADDRESS,
        INFERENCE_ABI,
        signer
      );

      setProvider(browserProvider);
      setSigner(signer);
      setFactoryContract(contract);
      setNftContract(nftContractInstance);
      setInferenceContract(inferenceContractInstance);
      setAccount(address);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  const createDataset = async (formDataToSubmit) => {
    try {
      setLoading(true);

      const decimals = formDataToSubmit.paymentMode === "1" ? 6 : 18;
      const prices = {
        fullAccessPrice: parseUnits(
          formDataToSubmit.prices.fullAccessPrice.toString(),
          decimals
        ),
        d2cAccessPrice: parseUnits(
          formDataToSubmit.prices.d2cAccessPrice.toString(),
          decimals
        ),
      };

      const expiryTiers = (formDataToSubmit.expiryTiers || []).map((tier) => ({
        price: parseUnits(tier.price.toString(), decimals),
        expiryDays: tier.expiryDays,
      }));

      const tx = await factoryContract.createDataset(
        formDataToSubmit.name,
        formDataToSubmit.description,
        formDataToSubmit.uri,
        formDataToSubmit.paymentMode,
        prices,
        expiryTiers,
        parseUnits(formDataToSubmit.fullBuyPrice.toString(), decimals),
        formDataToSubmit.customTokenEnabled,
        formDataToSubmit.fullBuyEnabled,
        formDataToSubmit.paymentMode === "3"
          ? parseUnits(formDataToSubmit.customTokenSupply.toString(), 18)
          : 0
      );

      const receipt = await tx.wait();

      const createEvent = receipt.logs
        .map((log) => {
          try {
            return factoryContract.interface.parseLog(log);
          } catch (error) {
            console.log("Could not parse log:", log);
            return null;
          }
        })
        .filter((event) => event && event.name === "DatasetCreated");

      const event = createEvent[0];
      const datasetId = event.args[0];

      if (formDataToSubmit.fullBuyEnabled && datasetId) {
        try {
          const approveTx = await nftContract.approve(
            FACTORY_ADDRESS,
            datasetId
          );
          await approveTx.wait();
        } catch (approvalError) {
          console.error("Failed to approve NFT transfer:", approvalError);
          alert(
            "Dataset created but NFT transfer approval failed. You'll need to approve transfers before anyone can purchase the full dataset."
          );
        }
      }

      await loadDatasets();

      setFormData({
        name: "",
        description: "",
        uri: "",
        paymentMode: "0",
        prices: {
          fullAccessPrice: "",
          d2cAccessPrice: "",
        },
        expiryTiers: [],
        fullBuyPrice: "",
        customTokenEnabled: false,
        fullBuyEnabled: false,
        customTokenSupply: "",
      });

      alert(
        "Dataset created successfully!" +
          (formDataToSubmit.fullBuyEnabled
            ? " Full dataset purchase has been enabled."
            : "")
      );
    } catch (err) {
      console.error("Failed to create dataset:", err);
      alert("Failed to create dataset: " + (err.reason || err.message));
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
        expiry: 1,
      };

      const price =
        accessType === "full"
          ? dataset.prices.fullAccessPrice
          : accessType === "d2c"
          ? dataset.prices.d2cAccessPrice
          : dataset.expiryTiers[0]?.price || "0";

      const value =
        dataset.paymentMode === 0 ? parseEther(price.toString()) : 0;

      if (dataset.paymentMode !== 0) {
        const tokenAddress =
          dataset.paymentMode === 1
            ? USDT_ADDRESS
            : dataset.paymentMode === 2
            ? CLUSTER_ADDRESS
            : dataset.customTokenAddress;

        const tokenContract = new Contract(tokenAddress, TOKEN_ABI, signer);
        const decimals = dataset.paymentMode === 1 ? 6 : 18;
        const tokenAmount = parseUnits(price.toString(), decimals);

        const approveTx = await tokenContract.approve(
          FACTORY_ADDRESS,
          tokenAmount
        );
        await approveTx.wait();
      }

      const tx = await factoryContract.purchaseAccess(
        datasetId,
        accessTypeMap[accessType],
        { value }
      );
      await tx.wait();
      await loadDatasets();
    } catch (error) {
      console.error("Failed to purchase access:", error);
      alert("Failed to purchase access: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFullDatasetPurchase = async (datasetId) => {
    try {
      setLoading(true);
      const dataset = datasets.find((d) => d.id === datasetId);
      if (!dataset) return;

      if (!dataset.fullBuyEnabled) {
        alert("Full buy is not enabled for this dataset");
        return;
      }

      const value =
        dataset.paymentMode === 0
          ? parseEther(dataset.fullBuyPrice.toString())
          : BigInt(0);

      if (dataset.paymentMode !== 0) {
        const tokenAddress =
          dataset.paymentMode === 1
            ? USDT_ADDRESS
            : dataset.paymentMode === 2
            ? CLUSTER_ADDRESS
            : dataset.customTokenAddress;

        const tokenContract = new Contract(tokenAddress, TOKEN_ABI, signer);
        const decimals = dataset.paymentMode === 1 ? 6 : 18;
        const tokenAmount = parseUnits(
          dataset.fullBuyPrice.toString(),
          decimals
        );

        const currentAllowance = await tokenContract.allowance(
          await signer.getAddress(),
          FACTORY_ADDRESS
        );

        if (currentAllowance < tokenAmount) {
          const approveTx = await tokenContract.approve(
            FACTORY_ADDRESS,
            tokenAmount
          );
          await approveTx.wait();
        }

        const balance = await tokenContract.balanceOf(
          await signer.getAddress()
        );
        if (balance < tokenAmount) {
          alert("Insufficient token balance");
          return;
        }
      }

      const owner = await nftContract.ownerOf(datasetId);
      const isApproved =
        (await nftContract.getApproved(datasetId)) === FACTORY_ADDRESS;

      if (!isApproved) {
        if (owner.toLowerCase() === (await signer.getAddress()).toLowerCase()) {
          try {
            const approveTx = await nftContract.approve(
              FACTORY_ADDRESS,
              datasetId
            );
            await approveTx.wait();
          } catch (approvalError) {
            console.error("Failed to approve NFT:", approvalError);
            alert("Failed to approve NFT transfer. Please try again.");
            return;
          }
        } else {
          alert("Dataset not approved for transfer. Please contact the owner.");
          return;
        }
      }

      const gasEstimate = await factoryContract.purchaseFullDataset.estimateGas(
        datasetId,
        { value }
      );
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

      const tx = await factoryContract.purchaseFullDataset(datasetId, {
        value,
        gasLimit,
      });

      await tx.wait();
      await loadDatasets();
      alert("Dataset purchased successfully!");
    } catch (error) {
      console.error("Failed to purchase full dataset:", error);

      if (error.message.includes("Dataset not approved")) {
        alert("The dataset needs to be approved for transfer by the owner.");
      } else if (error.message.includes("Incorrect ETH amount")) {
        alert(
          "Incorrect payment amount. Please check the price and try again."
        );
      } else if (error.message.includes("insufficient funds")) {
        alert("Insufficient funds to complete the purchase.");
      } else {
        alert(
          "Failed to purchase full dataset: " + (error.reason || error.message)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInferenceRegistration = async (formData) => {
    try {
      setLoading(true);

      const gasEstimate = await inferenceContract.addInference.estimateGas(
        formData.inferenceId,
        parseInt(formData.modelType)
      );
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);
      console.log("gasLimit:", gasLimit);

      const tx = await inferenceContract.addInference(
        formData.inferenceId,
        parseInt(formData.modelType),
        { gasLimit: gasLimit }
      );
      await tx.wait();

      await loadRegisteredInferences(formData.inferenceId);
      alert("Inference registered successfully!");
    } catch (error) {
      console.error("Failed to register inference:", error);
      alert("Failed to register inference: " + (error.reason || error.message));
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
            <TabsTrigger value="inference">Register Inference</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets.map((dataset, index) => (
                <DatasetCard
                  key={index}
                  dataset={dataset}
                  onPurchaseAccess={handleAccessPurchase}
                  onPurchaseFullDataset={handleFullDatasetPurchase}
                  loading={loading}
                  tokenAbi={TOKEN_ABI}
                  signer={signer}
                  nftContract={nftContract}
                  onTransferComplete={loadDatasets}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <CreateDatasetForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={createDataset}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="owned">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userDatasets.map((dataset, index) => (
                <DatasetCard
                  key={index}
                  dataset={dataset}
                  isOwner={true}
                  loading={loading}
                  signer={signer}
                  tokenAbi={TOKEN_ABI}
                  nftContract={nftContract}
                  onTransferComplete={loadDatasets}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="access">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accessibleDatasets.map((dataset, index) => (
                <Card key={index} className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-white">
                        {dataset.name}
                      </CardTitle>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary">{dataset.accessType}</Badge>
                        <Badge variant="outline" className="text-white">
                          {
                            ["ETH", "USDT", "CLUSTER", "Custom Token"][
                              dataset.paymentMode
                            ]
                          }
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-300">
                        {dataset.description}
                      </p>
                      <div className="text-sm text-gray-300">
                        <p>URI: {dataset.uri}</p>
                        <p className="mt-2">Version: {dataset.version}</p>
                      </div>
                      {dataset.customTokenAddress && (
                        <div className="text-sm text-gray-400 break-all">
                          <p>Token Address: {dataset.customTokenAddress}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inference">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <InferenceRegistrationForm
                    onSubmit={handleInferenceRegistration}
                    loading={loading}
                  />
                </div>

                <div>
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-white">
                        Inference Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {inferenceStats.id ? (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              Inference ID
                            </h3>
                            <p className="text-2xl font-bold text-blue-400">
                              {inferenceStats.id}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              Model Type
                            </h3>
                            <p className="text-xl text-gray-200">
                              {
                                ["Image", "Audio", "Other"][
                                  inferenceStats.modelType
                                ]
                              }
                            </p>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              Timestamp
                            </h3>
                            <p className="text-xl text-gray-200">
                              {inferenceStats.timestamp}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400">
                          No inference details available. Register an inference
                          to see the details.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DatasetNFTDApp;
