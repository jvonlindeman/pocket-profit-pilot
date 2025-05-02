
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartData } from '@/types/financial';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueChartProps {
  incomeData: ChartData;
  expenseData: ChartData;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ incomeData, expenseData }) => {
  // Preparamos los datos para el gráfico
  const chartData = incomeData.labels.map((label, index) => ({
    name: label,
    ingresos: incomeData.values[index],
    gastos: expenseData.values[index],
    beneficio: incomeData.values[index] - expenseData.values[index]
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución de Ingresos y Gastos</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              barGap={0}
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
              <Bar dataKey="ingresos" name="Ingresos" fill="#2ecc71" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#e74c3c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="beneficio" name="Beneficio" fill="#3498db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
