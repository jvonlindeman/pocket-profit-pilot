
import React from 'react';

interface WebhookFormattedDataProps {
  rawData: any;
}

const WebhookFormattedData = ({ rawData }: WebhookFormattedDataProps) => {
  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
      <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
        <p className="text-sm text-blue-800 font-medium">Resumen de la Estructura</p>
        <p className="text-xs text-blue-700 mt-1">
          {Array.isArray(rawData) 
            ? `Array con ${rawData.length} elementos` 
            : 'Objecto con estructura de datos de webhook'}
        </p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left border-b">Clave</th>
            <th className="p-2 text-left border-b">Valor</th>
          </tr>
        </thead>
        <tbody>
          {typeof rawData === 'object' && rawData !== null ? (
            Object.entries(rawData).map(([key, value]) => (
              <tr key={key}>
                <td className="p-2 border-b font-medium">{key}</td>
                <td className="p-2 border-b">
                  {typeof value === 'object' 
                    ? `${Array.isArray(value) ? 'Array' : 'Object'} con ${Array.isArray(value) ? value.length : Object.keys(value).length} elementos`
                    : String(value)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} className="p-2 border-b">
                {String(rawData)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WebhookFormattedData;
