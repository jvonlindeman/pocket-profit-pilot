
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyBalance } from '@/types/financial';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
    return format(date, 'yyyy-MM');
  };

  // Get the current month-year string
  const currentMonthYear = formatMonthYear(currentDate);

  // Fetch the monthly balance for the given date
  const fetchMonthlyBalance = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', currentMonthYear)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }

      setMonthlyBalance(data || null);
      return data || null;
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
  const updateMonthlyBalance = async (balance: number, notes?: string, stripeOverride?: number | null) => {
    setLoading(true);
    setError(null);

    try {
      // Check if we're updating or inserting
      if (monthlyBalance) {
        // Update existing record
        const { data, error } = await supabase
          .from('monthly_balances')
          .update({
            balance,
            notes: notes || monthlyBalance.notes,
            stripe_override: stripeOverride !== undefined ? stripeOverride : monthlyBalance.stripe_override
          })
          .eq('month_year', currentMonthYear)
          .select();

        if (error) throw error;
        setMonthlyBalance(data[0] || null);
        
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
            balance,
            notes: notes || null,
            stripe_override: stripeOverride
          })
          .select();

        if (error) throw error;
        setMonthlyBalance(data[0] || null);
        
        toast({
          title: "Balance creado",
          description: `Se creó el balance inicial de ${format(currentDate, 'MMMM yyyy')}`,
        });
      }
      
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

  // Specifically update the Stripe override value
  const updateStripeOverride = async (stripeOverride: number | null) => {
    if (!monthlyBalance) {
      // If no monthly balance exists yet, create one with default balance and the stripe override
      return updateMonthlyBalance(0, null, stripeOverride);
    }
    
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('monthly_balances')
        .update({
          stripe_override: stripeOverride
        })
        .eq('month_year', currentMonthYear)
        .select();

      if (error) throw error;
      setMonthlyBalance(data[0] || null);
      
      toast({
        title: "Valor de Stripe actualizado",
        description: `Se actualizó el valor manual de Stripe para ${format(currentDate, 'MMMM yyyy')}`,
      });
      
      return true;
    } catch (err: any) {
      console.error("Error updating Stripe override:", err);
      setError(err.message || "Error al actualizar el valor manual de Stripe");
      
      toast({
        title: "Error",
        description: "No se pudo actualizar el valor manual de Stripe",
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
    updateStripeOverride,
    fetchMonthlyBalance,
    checkBalanceExists,
    currentMonthYear,
  };
};
