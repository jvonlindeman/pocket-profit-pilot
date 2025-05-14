import { useEffect } from 'react';
import { InitialBalanceDialog } from '@/components/InitialBalanceDialog';
import FinanceSummary from '@/components/Dashboard/FinanceSummary';
import { useFinanceData } from '@/hooks/useFinanceData';

export default function Index() {
  // State and hooks
  const { 
    dateRange, updateDateRange, financialData, loading, error,
    getCurrentMonthRange, refreshData, dataInitialized, rawResponse,
    stripeIncome, stripeFees, 
    stripeTransactionFees, stripePayoutFees, stripeAdditionalFees,
    stripeNet, stripeFeePercentage, regularIncome,
    creditCardIncome, collaboratorExpenses, startingBalance, 
    updateStartingBalance, usingCachedData
  } = useFinanceData();
  
  useEffect(() => {
    refreshData();
  }, [dateRange, refreshData]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Financial Overview</h1>
      
      {/* Date Range Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Select Date Range:</label>
        <input 
          type="date" 
          value={dateRange.startDate.toISOString().split('T')[0]} 
          onChange={(e) => updateDateRange({ 
            startDate: new Date(e.target.value), 
            endDate: dateRange.endDate 
          })} 
        />
        <input 
          type="date" 
          value={dateRange.endDate.toISOString().split('T')[0]} 
          onChange={(e) => updateDateRange({ 
            startDate: dateRange.startDate, 
            endDate: new Date(e.target.value) 
          })} 
        />
      </div>

      {/* Main content display when data is loaded */}
      {dataInitialized ? (
        <div className="grid grid-cols-1 gap-8">
          {/* Balance information */}
          <InitialBalanceDialog
            startingBalance={startingBalance}
            updateStartingBalance={updateStartingBalance}
          />

          {/* Financial Summary */}
          <FinanceSummary 
            summary={financialData.summary} 
            expenseCategories={financialData.expenseByCategory}
            stripeIncome={stripeIncome}
            stripeFees={stripeFees}
            stripeTransactionFees={stripeTransactionFees}
            stripePayoutFees={stripePayoutFees}
            stripeAdditionalFees={stripeAdditionalFees}
            stripeNet={stripeNet}
            stripeFeePercentage={stripeFeePercentage}
            regularIncome={regularIncome}
            creditCardIncome={creditCardIncome}
          />
          
          {/* Additional components can be added here */}
        </div>
      ) : (
        <div className="flex justify-center items-center py-8">
          {loading ? <p>Loading...</p> : <p>{error}</p>}
        </div>
      )}

      {/* Debug Panel */}
      {rawResponse && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(rawResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
