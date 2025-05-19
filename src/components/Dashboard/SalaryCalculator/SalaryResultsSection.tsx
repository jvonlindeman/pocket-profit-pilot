
import React from 'react';
import { formatCurrency } from './calculationUtils';

interface SalaryResultsSectionProps {
  salary: number;
  salaryWithItbmCoverage: number;
  itbmCoverageAmount: number;
  itbmCoveragePercentage: number;
}

export const SalaryResultsSection: React.FC<SalaryResultsSectionProps> = ({
  salary,
  salaryWithItbmCoverage,
  itbmCoverageAmount,
  itbmCoveragePercentage
}) => {
  return (
    <div className="mt-6 space-y-4">
      {/* Salario base */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-100">Fórmula del cálculo estándar:</p>
            <p className="font-medium">50% de Stripe + 50% de Zoho Restante = Salario</p>
          </div>
          <div className="text-xl font-bold">
            {formatCurrency(salary)}
          </div>
        </div>
      </div>
      
      {/* Salario con ajuste ITBM */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-100">Con ajuste para ITBM ({itbmCoveragePercentage}%):</p>
            <p className="font-medium">50% de Stripe + 50% de Zoho Restante + {itbmCoveragePercentage}% ITBM</p>
          </div>
          <div className="text-xl font-bold">
            {formatCurrency(salaryWithItbmCoverage)}
          </div>
        </div>
      </div>
      
      {/* Diferencia */}
      <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">ITBM Adicional a Facturar</p>
            <p className="text-sm text-gray-700">(Diferencia para cubrir el ITBM)</p>
          </div>
          <div className="text-lg font-bold text-purple-600">
            {formatCurrency(itbmCoverageAmount)}
          </div>
        </div>
      </div>
    </div>
  );
};
