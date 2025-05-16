
import React from 'react';
import { Calculator, TrendingUpIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import SummaryCard from './SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';

const ProfitSection: React.FC = () => {
  const { 
    summary, 
    formatCurrency, 
    formatPercentage 
  } = useFinance();

  return (
    <>
      {/* Gross Profit Card */}
      <div className="grid grid-cols-1 gap-6">
        <SummaryCard
          title="Beneficio Bruto"
          value={formatCurrency(summary.grossProfit)}
          icon={Calculator}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
          additionalContent={
            <div className={`text-sm font-medium ml-2 ${summary.grossProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Margen: {formatPercentage(summary.grossProfitMargin)}
            </div>
          }
        />
      </div>

      {/* Net Profit - Separate Row */}
      <div className="mt-6 grid grid-cols-1 gap-6">
        <Card className="finance-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Beneficio Neto (incluye balance inicial)</h3>
              <div className="p-2 bg-blue-50 rounded-full">
                <TrendingUpIcon className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-blue-500 animate-value">
                {formatCurrency(summary.profit)}
              </div>
              <div className={`text-sm font-medium ml-2 ${summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Margen: {formatPercentage(summary.profitMargin)}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Balance Inicial + Ingresos Totales - Gastos Totales
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default React.memo(ProfitSection);
