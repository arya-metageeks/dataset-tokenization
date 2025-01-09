// src/components/DatasetCard.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Contract, parseEther, formatEther } from "ethers";

export function DatasetCard({
  dataset,
  onPurchaseAccess,
  loading,
  tokenAbi,
  signer,
}) {
  const [selectedAccess, setSelectedAccess] = useState("full");
  const [showTokenPurchase, setShowTokenPurchase] = useState(false);
  const [tokenBalance, setTokenBalance] = useState("0");
  const [ethAmount, setEthAmount] = useState(""); // Add this state

  const checkTokenBalance = async () => {
    try {
      const tokenContract = new Contract(
        dataset.tokenAddress,
        tokenAbi,
        signer
      );
      const balance = await tokenContract.balanceOf(await signer.getAddress());
      setTokenBalance(balance.toString()); // Store the raw value
    } catch (error) {
      console.error("Error checking token balance:", error);
    }
  };

  const handlePurchase = async () => {
    try {
      if (!showTokenPurchase) {
        await checkTokenBalance();
        setShowTokenPurchase(true);
        return;
      }

      const tokenContract = new Contract(
        dataset.tokenAddress,
        tokenAbi,
        signer
      );
      const tx = await tokenContract.mintTokens({
        value: parseEther(ethAmount),
      });
      await tx.wait();
      console.log("Tokens purchased successfully!");

      // Update token balance
      await checkTokenBalance();
      setEthAmount(""); // Reset ETH amount after purchase
    } catch (error) {
      console.error("Error during purchase:", error);
      alert("Failed to purchase tokens: " + (error.reason || error.message));
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-start text-white">
          <CardTitle className="text-lg">{dataset.name}</CardTitle>
          <Badge>{dataset.active ? "Active" : "Inactive"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-300">{dataset.description}</p>

          <div className="space-y-2 text-white">
            <div className="flex justify-between items-center">
              <span>Full Access:</span>
              <span>{dataset.fullAccessTokens} Tokens</span>
            </div>
            <div className="flex justify-between items-center">
              <span>D2C Access:</span>
              <span>{dataset.d2cAccessTokens} Tokens</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Expiry Access:</span>
              <span>{dataset.expiryAccessTokens} Tokens</span>
            </div>
          </div>

          <div className="text-sm text-gray-300">
            <p>Your Token Balance: {formatEther(tokenBalance)}</p>
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

            {showTokenPurchase ? (
              <div className="space-y-2">
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Amount in ETH"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    className="bg-gray-700 text-white"
                    step="0.000000000000000001"
                  />
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>
                      Token Price: {(dataset.tokenPrice || "0")} ETH
                    </p>
                    <p>
                      Tokens you will receive:{" "}
                      {ethAmount
                        ? (
                            Number(ethAmount) /
                            Number((dataset.tokenPrice || "1"))
                          ).toFixed(2)
                        : "0"}
                    </p>
                    <p>Current Balance: {formatEther(tokenBalance)} tokens</p>
                  </div>
                </div>
                <Button
                  onClick={handlePurchase}
                  disabled={loading || !ethAmount}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  {loading ? "Processing..." : "Buy Tokens"}
                </Button>
                <Button
                  onClick={() => onPurchaseAccess(dataset.id, selectedAccess)}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {loading ? "Processing..." : "Purchase Access"}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                {loading ? "Processing..." : "Get Started"}
              </Button>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
