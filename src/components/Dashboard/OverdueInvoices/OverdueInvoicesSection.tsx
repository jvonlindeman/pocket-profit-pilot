
import React from 'react';
import SummaryCardSection from '../FinancialCards/SummaryCardSection';
import OverdueInvoicesTotalCard from './OverdueInvoicesTotalCard';
import OverdueInvoicesList from './OverdueInvoicesList';
import { useFinance } from '@/contexts/FinanceContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { registerInteraction } from '@/utils/uiCapture';

interface OverdueInvoicesSectionProps {
  className?: string;
}

const OverdueInvoicesSection: React.FC<OverdueInvoicesSectionProps> = ({ className }) => {
  const { unpaidInvoices } = useFinance();
  const isMobile = useIsMobile();
  
  // Register this section as viewed
  React.useEffect(() => {
    registerInteraction('visible-section', 'view', { section: 'overdue-invoices-section' });
    return () => {}; // No need to unregister as component unmount will take care of it
  }, []);
  
  // Don't render if there are no unpaid invoices
  if (!unpaidInvoices || unpaidInvoices.length === 0) {
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
          <OverdueInvoicesTotalCard className={isMobile ? 'col-span-1' : 'md:col-span-2'} />
        </div>
        
        {/* List of overdue invoices */}
        <OverdueInvoicesList />
      </div>
    </SummaryCardSection>
  );
};

export default OverdueInvoicesSection;
