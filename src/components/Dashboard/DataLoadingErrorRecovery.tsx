
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface DataLoadingErrorRecoveryProps {
  hasErrors: boolean;
  errorCount: number;
  lastError: Error | null;
  onReset: () => void;
  isRefreshing: boolean;
}

const DataLoadingErrorRecovery: React.FC<DataLoadingErrorRecoveryProps> = ({
  hasErrors,
  errorCount,
  lastError,
  onReset,
  isRefreshing
}) => {
  if (!hasErrors) return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error al cargar datos financieros</AlertTitle>
      <AlertDescription>
        <div className="text-sm mt-2">
          <p>Se {errorCount === 1 ? 'ha producido un error' : `han producido ${errorCount} errores consecutivos`} al cargar los datos financieros.</p>
          {lastError && (
            <p className="mt-1 text-xs opacity-80">Último error: {lastError.message}</p>
          )}
          <div className="mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
              disabled={isRefreshing}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Restablecer estado del sistema
            </Button>
            <p className="mt-2 text-xs opacity-80">
              Esto restablecerá todos los contadores de error y estados de actualización.
            </p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default DataLoadingErrorRecovery;
