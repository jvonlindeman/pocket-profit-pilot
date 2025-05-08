
import React from 'react';
import { ArrowDownIcon } from 'lucide-react';
import FinanceSummaryCard from './FinanceSummaryCard';
import { formatCurrency } from '@/utils/financialUtils';

interface TotalExpensesCardProps {
  totalExpense: number;
}

const TotalExpensesCard: React.FC<TotalExpensesCardProps> = ({ totalExpense }) => {
  return (
    <FinanceSummaryCard
      title="Gastos Totales"
      value={formatCurrency(totalExpense)}
      icon={ArrowDownIcon}
      iconBgColor="bg-red-50"
      iconTextColor="text-red-500"
      valueColor="text-red-500"
    />
  );
};

export default TotalExpensesCard;
