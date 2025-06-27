'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Trash2, 
  Copy, 
  Shuffle, 
  BarChart3, 
  Hash, 
  Type, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Filter,
  Plus,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface DataTransformationsProps {
  dataState: {
    data: any[];
    columns: string[];
    fileName: string;
    dataTypes: Record<string, string>;
    statistics: Record<string, any>;
  };
  onDataUpdate: (newData: any[], action: string) => void;
}

export function DataTransformations({ dataState, onDataUpdate }: DataTransformationsProps) {
  const { data, columns, dataTypes, statistics } = dataState;
  
  // Form states
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [fillValue, setFillValue] = useState<string>('');
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [newColumnName, setNewColumnName] = useState<string>('');
  const [encodingColumn, setEncodingColumn] = useState<string>('');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'numeric':
        return <Hash className="w-4 h-4 text-blue-500" />;
      case 'categorical':
        return <Type className="w-4 h-4 text-green-500" />;
      case 'date':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <Type className="w-4 h-4 text-gray-500" />;
    }
  };

  // Data Cleaning Functions
  const handleFillMissingValues = () => {
    if (!selectedColumn || fillValue === '') {
      toast.error('Please select a column and fill value');
      return;
    }

    const newData = data.map(row => ({
      ...row,
      [selectedColumn]: row[selectedColumn] === null || row[selectedColumn] === undefined || row[selectedColumn] === '' 
        ? fillValue 
        : row[selectedColumn]
    }));

    onDataUpdate(newData, `Filled missing values in ${selectedColumn}`);
    setSelectedColumn('');
    setFillValue('');
  };

  const handleRemoveDuplicates = () => {
    const seen = new Set();
    const newData = data.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    onDataUpdate(newData, `Removed ${data.length - newData.length} duplicate rows`);
  };

  const handleRemoveOutliers = () => {
    if (!selectedColumn || dataTypes[selectedColumn] !== 'numeric') {
      toast.error('Please select a numeric column');
      return;
    }

    const values = data
      .map(row => Number(row[selectedColumn]))
      .filter(val => !isNaN(val))
      .sort((a, b) => a - b);

    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const newData = data.filter(row => {
      const value = Number(row[selectedColumn]);
      return !isNaN(value) && value >= lowerBound && value <= upperBound;
    });

    onDataUpdate(newData, `Removed ${data.length - newData.length} outliers from ${selectedColumn}`);
    setSelectedColumn('');
  };

  const handleDropColumn = () => {
    if (!selectedColumn) {
      toast.error('Please select a column to drop');
      return;
    }

    const newData = data.map(row => {
      const newRow = { ...row };
      delete newRow[selectedColumn];
      return newRow;
    });

    onDataUpdate(newData, `Dropped column ${selectedColumn}`);
    setSelectedColumn('');
  };

  // Data Transformation Functions
  const handleNormalization = () => {
    if (!selectedColumn || dataTypes[selectedColumn] !== 'numeric') {
      toast.error('Please select a numeric column');
      return;
    }

    const values = data.map(row => Number(row[selectedColumn])).filter(val => !isNaN(val));
    const min = Math.min(...values);
    const max = Math.max(...values);

    const newData = data.map(row => ({
      ...row,
      [selectedColumn]: isNaN(Number(row[selectedColumn])) 
        ? row[selectedColumn] 
        : (Number(row[selectedColumn]) - min) / (max - min)
    }));

    onDataUpdate(newData, `Normalized column ${selectedColumn}`);
    setSelectedColumn('');
  };

  const handleStandardization = () => {
    if (!selectedColumn || dataTypes[selectedColumn] !== 'numeric') {
      toast.error('Please select a numeric column');
      return;
    }

    const values = data.map(row => Number(row[selectedColumn])).filter(val => !isNaN(val));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);

    const newData = data.map(row => ({
      ...row,
      [selectedColumn]: isNaN(Number(row[selectedColumn])) 
        ? row[selectedColumn] 
        : (Number(row[selectedColumn]) - mean) / std
    }));

    onDataUpdate(newData, `Standardized column ${selectedColumn}`);
    setSelectedColumn('');
  };

  const handleOneHotEncoding = () => {
    if (!encodingColumn || dataTypes[encodingColumn] !== 'categorical') {
      toast.error('Please select a categorical column for encoding');
      return;
    }

    const uniqueValues = [...new Set(data.map(row => row[encodingColumn]).filter(val => val !== null && val !== undefined && val !== ''))];
    
    const newData = data.map(row => {
      const newRow = { ...row };
      uniqueValues.forEach(value => {
        newRow[`${encodingColumn}_${value}`] = row[encodingColumn] === value ? 1 : 0;
      });
      return newRow;
    });

    onDataUpdate(newData, `One-hot encoded column ${encodingColumn}`);
    setEncodingColumn('');
  };

  // Data Filtering
  const handleFilterRows = () => {
    if (!filterColumn || filterValue === '') {
      toast.error('Please select a column and filter value');
      return;
    }

    const newData = data.filter(row => 
      String(row[filterColumn]).toLowerCase().includes(filterValue.toLowerCase())
    );

    onDataUpdate(newData, `Filtered rows where ${filterColumn} contains "${filterValue}"`);
    setFilterColumn('');
    setFilterValue('');
  };

  const handleCreateColumn = () => {
    if (!newColumnName) {
      toast.error('Please enter a column name');
      return;
    }

    const newData = data.map((row, index) => ({
      ...row,
      [newColumnName]: index + 1 // Simple example: row number
    }));

    onDataUpdate(newData, `Created new column ${newColumnName}`);
    setNewColumnName('');
  };

  const numericColumns = columns.filter(col => dataTypes[col] === 'numeric');
  const categoricalColumns = columns.filter(col => dataTypes[col] === 'categorical');
  const columnsWithMissing = columns.filter(col => statistics[col]?.nullCount > 0);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Missing Values</p>
                <p className="text-2xl font-bold">{columnsWithMissing.length}</p>
                <p className="text-xs text-gray-500">columns affected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Numeric Columns</p>
                <p className="text-2xl font-bold">{numericColumns.length}</p>
                <p className="text-xs text-gray-500">for scaling/normalization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Categorical Columns</p>
                <p className="text-2xl font-bold">{categoricalColumns.length}</p>
                <p className="text-xs text-gray-500">for encoding</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Rows</p>
                <p className="text-2xl font-bold">{data.length}</p>
                <p className="text-xs text-gray-500">current dataset size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cleaning" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cleaning">Data Cleaning</TabsTrigger>
          <TabsTrigger value="transform">Transform</TabsTrigger>
          <TabsTrigger value="filter">Filter & Select</TabsTrigger>
          <TabsTrigger value="create">Create Columns</TabsTrigger>
        </TabsList>

        <TabsContent value="cleaning" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Missing Values */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Handle Missing Values
                </CardTitle>
                <CardDescription>Fill or remove missing values in your dataset</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Column</Label>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose column with missing values" />
                    </SelectTrigger>
                    <SelectContent>
                      {columnsWithMissing.map(column => (
                        <SelectItem key={column} value={column}>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(dataTypes[column])}
                            <span>{column}</span>
                            <Badge variant="destructive" className="text-xs">
                              {statistics[column]?.nullCount} missing
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fill Value</Label>
                  <Input
                    placeholder={selectedColumn && dataTypes[selectedColumn] === 'numeric' ? 'e.g., 0, mean' : 'e.g., unknown, N/A'}
                    value={fillValue}
                    onChange={(e) => setFillValue(e.target.value)}
                  />
                </div>

                <Button onClick={handleFillMissingValues} className="w-full">
                  Fill Missing Values
                </Button>

                {selectedColumn && statistics[selectedColumn] && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {`Column "${selectedColumn}" has ${statistics[selectedColumn].nullCount} missing values 
                      (${statistics[selectedColumn].nullPercentage.toFixed(1)}% of total)`}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Data Quality */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  Data Quality
                </CardTitle>
                <CardDescription>Remove duplicates and outliers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleRemoveDuplicates} variant="outline" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Remove Duplicate Rows
                </Button>

                <Separator />

                <div className="space-y-2">
                  <Label>Remove Outliers (IQR Method)</Label>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select numeric column" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(column => (
                        <SelectItem key={column} value={column}>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(dataTypes[column])}
                            {column}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleRemoveOutliers} variant="outline" className="w-full">
                  Remove Outliers
                </Button>

                <Separator />

                <div className="space-y-2">
                  <Label>Drop Column</Label>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column to drop" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(column => (
                        <SelectItem key={column} value={column}>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(dataTypes[column])}
                            {column}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleDropColumn} variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Drop Column
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transform" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Numeric Transformations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-blue-500" />
                  Numeric Transformations
                </CardTitle>
                <CardDescription>Scale and normalize numeric columns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Numeric Column</Label>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose numeric column" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(column => (
                        <SelectItem key={column} value={column}>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(dataTypes[column])}
                            {column}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={handleNormalization} variant="outline" className="w-full">
                    Min-Max Normalization (0-1)
                  </Button>
                  <Button onClick={handleStandardization} variant="outline" className="w-full">
                    Z-Score Standardization
                  </Button>
                </div>

                {selectedColumn && statistics[selectedColumn] && dataTypes[selectedColumn] === 'numeric' && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Range: {statistics[selectedColumn].min?.toFixed(2)} to {statistics[selectedColumn].max?.toFixed(2)}<br/>
                      Mean: {statistics[selectedColumn].mean?.toFixed(2)}, Std: {statistics[selectedColumn].std?.toFixed(2)}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Categorical Transformations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-green-500" />
                  Categorical Transformations
                </CardTitle>
                <CardDescription>Encode categorical variables</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Categorical Column</Label>
                  <Select value={encodingColumn} onValueChange={setEncodingColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose categorical column" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoricalColumns.map(column => (
                        <SelectItem key={column} value={column}>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(dataTypes[column])}
                            {column}
                            <Badge variant="secondary" className="text-xs">
                              {statistics[column]?.unique} unique
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleOneHotEncoding} className="w-full">
                  One-Hot Encoding
                </Button>

                {encodingColumn && statistics[encodingColumn] && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {`This will create ${statistics[encodingColumn].unique} new binary columns.
                      Most common value: "${statistics[encodingColumn].mode}"`}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="filter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-500" />
                Filter Rows
              </CardTitle>
              <CardDescription>Filter your dataset based on column values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Column</Label>
                  <Select value={filterColumn} onValueChange={setFilterColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose column to filter by" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(column => (
                        <SelectItem key={column} value={column}>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(dataTypes[column])}
                            {column}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Filter Value</Label>
                  <Input
                    placeholder="Enter value to filter by"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleFilterRows} className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Apply Filter
              </Button>

              {filterColumn && filterValue && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {`This will keep only rows where "${filterColumn}" contains "${filterValue}"`}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Create New Column
              </CardTitle>
              <CardDescription>Add calculated or derived columns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>New Column Name</Label>
                <Input
                  placeholder="Enter column name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                />
              </div>

              <Button onClick={handleCreateColumn} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Row Index Column
              </Button>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This will create a new column with row numbers (1, 2, 3, ...)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}