
import React from 'react';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from './calculationUtils';

interface SalarySummaryCardProps {
  salaryWithItbmCoverage: number;
}

export const SalarySummaryCard: React.FC<SalarySummaryCardProps> = ({ salaryWithItbmCoverage }) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
      <div className="w-full">
        <div className="text-center p-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-purple-100 mb-1">Salario Calculado (Con ITBM)</h3>
          <div className="flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-white mr-1" />
            <span className="text-3xl font-bold text-white">{formatCurrency(salaryWithItbmCoverage)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
