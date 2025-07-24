import { 
  ShortTermPrediction, 
  UpcomingSubscriptionPayment, 
  PendingActivationSubscription,
  UnpaidInvoice,
  CategorySummary
} from '@/types/financial';
import { validateFinancialValue, isCollaboratorExpense } from '@/utils/financialUtils';

export class ShortTermPredictionService {
  /**
   * Calculate collaborator expense total
   */
  static calculateCollaboratorExpense(collaboratorExpenses: CategorySummary[]): number {
    if (!collaboratorExpenses || !Array.isArray(collaboratorExpenses)) {
      console.warn("Invalid collaborator expenses data:", collaboratorExpenses);
      return 0;
    }
    
    const total = collaboratorExpenses.reduce((sum, item) => {
      // Check if this is a collaborator expense by category name
      if (isCollaboratorExpense(item.category)) {
        const amount = validateFinancialValue(item.amount);
        return sum + amount;
      }
      return sum;
    }, 0);
    
    console.log("ShortTermPredictionService - Total collaborator expense calculated:", total);
    return total;
  }

  /**
   * Calculate confirmed income from Stripe upcoming payments and Zoho unpaid invoices
   */
  static calculateConfirmedIncome(
    stripeCurrentMonth: UpcomingSubscriptionPayment[],
    stripeNextMonth: UpcomingSubscriptionPayment[],
    stripePendingActivations: PendingActivationSubscription[],
    zohoUnpaidInvoices: UnpaidInvoice[]
  ): { currentMonth: number; nextMonth: number; breakdown: any } {
    // Current month confirmed income (95% confidence)
    const currentMonthStripe = stripeCurrentMonth.reduce((sum, payment) => 
      sum + validateFinancialValue(payment.net_amount), 0);
    
    const pendingActivationsAmount = stripePendingActivations.reduce((sum, activation) => 
      sum + validateFinancialValue(activation.amount), 0);
    
    const zohoConfirmed = zohoUnpaidInvoices.reduce((sum, invoice) => 
      sum + validateFinancialValue(invoice.balance), 0);
    
    const currentMonthConfirmed = currentMonthStripe + pendingActivationsAmount + zohoConfirmed;
    
    // Next month confirmed income (90% confidence)
    const nextMonthStripe = stripeNextMonth.reduce((sum, payment) => 
      sum + validateFinancialValue(payment.net_amount), 0);
    
    const nextMonthConfirmed = nextMonthStripe;
    
    console.log('📊 ShortTermPrediction - Confirmed Income Calculation:', {
      currentMonth: {
        stripe: currentMonthStripe,
        pendingActivations: pendingActivationsAmount,
        zoho: zohoConfirmed,
        total: currentMonthConfirmed
      },
      nextMonth: {
        stripe: nextMonthStripe,
        total: nextMonthConfirmed
      }
    });
    
    return {
      currentMonth: currentMonthConfirmed,
      nextMonth: nextMonthConfirmed,
      breakdown: {
        stripe_confirmed: currentMonthStripe + nextMonthStripe,
        zoho_confirmed: zohoConfirmed,
        pending_activations: pendingActivationsAmount
      }
    };
  }
  
  /**
   * Calculate probable income based on patterns and renewals
   */
  static calculateProbableIncome(
    stripeAllPayments: UpcomingSubscriptionPayment[]
  ): { currentMonth: number; nextMonth: number } {
    // Estimate new subscriptions based on current active subscriptions (conservative)
    const averageSubscriptionValue = stripeAllPayments.length > 0 
      ? stripeAllPayments.reduce((sum, payment) => sum + validateFinancialValue(payment.net_amount), 0) / stripeAllPayments.length
      : 0;
    
    // Conservative estimate: 10% growth in subscriptions per month
    const estimatedNewSubscriptions = Math.ceil(stripeAllPayments.length * 0.1);
    const probableNewIncome = estimatedNewSubscriptions * averageSubscriptionValue;
    
    console.log('💡 ShortTermPrediction - Probable Income Calculation:', {
      averageSubscriptionValue,
      activeSubscriptions: stripeAllPayments.length,
      estimatedNewSubscriptions,
      probableNewIncomePerMonth: probableNewIncome
    });
    
    return {
      currentMonth: probableNewIncome * 0.5, // Conservative for current month
      nextMonth: probableNewIncome
    };
  }
  
  /**
   * Estimate expenses based on historical patterns
   */
  static estimateExpenses(
    collaboratorExpenses: CategorySummary[],
    historicalMonthlyExpenses: number,
    totalIncome: number
  ): { collaborator: number; operational: number; total: number } {
    // Calculate collaborator expenses with growth factor
    const currentCollaboratorExpense = this.calculateCollaboratorExpense(collaboratorExpenses);
    
    // Estimate 5% growth in collaborator expenses
    const estimatedCollaboratorExpense = currentCollaboratorExpense * 1.05;
    
    // Operational expenses as percentage of income (conservative estimate)
    const operationalExpenseRatio = historicalMonthlyExpenses > 0 && totalIncome > 0 
      ? Math.min(historicalMonthlyExpenses / totalIncome, 0.3) // Cap at 30%
      : 0.15; // Default 15% if no historical data
    
    const estimatedOperationalExpense = totalIncome * operationalExpenseRatio;
    
    const totalEstimatedExpenses = estimatedCollaboratorExpense + estimatedOperationalExpense;
    
    console.log('💸 ShortTermPrediction - Expense Estimation:', {
      currentCollaboratorExpense,
      estimatedCollaboratorExpense,
      operationalExpenseRatio: operationalExpenseRatio * 100 + '%',
      estimatedOperationalExpense,
      totalEstimatedExpenses,
      basedOnIncome: totalIncome
    });
    
    return {
      collaborator: estimatedCollaboratorExpense,
      operational: estimatedOperationalExpense,
      total: totalEstimatedExpenses
    };
  }
  
