import React from 'react';
import { TrendingUp, Calendar, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCurrentMonthPrediction } from '@/hooks/useCurrentMonthPrediction';
import { useFinance } from '@/contexts/FinanceContext';

const CurrentMonthExpectedIncome: React.FC = () => {
  const {
    alreadyReceived,
    pendingSelected,
    totalExpected,
    progressPercentage,
    stripeSelected,
    zohoSelected,
  } = useCurrentMonthPrediction();
  
  const { formatCurrency } = useFinance();

  return (
    <div className="space-y-6">
      {/* Main Prediction Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Target className="h-5 w-5 text-primary" />
            Ingreso Esperado del Mes Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Progreso del mes</span>
              <span className="text-sm font-medium text-foreground">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Summary Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-accent/50 p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-foreground">Ya Recibido</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(alreadyReceived)}
              </p>
            </div>

            <div className="bg-accent/50 p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-foreground">Pendiente Seleccionado</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(pendingSelected)}
              </p>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Total Esperado</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(totalExpected)}
              </p>
            </div>
          </div>

          {/* Breakdown by Source */}
          {(stripeSelected > 0 || zohoSelected > 0) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Desglose de Pendientes Seleccionados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stripeSelected > 0 && (
                  <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Stripe</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(stripeSelected)}
                    </span>
                  </div>
                )}
                {zohoSelected > 0 && (
                  <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Zoho</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(zohoSelected)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p>
              💡 Esta predicción usa solo las facturas/pagos que has marcado con checkbox en la sección de Cobros por Recibir.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(CurrentMonthExpectedIncome);