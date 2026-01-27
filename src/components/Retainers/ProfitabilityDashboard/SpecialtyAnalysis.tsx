import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SpecialtyMetric } from "@/hooks/useProfitabilityMetrics";
import { getMarginStatus } from "@/hooks/useProfitabilityMetrics";

interface SpecialtyAnalysisProps {
  specialties: SpecialtyMetric[];
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const formatPercent = (n: number) =>
  new Intl.NumberFormat("es-PA", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n / 100);

export const SpecialtyAnalysis: React.FC<SpecialtyAnalysisProps> = ({ specialties }) => {
  if (specialties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Análisis por Especialidad</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Sin datos de especialidades</p>
        </CardContent>
      </Card>
    );
  }

  // Max margin for progress bar scaling
  const maxMargin = Math.max(...specialties.map((s) => Math.abs(s.averageMarginPercent)), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Análisis por Especialidad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {specialties.map((spec) => {
            const { color, label } = getMarginStatus(spec.averageMarginPercent);
            const progressValue = Math.max(0, Math.min(100, (spec.averageMarginPercent / maxMargin) * 100));

            return (
              <div key={spec.specialty} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{spec.specialty}</div>
                    <div className="text-xs text-muted-foreground">
                      {spec.clientCount} cliente{spec.clientCount !== 1 ? "s" : ""} · Ingreso: {formatCurrency(spec.totalIncome)}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold" style={{ color }}>
                      {formatPercent(spec.averageMarginPercent)}
                    </div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </div>
                <Progress
                  value={progressValue}
                  className="h-2"
                  style={{
                    // @ts-ignore - custom CSS variable
                    "--progress-foreground": color,
                  } as React.CSSProperties}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
