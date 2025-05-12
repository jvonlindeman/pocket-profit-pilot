
import React from 'react';
import { Bug, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';

interface DebugInformationProps {
  financialData: any;
  stripeIncome: number;
  stripeOverride: any;
  regularIncome: number;
  handleClearCacheAndRefresh?: () => void;
}

const DebugInformation: React.FC<DebugInformationProps> = ({
  financialData,
  stripeIncome,
  stripeOverride,
  regularIncome,
  handleClearCacheAndRefresh
}) => {
  return (
    <Alert variant="default" className="bg-amber-50 border-amber-200 mb-6">
      <Bug className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-700">Información de depuración</AlertTitle>
      <AlertDescription className="text-amber-700">
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="bg-white p-2 rounded border border-amber-100">
            <span className="font-semibold">Stripe Income:</span> ${stripeIncome.toFixed(2)}
            {stripeOverride !== null && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1 rounded">Override</span>
            )}
          </div>
          <div className="bg-white p-2 rounded border border-amber-100">
            <span className="font-semibold">Regular Income:</span> ${regularIncome.toFixed(2)}
          </div>
          <div className="bg-white p-2 rounded border border-amber-100">
            <span className="font-semibold">Total Income:</span> ${financialData.summary.totalIncome.toFixed(2)}
          </div>
          <div className="bg-white p-2 rounded border border-amber-100">
            <span className="font-semibold">Total Expense:</span> ${financialData.summary.totalExpense.toFixed(2)}
          </div>
          <div className="bg-white p-2 rounded border border-amber-100">
            <span className="font-semibold">Collaborator Expense:</span> ${(financialData.summary.collaboratorExpense || 0).toFixed(2)}
          </div>
          <div className="bg-white p-2 rounded border border-amber-100">
            <span className="font-semibold">Other Expense:</span> ${(financialData.summary.otherExpense || 0).toFixed(2)}
          </div>
          <div className="bg-white p-2 rounded border border-amber-100">
            <span className="font-semibold">Profit:</span> ${financialData.summary.profit.toFixed(2)}
          </div>
          <div className="bg-white p-2 rounded border border-amber-100">
            <span className="font-semibold">Starting Balance:</span> ${(financialData.summary.startingBalance || 0).toFixed(2)}
          </div>
        </div>
        {handleClearCacheAndRefresh && (
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={handleClearCacheAndRefresh} className="text-amber-700 border-amber-300 hover:bg-amber-100">
              <Trash2 className="h-4 w-4 mr-2" /> Limpiar caché y forzar actualización
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default DebugInformation;
