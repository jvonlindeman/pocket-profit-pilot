
import React from 'react';
import FinancialSummaryCard from './FinancialSummaryCard';
import FinancialCharts from './FinancialCharts';
import TransactionsTable from './TransactionsTable';
import DateRangeSelector from './DateRangeSelector';
import { useFinanceData } from '@/hooks/useFinanceData';
import { Skeleton } from '@/components/ui/skeleton';
import StripeTransactionManager from './StripeTransactionManager';
import MonthlyBalanceInput from './MonthlyBalanceInput';
import CacheStatusDisplay from './CacheStatusDisplay';

const DashboardContent: React.FC = () => {
  const {
    financialData,
    loading,
    dataInitialized,
    refreshData,
    clearCacheAndRefresh,
    forceManualRefresh,
    dateRange,
    updateDateRange,
    startingBalance,
    stripeOverride,
    usingCachedData,
    partialRefresh,
    cacheStats,
    isRefreshing,
    refreshCount
  } = useFinanceData();

  const handleDateRangeChanged = (newStartDate: Date, newEndDate: Date) => {
    if (newStartDate && newEndDate) {
      updateDateRange({
        startDate: newStartDate,
        endDate: newEndDate
      });
    }
  };

  const handleStripeTransactionAdded = () => {
    // Force a refresh when a new Stripe transaction is added
    refreshData(true);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 lg:w-2/3">
          <DateRangeSelector
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onDateRangeChanged={handleDateRangeChanged}
          />
        </div>
        <div className="w-full md:w-1/2 lg:w-1/3">
          <CacheStatusDisplay
            usingCachedData={usingCachedData}
            partialRefresh={partialRefresh}
            cacheStats={cacheStats}
            lastRefresh={cacheStats?.lastRefresh || null}
            onRefreshClick={forceManualRefresh}
            isRefreshing={isRefreshing}
            refreshCount={refreshCount}
          />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <MonthlyBalanceInput
            currentDate={dateRange.startDate}
          />
        </div>
        <div className="w-full md:w-1/2">
          <StripeTransactionManager
            onTransactionAdded={handleStripeTransactionAdded}
            currentDate={dateRange.startDate}
            stripeOverride={stripeOverride}
          />
        </div>
      </div>
      
      {loading && !dataInitialized ? (
        <div className="space-y-4">
          <Skeleton className="w-full h-48" />
          <Skeleton className="w-full h-64" />
        </div>
      ) : (
        <>
          <FinancialSummaryCard
            summary={financialData.summary}
            startingBalance={startingBalance}
            isLoading={loading}
            onRefreshClick={refreshData}
          />
          <FinancialCharts
            monthlyData={financialData.monthlyData}
            dailyData={financialData.dailyData}
            expenseByCategory={financialData.expenseByCategory}
            incomeBySource={financialData.incomeBySource}
          />
          <TransactionsTable 
            transactions={financialData.transactions} 
            onClearCacheClick={clearCacheAndRefresh}
          />
        </>
      )}
    </div>
  );
};

export default DashboardContent;
