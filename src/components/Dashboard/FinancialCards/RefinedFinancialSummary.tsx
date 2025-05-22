
import React, { useEffect } from 'react';
import SummaryCardSection from './SummaryCardSection';
import RefinedExpensesSection from './RefinedExpensesSection';
import ProfitSection from './ProfitSection';
import FinancialDebugHelper from '../DebugTools/FinancialDebugHelper';
import FinancialHistorySummary from '../FinancialHistory/FinancialHistorySummary';
import { FinancialAssistantPromo } from '../FinancialAssistant/FinancialAssistantPromo';
import { useFinance } from '@/contexts/FinanceContext';
import { registerInteraction } from '@/utils/uiCapture';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

const RefinedFinancialSummary: React.FC = () => {
  const { dateRange } = useFinance();
  const isMobile = useIsMobile();
  
  // Register components as visible
  useEffect(() => {
    registerInteraction('visible-section', 'view', { section: 'financial-summary' });
    return () => {}; // No need to unregister as component unmount will take care of it
  }, []);
  
  return (
    <div className="space-y-4">
      <SummaryCardSection title="Resumen Financiero" data-component="financial-summary" className="financial-summary-section">
        {/* Refined Expenses Section */}
        <RefinedExpensesSection />

        {/* Profit Section - Keep existing component */}
        <ProfitSection />
      </SummaryCardSection>
      
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'md:grid-cols-3 gap-4'}`}>
        <div className={isMobile ? "" : "md:col-span-2"}>
          {/* Financial history section */}
          <SummaryCardSection title="Historial Financiero" data-component="financial-history" className="financial-history-summary">
            {dateRange?.startDate && dateRange?.endDate ? (
              <FinancialHistorySummary 
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            ) : (
              <Card className="bg-gray-50 border border-dashed">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-500">Selecciona un rango de fechas para ver el historial financiero</CardTitle>
                </CardHeader>
              </Card>
            )}
          </SummaryCardSection>
        </div>
        
        <div className={isMobile ? "mt-4" : "md:col-span-1"}>
          {/* Financial assistant promo section */}
          <FinancialAssistantPromo />
        </div>
      </div>
      
      {/* Add the debug helper */}
      <FinancialDebugHelper />
    </div>
  );
};

export default React.memo(RefinedFinancialSummary);
