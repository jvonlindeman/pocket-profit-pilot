
import React, { useMemo } from 'react';
import { BadgeDollarSign, ArrowDownIcon } from 'lucide-react';
import SummaryCard from '../SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';

const StripeIncomeTab: React.FC = () => {
  const {
    stripeIncome,
    stripeNet,
    stripeFees,
    stripeFeePercentage,
    stripeTransactionFees,
    stripePayoutFees,
    stripeAdditionalFees,
    formatCurrency,
    formatPercentage
  } = useFinance();

  // Memoized values
  const feeBreakdown = useMemo(() => {
    return {
      transactionFees: formatCurrency(stripeTransactionFees),
      payoutFees: formatCurrency(stripePayoutFees),
      additionalFees: formatCurrency(stripeAdditionalFees),
      totalFees: formatCurrency(stripeFees)
    };
  }, [
    stripeTransactionFees, 
    stripePayoutFees, 
    stripeAdditionalFees, 
    stripeFees, 
    formatCurrency
  ]);

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gross Income */}
        <SummaryCard
          title="Ingresos Brutos"
          value={formatCurrency(stripeIncome)}
          icon={BadgeDollarSign}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
        />

        {/* Net Income */}
        <SummaryCard
          title="Ingresos Netos"
          value={formatCurrency(stripeNet)}
          icon={BadgeDollarSign}
          iconColor="text-green-700"
          iconBgColor="bg-green-50"
        />

        {/* Fees */}
        <SummaryCard
          title="Comisiones"
          value={feeBreakdown.totalFees}
          icon={ArrowDownIcon}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
          additionalContent={
            <div className="text-xs mt-2 text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Transacciones:</span>
                <span>{feeBreakdown.transactionFees}</span>
              </div>
              <div className="flex justify-between">
                <span>Retiros:</span>
                <span>{feeBreakdown.payoutFees}</span>
              </div>
              <div className="flex justify-between">
                <span>Adicionales:</span>
                <span>{feeBreakdown.additionalFees}</span>
              </div>
            </div>
          }
        />

        {/* Fee Percentage */}
        <SummaryCard
          title="Porcentaje de Comisión"
          value={formatPercentage(stripeFeePercentage)}
          icon={ArrowDownIcon}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
          subtitle="del ingreso bruto"
        />
      </div>
    </div>
  );
};

export default React.memo(StripeIncomeTab);
