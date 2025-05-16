
import React from 'react';
import ExpensesSection from './ExpensesSection';
import ProfitSection from './ProfitSection';
import SummaryCardSection from './SummaryCardSection';

const FinancialSummarySection: React.FC = () => {
  return (
    <SummaryCardSection title="Resumen Financiero">
      {/* Expenses Section */}
      <ExpensesSection />

      {/* Profit Section */}
      <ProfitSection />
    </SummaryCardSection>
  );
};

export default React.memo(FinancialSummarySection);
