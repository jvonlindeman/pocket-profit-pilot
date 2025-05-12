import { useState, useCallback } from 'react';
import { Transaction, CategorySummary, SalaryCalculation } from '@/types/financial';

export const useFinanceProcessing = () => {
  const [stripeIncome, setStripeIncome] = useState<number>(0);
  const [regularIncome, setRegularIncome] = useState<number>(0);
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<any[]>([]);
  const [salaryCalculation, setSalaryCalculation] = useState<SalaryCalculation>({
    zohoIncome: 0,
    opexAmount: 0,
    taxAmount: 0,
    itbmAmount: 0,
    profitAmount: 0,
    zohoSalaryProfit: 0,
    halfZohoSalaryProfit: 0,
    stripeTotal: 0,
    halfStripeTotal: 0,
    totalSalary: 0
  });
  
  // Función para procesar y separar ingresos
  const processIncomeTypes = useCallback((transactions: Transaction[], stripeOverride: number | null) => {
    let stripeAmount = 0;
    let regularAmount = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        if (transaction.source === 'Stripe') {
          stripeAmount += transaction.amount;
        } else {
          regularAmount += transaction.amount;
        }
      }
    });
    
    // If there's a stripe override value, use that instead of calculated value
    if (stripeOverride !== null) {
      console.log("Using stripe override value:", stripeOverride, "instead of calculated:", stripeAmount);
      stripeAmount = stripeOverride;
    }
    
    setStripeIncome(stripeAmount);
    setRegularIncome(regularAmount);
    
    return { stripeAmount, regularAmount };
  }, []);

  // Función para procesar datos de colaboradores
  const processCollaboratorData = useCallback((rawResponse: any) => {
    if (!rawResponse || !rawResponse.colaboradores || !Array.isArray(rawResponse.colaboradores)) {
      setCollaboratorExpenses([]);
      return [];
    }

    // Filtrar colaboradores con datos válidos
    const validCollaborators = rawResponse.colaboradores
      .filter((item: any) => item && typeof item.total !== 'undefined' && item.vendor_name)
      .map((item: any) => ({
        name: item.vendor_name,
        amount: Number(item.total)
      }))
      .filter((item: any) => item.amount > 0);

    // Calcular el total
    const totalAmount = validCollaborators.reduce((sum: number, item: any) => sum + item.amount, 0);
    
    // Calcular porcentajes y formatear para el gráfico
    const formattedData = validCollaborators.map((item: any) => ({
      category: item.name,
      amount: item.amount,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
    })).sort((a: any, b: any) => b.amount - a.amount);
    
    setCollaboratorExpenses(formattedData);
    return formattedData;
  }, []);

  // New function to calculate salary based on financial data
  const calculateSalary = useCallback(
    (
      zohoIncome: number, 
      stripeIncome: number, 
      opexAmount: number, 
      itbmAmount: number, 
      profitPercentage: number
    ) => {
      // Calculate tax amount (5% of Zoho income)
      const taxAmount = zohoIncome * 0.05;
      
      // Calculate profit amount (configurable percentage of Zoho income)
      const profitAmount = zohoIncome * (profitPercentage / 100);
      
      // Calculate Zoho salary profit (Zoho income - OPEX - tax - ITBM - profit)
      const zohoSalaryProfit = zohoIncome - opexAmount - taxAmount - itbmAmount - profitAmount;
      
      // Calculate half of Zoho salary profit (50%)
      const halfZohoSalaryProfit = zohoSalaryProfit / 2;
      
      // Calculate half of Stripe income (50%)
      const halfStripeTotal = stripeIncome / 2;
      
      // Calculate total salary (50% of Zoho profit + 50% of Stripe profit)
      const totalSalary = halfZohoSalaryProfit + halfStripeTotal;
      
      const calculation = {
        zohoIncome,
        opexAmount,
        taxAmount,
        itbmAmount,
        profitAmount,
        zohoSalaryProfit,
        halfZohoSalaryProfit,
        stripeTotal: stripeIncome,
        halfStripeTotal,
        totalSalary
      };
      
      setSalaryCalculation(calculation);
      return calculation;
    },
    []
  );

  return {
    stripeIncome,
    regularIncome,
    collaboratorExpenses,
    salaryCalculation,
    processIncomeTypes,
    processCollaboratorData,
    calculateSalary
  };
};
