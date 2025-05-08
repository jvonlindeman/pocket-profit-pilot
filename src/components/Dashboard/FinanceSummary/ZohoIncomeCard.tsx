
import React from 'react';
import { ArrowUpIcon } from 'lucide-react';
import FinanceSummaryCard from './FinanceSummaryCard';
import { formatCurrency } from '@/utils/financialUtils';

interface ZohoIncomeCardProps {
  regularIncome: number;
}

const ZohoIncomeCard: React.FC<ZohoIncomeCardProps> = ({ regularIncome }) => {
  return (
    <FinanceSummaryCard
      title="Ingresos Zoho"
      value={formatCurrency(regularIncome)}
      icon={ArrowUpIcon}
      iconBgColor="bg-green-50"
      iconTextColor="text-green-500"
      valueColor="text-green-500"
    />
  );
};

export default ZohoIncomeCard;
