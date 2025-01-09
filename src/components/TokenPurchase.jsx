// src/components/TokenPurchase.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { parseEther } from 'ethers';

export function TokenPurchase({ tokenContract, loading, onSuccess }) {
  const [amount, setAmount] = useState('');

  const handlePurchase = async () => {
    try {
      if (!amount) return;

      const tx = await tokenContract.mintTokens({
        value: parseEther(amount)
      });
      await tx.wait();
      
      if (onSuccess) {
        onSuccess();
      }
      setAmount('');
    } catch (error) {
      console.error('Failed to purchase tokens:', error);
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Purchase Tokens</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              type="number"
              placeholder="Amount in ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-700 text-white"
              step="0.000000000000000001"
            />
          </div>
          <Button
            onClick={handlePurchase}
            disabled={loading || !amount}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? 'Processing...' : 'Buy Tokens'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}