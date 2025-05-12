
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface WebhookDataTableProps {
  rawData: any;
}

const WebhookDataTable: React.FC<WebhookDataTableProps> = ({ rawData }) => {
  if (!rawData) return null;
  
  // Helper function to format currency values
  const formatCurrency = (value: any) => {
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(',', '.')) 
      : parseFloat(String(value));
      
    if (isNaN(numValue)) return value;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numValue);
  };
  
  // Extract data from different sections of the response
  const renderStripeData = () => {
    if (!rawData.stripe) return null;
    
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Stripe Income</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{formatCurrency(rawData.stripe)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };
  
  const renderCollaboratorData = () => {
    if (!rawData.colaboradores || !Array.isArray(rawData.colaboradores) || rawData.colaboradores.length === 0) 
      return null;
    
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Collaborator Expenses ({rawData.colaboradores.length})</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rawData.colaboradores.map((collab: any, index: number) => (
              <TableRow key={`collab-${index}`}>
                <TableCell>{collab.date}</TableCell>
                <TableCell>{collab.vendor_name}</TableCell>
                <TableCell>{formatCurrency(collab.total)}</TableCell>
                <TableCell>{collab.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  const renderExpensesData = () => {
    if (!rawData.expenses || !Array.isArray(rawData.expenses) || rawData.expenses.length === 0) 
      return null;
    
    // Limit to first 10 expenses for better UI
    const displayExpenses = rawData.expenses.slice(0, 10);
    
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">
          Expenses ({rawData.expenses.length})
          {rawData.expenses.length > 10 && ` - Showing first 10 of ${rawData.expenses.length}`}
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayExpenses.map((expense: any, index: number) => (
              <TableRow key={`expense-${index}`}>
                <TableCell>{expense.date}</TableCell>
                <TableCell>{expense.vendor_name || 'N/A'}</TableCell>
                <TableCell>{expense.account_name}</TableCell>
                <TableCell>{formatCurrency(expense.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  const renderPaymentsData = () => {
    if (!rawData.payments || !Array.isArray(rawData.payments) || rawData.payments.length === 0) 
      return null;
    
    // Limit to first 10 payments for better UI
    const displayPayments = rawData.payments.slice(0, 10);
    
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">
          Payments ({rawData.payments.length})
          {rawData.payments.length > 10 && ` - Showing first 10 of ${rawData.payments.length}`}
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayPayments.map((payment: any, index: number) => (
              <TableRow key={`payment-${index}`}>
                <TableCell>{payment.date}</TableCell>
                <TableCell>{payment.customer_name}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {renderStripeData()}
      {renderCollaboratorData()}
      {renderExpensesData()}
      {renderPaymentsData()}
    </div>
  );
};

export default WebhookDataTable;
