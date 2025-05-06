
import React from 'react';

interface WebhookDataSummaryProps {
  rawData: any;
}

const WebhookDataSummary: React.FC<WebhookDataSummaryProps> = ({ rawData }) => {
  if (!rawData) return null;
  
  // Count the number of items in each category
  const stripeAmount = rawData.stripe;
  const colaboradoresCount = Array.isArray(rawData.colaboradores) ? rawData.colaboradores.length : 0;
  const expensesCount = Array.isArray(rawData.expenses) ? rawData.expenses.length : 0;
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
        {expensesCount > 0 && <li>Gastos: {expensesCount} elementos</li>}
        {paymentsCount > 0 && <li>Ingresos: {paymentsCount} elementos</li>}
      </ul>
    </div>
  );
};

export default WebhookDataSummary;
