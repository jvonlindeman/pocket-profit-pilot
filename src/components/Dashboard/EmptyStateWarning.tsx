
import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface EmptyStateWarningProps {
  rawResponse?: any;
}

const EmptyStateWarning: React.FC<EmptyStateWarningProps> = ({ rawResponse }) => {
  // Try to determine if we have raw data that isn't being transformed properly
  const hasRawData = rawResponse && 
    (rawResponse.stripe || 
    (rawResponse.colaboradores && rawResponse.colaboradores.length) || 
    (rawResponse.expenses && rawResponse.expenses.length) || 
    (rawResponse.payments && rawResponse.payments.length));

  // Check if we have cached_transactions data that isn't being displayed
  const hasCachedTransactions = rawResponse && 
    rawResponse.cached_transactions && 
    Array.isArray(rawResponse.cached_transactions) && 
    rawResponse.cached_transactions.length > 0;

  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
        <div>
          <p className="font-medium">No hay transacciones para el periodo seleccionado.</p>
          <p className="mt-1 text-sm">
            {hasRawData 
              ? "Hay datos disponibles en la respuesta del webhook pero no se están mostrando correctamente en la interfaz. Esto puede deberse a un problema en la transformación de los datos."
              : "No se encontraron transacciones para el periodo seleccionado. Intente seleccionar un rango de fechas diferente o verificar la conexión con Zoho Books."}
          </p>
          
          {hasCachedTransactions && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700 text-sm">
              <div className="flex items-start">
                <Info className="h-4 w-4 mr-1 mt-0.5" />
                <div>
                  <p className="font-medium">Datos transformados disponibles</p>
                  <p className="text-xs mt-1">
                    Se encontraron {rawResponse.cached_transactions.length} transacciones en el formato correcto, pero no están siendo mostradas. 
                    Esto puede indicar un problema de renderizado o de actualización de estado.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-yellow-200">
            <p className="text-sm font-medium">Consejos para resolver el problema:</p>
            <ul className="list-disc pl-5 text-sm mt-1">
              <li>Intenta usar el botón "Actualizar" para obtener datos frescos del API</li>
              <li>Verifica la sección de depuración del Webhook donde puedes ver los datos crudos recibidos</li>
              <li>Revisa la pestaña "Data Summary" para confirmar si hay datos disponibles</li>
              {hasRawData && <li>Si los datos aparecen en la sección de depuración pero no en la interfaz, puede haber un problema con la transformación</li>}
              <li>Asegúrate de que las fechas seleccionadas contienen datos en Zoho Books</li>
              <li>Revisa la consola del navegador para buscar errores específicos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyStateWarning;
