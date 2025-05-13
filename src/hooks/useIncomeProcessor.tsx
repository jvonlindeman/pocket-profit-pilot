
import { useCallback, useState } from 'react';
import { Transaction } from '@/types/financial';

export const useIncomeProcessor = () => {
  // States for storing processed income data
  const [stripeIncome, setStripeIncome] = useState<number>(0);
  const [stripeFees, setStripeFees] = useState<number>(0);
  const [stripeNet, setStripeNet] = useState<number>(0);
  const [stripeFeePercentage, setStripeFeePercentage] = useState<number>(0);
  const [regularIncome, setRegularIncome] = useState<number>(0);

  // Función para procesar y separar ingresos
  const processIncomeTypes = useCallback((transactions: Transaction[], stripeData: any) => {
    let regularAmount = 0;
    
    // Calculate regular income (excluding Stripe transactions)
    transactions.forEach(transaction => {
      if (transaction.type === 'income' && transaction.source !== 'Stripe') {
        regularAmount += transaction.amount;
      }
    });
    
    // Set Stripe income from the API response
    setStripeIncome(stripeData.gross || 0);
    setStripeFees(stripeData.fees || 0);
    setStripeNet(stripeData.net || 0);
    setStripeFeePercentage(stripeData.feePercentage || 0);
    setRegularIncome(regularAmount);
    
    return { 
      stripeGross: stripeData.gross || 0, 
      stripeFees: stripeData.fees || 0, 
      stripeNet: stripeData.net || 0,
      regularAmount 
    };
  }, []);

  return {
    stripeIncome,
    stripeFees,
    stripeNet,
    stripeFeePercentage,
    regularIncome,
    processIncomeTypes
  };
};
