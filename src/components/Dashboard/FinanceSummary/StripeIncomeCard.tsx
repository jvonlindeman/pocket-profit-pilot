
import React from 'react';
import { DollarSign } from 'lucide-react';
import FinanceSummaryCard from './FinanceSummaryCard';
import { formatCurrency } from '@/utils/financialUtils';

interface StripeIncomeCardProps {
  stripeIncome: number;
  stripeOverride: number | null;
}

const StripeIncomeCard: React.FC<StripeIncomeCardProps> = ({ 
  stripeIncome,
  stripeOverride 
}) => {
  const isOverridden = stripeOverride !== null;
  
  return (
    <FinanceSummaryCard
      title="Ingresos Stripe"
      value={formatCurrency(stripeIncome)}
      icon={DollarSign}
      iconBgColor="bg-green-50"
      iconTextColor="text-green-500"
      valueColor="text-green-500"
      badge={isOverridden ? {
        text: "Anulado",
        color: "text-amber-600",
        bgColor: "bg-amber-100"
      } : undefined}
      tooltip={isOverridden ? `Valor anulado manualmente a ${formatCurrency(stripeOverride || 0)}` : undefined}
    />
  );
};

export default StripeIncomeCard;
