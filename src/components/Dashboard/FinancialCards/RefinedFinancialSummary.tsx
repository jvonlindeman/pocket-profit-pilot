
import React from 'react';
import SummaryCardSection from './SummaryCardSection';
import RefinedExpensesSection from './RefinedExpensesSection';
import ProfitSection from './ProfitSection';
import FinancialDebugHelper from '../DebugTools/FinancialDebugHelper';
import FinancialHistorySummary from '../FinancialHistory/FinancialHistorySummary';
import { useFinance } from '@/contexts/FinanceContext';

const RefinedFinancialSummary: React.FC = () => {
  const { dateRange } = useFinance();
  
  return (
    <div className="space-y-4">
      <SummaryCardSection title="Resumen Financiero">
        {/* Refined Expenses Section */}
        <RefinedExpensesSection />

        {/* Profit Section - Keep existing component */}
        <ProfitSection />
      </SummaryCardSection>
      
      {/* Financial history section */}
      <SummaryCardSection title="Historial Financiero">
        <FinancialHistorySummary 
          startDate={dateRange?.startDate}
          endDate={dateRange?.endDate}
        />
      </SummaryCardSection>
      
      {/* Add the debug helper */}
      <FinancialDebugHelper />
    </div>
  );
};

export default React.memo(RefinedFinancialSummary);
