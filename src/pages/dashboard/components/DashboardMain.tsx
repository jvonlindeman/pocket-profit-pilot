
import React from 'react';
import { useDashboard } from '../context/DashboardProvider';
import DashboardContent from '@/components/Dashboard/DashboardContent';
import DebugSection from '@/components/Dashboard/DebugTools/DebugSection';

const DashboardMain: React.FC = () => {
  const {
    dateRange,
    periodTitle,
    financialData,
    currentMonthDate,
    startingBalance,
    refreshData,
    handleBalanceChange,
    handleRefresh,
    loading,
    stripeIncome,
    stripeFees,
    stripeTransactionFees,
    stripePayoutFees,
    stripeAdditionalFees,
    stripeNet,
    stripeFeePercentage,
    regularIncome,
    monthlyBalance,
    totalZohoExpenses,
    rawResponse,
  } = useDashboard();

  return (
    <>
      <DashboardContent 
        periodTitle={periodTitle}
        dateRange={dateRange}
        financialData={financialData}
        currentMonthDate={currentMonthDate}
        startingBalance={startingBalance}
        refreshData={refreshData}
        handleBalanceChange={handleBalanceChange}
        handleRefresh={handleRefresh}
        loading={loading}
        stripeIncome={stripeIncome}
        stripeFees={stripeFees}
        stripeTransactionFees={stripeTransactionFees}
        stripePayoutFees={stripePayoutFees}
        stripeAdditionalFees={stripeAdditionalFees}
        stripeNet={stripeNet}
        stripeFeePercentage={stripeFeePercentage}
        regularIncome={regularIncome}
        monthlyBalance={monthlyBalance}
        totalZohoExpenses={totalZohoExpenses}
      />
      
      {/* Debug section */}
      <DebugSection 
        dateRange={dateRange}
        refreshData={refreshData}
        rawResponse={rawResponse}
      />
    </>
  );
};

export default DashboardMain;
