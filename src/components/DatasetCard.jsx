/* global BigInt */

import { useState } from "react";
import { Contract, parseEther } from "ethers";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function DatasetCard({
  dataset,
  onPurchaseAccess,
  loading,
  tokenAbi,
  signer,
  isOwner = false,
}) {
  const [selectedAccess, setSelectedAccess] = useState("full");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferAddress, setTransferAddress] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  const PaymentMode = {
    ETH: 0,
    USDT: 1,
    CLUSTER: 2,
    CUSTOM_TOKEN: 3,
  };

  const getPaymentLabel = () => {
    switch (parseInt(dataset.paymentMode)) {
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

  const handleTransferTokens = async () => {
    try {
      if (!signer) {
        alert("Please connect your wallet first");
        return;
      }

      if (!tokenAbi) {
        console.error("Token ABI is missing");
        alert("Configuration error: Token ABI is missing");
        return;
      }

      setTransferLoading(true);

      // Only proceed if it's a custom token dataset
      if (dataset.paymentMode === BigInt(3) && dataset.customTokenAddress) {
        console.log("Creating contract with:", {
          address: dataset.customTokenAddress,
          abi: tokenAbi,
          signer: signer,
        });

        const tokenContract = new Contract(
          dataset.customTokenAddress,
          tokenAbi,
          signer
        );

        // Parse amount with 18 decimals (for ERC20)
        const amount = parseEther(transferAmount);

        const tx = await tokenContract.transfer(transferAddress, amount);
        await tx.wait();

        // Clear form
        setTransferAmount("");
        setTransferAddress("");
        alert("Tokens transferred successfully!");
      }
    } catch (error) {
      console.error("Transfer failed:", error);
      // More detailed error logging
      console.log("Error details:", {
        paymentMode: dataset.paymentMode,
        customTokenAddress: dataset.customTokenAddress,
        hasAbi: !!tokenAbi,
        hasSigner: !!signer,
        error: error,
      });
      alert("Failed to transfer tokens: " + (error.reason || error.message));
    } finally {
      setTransferLoading(false);
    }
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

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-start text-white">
          <CardTitle className="text-lg">{dataset.name}</CardTitle>
          <div className="flex flex-col items-end text-white">
            <Badge>{dataset.active ? "Active" : "Inactive"}</Badge>
            <Badge variant="outline" className="text-white">
              {getPaymentLabel()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-300">{dataset.description}</p>

          {/* Show prices and purchase options only if not owner */}
          {!isOwner && (
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
                <div className="flex justify-between items-center">
                  <span>Expiry Access:</span>
                  <span>
                    {dataset.prices.expiryAccessPrice} {getPaymentLabel()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <select
                  value={selectedAccess}
                  onChange={(e) => setSelectedAccess(e.target.value)}
                  className="bg-gray-700 text-white border border-gray-600 rounded p-2"
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
                    : `Purchase with ${getPaymentLabel()}`}
                </Button>
              </div>
            </>
          )}

          {/* Show token transfer section only if owner and it's a custom token dataset */}
          {isOwner && dataset.paymentMode === BigInt(3) && (
            <div className="space-y-3 border-t border-gray-700 pt-3">
              <h3 className="text-sm font-medium text-white">
                Transfer Custom Tokens
              </h3>

              <Input
                type="text"
                placeholder="Recipient Address"
                value={transferAddress}
                onChange={(e) => setTransferAddress(e.target.value)}
                className="bg-gray-700 text-white"
              />

              <Input
                type="number"
                step="0.000000000000000001"
                placeholder="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="bg-gray-700 text-white"
              />

              <Button
                onClick={handleTransferTokens}
                disabled={
                  !transferAddress || !transferAmount || transferLoading
                }
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                {transferLoading ? "Transferring..." : "Transfer Tokens"}
              </Button>

              <div className="text-sm text-gray-400">
                Token Address: {dataset.customTokenAddress}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
