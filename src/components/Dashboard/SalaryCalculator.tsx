import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, DollarSign, ArrowDown, ArrowUp, Percent, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SalaryCalculatorProps {
  zohoIncome: number;
  stripeIncome: number;
  opexAmount: number;
  itbmAmount: number;
  profitPercentage: number;
  taxReservePercentage: number; // Now configurable instead of hardcoded
  startingBalance?: number;
  totalZohoExpenses?: number;
}

const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({ 
  zohoIncome,
  stripeIncome,
  opexAmount,
  itbmAmount,
  profitPercentage,
  taxReservePercentage, // Use the configurable value
  startingBalance = 0,
  totalZohoExpenses = 0
}) => {
  // Cálculos
  const adjustedZohoIncome = (startingBalance || 0) + zohoIncome - totalZohoExpenses;
  const profitFirstAmount = (adjustedZohoIncome * profitPercentage) / 100;
  const taxReserveAmount = (adjustedZohoIncome * taxReservePercentage) / 100; // Use configurable percentage
  const totalZohoDeductions = opexAmount + itbmAmount + profitFirstAmount + taxReserveAmount;
  const remainingZohoIncome = adjustedZohoIncome - totalZohoDeductions;
  const halfStripeIncome = stripeIncome / 2;
  const halfRemainingZoho = remainingZohoIncome / 2;
  const salary = halfStripeIncome + halfRemainingZoho;
  
  // Formato para valores monetarios
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <TooltipProvider>
      <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 pb-4">
          <CardTitle className="flex items-center text-white">
            <Calculator className="h-6 w-6 mr-2" />
            Calculadora de Salario
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Sección de resumen principal - Visible primero */}
          <div className="p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
              <div className="w-full">
                <div className="text-center p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                  <h3 className="text-sm font-medium text-blue-100 mb-1">Salario Calculado</h3>
                  <div className="flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white mr-1" />
                    <span className="text-3xl font-bold text-white">{formatCurrency(salary)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <h4 className="text-sm font-semibold text-blue-800 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  Fuentes de Ingresos
                </h4>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Ingresos de Stripe */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-white rounded-md p-3 shadow-sm border border-blue-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">Stripe (Total)</p>
                          <p className="font-medium text-green-600">{formatCurrency(stripeIncome)}</p>
                        </div>
                        <div className="bg-green-100 p-2 rounded-full">
                          <ArrowUp className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Ingresos totales de Stripe</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Balance Inicial */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-white rounded-md p-3 shadow-sm border border-blue-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">Balance Inicial</p>
                          <p className="font-medium text-blue-600">{formatCurrency(startingBalance)}</p>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-full">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Balance inicial del periodo</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Ingresos Zoho */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-white rounded-md p-3 shadow-sm border border-blue-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">Ingresos Zoho</p>
                          <p className="font-medium text-green-600">{formatCurrency(zohoIncome)}</p>
                        </div>
                        <div className="bg-green-100 p-2 rounded-full">
                          <ArrowUp className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Ingresos registrados en Zoho</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h4 className="text-sm font-semibold text-red-800 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  Deducciones y Gastos
                </h4>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Gastos Zoho */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-white rounded-md p-3 shadow-sm border border-red-50 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">Gastos Zoho</p>
                          <p className="font-medium text-red-600">- {formatCurrency(totalZohoExpenses)}</p>
                        </div>
                        <div className="bg-red-50 p-2 rounded-full">
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Total de gastos registrados en Zoho</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* OPEX */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-white rounded-md p-3 shadow-sm border border-red-50 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">OPEX</p>
                          <p className="font-medium text-red-600">- {formatCurrency(opexAmount)}</p>
                        </div>
                        <div className="bg-red-50 p-2 rounded-full">
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Gastos operativos</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* ITBM */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-white rounded-md p-3 shadow-sm border border-red-50 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">ITBM</p>
                          <p className="font-medium text-red-600">- {formatCurrency(itbmAmount)}</p>
                        </div>
                        <div className="bg-red-50 p-2 rounded-full">
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Impuesto sobre la transferencia de bienes muebles</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección de cálculos detallados */}
          <div className="p-6 border-t border-blue-100">
            <h4 className="text-sm font-semibold text-blue-800 mb-4 flex items-center">
              <Calculator className="h-4 w-4 mr-1" />
              Cálculos Detallados
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Ajuste Ingresos Zoho */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-blue-700">Ajuste Ingresos Zoho</p>
                          <p className="font-medium text-blue-800">{formatCurrency(adjustedZohoIncome)}</p>
                        </div>
                        <div className="bg-blue-200 p-2 rounded-full">
                          <Calculator className="h-4 w-4 text-blue-700" />
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">Balance Inicial + Ingresos Zoho - Gastos Totales Zoho</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Ingresos de Zoho ajustados después de considerar el balance inicial y los gastos</p>
                  </TooltipContent>
                </Tooltip>

                {/* Profit First */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white p-3 rounded-md shadow-sm border border-amber-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">Profit First ({profitPercentage}%)</p>
                          <p className="font-medium text-amber-600">- {formatCurrency(profitFirstAmount)}</p>
                        </div>
                        <div className="bg-amber-100 p-2 rounded-full">
                          <Percent className="h-4 w-4 text-amber-600" />
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Reserva para reinversión en el negocio</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Reserva para Taxes - Now shows configurable percentage */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white p-3 rounded-md shadow-sm border border-amber-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">Reserva para Taxes ({taxReservePercentage}%)</p>
                          <p className="font-medium text-amber-600">- {formatCurrency(taxReserveAmount)}</p>
                        </div>
                        <div className="bg-amber-100 p-2 rounded-full">
                          <Percent className="h-4 w-4 text-amber-600" />
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Reserva configurable para impuestos</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="space-y-4">
                {/* Zoho Restante */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-blue-700">Zoho Restante</p>
                          <p className="font-medium text-blue-800">{formatCurrency(remainingZohoIncome)}</p>
                        </div>
                        <div className="bg-blue-200 p-2 rounded-full">
                          <Calculator className="h-4 w-4 text-blue-700" />
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Ingreso de Zoho después de todas las deducciones</p>
                  </TooltipContent>
                </Tooltip>

                {/* 50% de Stripe */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white p-3 rounded-md shadow-sm border border-blue-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">50% de Stripe</p>
                          <p className="font-medium text-blue-600">{formatCurrency(halfStripeIncome)}</p>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Percent className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Mitad de los ingresos de Stripe</p>
                  </TooltipContent>
                </Tooltip>

                {/* 50% de Zoho Restante */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white p-3 rounded-md shadow-sm border border-blue-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">50% de Zoho Restante</p>
                          <p className="font-medium text-blue-600">{formatCurrency(halfRemainingZoho)}</p>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Percent className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Mitad del ingreso restante de Zoho</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Resultado final del cálculo con explicación */}
            <div className="mt-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-100">Fórmula del cálculo:</p>
                    <p className="font-medium">50% de Stripe + 50% de Zoho Restante = Salario</p>
                  </div>
                  <div className="text-xl font-bold">
                    {formatCurrency(salary)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default SalaryCalculator;
