
import { useState, useCallback, useEffect } from 'react';
import { format as formatDate } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyBalance } from '@/types/financial';

interface UseMonthlyBalanceProps {
  currentDate: Date;
}

export const useMonthlyBalance = ({ currentDate }: UseMonthlyBalanceProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [monthlyBalance, setMonthlyBalance] = useState<MonthlyBalance | null>(null);
  
  // Format the current month-year
  const currentMonthYear = formatDate(currentDate, 'yyyy-MM');

  // Function to check if a balance exists for the current month
  const checkBalanceExists = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      const monthYear = formatDate(currentDate, 'yyyy-MM');
      
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthYear)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error("Error checking balance:", error);
        setError(error.message);
        return false;
      }
      
      if (data) {
        setBalance(data.balance);
        setNotes(data.notes);
        setMonthlyBalance(data as MonthlyBalance);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Error in checkBalanceExists:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // Function to save or update the balance
  const saveBalance = useCallback(async (value: number, noteText?: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const monthYear = formatDate(currentDate, 'yyyy-MM');
      
      // Check if a record already exists
      const { data: existingData, error: checkError } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthYear)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing balance:", checkError);
        setError(checkError.message);
        return false;
      }
      
      // Perform update or insert
      let result;
      
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('monthly_balances')
          .update({
            balance: value,
            notes: noteText ?? existingData.notes,
          })
          .eq('month_year', monthYear);
      } else {
        // Create new record
        result = await supabase
          .from('monthly_balances')
          .insert({
            month_year: monthYear,
            balance: value,
            notes: noteText || null,
          });
      }
      
      if (result.error) {
        console.error("Error saving balance:", result.error);
        setError(result.error.message);
        return false;
      }
      
      // Update local state
      setBalance(value);
      setNotes(noteText || null);
      
      // Fetch the updated data to update the monthlyBalance state
      const { data: updatedData } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthYear)
        .single();
        
      if (updatedData) {
        setMonthlyBalance(updatedData as MonthlyBalance);
      }
      
      return true;
    } catch (err) {
      console.error("Error in saveBalance:", err);
      setError(err instanceof Error ? err.message : 'Unknown error saving balance');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // For backward compatibility with existing code
  const updateMonthlyBalance = saveBalance;

  // Load data when currentDate changes
  useEffect(() => {
    checkBalanceExists();
  }, [currentDate, checkBalanceExists]);

  return {
    loading,
    error,
    balance,
    notes,
    checkBalanceExists,
    saveBalance,
    updateMonthlyBalance, // Alias for saveBalance for backward compatibility
    monthlyBalance,
    currentMonthYear
  };
};
