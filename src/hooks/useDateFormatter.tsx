
import { useCallback } from 'react';

export function useDateFormatter() {
  // Format dates for titles with safety check
  const formatDateForTitle = useCallback((date: Date | undefined) => {
    if (!date) return 'Fecha inválida';
    
    try {
      return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date for title:", error);
      return 'Fecha inválida';
    }
  }, []);

  // Create period title from a date range
  const createPeriodTitle = useCallback((startDate?: Date, endDate?: Date) => {
    return startDate && endDate 
      ? `${formatDateForTitle(startDate)} - ${formatDateForTitle(endDate)}`
      : 'Periodo no seleccionado';
  }, [formatDateForTitle]);

  return {
    formatDateForTitle,
    createPeriodTitle
  };
}
