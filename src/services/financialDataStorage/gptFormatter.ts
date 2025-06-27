
import { StoredFinancialSnapshot } from './types';

export class GPTFormatter {
  /**
   * Format data for GPT context
   */
  static formatForGPTContext(snapshot: StoredFinancialSnapshot): string {
    const data = snapshot.data;
    const dateRange = `${new Date(snapshot.dateRange.startDate).toLocaleDateString()} - ${new Date(snapshot.dateRange.endDate).toLocaleDateString()}`;
    
    return `
FINANCIAL DATA SNAPSHOT (${dateRange})
Captured: ${new Date(snapshot.timestamp).toLocaleString()}
Data Source: ${snapshot.metadata.dataSource}
Using Cached Data: ${snapshot.metadata.usingCachedData ? 'Yes' : 'No'}

SUMMARY:
- Total Income: $${data.summary?.totalIncome?.toLocaleString() || 0}
- Total Expenses: $${data.summary?.totalExpense?.toLocaleString() || 0}
- Profit: $${data.summary?.profit?.toLocaleString() || 0}
- Profit Margin: ${data.summary?.profitMargin?.toFixed(1) || 0}%
- Starting Balance: $${data.startingBalance?.toLocaleString() || 0}

INCOME BREAKDOWN:
- Stripe Income: $${data.stripeIncome?.toLocaleString() || 0}
- Stripe Fees: $${data.stripeFees?.toLocaleString() || 0}
- Stripe Net: $${data.stripeNet?.toLocaleString() || 0}
- Regular Income: $${data.regularIncome?.toLocaleString() || 0}

TRANSACTIONS:
- Total Transactions: ${data.transactions?.length || 0}
- Zoho Transactions: ${data.zohoTransactions?.length || 0}
- Stripe Transactions: ${data.stripeTransactions?.length || 0}
- Collaborator Expenses: ${data.collaboratorExpenses?.length || 0}
- Unpaid Invoices: ${data.unpaidInvoices?.length || 0}

RECENT TRANSACTIONS:
${data.transactions?.slice(0, 10).map((tx: any, index: number) => 
  `${index + 1}. ${tx.date} - ${tx.description} - $${tx.amount} (${tx.type})`
).join('\n') || 'No transaction data available'}
    `.trim();
  }
}
