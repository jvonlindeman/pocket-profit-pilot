
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategorySummary } from '@/types/financial';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface ExpenseChartProps {
  expenseData: CategorySummary[];
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenseData }) => {
  // Filtramos los pagos a colaboradores de los datos
  const filteredExpenseData = expenseData.filter(item => 
    item.category.toLowerCase() !== 'pagos a colaboradores'
  );

  // Colores personalizados para un gráfico más atractivo
  const COLORS = [
    '#8B5CF6', // Vivid Purple
    '#D946EF', // Magenta Pink
    '#F97316', // Bright Orange
    '#0EA5E9', // Ocean Blue
    '#10B981', // Emerald
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F59E0B', // Amber
    '#6D28D9', // Purple
    '#4F46E5', // Indigo
    '#DC2626', // Red
    '#059669', // Green
    '#7C3AED', // Violet
    '#2563EB', // Blue
    '#CA8A04', // Yellow
  ];

  // Asignamos colores a categorías específicas si existen
  const getCategoryColor = (category: string, index: number) => {
    const categoryColors: Record<string, string> = {
      'software': '#8B5CF6',
      'tools': '#F97316',
      'marketing': '#0EA5E9',
      'publicidad': '#D946EF',
      'ai tools': '#10B981',
      'servidores': '#6366F1',
      'impuesto': '#EC4899',
      'seo': '#14B8A6',
    };

    // Buscar la categoría por coincidencia parcial (case insensitive)
    const lowerCaseCategory = category.toLowerCase();
    for (const [key, color] of Object.entries(categoryColors)) {
      if (lowerCaseCategory.includes(key.toLowerCase())) {
        return color;
      }
    }

    // Si no hay coincidencia, usar color del array por índice
    return COLORS[index % COLORS.length];
  };

  // Preparamos datos para el gráfico
  const chartData = filteredExpenseData.map((item, index) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage.toFixed(1) + '%',
    color: getCategoryColor(item.category, index)
  }));

  // Formateo de moneda (en USD)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Configuración del gráfico para usar con el componente ChartContainer
  const chartConfig = chartData.reduce((config: any, item) => {
    config[item.name] = {
      label: item.name,
      theme: {
        light: item.color,
        dark: item.color
      }
    };
    return config;
  }, {});

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Distribución de Gastos (USD)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[250px]">
          <ChartContainer config={chartConfig} className="h-full">
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
                    fill={entry.color} 
                    strokeWidth={1}
                    stroke="#fff"
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
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
                }}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry, index) => {
                  const item = chartData[index];
                  return (
                    <span className={cn("text-sm flex items-center gap-2")}>
                      <span className="w-3 h-3 inline-block rounded-sm" style={{ backgroundColor: item.color }}></span>
                      {value} ({item.percentage})
                    </span>
                  );
                }}
              />
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseChart;
