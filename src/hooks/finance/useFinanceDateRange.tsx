
import { useState, useCallback } from 'react';
import { endOfMonth, subMonths, startOfMonth } from 'date-fns';
import { DateRange } from '@/types/financial';

export const useFinanceDateRange = () => {
  // Function to format date in YYYY-MM-DD format without timezone shifts
  // Define this function BEFORE using it in useState initialization
  const formatDateYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Estado del rango de fechas - configurado para mostrar desde el primer día del mes anterior hasta el último día del mes actual
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    // Primer día del mes anterior
    const startDate = startOfMonth(subMonths(today, 1));
    // Último día del mes actual
    const endDate = endOfMonth(today);
    console.log("Initial date range:", 
      formatDateYYYYMMDD(startDate), "to", 
      formatDateYYYYMMDD(endDate)
    );
    return { startDate, endDate };
  });

  // Obtener el rango del mes actual
  const getCurrentMonthRange = useCallback(() => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = endOfMonth(today);
    console.log("Current month range:", 
      formatDateYYYYMMDD(startDate), "to", 
      formatDateYYYYMMDD(endDate)
    );
    return { startDate, endDate };
  }, []);

  // Función para actualizar el rango de fechas
  const updateDateRange = useCallback((newRange: { startDate: Date; endDate: Date }) => {
    console.log("Date range updated:", 
      formatDateYYYYMMDD(newRange.startDate), "to", 
      formatDateYYYYMMDD(newRange.endDate)
    );
    
    // Create shallow copies to preserve the exact selected dates
    const preservedStartDate = new Date(newRange.startDate);
    const preservedEndDate = new Date(newRange.endDate);
    
    setDateRange({
      startDate: preservedStartDate,
      endDate: preservedEndDate
    });
  }, []);

  return {
    dateRange,
    updateDateRange,
    getCurrentMonthRange,
    formatDateYYYYMMDD
  };
};
