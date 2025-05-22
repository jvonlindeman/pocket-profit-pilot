
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface WebhookDebugHeaderProps {
  loading: boolean;
  onFetchData: () => void;
}

const WebhookDebugHeader: React.FC<WebhookDebugHeaderProps> = ({ loading, onFetchData }) => {
  const isMobile = useIsMobile();
  
  return (
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
  );
};

export default WebhookDebugHeader;
