
import React from 'react';
import { Users } from 'lucide-react';
import FinanceSummaryCard from './FinanceSummaryCard';
import { formatCurrency } from '@/utils/financialUtils';

interface CollaboratorExpenseCardProps {
  collaboratorExpense: number;
}

const CollaboratorExpenseCard: React.FC<CollaboratorExpenseCardProps> = ({ 
  collaboratorExpense 
}) => {
  return (
    <FinanceSummaryCard
      title="Gastos Colaboradores"
      value={formatCurrency(collaboratorExpense)}
      icon={Users}
      iconBgColor="bg-amber-50"
      iconTextColor="text-amber-500"
      valueColor="text-amber-500"
    />
  );
};

export default CollaboratorExpenseCard;
