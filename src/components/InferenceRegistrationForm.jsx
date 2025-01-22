import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "../components/ui/alert";

export const InferenceRegistrationForm = ({ onSubmit, onBatchSubmit, loading, lastProcessedBatch, totalInferences }) => {
  const [formData, setFormData] = useState({
    inferenceId: '',
    modelType: '0'
  });

  const [batchFormData, setBatchFormData] = useState([
    { inferenceId: '', modelType: '0' }
  ]);

  const [activeTab, setActiveTab] = useState('batch'); // Default to batch since it's optimized

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert single submission to batch format for consistency
    onBatchSubmit([formData]);
  };

  const handleBatchSubmit = (e) => {
    e.preventDefault();
    const validEntries = batchFormData.filter(entry => entry.inferenceId.trim() !== '');
    
    // Validate for duplicate IDs within the batch
    const ids = validEntries.map(entry => entry.inferenceId);
    const hasDuplicates = ids.length !== new Set(ids).size;
    
    if (hasDuplicates) {
      alert("Please remove duplicate inference IDs from the batch");
      return;
    }
    
    onBatchSubmit(validEntries);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBatchEntryChange = (index, field, value) => {
    setBatchFormData(prev => {
      const newData = [...prev];
      newData[index] = {
        ...newData[index],
        [field]: value
      };
      return newData;
    });
  };

  const addBatchEntry = () => {
    setBatchFormData(prev => [...prev, { inferenceId: '', modelType: '0' }]);
  };

  const removeBatchEntry = (index) => {
    setBatchFormData(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Register Inference</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Alert className="bg-blue-500/20 border-blue-500 text-blue-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Batch registration is optimized for gas efficiency. Current batch: #{lastProcessedBatch}, Total inferences: {totalInferences}
            </AlertDescription>
          </Alert>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-700">
            <TabsTrigger value="single" className="data-[state=active]:bg-blue-500">
              Single Registration
            </TabsTrigger>
            <TabsTrigger value="batch" className="data-[state=active]:bg-blue-500">
              Batch Registration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
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
                  <SelectContent className="bg-gray-700 border-gray-600 text-white">
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
                {loading ? "Processing Batch..." : "Register as Batch"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="batch">
            <form onSubmit={handleBatchSubmit} className="space-y-6">
              {batchFormData.map((entry, index) => (
                <div key={index} className="space-y-4 p-4 border border-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Batch Entry {index + 1}</span>
                    {batchFormData.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBatchEntry(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`inferenceId-${index}`} className="text-white">Inference ID</Label>
                    <Input
                      id={`inferenceId-${index}`}
                      type="text"
                      value={entry.inferenceId}
                      onChange={(e) => handleBatchEntryChange(index, 'inferenceId', e.target.value)}
                      placeholder="Enter inference ID"
                      className="bg-gray-700 text-white border-gray-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`modelType-${index}`} className="text-white">Model Type</Label>
                    <Select 
                      value={entry.modelType}
                      onValueChange={(value) => handleBatchEntryChange(index, 'modelType', value)}
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
                </div>
              ))}

              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={addBatchEntry}
                  className="flex-1 bg-gray-700 hover:bg-gray-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Batch
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? "Processing Batch..." : `Register Batch #${lastProcessedBatch + 1}`}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};