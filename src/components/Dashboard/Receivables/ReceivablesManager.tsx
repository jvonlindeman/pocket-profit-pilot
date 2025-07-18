
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZohoReceivablesSection } from './ZohoReceivablesSection';
import { StripeReceivablesSection } from './StripeReceivablesSection';
import { ReceivablesSummary } from './ReceivablesSummary';
import { useReceivablesData } from '@/hooks/useReceivablesData';
import LoadingSpinner from '../LoadingSpinner';

interface ReceivablesManagerProps {
  unpaidInvoices?: Array<{
    customer_name: string;
    company_name?: string;
    balance: number;
  }>;
}

export const ReceivablesManager: React.FC<ReceivablesManagerProps> = ({
  unpaidInvoices = []
}) => {
  const {
    stripePendingInvoices,
    stripeUpcomingPayments,
    stripePendingActivations,
    selections,
    isLoading,
    error,
    stripeErrors,
    updateSelection,
    refreshData,
    retryStripeFunction,
  } = useReceivablesData();

  console.log('🏠 ReceivablesManager: Render state', {
    unpaidInvoicesCount: unpaidInvoices.length,
    stripePendingInvoicesCount: stripePendingInvoices.length,
    stripeUpcomingPaymentsCount: stripeUpcomingPayments.length,
    stripePendingActivationsCount: stripePendingActivations.length,
    isLoading,
    error,
    stripeErrors
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts Receivable Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts Receivable Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ReceivablesSummary
        unpaidInvoices={unpaidInvoices}
        stripePendingInvoices={stripePendingInvoices}
        stripeUpcomingPayments={stripeUpcomingPayments}
        stripePendingActivations={stripePendingActivations}
        selections={selections}
        onRefresh={refreshData}
      />

      <Card>
        <CardHeader>
          <CardTitle>Manage Receivables</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="zoho" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="zoho">
                Zoho Books ({unpaidInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="stripe-invoices" className={stripeErrors.pendingInvoices ? 'text-red-600' : ''}>
                Stripe Invoices ({stripePendingInvoices.length})
                {stripeErrors.pendingInvoices && <span className="ml-1">⚠️</span>}
              </TabsTrigger>
              <TabsTrigger value="stripe-subscriptions" className={stripeErrors.upcomingPayments ? 'text-red-600' : ''}>
                Upcoming Payments ({stripeUpcomingPayments.length})
                {stripeErrors.upcomingPayments && <span className="ml-1">⚠️</span>}
              </TabsTrigger>
              <TabsTrigger value="stripe-activations" className={stripeErrors.pendingActivations ? 'text-red-600' : ''}>
                Pending Activations ({stripePendingActivations.length})
                {stripeErrors.pendingActivations && <span className="ml-1">⚠️</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="zoho" className="mt-4">
              <ZohoReceivablesSection
                unpaidInvoices={unpaidInvoices}
                selections={selections}
                onUpdateSelection={updateSelection}
              />
            </TabsContent>

            <TabsContent value="stripe-invoices" className="mt-4">
              <StripeReceivablesSection
                type="pending_invoices"
                title="Pending Stripe Invoices"
                items={stripePendingInvoices}
                selections={selections}
                error={stripeErrors.pendingInvoices}
                onUpdateSelection={updateSelection}
                onRetry={retryStripeFunction}
              />
            </TabsContent>

            <TabsContent value="stripe-subscriptions" className="mt-4">
              <StripeReceivablesSection
                type="upcoming_payments"
                title="Upcoming Subscription Payments"
                items={stripeUpcomingPayments}
                selections={selections}
                error={stripeErrors.upcomingPayments}
                onUpdateSelection={updateSelection}
                onRetry={retryStripeFunction}
              />
            </TabsContent>

            <TabsContent value="stripe-activations" className="mt-4">
              <StripeReceivablesSection
                type="pending_activations"
                title="Pending Activations"
                items={stripePendingActivations}
                selections={selections}
                error={stripeErrors.pendingActivations}
                onUpdateSelection={updateSelection}
                onRetry={retryStripeFunction}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
