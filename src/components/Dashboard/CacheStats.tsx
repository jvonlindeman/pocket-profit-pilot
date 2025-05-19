
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Database, AlertCircle } from 'lucide-react';
import { useCacheSegments } from '@/hooks/cache/useCacheSegments';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface CacheStatsProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  cacheStatus: {
    zoho: { hit: boolean; partial: boolean };
    stripe: { hit: boolean; partial: boolean };
  };
  isUsingCache: boolean;
  onRefresh: () => void;
}

const CacheStats: React.FC<CacheStatsProps> = ({ 
  dateRange, 
  cacheStatus, 
  isUsingCache, 
  onRefresh 
}) => {
  const [loading, setLoading] = useState(false);
  const [localCacheStatus, setLocalCacheStatus] = useState(cacheStatus);
  const { refreshSourceCache } = useCacheSegments();

  // Store the cacheStatus in local state to prevent losing it during data fetching
  useEffect(() => {
    if (cacheStatus?.zoho?.hit || cacheStatus?.stripe?.hit) {
      setLocalCacheStatus(cacheStatus);
    }
  }, [cacheStatus]);

  // Handle loading state
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000); // Stop loading after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    
    try {
      // Attempt to refresh both sources
      const zohoRefreshed = await refreshSourceCache('Zoho', dateRange);
      const stripeRefreshed = await refreshSourceCache('Stripe', dateRange);
      
      if (zohoRefreshed && stripeRefreshed) {
        toast({
          title: "Caché actualizada",
          description: `Se ha actualizado la caché para el período ${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')}`,
        });
      } else {
        toast({
          title: "Actualización parcial",
          description: "Algunos datos de caché no pudieron actualizarse",
          variant: "warning"
        });
      }
      
      // Call parent refresh handler to reload data
      onRefresh();
    } catch (error) {
      console.error("Error refreshing cache:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la caché",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, refreshSourceCache, onRefresh]);

  const totalCacheProgress = useCallback(() => {
    let progress = 0;
    if (localCacheStatus?.zoho?.hit) progress += 50;
    if (localCacheStatus?.stripe?.hit) progress += 50;
    return progress;
  }, [localCacheStatus]);

  const getCacheStatusMessage = useCallback(() => {
    if (isUsingCache) {
      return "Datos cargados desde la caché";
    } else if (localCacheStatus?.zoho?.hit && localCacheStatus?.stripe?.hit) {
      return "Datos de Zoho y Stripe cargados desde la caché";
    } else if (localCacheStatus?.zoho?.hit) {
      return "Datos de Zoho cargados desde la caché";
    } else if (localCacheStatus?.stripe?.hit) {
      return "Datos de Stripe cargados desde la caché";
    } else {
      return "Cargando datos desde las APIs";
    }
  }, [isUsingCache, localCacheStatus]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Estado de la Caché
        </CardTitle>
        <CardDescription>Información sobre el uso de la caché de datos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Progreso de la caché:</p>
              <span className="text-sm text-muted-foreground">{totalCacheProgress()}%</span>
            </div>
            <Progress value={totalCacheProgress()} className="h-2" />
            <p className="text-sm text-muted-foreground flex items-center">
              {totalCacheProgress() < 100 ? (
                <AlertCircle className="mr-1 h-4 w-4 text-amber-500" />
              ) : (
                <Database className="mr-1 h-4 w-4 text-green-500" />
              )}
              {getCacheStatusMessage()}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 p-2 rounded">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Zoho</h4>
                <p className="text-sm font-medium">
                  {localCacheStatus?.zoho?.hit ? (
                    localCacheStatus.zoho.partial ? (
                      <span className="text-amber-500">Parcialmente en caché</span>
                    ) : (
                      <span className="text-green-500">Completo en caché</span>
                    )
                  ) : (
                    <span className="text-slate-500">No en caché</span>
                  )}
                </p>
              </div>
              
              <div className="bg-muted/50 p-2 rounded">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Stripe</h4>
                <p className="text-sm font-medium">
                  {localCacheStatus?.stripe?.hit ? (
                    localCacheStatus.stripe.partial ? (
                      <span className="text-amber-500">Parcialmente en caché</span>
                    ) : (
                      <span className="text-green-500">Completo en caché</span>
                    )
                  ) : (
                    <span className="text-slate-500">No en caché</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-muted-foreground">
              {isUsingCache ? (
                'Usando datos en caché para mayor velocidad'
              ) : (
                'Datos obtenidos directamente de las APIs'
              )}
            </p>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualizar caché
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheStats;
