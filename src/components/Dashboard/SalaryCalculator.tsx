
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, DollarSign } from 'lucide-react';

interface SalaryCalculatorProps {
  zohoIncome: number;
  stripeIncome: number;
  opexAmount: number;
  itbmAmount: number;
  profitPercentage: number;
}

const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({ 
  zohoIncome,
  stripeIncome,
  opexAmount,
  itbmAmount,
  profitPercentage
}) => {
  // Calculate Profit First amount (percentage of Zoho income)
  const profitFirstAmount = (zohoIncome * profitPercentage) / 100;
  
  // Calculate tax reserve amount (5% of Zoho income)
  const taxReservePercentage = 5;
  const taxReserveAmount = (zohoIncome * taxReservePercentage) / 100;
  
  // Calculate half of Stripe income
  const halfStripeIncome = stripeIncome / 2;
  
  // Calculate salary using the updated formula including tax reserve
  // (Zoho income - OPEX - ITBM - Profit First - Tax Reserve + Stripe income/2) / 2
  const availableForSalary = zohoIncome - opexAmount - itbmAmount - profitFirstAmount - taxReserveAmount + halfStripeIncome;
  const salary = availableForSalary / 2;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card className="bg-blue-50 border border-blue-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-blue-700">
          <Calculator className="h-5 w-5 mr-2" />
          Calculadora de Salario
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Ingresos Zoho</h3>
              <div className="text-lg font-bold text-green-600">{formatCurrency(zohoIncome)}</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">OPEX</h3>
              <div className="text-lg font-bold text-amber-600">- {formatCurrency(opexAmount)}</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">ITBM</h3>
              <div className="text-lg font-bold text-amber-600">- {formatCurrency(itbmAmount)}</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Profit First ({profitPercentage}%)</h3>
              <div className="text-lg font-bold text-amber-600">- {formatCurrency(profitFirstAmount)}</div>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Reserva para Taxes ({taxReservePercentage}%)</h3>
              <div className="text-lg font-bold text-amber-600">- {formatCurrency(taxReserveAmount)}</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Stripe (50%)</h3>
              <div className="text-lg font-bold text-green-600">{formatCurrency(halfStripeIncome)}</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Disponible para Salario</h3>
              <div className="text-lg font-bold text-blue-600">{formatCurrency(availableForSalary)}</div>
            </div>
            
            <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Salario (50% del disponible)</h3>
              <div className="text-xl font-bold text-blue-800">{formatCurrency(salary)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalaryCalculator;
