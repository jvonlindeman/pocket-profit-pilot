import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, DollarSign, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { 
  PendingStripeInvoice, 
  UpcomingSubscriptionPayment, 
  PendingActivationSubscription,
  ReceivablesSelection 
} from '@/types/financial';

interface ReceivablesSummaryProps {
  unpaidInvoices: Array<{
    customer_name: string;
    company_name?: string;
    balance: number;
  }>;
  stripePendingInvoices: PendingStripeInvoice[];
  stripeUpcomingPayments: UpcomingSubscriptionPayment[];
  stripePendingActivations: PendingActivationSubscription[];
  selections: ReceivablesSelection[];
  onRefresh: () => void;
}

export const ReceivablesSummary: React.FC<ReceivablesSummaryProps> = ({
  unpaidInvoices,
  stripePendingInvoices,
  stripeUpcomingPayments,
  stripePendingActivations,
  selections,
  onRefresh,
}) => {
  const summary = useMemo(() => {
    const getSelectedAmount = (type: string, items: any[]) => {
      return items.reduce((total, item) => {
        const itemId = type === 'zoho_invoices' 
          ? `${item.customer_name}-${item.balance}` 
          : item.invoice_id || item.subscription_id;
        
        const selection = selections.find(s => 
          s.selection_type === type && s.item_id === itemId
        );
        
        if (selection?.selected) {
          return total + (item.balance || item.amount_due || item.amount);
        }
        return total;
      }, 0);
    };

    const zohoTotal = getSelectedAmount('zoho_invoices', unpaidInvoices);
    const stripePendingInvoicesTotal = getSelectedAmount('stripe_pending_invoices', stripePendingInvoices);
    const stripeUpcomingTotal = getSelectedAmount('stripe_upcoming_payments', stripeUpcomingPayments);
    const stripePendingActivationsTotal = getSelectedAmount('stripe_pending_activations', stripePendingActivations);

    const grandTotal = zohoTotal + stripePendingInvoicesTotal + stripeUpcomingTotal + stripePendingActivationsTotal;

    // Calculate upcoming amounts by time periods
    const now = new Date();
    const next30Days = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const next60Days = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));

    const upcomingNext30Days = stripeUpcomingPayments
      .filter(payment => {
        const paymentDate = new Date(payment.next_payment_date);
        const selection = selections.find(s => 
          s.selection_type === 'stripe_upcoming_payments' && s.item_id === payment.subscription_id
        );
        return paymentDate <= next30Days && selection?.selected;
      })
      .reduce((total, payment) => total + payment.amount, 0);

    const upcomingNext60Days = stripeUpcomingPayments
      .filter(payment => {
        const paymentDate = new Date(payment.next_payment_date);
        const selection = selections.find(s => 
          s.selection_type === 'stripe_upcoming_payments' && s.item_id === payment.subscription_id
        );
        return paymentDate <= next60Days && selection?.selected;
      })
      .reduce((total, payment) => total + payment.amount, 0);

    return {
      zohoTotal,
      stripePendingInvoicesTotal,
      stripeUpcomingTotal,
      stripePendingActivationsTotal,
      grandTotal,
      upcomingNext30Days,
      upcomingNext60Days,
      totalItems: unpaidInvoices.length + stripePendingInvoices.length + 
                  stripeUpcomingPayments.length + stripePendingActivations.length,
    };
  }, [unpaidInvoices, stripePendingInvoices, stripeUpcomingPayments, stripePendingActivations, selections]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(summary.grandTotal)}
          </div>
          <p className="text-xs text-muted-foreground">
            From {summary.totalItems} selected items
          </p>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next 30 Days</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.upcomingNext30Days)}
          </div>
          <p className="text-xs text-muted-foreground">
            Expected subscription payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next 60 Days</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary.upcomingNext60Days)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total upcoming payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Activations</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(summary.stripePendingActivationsTotal)}
          </div>
          <p className="text-xs text-muted-foreground">
            Requires immediate attention
          </p>
        </CardContent>
      </Card>
    </div>
  );
};