
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Info } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CacheStats } from '@/types/cache';

interface CacheStatusDisplayProps {
  usingCachedData: boolean;
  partialRefresh: boolean;
  cacheStats: CacheStats | null;
  lastRefresh: Date | null;
  onRefreshClick: () => void;
  isRefreshing: boolean;
  refreshCount: number;
}

export const CacheStatusDisplay: React.FC<CacheStatusDisplayProps> = ({
  usingCachedData,
  partialRefresh,
  cacheStats,
  lastRefresh,
  onRefreshClick,
  isRefreshing,
  refreshCount
}) => {
  const hasCacheInfo = usingCachedData || lastRefresh || (cacheStats && Object.keys(cacheStats).length > 0);
  
  // Calculate time since last refresh
  const lastRefreshTime = lastRefresh 
    ? formatDistanceToNow(new Date(lastRefresh), { addSuffix: true, locale: es }) 
    : "Nunca";
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center">
            Estado del Caché
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-1 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Información sobre el estado de los datos en caché y cuándo se actualizaron por última vez.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center" 
            onClick={onRefreshClick}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refrescando...' : 'Refrescar'}
          </Button>
        </CardTitle>
        <CardDescription className="text-xs">
          Última actualización: {lastRefreshTime}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {hasCacheInfo ? (
          <div className="text-xs space-y-1">
            {usingCachedData && (
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm">
                  Datos en caché
                </span>
                {partialRefresh && (
                  <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm">
                    Refresco parcial
                  </span>
                )}
              </div>
            )}
            
            {cacheStats && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-gray-600">
                {cacheStats.cachedCount > 0 && (
                  <div>Transacciones en caché: {cacheStats.cachedCount}</div>
                )}
                {cacheStats.newCount > 0 && (
                  <div>Nuevas transacciones: {cacheStats.newCount}</div>
                )}
                {typeof refreshCount === 'number' && (
                  <div>Refrescos en esta sesión: {refreshCount}</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500">No hay información de caché disponible.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default CacheStatusDisplay;
