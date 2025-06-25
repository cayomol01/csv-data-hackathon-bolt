'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Hash, Type, Calendar, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DataAnalysisProps {
  dataState: {
    data: any[];
    columns: string[];
    fileName: string;
    dataTypes: Record<string, string>;
    statistics: Record<string, any>;
  };
}

export function DataAnalysis({ dataState }: DataAnalysisProps) {
  const { data, columns, dataTypes, statistics } = dataState;

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

  const getDataQualityColor = (percentage: number) => {
    if (percentage < 5) return 'text-green-600';
    if (percentage < 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const numericColumns = columns.filter(col => dataTypes[col] === 'numeric');
  const categoricalColumns = columns.filter(col => dataTypes[col] === 'categorical');
  const dateColumns = columns.filter(col => dataTypes[col] === 'date');

  const overallDataQuality = columns.reduce((acc, col) => {
    return acc + (statistics[col]?.nullPercentage || 0);
  }, 0) / columns.length;

  const dataQualityData = columns.map(col => ({
    column: col,
    nullPercentage: statistics[col]?.nullPercentage || 0,
    type: dataTypes[col]
  })).sort((a, b) => b.nullPercentage - a.nullPercentage);

  const typeDistribution = [
    { name: 'Numeric', value: numericColumns.length, color: '#3B82F6' },
    { name: 'Categorical', value: categoricalColumns.length, color: '#10B981' },
    { name: 'Date', value: dateColumns.length, color: '#8B5CF6' },
    { name: 'Other', value: columns.length - numericColumns.length - categoricalColumns.length - dateColumns.length, color: '#6B7280' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rows</p>
                <p className="text-2xl font-bold">{data.length.toLocaleString()}</p>
              </div>
              <Hash className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Columns</p>
                <p className="text-2xl font-bold">{columns.length}</p>
              </div>
              <Type className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Quality</p>
                <p className={`text-2xl font-bold ${getDataQualityColor(overallDataQuality)}`}>
                  {(100 - overallDataQuality).toFixed(1)}%
                </p>
              </div>
              {overallDataQuality < 5 ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                <p className="text-2xl font-bold">{((data.length * columns.length * 8) / 1024 / 1024).toFixed(1)}MB</p>
              </div>
              <Info className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Column Types Distribution</CardTitle>
            <CardDescription>Breakdown of data types in your dataset</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typeDistribution.map((type, index) => (
                <div key={type.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="font-medium">{type.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{type.value}</Badge>
                    <span className="text-sm text-gray-500">
                      {((type.value / columns.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Quality Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Data Quality Overview</CardTitle>
            <CardDescription>Missing values analysis by column</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {dataQualityData.map((item) => (
                  <div key={item.column} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm font-medium truncate max-w-32">{item.column}</span>
                      </div>
                      <span className={`text-sm font-medium ${getDataQualityColor(item.nullPercentage)}`}>
                        {item.nullPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={item.nullPercentage} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Numeric Columns Analysis */}
        {numericColumns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-500" />
                Numeric Columns Analysis
              </CardTitle>
              <CardDescription>{numericColumns.length} numeric columns detected</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-6">
                  {numericColumns.map((column) => {
                    const stats = statistics[column];
                    if (!stats || !stats.mean) return null;

                    return (
                      <div key={column} className="space-y-3">
                        <h4 className="font-medium text-sm">{column}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Mean:</span>
                            <span className="ml-2 font-medium">{stats.mean.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Median:</span>
                            <span className="ml-2 font-medium">{stats.median.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Min:</span>
                            <span className="ml-2 font-medium">{stats.min.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Max:</span>
                            <span className="ml-2 font-medium">{stats.max.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Std Dev:</span>
                            <span className="ml-2 font-medium">{stats.std.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Missing:</span>
                            <span className="ml-2 font-medium">{stats.nullCount}</span>
                          </div>
                        </div>
                        {numericColumns.indexOf(column) < numericColumns.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Categorical Columns Analysis */}
        {categoricalColumns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5 text-green-500" />
                Categorical Columns Analysis
              </CardTitle>
              <CardDescription>{categoricalColumns.length} categorical columns detected</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-6">
                  {categoricalColumns.map((column) => {
                    const stats = statistics[column];
                    if (!stats || !stats.valueCounts) return null;

                    const topValues = Object.entries(stats.valueCounts)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 5);

                    return (
                      <div key={column} className="space-y-3">
                        <h4 className="font-medium text-sm">{column}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Unique values:</span>
                            <span className="ml-2 font-medium">{stats.unique}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Mode:</span>
                            <span className="ml-2 font-medium truncate">{stats.mode}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Uniqueness:</span>
                            <span className="ml-2 font-medium">{stats.uniquePercentage.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Missing:</span>
                            <span className="ml-2 font-medium">{stats.nullCount}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-gray-600">Top Values:</span>
                          {topValues.map(([value, count]) => (
                            <div key={value} className="flex items-center justify-between text-xs">
                              <span className="truncate max-w-24">{value}</span>
                              <Badge variant="outline" className="text-xs">
                                {count} ({(((count as number) / stats.count) * 100).toFixed(1)}%)
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {categoricalColumns.indexOf(column) < categoricalColumns.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Missing Values Chart */}
      {columns.some(col => statistics[col]?.nullPercentage > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Missing Values by Column</CardTitle>
            <CardDescription>Percentage of missing values for each column with missing data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataQualityData.filter(item => item.nullPercentage > 0)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="column" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                  />
                  <YAxis 
                    label={{ value: 'Missing %', angle: -90, position: 'insideLeft' }}
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Missing']}
                    labelFormatter={(label) => `Column: ${label}`}
                  />
                  <Bar dataKey="nullPercentage" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}