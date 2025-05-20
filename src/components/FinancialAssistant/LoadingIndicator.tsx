
import React from 'react';
import { RefreshCcwIcon, Database, Clock } from 'lucide-react';

interface LoadingIndicatorProps {
  isCached?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ isCached = false }) => {
  return (
    <div className="flex flex-col items-center my-4">
      <div className="flex items-center space-x-2">
        {isCached ? (
          <Database className="h-5 w-5 text-blue-500" />
        ) : (
          <RefreshCcwIcon className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
        <span className="text-sm text-muted-foreground">
          {isCached ? 'Usando datos en caché...' : 'Cargando datos...'}
        </span>
      </div>
      {isCached && (
        <div className="flex items-center mt-2 text-xs text-blue-500">
          <Clock className="h-3 w-3 mr-1" />
          <span>Acceso rápido activado</span>
        </div>
      )}
    </div>
  );
};
