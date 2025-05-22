
/**
 * Utility functions for processing webhook data
 */

// Helper to determine if an item is an array of income records
export const isIncomeArray = (item: any): boolean => {
  return Array.isArray(item) && 
         item.length > 0 && 
         typeof item[0] === 'object' && 
         'customer_name' in item[0] && 
         'amount' in item[0];
};

// Helper to check for collaborator data
export const isCollaboratorArray = (item: any): boolean => {
  return Array.isArray(item) && 
         item.length > 0 && 
         typeof item[0] === 'object' && 
         'vendor_name' in item[0] && 
         'total' in item[0];
};

// Helper to format a date for display
export const formatDateForDisplay = (dateString: string): string => {
  try {
    // Use a safer date parsing method
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('es-ES').format(date);
    } 
    return dateString; // Return original if parsing fails
  } catch (error) {
    return dateString;
  }
};

// Count items by type in webhook data
export const countWebhookItems = (data: any): Record<string, number> => {
  return {
    incomes: Array.isArray(data?.payments) ? data.payments.length : 0,
    expenses: Array.isArray(data?.expenses) ? data.expenses.length : 0,
    collaborators: Array.isArray(data?.colaboradores) ? data.colaboradores.length : 0,
    cachedTransactions: Array.isArray(data?.cached_transactions) ? data.cached_transactions.length : 0,
  };
};

// Extract examples from arrays
export const extractExamples = (array: any[], count: number = 3): any[] => {
  if (!Array.isArray(array) || array.length === 0) return [];
  return array.slice(0, count);
};

// Extract summary statistics from webhook data
export const extractWebhookSummary = (data: any) => {
  if (!data) return null;
  
  const counts = countWebhookItems(data);
  
  return {
    counts,
    hasData: Object.values(counts).some(count => count > 0),
    incomeExamples: extractExamples(data?.payments || []),
    expenseExamples: extractExamples(data?.expenses || []),
    collaboratorExamples: extractExamples(data?.colaboradores || []),
  };
};
