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
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, ChartScatter as ScatterIcon, TrendingUp, Hash, Type, Download, Settings } from 'lucide-react';import Image from 'next/image';
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

interface ChartContainerProps {
  chart: string;
  chartData: any[];
  xAxis: string;
  yAxis: string;
}


export default function ChartContainer({ chart, chartData, xAxis, yAxis }: ChartContainerProps) {
    if (chart==="bar"){
        return (
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
        )
    }
    else if (chart==="line"){
        return (
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
        )
    }
    else if (chart==="pie"){
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
    }
    else if (chart==="scatter"){
        return (
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
        )
    }
    return (
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
    );
}