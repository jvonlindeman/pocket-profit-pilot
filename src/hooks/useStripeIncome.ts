
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DateRange, MonthlyBalance, StripeIncomeData } from '@/types/financial';
import { formatISO } from 'date-fns';
import { safeParseNumber } from '@/utils/financialUtils';

export const useStripeIncome = () => {
  const [stripeIncome, setStripeIncome] = useState<number>(0);
  const [stripeOverride, setStripeOverride] = useState<number | null>(null);
  const { toast } = useToast();

  // Load Stripe income data based on transactions or override value
  const loadStripeIncomeData = useCallback(async (
    dateRange: DateRange,
    isDateInRange: (date: string) => boolean
  ): Promise<StripeIncomeData> => {
    try {
      // Format month string for database query
      const monthString = formatISO(dateRange.startDate, { representation: 'date' }).substring(0, 7);
      
      // Load monthly balance data to check for override
      const { data: balanceData, error: balanceError } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthString)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error("Error loading monthly balance:", balanceError);
      }

      // Check if there's a stripe override value
      if (balanceData && balanceData.stripe_override !== null) {
        // Convert and store the override value
        const overrideValue = safeParseNumber(balanceData.stripe_override);
        setStripeOverride(overrideValue);
        setStripeIncome(overrideValue);
        
        console.log("Using Stripe override value:", overrideValue);
        
        return {
          amount: overrideValue,
          isOverridden: true,
          override: overrideValue
        };
      } else {
        // Reset the override value
        setStripeOverride(null);
      }

      // If no override, calculate from transactions
      const { data: stripeTransactions, error: stripeError } = await supabase
        .from('cached_transactions')
        .select('*')
        .eq('source', 'Stripe')
        .eq('type', 'income');

      if (stripeError) {
        console.error("Error loading Stripe transactions:", stripeError);
        return { amount: 0, isOverridden: false, override: null };
      }

      if (stripeTransactions) {
        // Filter transactions within date range
        const filteredTransactions = stripeTransactions.filter(tx => isDateInRange(tx.date));
        
        // Calculate total from transactions
        const total = filteredTransactions.reduce((sum, tx) => {
          const amount = safeParseNumber(tx.amount);
          return sum + amount;
        }, 0);
        
        setStripeIncome(total);
        console.log("Calculated Stripe income from transactions:", total);
        
        return {
          amount: total,
          isOverridden: false,
          override: null
        };
      }

      return { amount: 0, isOverridden: false, override: null };
    } catch (err) {
      console.error("Error in loadStripeIncomeData:", err);
      toast({
        variant: "destructive",
        title: "Error cargando datos de Stripe",
        description: err instanceof Error ? err.message : "Error desconocido",
      });
      return { amount: 0, isOverridden: false, override: null };
    }
  }, [toast]);

  return {
    stripeIncome,
    stripeOverride,
    setStripeIncome,
    setStripeOverride,
    loadStripeIncomeData,
  };
};
