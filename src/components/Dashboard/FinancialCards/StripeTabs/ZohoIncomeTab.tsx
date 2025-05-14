
import React from 'react';
import { ArrowUpIcon } from 'lucide-react';
import SummaryCard from '../SummaryCard';

interface ZohoIncomeTabProps {
  regularIncome: number;
  formatCurrency: (amount: number) => string;
}

const ZohoIncomeTab: React.FC<ZohoIncomeTabProps> = ({
  regularIncome,
  formatCurrency
}) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard
          title="Ingresos Zoho"
          value={formatCurrency(regularIncome)}
          icon={ArrowUpIcon}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
        />
      </div>
    </div>
  );
};

export default ZohoIncomeTab;
