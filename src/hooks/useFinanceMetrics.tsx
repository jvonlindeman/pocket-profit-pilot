
import { useMemo } from 'react';
import { FinancialSummary, CategorySummary } from '@/types/financial';
import { validateFinancialValue } from '@/utils/financialUtils';

export const useFinanceMetrics = () => {
  /**
   * Calculate total income from different sources
   */
  const calculateTotalIncome = (stripeNet: number, regularIncome: number): number => {
    return validateFinancialValue(stripeNet) + validateFinancialValue(regularIncome);
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
      const amount = validateFinancialValue(item.amount);
      return sum + amount;
    }, 0);
    
    console.log("useFinanceMetrics - Total collaborator expense calculated:", total);
    return total;
  };

  /**
   * Calculate gross profit margin
   */
  const calculateGrossProfitMargin = (grossProfit: number, totalIncome: number): number => {
    const validGrossProfit = validateFinancialValue(grossProfit);
    const validTotalIncome = validateFinancialValue(totalIncome);
    
    if (validTotalIncome === 0) return 0;
    return (validGrossProfit / validTotalIncome) * 100;
  };

  /**
   * Calculate profit margin
   */
  const calculateProfitMargin = (profit: number, totalIncome: number): number => {
    const validProfit = validateFinancialValue(profit);
    const validTotalIncome = validateFinancialValue(totalIncome);
    
    if (validTotalIncome === 0) return 0;
    return (validProfit / validTotalIncome) * 100;
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
    const validCollaboratorExpense = validateFinancialValue(collaboratorExpense);
    const validOtherExpense = validateFinancialValue(otherExpense);
    const totalExpense = validCollaboratorExpense + validOtherExpense;
    
    if (totalExpense === 0) {
      return {
        totalExpense: 0,
        collaboratorPercentage: 0,
        otherPercentage: 0
      };
    }
    
    const collaboratorPercentage = (validCollaboratorExpense / totalExpense) * 100;
    
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
    return validateFinancialValue(startingBalance) + 
           validateFinancialValue(totalIncome) - 
           validateFinancialValue(totalExpense);
  };

  /**
   * Analyze financial health based on profit margin
   */
  const analyzeFinancialHealth = (profitMargin: number): 'excellent' | 'good' | 'average' | 'concern' | 'critical' => {
    const validProfitMargin = validateFinancialValue(profitMargin);
    
    if (validProfitMargin >= 20) return 'excellent';
    if (validProfitMargin >= 10) return 'good';
    if (validProfitMargin >= 5) return 'average';
    if (validProfitMargin >= 0) return 'concern';
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
