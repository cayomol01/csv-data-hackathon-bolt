'use client';

import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, BarChart3, Download, Undo2, Redo2, RefreshCw, TrendingUp, Info, Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import { DataVisualization } from '@/components/data-visualization';
import { DataTransformations } from '@/components/data-transformations';
import { DataAnalysis } from '@/components/data-analysis';
import { ExportPanel } from '@/components/export-panel';

interface DataState {
  data: any[];
  columns: string[];
  fileName: string;
  dataTypes: Record<string, string>;
  statistics: Record<string, any>;
}

interface HistoryState extends DataState {
  timestamp: number;
  action: string;
}

export default function Home() {
  const [dataState, setDataState] = useState<DataState | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('data');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeDataTypes = useCallback((data: any[]) => {
    if (!data.length) return {};
    
    const types: Record<string, string> = {};
    const firstRow = data[0];
    
    Object.keys(firstRow).forEach(column => {
      const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
      if (values.length === 0) {
        types[column] = 'unknown';
        return;
      }
      
      const numericValues = values.filter(val => !isNaN(Number(val)));
      const dateValues = values.filter(val => !isNaN(Date.parse(val)));
      
      if (numericValues.length === values.length) {
        types[column] = 'numeric';
      } else if (dateValues.length === values.length) {
        types[column] = 'date';
      } else {
        types[column] = 'categorical';
      }
    });
    
    return types;
  }, []);

  const calculateStatistics = useCallback((data: any[], dataTypes: Record<string, string>) => {
    if (!data.length) return {};
    
    const stats: Record<string, any> = {};
    
    Object.keys(dataTypes).forEach(column => {
      const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
      const nullCount = data.length - values.length;
      
      stats[column] = {
        count: values.length,
        nullCount,
        nullPercentage: (nullCount / data.length) * 100,
        type: dataTypes[column]
      };
      
      if (dataTypes[column] === 'numeric') {
        const numValues = values.map(val => Number(val)).filter(val => !isNaN(val));
        if (numValues.length > 0) {
          stats[column] = {
            ...stats[column],
            mean: numValues.reduce((a, b) => a + b, 0) / numValues.length,
            median: numValues.sort((a, b) => a - b)[Math.floor(numValues.length / 2)],
            min: Math.min(...numValues),
            max: Math.max(...numValues),
            std: Math.sqrt(numValues.reduce((sq, n) => sq + Math.pow(n - (numValues.reduce((a, b) => a + b, 0) / numValues.length), 2), 0) / numValues.length)
          };
        }
      } else if (dataTypes[column] === 'categorical') {
        const uniqueValues = Array.from(new Set(values));
        const valueCounts = uniqueValues.reduce((acc, val) => {
          acc[val] = values.filter(v => v === val).length;
          return acc;
        }, {} as Record<string, number>);
        
        stats[column] = {
          ...stats[column],
          unique: uniqueValues.length,
          uniquePercentage: (uniqueValues.length / values.length) * 100,
          mode: Object.keys(valueCounts).reduce((a, b) => valueCounts[a] > valueCounts[b] ? a : b),
          valueCounts
        };
      }
    });
    
    return stats;
  }, []);

  const addToHistory = useCallback((newState: DataState, action: string) => {
    const historyState: HistoryState = {
      ...newState,
      timestamp: Date.now(),
      action
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(historyState);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const updateDataState = useCallback((newData: any[], action: string) => {
    if (!dataState) return;
    
    const dataTypes = analyzeDataTypes(newData);
    const statistics = calculateStatistics(newData, dataTypes);
    
    const newState: DataState = {
      ...dataState,
      data: newData,
      columns: Object.keys(newData[0] || {}),
      dataTypes,
      statistics
    };
    
    setDataState(newState);
    addToHistory(newState, action);
    toast.success(`${action} completed successfully`);
  }, [dataState, analyzeDataTypes, calculateStatistics, addToHistory]);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file');
          setIsUploading(false);
          return;
        }

        const data = results.data as any[];
        const columns = Object.keys(data[0] || {});
        const dataTypes = analyzeDataTypes(data);
        const statistics = calculateStatistics(data, dataTypes);

        const newState: DataState = {
          data,
          columns,
          fileName: file.name,
          dataTypes,
          statistics
        };

        setDataState(newState);
        setHistory([]);
        setHistoryIndex(-1);
        addToHistory(newState, 'File uploaded');
        setIsUploading(false);
        setUploadProgress(100);
        setActiveTab('data');
        
        toast.success(`Successfully loaded ${data.length} rows`);
      },
      error: (error) => {
        toast.error('Error reading file');
        setIsUploading(false);
      }
    });
  }, [analyzeDataTypes, calculateStatistics, addToHistory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setDataState(previousState);
      setHistoryIndex(historyIndex - 1);
      toast.success(`Undid: ${history[historyIndex].action}`);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setDataState(nextState);
      setHistoryIndex(historyIndex + 1);
      toast.success(`Redid: ${nextState.action}`);
    }
  }, [history, historyIndex]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  if (!dataState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 pt-12">
            <BarChart3 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">CSV Data Analyzer</h1>
            <p className="text-xl text-gray-600">Professional data analysis and visualization tool</p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Your CSV File
              </CardTitle>
              <CardDescription>
                Drag and drop your CSV file or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div className="space-y-4">
                    <RefreshCw className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
                    <p className="text-lg font-medium">Processing your file...</p>
                    <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">Drop your CSV file here</p>
                      <p className="text-gray-500">or click to browse</p>
                    </div>
                    <Button variant="outline" size="lg">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </CardContent>
          </Card>

          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Smart Analysis</h3>
                <p className="text-sm text-gray-600">Automatic data type detection and statistical analysis</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Settings className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Data Cleaning</h3>
                <p className="text-sm text-gray-600">Handle missing values, outliers, and data transformations</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Visualizations</h3>
                <p className="text-sm text-gray-600">Create beautiful charts and export your analysis</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CSV Data Analyzer</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{dataState.fileName}</span>
                  <Badge variant="secondary">{dataState.data.length} rows</Badge>
                  <Badge variant="secondary">{dataState.columns.length} columns</Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
              >
                <Undo2 className="w-4 h-4 mr-1" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo2 className="w-4 h-4 mr-1" />
                Redo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                New File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Data View
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="transform" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Transform
            </TabsTrigger>
            <TabsTrigger value="visualize" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Visualize
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4">
            <DataTable data={dataState.data} columns={dataState.columns} dataTypes={dataState.dataTypes} />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <DataAnalysis dataState={dataState} />
          </TabsContent>

          <TabsContent value="transform" className="space-y-4">
            <DataTransformations 
              dataState={dataState} 
              onDataUpdate={updateDataState}
            />
          </TabsContent>

          <TabsContent value="visualize" className="space-y-4">
            <DataVisualization dataState={dataState} />
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <ExportPanel dataState={dataState} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}