
import React, { useEffect } from 'react';
import SummaryCardSection from './SummaryCardSection';
import RefinedExpensesSection from './RefinedExpensesSection';
import ProfitSection from './ProfitSection';
import UnpaidInvoicesSection from './UnpaidInvoicesSection';
import FinancialDebugHelper from '../DebugTools/FinancialDebugHelper';
import { useFinance } from '@/contexts/FinanceContext';
import { registerInteraction } from '@/utils/uiCapture';
import { useIsMobile } from '@/hooks/use-mobile';
import IncomeTabs from './IncomeTabs';

const RefinedFinancialSummary: React.FC = () => {
  const { unpaidInvoices } = useFinance();
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
      
      {unpaidInvoices && unpaidInvoices.length > 0 && (
        <SummaryCardSection title="Facturas por Cobrar" data-component="unpaid-invoices" className="unpaid-invoices-section">
          <UnpaidInvoicesSection />
        </SummaryCardSection>
      )}
      
      {/* Add the debug helper */}
      <FinancialDebugHelper />
    </div>
  );
};

export default React.memo(RefinedFinancialSummary);
