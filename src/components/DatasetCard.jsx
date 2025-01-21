import { useState } from "react";
import { Contract } from "ethers";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function DatasetCard({
  dataset,
  onPurchaseAccess,
  onPurchaseFullDataset,
  loading,
  tokenAbi,
  signer,
  nftContract, // Add NFT contract
  isOwner = false,
}) {
  const [selectedAccess, setSelectedAccess] = useState("full");
  const [transferAddress, setTransferAddress] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);

  const PaymentMode = {
    ETH: 0,
    USDT: 1,
    CLUSTER: 2,
    CUSTOM_TOKEN: 3,
  };

  const getPaymentLabel = () => {
    switch (Number(dataset.paymentMode)) {
      case PaymentMode.ETH:
        return "ETH";
      case PaymentMode.USDT:
        return "USDT";
      case PaymentMode.CLUSTER:
        return "CLUSTER";
      case PaymentMode.CUSTOM_TOKEN:
        return "Dataset Tokens";
      default:
        return "Tokens";
    }
  };

  const handleAccessModeChange = (e) => {
    setSelectedAccess(e.target.value);
  };

  const handlePurchase = async () => {
    if (!signer) {
      alert("Please connect your wallet first");
      return;
    }
    try {
      onPurchaseAccess(dataset.id, selectedAccess);
    } catch (error) {
      console.error("Error during purchase:", error);
      alert("Failed to purchase access: " + (error.reason || error.message));
    }
  };

  const handleTransferDataset = async () => {
    if (!signer || !nftContract || !transferAddress) return;

    try {
      setTransferLoading(true);

      // First approve the transfer
      const approveTx = await nftContract.approve(transferAddress, dataset.id);
      await approveTx.wait();

      // Then transfer the NFT
      const transferTx = await nftContract[
        "safeTransferFrom(address,address,uint256)"
      ](await signer.getAddress(), transferAddress, dataset.id);
      await transferTx.wait();

      setTransferAddress("");
      setShowTransferForm(false);
      alert("Dataset transferred successfully!");

      // You might want to refresh the dataset list here
      window.location.reload();
    } catch (error) {
      console.error("Transfer failed:", error);
      alert("Failed to transfer dataset: " + (error.reason || error.message));
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-start text-white">
          <CardTitle className="text-lg">{dataset.name}</CardTitle>
          <div className="flex flex-col items-end gap-1">
            <Badge>{dataset.active ? "Active" : "Inactive"}</Badge>
            <Badge variant="outline">{getPaymentLabel()}</Badge>
            {dataset.version && (
              <Badge variant="outline">v{dataset.version}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-300">{dataset.description}</p>
          <p className="text-sm text-gray-300">URI: {dataset.uri}</p>

          {isOwner ? (
            <div className="space-y-3">
              {!showTransferForm ? (
                <Button
                  onClick={() => setShowTransferForm(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Transfer Dataset
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Recipient Address"
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                    className="bg-gray-700 text-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleTransferDataset}
                      disabled={!transferAddress || transferLoading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {transferLoading ? "Transferring..." : "Confirm Transfer"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowTransferForm(false);
                        setTransferAddress("");
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {dataset.customTokenEnabled && dataset.customTokenAddress && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    <p>Token Address: {dataset.customTokenAddress}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2 text-white">
                <div className="flex justify-between items-center">
                  <span>Full Access:</span>
                  <span>
                    {dataset.prices.fullAccessPrice} {getPaymentLabel()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>D2C Access:</span>
                  <span>
                    {dataset.prices.d2cAccessPrice} {getPaymentLabel()}
                  </span>
                </div>
                {dataset.expiryTiers?.map((tier, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span>{tier.expiryDays} Days Access:</span>
                    <span>
                      {tier.price} {getPaymentLabel()}
                    </span>
                  </div>
                ))}
                {dataset.fullBuyEnabled && (
                  <div className="flex justify-between items-center font-bold">
                    <span>Full Dataset Purchase:</span>
                    <div className="text-right">
                      <span>
                        {dataset.fullBuyPrice} {getPaymentLabel()}
                      </span>
                      <div className="text-xs text-gray-400">
                        Payment Mode: {getPaymentLabel()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                <select
                  value={selectedAccess}
                  onChange={handleAccessModeChange}
                  className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white"
                >
                  <option value="full">Full Access</option>
                  <option value="d2c">D2C Access</option>
                  <option value="expiry">Expiry Access</option>
                </select>

                <Button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {loading
                    ? "Processing..."
                    : `Purchase Access with ${getPaymentLabel()}`}
                </Button>

                {dataset.fullBuyEnabled && (
                  <Button
                    onClick={() => onPurchaseFullDataset(dataset.id)}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? "Processing..." : `Purchase Full Dataset`}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
