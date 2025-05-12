
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

interface DashboardContentProps {
  financialData: FinancialData;
  periodTitle: string;
  handleRefresh: () => void;
  loading: boolean;
  dateRange: DateRange;
  stripeIncome: number;
  regularIncome: number;
  collaboratorExpenses: CategorySummary[];
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  financialData,
  periodTitle,
  handleRefresh,
  loading,
  dateRange,
  stripeIncome,
  regularIncome,
  collaboratorExpenses
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

  return (
    <>
      {/* Periodo y botón de actualización */}
      <PeriodHeader periodTitle={periodTitle} onRefresh={handleRefresh} />

      {/* Información de depuración */}
      {financialData.transactions.length === 0 && <EmptyStateWarning />}

      {/* Balance Mensual Inicial */}
      <div className="mb-6">
        <MonthlyBalanceEditor currentDate={dateRange.startDate} />
      </div>

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

import MonthlyBalanceEditor from '@/components/Dashboard/MonthlyBalanceEditor';

export default DashboardContent;
