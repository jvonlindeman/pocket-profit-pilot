
import React, { useEffect } from 'react';
import SummaryCardSection from './SummaryCardSection';
import RefinedExpensesSection from './RefinedExpensesSection';
import ProfitSection from './ProfitSection';
import FinancialDebugHelper from '../DebugTools/FinancialDebugHelper';
import FinancialHistorySummary from '../FinancialHistory/FinancialHistorySummary';
import { FinancialAssistantPromo } from '../FinancialAssistant/FinancialAssistantPromo';
import IncomeTabs from './IncomeTabs';
import { useFinance } from '@/contexts/FinanceContext';
import { registerInteraction } from '@/utils/uiCapture';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import OverdueInvoicesSection from '../OverdueInvoices/OverdueInvoicesSection';
import { UnpaidInvoice } from '@/services/zoho/api/types';

interface RefinedFinancialSummaryProps {
  unpaidInvoices?: UnpaidInvoice[];
}

const RefinedFinancialSummary: React.FC<RefinedFinancialSummaryProps> = ({ unpaidInvoices: propInvoices }) => {
  const { dateRange, unpaidInvoices: contextInvoices } = useFinance();
  const isMobile = useIsMobile();
  
  // Use either prop invoices or context invoices
  const invoices = propInvoices || contextInvoices;
  
  // Debug log
  console.log("RefinedFinancialSummary - Unpaid invoices:", { 
    propInvoices: propInvoices?.length, 
    contextInvoices: contextInvoices?.length,
    usingInvoices: invoices?.length
  });
  
  // Register components as visible
  useEffect(() => {
    registerInteraction('visible-section', 'view', { section: 'financial-summary' });
    return () => {}; // No need to unregister as component unmount will take care of it
  }, []);
  
  // Check if we have any unpaid invoices to determine layout
  const hasUnpaidInvoices = invoices && invoices.length > 0;
  
  return (
    <div className="space-y-4">
      {/* Income Tabs Section */}
      <IncomeTabs />
      
      {/* Unpaid Invoices Section */}
      {hasUnpaidInvoices && (
        <OverdueInvoicesSection unpaidInvoices={invoices} />
      )}
      
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
