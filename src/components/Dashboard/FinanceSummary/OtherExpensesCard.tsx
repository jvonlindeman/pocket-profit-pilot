
import React from 'react';
import { ArrowDownIcon } from 'lucide-react';
import FinanceSummaryCard from './FinanceSummaryCard';
import { formatCurrency } from '@/utils/financialUtils';

interface OtherExpensesCardProps {
  otherExpense: number;
}

const OtherExpensesCard: React.FC<OtherExpensesCardProps> = ({ otherExpense }) => {
  return (
    <FinanceSummaryCard
      title="Otros Gastos"
      value={formatCurrency(otherExpense)}
      icon={ArrowDownIcon}
      iconBgColor="bg-red-50"
      iconTextColor="text-red-500"
      valueColor="text-red-500"
    />
  );
};

export default OtherExpensesCard;
