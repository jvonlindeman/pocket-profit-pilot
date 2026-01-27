import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { ClientMetric } from "@/hooks/useProfitabilityMetrics";
import { getMarginStatus } from "@/hooks/useProfitabilityMetrics";

interface TopClientsChartProps {
  clients: ClientMetric[];
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const TopClientsChart: React.FC<TopClientsChartProps> = ({ clients }) => {
  const top10 = clients.slice(0, 10);

  if (top10.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 Clientes por Margen</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Sin datos</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for horizontal bar chart
  const data = top10.map((c) => ({
    name: c.clientName.length > 15 ? c.clientName.slice(0, 15) + "…" : c.clientName,
    fullName: c.clientName,
    margin: c.margin,
    marginPercent: c.marginPercent,
    color: getMarginStatus(c.marginPercent).color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top 10 Clientes por Margen</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              fontSize={12}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              fontSize={11}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), "Margen"]}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  const item = payload[0].payload;
                  return `${item.fullName} (${item.marginPercent.toFixed(1)}%)`;
                }
                return label;
              }}
            />
            <Bar dataKey="margin" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
