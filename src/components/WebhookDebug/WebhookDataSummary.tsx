
import React from 'react';

interface WebhookDataSummaryProps {
  rawData: any;
}

const WebhookDataSummary: React.FC<WebhookDataSummaryProps> = ({ rawData }) => {
  if (!rawData) return null;
  
  // Handle string responses
  if (typeof rawData === 'string') {
    return (
      <div className="mb-4 p-2 bg-amber-50 border border-amber-100 rounded">
        <p className="text-sm text-amber-800 font-medium">Respuesta sin estructura</p>
        <p className="text-xs text-amber-700 mt-1">
          La respuesta del webhook es una cadena de texto sin formato estructurado.
        </p>
      </div>
    );
  }
  
  // Handle raw_response property
  if (rawData.raw_response && typeof rawData.raw_response === 'string' && 
      (!rawData.stripe && !rawData.colaboradores && !rawData.expenses && !rawData.payments)) {
    return (
      <div className="mb-4 p-2 bg-amber-50 border border-amber-100 rounded">
        <p className="text-sm text-amber-800 font-medium">Respuesta sin estructura procesable</p>
        <p className="text-xs text-amber-700 mt-1">
          La respuesta del webhook contiene datos sin procesar que no siguen el formato esperado.
        </p>
      </div>
    );
  }
  
  // Handle error response
  if (rawData.error) {
    return (
      <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded">
        <p className="text-sm text-red-800 font-medium">Error en la respuesta</p>
        <p className="text-xs text-red-700 mt-1">
          {rawData.error}
          {rawData.details && (
            <span className="block mt-1">Detalles: {rawData.details}</span>
          )}
        </p>
      </div>
    );
  }
  
  // Count the number of items in each category
  const stripeAmount = rawData.stripe;
  const colaboradoresCount = Array.isArray(rawData.colaboradores) ? rawData.colaboradores.length : 0;
  const expensesCount = Array.isArray(rawData.expenses) ? rawData.expenses.length : 0;
  const taxExpensesCount = Array.isArray(rawData.expenses) 
    ? rawData.expenses.filter((exp: any) => exp.account_name === "Impuestos").length 
    : 0;
  const paymentsCount = Array.isArray(rawData.payments) ? rawData.payments.length : 0;
  
  return (
    <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
      <p className="text-sm text-blue-800 font-medium">Resumen de la Estructura</p>
      <p className="text-xs text-blue-700 mt-1">
        Respuesta de Webhook con {colaboradoresCount + expensesCount + paymentsCount} elementos y Stripe.
      </p>
      <ul className="text-xs text-blue-700 mt-1 list-disc pl-5">
        {stripeAmount && <li>Stripe: {stripeAmount}</li>}
        {colaboradoresCount > 0 && <li>Colaboradores: {colaboradoresCount} elementos</li>}
        {expensesCount > 0 && (
          <li>
            Gastos: {expensesCount} elementos
            {taxExpensesCount > 0 && (
              <span className="text-xs text-gray-600 italic"> 
                (incluye {taxExpensesCount} de Impuestos que se excluyen de los cálculos)
              </span>
            )}
          </li>
        )}
        {paymentsCount > 0 && <li>Ingresos: {paymentsCount} elementos</li>}
      </ul>
    </div>
  );
};

export default WebhookDataSummary;
