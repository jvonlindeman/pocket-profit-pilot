
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format as formatDate } from 'date-fns';

export const useMonthlyBalanceOperations = () => {
  const [startingBalance, setStartingBalance] = useState<number | undefined>(undefined);
  const [stripeOverride, setStripeOverride] = useState<number | null>(null);

  // Fetch monthly balance for the selected month
  const fetchMonthlyBalance = useCallback(async (date: Date) => {
    try {
      const monthYear = formatDate(date, 'yyyy-MM');
      
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthYear)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error("Error fetching monthly balance:", error);
      }

      if (data) {
        console.log("Fetched monthly balance:", data);
        setStartingBalance(data.balance);
        setStripeOverride(data.stripe_override);
      } else {
        console.log("No monthly balance found for:", monthYear);
        setStartingBalance(undefined);
        setStripeOverride(null);
      }
    } catch (err) {
      console.error("Error in fetchMonthlyBalance:", err);
    }
  }, []);

  // Update the starting balance
  const updateStartingBalance = useCallback(async (balance: number, date: Date, notes?: string) => {
    try {
      const monthYear = formatDate(date, 'yyyy-MM');
      
      // Check if a record already exists
      const { data: existingData } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthYear)
        .single();
      
      if (existingData) {
        // Update existing record
        await supabase
          .from('monthly_balances')
          .update({
            balance,
            notes: notes || existingData.notes,
          })
          .eq('month_year', monthYear);
      } else {
        // Create new record
        await supabase
          .from('monthly_balances')
          .insert({
            month_year: monthYear,
            balance,
            notes: notes || null,
          });
      }
      
      setStartingBalance(balance);
    } catch (err) {
      console.error("Error updating starting balance:", err);
    }
  }, []);

  // Update the stripe override value
  const updateStripeOverride = useCallback(async (override: number | null, date: Date) => {
    try {
      const monthYear = formatDate(date, 'yyyy-MM');
      
      // Check if a record already exists
      const { data: existingData } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthYear)
        .single();
      
      if (existingData) {
        // Update existing record
        await supabase
          .from('monthly_balances')
          .update({
            stripe_override: override
          })
          .eq('month_year', monthYear);
      } else {
        // Create new record with default balance 0
        await supabase
          .from('monthly_balances')
          .insert({
            month_year: monthYear,
            balance: 0,
            stripe_override: override
          });
      }
      
      setStripeOverride(override);
    } catch (err) {
      console.error("Error updating stripe override:", err);
    }
  }, []);

  return {
    startingBalance,
    stripeOverride,
    fetchMonthlyBalance,
    updateStartingBalance,
    updateStripeOverride,
    setStartingBalance,
    setStripeOverride
  };
};
