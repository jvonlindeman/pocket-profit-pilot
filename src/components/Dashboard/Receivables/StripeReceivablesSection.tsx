import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square, ExternalLink, Calendar, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { 
  PendingStripeInvoice, 
  UpcomingSubscriptionPayment, 
  PendingActivationSubscription,
  ReceivablesSelection 
} from '@/types/financial';

type ReceivableType = 'pending_invoices' | 'upcoming_payments' | 'pending_activations';

interface StripeReceivablesSectionProps {
  type: ReceivableType;
  title: string;
  items: PendingStripeInvoice[] | UpcomingSubscriptionPayment[] | PendingActivationSubscription[];
  selections: ReceivablesSelection[];
  error?: string | null;
  onUpdateSelection: (
    type: ReceivablesSelection['selection_type'],
    itemId: string,
    selected: boolean,
    amount: number,
    metadata?: any
  ) => Promise<boolean>;
  onRetry?: (functionName: 'pendingInvoices' | 'upcomingPayments' | 'pendingActivations') => Promise<boolean>;
}

export const StripeReceivablesSection: React.FC<StripeReceivablesSectionProps> = ({
  type,
  title,
  items,
  selections,
  error,
  onUpdateSelection,
  onRetry,
}) => {
  // Helper functions defined first to avoid initialization errors
  const getItemId = (item: any) => {
    return item.invoice_id || item.subscription_id;
  };

  const getItemAmount = (item: any) => {
    return item.amount_due || item.amount;
  };

  const selectionType = useMemo(() => {
    switch (type) {
      case 'pending_invoices': return 'stripe_pending_invoices' as const;
      case 'upcoming_payments': return 'stripe_upcoming_payments' as const;
      case 'pending_activations': return 'stripe_pending_activations' as const;
    }
  }, [type]);

  const retryFunctionName = useMemo(() => {
    switch (type) {
      case 'pending_invoices': return 'pendingInvoices' as const;
      case 'upcoming_payments': return 'upcomingPayments' as const;
      case 'pending_activations': return 'pendingActivations' as const;
    }
  }, [type]);

  const { selectedItems, totalSelected, allSelected } = useMemo(() => {
    const selectedItems = new Set(
      selections
        .filter(s => s.selection_type === selectionType && s.selected)
        .map(s => s.item_id)
    );

    const totalSelected = items
      .filter(item => {
        const itemId = getItemId(item);
        return selectedItems.has(itemId);
      })
      .reduce((total, item) => total + getItemAmount(item), 0);

    const allSelected = items.length > 0 && 
      items.every(item => {
        const itemId = getItemId(item);
        return selectedItems.has(itemId);
      });

    return { selectedItems, totalSelected, allSelected };
  }, [items, selections, selectionType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-orange-100 text-orange-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'incomplete': return 'bg-red-100 text-red-800';
      case 'past_due': return 'bg-red-100 text-red-800';
      case 'incomplete_expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectAll = async () => {
    const newSelectedState = !allSelected;
    
    for (const item of items) {
      const itemId = getItemId(item);
      await onUpdateSelection(
        selectionType,
        itemId,
        newSelectedState,
        getItemAmount(item),
        item
      );
    }
  };

  const handleItemToggle = async (item: any, selected: boolean) => {
    const itemId = getItemId(item);
    await onUpdateSelection(
      selectionType,
      itemId,
      selected,
      getItemAmount(item),
      item
    );
  };

  const handleRetry = async () => {
    if (onRetry) {
      await onRetry(retryFunctionName);
    }
  };

  const renderItemContent = (item: any) => {
    const commonProps = {
      customer: item.customer?.name || item.customer?.email || 'Unknown Customer',
      amount: getItemAmount(item),
      status: item.status,
    };

    switch (type) {
      case 'pending_invoices':
        const invoice = item as PendingStripeInvoice;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{commonProps.customer}</div>
                <div className="text-sm text-muted-foreground">{invoice.description}</div>
                {invoice.number && (
                  <div className="text-xs text-muted-foreground">#{invoice.number}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(commonProps.amount)}</div>
                <Badge className={getStatusColor(commonProps.status)}>{commonProps.status}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Due: {invoice.due_date ? formatDate(invoice.due_date) : 'No due date'}</span>
              </div>
              {invoice.pdf_url && (
                <a
                  href={invoice.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View PDF</span>
                </a>
              )}
            </div>
          </div>
        );

      case 'upcoming_payments':
        const payment = item as UpcomingSubscriptionPayment;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{commonProps.customer}</div>
                <div className="text-sm text-muted-foreground">{payment.plan_name}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(commonProps.amount)}</div>
                <Badge className={getStatusColor(commonProps.status)}>{commonProps.status}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Next payment: {formatDate(payment.next_payment_date)}</span>
              </div>
              <span>Period: {formatDate(payment.current_period_start)} - {formatDate(payment.current_period_end)}</span>
            </div>
          </div>
        );

      case 'pending_activations':
        const activation = item as PendingActivationSubscription;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium flex items-center space-x-2">
                  <span>{commonProps.customer}</span>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </div>
                <div className="text-sm text-muted-foreground">{activation.plan_name}</div>
                {activation.latest_invoice && (
                  <div className="text-xs text-muted-foreground">
                    Invoice: {formatCurrency(activation.latest_invoice.amount_due)} ({activation.latest_invoice.status})
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(commonProps.amount)}</div>
                <Badge className={getStatusColor(commonProps.status)}>{commonProps.status}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Created: {formatDate(activation.created_date)}</span>
              </div>
              {activation.latest_invoice?.hosted_invoice_url && (
                <a
                  href={activation.latest_invoice.hosted_invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Pay Invoice</span>
                </a>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show error state with retry option
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
              <p className="font-medium">Error loading {title.toLowerCase()}</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            {onRetry && (
              <Button 
                variant="outline" 
                onClick={handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground space-y-2">
            <p>No {title.toLowerCase()} found</p>
            {onRetry && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="flex items-center space-x-2"
          >
            {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            {items.length} items
          </span>
          {onRetry && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRetry}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Selected Total</div>
          <div className="font-semibold text-primary">{formatCurrency(totalSelected)}</div>
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item, index) => {
          const itemId = getItemId(item);
          const isSelected = selectedItems.has(itemId);

          return (
            <Card key={index} className={`border transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => 
                      handleItemToggle(item, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    {renderItemContent(item)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
