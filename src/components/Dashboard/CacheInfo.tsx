import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";

export interface CacheInfoProps {
  dateRange: { startDate: Date; endDate: Date };
  cacheStatus: {
    zoho: { hit: boolean, partial: boolean },
    stripe: { hit: boolean, partial: boolean }
  };
  isUsingCache: boolean;
  onRefresh: () => void;
}

const CacheInfo: React.FC<CacheInfoProps> = ({ 
  dateRange, 
  cacheStatus, 
  isUsingCache, 
  onRefresh 
}) => {
  if (!isUsingCache && !cacheStatus.zoho.hit && !cacheStatus.stripe.hit) {
    return null; // No cache info to display
  }
  
  return (
    <div className="rounded-md border p-4 bg-amber-50 border-amber-200 text-amber-700">
      <div className="flex items-center space-x-2">
        <RefreshCw className="h-4 w-4" />
        <p className="text-sm font-medium">
          {isUsingCache ? 'Datos en caché' : 'Datos actualizados'}
        </p>
      </div>
      <p className="text-xs mt-1">
        {cacheStatus.zoho.hit && (
          <span>
            Zoho:{' '}
            {cacheStatus.zoho.partial
              ? 'Parcialmente en caché'
              : `En caché hasta ${formatDateYYYYMMDD(dateRange.endDate)}`}
            <br />
          </span>
        )}
        {cacheStatus.stripe.hit && (
          <span>
            Stripe:{' '}
            {cacheStatus.stripe.partial
              ? 'Parcialmente en caché'
              : `En caché hasta ${formatDateYYYYMMDD(dateRange.endDate)}`}
          </span>
        )}
      </p>
      {!isUsingCache && (
        <Button variant="link" size="sm" className="mt-2" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar caché
        </Button>
      )}
    </div>
  );
};

export default CacheInfo;
