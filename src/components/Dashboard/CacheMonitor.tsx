import React, { useCallback } from 'react';
import { useCache } from '@/contexts/CacheContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CacheEfficiencyDashboard from './CacheEfficiencyDashboard';

interface CacheMonitorProps {
  dateRange?: { startDate: Date; endDate: Date };
  onRefresh?: () => void;
}

const CacheMonitor = ({ dateRange, onRefresh }: CacheMonitorProps) => {
  const { isCacheEnabled, toggleCache, forceCacheRefresh, cacheStats, isLoading } = useCache();
  
  const handleRefresh = useCallback(() => {
    forceCacheRefresh();
    if (onRefresh) onRefresh();
  }, [forceCacheRefresh, onRefresh]);
  
  if (!cacheStats) return null;

  return (
    <div className="space-y-4">
      {/* New Efficiency Dashboard */}
      {dateRange && (
        <CacheEfficiencyDashboard dateRange={dateRange} />
      )}
      
      {/* Existing Cache Monitor */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Estado de la caché</h3>
            
            {isCacheEnabled ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Activada
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Desactivada
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleCache}
                  >
                    {isCacheEnabled ? (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Desactivar caché
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-1" />
                        Activar caché
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isCacheEnabled 
                    ? "Desactiva la caché para obtener datos frescos en cada consulta" 
                    : "Activa la caché para mejorar el rendimiento"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar datos
            </Button>
          </div>
        </div>
        
        {cacheStats && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-gray-500">Transacciones en caché</p>
              <p className="font-semibold">{cacheStats.transactionCount || 0}</p>
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-gray-500">Tasa de aciertos</p>
              <p className="font-semibold">{cacheStats.hitRate || '0%'}</p>
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-gray-500">Aciertos</p>
              <p className="font-semibold">{cacheStats.hits || 0}</p>
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-gray-500">Fallos</p>
              <p className="font-semibold">{cacheStats.misses || 0}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CacheMonitor;
