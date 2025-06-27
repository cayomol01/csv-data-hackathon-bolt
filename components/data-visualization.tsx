'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ScatterChart, 
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, ChartScatter as ScatterIcon, TrendingUp, Hash, Type, Download, Settings } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface DataVisualizationProps {
  dataState: {
    data: any[];
    columns: string[];
    fileName: string
    dataTypes: Record<string, string>;
    statistics: Record<string, any>;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export function DataVisualization({ dataState }: DataVisualizationProps) {
  const { data, columns, dataTypes, statistics } = dataState;
  
  const [selectedChart, setSelectedChart] = useState<string>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [groupBy, setGroupBy] = useState<string>('');
  const [aggregation, setAggregation] = useState<string>('count');

  const numericColumns = columns.filter(col => dataTypes[col] === 'numeric');
  const categoricalColumns = columns.filter(col => dataTypes[col] === 'categorical');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'numeric':
        return <Hash className="w-4 h-4 text-blue-500" />;
      case 'categorical':
        return <Type className="w-4 h-4 text-green-500" />;
      default:
        return <Type className="w-4 h-4 text-gray-500" />;
    }
  };

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!data.length) return [];

    switch (selectedChart) {
      case 'bar':
      case 'line':
        if (xAxis && yAxis) {
          if (dataTypes[xAxis] === 'categorical' && dataTypes[yAxis] === 'numeric') {
            // Group by categorical and aggregate numeric
            const grouped = data.reduce((acc, row) => {
              const key = row[xAxis];
              if (!acc[key]) acc[key] = [];
              acc[key].push(Number(row[yAxis]) || 0);
              return acc;
            }, {} as Record<string, number[]>);

            return Object.entries(grouped).map(([key, values]: [string, number[]]) => ({
              name: key,
              value: aggregation === 'count' ? values.length :
                     aggregation === 'sum' ? values.reduce((a, b) => a + b, 0) :
                     aggregation === 'avg' ? values.reduce((a, b) => a + b, 0) / values.length :
                     Math.max(...values)
            }));
          } else if (dataTypes[xAxis] === 'categorical') {
            // Count frequency
            const counts = data.reduce((acc, row) => {
              const key = row[xAxis];
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return Object.entries(counts).map(([key, count]) => ({
              name: key,
              value: count
            }));
          }
        } else if (xAxis && dataTypes[xAxis] === 'categorical') {
          // Simple frequency count
          const counts = data.reduce((acc, row) => {
            const key = row[xAxis];
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return Object.entries(counts).map(([key, count]) => ({
            name: key,
            value: count
          }));
        }
        break;

      case 'pie':
        if (xAxis && dataTypes[xAxis] === 'categorical') {
          const counts = data.reduce((acc, row) => {
            const key = row[xAxis];
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8) // Limit to top 8 categories
            .map(([key, count]) => ({
              name: key,
              value: count
            }));
        }
        break;

      case 'scatter':
        if (xAxis && yAxis && dataTypes[xAxis] === 'numeric' && dataTypes[yAxis] === 'numeric') {
          return data
            .filter(row => !isNaN(Number(row[xAxis])) && !isNaN(Number(row[yAxis])))
            .map((row, index) => ({
              x: Number(row[xAxis]),
              y: Number(row[yAxis]),
              name: groupBy ? row[groupBy] : `Point ${index + 1}`
            }));
        }
        break;
    }

    return [];
  }, [data, selectedChart, xAxis, yAxis, groupBy, aggregation, dataTypes]);

  // Chart recommendations
  const getRecommendations = () => {
    const recommendations = [];

    if (categoricalColumns.length > 0) {
      recommendations.push({
        type: 'bar',
        title: 'Categorical Distribution',
        description: `Visualize frequency of ${categoricalColumns[0]}`,
        setup: () => {
          setSelectedChart('bar');
          setXAxis(categoricalColumns[0]);
          setYAxis('');
        }
      });

      recommendations.push({
        type: 'pie',
        title: 'Categorical Breakdown',
        description: `Show proportions of ${categoricalColumns[0]}`,
        setup: () => {
          setSelectedChart('pie');
          setXAxis(categoricalColumns[0]);
          setYAxis('');
        }
      });
    }

    if (numericColumns.length >= 2) {
      recommendations.push({
        type: 'scatter',
        title: 'Correlation Analysis',
        description: `Explore relationship between ${numericColumns[0]} and ${numericColumns[1]}`,
        setup: () => {
          setSelectedChart('scatter');
          setXAxis(numericColumns[0]);
          setYAxis(numericColumns[1]);
        }
      });
    }

    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      recommendations.push({
        type: 'bar',
        title: 'Grouped Analysis',
        description: `Compare ${numericColumns[0]} across ${categoricalColumns[0]}`,
        setup: () => {
          setSelectedChart('bar');
          setXAxis(categoricalColumns[0]);
          setYAxis(numericColumns[0]);
          setAggregation('avg');
        }
      });
    }

    return recommendations;
  };

  const downloadChart = () => {
    // This would implement chart download functionality
    toast.info('Chart download functionality is coming soon!');
  };

  return (
    <div className="space-y-6">
      {/* Chart Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Recommended Visualizations
          </CardTitle>
          <CardDescription>Quick chart suggestions based on your data types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {getRecommendations().map((rec, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 text-left justify-start"
                onClick={rec.setup}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {rec.type === 'bar' && <BarChart3 className="w-4 h-4" />}
                    {rec.type === 'pie' && <PieIcon className="w-4 h-4" />}
                    {rec.type === 'scatter' && <ScatterIcon className="w-4 h-4" />}
                    <span className="font-medium text-sm">{rec.title}</span>
                  </div>
                  <p className="text-xs text-gray-600">{rec.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Chart Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Chart Type</Label>
              <Select value={selectedChart} onValueChange={setSelectedChart}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Bar Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineIcon className="w-4 h-4" />
                      Line Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center gap-2">
                      <PieIcon className="w-4 h-4" />
                      Pie Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="scatter">
                    <div className="flex items-center gap-2">
                      <ScatterIcon className="w-4 h-4" />
                      Scatter Plot
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>X-Axis</Label>
              <Select value={xAxis} onValueChange={setXAxis}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
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

            {(selectedChart === 'bar' || selectedChart === 'line' || selectedChart === 'scatter') && (
              <div className="space-y-2">
                <Label>Y-Axis</Label>
                <Select value={yAxis} onValueChange={setYAxis}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Auto (Count)</SelectItem>
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
            )}

            {yAxis && dataTypes[yAxis] === 'numeric' && (
              <div className="space-y-2">
                <Label>Aggregation</Label>
                <Select value={aggregation} onValueChange={setAggregation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="avg">Average</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedChart === 'scatter' && categoricalColumns.length > 0 && (
              <div className="space-y-2">
                <Label>Group By (Optional)</Label>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grouping column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No grouping</SelectItem>
                    {categoricalColumns.map(column => (
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
            )}

            <Button onClick={downloadChart} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Chart
            </Button>
          </CardContent>
        </Card>

        {/* Chart Display */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedChart === 'bar' && 'Bar Chart'}
                  {selectedChart === 'line' && 'Line Chart'}
                  {selectedChart === 'pie' && 'Pie Chart'}
                  {selectedChart === 'scatter' && 'Scatter Plot'}
                </CardTitle>
                <CardDescription>
                  {xAxis && yAxis ? `${xAxis} vs ${yAxis}` : 
                   xAxis ? `Distribution of ${xAxis}` : 
                   'Configure chart settings to view visualization'}
                </CardDescription>
              </div>
              <Badge variant="secondary">{chartData.length} data points</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedChart === 'bar' && (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  )}

                  {selectedChart === 'line' && (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  )}

                  {selectedChart === 'pie' && (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  )}

                  {selectedChart === 'scatter' && (
                    <ScatterChart
                      data={chartData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis type="number" dataKey="x" name={xAxis} fontSize={12} />
                      <YAxis type="number" dataKey="y" name={yAxis} fontSize={12} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Data Points" data={chartData} fill="#3B82F6" />
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                <div className="text-center space-y-2">
                  <BarChart3 className="w-16 h-16 mx-auto text-gray-300" />
                  <p className="text-lg font-medium">No Data to Display</p>
                  <p className="text-sm">Configure the chart settings to generate a visualization</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistical Insights */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chart Insights</CardTitle>
            <CardDescription>Statistical summary of the visualized data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{chartData.length}</p>
                <p className="text-sm text-gray-600">Data Points</p>
              </div>
              {selectedChart !== 'pie' && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.max(...chartData.map(d => d.value || 0)).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Maximum Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {(chartData.reduce((sum, d) => sum + (d.value || 0), 0) / chartData.length).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Average Value</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <Toaster/>
    </div>
  );
}