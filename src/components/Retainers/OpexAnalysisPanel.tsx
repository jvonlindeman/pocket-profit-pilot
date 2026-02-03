import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Briefcase,
  Target,
  AlertCircle,
  Wallet
} from 'lucide-react';
import { useOpexAnalysis } from '@/hooks/useOpexAnalysis';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpexAnalysisPanelProps {
  totalMRR: number;
}

const formatCurrency = (n: number) => 
  new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const formatPercent = (n: number) => 
  new Intl.NumberFormat('es-PA', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n / 100);

export const OpexAnalysisPanel: React.FC<OpexAnalysisPanelProps> = ({ totalMRR }) => {
  const analysis = useOpexAnalysis({ totalMRR });
  const [breakdownOpen, setBreakdownOpen] = React.useState(false);

  // Si no hay datos reales, mostrar mensaje informativo
  if (!analysis.hasRealData) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análisis OPEX
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Para ver el análisis de OPEX real vs presupuestado, primero carga los datos del mes 
              en el <strong>Dashboard Financiero</strong>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const kpiCards = [
    {
      title: 'Presupuesto OPEX',
      value: formatCurrency(analysis.budgetedOpex),
      subtitle: analysis.hasBudgetData ? 'Tu objetivo mensual' : 'Sin configurar',
      icon: Target,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'OPEX Real',
      value: formatCurrency(analysis.realOpex.total),
      subtitle: 'Gastos Zoho del mes',
      icon: DollarSign,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      title: 'Diferencia',
      value: `${analysis.isUnderBudget ? '+' : ''}${formatCurrency(analysis.variance)}`,
      subtitle: analysis.isUnderBudget 
        ? `${formatPercent(Math.abs(analysis.variancePercent))} bajo pres.` 
        : `${formatPercent(Math.abs(analysis.variancePercent))} sobre pres.`,
      icon: analysis.isUnderBudget ? TrendingDown : TrendingUp,
      iconColor: analysis.isUnderBudget ? 'text-green-600' : 'text-red-600',
      iconBg: analysis.isUnderBudget ? 'bg-green-100' : 'bg-red-100',
      valueColor: analysis.isUnderBudget ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Disponible p/Crecer',
      value: formatCurrency(analysis.availableForGrowth),
      subtitle: 'MRR - OPEX Real',
      icon: Wallet,
      iconColor: analysis.availableForGrowth > 0 ? 'text-emerald-600' : 'text-red-600',
      iconBg: analysis.availableForGrowth > 0 ? 'bg-emerald-100' : 'bg-red-100',
      valueColor: analysis.availableForGrowth > 0 ? 'text-emerald-600' : 'text-red-600',
    },
  ];

  // Generar insights automáticos
  const insights: string[] = [];
  
  if (analysis.isUnderBudget && analysis.variance > 500) {
    insights.push(`Tienes ~${formatCurrency(analysis.variance)}/mes bajo tu presupuesto`);
    
    // Sugerir contratación si hay margen significativo
    if (analysis.variance >= 1500) {
      insights.push(`Margen para 1 contratación de ~${formatCurrency(Math.floor(analysis.variance * 0.6))} sin riesgo`);
    }
  } else if (!analysis.isUnderBudget) {
    insights.push(`Estás ${formatCurrency(Math.abs(analysis.variance))}/mes sobre tu presupuesto de OPEX`);
  }
  
  if (analysis.collaboratorPercent > 70) {
    insights.push(`Colaboradores representan ${formatPercent(analysis.collaboratorPercent)} de tu OPEX`);
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Análisis OPEX: Presupuesto vs Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <div 
              key={kpi.title}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{kpi.title}</span>
                <div className={cn('p-2 rounded-full', kpi.iconBg)}>
                  <kpi.icon className={cn('h-4 w-4', kpi.iconColor)} />
                </div>
              </div>
              <div className={cn('text-xl font-bold', kpi.valueColor)}>
                {kpi.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {kpi.subtitle}
              </div>
            </div>
          ))}
        </div>

        {/* Desglose colapsable */}
        <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <ChevronDown className={cn(
              'h-4 w-4 transition-transform',
              breakdownOpen && 'rotate-180'
            )} />
            Ver desglose de OPEX Real
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="space-y-3 pl-6 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Colaboradores</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatCurrency(analysis.realOpex.collaborators)}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formatPercent(analysis.collaboratorPercent)})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Otros Gastos</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatCurrency(analysis.realOpex.otherExpenses)}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formatPercent(analysis.otherExpensesPercent)})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Total OPEX Real</span>
                <span className="font-bold">{formatCurrency(analysis.realOpex.total)}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Insights</h4>
            <ul className="space-y-1">
              {insights.map((insight, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
