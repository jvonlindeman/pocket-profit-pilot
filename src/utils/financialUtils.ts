
/**
 * Utilities for financial data processing and formatting
 */

/**
 * Safely converts any value to a number, handling various string formats
 * @param value The value to convert to a number
 * @returns A numeric value or 0 if conversion fails
 */
export const safeParseNumber = (value: unknown): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  
  // If it's already a number, return it
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  // Convert to string to handle all cases
  const strValue = String(value);
  
  // Handle European number format (e.g. "1.234,56")
  if (strValue.includes(',') && strValue.includes('.')) {
    // Remove thousands separators and replace decimal comma
    return parseFloat(strValue.replace(/\./g, '').replace(',', '.'));
  }
  
  // Handle comma as decimal separator (e.g. "1234,56")
  if (strValue.includes(',') && !strValue.includes('.')) {
    return parseFloat(strValue.replace(',', '.'));
  }
  
  // Standard number parsing
  const result = parseFloat(strValue);
  return isNaN(result) ? 0 : result;
};

/**
 * Formats a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formats a number as percentage
 * @param value The value to format as percentage
 * @param digits Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, digits: number = 1): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value / 100);
};

/**
 * Type guard to check if a value is a valid number
 */
export const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Calculate percentage safely
 * @param part The part value
 * @param total The total value
 * @returns The percentage as a number between 0-100
 */
export const calculatePercentage = (part: number, total: number): number => {
  if (!total) return 0;
  return (part / total) * 100;
};

/**
 * Process raw financial data from API into standardized format
 * @param rawData Raw financial data from API
 * @returns Processed financial data
 */
export const processFinancialData = (rawData: any): any => {
  if (!rawData) return null;
  
  console.log('Processing financial data:', rawData);
  
  // Extract and normalize transactions
  let transactions = [];
  if (rawData.cached_transactions && Array.isArray(rawData.cached_transactions)) {
    transactions = rawData.cached_transactions.map((tx: any) => ({
      id: tx.id || '',
      date: tx.date || '',
      amount: safeParseNumber(tx.amount),
      description: tx.description || '',
      category: tx.category || '',
      source: tx.source === 'Stripe' ? 'Stripe' : 'Zoho',
      type: tx.type === 'income' ? 'income' : 'expense'
    }));
  }
  
  console.log(`Processed ${transactions.length} transactions`);
  
  return {
    transactions,
    // Additional processing as needed
  };
};
