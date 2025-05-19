
import React from 'react';
import { formatCurrency } from './calculationUtils';

interface SalaryResultsSectionProps {
  salary: number;
  salaryWithItbmCoverage: number;
  itbmCoverageAmount: number;
  itbmCoveragePercentage: number;
  leftColumnAmount: number;
  rightColumnAmount: number;
  itbmRowAmount: number;
}

export const SalaryResultsSection: React.FC<SalaryResultsSectionProps> = ({
  salary,
  salaryWithItbmCoverage,
  itbmCoverageAmount,
  itbmCoveragePercentage,
  leftColumnAmount,
  rightColumnAmount,
  itbmRowAmount
}) => {
  return (
    <div className="mt-6 space-y-4">
      {/* Columnar display format based on the provided Google Sheets example */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-1/2 p-3 bg-gray-100 border-b text-center font-medium">50%</th>
              <th className="w-1/2 p-3 bg-gray-100 border-b text-center font-medium">50%</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border-r">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">$</span>
                  <span className="font-medium">{leftColumnAmount.toFixed(2)}</span>
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">$</span>
                  <span className="font-medium">{rightColumnAmount.toFixed(2)}</span>
                </div>
              </td>
            </tr>
            <tr className="bg-blue-50">
              <td className="p-3 border-r">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">$</span>
                  <span className="font-medium">{itbmRowAmount.toFixed(2)}</span>
                </div>
              </td>
              <td className="p-3"></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Salario con ajuste ITBM */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-100">Con ajuste para ITBM ({itbmCoveragePercentage}%):</p>
            <p className="font-medium">50% de Zoho Restante + 50% de Zoho Restante + {itbmCoveragePercentage}% ITBM</p>
          </div>
          <div className="text-xl font-bold">
            {formatCurrency(salaryWithItbmCoverage)}
          </div>
        </div>
      </div>
    </div>
  );
};
