
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface WebhookErrorDisplayProps {
  error: string | null;
}

const WebhookErrorDisplay: React.FC<WebhookErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle>Error al recuperar datos</AlertTitle>
      <AlertDescription className="mt-1">
        <p className="text-sm">{error}</p>
        
        <div className="mt-3 text-xs">
          <p className="font-medium">Posibles soluciones:</p>
          <ul className="list-disc ml-4 mt-1 space-y-1">
            <li>Verificar la conexión a Internet</li>
            <li>Comprobar que el servicio de Make.com esté activo</li>
            <li>Revisar la configuración del webhook</li>
            <li>Intentar nuevamente en unos momentos</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default WebhookErrorDisplay;
