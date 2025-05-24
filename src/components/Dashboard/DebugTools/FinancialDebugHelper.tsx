
import React from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { ApiStatusIndicator } from './ApiStatusIndicator';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFinancialData } from '@/hooks/queries/useFinancialData';

export default function FinancialDebugHelper() {
  const { dateRange } = useFinanceData();
  const { toast } = useToast();
  
  // Only enable queries if we have a valid date range
  const enabled = !!dateRange?.startDate && !!dateRange?.endDate;
  
  const { 
    refreshData, 
    loading,
    apiConnectivity,
    cacheStatus
  } = useFinancialData(
    dateRange?.startDate || new Date(), 
    dateRange?.endDate || new Date()
  );
  
  const handleDebugRefresh = async () => {
    try {
      toast({
        title: "Actualizando datos para depuración",
        description: "Obteniendo la última información..."
      });
      
      const success = await refreshData(true);
      
      if (success) {
        toast({
          title: "Datos actualizados",
          description: "Los datos han sido refrescados correctamente",
          variant: "success"
        });
      } else {
        toast({
          title: "Error al actualizar",
          description: "No se pudieron actualizar todos los datos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al actualizar los datos",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="mt-4 flex justify-between items-center p-2 bg-gray-50 rounded-md border border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">APIs:</span>
        <ApiStatusIndicator />
      </div>
      
      <div className="flex items-center gap-2">
        {cacheStatus && (
          <div className="text-xs text-gray-500">
            Cache: {cacheStatus.zoho?.cached ? '✓' : '✗'} Zoho / {cacheStatus.stripe?.cached ? '✓' : '✗'} Stripe
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleDebugRefresh}
          disabled={loading}
          className="text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
