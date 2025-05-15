
import React from 'react';
import { BadgeDollarSign, Scissors } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import SummaryCard from '../SummaryCard';

interface StripeIncomeTabProps {
  stripeIncome: number;
  stripeNet: number;
  stripeFees: number;
  stripeFeePercentage: number;
  stripeTransactionFees: number;
  stripeAdditionalFees: number;
  stripePayoutFees: number;
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
}

const StripeIncomeTab: React.FC<StripeIncomeTabProps> = ({
  stripeIncome,
  stripeNet,
  stripeFees,
  stripeFeePercentage,
  stripeTransactionFees,
  stripeAdditionalFees,
  stripePayoutFees,
  formatCurrency,
  formatPercentage
}) => {
  console.log("StripeIncomeTab rendering with values:", {
    stripeIncome,
    stripeNet,
    stripeFees,
    stripeFeePercentage,
    stripeTransactionFees,
    stripeAdditionalFees,
    stripePayoutFees
  });
  
  return (
    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Stripe (Bruto)"
          value={formatCurrency(stripeIncome)}
          icon={BadgeDollarSign}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
        />

        <SummaryCard
          title="Stripe (Neto)"
          value={formatCurrency(stripeNet)}
          icon={BadgeDollarSign}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
        />

        <SummaryCard
          title="Total Comisiones"
          value={formatCurrency(stripeFees)}
          subtitle={stripeFeePercentage > 0 ? formatPercentage(stripeFeePercentage) : undefined}
          icon={Scissors}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
        />
      </div>

      <h4 className="text-md font-medium text-gray-600 mt-6 mb-4">Desglose de Comisiones</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Comisiones (Transacción)"
          value={formatCurrency(stripeTransactionFees)}
          icon={Scissors}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
        />
        
        <SummaryCard
          title="Comisiones Adicionales"
          value={formatCurrency(stripeAdditionalFees)}
          subtitle={stripeAdditionalFees > 0 ? `${stripeFeePercentage.toFixed(1)}% del total` : undefined}
          icon={Scissors}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
        />

        <SummaryCard
          title="Comisiones (Payout)"
          value={formatCurrency(stripePayoutFees)}
          icon={Scissors}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
        />
      </div>
    </div>
  );
};

export default StripeIncomeTab;
