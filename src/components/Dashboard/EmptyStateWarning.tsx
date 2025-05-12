
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const EmptyStateWarning: React.FC = () => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
        <div>
          <p className="font-medium">No hay transacciones para el periodo seleccionado.</p>
          <p className="mt-1 text-sm">
            Hay datos disponibles en la respuesta del webhook pero no se están mostrando correctamente en la interfaz.
            Esto puede deberse a un problema en la transformación de los datos.
          </p>
          <div className="mt-3 pt-3 border-t border-yellow-200">
            <p className="text-sm font-medium">Consejos para resolver el problema:</p>
            <ul className="list-disc pl-5 text-sm mt-1">
              <li>Verifica la sección de depuración del Webhook donde puedes ver los datos crudos recibidos</li>
              <li>Revisa la pestaña "Data Summary" para confirmar si hay datos disponibles</li>
              <li>Prueba a usar el botón "Actualizar" con la opción de forzar actualización habilitada</li>
              <li>Si los datos aparecen en la sección de depuración pero no en la interfaz, puede haber un problema con la transformación</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyStateWarning;
