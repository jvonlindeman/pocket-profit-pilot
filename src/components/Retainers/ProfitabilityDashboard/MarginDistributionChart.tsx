import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { MarginDistribution } from "@/hooks/useProfitabilityMetrics";

interface MarginDistributionChartProps {
  distribution: MarginDistribution;
}

const COLORS = {
  high: "hsl(142.1 76.2% 36.3%)",     // green
  medium: "hsl(45.4 93.4% 47.5%)",    // amber
  low: "hsl(0 84.2% 60.2%)",          // red
  negative: "hsl(0 62.8% 30.6%)",     // dark red
};

const LABELS = {
  high: "Alto (>50%)",
  medium: "Medio (20-50%)",
  low: "Bajo (0-20%)",
  negative: "Negativo (<0%)",
};

export const MarginDistributionChart: React.FC<MarginDistributionChartProps> = ({ distribution }) => {
  const data = [
    { name: LABELS.high, value: distribution.high, key: "high" },
    { name: LABELS.medium, value: distribution.medium, key: "medium" },
    { name: LABELS.low, value: distribution.low, key: "low" },
    { name: LABELS.negative, value: distribution.negative, key: "negative" },
  ].filter((d) => d.value > 0);

  const total = distribution.high + distribution.medium + distribution.low + distribution.negative;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribución de Márgenes</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Sin datos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribución de Márgenes</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={COLORS[entry.key as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} clientes`, name]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
