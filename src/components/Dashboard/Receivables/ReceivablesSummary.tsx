
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, DollarSign, Calendar, BookOpen, CreditCard } from 'lucide-react';
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
  stripeCurrentMonthPayments: UpcomingSubscriptionPayment[];
  stripeNextMonthPayments: UpcomingSubscriptionPayment[];
  stripePendingActivations: PendingActivationSubscription[];
  selections: ReceivablesSelection[];
  onRefresh: () => void;
}

export const ReceivablesSummary: React.FC<ReceivablesSummaryProps> = ({
  unpaidInvoices,
  stripePendingInvoices,
  stripeUpcomingPayments,
  stripeCurrentMonthPayments,
  stripeNextMonthPayments,
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

    // Function for automatic calculation (without considering selections)
    const getAutomaticTotal = (items: any[]) => {
      return items.reduce((total, item) => {
        return total + (item.balance || item.amount_due || item.amount);
      }, 0);
    };

    // Separate totals for each channel (selected amounts)
    const zohoTotal = getSelectedAmount('zoho_invoices', unpaidInvoices);
    
    const stripePendingInvoicesTotal = getSelectedAmount('stripe_pending_invoices', stripePendingInvoices);
    const stripeCurrentMonthTotal = getSelectedAmount('stripe_upcoming_payments', stripeCurrentMonthPayments);
    const stripeNextMonthTotal = getSelectedAmount('stripe_upcoming_payments', stripeNextMonthPayments);
    const stripePendingActivationsTotal = getSelectedAmount('stripe_pending_activations', stripePendingActivations);
    
    const stripeTotal = stripePendingInvoicesTotal + stripeCurrentMonthTotal + stripeNextMonthTotal + stripePendingActivationsTotal;

    // Grand total combines both channels
    const grandTotal = zohoTotal + stripeTotal;

    // Next 30 days calculation (automatic, regardless of selections)
    const next30Days = getAutomaticTotal(stripeNextMonthPayments);

    return {
      zohoTotal,
      stripeTotal,
      grandTotal,
      next30Days,
      stripePendingActivationsTotal,
      totalItems: unpaidInvoices.length + stripePendingInvoices.length + 
                  stripeCurrentMonthPayments.length + stripeNextMonthPayments.length + stripePendingActivations.length,
    };
  }, [unpaidInvoices, stripePendingInvoices, stripeCurrentMonthPayments, stripeNextMonthPayments, stripePendingActivations, selections]);

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
          <CardTitle className="text-sm font-medium">Total Zoho Books</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary.zohoTotal)}
          </div>
          <p className="text-xs text-muted-foreground">
            From {unpaidInvoices.length} invoices
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Stripe</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(summary.stripeTotal)}
          </div>
          <p className="text-xs text-muted-foreground">
            All Stripe receivables
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next 30 Days</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.next30Days)}
          </div>
          <p className="text-xs text-muted-foreground">
            Next month payments (forecast)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Grand Total</CardTitle>
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
    </div>
  );
};
