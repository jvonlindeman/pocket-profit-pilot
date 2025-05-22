
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const WebhookDataWarning = () => {
  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Datos incompletos o vacíos</AlertTitle>
      <AlertDescription>
        El webhook está conectado pero devuelve datos incompletos o vacíos. 
        Posibles causas:
        <ul className="list-disc pl-5 mt-2">
          <li>No hay transacciones en el período seleccionado</li>
          <li>El webhook de Make.com está mal configurado</li>
          <li>Los datos están siendo filtrados por la configuración de exclusiones</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export default WebhookDataWarning;
