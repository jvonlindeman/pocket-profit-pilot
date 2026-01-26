import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ApiCallsTracker from './ApiCallsTracker';

interface PeriodHeaderProps {
  periodTitle: string;
  onRefresh: (forceRefresh?: boolean) => void;
  isRefreshing?: boolean;
}

const PeriodHeader: React.FC<PeriodHeaderProps> = ({ 
  periodTitle, 
  onRefresh, 
  isRefreshing = false
}) => {
  const lastRefreshRef = useRef<number>(0);

  const handleRefresh = () => {
    const now = Date.now();
    // Debounce: prevent calls within 2 seconds
    if (now - lastRefreshRef.current < 2000) {
      console.log('🚫 PeriodHeader: Refresh blocked - too soon after last call');
      return;
    }
    
    lastRefreshRef.current = now;
    console.log('🔄 PeriodHeader: Refresh initiated');
    onRefresh(true); // Always fetch fresh data
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-700">
          Periodo: <span className="text-gray-900">{periodTitle}</span>
        </h2>
        <ApiCallsTracker />
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Actualizando...' : 'Actualizar Datos'}
      </Button>
    </div>
  );
};

export default PeriodHeader;
