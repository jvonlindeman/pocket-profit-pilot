
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

  // Filtrar colaboradores excluyendo a los dueños de la empresa
  const filteredData = collaboratorData.filter((item) => 
    item.category !== 'Johan von Lindeman' && item.category !== 'Daniel Chen'
  );

  // Recalcular porcentajes basados en el nuevo total (después de filtrar)
  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);
  const chartData = filteredData.map((item) => ({
    name: item.category,
    value: item.amount,
    percentage: ((item.amount / totalAmount) * 100).toFixed(1) + '%',
    date: item.date || 'N/A'  // Incluimos la fecha, con un valor predeterminado si no existe
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
          {payload[0].payload.date && payload[0].payload.date !== 'N/A' && (
            <p className="text-xs text-gray-400">Fecha: {payload[0].payload.date}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Si no hay datos después de filtrar, mostrar un mensaje
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Pagos a Colaboradores (USD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-gray-500">
            No hay datos de colaboradores para mostrar
          </div>
        </CardContent>
      </Card>
    );
  }

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
                  return (
                    <span className="text-sm">
                      {value} ({item.percentage})
                      {item.date && item.date !== 'N/A' && (
                        <span className="block text-xs text-gray-500">{item.date}</span>
                      )}
                    </span>
                  );
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
