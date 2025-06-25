'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  BarChart3, 
  FileImage, 
  FileSpreadsheet,
  CheckCircle,
  Info,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

interface ExportPanelProps {
  dataState: {
    data: any[];
    columns: string[];
    fileName: string;
    dataTypes: Record<string, string>;
    statistics: Record<string, any>;
  };
}

export function ExportPanel({ dataState }: ExportPanelProps) {
  const { data, columns, fileName, dataTypes, statistics } = dataState;
  const [isExporting, setIsExporting] = useState(false);

  const downloadCSV = () => {
    setIsExporting(true);
    
    try {
      // Convert data to CSV format
      const headers = columns.join(',');
      const csvContent = data.map(row => 
        columns.map(col => {
          const value = row[col];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      ).join('\n');
      
      const fullCsv = `${headers}\n${csvContent}`;
      
      // Create and download file
      const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `processed_${fileName || 'data.csv'}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV file downloaded successfully');
    } catch (error) {
      toast.error('Error downloading CSV file');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadJSON = () => {
    setIsExporting(true);
    
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `processed_${fileName?.replace('.csv', '.json') || 'data.json'}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('JSON file downloaded successfully');
    } catch (error) {
      toast.error('Error downloading JSON file');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadAnalysisReport = () => {
    setIsExporting(true);
    
    try {
      const report = generateAnalysisReport();
      const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analysis_report_${fileName?.replace('.csv', '.txt') || 'data.txt'}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Analysis report downloaded successfully');
    } catch (error) {
      toast.error('Error downloading analysis report');
    } finally {
      setIsExporting(false);
    }
  };

  const generateAnalysisReport = () => {
    const numericColumns = columns.filter(col => dataTypes[col] === 'numeric');
    const categoricalColumns = columns.filter(col => dataTypes[col] === 'categorical');
    const dateColumns = columns.filter(col => dataTypes[col] === 'date');
    
    let report = `DATA ANALYSIS REPORT\n`;
    report += `===================\n\n`;
    report += `File: ${fileName}\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    report += `DATASET OVERVIEW\n`;
    report += `----------------\n`;
    report += `Total Rows: ${data.length.toLocaleString()}\n`;
    report += `Total Columns: ${columns.length}\n`;
    report += `Numeric Columns: ${numericColumns.length}\n`;
    report += `Categorical Columns: ${categoricalColumns.length}\n`;
    report += `Date Columns: ${dateColumns.length}\n\n`;
    
    report += `DATA QUALITY\n`;
    report += `------------\n`;
    const totalMissingValues = columns.reduce((sum, col) => sum + (statistics[col]?.nullCount || 0), 0);
    const totalCells = data.length * columns.length;
    const dataQuality = ((totalCells - totalMissingValues) / totalCells) * 100;
    report += `Data Quality Score: ${dataQuality.toFixed(1)}%\n`;
    report += `Total Missing Values: ${totalMissingValues.toLocaleString()}\n`;
    report += `Missing Value Rate: ${((totalMissingValues / totalCells) * 100).toFixed(2)}%\n\n`;
    
    if (numericColumns.length > 0) {
      report += `NUMERIC COLUMNS ANALYSIS\n`;
      report += `------------------------\n`;
      numericColumns.forEach(column => {
        const stats = statistics[column];
        if (stats && stats.mean !== undefined) {
          report += `\n${column}:\n`;
          report += `  Mean: ${stats.mean.toFixed(2)}\n`;
          report += `  Median: ${stats.median.toFixed(2)}\n`;
          report += `  Min: ${stats.min.toFixed(2)}\n`;
          report += `  Max: ${stats.max.toFixed(2)}\n`;
          report += `  Standard Deviation: ${stats.std.toFixed(2)}\n`;
          report += `  Missing Values: ${stats.nullCount} (${stats.nullPercentage.toFixed(1)}%)\n`;
        }
      });
      report += `\n`;
    }
    
    if (categoricalColumns.length > 0) {
      report += `CATEGORICAL COLUMNS ANALYSIS\n`;
      report += `----------------------------\n`;
      categoricalColumns.forEach(column => {
        const stats = statistics[column];
        if (stats && stats.unique !== undefined) {
          report += `\n${column}:\n`;
          report += `  Unique Values: ${stats.unique}\n`;
          report += `  Most Common: ${stats.mode}\n`;
          report += `  Uniqueness: ${stats.uniquePercentage.toFixed(1)}%\n`;
          report += `  Missing Values: ${stats.nullCount} (${stats.nullPercentage.toFixed(1)}%)\n`;
          
          if (stats.valueCounts) {
            const topValues = Object.entries(stats.valueCounts)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 5);
            report += `  Top 5 Values:\n`;
            topValues.forEach(([value, count]) => {
              report += `    ${value}: ${count} (${(((count as number) / stats.count) * 100).toFixed(1)}%)\n`;
            });
          }
        }
      });
      report += `\n`;
    }
    
    report += `COLUMN DETAILS\n`;
    report += `--------------\n`;
    columns.forEach(column => {
      report += `${column}: ${dataTypes[column]}\n`;
    });
    
    return report;
  };

  const downloadAllCharts = () => {
    // This would implement chart download functionality
    toast.success('Chart download functionality would be implemented here');
  };

  const downloadEverything = () => {
    downloadCSV();
    setTimeout(() => downloadJSON(), 500);
    setTimeout(() => downloadAnalysisReport(), 1000);
    toast.success('Complete export package initiated');
  };

  const getFileSizeEstimate = () => {
    const csvSize = (data.length * columns.length * 10) / 1024; // Rough estimate in KB
    return csvSize > 1024 ? `${(csvSize / 1024).toFixed(1)} MB` : `${csvSize.toFixed(0)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Export Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Export Overview
          </CardTitle>
          <CardDescription>Current dataset ready for export</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{data.length.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Rows</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{columns.length}</p>
              <p className="text-sm text-gray-600">Columns</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{getFileSizeEstimate()}</p>
              <p className="text-sm text-gray-600">Est. Size</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">Ready</span>
              </div>
              <p className="text-sm text-gray-600">Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-500" />
              Data Export
            </CardTitle>
            <CardDescription>Export your processed dataset in various formats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={downloadCSV} 
              className="w-full justify-start" 
              disabled={isExporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              Download as CSV
              <Badge variant="secondary" className="ml-auto">
                {getFileSizeEstimate()}
              </Badge>
            </Button>

            <Button 
              onClick={downloadJSON} 
              variant="outline" 
              className="w-full justify-start"
              disabled={isExporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              Download as JSON
              <Badge variant="secondary" className="ml-auto">
                Structured
              </Badge>
            </Button>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                CSV format preserves all data transformations and is compatible with Excel, Google Sheets, and other analysis tools.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Analysis Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Analysis Export
            </CardTitle>
            <CardDescription>Export analysis reports and visualizations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={downloadAnalysisReport} 
              variant="outline" 
              className="w-full justify-start"
              disabled={isExporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              Statistical Report
              <Badge variant="secondary" className="ml-auto">
                TXT
              </Badge>
            </Button>

            <Button 
              onClick={downloadAllCharts} 
              variant="outline" 
              className="w-full justify-start"
              disabled={isExporting}
            >
              <FileImage className="w-4 h-4 mr-2" />
              All Visualizations
              <Badge variant="secondary" className="ml-auto">
                PNG
              </Badge>
            </Button>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The statistical report includes comprehensive analysis of all columns, data quality metrics, and insights.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Complete Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-500" />
            Complete Export Package
          </CardTitle>
          <CardDescription>Download everything in one go</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={downloadEverything} 
            size="lg" 
            className="w-full"
            disabled={isExporting}
          >
            <Package className="w-5 h-5 mr-2" />
            {isExporting ? 'Preparing Downloads...' : 'Download Complete Package'}
          </Button>
          
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium mb-2">This package includes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Processed dataset (CSV format)</li>
              <li>Raw data in JSON format</li>
              <li>Complete statistical analysis report</li>
              <li>Data quality assessment</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* File Information */}
      <Card>
        <CardHeader>
          <CardTitle>File Information</CardTitle>
          <CardDescription>Details about your current dataset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Original File:</span>
              <span className="ml-2">{fileName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Processing Date:</span>
              <span className="ml-2">{new Date().toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Data Types:</span>
              <div className="ml-2 flex flex-wrap gap-1 mt-1">
                {Object.entries(
                  columns.reduce((acc, col) => {
                    const type = dataTypes[col];
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Data Quality:</span>
              <span className="ml-2">
                {(100 - (columns.reduce((sum, col) => sum + (statistics[col]?.nullPercentage || 0), 0) / columns.length)).toFixed(1)}% complete
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}