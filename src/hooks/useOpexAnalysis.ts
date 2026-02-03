import { useMemo } from 'react';
import { useSharedFinancialData } from '@/contexts/FinancialDataContext';
import { CategorySummary } from '@/types/financial';

export interface OpexAnalysis {
  // Presupuesto (de monthly_balances)
  budgetedOpex: number;
  
  // Real (de Zoho, sin Stripe fees)
  realOpex: {
    collaborators: number;    // Pagos a colaboradores
    otherExpenses: number;    // Otros gastos operativos
    total: number;
  };
  
  // Análisis
  variance: number;           // Presupuesto - Real (positivo = bajo presupuesto)
  variancePercent: number;
  isUnderBudget: boolean;
  
  // Para planificación
  totalMRR: number;
  availableForGrowth: number; // MRR - OPEX Real
  
  // Desglose porcentual
  collaboratorPercent: number;
  otherExpensesPercent: number;
  
  // Estado
  hasRealData: boolean;       // Si hay datos de Zoho cargados
  hasBudgetData: boolean;     // Si hay presupuesto configurado
}

interface UseOpexAnalysisParams {
  totalMRR?: number;
}

export const useOpexAnalysis = ({ totalMRR = 0 }: UseOpexAnalysisParams = {}): OpexAnalysis => {
  const {
    opexAmount,
    collaboratorExpenses,
    totalZohoExpenses,
    isLoaded
  } = useSharedFinancialData();

  return useMemo(() => {
    // Calcular total de colaboradores
    const collaboratorTotal = collaboratorExpenses.reduce(
      (sum: number, cat: CategorySummary) => sum + cat.amount, 
      0
    );
    
    // Otros gastos = Total Zoho - Colaboradores
    const otherExpenses = Math.max(0, totalZohoExpenses - collaboratorTotal);
    
    // OPEX Real = Colaboradores + Otros gastos (excluyendo Stripe fees)
    const realOpexTotal = totalZohoExpenses;
    
    // Varianza: positivo significa que estás BAJO presupuesto (tienes margen)
    const variance = opexAmount - realOpexTotal;
    const variancePercent = opexAmount > 0 ? (variance / opexAmount) * 100 : 0;
    
    // Disponible para crecer = MRR - OPEX Real
    const availableForGrowth = totalMRR - realOpexTotal;
    
    // Porcentajes del desglose
    const collaboratorPercent = realOpexTotal > 0 
      ? (collaboratorTotal / realOpexTotal) * 100 
      : 0;
    const otherExpensesPercent = realOpexTotal > 0 
      ? (otherExpenses / realOpexTotal) * 100 
      : 0;
    
    // Estado de datos
    const hasRealData = isLoaded && totalZohoExpenses > 0;
    const hasBudgetData = opexAmount > 0 && opexAmount !== 35; // 35 es el valor default
    
    return {
      budgetedOpex: opexAmount,
      realOpex: {
        collaborators: collaboratorTotal,
        otherExpenses,
        total: realOpexTotal,
      },
      variance,
      variancePercent,
      isUnderBudget: variance >= 0,
      totalMRR,
      availableForGrowth,
      collaboratorPercent,
      otherExpensesPercent,
      hasRealData,
      hasBudgetData,
    };
  }, [opexAmount, collaboratorExpenses, totalZohoExpenses, totalMRR, isLoaded]);
};
