import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CheckSquare, Square } from 'lucide-react';
import { ReceivablesSelection } from '@/types/financial';
import { ExportButtons } from './ExportButtons';
import { ExportableInvoice } from '@/utils/exportUtils';

interface ZohoReceivablesSectionProps {
  unpaidInvoices: Array<{
    customer_name: string;
    company_name?: string;
    balance: number;
  }>;
  selections: ReceivablesSelection[];
  onUpdateSelection: (
    type: ReceivablesSelection['selection_type'],
    itemId: string,
    selected: boolean,
    amount: number,
    metadata?: any
  ) => Promise<boolean>;
}

export const ZohoReceivablesSection: React.FC<ZohoReceivablesSectionProps> = ({
  unpaidInvoices,
  selections,
  onUpdateSelection,
}) => {
  const { selectedInvoices, totalSelected, allSelected, someSelected, exportableInvoices } = useMemo(() => {
    const selectedInvoices = new Set(
      selections
        .filter(s => s.selection_type === 'zoho_invoices' && s.selected)
        .map(s => s.item_id)
    );

    const totalSelected = unpaidInvoices
      .filter(invoice => {
        const itemId = `${invoice.customer_name}-${invoice.balance}`;
        return selectedInvoices.has(itemId);
      })
      .reduce((total, invoice) => total + invoice.balance, 0);

    const allSelected = unpaidInvoices.length > 0 && 
      unpaidInvoices.every(invoice => {
        const itemId = `${invoice.customer_name}-${invoice.balance}`;
        return selectedInvoices.has(itemId);
      });

    const someSelected = unpaidInvoices.some(invoice => {
      const itemId = `${invoice.customer_name}-${invoice.balance}`;
      return selectedInvoices.has(itemId);
    });

    // Create exportable invoices data
    const exportableInvoices: ExportableInvoice[] = unpaidInvoices
      .filter(invoice => {
        const itemId = `${invoice.customer_name}-${invoice.balance}`;
        return selectedInvoices.has(itemId);
      })
      .map(invoice => ({
        customer_name: invoice.customer_name,
        company_name: invoice.company_name,
        amount: invoice.balance,
      }));

    return { selectedInvoices, totalSelected, allSelected, someSelected, exportableInvoices };
  }, [unpaidInvoices, selections]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSelectAll = async () => {
    const newSelectedState = !allSelected;
    
    for (const invoice of unpaidInvoices) {
      const itemId = `${invoice.customer_name}-${invoice.balance}`;
      await onUpdateSelection(
        'zoho_invoices',
        itemId,
        newSelectedState,
        invoice.balance,
        {
          customer_name: invoice.customer_name,
          company_name: invoice.company_name,
        }
      );
    }
  };

  const handleInvoiceToggle = async (invoice: typeof unpaidInvoices[0], selected: boolean) => {
    const itemId = `${invoice.customer_name}-${invoice.balance}`;
    await onUpdateSelection(
      'zoho_invoices',
      itemId,
      selected,
      invoice.balance,
      {
        customer_name: invoice.customer_name,
        company_name: invoice.company_name,
      }
    );
  };

  if (unpaidInvoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No unpaid Zoho invoices found
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
            {unpaidInvoices.length} invoices
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Selected Total</div>
          <div className="font-semibold text-primary">{formatCurrency(totalSelected)}</div>
        </div>
      </div>

      {/* Export buttons - only show when there are selected invoices */}
      {exportableInvoices.length > 0 && (
        <div className="flex justify-center py-2 border-b">
          <ExportButtons selectedInvoices={exportableInvoices} />
        </div>
      )}

      <div className="grid gap-3">
        {unpaidInvoices.map((invoice, index) => {
          const itemId = `${invoice.customer_name}-${invoice.balance}`;
          const isSelected = selectedInvoices.has(itemId);

          return (
            <Card key={index} className={`border transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleInvoiceToggle(invoice, checked as boolean)
                      }
                    />
                    <div>
                      <div className="font-medium">{invoice.customer_name}</div>
                      {invoice.company_name && (
                        <div className="text-sm text-muted-foreground">
                          {invoice.company_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(invoice.balance)}</div>
                    <div className="text-xs text-muted-foreground">Outstanding</div>
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
