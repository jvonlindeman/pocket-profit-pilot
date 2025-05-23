
import React, { useEffect } from 'react';
import SummaryCardSection from './SummaryCardSection';
import RefinedExpensesSection from './RefinedExpensesSection';
import ProfitSection from './ProfitSection';
import UnpaidInvoicesSection from './UnpaidInvoicesSection';
import FinancialDebugHelper from '../DebugTools/FinancialDebugHelper';
import FinancialHistorySummary from '../FinancialHistory/FinancialHistorySummary';
import { FinancialAssistantPromo } from '../FinancialAssistant/FinancialAssistantPromo';
import { useFinance } from '@/contexts/FinanceContext';
import { registerInteraction } from '@/utils/uiCapture';
import { useIsMobile } from '@/hooks/use-mobile';

const RefinedFinancialSummary: React.FC = () => {
  const { dateRange, unpaidInvoices } = useFinance();
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
      
      {unpaidInvoices && unpaidInvoices.length > 0 && (
        <SummaryCardSection title="Facturas por Cobrar" data-component="unpaid-invoices" className="unpaid-invoices-section">
          <UnpaidInvoicesSection />
        </SummaryCardSection>
      )}
      
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'md:grid-cols-3 gap-4'}`}>
        <div className={isMobile ? "" : "md:col-span-2"}>
          {/* Financial history section */}
          <SummaryCardSection title="Historial Financiero" data-component="financial-history" className="financial-history-summary">
            <FinancialHistorySummary 
              startDate={dateRange?.startDate}
              endDate={dateRange?.endDate}
            />
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
