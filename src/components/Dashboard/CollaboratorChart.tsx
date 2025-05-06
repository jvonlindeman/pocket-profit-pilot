
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategorySummary } from '@/types/financial';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CollaboratorChartProps {
  collaboratorData: CategorySummary[];
}

const CollaboratorChart: React.FC<CollaboratorChartProps> = ({ collaboratorData }) => {
  // Colores personalizados para el gráfico de colaboradores
  const getCollaboratorColor = (index: number) => {
    const colors = [
      '#4f6d7a', '#c0d6df', '#dbe9ee', '#4a6fa5', '#166088',
      '#03a696', '#45b7b8', '#ddbaa9', '#938581', '#a2a7a5'
    ];
    return colors[index % colors.length];
  };

  // Preparamos datos para el gráfico
  const chartData = collaboratorData.map((item) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage.toFixed(1) + '%'
  }));

  // Formateo de moneda (en USD)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Renderizado personalizado para el tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-100">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatCurrency(payload[0].value)}</p>
          <p className="text-sm text-gray-500">{payload[0].payload.percentage}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Pagos a Colaboradores (USD)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCollaboratorColor(index)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry, index) => {
                  const item = chartData[index];
                  return <span className="text-sm">{value} ({item.percentage})</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollaboratorChart;
