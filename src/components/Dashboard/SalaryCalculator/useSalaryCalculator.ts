
import { useMemo } from 'react';
import { SalaryCalculatorProps, SalaryCalculationResults } from './types';
import * as calculationUtils from './calculationUtils';

export const useSalaryCalculator = ({
  zohoIncome,
  opexAmount,
  itbmAmount,
  profitPercentage,
  startingBalance = 0,
  totalZohoExpenses = 0
}: SalaryCalculatorProps): SalaryCalculationResults => {
  
  // Memoize all calculations to prevent unnecessary recalculations
  return useMemo(() => {
    // Tax reserve percentage is fixed at 5%
    const taxReservePercentage = 5;
    // ITBM coverage percentage is fixed at 7%
    const itbmCoveragePercentage = 7;
    
    // Calculate adjusted Zoho income
    const adjustedZohoIncome = calculationUtils.calculateAdjustedZohoIncome(
      startingBalance,
      zohoIncome,
      totalZohoExpenses
    );
    
    // Calculate profit first amount
    const profitFirstAmount = calculationUtils.calculateProfitFirstAmount(
      adjustedZohoIncome,
      profitPercentage
    );
    
    // Calculate tax reserve amount
    const taxReserveAmount = calculationUtils.calculateTaxReserveAmount(
      adjustedZohoIncome,
      taxReservePercentage
    );
    
    // Calculate total Zoho deductions
    const totalZohoDeductions = calculationUtils.calculateTotalZohoDeductions(
      opexAmount,
      itbmAmount,
      profitFirstAmount,
      taxReserveAmount
    );
    
    // Calculate remaining Zoho income
    const remainingZohoIncome = calculationUtils.calculateRemainingZohoIncome(
      adjustedZohoIncome,
      totalZohoDeductions
    );
    
    // For the new format, we're only using Zoho and ignoring Stripe
    
    // Calculate half of remaining Zoho income for each column
    const halfRemainingZoho = calculationUtils.calculateHalf(remainingZohoIncome);
    
    // Calculate ITBM coverage amount
    const itbmCoverageAmount = calculationUtils.calculateItbmCoverageAmount(
      halfRemainingZoho,
      itbmCoveragePercentage
    );
    
    // Calculate half remaining Zoho with ITBM
    const halfRemainingZohoWithItbm = calculationUtils.calculateHalfRemainingZohoWithItbm(
      halfRemainingZoho,
      itbmCoverageAmount
    );
    
    // Calculate salary (now just based on remaining Zoho)
    const salary = remainingZohoIncome;
    
    // Calculate salary with ITBM coverage
    const salaryWithItbmCoverage = remainingZohoIncome + itbmCoverageAmount;
    
    // For the columnar display format
    const leftColumnAmount = halfRemainingZoho;
    const rightColumnAmount = halfRemainingZoho;
    const itbmRowAmount = itbmCoverageAmount;
    
    return {
      adjustedZohoIncome,
      profitFirstAmount,
      taxReserveAmount,
      taxReservePercentage,
      totalZohoDeductions,
      remainingZohoIncome,
      halfRemainingZoho,
      itbmCoveragePercentage,
      itbmCoverageAmount,
      halfRemainingZohoWithItbm,
      salary,
      salaryWithItbmCoverage,
      leftColumnAmount,
      rightColumnAmount,
      itbmRowAmount
    };
  }, [
    zohoIncome,
    opexAmount,
    itbmAmount,
    profitPercentage,
    startingBalance,
    totalZohoExpenses
  ]);
};
