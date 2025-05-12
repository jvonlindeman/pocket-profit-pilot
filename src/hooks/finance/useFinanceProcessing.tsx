
import { useState, useCallback } from 'react';
import { Transaction, CategorySummary } from '@/types/financial';

export const useFinanceProcessing = () => {
  const [stripeIncome, setStripeIncome] = useState<number>(0);
  const [regularIncome, setRegularIncome] = useState<number>(0);
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<any[]>([]);
  
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

  return {
    stripeIncome,
    regularIncome,
    collaboratorExpenses,
    processIncomeTypes,
    processCollaboratorData
  };
};
