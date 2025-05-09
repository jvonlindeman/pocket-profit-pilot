
import React from 'react';
import { Scale } from 'lucide-react';
import FinanceSummaryCard from './FinanceSummaryCard';
import { formatCurrency } from '@/utils/financialUtils';

interface BalanceCardProps {
  startingBalance?: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ startingBalance }) => {
  // Convert undefined to null to avoid display issues
  const balanceValue = startingBalance !== undefined ? startingBalance : null;
  
  // Format the balance for display or show "No establecido"
  const displayValue = balanceValue !== null 
    ? formatCurrency(balanceValue) 
    : "No establecido";

  console.log('BalanceCard rendering with startingBalance:', startingBalance, 'displayValue:', displayValue);

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
