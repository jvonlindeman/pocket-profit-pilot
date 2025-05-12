
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategorySummary } from '@/types/financial';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseChartProps {
  expenseData: CategorySummary[];
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenseData }) => {
  // Filtramos los pagos a colaboradores de los datos
  const filteredExpenseData = expenseData.filter(item => 
    item.category.toLowerCase() !== 'pagos a colaboradores'
  );

  // Colores personalizados según categorías
  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase();
    const colors: Record<string, string> = {
      'software': '#7E8E99', // Grayish blue for software
      'softwares especiales': '#7E8E99',
      'tools': '#9b87f5', // Purple for tools
      'personal': '#6E59A5', // Darker purple for personal
      'ai tools': '#8B5CF6', // Vivid purple for AI tools
      'herramientas ia': '#8B5CF6',
      'seo tools': '#D6BCFA', // Light purple for SEO
      'publicidad': '#F97316', // Orange for ads
      'publicidad y marketing': '#F97316',
      'google ads': '#0EA5E9', // Blue for Google Ads
      'google ads costos clientes': '#0EA5E9',
      'facebook ads': '#D946EF', // Pink for Facebook Ads
      'fb ig ads presupuesto': '#D946EF',
      'impuestos': '#64748B', // Slate for taxes
      'impuesto municipal': '#64748B',
      'servidores': '#1EAEDB', // Bright blue for servers
      'comisiones': '#F59E0B', // Amber for commissions
      'gastos de comisiones': '#F59E0B',
      'cargos bancarios': '#10B981', // Emerald for bank charges
      'gastos de cargos bancarios': '#10B981',
      'estacionamiento': '#EC4899', // Pink for parking
      'itbms': '#8B5CF6', // Purple for taxes
      'itbms por pagar': '#8B5CF6',
      'default': '#94a3b8' // Default slate gray color
    };

    // Try to find a match for the category
    for (const [key, value] of Object.entries(colors)) {
      if (lowerCategory.includes(key)) {
        return value;
      }
    }

    return colors.default;
  };

  // Preparamos datos para el gráfico
  const chartData = filteredExpenseData.map((item) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage.toFixed(1) + '%'
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
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getCategoryColor(entry.name)} 
                    stroke="#fff"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry, index) => {
                  // Make sure index is a valid number before accessing chartData
                  if (index !== undefined && index >= 0 && index < chartData.length) {
                    const item = chartData[index];
                    return (
                      <span className="text-sm" style={{ color: getCategoryColor(value) }}>
                        {value} ({item.percentage})
                      </span>
                    );
                  }
                  // Fallback in case index is undefined or out of bounds
                  return <span className="text-sm">{value}</span>;
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
