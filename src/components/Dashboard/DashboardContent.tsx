
import React from 'react';
import FinanceSummary from '@/components/Dashboard/FinanceSummary';
import RevenueChart from '@/components/Dashboard/RevenueChart';
import ExpenseChart from '@/components/Dashboard/ExpenseChart';
import CollaboratorChart from '@/components/Dashboard/CollaboratorChart';
import ProfitAnalysis from '@/components/Dashboard/ProfitAnalysis';
import TransactionList from '@/components/Dashboard/TransactionList';
import { FinancialData, CategorySummary, DateRange } from '@/types/financial';
import EmptyStateWarning from './EmptyStateWarning';
import PeriodHeader from './PeriodHeader';
import MonthlyBalanceEditor from '@/components/Dashboard/MonthlyBalanceEditor';

interface DashboardContentProps {
  financialData: FinancialData;
  periodTitle: string;
  handleRefresh: () => void;
  loading: boolean;
  dateRange: DateRange;
  stripeIncome: number;
  regularIncome: number;
  collaboratorExpenses: CategorySummary[];
  stripeOverride?: number | null;
  onStripeOverrideChange?: (value: number | null) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  financialData,
  periodTitle,
  handleRefresh,
  loading,
  dateRange,
  stripeIncome,
  regularIncome,
  collaboratorExpenses,
  stripeOverride,
  onStripeOverrideChange
}) => {
  // Prepare Stripe data for chart
  const getStripeDataForChart = () => {
    // Si solo hay un valor de Stripe para todo el período, distribúyelo a lo largo del gráfico
    if (stripeIncome > 0) {
      const labels = financialData.dailyData.income.labels;
      const values = new Array(labels.length).fill(stripeIncome / labels.length);
      return { labels, values };
    }
    return { labels: [], values: [] };
  };

  // Handle Stripe override change
  const handleStripeOverrideChange = (value: number | null) => {
    if (onStripeOverrideChange) {
      onStripeOverrideChange(value);
    }
  };

  return (
    <>
      {/* Periodo y botón de actualización */}
      <PeriodHeader periodTitle={periodTitle} onRefresh={handleRefresh} />

      {/* Información de depuración */}
      {financialData.transactions.length === 0 && <EmptyStateWarning />}

      {/* Balance Mensual Inicial y Override de Stripe */}
      <div className="mb-6">
        <MonthlyBalanceEditor 
          currentDate={dateRange.startDate} 
          onStripeOverrideChange={handleStripeOverrideChange}
        />
      </div>

      {/* Mensaje de stripe override si está activo */}
      {stripeOverride !== null && stripeOverride !== undefined && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 mb-6">
          <p className="font-medium">Valor manual de Stripe: ${stripeOverride.toFixed(2)}</p>
          <p className="mt-1 text-sm">
            Los ingresos de Stripe mostrados son valores introducidos manualmente, no datos calculados.
          </p>
        </div>
      )}

      {/* Resumen financiero */}
      <FinanceSummary 
        summary={financialData.summary} 
        expenseCategories={financialData.expenseByCategory}
        stripeIncome={stripeIncome}
        regularIncome={regularIncome}
      />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RevenueChart 
          incomeData={financialData.dailyData.income} 
          expenseData={financialData.dailyData.expense}
          stripeData={getStripeDataForChart()}
        />
        <ExpenseChart expenseData={financialData.expenseByCategory} />
      </div>

      {/* Nuevo gráfico de colaboradores */}
      {collaboratorExpenses && collaboratorExpenses.length > 0 && (
        <div className="mt-6">
          <CollaboratorChart collaboratorData={collaboratorExpenses} />
        </div>
      )}

      {/* Análisis de rentabilidad */}
      <div className="mt-6">
        <ProfitAnalysis monthlyData={financialData.monthlyData} />
      </div>

      {/* Listado de transacciones */}
      <div className="mt-6">
        <TransactionList 
          transactions={financialData.transactions} 
          onRefresh={handleRefresh}
          isLoading={loading}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />
      </div>
    </>
  );
};

export default DashboardContent;
