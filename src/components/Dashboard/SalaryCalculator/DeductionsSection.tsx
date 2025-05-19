
import React from 'react';
import { ArrowDown, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from './calculationUtils';

interface DeductionsSectionProps {
  totalZohoExpenses: number;
  opexAmount: number;
  itbmAmount: number;
}

export const DeductionsSection: React.FC<DeductionsSectionProps> = ({
  totalZohoExpenses,
  opexAmount,
  itbmAmount
}) => {
  return (
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
  );
};
