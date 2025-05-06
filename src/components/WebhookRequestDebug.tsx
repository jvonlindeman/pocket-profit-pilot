
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
  
  // Additional formatting for debugging
  const startDateLocal = dateRange.startDate.toLocaleDateString();
  const endDateLocal = dateRange.endDate.toLocaleDateString();
  const startDateISOFull = dateRange.startDate.toISOString();
  const endDateISOFull = dateRange.endDate.toISOString();
  const startDateUTC = dateRange.startDate.toUTCString();
  const endDateUTC = dateRange.endDate.toUTCString();

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
              <strong>UI DatePicker</strong> → Selección: {startDateLocal} - {endDateLocal}
            </li>
            <li>
              <strong>useFinanceData hook</strong> → Conversión a formato ISO: {startDateISOFull} - {endDateISOFull}
            </li>
            <li>
              <strong>apiClient.ts</strong> → Extracción de fecha YYYY-MM-DD: {startDateFormatted} - {endDateFormatted}
            </li>
            <li>
              <strong>zoho-transactions Edge Function</strong> → Envío exacto al webhook: {startDateFormatted} - {endDateFormatted}
            </li>
          </ol>
        </div>
        
        <div className="bg-green-50 border border-green-100 rounded-md p-4 mt-4">
          <h3 className="font-medium text-green-800 mb-2">Información detallada de fechas:</h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-green-100">
                <th className="p-2 text-left">Formato</th>
                <th className="p-2 text-left">Fecha inicial</th>
                <th className="p-2 text-left">Fecha final</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 font-medium">Date object (toString)</td>
                <td className="p-2">{dateRange.startDate.toString()}</td>
                <td className="p-2">{dateRange.endDate.toString()}</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">getTime() (timestamp)</td>
                <td className="p-2">{dateRange.startDate.getTime()}</td>
                <td className="p-2">{dateRange.endDate.getTime()}</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">toLocaleDateString()</td>
                <td className="p-2">{startDateLocal}</td>
                <td className="p-2">{endDateLocal}</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">toISOString() (completo)</td>
                <td className="p-2">{startDateISOFull}</td>
                <td className="p-2">{endDateISOFull}</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">toISOString().split('T')[0]</td>
                <td className="p-2">{startDateFormatted}</td>
                <td className="p-2">{endDateFormatted}</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">toUTCString()</td>
                <td className="p-2">{startDateUTC}</td>
                <td className="p-2">{endDateUTC}</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Día del mes</td>
                <td className="p-2">{dateRange.startDate.getDate()}</td>
                <td className="p-2">{dateRange.endDate.getDate()}</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Mes (0-11)</td>
                <td className="p-2">{dateRange.startDate.getMonth()}</td>
                <td className="p-2">{dateRange.endDate.getMonth()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
