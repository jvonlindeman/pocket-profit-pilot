
import { useState, useEffect, useMemo } from 'react';
import ZohoService from '../services/zohoService';
import StripeService from '../services/stripeService';
import { Transaction, FinancialData, FinancialSummary, CategorySummary, DateRange, ChartData } from '../types/financial';
import { useToast } from '@/hooks/use-toast';

// Define el formato de fecha para gráficos
const formatDateForChart = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  });
};

// Función para obtener el primer y último día del mes actual
const getCurrentMonthRange = (): DateRange => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return { startDate: firstDay, endDate: lastDay };
};

export const useFinanceData = (initialDateRange?: DateRange) => {
  // Si no se proporciona un rango de fechas, usamos el mes actual
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange || getCurrentMonthRange());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Función para actualizar el rango de fechas
  const updateDateRange = (newRange: DateRange) => {
    console.log("Updating date range to:", newRange);
    setDateRange(newRange);
  };
  
  // Función para forzar la actualización de datos
  const refreshData = (forceRefresh = false) => {
    console.log("Forcing data refresh, forceRefresh =", forceRefresh);
    fetchData(dateRange.startDate, dateRange.endDate, forceRefresh);
  };

  // Función para obtener los datos
  const fetchData = async (startDate: Date, endDate: Date, forceRefresh = false) => {
    console.log("Fetching data from", startDate, "to", endDate, "forceRefresh =", forceRefresh);
    setLoading(true);
    setError(null);
    try {
      // Obtenemos datos de ambas fuentes
      const zohoTransactions = await ZohoService.getTransactions(startDate, endDate, forceRefresh);
      const stripeTransactions = await StripeService.getTransactions(startDate, endDate);
      
      console.log("Zoho transactions:", zohoTransactions.length);
      console.log("Stripe transactions:", stripeTransactions.length);
      
      // Combinamos los resultados
      const allTransactions = [...zohoTransactions, ...stripeTransactions];
      
      // Ordenamos por fecha
      allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log("Combined transactions:", allTransactions.length);
      setTransactions(allTransactions);
    } catch (err: any) {
      console.error('Error fetching financial data:', err);
      setError(err.message || 'Error al cargar datos financieros. Por favor, intente nuevamente.');
      
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos financieros',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos cuando cambia el rango de fechas
  useEffect(() => {
    console.log("Date range changed, fetching new data");
    fetchData(dateRange.startDate, dateRange.endDate);
  }, [dateRange]);

  // Calculamos el resumen financiero basado en las transacciones
  const financialSummary = useMemo<FinancialSummary>(() => {
    console.log("Recalculating financial summary with", transactions.length, "transactions");
    
    const incomeTransactions = transactions.filter(tx => tx.type === 'income');
    const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
    
    console.log("Income transactions:", incomeTransactions.length);
    console.log("Expense transactions:", expenseTransactions.length);
    
    const totalIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    console.log("Total income:", totalIncome);
    console.log("Total expense:", totalExpense);
    
    const profit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
    
    return {
      totalIncome,
      totalExpense,
      profit,
      profitMargin
    };
  }, [transactions]);

  // Calculamos el resumen por categoría de ingresos
  const incomeBySource = useMemo<CategorySummary[]>(() => {
    const incomeTransactions = transactions.filter(tx => tx.type === 'income');
    const totalIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    const categories: Record<string, number> = {};
    
    incomeTransactions.forEach(tx => {
      if (!categories[tx.category]) {
        categories[tx.category] = 0;
      }
      categories[tx.category] += tx.amount;
    });
    
    return Object.entries(categories).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Calculamos el resumen por categoría de gastos
  const expenseByCategory = useMemo<CategorySummary[]>(() => {
    const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
    const totalExpense = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    const categories: Record<string, number> = {};
    
    expenseTransactions.forEach(tx => {
      if (!categories[tx.category]) {
        categories[tx.category] = 0;
      }
      categories[tx.category] += tx.amount;
    });
    
    return Object.entries(categories).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Preparamos datos diarios para gráficos
  const dailyData = useMemo(() => {
    // Obtenemos todas las fechas en el rango
    const dates: Date[] = [];
    const currentDate = new Date(dateRange.startDate);
    const endDateValue = new Date(dateRange.endDate);
    
    console.log("Preparing daily data from", currentDate, "to", endDateValue);
    
    while (currentDate <= endDateValue) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log("Total days in range:", dates.length);
    
    // Inicializamos datos para ingresos y gastos
    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};
    
    // Inicializamos con cero para todas las fechas
    dates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      incomeMap[dateStr] = 0;
      expenseMap[dateStr] = 0;
    });
    
    // Sumamos las transacciones por día
    transactions.forEach(tx => {
      const dateStr = tx.date;
      if (tx.type === 'income') {
        incomeMap[dateStr] = (incomeMap[dateStr] || 0) + tx.amount;
      } else {
        expenseMap[dateStr] = (expenseMap[dateStr] || 0) + tx.amount;
      }
    });
    
    // Formateamos para gráficos
    const income: ChartData = {
      labels: dates.map(date => formatDateForChart(date)),
      values: dates.map(date => incomeMap[date.toISOString().split('T')[0]] || 0)
    };
    
    const expense: ChartData = {
      labels: dates.map(date => formatDateForChart(date)),
      values: dates.map(date => expenseMap[date.toISOString().split('T')[0]] || 0)
    };
    
    return { income, expense };
  }, [transactions, dateRange]);

  // Datos mensuales (usaremos los datos actuales para el último mes)
  const monthlyData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Crear un array de los últimos 5 meses
    const lastMonthsLabels = [];
    for (let i = 4; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12; // Ensure it's always positive
      lastMonthsLabels.push(months[monthIndex]);
    }
    
    // Valores de ejemplo para los meses anteriores
    const incomeValues = [12500, 15000, 13200, 16700, financialSummary.totalIncome];
    const expenseValues = [8200, 9500, 7800, 10200, financialSummary.totalExpense];
    const profitValues = incomeValues.map((inc, idx) => inc - expenseValues[idx]);
    
    return {
      income: {
        labels: lastMonthsLabels,
        values: incomeValues
      },
      expense: {
        labels: lastMonthsLabels,
        values: expenseValues
      },
      profit: {
        labels: lastMonthsLabels,
        values: profitValues
      }
    };
  }, [financialSummary]);

  // Reunimos todos los datos financieros en un objeto
  const financialData: FinancialData = {
    summary: financialSummary,
    transactions,
    incomeBySource,
    expenseByCategory,
    dailyData,
    monthlyData
  };

  return {
    dateRange,
    updateDateRange,
    financialData,
    loading,
    error,
    getCurrentMonthRange,
    refreshData
  };
};

export default useFinanceData;
