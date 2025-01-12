// src/components/CreateDataset.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectItem } from "./ui/select";

export const CreateDatasetForm = ({ formData, setFormData, onSubmit, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Description</label>
            <Input
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">URI</label>
            <Input
              placeholder="URI"
              value={formData.uri}
              onChange={(e) => setFormData({...formData, uri: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Payment Mode</label>
            <Select
              value={formData.paymentMode}
              onChange={(value) => setFormData({...formData, paymentMode: value})}
              required
            >
              <SelectItem value="">Select Payment Mode</SelectItem>
              <SelectItem value="0">ETH</SelectItem>
              <SelectItem value="1">USDT</SelectItem>
              <SelectItem value="2">CLUSTER</SelectItem>
              <SelectItem value="3">Custom Token</SelectItem>
            </Select>
          </div>

          <div className="space-y-4">
            <label className="text-sm text-gray-300">Access Prices</label>
            
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Full Access Price</label>
              <Input
                type="number"
                step="0.000000000000000001"
                placeholder="Full Access Price"
                value={formData.fullAccessPrice}
                onChange={(e) => setFormData({...formData, fullAccessPrice: e.target.value})}
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
                value={formData.d2cAccessPrice}
                onChange={(e) => setFormData({...formData, d2cAccessPrice: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">Expiry Access Price</label>
              <Input
                type="number"
                step="0.000000000000000001"
                placeholder="Expiry Access Price"
                value={formData.expiryAccessPrice}
                onChange={(e) => setFormData({...formData, expiryAccessPrice: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Expiry Duration (days)</label>
            <Input
              type="number"
              placeholder="Expiry Duration (days)"
              value={formData.expiryDuration}
              onChange={(e) => setFormData({...formData, expiryDuration: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          {formData.paymentMode === "3" && (
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Custom Token Supply</label>
              <Input
                type="number"
                step="0.000000000000000001"
                placeholder="Custom Token Initial Supply"
                value={formData.customTokenSupply}
                onChange={(e) => setFormData({...formData, customTokenSupply: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
              <p className="text-xs text-gray-400">
                Initial supply of custom tokens to be minted for this dataset
              </p>
            </div>
          )}

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