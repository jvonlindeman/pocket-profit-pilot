
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Database } from 'lucide-react';
import { Button } from '../ui/button';
import CacheMonitor from './CacheMonitor';
import { useCacheContext } from '@/contexts/CacheContext';

interface CacheStatsProps {
  dateRange: { startDate: Date; endDate: Date };
  onRefresh: () => void;
}

const CacheStats: React.FC<CacheStatsProps> = ({ 
  dateRange, 
  onRefresh 
}) => {
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const { status: cacheStatus, isUsingCache } = useCacheContext();
  
  // Check if using cache from either source
  const hasZohoCache = cacheStatus?.zoho?.hit || false;
  const hasStripeCache = cacheStatus?.stripe?.hit || false;
  const usingCache = isUsingCache || hasZohoCache || hasStripeCache;
  
  // Check partial cache usage
  const partialCache = (cacheStatus?.zoho?.partial || cacheStatus?.stripe?.partial) || false;
  
  // Format date range for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-US', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };
  
  // Get formatted date range
  const formattedRange = `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
  
  // Enhanced cache status text
  const getCacheStatusText = () => {
    if (!usingCache) {
      return "No se está utilizando caché";
    }
    
    if (hasZohoCache && hasStripeCache) {
      return partialCache ? 
        "Usando caché parcial (Zoho & Stripe)" : 
        "Usando caché completa (Zoho & Stripe)";
    }
    
    if (hasZohoCache) {
      return partialCache ? 
        "Usando caché parcial (solo Zoho)" : 
        "Usando caché (solo Zoho)";
    }
    
    if (hasStripeCache) {
      return partialCache ? 
        "Usando caché parcial (solo Stripe)" : 
        "Usando caché (solo Stripe)";
    }
    
    return "Estado de caché indeterminado";
  };
  
  // Cache status color 
  const getCacheStatusColor = () => {
    if (!usingCache) return "text-gray-500";
    return partialCache ? "text-amber-500" : "text-green-500";
  };

  // Cache status icon
  const getCacheStatusIcon = () => {
    if (!usingCache) return <RefreshCw className="h-4 w-4 text-gray-500" />;
    return partialCache ? 
      <AlertTriangle className="h-4 w-4 text-amber-500" /> : 
      <CheckCircle className="h-4 w-4 text-green-500" />;
  };
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Rango:</span>
          <span className="text-sm text-gray-500">{formattedRange}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {getCacheStatusIcon()}
          <span className={`text-sm ${getCacheStatusColor()}`}>{getCacheStatusText()}</span>
          {usingCache && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs" 
              onClick={onRefresh}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refrescar
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-6 px-2 text-xs ml-2 flex items-center"
            onClick={() => setShowDebug(!showDebug)}
          >
            <Database className="h-3 w-3 mr-1" />
            {showDebug ? 'Hide Debug' : 'Debug'}
          </Button>
        </div>
      </div>
      
      {showDebug && <CacheMonitor />}
    </div>
  );
};

export default CacheStats;
