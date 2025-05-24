
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseDebugComponentProps {
  componentName: string;
  refreshFunction?: (forceRefresh: boolean) => Promise<boolean> | void;
  dateRange: { startDate: Date; endDate: Date };
}

export function useDebugComponent({ 
  componentName, 
  refreshFunction,
  dateRange 
}: UseDebugComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  const handleRefresh = useCallback(async () => {
    if (loading || !refreshFunction) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Display toast notification
      toast({
        title: `Refrescando datos de ${componentName}`,
        description: `Periodo: ${dateRange.startDate.toLocaleDateString()} a ${dateRange.endDate.toLocaleDateString()}`,
      });
      
      // Use the provided refresh function
      await refreshFunction(true);
      
      // Update last refreshed timestamp
      setLastRefreshed(new Date());
      
      // Success toast
      toast({
        title: `Datos de ${componentName} actualizados`,
        description: `Última actualización: ${new Date().toLocaleTimeString()}`,
        variant: "success",
      });
    } catch (err: any) {
      console.error(`Error refreshing ${componentName} data:`, err);
      setError(err.message || `Error desconocido al obtener datos de ${componentName}`);
      
      // Error toast
      toast({
        title: `Error al cargar datos de ${componentName}`,
        description: err.message || "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [componentName, dateRange, loading, refreshFunction]);

  return {
    loading,
    error,
    lastRefreshed,
    handleRefresh
  };
}
