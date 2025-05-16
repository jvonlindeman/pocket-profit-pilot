
/**
 * Utility functions for financial data processing
 */

/**
 * Check if a category name represents a collaborator expense
 * This creates a single source of truth for identifying collaborator expenses
 */
export const isCollaboratorExpense = (categoryName: string): boolean => {
  if (!categoryName) return false;
  
  // Case-insensitive check for collaborator-related categories
  const lowerCaseCategory = categoryName.toLowerCase();
  return (
    lowerCaseCategory.includes('colaborador') || 
    lowerCaseCategory.includes('pagos a colaboradores')
  );
};

/**
 * Format a number as currency with the specified locale and currency
 */
export const formatAsCurrency = (
  amount: number, 
  locale: string = 'en-US', 
  currency: string = 'USD'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Calculate the percentage of a value relative to a total
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Validate a financial value to ensure it's a proper number
 */
export const validateFinancialValue = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(numValue) ? 0 : numValue;
};
