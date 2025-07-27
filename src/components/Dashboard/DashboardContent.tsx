import React from 'react';
import PeriodHeader from './PeriodHeader';
import RefinedFinancialSummary from './FinancialCards/RefinedFinancialSummary';
import TransactionTable from './TransactionTable';
import TransactionFilters from './TransactionFilters';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import InitialBalanceDialog from './InitialBalanceDialog';
import NoDataLoadedState from './NoDataLoadedState';
import { Separator } from '@/components/ui/separator';
import CacheEfficiencyDashboard from './CacheEfficiencyDashboard';
import TransactionCategorySummary from './TransactionCategorySummary';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import SalaryCalculator from './SalaryCalculator';
import PersonalSalaryCalculator from './PersonalSalaryCalculator';
import { ReceivablesManager } from './Receivables/ReceivablesManager';
import { FinancialPredictionCard } from './Prediction/FinancialPredictionCard';

interface DashboardContentProps {
  // Core data
  periodTitle: string;
  financialData: any;
  loading: boolean;
  error: string | null;
  dataInitialized: boolean;
  hasCachedData: boolean;
  usingCachedData: boolean;
  isRefreshing: boolean;
  cacheStatus: {
    zoho: { hit: boolean; partial: boolean };
    stripe: { hit: boolean; partial: boolean };
  };

  // Financial data
  stripeIncome: number;
  stripeFees: number;
  stripeTransactionFees: number;
  stripePayoutFees: number;
  stripeAdditionalFees: number;
  stripeNet: number;
  stripeFeePercentage: number;
  regularIncome: number;
  collaboratorExpenses: any[];
  unpaidInvoices: any[];
  startingBalance: number;
  totalZohoExpenses: number;

  // Calculator values
  calculatorKey: string;
  opexAmount: number;
  itbmAmount: number;
  profitPercentage: number;
  taxReservePercentage: number;
  stripeSavingsPercentage: number;
  includeZohoFiftyPercent: boolean;

  // Monthly balance data
  monthlyBalance: any;

