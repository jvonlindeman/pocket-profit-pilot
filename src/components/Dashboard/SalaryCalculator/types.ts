
/**
 * Types for the salary calculator components
 */

export interface SalaryCalculatorProps {
  zohoIncome: number;
  stripeIncome: number;  // Keeping this for backward compatibility but won't use it
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
  halfRemainingZoho: number;
  itbmCoveragePercentage: number;
  itbmCoverageAmount: number;
  halfRemainingZohoWithItbm: number;
  salary: number;
  salaryWithItbmCoverage: number;
  // Adding fields for the columnar display
  leftColumnAmount: number;
  rightColumnAmount: number;
  itbmRowAmount: number;
}
