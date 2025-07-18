
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
import { ReceivablesManager } from './Receivables/ReceivablesManager';
import FinancialHistorySummary from './FinancialHistory/FinancialHistorySummary';

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
  startingBalance: number;
  totalZohoExpenses: number;

  // Calculator values
  calculatorKey: string;
  opexAmount: number;
  itbmAmount: number;
  profitPercentage: number;
  taxReservePercentage: number;
  includeZohoFiftyPercent: boolean;

  // Monthly balance data
  monthlyBalance: any;

  // Functions
  refreshData: (forceRefresh?: boolean) => void;
  showBalanceDialog: boolean;
  setShowBalanceDialog: (show: boolean) => void;
  currentDate: Date;
  onBalanceSaved: (balance: number, opexAmount?: number, itbmAmount?: number, profitPercentage?: number, taxReservePercentage?: number, includeZohoFiftyPercent?: boolean, notes?: string) => Promise<boolean>;
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
  startingBalance,
  totalZohoExpenses,
  calculatorKey,
  opexAmount,
  itbmAmount,
  profitPercentage,
  taxReservePercentage,
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

  // Extract unpaid invoices from financial data
  const unpaidInvoices = financialData?.unpaidInvoices || [];
  
  // Debug logging to verify data flow
  console.log('📋 DashboardContent: Extracting unpaid invoices for ReceivablesManager', {
    financialDataKeys: Object.keys(financialData || {}),
    unpaidInvoicesCount: unpaidInvoices.length,
    unpaidInvoicesTotal: unpaidInvoices.reduce((sum: number, inv: any) => sum + (inv.balance || 0), 0),
    sampleInvoices: unpaidInvoices.slice(0, 3).map((inv: any) => ({
      customer: inv.customer_name,
      company: inv.company_name,
      balance: inv.balance
    }))
  });

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
              stripeIncome={stripeIncome}
              opexAmount={opexAmount}
              itbmAmount={itbmAmount}
              profitPercentage={profitPercentage}
              taxReservePercentage={taxReservePercentage}
              includeZohoFiftyPercent={includeZohoFiftyPercent}
              startingBalance={startingBalance}
              totalZohoExpenses={totalZohoExpenses}
              onConfigureClick={() => setShowBalanceDialog(true)}
            />

            <Separator />

            {/* === FINANCIAL SUMMARY SECTION START === */}
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
            >
              <RefinedFinancialSummary />
            </FinanceProvider>
            {/* === FINANCIAL SUMMARY SECTION END === */}

            <Separator />

            {/* === RECEIVABLES MANAGEMENT SECTION START === */}
            {/* This appears between Financial Summary and Financial History */}
            <ReceivablesManager 
              key={`receivables-${calculatorKey}`}
              unpaidInvoices={unpaidInvoices}
              stripeNet={stripeNet}
              adjustedZohoIncome={adjustedZohoIncome}
            />
            {/* === RECEIVABLES MANAGEMENT SECTION END === */}

            <Separator />

            {/* === FINANCIAL HISTORY SECTION START === */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <FinancialHistorySummary 
                startDate={null}
                endDate={null}
              />
            </div>
            {/* === FINANCIAL HISTORY SECTION END === */}

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
