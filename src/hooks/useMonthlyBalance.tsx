
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyBalance } from '@/types/financial';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { formatDateYYYYMMDD } from '@/utils/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseMonthlyBalanceProps {
  currentDate: Date;
}

export const useMonthlyBalance = ({ currentDate }: UseMonthlyBalanceProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthlyBalance, setMonthlyBalance] = useState<MonthlyBalance | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Format the month_year for database queries (YYYY-MM)
  const formatMonthYear = useCallback((date: Date) => {
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
  }, []);

  // Get the current month-year string
  const currentMonthYear = formatMonthYear(currentDate);

  // Fetch the monthly balance for the given date
  const fetchMonthlyBalance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("useMonthlyBalance: Fetching monthly balance for:", currentMonthYear);
      
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', currentMonthYear)
        .maybeSingle();

      if (error) {
        console.error("useMonthlyBalance: Error fetching monthly balance:", error);
        
        if (isMobile) {
          toast({
            title: "Error",
            description: "No se pudo cargar el balance mensual. Intentando de nuevo...",
            variant: "destructive"
          });
          
          // Auto-retry once on mobile devices after a short delay
          setTimeout(() => {
            fetchMonthlyBalance();
          }, 2000);
        }
        
        throw error;
      }

      console.log("useMonthlyBalance: Monthly balance data received:", data);
      console.log("useMonthlyBalance: Setting monthly balance state with:", {
        id: data?.id,
        balance: data?.balance,
        opex_amount: data?.opex_amount,
        itbm_amount: data?.itbm_amount,
        profit_percentage: data?.profit_percentage,
        tax_reserve_percentage: data?.tax_reserve_percentage,
        updated_at: data?.updated_at
      });
      
      setMonthlyBalance(data || null);
      return data || null;
    } catch (err: any) {
      console.error("useMonthlyBalance: Error fetching monthly balance:", err);
      setError(err.message || "Error al cargar el balance mensual");
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentMonthYear, toast, isMobile]);

  // Check if a balance exists for the current month
  const checkBalanceExists = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('id')
        .eq('month_year', currentMonthYear)
        .maybeSingle();

      if (error) {
        console.error("useMonthlyBalance: Error checking monthly balance:", error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error("useMonthlyBalance: Error in checkBalanceExists:", err);
      return false;
    }
  }, [currentMonthYear]);

  // Set or update the monthly balance including tax reserve percentage
  const updateMonthlyBalance = useCallback(async (
    balance: number, 
    opexAmount: number = 35,
    itbmAmount: number = 0, 
    profitPercentage: number = 1,
    taxReservePercentage: number = 5,
    notes?: string
  ) => {
    setLoading(true);
    setError(null);

    // OPTIMISTIC UPDATE: Immediately update local state
    const optimisticBalance = {
      id: monthlyBalance?.id || Date.now(), // Use existing ID or temp ID
      month_year: currentMonthYear,
      balance,
      opex_amount: opexAmount,
      itbm_amount: itbmAmount,
      profit_percentage: profitPercentage,
      tax_reserve_percentage: taxReservePercentage,
      notes: notes || null,
      created_at: monthlyBalance?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log("useMonthlyBalance: OPTIMISTIC UPDATE - Setting local state immediately:", optimisticBalance);
    setMonthlyBalance(optimisticBalance);

    try {
      console.log("useMonthlyBalance: Updating monthly balance with values:", {
        balance, opexAmount, itbmAmount, profitPercentage, taxReservePercentage, notes,
        currentMonthYear
      });
      
      const updateData: any = {
        balance,
        opex_amount: opexAmount,
        itbm_amount: itbmAmount,
        profit_percentage: profitPercentage,
        tax_reserve_percentage: taxReservePercentage,
        notes: notes || null,
      };
      
      // Check if we're updating or inserting
      const existsResult = await checkBalanceExists();
      console.log("useMonthlyBalance: Balance exists check:", existsResult);
      
      if (existsResult) {
        // Update existing record
        const { data, error } = await supabase
          .from('monthly_balances')
          .update(updateData)
          .eq('month_year', currentMonthYear)
          .select();

        if (error) {
          console.error("useMonthlyBalance: Error updating monthly balance:", error);
          // Revert optimistic update on error
          await fetchMonthlyBalance();
          throw error;
        }
        
        console.log("useMonthlyBalance: Monthly balance updated:", data);
        const updatedBalance = data[0] || null;
        setMonthlyBalance(updatedBalance);
        
        console.log("useMonthlyBalance: State updated with new balance:", {
          id: updatedBalance?.id,
          balance: updatedBalance?.balance,
          opex_amount: updatedBalance?.opex_amount,
          itbm_amount: updatedBalance?.itbm_amount,
          profit_percentage: updatedBalance?.profit_percentage,
          tax_reserve_percentage: updatedBalance?.tax_reserve_percentage,
          updated_at: updatedBalance?.updated_at
        });
        
        toast({
          title: "Balance actualizado",
          description: `Se actualizó el balance inicial de ${format(currentDate, 'MMMM yyyy')}`,
        });
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('monthly_balances')
          .insert({
            month_year: currentMonthYear,
            ...updateData,
          })
          .select();

        if (error) {
          console.error("useMonthlyBalance: Error creating monthly balance:", error);
          // Revert optimistic update on error
          await fetchMonthlyBalance();
          throw error;
        }
        
        console.log("useMonthlyBalance: New monthly balance created:", data);
        const newBalance = data[0] || null;
        setMonthlyBalance(newBalance);
        
        console.log("useMonthlyBalance: State updated with new balance:", {
          id: newBalance?.id,
          balance: newBalance?.balance,
          opex_amount: newBalance?.opex_amount,
          itbm_amount: newBalance?.itbm_amount,
          profit_percentage: newBalance?.profit_percentage,
          tax_reserve_percentage: newBalance?.tax_reserve_percentage,
          updated_at: newBalance?.updated_at
        });
        
        toast({
          title: "Balance creado",
          description: `Se creó el balance inicial de ${format(currentDate, 'MMMM yyyy')}`,
        });
      }
      
      return true;
    } catch (err: any) {
      console.error("useMonthlyBalance: Error updating monthly balance:", err);
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
  }, [checkBalanceExists, currentDate, currentMonthYear, toast, monthlyBalance, fetchMonthlyBalance]);

  // Fetch the balance when the current date changes
  useEffect(() => {
    if (currentDate && !isNaN(currentDate.getTime())) {
      console.log("useMonthlyBalance: Date changed, fetching balance for:", currentMonthYear);
      fetchMonthlyBalance();
    }
  }, [currentMonthYear, fetchMonthlyBalance, currentDate]);

  return {
    loading,
    error,
    monthlyBalance,
    updateMonthlyBalance,
    fetchMonthlyBalance,
    checkBalanceExists,
    currentMonthYear,
  };
};
