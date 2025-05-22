
import React from 'react';

const WebhookTroubleshootingGuide = () => {
  return (
    <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded text-sm text-gray-600">
      <h3 className="font-medium text-gray-700">Solucionar problemas de webhook</h3>
      <ul className="list-disc pl-5 mt-1 space-y-1">
        <li>Verifica que la variable de entorno <code>MAKE_WEBHOOK_URL</code> esté configurada en la función Edge</li>
        <li>Confirma que el webhook de Make.com esté funcionando correctamente</li>
        <li>Comprueba que hay datos en Zoho Books para el período seleccionado</li>
        <li>Revisa la lista de exclusiones en el procesador de Zoho</li>
      </ul>
    </div>
  );
};

export default WebhookTroubleshootingGuide;
