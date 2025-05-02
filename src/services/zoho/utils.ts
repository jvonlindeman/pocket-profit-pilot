
import { toast } from "@/hooks/use-toast";

// Helper function to get the current year
export const getCurrentYear = () => new Date().getFullYear();

// Helper function to ensure valid date format
export const ensureValidDateFormat = (dateStr: string) => {
  try {
    // Check if the date string is already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Try to parse the date and format it as YYYY-MM-DD
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // If we can't parse it, use the current date
    console.warn(`Invalid date format detected: ${dateStr}, using current date instead`);
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.error(`Error processing date: ${dateStr}`, error);
    return new Date().toISOString().split('T')[0];
  }
};

// Helper function to handle API errors and provide better user feedback
export const handleApiError = (error: any, message: string) => {
  console.error(`ZohoService error: ${message}`, error);
  
  let errorMessage = message;
  
  // Extract more specific error messages from the response if available
  if (error?.details) {
    if (typeof error.details === 'string') {
      // Check for common errors
      if (error.details.includes('domain')) {
        errorMessage = 'Error al comunicarse con make.com. Por favor, intente de nuevo más tarde.';
      } else if (error.details.includes('invalid_organization')) {
        errorMessage = 'Error de configuración. Por favor, contacte al administrador.';
      } else if (error.details.includes('invalid_token')) {
        errorMessage = 'Error de autenticación con Zoho Books. Por favor, contacte al administrador.';
      } else if (error.details.includes('<!DOCTYPE html>')) {
        errorMessage = 'Error de comunicación con make.com. Por favor, intente de nuevo más tarde.';
      } else if (error?.message) {
        errorMessage = `${message}: ${error.message}`;
      }
    }
  }
  
  toast({
    title: 'Error de Zoho Books',
    description: errorMessage,
    variant: 'destructive'
  });
  
  return errorMessage;
};
