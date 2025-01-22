import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";

export const InferenceRegistrationForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    inferenceId: '',
    modelType: '0' // 0: IMAGE, 1: AUDIO, 2: OTHER
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Register New Inference</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="inferenceId" className="text-white">Inference ID</Label>
            <Input
              id="inferenceId"
              type="text"
              value={formData.inferenceId}
              onChange={(e) => handleChange('inferenceId', e.target.value)}
              placeholder="Enter inference ID"
              className="bg-gray-700 text-white border-gray-600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelType" className="text-white">Model Type</Label>
            <Select 
              value={formData.modelType}
              onValueChange={(value) => handleChange('modelType', value)}
            >
              <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                <SelectValue placeholder="Select model type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="0">Image</SelectItem>
                <SelectItem value="1">Audio</SelectItem>
                <SelectItem value="2">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register Inference"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};