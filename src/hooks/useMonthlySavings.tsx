import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MonthlySavings } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';

export const useMonthlySavings = () => {
  const [savings, setSavings] = useState<MonthlySavings[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);
  const { toast } = useToast();

  const fetchSavings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_savings')
        .select('*')
        .order('deposit_date', { ascending: false });

      if (error) throw error;

      setSavings(data || []);
      
      // Calculate total savings
      const total = (data || []).reduce((sum, item) => sum + Number(item.amount), 0);
      setTotalSavings(total);
    } catch (error: any) {
      console.error('Error fetching savings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los ahorros',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createSaving = async (saving: Omit<MonthlySavings, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('monthly_savings')
        .insert([saving])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Ahorro guardado',
        description: 'El ahorro mensual ha sido registrado exitosamente',
      });

      await fetchSavings();
      return data;
    } catch (error: any) {
      console.error('Error creating saving:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el ahorro',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSaving = async (id: string, updates: Partial<MonthlySavings>) => {
    try {
      const { error } = await supabase
        .from('monthly_savings')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Ahorro actualizado',
        description: 'El ahorro ha sido actualizado exitosamente',
      });

      await fetchSavings();
      return true;
    } catch (error: any) {
      console.error('Error updating saving:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el ahorro',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteSaving = async (id: string) => {
    try {
      const { error } = await supabase
        .from('monthly_savings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Ahorro eliminado',
        description: 'El ahorro ha sido eliminado exitosamente',
      });

      await fetchSavings();
      return true;
    } catch (error: any) {
      console.error('Error deleting saving:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el ahorro',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  return {
    savings,
    loading,
    totalSavings,
    fetchSavings,
    createSaving,
    updateSaving,
    deleteSaving,
  };
};
