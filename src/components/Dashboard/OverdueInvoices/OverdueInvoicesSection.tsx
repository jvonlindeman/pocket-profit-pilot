
import React from 'react';
import SummaryCardSection from '../FinancialCards/SummaryCardSection';
import OverdueInvoicesTotalCard from './OverdueInvoicesTotalCard';
import OverdueInvoicesList from './OverdueInvoicesList';
import { useFinance } from '@/contexts/FinanceContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { registerInteraction } from '@/utils/uiCapture';
import { UnpaidInvoice } from '@/services/zoho/api/types';

interface OverdueInvoicesSectionProps {
  className?: string;
  unpaidInvoices?: UnpaidInvoice[];
}

const OverdueInvoicesSection: React.FC<OverdueInvoicesSectionProps> = ({ className, unpaidInvoices: propInvoices }) => {
  const { unpaidInvoices: contextInvoices } = useFinance();
  const isMobile = useIsMobile();
  
  // Use either prop invoices or context invoices
  const invoices = propInvoices || contextInvoices;
  
  // Add debug console.log to track the invoice data
  console.log("OverdueInvoicesSection - Rendering with invoices:", { 
    propInvoices: propInvoices?.length,
    contextInvoices: contextInvoices?.length,
    usingInvoices: invoices?.length,
    invoicesData: invoices
  });
  
  // Register this section as viewed
  React.useEffect(() => {
    registerInteraction('visible-section', 'view', { section: 'overdue-invoices-section' });
    return () => {}; // No need to unregister as component unmount will take care of it
  }, []);
  
  // Don't render if there are no unpaid invoices
  if (!invoices || invoices.length === 0) {
    console.log("OverdueInvoicesSection - No invoices to display, not rendering");
    return null;
  }

  return (
    <SummaryCardSection 
      title="Facturas por Cobrar" 
      data-component="overdue-invoices" 
      className={`overdue-invoices-section ${className || ''}`}
    >
      <div className="space-y-4">
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
          {/* Summary card - total amount, count */}
          <OverdueInvoicesTotalCard 
            className={isMobile ? 'col-span-1' : 'md:col-span-2'} 
            unpaidInvoices={invoices}
          />
        </div>
        
        {/* List of overdue invoices */}
        <OverdueInvoicesList unpaidInvoices={invoices} />
      </div>
    </SummaryCardSection>
  );
};

export default OverdueInvoicesSection;
