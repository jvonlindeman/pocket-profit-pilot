
import { useCallback, useState } from 'react';
import { Transaction } from '@/types/financial';
import { toast } from "@/components/ui/use-toast";

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
  const [creditCardIncome, setCreditCardIncome] = useState<number>(0);
  const [stripeAdvances, setStripeAdvances] = useState<number>(0);
  const [stripeAdvanceFunding, setStripeAdvanceFunding] = useState<number>(0);

  // Function to process and separate income types
  const processIncomeTypes = useCallback((transactions: Transaction[], stripeData: any) => {
    let regularAmount = 0;
    let creditCardAmount = 0;
    
    // Calculate regular income and credit card income separately
    transactions.forEach(transaction => {
      if (transaction.type === 'income' && transaction.source !== 'Stripe') {
        // Check if this is a credit card payment
        const isCreditCard = 
          transaction.payment_method?.toLowerCase().includes('credit') || 
          transaction.payment_method?.toLowerCase().includes('card') || 
          transaction.payment_method?.toLowerCase().includes('tarjeta') ||
          transaction.payment_method?.toLowerCase().includes('visa') ||
          transaction.payment_method?.toLowerCase().includes('mastercard') ||
          transaction.payment_method?.toLowerCase().includes('amex') ||
          (transaction as any).is_credit_card === true;
        
        if (isCreditCard) {
          // Add to credit card income
          creditCardAmount += transaction.amount;
          console.log(`Credit card payment detected: ${transaction.amount} (${transaction.description})`);
        } else {
          // Add to regular income
          regularAmount += transaction.amount;
        }
      }
    });
    
    // Set Stripe income from the API response
    setStripeIncome(stripeData.gross || 0);
    setStripeFees(stripeData.fees || 0);
    setStripeTransactionFees(stripeData.transactionFees || 0);
    setStripePayoutFees(stripeData.payoutFees || 0);
    setStripeAdditionalFees(stripeData.stripeFees || 0);
    setStripeAdvances(stripeData.advances || 0);
    setStripeAdvanceFunding(stripeData.advanceFunding || 0);
    setStripeNet(stripeData.net || 0);
    setStripeFeePercentage(stripeData.feePercentage || 0);
    setRegularIncome(regularAmount);
    setCreditCardIncome(creditCardAmount);
    
    // Show notification if credit card payments were found
    if (creditCardAmount > 0) {
      toast({
        title: "Credit Card Payments Found",
        description: `Detected ${creditCardAmount.toFixed(2)} in credit card payments from Zoho`,
      });
    }
    
    return { 
      stripeGross: stripeData.gross || 0, 
      stripeFees: stripeData.fees || 0,
      stripeTransactionFees: stripeData.transactionFees || 0,
      stripePayoutFees: stripeData.payoutFees || 0,
      stripeAdditionalFees: stripeData.stripeFees || 0,
      stripeAdvances: stripeData.advances || 0,
      stripeAdvanceFunding: stripeData.advanceFunding || 0,
      stripeNet: stripeData.net || 0,
      regularAmount,
      creditCardAmount
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
    creditCardIncome,
    processIncomeTypes
  };
};
