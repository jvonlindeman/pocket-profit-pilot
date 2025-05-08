
import React from 'react';
import { TrendingUpIcon } from 'lucide-react';
import FinanceSummaryCard from './FinanceSummaryCard';
import { formatCurrency, formatPercentage } from '@/utils/financialUtils';

interface ProfitCardProps {
  profit: number;
  profitMargin: number;
}

const ProfitCard: React.FC<ProfitCardProps> = ({ profit, profitMargin }) => {
  const footer = (
    <div className={`text-sm font-medium ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      Margen: {formatPercentage(profitMargin)}
    </div>
  );

  return (
    <FinanceSummaryCard
      title="Beneficio Neto"
      value={formatCurrency(profit)}
      icon={TrendingUpIcon}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-500"
      valueColor="text-blue-500"
      footer={footer}
    />
  );
};

export default ProfitCard;
