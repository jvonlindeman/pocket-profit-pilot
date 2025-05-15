
import React from 'react';
import { FinancialSummary } from '@/types/financial';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StripeIncomeTab from './StripeTabs/StripeIncomeTab';
import ZohoIncomeTab from './StripeTabs/ZohoIncomeTab';
import CombinedFinanceTab from './StripeTabs/CombinedFinanceTab';

interface IncomeTabsProps {
  summary: FinancialSummary;
  stripeIncome: number;
  stripeFees: number;
  stripeTransactionFees: number;
  stripePayoutFees: number;
  stripeAdditionalFees: number;
  stripeNet: number;
  stripeFeePercentage: number;
  regularIncome: number;
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
}

const IncomeTabs: React.FC<IncomeTabsProps> = ({
  summary,
  stripeIncome,
  stripeFees,
  stripeTransactionFees,
  stripePayoutFees,
  stripeAdditionalFees,
  stripeNet,
  stripeFeePercentage,
  regularIncome,
  formatCurrency,
  formatPercentage
}) => {
  return (
    <div>
      <Tabs defaultValue="stripe" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Fuentes de Ingresos</h2>
          <TabsList>
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
            <TabsTrigger value="zoho">Zoho</TabsTrigger>
            <TabsTrigger value="combined">Combinado</TabsTrigger>
          </TabsList>
        </div>

        {/* Stripe Income Tab */}
        <TabsContent value="stripe" className="p-0">
          <StripeIncomeTab
            stripeIncome={stripeIncome}
            stripeNet={stripeNet}
            stripeFees={stripeFees}
            stripeFeePercentage={stripeFeePercentage}
            stripeTransactionFees={stripeTransactionFees}
            stripeAdditionalFees={stripeAdditionalFees}
            stripePayoutFees={stripePayoutFees}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
          />
        </TabsContent>

        {/* Zoho Income Tab */}
        <TabsContent value="zoho" className="p-0">
          <ZohoIncomeTab
            regularIncome={regularIncome}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        {/* Combined Financial Overview */}
        <TabsContent value="combined" className="p-0">
          <CombinedFinanceTab
            summary={summary}
            stripeNet={stripeNet}
            regularIncome={regularIncome}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncomeTabs;
