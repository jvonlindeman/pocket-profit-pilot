
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategorySummary } from '@/types/financial';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseChartProps {
  expenseData: CategorySummary[];
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenseData }) => {
  // Safety check for the entire expense data array
  if (!expenseData || !Array.isArray(expenseData) || expenseData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Gastos (USD)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] bg-gray-50">
          <p className="text-gray-500">No hay datos suficientes para mostrar el gráfico</p>
        </CardContent>
      </Card>
    );
  }

  // Make a defensive copy of the data and ensure all required properties exist
  const safeExpenseData = expenseData.map(item => ({
    category: item.category || 'Sin categoría',
    amount: typeof item.amount === 'number' ? item.amount : 0,
    percentage: typeof item.percentage === 'number' ? item.percentage : 0
  }));

  // Filtramos los pagos a colaboradores de los datos
  const filteredExpenseData = safeExpenseData.filter(item => 
    item.category.toLowerCase() !== 'pagos a colaboradores'
  );

  // Safety check for filtered data
  if (filteredExpenseData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Gastos (USD)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] bg-gray-50">
          <p className="text-gray-500">No hay gastos distintos a pagos a colaboradores para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  // Colores personalizados según categorías
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'software': '#9b59b6',
      'tools': '#f39c12',
      'personal': '#1abc9c',
      'default': '#95a5a6'
    };

    return colors[(category || '').toLowerCase()] || colors.default;
  };

  // Preparamos datos para el gráfico with safety checks for percentage
  const chartData = filteredExpenseData.map((item) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage !== undefined && !isNaN(item.percentage) 
      ? item.percentage.toFixed(1) + '%' 
      : '0.0%'
  }));

  // Formateo de moneda (ahora en USD)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Renderizado personalizado para el tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0]) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-100">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatCurrency(payload[0].value)}</p>
          <p className="text-sm text-gray-500">{payload[0].payload?.percentage || '0.0%'}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Gastos (USD)</CardTitle>
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
                  <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry, index) => {
                  const item = chartData[index];
                  return <span className="text-sm">{value} ({item?.percentage || '0.0%'})</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseChart;
