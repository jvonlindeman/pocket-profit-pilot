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
import IncomeTabs from './IncomeTabs';

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
      {/* Income Tabs - First section showing Stripe, Zoho, Combined */}
      <SummaryCardSection title="Fuentes de Ingresos" data-component="income-tabs" className="income-tabs-section">
        <IncomeTabs />
      </SummaryCardSection>

      <SummaryCardSection title="Resumen Financiero" data-component="financial-summary" className="financial-summary-section">
        {/* Refined Expenses Section */}
        <RefinedExpensesSection />

        {/* Profit Section - Keep existing component */}
        <ProfitSection />
      </SummaryCardSection>
      
      {/* Financial assistant promo section - moved to single column */}
      <div className="w-full">
        <FinancialAssistantPromo />
      </div>
      
      {/* Add the debug helper */}
      <FinancialDebugHelper />
    </div>
  );
};

export default React.memo(RefinedFinancialSummary);
