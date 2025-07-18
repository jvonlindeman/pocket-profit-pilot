
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
    console.log("🔄 useIncomeProcessor: Processing income data", {
      transactionCount: transactions.length,
      stripeData: stripeData ? 'present' : 'null',
      stripeDataKeys: stripeData ? Object.keys(stripeData) : 'none'
    });

    let regularAmount = 0;
    
    // Calculate regular income (excluding Stripe transactions)
    transactions.forEach(transaction => {
      if (transaction.type === 'income' && transaction.source !== 'Stripe') {
        regularAmount += transaction.amount;
      }
    });
    
    console.log("💰 useIncomeProcessor: Regular income calculated", { regularAmount });
    
    // Process Stripe data with null checks and proper structure handling
    if (stripeData && typeof stripeData === 'object') {
      // Handle both direct values and nested data structure
      const gross = stripeData.gross || stripeData.data?.gross || 0;
      const fees = stripeData.fees || stripeData.data?.fees || 0;
      const transactionFees = stripeData.transactionFees || stripeData.data?.transactionFees || 0;
      const payoutFees = stripeData.payoutFees || stripeData.data?.payoutFees || 0;
      const additionalFees = stripeData.stripeFees || stripeData.additionalFees || stripeData.data?.stripeFees || 0;
      const advances = stripeData.advances || stripeData.data?.advances || 0;
      const advanceFunding = stripeData.advanceFunding || stripeData.data?.advanceFunding || 0;
      const net = stripeData.net || stripeData.data?.net || 0;
      const feePercentage = stripeData.feePercentage || stripeData.data?.feePercentage || 0;

      console.log("💳 useIncomeProcessor: Stripe data processed", {
        gross, fees, transactionFees, payoutFees, additionalFees, net, feePercentage
      });

      setStripeIncome(gross);
      setStripeFees(fees);
      setStripeTransactionFees(transactionFees);
      setStripePayoutFees(payoutFees);
      setStripeAdditionalFees(additionalFees);
      setStripeAdvances(advances);
      setStripeAdvanceFunding(advanceFunding);
      setStripeNet(net);
      setStripeFeePercentage(feePercentage);
    } else {
      console.log("⚠️ useIncomeProcessor: No valid Stripe data, resetting to 0");
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
      stripeGross: stripeData?.gross || stripeData?.data?.gross || 0, 
      stripeFees: stripeData?.fees || stripeData?.data?.fees || 0,
      stripeTransactionFees: stripeData?.transactionFees || stripeData?.data?.transactionFees || 0,
      stripePayoutFees: stripeData?.payoutFees || stripeData?.data?.payoutFees || 0,
      stripeAdditionalFees: stripeData?.stripeFees || stripeData?.additionalFees || stripeData?.data?.stripeFees || 0,
      stripeAdvances: stripeData?.advances || stripeData?.data?.advances || 0,
      stripeAdvanceFunding: stripeData?.advanceFunding || stripeData?.data?.advanceFunding || 0,
      stripeNet: stripeData?.net || stripeData?.data?.net || 0,
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
