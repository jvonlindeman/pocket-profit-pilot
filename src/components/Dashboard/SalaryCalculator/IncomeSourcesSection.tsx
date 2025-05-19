
import React from 'react';
import { DollarSign, ArrowUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from './calculationUtils';

interface IncomeSourcesSectionProps {
  stripeIncome: number;
  startingBalance: number;
  zohoIncome: number;
}

export const IncomeSourcesSection: React.FC<IncomeSourcesSectionProps> = ({
  stripeIncome,
  startingBalance,
  zohoIncome
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <h4 className="text-sm font-semibold text-blue-800 flex items-center">
        <DollarSign className="h-4 w-4 mr-1" />
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
  );
};
