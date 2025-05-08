
import React from 'react';
import { Scale } from 'lucide-react';
import FinanceSummaryCard from './FinanceSummaryCard';
import { formatCurrency } from '@/utils/financialUtils';

interface BalanceCardProps {
  startingBalance?: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ startingBalance }) => {
  const displayValue = startingBalance !== undefined 
    ? formatCurrency(startingBalance) 
    : "No establecido";

  return (
    <FinanceSummaryCard
      title="Balance Inicial"
      value={displayValue}
      icon={Scale}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-500"
      valueColor="text-blue-500"
    />
  );
};

export default BalanceCard;
