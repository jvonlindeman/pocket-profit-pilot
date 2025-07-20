
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
      stripeDataPresent: !!stripeData,
      stripeDataType: typeof stripeData,
      stripeDataKeys: stripeData ? Object.keys(stripeData) : 'none',
      stripeDataStructure: stripeData ? {
        hasGross: 'gross' in stripeData,
        hasFees: 'fees' in stripeData,
        hasNet: 'net' in stripeData,
        hasSummary: 'summary' in stripeData,
        hasData: 'data' in stripeData,
        rawKeys: Object.keys(stripeData)
      } : 'no stripe data'
    });

    let regularAmount = 0;
    
    // Calculate regular income (excluding Stripe transactions)
    transactions.forEach(transaction => {
      if (transaction.type === 'income' && transaction.source !== 'Stripe') {
        regularAmount += transaction.amount;
        console.log("💰 Regular income transaction:", {
          id: transaction.id,
          amount: transaction.amount,
          source: transaction.source,
          description: transaction.description
        });
      }
    });
    
    console.log("💰 useIncomeProcessor: Regular income calculated", { 
      regularAmount,
      regularIncomeTransactions: transactions.filter(tx => 
        tx.type === 'income' && tx.source !== 'Stripe'
      ).length
    });
    
    // Process Stripe data with comprehensive structure handling
    if (stripeData && typeof stripeData === 'object') {
      console.log("🔍 Processing Stripe data structure:", {
        directKeys: Object.keys(stripeData),
        hasDirectGross: 'gross' in stripeData,
        hasDirectFees: 'fees' in stripeData,
        hasDirectNet: 'net' in stripeData,
        hasSummaryObject: 'summary' in stripeData,
        hasDataObject: 'data' in stripeData,
        summaryKeys: stripeData.summary ? Object.keys(stripeData.summary) : 'no summary',
        dataKeys: stripeData.data ? Object.keys(stripeData.data) : 'no data'
      });

      // Try multiple data extraction paths
      let gross = 0, fees = 0, transactionFees = 0, payoutFees = 0, additionalFees = 0;
      let advances = 0, advanceFunding = 0, net = 0, feePercentage = 0;

      // Path 1: Direct properties
      if (stripeData.gross !== undefined) {
        gross = stripeData.gross || 0;
        fees = stripeData.fees || 0;
        transactionFees = stripeData.transactionFees || 0;
        payoutFees = stripeData.payoutFees || 0;
        additionalFees = stripeData.stripeFees || stripeData.additionalFees || 0;
        advances = stripeData.advances || 0;
        advanceFunding = stripeData.advanceFunding || 0;
        net = stripeData.net || 0;
        feePercentage = stripeData.feePercentage || 0;
        console.log("✅ Using direct Stripe properties");
      }
      // Path 2: Summary object
      else if (stripeData.summary) {
        gross = stripeData.summary.gross || 0;
        fees = stripeData.summary.fees || 0;
        transactionFees = stripeData.summary.transactionFees || 0;
        payoutFees = stripeData.summary.payoutFees || 0;
        additionalFees = stripeData.summary.stripeFees || stripeData.summary.additionalFees || 0;
        advances = stripeData.summary.advances || 0;
        advanceFunding = stripeData.summary.advanceFunding || 0;
        net = stripeData.summary.net || 0;
        feePercentage = stripeData.summary.feePercentage || 0;
        console.log("✅ Using Stripe summary object");
      }
      // Path 3: Data object
      else if (stripeData.data) {
        gross = stripeData.data.gross || 0;
        fees = stripeData.data.fees || 0;
        transactionFees = stripeData.data.transactionFees || 0;
        payoutFees = stripeData.data.payoutFees || 0;
        additionalFees = stripeData.data.stripeFees || stripeData.data.additionalFees || 0;
        advances = stripeData.data.advances || 0;
        advanceFunding = stripeData.data.advanceFunding || 0;
        net = stripeData.data.net || 0;
        feePercentage = stripeData.data.feePercentage || 0;
        console.log("✅ Using Stripe data object");
      }

      console.log("💳 useIncomeProcessor: Extracted Stripe values", {
        gross, fees, transactionFees, payoutFees, additionalFees, 
        advances, advanceFunding, net, feePercentage,
        extractionMethod: stripeData.gross !== undefined ? 'direct' : 
                         stripeData.summary ? 'summary' : 
                         stripeData.data ? 'data' : 'unknown'
      });

      // Verify values make sense
      if (gross > 0) {
        console.log("✅ Stripe income values look correct:", {
          gross: `$${gross.toLocaleString()}`,
          fees: `$${fees.toLocaleString()}`,
          net: `$${net.toLocaleString()}`,
          feePercentage: `${feePercentage.toFixed(2)}%`
        });
      } else {
        console.warn("⚠️ Stripe gross income is 0 or missing, this might be incorrect");
      }

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
    
    const result = { 
      stripeGross: stripeData?.gross || stripeData?.summary?.gross || stripeData?.data?.gross || 0, 
      stripeFees: stripeData?.fees || stripeData?.summary?.fees || stripeData?.data?.fees || 0,
      stripeTransactionFees: stripeData?.transactionFees || stripeData?.summary?.transactionFees || stripeData?.data?.transactionFees || 0,
      stripePayoutFees: stripeData?.payoutFees || stripeData?.summary?.payoutFees || stripeData?.data?.payoutFees || 0,
      stripeAdditionalFees: stripeData?.stripeFees || stripeData?.additionalFees || stripeData?.summary?.stripeFees || stripeData?.data?.stripeFees || 0,
      stripeAdvances: stripeData?.advances || stripeData?.summary?.advances || stripeData?.data?.advances || 0,
      stripeAdvanceFunding: stripeData?.advanceFunding || stripeData?.summary?.advanceFunding || stripeData?.data?.advanceFunding || 0,
      stripeNet: stripeData?.net || stripeData?.summary?.net || stripeData?.data?.net || 0,
      regularAmount 
    };

    console.log("📊 useIncomeProcessor: Final processed result", result);
    return result;
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
