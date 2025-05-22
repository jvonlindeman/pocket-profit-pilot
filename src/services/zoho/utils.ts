
/**
 * Handle API errors with custom messaging
 */
export const handleApiError = (error: any, defaultMessage = 'Error en la API'): string => {
  console.error('API Error:', error);
  
  // Get a meaningful error message if possible
  let errorMessage = defaultMessage;
  
  if (error) {
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.details) {
      errorMessage = error.details;
    } else if (error.error) {
      errorMessage = error.error;
    }
  }
  
  // Return the most useful error message
  return errorMessage;
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString || 'Fecha desconocida';
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'PAB'
  }).format(amount);
};
