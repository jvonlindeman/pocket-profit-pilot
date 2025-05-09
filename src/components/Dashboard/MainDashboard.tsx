
import React from 'react';
import FinanceSummary from '@/components/Dashboard/FinanceSummary/index';
import RevenueChart from '@/components/Dashboard/RevenueChart';
import ExpenseChart from '@/components/Dashboard/ExpenseChart';
import CollaboratorChart from '@/components/Dashboard/CollaboratorChart';
import ProfitAnalysis from '@/components/Dashboard/ProfitAnalysis';
import TransactionList from '@/components/Dashboard/TransactionList';
import MonthlyBalanceEditor from '@/components/Dashboard/MonthlyBalanceEditor';
import { FinancialData, DateRange } from '@/types/financial';

interface MainDashboardProps {
  financialData: FinancialData;
  stripeIncome: number;
  regularIncome: number;
  stripeOverride: any;
  collaboratorExpenses: any[];
  dateRange: DateRange;
  handleRefresh: () => void;
  loading: boolean;
  getStripeDataForChart: () => { labels: string[], values: number[] };
}

const MainDashboard: React.FC<MainDashboardProps> = ({
  financialData,
  stripeIncome,
  regularIncome,
  stripeOverride,
  collaboratorExpenses,
  dateRange,
  handleRefresh,
  loading,
  getStripeDataForChart
}) => {
  return (
    <>
      {/* Balance Mensual Inicial */}
      <div className="mb-6">
        <MonthlyBalanceEditor 
          currentDate={dateRange.startDate}
          onBalanceChange={(newBalance) => {
            console.log('Balance changed to:', newBalance);
            // Refresh data after balance change
            handleRefresh();
          }}
        />
      </div>

      {/* Resumen financiero */}
      <FinanceSummary 
        summary={financialData.summary} 
        expenseCategories={financialData.expenseByCategory}
        stripeIncome={stripeIncome}
        regularIncome={regularIncome}
        stripeOverride={stripeOverride}
      />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RevenueChart 
          incomeData={financialData.dailyData?.income || { labels: [], values: [] }} 
          expenseData={financialData.dailyData?.expense || { labels: [], values: [] }}
          stripeData={getStripeDataForChart()}
        />
        <ExpenseChart expenseData={financialData.expenseByCategory || []} />
      </div>

      {/* Nuevo gráfico de colaboradores */}
      {collaboratorExpenses && collaboratorExpenses.length > 0 && (
        <div className="mt-6">
          <CollaboratorChart collaboratorData={collaboratorExpenses} />
        </div>
      )}

      {/* Análisis de rentabilidad */}
      <div className="mt-6">
        <ProfitAnalysis monthlyData={financialData.monthlyData || {
          income: { labels: [], values: [] },
          expense: { labels: [], values: [] },
          profit: { labels: [], values: [] }
        }} />
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

export default MainDashboard;
