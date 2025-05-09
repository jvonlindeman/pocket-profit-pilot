
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface WebhookDebugHeaderProps {
  loading: boolean;
  onFetchData: () => void;
}

const WebhookDebugHeader: React.FC<WebhookDebugHeaderProps> = ({ loading, onFetchData }) => {
  // Use a direct function call without wrapping it in another function
  const handleClick = () => {
    console.log("WebhookDebugHeader: Fetch data button clicked");
    onFetchData();
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <p className="text-sm text-muted-foreground">
        Esta herramienta te permite ver la respuesta sin procesar del webhook de make.com
      </p>
      <Button 
        onClick={handleClick} 
        variant="outline" 
        disabled={loading}
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
