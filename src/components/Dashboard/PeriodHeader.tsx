
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RefreshCw, Database, Cloud, ChevronDown } from 'lucide-react';
import ApiCallsTracker from './ApiCallsTracker';

interface PeriodHeaderProps {
  periodTitle: string;
  onRefresh: (forceRefresh?: boolean) => void;
  hasCachedData?: boolean;
  usingCachedData?: boolean;
  isRefreshing?: boolean;
  cacheStatus?: {
    zoho: { hit: boolean; partial: boolean };
    stripe: { hit: boolean; partial: boolean };
  };
}

const PeriodHeader: React.FC<PeriodHeaderProps> = ({ 
  periodTitle, 
  onRefresh, 
  hasCachedData = false,
  usingCachedData = false,
  isRefreshing = false,
  cacheStatus
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const lastRefreshRef = useRef<number>(0);
  const requestIdRef = useRef<string>('');

  // Generate unique request ID and prevent duplicate calls
  const generateRequestId = () => `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleCacheRefresh = () => {
    const now = Date.now();
    // Debounce: prevent calls within 1 second
    if (now - lastRefreshRef.current < 1000) {
      console.log('🚫 PeriodHeader: Cache refresh blocked - too soon after last call');
      return;
    }
    
    const requestId = generateRequestId();
    requestIdRef.current = requestId;
    lastRefreshRef.current = now;
    
    console.log(`🔄 PeriodHeader: Cache refresh initiated [${requestId}]`);
    onRefresh(false); // Use cache if available
    setIsDropdownOpen(false);
  };

  const handleFreshRefresh = () => {
    const now = Date.now();
    // Debounce: prevent calls within 2 seconds for fresh data (more expensive)
    if (now - lastRefreshRef.current < 2000) {
      console.log('🚫 PeriodHeader: Fresh refresh blocked - too soon after last call');
      return;
    }
    
    const requestId = generateRequestId();
    requestIdRef.current = requestId;
    lastRefreshRef.current = now;
    
    console.log(`🔄 PeriodHeader: Fresh refresh initiated [${requestId}] - Force API call`);
    onRefresh(true); // Force fresh data from API
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-700">
          Periodo: <span className="text-gray-900">{periodTitle}</span>
        </h2>
        <ApiCallsTracker />
        {usingCachedData && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            Cache
          </span>
        )}
        {cacheStatus && (
          <div className="flex gap-1">
            {cacheStatus.zoho.hit && (
              <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                Z
              </span>
            )}
            {cacheStatus.stripe.hit && (
              <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                S
              </span>
            )}
          </div>
        )}
      </div>
      
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isRefreshing}>
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Cloud className="h-4 w-4 mr-2" />
            )}
            Llamar API
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCacheRefresh} className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Usar Cache</span>
              <span className="text-xs text-muted-foreground">
                {hasCachedData ? 'Datos disponibles' : 'Sin datos en cache'}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFreshRefresh} className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Datos Frescos</span>
              <span className="text-xs text-muted-foreground">
                Llamar directamente a la API
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PeriodHeader;
