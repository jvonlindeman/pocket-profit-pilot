import { useMemo } from 'react';
import { useReceivablesData } from './useReceivablesData';
import { useReceivablesCalculations } from './useReceivablesCalculations';
import { useFinance } from '@/contexts/FinanceContext';

interface CurrentMonthPrediction {
  alreadyReceived: number;
  pendingSelected: number;
  totalExpected: number;
  progressPercentage: number;
  stripeSelected: number;
  zohoSelected: number;
}

export const useCurrentMonthPrediction = (): CurrentMonthPrediction => {
  const receivablesData = useReceivablesData();
  const { summary, stripeNet, unpaidInvoices, regularIncome, collaboratorExpenses } = useFinance();
  
  // Calculate adjustedZohoIncome using the same formula as DashboardContent
  const { startingBalance, otherExpense, collaboratorExpense } = summary;
  const adjustedZohoIncome = (startingBalance || 0) + regularIncome - collaboratorExpense - otherExpense;
  
  // Use the same calculation logic as ReceivablesSummary
  const receivablesCalculations = useReceivablesCalculations({
    unpaidInvoices: unpaidInvoices || [],
    stripeUpcomingPayments: receivablesData.stripeUpcomingPayments || [],
    stripeCurrentMonthPayments: receivablesData.stripeCurrentMonthPayments || [],
    stripeNextMonthPayments: receivablesData.stripeNextMonthPayments || [],
    stripePendingActivations: receivablesData.stripePendingActivations || [],
    selections: receivablesData.selections || [],
    stripeNet,
    adjustedZohoIncome,
  });

  const prediction = useMemo(() => {
    const { isLoading } = receivablesData;
    
    // Guard clause: Don't process if data is still loading
    if (isLoading) {
      console.log('🧮 useCurrentMonthPrediction - Data still loading, returning defaults');
      const alreadyReceived = summary.totalIncome;
      return {
        alreadyReceived,
        pendingSelected: 0,
        totalExpected: alreadyReceived,
        progressPercentage: 100,
        stripeSelected: 0,
        zohoSelected: 0,
      };
    }
    
    console.log('🧮 useCurrentMonthPrediction - Using ReceivablesSummary logic');
    
    // Use the exact same calculation as ReceivablesSummary
    // Pendiente Seleccionado = Zoho Books Selected + Stripe Net Selected
    const zohoSelected = receivablesCalculations.zohoSelectedInvoices;
    const stripeSelected = receivablesCalculations.stripeNetTotal;
    const pendingSelected = zohoSelected + stripeSelected;

    const alreadyReceived = summary.totalIncome;
    const totalExpected = alreadyReceived + pendingSelected;
    const progressPercentage = totalExpected > 0 ? (alreadyReceived / totalExpected) * 100 : 0;

    console.log('🧮 useCurrentMonthPrediction - Final calculation:', {
      zohoSelected: `$${zohoSelected.toFixed(2)} (facturas seleccionadas)`,
      stripeSelected: `$${stripeSelected.toFixed(2)} (receivables neto)`,
      pendingSelected: `$${pendingSelected.toFixed(2)} (Zoho + Stripe Neto)`,
      alreadyReceived: `$${alreadyReceived.toFixed(2)}`,
      totalExpected: `$${totalExpected.toFixed(2)}`,
    });

    return {
      alreadyReceived,
      pendingSelected,
      totalExpected,
      progressPercentage,
      stripeSelected,
      zohoSelected,
    };
  }, [receivablesData.isLoading, receivablesCalculations, summary.totalIncome]);

  return prediction;
};