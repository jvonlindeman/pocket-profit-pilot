
import React from 'react';
import { RefreshCw, RotateCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string;
  handleRefresh: () => void;
  handleForceRefresh?: () => void;
  handleClearCacheAndRefresh?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  handleRefresh,
  handleForceRefresh,
  handleClearCacheAndRefresh
}) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
      <p>{error}</p>
      <div className="flex gap-2 mt-3">
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
        </Button>
        {handleForceRefresh && (
          <Button variant="outline" onClick={handleForceRefresh}>
            <RotateCw className="h-4 w-4 mr-2" /> Forzar actualización
          </Button>
        )}
        {handleClearCacheAndRefresh && (
          <Button variant="outline" onClick={handleClearCacheAndRefresh}>
            <Trash2 className="h-4 w-4 mr-2" /> Limpiar caché y actualizar
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
