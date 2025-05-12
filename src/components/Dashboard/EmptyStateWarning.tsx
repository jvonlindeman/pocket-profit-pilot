
import React from 'react';

const EmptyStateWarning: React.FC = () => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
      <p className="font-medium">No hay transacciones para el periodo seleccionado.</p>
      <p className="mt-1 text-sm">Intenta seleccionar un periodo diferente o verificar la configuración de Zoho Books.</p>
    </div>
  );
};

export default EmptyStateWarning;
