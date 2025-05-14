import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import * as ZohoService from '@/services/zohoService';

interface CacheInfoProps {
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

const CacheInfo: React.FC<CacheInfoProps> = ({ dateRange, cacheStatus, isUsingCache, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000); // Stop loading after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleRefresh = () => {
    setLoading(true);
    onRefresh();
  };

  const totalCacheProgress = () => {
    let progress = 0;
    if (cacheStatus.zoho.hit) progress += 50;
    if (cacheStatus.stripe.hit) progress += 50;
    return progress;
  };

  const getCacheStatusMessage = () => {
    if (isUsingCache) {
      return "Datos cargados desde la caché";
    } else if (cacheStatus.zoho.hit && cacheStatus.stripe.hit) {
      return "Datos de Zoho y Stripe cargados desde la caché";
    } else if (cacheStatus.zoho.hit) {
      return "Datos de Zoho cargados desde la caché";
    } else if (cacheStatus.stripe.hit) {
      return "Datos de Stripe cargados desde la caché";
    } else {
      return "Cargando datos desde las APIs";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de la Caché</CardTitle>
        <CardDescription>Información sobre el uso de la caché de datos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">Progreso de la caché:</p>
            <Progress value={totalCacheProgress()} />
            <p className="text-sm text-muted-foreground">
              {getCacheStatusMessage()}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Última actualización: {isUsingCache ? 'Reciente' : 'En este momento'}
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

export default CacheInfo;
