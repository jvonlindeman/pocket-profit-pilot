
import React, { useEffect } from 'react';
import { useStoredFinancialSummaries } from '@/hooks/useStoredFinancialSummaries';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { formatFinancialDate } from '@/utils/financialUtils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, RefreshCcwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinancialHistorySummaryProps {
  startDate?: Date;
  endDate?: Date;
}

const FinancialHistorySummary: React.FC<FinancialHistorySummaryProps> = ({ startDate, endDate }) => {
  const { summaries, loading, error, loadSummaries } = useStoredFinancialSummaries({ 
    startDate, 
    endDate,
    autoLoad: true
  });
  
  const { formatCurrency, formatPercentage } = useFinanceFormatter();
  
  useEffect(() => {
    console.log("FinancialHistorySummary - Current summaries:", summaries);
  }, [summaries]);
  
  const handleRefresh = () => {
    loadSummaries();
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando historial financiero...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-8">
          <div className="animate-spin">
            <RefreshCcwIcon className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error al cargar historial financiero</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 mb-4">Ocurrió un error al cargar los datos históricos</p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCcwIcon className="h-4 w-4 mr-2" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!summaries || summaries.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>No hay datos históricos disponibles</CardTitle>
          <Button onClick={handleRefresh} variant="ghost" size="sm">
            <RefreshCcwIcon className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No se encontraron resúmenes financieros guardados para el rango de fechas seleccionado.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Historial Financiero</CardTitle>
        <Button onClick={handleRefresh} variant="ghost" size="sm">
          <RefreshCcwIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {summaries.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{formatFinancialDate(item.date)}</h3>
                <span className={`flex items-center ${item.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.summary.profit >= 0 ? (
                    <TrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {formatPercentage(item.summary.profitMargin)}
                </span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Ingresos</p>
                  <p className="font-semibold text-green-600 flex items-center">
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                    {formatCurrency(item.summary.totalIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Gastos</p>
                  <p className="font-semibold text-red-600 flex items-center">
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                    {formatCurrency(item.summary.totalExpense)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Colaboradores</p>
                  <p className="font-semibold">
                    {formatCurrency(item.summary.collaboratorExpense)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Otros gastos</p>
                  <p className="font-semibold">
                    {formatCurrency(item.summary.otherExpense)}
                  </p>
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-500">Beneficio</span>
                <span className={`font-bold ${item.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(item.summary.profit)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialHistorySummary;
