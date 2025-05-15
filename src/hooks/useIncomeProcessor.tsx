
import { useCallback, useState } from 'react';
import { Transaction } from '@/types/financial';
import { toast } from '@/hooks/use-toast';

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
    
    // Log the Stripe data received for debugging
    console.log("useIncomeProcessor: Processing Stripe data:", stripeData);
    
    // Set Stripe income from the API response
    const gross = stripeData.gross || 0;
    const fees = stripeData.fees || 0;
    const transactionFees = stripeData.transactionFees || 0;
    const payoutFees = stripeData.payoutFees || 0;
    const stripeFees = stripeData.stripeFees || 0;
    const advances = stripeData.advances || 0;
    const advanceFunding = stripeData.advanceFunding || 0;
    const net = stripeData.net || 0;
    const feePercentage = stripeData.feePercentage || 0;
    
    // Record values to state
    setStripeIncome(gross);
    setStripeFees(fees);
    setStripeTransactionFees(transactionFees);
    setStripePayoutFees(payoutFees);
    setStripeAdditionalFees(stripeFees);
    setStripeAdvances(advances);
    setStripeAdvanceFunding(advanceFunding);
    setStripeNet(net);
    setStripeFeePercentage(feePercentage);
    setRegularIncome(regularAmount);
    
    // Show toast for debugging if data is unexpected
    if (fees === 0 && gross > 0) {
      toast({
        title: "Stripe Data Warning",
        description: "Received Stripe income data but fees are zero",
        variant: "destructive"
      });
    }
    
    // Return processed data
    return { 
      stripeGross: gross, 
      stripeFees: fees,
      stripeTransactionFees: transactionFees,
      stripePayoutFees: payoutFees,
      stripeAdditionalFees: stripeFees,
      stripeAdvances: advances,
      stripeAdvanceFunding: advanceFunding,
      stripeNet: net,
      stripeFeePercentage: feePercentage,
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
