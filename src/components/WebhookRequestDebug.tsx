
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug } from 'lucide-react';

interface WebhookRequestDebugProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export default function WebhookRequestDebug({ dateRange }: WebhookRequestDebugProps) {
  // Format dates exactly as they are sent to the webhook
  const startDateFormatted = dateRange.startDate.toISOString().split('T')[0];
  const endDateFormatted = dateRange.endDate.toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-orange-500" />
          Depuración de Solicitud al Webhook
        </CardTitle>
        <CardDescription>
          Datos exactos enviados al webhook make.com
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-4">
          <h3 className="font-medium text-blue-800 mb-2">Parámetros de la solicitud:</h3>
          <pre className="bg-white border border-blue-100 p-3 rounded text-sm overflow-auto">
{`{
  "startDate": "${startDateFormatted}",
  "endDate": "${endDateFormatted}",
  "forceRefresh": true
}`}
          </pre>
          
          <div className="mt-4">
            <h3 className="font-medium text-blue-800 mb-2">URL de la solicitud:</h3>
            <code className="bg-white border border-blue-100 p-2 rounded text-sm block">
              POST: https://hook.us2.make.com/1iyetupimuaxn4au7gyf9kqnpihlmx22
            </code>
          </div>
          
          <div className="mt-4 text-sm text-blue-700">
            <p className="mb-1">
              <strong>Nota importante:</strong> Los formatos de fecha enviados son exactamente como se muestran arriba (YYYY-MM-DD).
            </p>
            <p>
              Si hay alguna discrepancia entre las fechas seleccionadas en la UI y las fechas recibidas por el webhook,
              el problema podría estar en la manipulación de fechas por parte del webhook o en la conversión de zonas horarias.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-md p-4">
          <h3 className="font-medium text-amber-800 mb-2">Proceso de fechas:</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-amber-700">
            <li>
              <strong>UI DatePicker</strong> → Selección: {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
            </li>
            <li>
              <strong>useFinanceData hook</strong> → Conversión a formato ISO: {dateRange.startDate.toISOString()} - {dateRange.endDate.toISOString()}
            </li>
            <li>
              <strong>apiClient.ts</strong> → Extracción de fecha YYYY-MM-DD: {startDateFormatted} - {endDateFormatted}
            </li>
            <li>
              <strong>zoho-transactions Edge Function</strong> → Envío exacto al webhook: {startDateFormatted} - {endDateFormatted}
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
