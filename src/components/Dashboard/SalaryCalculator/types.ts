
/**
 * Types for the salary calculator components
 */

export interface SalaryCalculatorProps {
  zohoIncome: number;
  stripeIncome: number;
  opexAmount: number;
  itbmAmount: number;
  profitPercentage: number;
  startingBalance?: number;
  totalZohoExpenses?: number;
}

export interface SalaryCalculationResults {
  adjustedZohoIncome: number;
  profitFirstAmount: number;
  taxReserveAmount: number;
  taxReservePercentage: number;
  totalZohoDeductions: number;
  remainingZohoIncome: number;
  halfStripeIncome: number;
  halfRemainingZoho: number;
  itbmCoveragePercentage: number;
  itbmCoverageAmount: number;
  halfRemainingZohoWithItbm: number;
  salary: number;
  salaryWithItbmCoverage: number;
}
