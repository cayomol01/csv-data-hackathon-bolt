'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SortAsc, SortDesc, Filter, Hash, Type, Calendar } from 'lucide-react';

interface DataTableProps {
  data: any[];
  columns: string[];
  dataTypes: Record<string, string>;
}

export function DataTable({ data, columns, dataTypes }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterColumn, setFilterColumn] = useState<string>('none');
  const [filterValue, setFilterValue] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filter
    if (filterColumn && filterColumn !== 'none' && filterValue) {
      filtered = filtered.filter(row =>
        String(row[filterColumn]).toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (dataTypes[sortColumn] === 'numeric') {
          const aNum = Number(aVal) || 0;
          const bNum = Number(bVal) || 0;
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        } else {
          const aStr = String(aVal).toLowerCase();
          const bStr = String(bVal).toLowerCase();
          if (sortDirection === 'asc') {
            return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
          } else {
            return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
          }
        }
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection, filterColumn, filterValue, dataTypes]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Data Controls
          </CardTitle>
          <CardDescription>
            Search, filter, and sort your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Column</label>
              <Select value={filterColumn} onValueChange={setFilterColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No filter</SelectItem>
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
              <label className="text-sm font-medium">Filter Value</label>
              <Input
                placeholder="Filter value..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                disabled={!filterColumn || filterColumn === 'none'}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rows per page</label>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                Showing {paginatedData.length} of {filteredAndSortedData.length} rows
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{data.length} total rows</Badge>
              <Badge variant="outline">{columns.length} columns</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="w-full  overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="p-3 text-left border-r cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort(column)}
                      >
                        <div className="flex items-center gap-2 min-w-32">
                          {getTypeIcon(dataTypes[column])}
                          <span className="font-medium text-sm truncate">{column}</span>
                          {sortColumn === column && (
                            sortDirection === 'asc' ? 
                              <SortAsc className="w-4 h-4 text-blue-500" /> : 
                              <SortDesc className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {dataTypes[column]}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                      {columns.map((column) => (
                        <td key={column} className="p-3 border-r text-sm">
                          <div className="max-w-32 truncate" title={String(row[column])}>
                            {row[column] === null || row[column] === undefined || row[column] === '' ? (
                              <span className="text-gray-400 italic">null</span>
                            ) : (
                              String(row[column])
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}