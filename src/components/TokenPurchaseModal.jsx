// src/components/TokenPurchaseModal.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { parseEther } from 'ethers';

export function TokenPurchaseModal({ dataset, tokenContract, onSuccess, loading }) {
  const [ethAmount, setEthAmount] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  const handlePurchaseTokens = async () => {
    try {
      setTxLoading(true);
      console.log("Purchasing tokens with", ethAmount, "ETH");
      
      // Call mintTokens function with ETH value
      const tx = await tokenContract.mintTokens({ 
        value: parseEther(ethAmount.toString()) 
      });
      console.log("Transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Tokens purchased successfully!");
      
      onSuccess();
      setEthAmount('');
    } catch (error) {
      console.error("Failed to purchase tokens:", error);
      alert("Failed to purchase tokens: " + (error.reason || error.message));
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg text-white">Purchase Tokens for {dataset.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Amount of ETH to spend</label>
            <Input
              type="number"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              placeholder="ETH Amount"
              className="bg-gray-700 text-white"
              step="0.000000000000000001"
            />
          </div>
          
          <div className="text-sm text-gray-300 space-y-1">
            <p>Token Price: {dataset.tokenPrice} ETH per token</p>
            <p>You will receive: {ethAmount && !isNaN(ethAmount) ? 
              (Number(ethAmount) / Number(dataset.tokenPrice)).toFixed(6) : '0'} tokens</p>
          </div>

          <Button
            onClick={handlePurchaseTokens}
            disabled={!ethAmount || txLoading || loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {txLoading ? "Purchasing..." : "Purchase Tokens"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}