import { useMemo } from 'react';
import { ShortTermPrediction } from '@/types/financial';
import { ShortTermPredictionService } from '@/services/shortTermPredictionService';
import { useReceivablesData } from './useReceivablesData';
import { zohoRepository } from '@/repositories/zohoRepository';

interface UseShortTermPredictionProps {
  collaboratorExpenses?: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  historicalMonthlyExpenses?: number;
  startingBalance?: number;
}

export const useShortTermPrediction = ({
  collaboratorExpenses = [],
  historicalMonthlyExpenses = 0,
  startingBalance = 0
}: UseShortTermPredictionProps = {}) => {
  
  const {
    stripeUpcomingPayments,
    stripeCurrentMonthPayments,
    stripeNextMonthPayments,
    stripePendingActivations,
    isLoading: receivablesLoading,
    error: receivablesError
  } = useReceivablesData();
  
  // Get Zoho unpaid invoices
  const zohoUnpaidInvoices = zohoRepository.getUnpaidInvoices();
  
  const prediction = useMemo(() => {
    if (receivablesLoading) {
      return null;
    }
    
    try {
      console.log('🔮 useShortTermPrediction - Calculating prediction with data:', {
        stripeUpcomingPaymentsCount: stripeUpcomingPayments.length,
        stripeCurrentMonthPaymentsCount: stripeCurrentMonthPayments.length,
        stripeNextMonthPaymentsCount: stripeNextMonthPayments.length,
        stripePendingActivationsCount: stripePendingActivations.length,
        zohoUnpaidInvoicesCount: zohoUnpaidInvoices.length,
        collaboratorExpensesCount: collaboratorExpenses.length,
        historicalMonthlyExpenses,
        startingBalance
      });
      
      return ShortTermPredictionService.calculatePrediction(
        stripeCurrentMonthPayments,
        stripeNextMonthPayments,
        stripeUpcomingPayments,
        stripePendingActivations,
        zohoUnpaidInvoices,
        collaboratorExpenses,
        historicalMonthlyExpenses,
        startingBalance
      );
    } catch (error) {
      console.error('❌ Error calculating short-term prediction:', error);
      return null;
    }
  }, [
    stripeUpcomingPayments,
    stripeCurrentMonthPayments,
    stripeNextMonthPayments,
    stripePendingActivations,
    zohoUnpaidInvoices,
    collaboratorExpenses,
    historicalMonthlyExpenses,
    startingBalance,
    receivablesLoading
  ]);
  
  const isLoading = receivablesLoading;
  const error = receivablesError;
  
  // Helper functions for common use cases
  const canAffordSalary = (salaryAmount: number): { canAfford: boolean; scenario: string; confidence: number } => {
    if (!prediction) return { canAfford: false, scenario: 'unknown', confidence: 0 };
    
    if (prediction.scenarios.conservative.profit >= salaryAmount) {
      return { canAfford: true, scenario: 'conservative', confidence: 95 };
    }
    if (prediction.scenarios.realistic.profit >= salaryAmount) {
      return { canAfford: true, scenario: 'realistic', confidence: 80 };
    }
    if (prediction.scenarios.optimistic.profit >= salaryAmount) {
      return { canAfford: true, scenario: 'optimistic', confidence: 60 };
    }
    return { canAfford: false, scenario: 'none', confidence: 0 };
  };
  
  const getInvestmentCapacity = (): { amount: number; scenario: string; confidence: number } => {
    if (!prediction) return { amount: 0, scenario: 'unknown', confidence: 0 };
    
    // Use realistic scenario for investment planning
    const availableForInvestment = Math.max(0, prediction.scenarios.realistic.profit * 0.7); // Keep 30% buffer
    
    return {
      amount: availableForInvestment,
      scenario: 'realistic',
      confidence: 80
    };
  };
  
  const getCashFlowAlert = (): { type: 'critical' | 'warning' | 'good' | 'excellent'; message: string } => {
    if (!prediction) return { type: 'warning', message: 'No prediction data available' };
    
    const conservativeProfit = prediction.scenarios.conservative.profit;
    
    if (conservativeProfit < 0) {
      return { type: 'critical', message: 'Flujo de caja crítico detectado - considerar acciones inmediatas' };
    }
    if (conservativeProfit < 1000) {
      return { type: 'warning', message: 'Flujo de caja bajo - monitorear gastos cuidadosamente' };
    }
    if (conservativeProfit > 10000) {
      return { type: 'excellent', message: 'Excelente flujo de caja - momento favorable para inversiones' };
    }
    return { type: 'good', message: 'Flujo de caja estable' };
  };
  
  return {
    prediction,
    isLoading,
    error,
    
    // Helper functions
    canAffordSalary,
    getInvestmentCapacity,
    getCashFlowAlert,
    
    // Raw data for custom calculations
    receivablesData: {
      stripeUpcomingPayments,
      stripeCurrentMonthPayments,
      stripeNextMonthPayments,
      stripePendingActivations,
      zohoUnpaidInvoices
    }
  };
};