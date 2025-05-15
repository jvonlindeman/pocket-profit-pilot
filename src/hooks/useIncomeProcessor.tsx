
import { useCallback, useState, useEffect } from 'react';
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

  // Debug logging for state changes
  useEffect(() => {
    console.log("useIncomeProcessor: Stripe state values:", {
      stripeIncome,
      stripeFees,
      stripeTransactionFees,
      stripePayoutFees,
      stripeAdditionalFees,
      stripeNet,
      stripeFeePercentage
    });
  }, [
    stripeIncome,
    stripeFees,
    stripeTransactionFees,
    stripePayoutFees,
    stripeAdditionalFees,
    stripeNet,
    stripeFeePercentage
  ]);

  // Function to process and separate income types
  const processIncomeTypes = useCallback((transactions: Transaction[], stripeData: any) => {
    let regularAmount = 0;
    
    // Calculate regular income (excluding Stripe transactions)
    transactions.forEach(transaction => {
      if (transaction.type === 'income' && transaction.source !== 'Stripe') {
        regularAmount += transaction.amount;
      }
    });
    
    // Enhanced debug logging for Stripe data
    console.log("useIncomeProcessor: Processing Stripe data:", stripeData);
    console.log("useIncomeProcessor: Stripe data type:", typeof stripeData);
    
    if (!stripeData) {
      console.error("useIncomeProcessor: No Stripe data received");
      toast({
        title: "Error",
        description: "No Stripe data received for processing",
        variant: "destructive"
      });
      return { 
        stripeGross: 0, 
        stripeFees: 0,
        stripeTransactionFees: 0,
        stripePayoutFees: 0,
        stripeAdditionalFees: 0,
        stripeAdvances: 0,
        stripeAdvanceFunding: 0,
        stripeNet: 0,
        stripeFeePercentage: 0,
        regularAmount 
      };
    }
    
    // NEW: Helper function to safely extract numeric values
    const safeNumber = (value: any): number => {
      if (typeof value === 'number' && !isNaN(value)) return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    
    // Extract values with proper fallbacks and debugging
    const gross = safeNumber(stripeData.gross);
    const fees = safeNumber(stripeData.fees);
    const transactionFees = safeNumber(stripeData.transactionFees);
    const payoutFees = safeNumber(stripeData.payoutFees);
    const stripeFees = safeNumber(stripeData.stripeFees);
    const advances = safeNumber(stripeData.advances);
    const advanceFunding = safeNumber(stripeData.advanceFunding);
    const net = safeNumber(stripeData.net);
    const feePercentage = safeNumber(stripeData.feePercentage);
    
    // NEW: Enhanced debug logging of extracted values
    console.log("useIncomeProcessor: Extracted numeric values:", {
      gross, fees, transactionFees, payoutFees, stripeFees, advances, advanceFunding, net, feePercentage
    });
    
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
        variant: "destructive" // Changed from "warning" to "destructive"
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
