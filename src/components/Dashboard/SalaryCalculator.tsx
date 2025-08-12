import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, DollarSign, ArrowDown, ArrowUp, Percent, Info, ToggleLeft, ToggleRight, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import BankReconciliation from './BankReconciliation';

interface SalaryCalculatorProps {
  zohoIncome: number;
  stripeIncome: number;
  opexAmount: number;
  itbmAmount: number;
  profitPercentage: number;
  taxReservePercentage: number;
  stripeSavingsPercentage: number;
  includeZohoFiftyPercent: boolean;
  startingBalance?: number;
  totalZohoExpenses?: number;
  onConfigureClick?: () => void;
}

const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({ 
  zohoIncome,
  stripeIncome,
  opexAmount,
  itbmAmount,
  profitPercentage,
  taxReservePercentage,
  stripeSavingsPercentage,
  includeZohoFiftyPercent,
  startingBalance = 0,
  totalZohoExpenses = 0,
  onConfigureClick
}) => {
  // Enhanced debugging to track value changes and detect updates
  useEffect(() => {
    console.log("💰 SalaryCalculator: Props updated - IMMEDIATE CALCULATION:", {
      zohoIncome,
      stripeIncome,
      opexAmount,
      itbmAmount,
      profitPercentage,
      taxReservePercentage,
      includeZohoFiftyPercent,
      startingBalance,
      totalZohoExpenses,
      timestamp: new Date().toISOString(),
      note: "Calculator re-rendered with new values"
    });
  }, [zohoIncome, stripeIncome, opexAmount, itbmAmount, profitPercentage, taxReservePercentage, includeZohoFiftyPercent, startingBalance, totalZohoExpenses]);

  // CORRECTED CALCULATION: Restore proper expense deduction to reflect real bank balance
  // Starting balance + new income - current month expenses = actual money in bank
  const adjustedZohoIncome = (startingBalance || 0) + zohoIncome - totalZohoExpenses;
  const profitFirstAmount = (adjustedZohoIncome * profitPercentage) / 100;
  const taxReserveAmount = (adjustedZohoIncome * taxReservePercentage) / 100;
  const totalZohoDeductions = opexAmount + itbmAmount + profitFirstAmount + taxReserveAmount;
  const remainingZohoIncome = adjustedZohoIncome - totalZohoDeductions;
  
  // Calculate Stripe savings
  const stripeSavingsAmount = (stripeIncome * stripeSavingsPercentage) / 100;
  const stripeAfterSavings = stripeIncome - stripeSavingsAmount;
  const halfStripeIncome = stripeAfterSavings / 2;
  const halfRemainingZoho = remainingZohoIncome / 2;
  
  // Calculate salary based on toggle
  const salary = includeZohoFiftyPercent 
    ? halfStripeIncome + halfRemainingZoho  // Include both
    : halfStripeIncome;                     // Only Stripe
  
  // Debug calculation results with CORRECTED formula
  console.log("SalaryCalculator: CORRECTED Calculation results:", {
    startingBalance,
    zohoIncome,
    totalZohoExpenses,
    adjustedZohoIncome_CORRECTED: adjustedZohoIncome,
    explanation: "startingBalance + zohoIncome - totalZohoExpenses = real bank balance",
    profitFirstAmount,
    taxReserveAmount,
    totalZohoDeductions,
    remainingZohoIncome,
    halfStripeIncome,
    halfRemainingZoho,
    includeZohoFiftyPercent,
    salary,
    profitPercentageUsed: profitPercentage,
    taxReservePercentageUsed: taxReservePercentage
  });
  
  // Formato para valores monetarios
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
      <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 pb-4">
          <CardTitle className="flex items-center text-white">
            <Calculator className="h-6 w-6 mr-2" />
            Calculadora de Salario
            <span className="ml-2 text-xs opacity-75">
              (Profit: {profitPercentage}% | Tax Reserve: {taxReservePercentage}% | Stripe Savings: {stripeSavingsPercentage}%)
            </span>
            <div className="ml-auto flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {includeZohoFiftyPercent ? (
                  <ToggleRight className="h-5 w-5 text-green-300" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-red-300" />
                )}
                <span className="text-xs">
                  50% Zoho: {includeZohoFiftyPercent ? "Incluido" : "Excluido"}
                </span>
              </div>
              {onConfigureClick && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onConfigureClick}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Configurar balance inicial, OPEX, ITBM y porcentajes</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Sección de resumen principal - Visible primero */}
          <div className="p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
              <div className="w-full">
                <div className={`text-center p-5 rounded-lg shadow-md ${
                  includeZohoFiftyPercent 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                    : 'bg-gradient-to-br from-orange-500 to-red-600'
                }`}>
                  <h3 className="text-sm font-medium text-white mb-1">Salario Calculado</h3>
                  <div className="flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white mr-1" />
                    <span className="text-3xl font-bold text-white">{formatCurrency(salary)}</span>
                  </div>
                  <p className="text-xs text-white/80 mt-1">
                    {includeZohoFiftyPercent 
                      ? "50% Stripe + 50% Zoho Restante" 
                      : "Solo 50% Stripe"}
                  </p>
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
                          {stripeSavingsPercentage > 0 && (
                            <p className="text-xs text-amber-600">Ahorros: -{formatCurrency(stripeSavingsAmount)} ({stripeSavingsPercentage}%)</p>
                          )}
                        </div>
                        <div className="bg-green-100 p-2 rounded-full">
                          <ArrowUp className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Ingresos totales de Stripe
                        {stripeSavingsPercentage > 0 && (
                          <><br />Ahorros ({stripeSavingsPercentage}%): {formatCurrency(stripeSavingsAmount)}</>
                        )}
                      </p>
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
                      <p className="text-xs">Dinero dejado en el banco al final del mes anterior</p>
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
                      <p className="text-xs">Ingresos nuevos registrados en Zoho para este mes</p>
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

                  {/* Current month expenses note - UPDATED */}
                  <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                    <p className="text-xs text-blue-700">
                      <strong>Gastos del mes actual:</strong> {formatCurrency(totalZohoExpenses)} ya descontados del balance para reflejar el dinero real disponible en el banco.
                    </p>
                  </div>
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
                {/* Fondos Disponibles Zoho - UPDATED explanation */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-blue-700">Dinero Real en Banco (Zoho)</p>
                          <p className="font-medium text-blue-800">{formatCurrency(adjustedZohoIncome)}</p>
                        </div>
                        <div className="bg-blue-200 p-2 rounded-full">
                          <Calculator className="h-4 w-4 text-blue-700" />
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">Balance Inicial + Ingresos - Gastos del Mes</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Dinero real disponible en el banco después de gastos del mes actual. Fórmula: Balance Inicial + Ingresos Zoho - Gastos del Mes.</p>
                  </TooltipContent>
                </Tooltip>

                <BankReconciliation
                  startingBalance={startingBalance}
                  zohoIncome={zohoIncome}
                  totalZohoExpenses={totalZohoExpenses}
                  adjustedZohoIncome={adjustedZohoIncome}
                  onEditInitialBalance={onConfigureClick}
                />

                {/* Profit First - Now shows dynamic percentage */}
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
                    <p className="text-xs">Reserva para reinversión en el negocio ({profitPercentage}%)</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Reserva para Taxes - Now shows dynamic percentage */}
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
                    <p className="text-xs">Reserva configurable para impuestos ({taxReservePercentage}%)</p>
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
                    <p className="text-xs">Dinero real de Zoho después de todas las deducciones</p>
                  </TooltipContent>
                </Tooltip>

                {/* Stripe Savings */}
                {stripeSavingsPercentage > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-amber-50 p-3 rounded-md shadow-sm border border-amber-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-amber-700">Ahorros Stripe ({stripeSavingsPercentage}%)</p>
                            <p className="font-medium text-amber-600">- {formatCurrency(stripeSavingsAmount)}</p>
                          </div>
                          <div className="bg-amber-200 p-2 rounded-full">
                            <ArrowDown className="h-4 w-4 text-amber-600" />
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Porcentaje de Stripe ahorrado ({stripeSavingsPercentage}%)</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* 50% de Stripe (después de ahorros) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white p-3 rounded-md shadow-sm border border-blue-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">50% de Stripe{stripeSavingsPercentage > 0 ? ' (después de ahorros)' : ''}</p>
                          <p className="font-medium text-blue-600">{formatCurrency(halfStripeIncome)}</p>
                          {stripeSavingsPercentage > 0 && (
                            <p className="text-xs text-gray-500">De {formatCurrency(stripeAfterSavings)} disponible</p>
                          )}
                        </div>
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Percent className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Mitad de los ingresos de Stripe
                      {stripeSavingsPercentage > 0 && (
                        <><br />Después de deducir ahorros de {formatCurrency(stripeSavingsAmount)}</>
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* 50% de Zoho Restante - Now shows if it's included or not */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`bg-white p-3 rounded-md shadow-sm border ${
                      includeZohoFiftyPercent ? 'border-blue-100' : 'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`text-xs ${includeZohoFiftyPercent ? 'text-gray-500' : 'text-gray-400'}`}>
                            50% de Zoho Restante
                          </p>
                          <p className={`font-medium ${
                            includeZohoFiftyPercent ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {includeZohoFiftyPercent ? formatCurrency(halfRemainingZoho) : formatCurrency(0)}
                          </p>
                        </div>
                        <div className={`p-2 rounded-full ${
                          includeZohoFiftyPercent ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {includeZohoFiftyPercent ? (
                            <Percent className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      {!includeZohoFiftyPercent && (
                        <p className="text-xs text-red-500 mt-1">Excluido del cálculo</p>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {includeZohoFiftyPercent 
                        ? "Mitad del ingreso restante de Zoho (incluido en salario)"
                        : "Mitad del ingreso restante de Zoho (excluido del salario)"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Resultado final del cálculo con explicación actualizada */}
            <div className="mt-6">
              <div className={`p-4 rounded-lg text-white ${
                includeZohoFiftyPercent 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                  : 'bg-gradient-to-r from-orange-600 to-red-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/80">Fórmula del cálculo:</p>
                    <p className="font-medium">
                      {includeZohoFiftyPercent 
                        ? "50% de Stripe + 50% de Zoho Restante = Salario"
                        : "50% de Stripe = Salario (Zoho excluido)"}
                    </p>
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
  );
};

export default SalaryCalculator;
