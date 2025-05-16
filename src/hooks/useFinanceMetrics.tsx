
import { useMemo } from 'react';
import { FinancialSummary } from '@/types/financial';

export const useFinanceMetrics = () => {
  /**
   * Calculate total income from different sources
   */
  const calculateTotalIncome = (stripeNet: number, regularIncome: number): number => {
    return stripeNet + regularIncome;
  };

  /**
   * Calculate gross profit margin
   */
  const calculateGrossProfitMargin = (grossProfit: number, totalIncome: number): number => {
    if (totalIncome === 0) return 0;
    return (grossProfit / totalIncome) * 100;
  };

  /**
   * Calculate profit margin
   */
  const calculateProfitMargin = (profit: number, totalIncome: number): number => {
    if (totalIncome === 0) return 0;
    return (profit / totalIncome) * 100;
  };

  /**
   * Calculate expense distribution
   */
  const calculateExpenseDistribution = (
    collaboratorExpense: number,
    totalExpense: number
  ): { collaboratorPercentage: number; otherPercentage: number } => {
    if (totalExpense === 0) return { collaboratorPercentage: 0, otherPercentage: 0 };
    
    const collaboratorPercentage = (collaboratorExpense / totalExpense) * 100;
    const otherPercentage = 100 - collaboratorPercentage;
    
    return {
      collaboratorPercentage,
      otherPercentage
    };
  };

  /**
   * Analyze financial health based on profit margin
   */
  const analyzeFinancialHealth = (profitMargin: number): 'excellent' | 'good' | 'average' | 'concern' | 'critical' => {
    if (profitMargin >= 20) return 'excellent';
    if (profitMargin >= 10) return 'good';
    if (profitMargin >= 5) return 'average';
    if (profitMargin >= 0) return 'concern';
    return 'critical';
  };

  return useMemo(() => ({
    calculateTotalIncome,
    calculateGrossProfitMargin,
    calculateProfitMargin,
    calculateExpenseDistribution,
    analyzeFinancialHealth
  }), []);
};
