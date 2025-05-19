
/**
 * Utility functions for salary calculations
 */

/**
 * Format currency values for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Calculate adjusted Zoho income
 */
export const calculateAdjustedZohoIncome = (
  startingBalance: number, 
  zohoIncome: number, 
  totalZohoExpenses: number
): number => {
  return startingBalance + zohoIncome - totalZohoExpenses;
};

/**
 * Calculate profit first amount
 */
export const calculateProfitFirstAmount = (
  adjustedZohoIncome: number, 
  profitPercentage: number
): number => {
  return (adjustedZohoIncome * profitPercentage) / 100;
};

/**
 * Calculate tax reserve amount
 */
export const calculateTaxReserveAmount = (
  adjustedZohoIncome: number, 
  taxReservePercentage: number = 5
): number => {
  return (adjustedZohoIncome * taxReservePercentage) / 100;
};

/**
 * Calculate total Zoho deductions
 */
export const calculateTotalZohoDeductions = (
  opexAmount: number, 
  itbmAmount: number, 
  profitFirstAmount: number, 
  taxReserveAmount: number
): number => {
  return opexAmount + itbmAmount + profitFirstAmount + taxReserveAmount;
};

/**
 * Calculate remaining Zoho income
 */
export const calculateRemainingZohoIncome = (
  adjustedZohoIncome: number, 
  totalZohoDeductions: number
): number => {
  return adjustedZohoIncome - totalZohoDeductions;
};

/**
 * Calculate half of an amount
 */
export const calculateHalf = (amount: number): number => {
  return amount / 2;
};

/**
 * Calculate ITBM coverage amount
 */
export const calculateItbmCoverageAmount = (
  halfRemainingZoho: number, 
  itbmCoveragePercentage: number = 7
): number => {
  return (halfRemainingZoho * itbmCoveragePercentage) / 100;
};

/**
 * Calculate half remaining Zoho with ITBM
 */
export const calculateHalfRemainingZohoWithItbm = (
  halfRemainingZoho: number, 
  itbmCoverageAmount: number
): number => {
  return halfRemainingZoho + itbmCoverageAmount;
};

/**
 * Calculate salary
 */
export const calculateSalary = (
  halfStripeIncome: number, 
  halfRemainingZoho: number
): number => {
  return halfStripeIncome + halfRemainingZoho;
};

/**
 * Calculate salary with ITBM coverage
 */
export const calculateSalaryWithItbmCoverage = (
  halfStripeIncome: number, 
  halfRemainingZohoWithItbm: number
): number => {
  return halfStripeIncome + halfRemainingZohoWithItbm;
};
