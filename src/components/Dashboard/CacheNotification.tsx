
import React from 'react';
import { RefreshCw, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CacheStats } from '@/types/cache';

interface CacheNotificationProps {
  usingCachedData: boolean;
  partialRefresh: boolean;
  cacheStats: CacheStats | null;
}

const CacheNotification: React.FC<CacheNotificationProps> = ({
  usingCachedData,
  partialRefresh,
  cacheStats
}) => {
  if (!usingCachedData && !partialRefresh) return null;
  
  return (
    <>
      {usingCachedData && !partialRefresh && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-2 text-sm mb-6">
          <p className="font-medium flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" /> 
            Usando datos en caché. Para datos completamente actualizados, use "Forzar actualización".
          </p>
        </div>
      )}

      {partialRefresh && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-2 text-sm mb-6">
          <p className="font-medium flex items-center">
            <Database className="h-4 w-4 mr-2" /> 
            Actualización parcial: se usó caché para datos existentes y se obtuvieron solo los datos nuevos.
            {cacheStats && (
              <Badge variant="outline" className="ml-2 bg-white border-green-200">
                {cacheStats.newCount} nuevas transacciones
              </Badge>
            )}
          </p>
        </div>
      )}
    </>
  );
};

export default CacheNotification;