  /**
   * Generate short-term prediction scenarios
   */
  static generateScenarios(
    confirmedIncome: number,
    probableIncome: number,
    estimatedExpenses: number,
    startingBalance: number = 0
  ): ShortTermPrediction['scenarios'] {
    const balance = validateFinancialValue(startingBalance);
    
    // Conservative: Only confirmed income
    const conservativeProfit = balance + confirmedIncome - estimatedExpenses;
    
    // Realistic: Confirmed + 70% of probable income
    const realisticIncome = confirmedIncome + (probableIncome * 0.7);
    const realisticProfit = balance + realisticIncome - estimatedExpenses;
    
    // Optimistic: All confirmed + probable income, with 10% expense reduction
    const optimisticIncome = confirmedIncome + probableIncome;
    const optimisticExpenses = estimatedExpenses * 0.9;
    const optimisticProfit = balance + optimisticIncome - optimisticExpenses;
    
    console.log('🎯 ShortTermPrediction - Scenarios Generated:', {
      conservative: { income: confirmedIncome, expenses: estimatedExpenses, profit: conservativeProfit },
      realistic: { income: realisticIncome, expenses: estimatedExpenses, profit: realisticProfit },
      optimistic: { income: optimisticIncome, expenses: optimisticExpenses, profit: optimisticProfit }
    });
    
    return {
      conservative: { profit: conservativeProfit, confidence: 95 },
      realistic: { profit: realisticProfit, confidence: 80 },
      optimistic: { profit: optimisticProfit, confidence: 60 }
    };
  }
  
  /**
   * Main prediction calculation
   */
  static calculatePrediction(
    stripeCurrentMonth: UpcomingSubscriptionPayment[],
    stripeNextMonth: UpcomingSubscriptionPayment[],
    stripeAllPayments: UpcomingSubscriptionPayment[],
    stripePendingActivations: PendingActivationSubscription[],
    zohoUnpaidInvoices: UnpaidInvoice[],
    collaboratorExpenses: CategorySummary[],
    historicalMonthlyExpenses: number,
    startingBalance: number = 0
  ): ShortTermPrediction {
    
    console.log('🚀 ShortTermPrediction - Starting calculation with data:', {
      stripeCurrentMonthCount: stripeCurrentMonth.length,
      stripeNextMonthCount: stripeNextMonth.length,
      stripeAllPaymentsCount: stripeAllPayments.length,
      stripePendingActivationsCount: stripePendingActivations.length,
      zohoUnpaidInvoicesCount: zohoUnpaidInvoices.length,
      collaboratorExpensesCount: collaboratorExpenses.length,
      historicalMonthlyExpenses,
      startingBalance
    });
    
    // Calculate confirmed income
    const confirmedIncomeData = this.calculateConfirmedIncome(
      stripeCurrentMonth,
      stripeNextMonth,
      stripePendingActivations,
      zohoUnpaidInvoices
    );
    
    // Calculate probable income
    const probableIncomeData = this.calculateProbableIncome(stripeAllPayments);
    
    // Current month calculations
    const currentMonthTotalIncome = confirmedIncomeData.currentMonth + probableIncomeData.currentMonth;
    const currentMonthExpenses = this.estimateExpenses(
      collaboratorExpenses,
      historicalMonthlyExpenses,
      currentMonthTotalIncome
    );
    
    // Next month calculations
    const nextMonthTotalIncome = confirmedIncomeData.nextMonth + probableIncomeData.nextMonth;
    const nextMonthExpenses = this.estimateExpenses(
      collaboratorExpenses,
      historicalMonthlyExpenses,
      nextMonthTotalIncome
    );
    
    // Generate scenarios for next month (most relevant for planning)
    const scenarios = this.generateScenarios(
      confirmedIncomeData.nextMonth,
      probableIncomeData.nextMonth,
      nextMonthExpenses.total,
      startingBalance
    );
    
    const prediction: ShortTermPrediction = {
      current_month: {
        confirmed_income: confirmedIncomeData.currentMonth,
        probable_income: probableIncomeData.currentMonth,
        estimated_expenses: currentMonthExpenses.total,
        predicted_profit: validateFinancialValue(startingBalance) + currentMonthTotalIncome - currentMonthExpenses.total,
        confidence: 85
      },
      next_month: {
        confirmed_income: confirmedIncomeData.nextMonth,
        probable_income: probableIncomeData.nextMonth,
        estimated_expenses: nextMonthExpenses.total,
        predicted_profit: validateFinancialValue(startingBalance) + nextMonthTotalIncome - nextMonthExpenses.total,
        confidence: 75
      },
      breakdown: {
        stripe_confirmed: confirmedIncomeData.breakdown.stripe_confirmed,
        stripe_probable: probableIncomeData.currentMonth + probableIncomeData.nextMonth,
        zoho_confirmed: confirmedIncomeData.breakdown.zoho_confirmed,
        collaborator_expenses: currentMonthExpenses.collaborator + nextMonthExpenses.collaborator,
        operational_expenses: currentMonthExpenses.operational + nextMonthExpenses.operational
      },
      scenarios
    };
    
    console.log('✅ ShortTermPrediction - Final prediction calculated:', prediction);
    
    return prediction;
  }
}