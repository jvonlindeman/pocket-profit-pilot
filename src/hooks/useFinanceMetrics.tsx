
import { useMemo } from 'react';
import { FinancialSummary, CategorySummary } from '@/types/financial';

export const useFinanceMetrics = () => {
  /**
   * Calculate total income from different sources
   */
  const calculateTotalIncome = (stripeNet: number, regularIncome: number): number => {
    return stripeNet + regularIncome;
  };

  /**
   * Calculate collaborator expense total
   */
  const calculateCollaboratorExpense = (collaboratorExpenses: CategorySummary[]): number => {
    if (!collaboratorExpenses || !Array.isArray(collaboratorExpenses)) {
      console.warn("Invalid collaborator expenses data:", collaboratorExpenses);
      return 0;
    }
    
    const total = collaboratorExpenses.reduce((sum, item) => {
      // Make sure we're only adding valid numeric amounts
      const amount = typeof item.amount === 'number' ? item.amount : 0;
      return sum + amount;
    }, 0);
    
    console.log("useFinanceMetrics - Total collaborator expense calculated:", total);
    return total;
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
   * Calculate expense breakdown
   */
  const calculateExpenseBreakdown = (
    collaboratorExpense: number,
    otherExpense: number
  ): { 
    totalExpense: number, 
    collaboratorPercentage: number, 
    otherPercentage: number 
  } => {
    const totalExpense = collaboratorExpense + otherExpense;
    
    if (totalExpense === 0) {
      return {
        totalExpense: 0,
        collaboratorPercentage: 0,
        otherPercentage: 0
      };
    }
    
    const collaboratorPercentage = (collaboratorExpense / totalExpense) * 100;
    
    return {
      totalExpense,
      collaboratorPercentage,
      otherPercentage: 100 - collaboratorPercentage
    };
  };

  /**
   * Calculate profit after expenses
   */
  const calculateProfit = (
    totalIncome: number,
    totalExpense: number,
    startingBalance: number = 0
  ): number => {
    return startingBalance + totalIncome - totalExpense;
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
    calculateCollaboratorExpense,
    calculateGrossProfitMargin,
    calculateProfitMargin,
    calculateExpenseBreakdown,
    calculateProfit,
    analyzeFinancialHealth
  }), []);
};
