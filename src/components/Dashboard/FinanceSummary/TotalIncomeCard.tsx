
import React from 'react';
import { ArrowUpIcon } from 'lucide-react';
import FinanceSummaryCard from './FinanceSummaryCard';
import { formatCurrency } from '@/utils/financialUtils';

interface TotalIncomeCardProps {
  totalIncome: number;
}

const TotalIncomeCard: React.FC<TotalIncomeCardProps> = ({ totalIncome }) => {
  return (
    <FinanceSummaryCard
      title="Ingresos Totales"
      value={formatCurrency(totalIncome)}
      icon={ArrowUpIcon}
      iconBgColor="bg-green-50"
      iconTextColor="text-green-500"
      valueColor="text-green-500"
    />
  );
};

export default TotalIncomeCard;
