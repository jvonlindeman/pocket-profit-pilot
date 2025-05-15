
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, DollarSign } from 'lucide-react';

interface SalaryCalculatorProps {
  zohoIncome: number;
  stripeIncome: number;
  opexAmount: number;
  itbmAmount: number;
  profitPercentage: number;
  startingBalance?: number; // Added starting balance
  totalZohoExpenses?: number; // Added total Zoho expenses
}

const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({ 
  zohoIncome,
  stripeIncome,
  opexAmount,
  itbmAmount,
  profitPercentage,
  startingBalance = 0, // Default to 0 if not provided
  totalZohoExpenses = 0 // Default to 0 if not provided
}) => {
  // Calculate adjusted Zoho income (initial balance + Zoho income - total Zoho expenses)
  const adjustedZohoIncome = (startingBalance || 0) + zohoIncome - totalZohoExpenses;
  
  // Calculate Profit First amount (percentage of adjusted Zoho income)
  const profitFirstAmount = (adjustedZohoIncome * profitPercentage) / 100;
  
  // Calculate tax reserve amount (5% of adjusted Zoho income)
  const taxReservePercentage = 5;
  const taxReserveAmount = (adjustedZohoIncome * taxReservePercentage) / 100;
  
  // Calculate total deductions from Zoho income
  const totalZohoDeductions = opexAmount + itbmAmount + profitFirstAmount + taxReserveAmount;
  
  // Calculate remaining Zoho income after all deductions
  const remainingZohoIncome = adjustedZohoIncome - totalZohoDeductions;
  
  // Calculate half of Stripe income and half of remaining Zoho income
  const halfStripeIncome = stripeIncome / 2;
  const halfRemainingZoho = remainingZohoIncome / 2;
  
  // Calculate salary using the corrected formula: 50% of Stripe income + 50% of remaining Zoho income
  const salary = halfStripeIncome + halfRemainingZoho;
  
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
              <h3 className="text-sm font-medium text-gray-500 mb-1">Balance Inicial</h3>
              <div className="text-lg font-bold text-green-600">{formatCurrency(startingBalance)}</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Ingresos Zoho</h3>
              <div className="text-lg font-bold text-green-600">{formatCurrency(zohoIncome)}</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Gastos Totales Zoho</h3>
              <div className="text-lg font-bold text-amber-600">- {formatCurrency(totalZohoExpenses)}</div>
            </div>
            
            <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Ajuste Ingresos Zoho</h3>
              <div className="text-lg font-bold text-blue-700">{formatCurrency(adjustedZohoIncome)}</div>
              <div className="text-xs text-blue-600 mt-1">Balance Inicial + Ingresos Zoho - Gastos Totales Zoho</div>
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
            
            <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Zoho Restante</h3>
              <div className="text-lg font-bold text-blue-700">{formatCurrency(remainingZohoIncome)}</div>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">50% de Zoho Restante</h3>
              <div className="text-lg font-bold text-blue-600">{formatCurrency(halfRemainingZoho)}</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Stripe (Total)</h3>
              <div className="text-lg font-bold text-green-600">{formatCurrency(stripeIncome)}</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">50% de Stripe</h3>
              <div className="text-lg font-bold text-blue-600">{formatCurrency(halfStripeIncome)}</div>
            </div>
            
            <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Salario (50% Stripe + 50% Zoho Restante)</h3>
              <div className="text-xl font-bold text-blue-800">{formatCurrency(salary)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalaryCalculator;
