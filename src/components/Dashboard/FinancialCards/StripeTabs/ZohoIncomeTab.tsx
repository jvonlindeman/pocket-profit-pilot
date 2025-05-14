
import React from 'react';
import { ArrowUpIcon, BriefcaseIcon, ReceiptIcon, DollarSignIcon } from 'lucide-react';
import SummaryCard from '../SummaryCard';

interface ZohoIncomeTabProps {
  regularIncome: number;
  formatCurrency: (amount: number) => string;
}

const ZohoIncomeTab: React.FC<ZohoIncomeTabProps> = ({
  regularIncome,
  formatCurrency
}) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard
          title="Ingresos Zoho"
          value={formatCurrency(regularIncome)}
          icon={ArrowUpIcon}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
        />
        
        {regularIncome > 0 ? (
          <SummaryCard
            title="Disponible para Pago"
            value={formatCurrency(regularIncome)}
            icon={DollarSignIcon}
            iconColor="text-blue-500"
            iconBgColor="bg-blue-50"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4">
            <div className="text-center">
              <ReceiptIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay datos de ingresos disponibles en Zoho para el período seleccionado.</p>
              <p className="text-xs text-gray-400 mt-1">Intenta seleccionar un período diferente o verificar la conexión con Zoho.</p>
            </div>
          </div>
        )}
      </div>
      
      {regularIncome > 0 && (
        <div className="mt-4">
          <div className="bg-white p-3 rounded-md border border-blue-100">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <BriefcaseIcon className="h-4 w-4 mr-1.5 text-blue-500" />
              Resumen de Ingresos Zoho
            </h3>
            <ul className="mt-2 space-y-1.5">
              <li className="flex justify-between text-sm">
                <span className="text-gray-600">Total de ingresos:</span>
                <span className="font-medium">{formatCurrency(regularIncome)}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-gray-600">Transacciones facturadas:</span>
                <span className="font-medium">vía Zoho Books</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZohoIncomeTab;
