
import { useCallback, useState } from 'react';
import { Transaction } from '@/types/financial';

export const useIncomeProcessor = () => {
  // States for storing processed income data
  const [stripeIncome, setStripeIncome] = useState<number>(0);
  const [stripeFees, setStripeFees] = useState<number>(0);
  const [stripeTransactionFees, setStripeTransactionFees] = useState<number>(0);
  const [stripePayoutFees, setStripePayoutFees] = useState<number>(0);
  const [stripeAdditionalFees, setStripeAdditionalFees] = useState<number>(0);
  const [stripeNet, setStripeNet] = useState<number>(0);
  const [stripeFeePercentage, setStripeFeePercentage] = useState<number>(0);
  const [regularIncome, setRegularIncome] = useState<number>(0);
  const [stripeAdvances, setStripeAdvances] = useState<number>(0);
  const [stripeAdvanceFunding, setStripeAdvanceFunding] = useState<number>(0);

  // Function to process and separate income types
  const processIncomeTypes = useCallback((transactions: Transaction[], stripeData: any) => {
    let regularAmount = 0;
    
    // Calculate regular income (excluding Stripe transactions)
    transactions.forEach(transaction => {
      if (transaction.type === 'income' && transaction.source !== 'Stripe') {
        regularAmount += transaction.amount;
      }
    });
    
    // Add null check for stripeData before accessing its properties
    if (stripeData && typeof stripeData === 'object') {
      setStripeIncome(stripeData.gross || 0);
      setStripeFees(stripeData.fees || 0);
      setStripeTransactionFees(stripeData.transactionFees || 0);
      setStripePayoutFees(stripeData.payoutFees || 0);
      setStripeAdditionalFees(stripeData.stripeFees || 0);
      setStripeAdvances(stripeData.advances || 0);
      setStripeAdvanceFunding(stripeData.advanceFunding || 0);
      setStripeNet(stripeData.net || 0);
      setStripeFeePercentage(stripeData.feePercentage || 0);
    } else {
      // Reset all Stripe values to 0 when stripeData is null
      setStripeIncome(0);
      setStripeFees(0);
      setStripeTransactionFees(0);
      setStripePayoutFees(0);
      setStripeAdditionalFees(0);
      setStripeAdvances(0);
      setStripeAdvanceFunding(0);
      setStripeNet(0);
      setStripeFeePercentage(0);
    }
    
    setRegularIncome(regularAmount);
    
    return { 
      stripeGross: stripeData?.gross || 0, 
      stripeFees: stripeData?.fees || 0,
      stripeTransactionFees: stripeData?.transactionFees || 0,
      stripePayoutFees: stripeData?.payoutFees || 0,
      stripeAdditionalFees: stripeData?.stripeFees || 0,
      stripeAdvances: stripeData?.advances || 0,
      stripeAdvanceFunding: stripeData?.advanceFunding || 0,
      stripeNet: stripeData?.net || 0,
      regularAmount 
    };
  }, []);

  return {
    stripeIncome,
    stripeFees,
    stripeTransactionFees,
    stripePayoutFees,
    stripeAdditionalFees,
    stripeAdvances,
    stripeAdvanceFunding,
    stripeNet,
    stripeFeePercentage,
    regularIncome,
    processIncomeTypes
  };
};
