// src/components/CreateDataset.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export const CreateDatasetForm = ({ formData, setFormData, onSubmit, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();  // This will now work as e is the event object
    onSubmit(formData);
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 text-white">
      <CardHeader>
        <CardTitle>Create Dataset</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Dataset Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Input
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Input
            placeholder="URI"
            value={formData.uri}
            onChange={(e) => setFormData({...formData, uri: e.target.value})}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Input
            type="number"
            step="0.000000000000000001"
            placeholder="Full Access Tokens"
            value={formData.fullAccessTokens}
            onChange={(e) => setFormData({...formData, fullAccessTokens: e.target.value})}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Input
            type="number"
            step="0.000000000000000001"
            placeholder="D2C Access Tokens"
            value={formData.d2cAccessTokens}
            onChange={(e) => setFormData({...formData, d2cAccessTokens: e.target.value})}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Input
            type="number"
            step="0.000000000000000001"
            placeholder="Expiry Access Tokens"
            value={formData.expiryAccessTokens}
            onChange={(e) => setFormData({...formData, expiryAccessTokens: e.target.value})}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Input
            type="number"
            placeholder="Expiry Duration (days)"
            value={formData.expiryDuration}
            onChange={(e) => setFormData({...formData, expiryDuration: e.target.value})}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Input
            type="number"
            step="0.000000000000000001"
            placeholder="Token Price (ETH)"
            value={formData.tokenPrice}
            onChange={(e) => setFormData({...formData, tokenPrice: e.target.value})}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Dataset'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};