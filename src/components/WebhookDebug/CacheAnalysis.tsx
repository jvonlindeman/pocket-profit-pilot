
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, CalendarIcon, DatabaseIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CacheAnalysisProps {
  onUpdate?: () => void;
}

interface MonthStats {
  monthYear: string;
  firstDate: string | null;
  lastDate: string | null;
  count: number;
  formattedMonth: string;
}

// Response types for the Supabase RPC functions
interface MonthYearResult {
  month_year: string;
}

interface DateRangeResult {
  min_date: string | null;
  max_date: string | null;
}

// Format month-year string for display
const formatMonthYear = (monthYear: string): string => {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  
  return date.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });
};

const CacheAnalysis: React.FC<CacheAnalysisProps> = ({ onUpdate }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<MonthStats[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);

  // Load cache statistics when component mounts
  useEffect(() => {
    analyzeCache();
  }, []);

  // Function to analyze cache by month
  const analyzeCache = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all unique month-years
      const { data: monthsData, error: monthsError } = await supabase
        .rpc('get_unique_months_with_transactions');
      
      if (monthsError) {
        throw new Error(`Error getting unique months: ${monthsError.message}`);
      }
      
      if (!monthsData || !Array.isArray(monthsData) || monthsData.length === 0) {
        setMonths([]);
        setTotalTransactions(0);
        setLoading(false);
        return;
      }
      
      // For each month, get stats
      const monthsWithStats: MonthStats[] = [];
      let totalCount = 0;
      
      for (const monthObj of monthsData) {
        const monthYear = monthObj.month_year;
        
        // Get first and last date for this month
        const { data: dateRangeData, error: dateRangeError } = await supabase
          .rpc('get_month_transaction_range', { month_year_param: monthYear });
          
        if (dateRangeError) {
          console.error(`Error getting date range for ${monthYear}:`, dateRangeError);
          continue;
        }
        
        // Get count for this month
        const { count, error: countError } = await supabase
          .from('cached_transactions')
          .select('*', { count: 'exact', head: true })
          .like('date', `${monthYear}-%`);
          
        if (countError) {
          console.error(`Error getting count for ${monthYear}:`, countError);
          continue;
        }
        
        const monthCount = count || 0;
        totalCount += monthCount;
        
        if (dateRangeData && Array.isArray(dateRangeData) && dateRangeData.length > 0) {
          const stats = dateRangeData[0];
          
          monthsWithStats.push({
            monthYear,
            firstDate: stats.min_date,
            lastDate: stats.max_date,
            count: monthCount,
            formattedMonth: formatMonthYear(monthYear)
          });
        }
      }
      
      // Sort by most recent first
      monthsWithStats.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
      
      setMonths(monthsWithStats);
      setTotalTransactions(totalCount);
      
    } catch (err) {
      console.error('Error analyzing cache:', err);
      setError(err instanceof Error ? err.message : 'Unknown error analyzing cache');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-2">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium flex items-center">
            <DatabaseIcon className="h-4 w-4 mr-2 text-blue-500" />
            Análisis de Caché por Mes
          </div>
          <button 
            onClick={analyzeCache} 
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            Actualizar
          </button>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-800 p-2 rounded-md text-xs">
            Error: {error}
          </div>
        )}

        {!loading && !error && months.length === 0 && (
          <div className="text-center text-gray-500 py-4 text-sm">
            No hay datos en caché
          </div>
        )}

        {!loading && !error && months.length > 0 && (
          <>
            <div className="text-xs text-gray-500 mb-2">
              <span className="font-medium">{totalTransactions}</span> transacciones en caché en total
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Mes</th>
                    <th className="text-left p-2">Rango de Fechas</th>
                    <th className="text-right p-2">Transacciones</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map(month => (
                    <tr key={month.monthYear} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-2">{month.formattedMonth}</td>
                      <td className="p-2 text-gray-600">
                        {month.firstDate && month.lastDate ? (
                          <span className="flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1 text-gray-400" />
                            {new Date(month.firstDate).toLocaleDateString()} - {new Date(month.lastDate).toLocaleDateString()}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td className="p-2 text-right font-medium">{month.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CacheAnalysis;
