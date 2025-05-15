
import { useState, useCallback } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import * as ZohoService from '@/services/zohoService';
import { getCurrentMonthRange } from '@/utils/dateUtils';

export interface FinancialDateRange {
  startDate: Date;
  endDate: Date;
}

export function useFinancialDateRange() {
  // Estado del rango de fechas - configurado para mostrar el mes actual (desde el primer día hasta el último día)
  const [dateRange, setDateRange] = useState<FinancialDateRange>(() => {
    const today = new Date();
    // Primer día del mes actual
    const startDate = startOfMonth(today);
    // Último día del mes actual
    const endDate = endOfMonth(today);
    console.log("Initial date range:", startDate, "to", endDate);
    return { startDate, endDate };
  });

  // Función para actualizar el rango de fechas
  const updateDateRange = useCallback((newRange: FinancialDateRange) => {
    console.log("Date range updated:", newRange);
    
    // Create shallow copies to preserve the exact selected dates
    const preservedStartDate = new Date(newRange.startDate);
    const preservedEndDate = new Date(newRange.endDate);
    
    setDateRange({
      startDate: preservedStartDate,
      endDate: preservedEndDate
    });
    
    // Check if we need to refresh the cache
    ZohoService.checkAndRefreshCache(preservedStartDate, preservedEndDate);
  }, []);

  return {
    dateRange,
    updateDateRange,
    getCurrentMonthRange
  };
}
