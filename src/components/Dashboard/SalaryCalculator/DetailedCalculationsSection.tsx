
import React from 'react';
import { Calculator, Percent } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from './calculationUtils';

interface DetailedCalculationsSectionProps {
  adjustedZohoIncome: number;
  profitFirstAmount: number;
  profitPercentage: number;
  taxReserveAmount: number;
  taxReservePercentage: number;
  remainingZohoIncome: number;
  halfStripeIncome: number;
  halfRemainingZoho: number;
  halfRemainingZohoWithItbm: number;
  itbmCoveragePercentage: number;
}

export const DetailedCalculationsSection: React.FC<DetailedCalculationsSectionProps> = ({
  adjustedZohoIncome,
  profitFirstAmount,
  profitPercentage,
  taxReserveAmount,
  taxReservePercentage,
  remainingZohoIncome,
  halfStripeIncome,
  halfRemainingZoho,
  halfRemainingZohoWithItbm,
  itbmCoveragePercentage
}) => {
  return (
    <>
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
          
          {/* Reserva para Taxes */}
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
              <p className="text-xs">Reserva para impuestos</p>
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

          {/* 50% de Zoho Restante + 7% para ITBM */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white p-3 rounded-md shadow-sm border border-purple-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">50% Zoho + {itbmCoveragePercentage}% (ITBM)</p>
                    <p className="font-medium text-purple-600">{formatCurrency(halfRemainingZohoWithItbm)}</p>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Percent className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-2">Incluye adicional para cubrir ITBM</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">50% del Zoho restante más 7% adicional para cubrir ITBM</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
};
