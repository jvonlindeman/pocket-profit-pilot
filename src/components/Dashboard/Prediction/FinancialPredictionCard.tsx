import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Calculator } from 'lucide-react';
import { useShortTermPrediction } from '@/hooks/useShortTermPrediction';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import LoadingSpinner from '../LoadingSpinner';

interface FinancialPredictionCardProps {
  collaboratorExpenses?: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  historicalMonthlyExpenses?: number;
  startingBalance?: number;
}

export const FinancialPredictionCard: React.FC<FinancialPredictionCardProps> = ({
  collaboratorExpenses = [],
  historicalMonthlyExpenses = 0,
  startingBalance = 0
}) => {
  const { 
    prediction, 
    isLoading, 
    error,
    canAffordSalary,
    getInvestmentCapacity,
    getCashFlowAlert
  } = useShortTermPrediction({
    collaboratorExpenses,
    historicalMonthlyExpenses,
    startingBalance
  });
  
  const { formatCurrency } = useFinanceFormatter();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Predicción Financiera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !prediction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Predicción Financiera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            {error || 'No se pudo calcular la predicción'}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const cashFlowAlert = getCashFlowAlert();
  const investmentCapacity = getInvestmentCapacity();
  
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'excellent': return <CheckCircle className="h-4 w-4 text-success" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };
  
  const getAlertVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'outline';
      case 'excellent': return 'default';
      default: return 'secondary';
    }
  };
  
  const currentMonth = new Date().toLocaleString('es', { month: 'long', year: 'numeric' });
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const nextMonth = nextMonthDate.toLocaleString('es', { month: 'long', year: 'numeric' });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Predicción Financiera (30-60 días)
        </CardTitle>
        <div className="flex items-center gap-2">
          {getAlertIcon(cashFlowAlert.type)}
          <Badge variant={getAlertVariant(cashFlowAlert.type)}>
            {cashFlowAlert.message}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="breakdown">Desglose</TabsTrigger>
            <TabsTrigger value="scenarios">Escenarios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Month */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {currentMonth} (Mes Actual)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ingresos Confirmados</span>
                    <span className="font-medium text-success">
                      {formatCurrency(prediction.current_month.confirmed_income)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ingresos Probables</span>
                    <span className="font-medium text-primary">
                      {formatCurrency(prediction.current_month.probable_income)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gastos Estimados</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(prediction.current_month.estimated_expenses)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Ganancia Estimada</span>
                      <span className={`font-bold ${prediction.current_month.predicted_profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(prediction.current_month.predicted_profit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Confianza</span>
                      <span>{prediction.current_month.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Next Month */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {nextMonth} (Próximo Mes)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ingresos Confirmados</span>
                    <span className="font-medium text-success">
                      {formatCurrency(prediction.next_month.confirmed_income)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ingresos Probables</span>
                    <span className="font-medium text-primary">
                      {formatCurrency(prediction.next_month.probable_income)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gastos Estimados</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(prediction.next_month.estimated_expenses)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Ganancia Estimada</span>
                      <span className={`font-bold ${prediction.next_month.predicted_profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(prediction.next_month.predicted_profit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Confianza</span>
                      <span>{prediction.next_month.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Insights */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium text-sm">Insights Rápidos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div className="text-sm">
                    <div className="font-medium">Capacidad de Inversión</div>
                    <div className="text-muted-foreground">
                      {formatCurrency(investmentCapacity.amount)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calculator className="h-4 w-4 text-primary" />
                  <div className="text-sm">
                    <div className="font-medium">Para Salario de $5,000</div>
                    <div className="text-muted-foreground">
                      {canAffordSalary(5000).canAfford ? (
                        <span className="text-success">✓ Posible ({canAffordSalary(5000).confidence}%)</span>
                      ) : (
                        <span className="text-destructive">✗ No recomendado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="breakdown" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Desglose de Ingresos y Gastos</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Stripe Confirmado</span>
                  <span className="font-medium text-success">
                    {formatCurrency(prediction.breakdown.stripe_confirmed)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Stripe Probable</span>
                  <span className="font-medium text-primary">
                    {formatCurrency(prediction.breakdown.stripe_probable)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Zoho Confirmado</span>
                  <span className="font-medium text-success">
                    {formatCurrency(prediction.breakdown.zoho_confirmed)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gastos Colaboradores</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(prediction.breakdown.collaborator_expenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gastos Operativos</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(prediction.breakdown.operational_expenses)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="scenarios" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Escenarios para el Próximo Mes</h4>
              
              <div className="space-y-3">
                {/* Conservative */}
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-blue-700">Conservador</span>
                    <Badge variant="outline">95% confianza</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Solo ingresos confirmados</span>
                    <span className={`font-bold ${prediction.scenarios.conservative.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(prediction.scenarios.conservative.profit)}
                    </span>
                  </div>
                  <Progress 
                    value={95} 
                    className="mt-2 h-2" 
                  />
                </div>
                
                {/* Realistic */}
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-green-700">Realista</span>
                    <Badge variant="outline">80% confianza</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Confirmados + 70% de probables</span>
                    <span className={`font-bold ${prediction.scenarios.realistic.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(prediction.scenarios.realistic.profit)}
                    </span>
                  </div>
                  <Progress 
                    value={80} 
                    className="mt-2 h-2" 
                  />
                </div>
                
                {/* Optimistic */}
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-purple-700">Optimista</span>
                    <Badge variant="outline">60% confianza</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Todos los ingresos + gastos reducidos</span>
                    <span className={`font-bold ${prediction.scenarios.optimistic.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(prediction.scenarios.optimistic.profit)}
                    </span>
                  </div>
                  <Progress 
                    value={60} 
                    className="mt-2 h-2" 
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};