import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, DollarSign, Calendar, BookOpen, CreditCard, TrendingDown } from 'lucide-react';
import { 
  UpcomingSubscriptionPayment, 
  PendingActivationSubscription,
  ReceivablesSelection 
} from '@/types/financial';
import { useReceivablesCalculations } from '@/hooks/useReceivablesCalculations';

interface ReceivablesSummaryProps {
  unpaidInvoices: Array<{
    customer_name: string;
    company_name?: string;
    balance: number;
  }>;
  stripeUpcomingPayments: UpcomingSubscriptionPayment[];
  stripeCurrentMonthPayments: UpcomingSubscriptionPayment[];
  stripeNextMonthPayments: UpcomingSubscriptionPayment[];
  stripePendingActivations: PendingActivationSubscription[];
  selections: ReceivablesSelection[];
  stripeNet: number;
  adjustedZohoIncome: number;
  onRefresh: () => void;
}

export const ReceivablesSummary: React.FC<ReceivablesSummaryProps> = ({
  unpaidInvoices,
  stripeUpcomingPayments,
  stripeCurrentMonthPayments,
  stripeNextMonthPayments,
  stripePendingActivations,
  selections,
  stripeNet,
  adjustedZohoIncome,
  onRefresh,
}) => {
  
  // Use the centralized calculations hook
  const summary = useReceivablesCalculations({
    unpaidInvoices,
    stripeUpcomingPayments,
    stripeCurrentMonthPayments,
    stripeNextMonthPayments,
    stripePendingActivations,
    selections,
    stripeNet,
    adjustedZohoIncome,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Zoho Books</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary.zohoTotal)}
          </div>
          <p className="text-xs text-muted-foreground">
            Facturas + Dinero en banco
          </p>
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
            <div>Facturas: {formatCurrency(summary.zohoSelectedInvoices)}</div>
            <div>Banco: {formatCurrency(adjustedZohoIncome)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stripe Bruto</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(summary.stripeGrossTotal)}
          </div>
          <p className="text-xs text-muted-foreground">
            Receivables seleccionados (bruto)
          </p>
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm text-blue-600 font-medium">
              <span>Total Stripe (Neto + Bruto):</span>
              <span>{formatCurrency(summary.totalStripeProjection)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Receivables bruto + Neto ya cobrado
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stripe Neto</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.stripeNetTotal)}
          </div>
          <p className="text-xs text-muted-foreground">
            Receivables después de comisiones
          </p>
          {summary.totalFeesCommissions > 0 && (
            <p className="text-xs text-red-500 mt-1">
              -{formatCurrency(summary.totalFeesCommissions)} en comisiones
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximo Mes (Neto)</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.next30DaysNet)}
          </div>
          <p className="text-xs text-muted-foreground">
            Proyección neta
          </p>
          {summary.next30DaysGross !== summary.next30DaysNet && (
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(summary.next30DaysGross)} bruto
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Neto</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(summary.grandNetTotal)}
          </div>
          <p className="text-xs text-muted-foreground">
            De {summary.totalItems} items seleccionados
          </p>
          {summary.grandGrossTotal !== summary.grandNetTotal && (
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(summary.grandGrossTotal)} bruto
            </p>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="mt-2 w-full"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
