
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const WebhookConfigAlert = () => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error de configuración del webhook</AlertTitle>
      <AlertDescription>
        La URL del webhook de Make.com no está configurada. 
        Por favor configura la variable de entorno <code>MAKE_WEBHOOK_URL</code> en 
        las funciones Edge de Supabase.
      </AlertDescription>
    </Alert>
  );
};

export default WebhookConfigAlert;
