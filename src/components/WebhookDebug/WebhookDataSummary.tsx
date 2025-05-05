
import React from 'react';

interface WebhookDataSummaryProps {
  rawData: any;
}

const WebhookDataSummary: React.FC<WebhookDataSummaryProps> = ({ rawData }) => {
  if (!rawData) return null;
  
  return (
    <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
      <p className="text-sm text-blue-800 font-medium">Resumen de la Estructura</p>
      <p className="text-xs text-blue-700 mt-1">
        {Array.isArray(rawData) 
          ? `Array con ${rawData.length} elementos. Los elementos con vendor_name son gastos, el array al final contiene ingresos.` 
          : 'Los datos no están en el formato esperado (array)'}
      </p>
    </div>
  );
};

export default WebhookDataSummary;
