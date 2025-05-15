
import React from 'react';
import { ArrowUpIcon, BadgeDollarSign, ArrowDownIcon } from 'lucide-react';
import { FinancialSummary } from '@/types/financial';
import SummaryCard from '../SummaryCard';

interface CombinedFinanceTabProps {
  summary: FinancialSummary;
  stripeNet: number;
  regularIncome: number;
  formatCurrency: (amount: number) => string;
}

const CombinedFinanceTab: React.FC<CombinedFinanceTabProps> = ({
  summary,
  stripeNet,
  regularIncome,
  formatCurrency
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Ingresos Totales"
          value={formatCurrency(summary.totalIncome)}
          icon={ArrowUpIcon}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
        />

        <SummaryCard
          title="Stripe (Neto)"
          value={formatCurrency(stripeNet)}
          icon={BadgeDollarSign}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
        />

        <SummaryCard
          title="Zoho"
          value={formatCurrency(regularIncome)}
          icon={ArrowUpIcon}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
        />

        <SummaryCard
          title="Gastos Totales"
          value={formatCurrency(summary.totalExpenses)}
          icon={ArrowDownIcon}
          iconColor="text-red-500"
          iconBgColor="bg-red-50"
        />
      </div>
    </div>
  );
};

export default CombinedFinanceTab;
