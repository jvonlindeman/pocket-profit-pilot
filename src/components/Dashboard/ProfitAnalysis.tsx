
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartData } from '@/types/financial';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfitAnalysisProps {
  monthlyData: {
    income: ChartData;
    expense: ChartData;
    profit: ChartData;
  };
}

const ProfitAnalysis: React.FC<ProfitAnalysisProps> = ({ monthlyData }) => {
  // Ensure we have valid data before trying to map it
  if (!monthlyData || !monthlyData.income || !monthlyData.income.labels || !Array.isArray(monthlyData.income.labels)) {
    // Return a placeholder when data is not available
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Rentabilidad Mensual (USD)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px] bg-gray-50">
          <p className="text-gray-500">No hay datos suficientes para mostrar el gráfico</p>
        </CardContent>
      </Card>
    );
  }

  // Now we can safely prepare chart data
  const chartData = monthlyData.income.labels.map((label, index) => ({
    name: label,
    ingresos: monthlyData.income.values[index] || 0,
    gastos: monthlyData.expense.values[index] || 0,
    beneficio: monthlyData.profit.values[index] || 0
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Rentabilidad Mensual (USD)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                labelStyle={{ fontWeight: 'bold' }}
                contentStyle={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#2ecc71" dot={{ stroke: '#2ecc71', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} strokeWidth={2} />
              <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#e74c3c" dot={{ stroke: '#e74c3c', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} strokeWidth={2} />
              <Line type="monotone" dataKey="beneficio" name="Beneficio" stroke="#3498db" dot={{ stroke: '#3498db', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitAnalysis;
