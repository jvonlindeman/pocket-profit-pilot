
import React from 'react';

const EmptyStateWarning: React.FC = () => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
      <p className="font-medium">No hay transacciones para el periodo seleccionado.</p>
      <p className="mt-1 text-sm">
        Intenta seleccionar un periodo diferente o verificar la configuración de Zoho Books.
        Si ves datos en la sección de depuración pero no aparecen aquí, podría haber un problema con la transformación de datos.
      </p>
      <div className="mt-3 pt-3 border-t border-yellow-200">
        <p className="text-sm font-medium">Consejos para resolver el problema:</p>
        <ul className="list-disc pl-5 text-sm mt-1">
          <li>Revisa la sección de depuración de Webhook para confirmar si hay datos disponibles</li>
          <li>Si hay datos en la depuración, verifica si aparece el Stripe override manual</li>
          <li>Prueba refrescar los datos usando el botón "Actualizar"</li>
        </ul>
      </div>
    </div>
  );
};

export default EmptyStateWarning;
