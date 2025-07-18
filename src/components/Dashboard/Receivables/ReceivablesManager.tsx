
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZohoReceivablesSection } from './ZohoReceivablesSection';
import { StripeReceivablesSection } from './StripeReceivablesSection';
import { ReceivablesSummary } from './ReceivablesSummary';
import { useReceivablesData } from '@/hooks/useReceivablesData';
import { zohoRepository } from '@/repositories/zohoRepository';
import LoadingSpinner from '../LoadingSpinner';

interface ReceivablesManagerProps {
  unpaidInvoices?: Array<{
    customer_name: string;
    company_name?: string;
    balance: number;
  }>;
}

export const ReceivablesManager: React.FC<ReceivablesManagerProps> = ({
  unpaidInvoices: propUnpaidInvoices = []
}) => {
  const {
    stripePendingInvoices,
    stripeUpcomingPayments,
    stripeCurrentMonthPayments,
    stripeNextMonthPayments,
    stripePendingActivations,
    selections,
    isLoading,
    error,
    stripeErrors,
    updateSelection,
    refreshData,
    retryStripeFunction,
  } = useReceivablesData();

  // Get Zoho unpaid invoices directly from repository
  const zohoUnpaidInvoices = zohoRepository.getUnpaidInvoices();
  
  // Use Zoho data from repository, fallback to props if needed
  const unpaidInvoices = zohoUnpaidInvoices.length > 0 ? zohoUnpaidInvoices : propUnpaidInvoices;

  // Get current month for default tab
  const currentMonth = new Date().getMonth();
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const currentYear = new Date().getFullYear();
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  console.log('🏠 ReceivablesManager: Render state', {
    propUnpaidInvoicesCount: propUnpaidInvoices.length,
    zohoUnpaidInvoicesCount: zohoUnpaidInvoices.length,
    finalUnpaidInvoicesCount: unpaidInvoices.length,
    stripePendingInvoicesCount: stripePendingInvoices.length,
    stripeUpcomingPaymentsCount: stripeUpcomingPayments.length,
    stripeCurrentMonthPaymentsCount: stripeCurrentMonthPayments.length,
    stripeNextMonthPaymentsCount: stripeNextMonthPayments.length,
    stripePendingActivationsCount: stripePendingActivations.length,
    isLoading,
    error,
    stripeErrors,
    zohoTotal: unpaidInvoices.reduce((sum, inv) => sum + inv.balance, 0)
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Cuentas por Cobrar</CardTitle>
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
          <CardTitle>Gestión de Cuentas por Cobrar</CardTitle>
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
        stripeCurrentMonthPayments={stripeCurrentMonthPayments}
        stripeNextMonthPayments={stripeNextMonthPayments}
        stripePendingActivations={stripePendingActivations}
        selections={selections}
        onRefresh={refreshData}
      />

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Cuentas por Cobrar</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current-month-payments" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="zoho">
                Zoho Books ({unpaidInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="stripe-invoices" className={stripeErrors.pendingInvoices ? 'text-red-600' : ''}>
                Stripe Invoices ({stripePendingInvoices.length})
                {stripeErrors.pendingInvoices && <span className="ml-1">⚠️</span>}
              </TabsTrigger>
              <TabsTrigger value="current-month-payments" className={stripeErrors.upcomingPayments ? 'text-red-600' : ''}>
                Mes Actual ({stripeCurrentMonthPayments.length})
                {stripeErrors.upcomingPayments && <span className="ml-1">⚠️</span>}
              </TabsTrigger>
              <TabsTrigger value="next-month-payments" className={stripeErrors.upcomingPayments ? 'text-red-600' : ''}>
                Próximo Mes ({stripeNextMonthPayments.length})
                {stripeErrors.upcomingPayments && <span className="ml-1">⚠️</span>}
              </TabsTrigger>
              <TabsTrigger value="all-upcoming" className={stripeErrors.upcomingPayments ? 'text-red-600' : ''}>
                Todos ({stripeUpcomingPayments.length})
                {stripeErrors.upcomingPayments && <span className="ml-1">⚠️</span>}
              </TabsTrigger>
              <TabsTrigger value="stripe-activations" className={stripeErrors.pendingActivations ? 'text-red-600' : ''}>
                Activaciones ({stripePendingActivations.length})
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
                title="Facturas Pendientes de Stripe"
                items={stripePendingInvoices}
                selections={selections}
                error={stripeErrors.pendingInvoices}
                onUpdateSelection={updateSelection}
                onRetry={retryStripeFunction}
              />
            </TabsContent>

            <TabsContent value="current-month-payments" className="mt-4">
              <StripeReceivablesSection
                type="upcoming_payments"
                title={`Pagos del Mes Actual (${new Date(currentYear, currentMonth).toLocaleString('es', { month: 'long', year: 'numeric' })})`}
                items={stripeCurrentMonthPayments}
                selections={selections}
                error={stripeErrors.upcomingPayments}
                onUpdateSelection={updateSelection}
                onRetry={retryStripeFunction}
              />
            </TabsContent>

            <TabsContent value="next-month-payments" className="mt-4">
              <StripeReceivablesSection
                type="upcoming_payments"
                title={`Pagos del Próximo Mes (${new Date(nextMonthYear, nextMonth).toLocaleString('es', { month: 'long', year: 'numeric' })})`}
                items={stripeNextMonthPayments}
                selections={selections}
                error={stripeErrors.upcomingPayments}
                onUpdateSelection={updateSelection}
                onRetry={retryStripeFunction}
              />
            </TabsContent>

            <TabsContent value="all-upcoming" className="mt-4">
              <StripeReceivablesSection
                type="upcoming_payments"
                title="Todos los Pagos de Suscripción"
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
                title="Activaciones Pendientes"
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
