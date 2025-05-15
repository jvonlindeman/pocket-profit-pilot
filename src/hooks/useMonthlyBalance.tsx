
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyBalance } from '@/types/financial';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { formatDateYYYYMMDD } from '@/utils/dateUtils';

interface UseMonthlyBalanceProps {
  currentDate: Date;
}

export const useMonthlyBalance = ({ currentDate }: UseMonthlyBalanceProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthlyBalance, setMonthlyBalance] = useState<MonthlyBalance | null>(null);
  const { toast } = useToast();

  // Format the month_year for database queries (YYYY-MM)
  const formatMonthYear = (date: Date) => {
    try {
      // Ensure we have a valid date
      if (!date || isNaN(date.getTime())) {
        console.error("Invalid date provided to formatMonthYear:", date);
        // Return current month as fallback
        return format(new Date(), 'yyyy-MM');
      }
      return format(date, 'yyyy-MM');
    } catch (err) {
      console.error("Error formatting month-year:", err);
      return format(new Date(), 'yyyy-MM');
    }
  };

  // Get the current month-year string
  const currentMonthYear = formatMonthYear(currentDate);

  // Fetch the monthly balance for the given date
  const fetchMonthlyBalance = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching monthly balance for:", currentMonthYear);
      
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', currentMonthYear)
        .maybeSingle();

      if (error) {
        console.error("Error fetching monthly balance:", error);
        throw error;
      }

      console.log("Fetched monthly balance:", data);
      setMonthlyBalance(data);
      return data;
    } catch (err: any) {
      console.error("Error fetching monthly balance:", err);
      setError(err.message || "Error al cargar el balance mensual");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Check if a balance exists for the current month
  const checkBalanceExists = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('id')
        .eq('month_year', currentMonthYear)
        .maybeSingle();

      if (error) {
        console.error("Error checking monthly balance:", error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error("Error in checkBalanceExists:", err);
      return false;
    }
  };

  // Set or update the monthly balance
  const updateMonthlyBalance = async (
    balance: number, 
    opexAmount: number = 35,
    itbmAmount: number = 0, 
    profitPercentage: number = 1, 
    notes?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const exists = await checkBalanceExists();
      
      const updateData = {
        balance,
        opex_amount: opexAmount,
        itbm_amount: itbmAmount,
        profit_percentage: profitPercentage,
        notes: notes || null,
      };
      
      let result;
      
      if (exists) {
        // Update existing record
        console.log("Updating existing monthly balance for:", currentMonthYear);
        result = await supabase
          .from('monthly_balances')
          .update(updateData)
          .eq('month_year', currentMonthYear)
          .select();
      } else {
        // Create new record
        console.log("Creating new monthly balance for:", currentMonthYear);
        result = await supabase
          .from('monthly_balances')
          .insert({
            month_year: currentMonthYear,
            ...updateData
          })
          .select();
      }
      
      if (result.error) {
        console.error("Error updating monthly balance:", result.error);
        
        // Handle specific error codes
        if (result.error.code === '23505') { // Duplicate key error
          toast({
            title: "Error",
            description: "Ya existe un balance para este mes. Actualizando datos...",
            variant: "destructive",
          });
          
          // Try again with update instead
          const retryResult = await supabase
            .from('monthly_balances')
            .update(updateData)
            .eq('month_year', currentMonthYear)
            .select();
            
          if (retryResult.error) {
            throw retryResult.error;
          }
          
          setMonthlyBalance(retryResult.data[0] || null);
          
          toast({
            title: "Balance actualizado",
            description: `Se actualizó el balance de ${format(currentDate, 'MMMM yyyy')}`,
          });
          
          return true;
        }
        
        throw result.error;
      }
      
      setMonthlyBalance(result.data[0] || null);
      
      toast({
        title: exists ? "Balance actualizado" : "Balance creado",
        description: `Se ${exists ? 'actualizó' : 'creó'} el balance de ${format(currentDate, 'MMMM yyyy')}`,
      });
      
      return true;
    } catch (err: any) {
      console.error("Error updating monthly balance:", err);
      setError(err.message || "Error al actualizar el balance mensual");
      
      toast({
        title: "Error",
        description: "No se pudo actualizar el balance mensual",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch the balance when the current date changes
  useEffect(() => {
    fetchMonthlyBalance();
  }, [currentMonthYear]);

  return {
    loading,
    error,
    monthlyBalance,
    updateMonthlyBalance,
    fetchMonthlyBalance,
    checkBalanceExists,
    currentMonthYear,
    // Add this for backward compatibility
    startingBalance: monthlyBalance?.balance,
    setStartingBalance: (balance: number) => {
      if (monthlyBalance) {
        updateMonthlyBalance(
          balance,
          monthlyBalance.opex_amount,
          monthlyBalance.itbm_amount,
          monthlyBalance.profit_percentage,
          monthlyBalance.notes || undefined
        );
      } else {
        updateMonthlyBalance(balance);
      }
    }
  };
};