  // Functions
  refreshData: (forceRefresh?: boolean) => void;
  showBalanceDialog: boolean;
  setShowBalanceDialog: (show: boolean) => void;
  currentDate: Date;
  onBalanceSaved: (balance: number, opexAmount?: number, itbmAmount?: number, profitPercentage?: number, taxReservePercentage?: number, stripeSavingsPercentage?: number, includeZohoFiftyPercent?: boolean, notes?: string) => Promise<boolean>;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  periodTitle,
  financialData,
  loading,
  error,
  dataInitialized,
  hasCachedData,
  usingCachedData,
  isRefreshing,
  cacheStatus,
  stripeIncome,
  stripeFees,
  stripeTransactionFees,
  stripePayoutFees,
  stripeAdditionalFees,
  stripeNet,
  stripeFeePercentage,
  regularIncome,
  collaboratorExpenses,
  unpaidInvoices,
  startingBalance,
  totalZohoExpenses,
  calculatorKey,
  opexAmount,
  itbmAmount,
  profitPercentage,
  taxReservePercentage,
  stripeSavingsPercentage,
  includeZohoFiftyPercent,
  monthlyBalance,
  refreshData,
  showBalanceDialog,
  setShowBalanceDialog,
  currentDate,
  onBalanceSaved
}) => {
  // Calculate adjustedZohoIncome using the same formula as the salary calculator
  const adjustedZohoIncome = startingBalance + regularIncome - totalZohoExpenses;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Initial Balance Dialog */}
      <InitialBalanceDialog 
        open={showBalanceDialog} 
        onOpenChange={setShowBalanceDialog}
        currentDate={currentDate}
        onBalanceSaved={onBalanceSaved}
        currentBalance={monthlyBalance}
      />

      {/* Main content area */}
      <div className="space-y-6">
        <PeriodHeader 
          periodTitle={periodTitle}
          onRefresh={refreshData}
          hasCachedData={hasCachedData}
          usingCachedData={usingCachedData}
          isRefreshing={isRefreshing}
          cacheStatus={cacheStatus}
        />

        {error && (
          <ErrorDisplay 
            error={error} 
            onRetry={() => refreshData(true)} 
          />
        )}

        {loading && <LoadingSpinner />}

        {!dataInitialized && !loading && !error && (
          <NoDataLoadedState
            onLoadCache={() => refreshData(false)}
            onLoadFresh={() => refreshData(true)}
            hasCachedData={hasCachedData}
            isLoading={loading}
          />
        )}

        {dataInitialized && (
          <>
            {/* Salary Calculator - Prominent position at top */}
            <SalaryCalculator
              key={calculatorKey}
              zohoIncome={regularIncome}
              stripeIncome={stripeNet}
              opexAmount={opexAmount}
              itbmAmount={itbmAmount}
              profitPercentage={profitPercentage}
              taxReservePercentage={taxReservePercentage}
              stripeSavingsPercentage={stripeSavingsPercentage}
              includeZohoFiftyPercent={includeZohoFiftyPercent}
              startingBalance={startingBalance}
              totalZohoExpenses={totalZohoExpenses}
              onConfigureClick={() => setShowBalanceDialog(true)}
            />

            {/* Personal Salary Calculator - Profit First Method */}
            <PersonalSalaryCalculator
              estimatedSalary={(() => {
                const adjustedZohoIncome = startingBalance + regularIncome - totalZohoExpenses;
                const profitFirstAmount = (adjustedZohoIncome * profitPercentage) / 100;
                const taxReserveAmount = (adjustedZohoIncome * taxReservePercentage) / 100;
                const remainingZohoIncome = adjustedZohoIncome - profitFirstAmount - taxReserveAmount;
                const stripeSavingsAmount = (stripeNet * stripeSavingsPercentage) / 100;
                const stripeAfterSavings = stripeNet - stripeSavingsAmount;
                const halfStripeIncome = stripeAfterSavings / 2;
                const halfRemainingZoho = remainingZohoIncome / 2;
                return includeZohoFiftyPercent 
                  ? halfStripeIncome + halfRemainingZoho
                  : halfStripeIncome;
              })()}
            />

            <Separator />

            {/* Log financial data before providing to context */}
            {(() => {
              console.log("💰 DashboardContent: Providing financial data to FinanceProvider:", {
                summaryTotalIncome: financialData.summary?.totalIncome,
                summaryTotalExpense: financialData.summary?.totalExpense,
                summaryProfit: financialData.summary?.profit,
                transactionCount: financialData.transactions?.length,
                stripeIncome,
                stripeFees,
                regularIncome,
                collaboratorExpensesCount: Array.isArray(collaboratorExpenses) ? collaboratorExpenses.length : 0,
                unpaidInvoicesCount: unpaidInvoices?.length,
                adjustedZohoIncome
              });
              return null;
            })()}
            <FinanceProvider
              summary={financialData.summary}
              transactions={financialData.transactions}
              dateRange={{ startDate: null, endDate: null }}
              stripeIncome={stripeIncome}
              stripeFees={stripeFees}
              stripeTransactionFees={stripeTransactionFees}
              stripePayoutFees={stripePayoutFees}
              stripeAdditionalFees={stripeAdditionalFees}
              stripeNet={stripeNet}
              stripeFeePercentage={stripeFeePercentage}
              regularIncome={regularIncome}
              collaboratorExpenses={Array.isArray(collaboratorExpenses) ? collaboratorExpenses : []}
              unpaidInvoices={unpaidInvoices}
            >
              <RefinedFinancialSummary />
            </FinanceProvider>

            <Separator />

            {/* Receivables Management - Now with stripeNet and adjustedZohoIncome props */}
            <ReceivablesManager 
              unpaidInvoices={unpaidInvoices || []}
              stripeNet={stripeNet}
              adjustedZohoIncome={adjustedZohoIncome}
            />

            <Separator />

            {/* Financial Prediction - 30-60 day forecast */}
            <FinancialPredictionCard
              collaboratorExpenses={Array.isArray(collaboratorExpenses) ? collaboratorExpenses : []}
              historicalMonthlyExpenses={totalZohoExpenses}
              startingBalance={startingBalance}
            />

            <Separator />

            <TransactionCategorySummary transactions={financialData.transactions} />

            <Separator />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Transacciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TransactionFilters 
                      transactions={financialData.transactions}
                      onFilterChange={() => {}}
                    />
                    <TransactionTable 
                      transactions={financialData.transactions}
                      isLoading={loading}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="xl:col-span-1">
                <CacheEfficiencyDashboard 
                  dateRange={{ startDate: new Date(), endDate: new Date() }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardContent;
