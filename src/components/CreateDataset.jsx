// CreateDatasetForm.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

export const CreateDatasetForm = ({ formData, setFormData, onSubmit, loading }) => {
  const [expiryTiers, setExpiryTiers] = useState([{ price: '', expiryDays: '' }]);

  const addExpiryTier = () => {
    setExpiryTiers([...expiryTiers, { price: '', expiryDays: '' }]);
  };

  const updateExpiryTier = (index, field, value) => {
    const newTiers = [...expiryTiers];
    newTiers[index][field] = value;
    setExpiryTiers(newTiers);
    setFormData({ ...formData, expiryTiers: newTiers });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, expiryTiers });
  };

  // Safe access to formData with defaults
  const safeFormData = {
    name: formData?.name || '',
    description: formData?.description || '',
    uri: formData?.uri || '',
    paymentMode: formData?.paymentMode || '0',
    prices: formData?.prices || { fullAccessPrice: '', d2cAccessPrice: '' },
    expiryTiers: formData?.expiryTiers || [],
    fullBuyPrice: formData?.fullBuyPrice || '',
    customTokenEnabled: formData?.customTokenEnabled || false,
    fullBuyEnabled: formData?.fullBuyEnabled || false,
    customTokenSupply: formData?.customTokenSupply || '',
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 text-white">
      <CardHeader>
        <CardTitle>Create Dataset</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Dataset Name</label>
            <Input
              placeholder="Dataset Name"
              value={safeFormData.name}
              onChange={(e) => setFormData({...safeFormData, name: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Description</label>
            <Input
              placeholder="Description"
              value={safeFormData.description}
              onChange={(e) => setFormData({...safeFormData, description: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">URI</label>
            <Input
              placeholder="URI"
              value={safeFormData.uri}
              onChange={(e) => setFormData({...safeFormData, uri: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Payment Mode</label>
            <select
              value={safeFormData.paymentMode}
              onChange={(e) => {
                const newMode = e.target.value;
                setFormData({
                  ...safeFormData,
                  paymentMode: newMode,
                  customTokenEnabled: false,
                  customTokenSupply: '',
                  fullBuyEnabled: newMode === "3" ? false : safeFormData.fullBuyEnabled
                });
              }}
              className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white"
            >
              <option value="0">ETH</option>
              <option value="1">USDT</option>
              <option value="2">CLUSTER</option>
              <option value="3">Custom Token</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-sm text-gray-300">Access Prices</label>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Full Access Price</label>
              <Input
                type="number"
                step="0.000000000000000001"
                placeholder="Full Access Price"
                value={safeFormData.prices.fullAccessPrice}
                onChange={(e) => setFormData({
                  ...safeFormData, 
                  prices: { 
                    ...safeFormData.prices,
                    fullAccessPrice: e.target.value
                  }
                })}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">D2C Access Price</label>
              <Input
                type="number"
                step="0.000000000000000001"
                placeholder="D2C Access Price"
                value={safeFormData.prices.d2cAccessPrice}
                onChange={(e) => setFormData({
                  ...safeFormData,
                  prices: {
                    ...safeFormData.prices,
                    d2cAccessPrice: e.target.value
                  }
                })}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Expiry Tiers</label>
            {expiryTiers.map((tier, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Price"
                  value={tier.price}
                  onChange={(e) => updateExpiryTier(index, 'price', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  type="number"
                  placeholder="Days"
                  value={tier.expiryDays}
                  onChange={(e) => updateExpiryTier(index, 'expiryDays', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            ))}
            <Button 
              type="button"
              onClick={addExpiryTier}
              className="mt-2 bg-gray-700 hover:bg-gray-600"
            >
              Add Expiry Tier
            </Button>
          </div>

          <div className="space-y-4 border p-4 rounded-lg border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Dataset Options</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="custom-token"
                  checked={safeFormData.customTokenEnabled}
                  onChange={(e) => {
                    setFormData({
                      ...safeFormData, 
                      customTokenEnabled: e.target.checked,
                      fullBuyEnabled: false,
                      fullBuyPrice: e.target.checked ? "" : safeFormData.fullBuyPrice
                    });
                  }}
                  disabled={safeFormData.paymentMode !== "3"}
                />
                <Label htmlFor="custom-token">Enable Custom Token</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="full-buy"
                  checked={safeFormData.fullBuyEnabled}
                  onChange={(e) => {
                    setFormData({
                      ...safeFormData, 
                      fullBuyEnabled: e.target.checked,
                      customTokenEnabled: false,
                      customTokenSupply: "",
                    });
                  }}
                  disabled={safeFormData.customTokenEnabled || safeFormData.paymentMode === "3"}
                />
                <Label htmlFor="full-buy">Enable Full Buy</Label>
              </div>
            </div>

            {safeFormData.paymentMode === "3" && safeFormData.customTokenEnabled && (
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Custom Token Supply</label>
                <Input
                  type="number"
                  step="0.000000000000000001"
                  placeholder="Custom Token Initial Supply"
                  value={safeFormData.customTokenSupply}
                  onChange={(e) => setFormData({...safeFormData, customTokenSupply: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            )}

            {safeFormData.fullBuyEnabled && (
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Full Buy Price</label>
                <Input
                  type="number"
                  step="0.000000000000000001"
                  placeholder="Full Buy Price"
                  value={safeFormData.fullBuyPrice}
                  onChange={(e) => setFormData({...safeFormData, fullBuyPrice: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white mt-6"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Dataset'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};