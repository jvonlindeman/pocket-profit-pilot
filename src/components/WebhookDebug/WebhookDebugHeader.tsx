
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WebhookDebugHeaderProps {
  loading: boolean;
  onFetchData: () => void;
  configError?: boolean;
}

const WebhookDebugHeader: React.FC<WebhookDebugHeaderProps> = ({ 
  loading, 
  onFetchData, 
  configError = false
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={isMobile ? 'space-y-3' : ''}>
      <div className={`${isMobile ? 'flex-col space-y-3' : 'flex justify-between items-center'} mb-4`}>
        <p className="text-sm text-muted-foreground">
          Esta herramienta te permite ver la respuesta sin procesar del webhook de make.com
        </p>
        <Button 
          onClick={onFetchData} 
          variant="outline" 
          disabled={loading}
          size={isMobile ? "sm" : "default"}
          className={isMobile ? "w-full" : ""}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cargando...</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-2" /> Cargar Datos</>
          )}
        </Button>
      </div>
      
      {configError && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Se detectó un problema con la configuración del webhook. Verifica que la variable de entorno 
            <code className="mx-1 px-1 py-0.5 bg-amber-100 rounded">MAKE_WEBHOOK_URL</code>
            esté configurada en las funciones Edge de Supabase.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default WebhookDebugHeader;
