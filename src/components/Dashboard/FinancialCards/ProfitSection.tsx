
import React from 'react';
import { Calculator, TrendingUpIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import SummaryCard from './SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { useIsMobile } from '@/hooks/use-mobile';

const ProfitSection: React.FC = () => {
  const { summary } = useFinance();
  const { formatCurrency, formatPercentage, getValueColorClass } = useFinanceFormatter();
  const isMobile = useIsMobile();

  // Get color classes based on values
  const profitMarginColorClass = getValueColorClass(summary.profitMargin);
  const grossProfitMarginColorClass = getValueColorClass(summary.grossProfitMargin);

  return (
    <>
      {/* Gross Profit Card */}
      <div className={`grid grid-cols-1 ${isMobile ? 'mt-3 gap-3' : 'mt-6 gap-6'}`}>
        <SummaryCard
          title="Beneficio Bruto"
          value={formatCurrency(summary.grossProfit)}
          icon={Calculator}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
          valueSize={isMobile ? 'small' : 'medium'}
          additionalContent={
            <div className={`text-sm font-medium ml-2 ${grossProfitMarginColorClass}`}>
              Margen: {formatPercentage(summary.grossProfitMargin)}
            </div>
          }
        />
      </div>

      {/* Net Profit - Separate Row */}
      <div className={`${isMobile ? 'mt-3' : 'mt-6'} grid grid-cols-1 gap-6`}>
        <Card className="finance-card">
          <CardContent className={isMobile ? "p-4" : "p-6"}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 truncate pr-2">
                {isMobile ? "Beneficio Neto" : "Beneficio Neto (incluye balance inicial)"}
              </h3>
              <div className="p-2 bg-blue-50 rounded-full">
                <TrendingUpIcon className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="flex items-end justify-between flex-wrap">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-500 animate-value`}>
                {formatCurrency(summary.profit)}
              </div>
              <div className={`text-sm font-medium ${profitMarginColorClass}`}>
                Margen: {formatPercentage(summary.profitMargin)}
              </div>
            </div>
            {!isMobile && (
              <div className="mt-2 text-xs text-gray-500">
                Balance Inicial + Ingresos Totales - Gastos Totales
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default React.memo(ProfitSection);
