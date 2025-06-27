
import { useState, useCallback } from 'react';
import { format as formatDate } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export const useMonthlyBalanceManager = () => {
  const [startingBalance, setStartingBalance] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string | undefined>(undefined);

  // Fetch monthly balance for the selected month
  const fetchMonthlyBalance = useCallback(async (date: Date) => {
    try {
      const monthYear = formatDate(date, 'yyyy-MM');
      
      console.log("📊 useMonthlyBalanceManager: Fetching monthly balance for:", monthYear);
      
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthYear)
        .maybeSingle(); // FIXED: Changed from .single() to .maybeSingle()
      
      if (error) {
        console.error("❌ useMonthlyBalanceManager: Error fetching monthly balance:", error);
        // Don't throw the error, just log it and continue
        setStartingBalance(undefined);
        setNotes(undefined);
        return;
      }

      if (data) {
        console.log("✅ useMonthlyBalanceManager: Fetched monthly balance with all fields:", data);
        console.log("✅ useMonthlyBalanceManager: Include Zoho 50%:", data.include_zoho_fifty_percent);
        // Update the local state with the balance and notes from the database
        setStartingBalance(data.balance);
        setNotes(data.notes || undefined);
      } else {
        console.log("ℹ️ useMonthlyBalanceManager: No monthly balance found for:", monthYear);
        setStartingBalance(undefined);
        setNotes(undefined);
      }
    } catch (err) {
      console.error("❌ useMonthlyBalanceManager: Unexpected error in fetchMonthlyBalance:", err);
      // Don't let the error bubble up - set safe defaults
      setStartingBalance(undefined);
      setNotes(undefined);
    }
  }, []);

  // Update the starting balance with additional calculator fields including tax reserve percentage and zoho fifty percent toggle
  const updateStartingBalance = useCallback(async (
    balance: number, 
    date: Date, 
    opexAmount: number = 35,
    itbmAmount: number = 0,
    profitPercentage: number = 1,
    taxReservePercentage: number = 5,
    includeZohoFiftyPercent: boolean = true,
    notes?: string
  ) => {
    try {
      console.log("✅ useMonthlyBalanceManager: Updating monthly balance with values:", {
        balance, date, opexAmount, itbmAmount, profitPercentage, taxReservePercentage, includeZohoFiftyPercent, notes
      });
      
      const monthYear = formatDate(date, 'yyyy-MM');
      
      // Check if a record already exists - use maybeSingle() here too
      const { data: existingData, error: fetchError } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthYear)
        .maybeSingle(); // FIXED: Changed from .single() to .maybeSingle()
      
      if (fetchError) {
        console.error("❌ useMonthlyBalanceManager: Error checking existing balance:", fetchError);
        return false;
      }
      
      const updateData: any = {
        balance,
        opex_amount: opexAmount, 
        itbm_amount: itbmAmount,
        profit_percentage: profitPercentage,
        tax_reserve_percentage: taxReservePercentage,
        include_zoho_fifty_percent: includeZohoFiftyPercent,
        notes: notes || (existingData?.notes || null),
      };
      
      console.log("✅ useMonthlyBalanceManager: Saving data with include_zoho_fifty_percent:", includeZohoFiftyPercent);
      
      let result;
      
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('monthly_balances')
          .update(updateData)
          .eq('month_year', monthYear);
      } else {
        // Create new record
        result = await supabase
          .from('monthly_balances')
          .insert({
            month_year: monthYear,
            ...updateData
          });
      }
      
      if (result.error) {
        console.error("❌ useMonthlyBalanceManager: Error updating starting balance:", result.error);
        return false;
      }
      
      // Immediately update local state for faster UI feedback
      setStartingBalance(balance);
      setNotes(notes);
      console.log("✅ useMonthlyBalanceManager: Starting balance updated successfully with include_zoho_fifty_percent:", includeZohoFiftyPercent);
      return true;
    } catch (err) {
      console.error("❌ useMonthlyBalanceManager: Unexpected error updating starting balance:", err);
      return false;
    }
  }, []);

  return {
    startingBalance,
    notes,
    fetchMonthlyBalance,
    updateStartingBalance,
    setStartingBalance, // Export this function to allow direct state updates
    setNotes // Export this function to allow direct state updates
  };
};
