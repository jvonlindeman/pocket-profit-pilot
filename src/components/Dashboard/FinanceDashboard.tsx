
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import CacheStats from './CacheStats';
import MonthlyBalanceEditor from './MonthlyBalanceEditor';
import SalaryCalculator from './SalaryCalculator';
import FinanceSummary from './FinanceSummary';
import TransactionList from './TransactionList';
import { FinancialData, FinancialSummary } from '@/types/financial';

interface FinanceDashboardProps {
  periodTitle: string;
  financialData: FinancialData;
  dateRange: { startDate: Date; endDate: Date };
  cacheStatus: any;
  usingCachedData: boolean;
  stripeIncome: number;
  stripeFees: number;
  stripeTransactionFees: number;
  stripePayoutFees: number;
  stripeAdditionalFees: number;
  stripeNet: number;
  stripeFeePercentage: number;
  regularIncome: number;
  startingBalance: number;
  monthlyBalance: any;
  calculatorRefreshKey: number;
  onRefresh: () => void;
  onBalanceChange: (balance: number) => void;
  currentMonthDate: Date;
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  periodTitle,
  financialData,
  dateRange,
  cacheStatus,
  usingCachedData,
  stripeIncome,
  stripeFees,
  stripeTransactionFees,
  stripePayoutFees,
  stripeAdditionalFees,
  stripeNet,
  stripeFeePercentage,
  regularIncome,
  startingBalance,
  monthlyBalance,
  calculatorRefreshKey,
  onRefresh,
  onBalanceChange,
  currentMonthDate,
}) => {
  // Get calculator values from the monthly balance
  const opexAmount = monthlyBalance?.opex_amount !== null ? monthlyBalance?.opex_amount || 35 : 35;
  const itbmAmount = monthlyBalance?.itbm_amount !== null ? monthlyBalance?.itbm_amount || 0 : 0;
  const profitPercentage = monthlyBalance?.profit_percentage !== null ? monthlyBalance?.profit_percentage || 1 : 1;

  // Calculate total Zoho expenses - all expenses except those from Stripe
  const totalZohoExpenses = financialData.transactions
    .filter(tx => tx.type === 'expense' && tx.source !== 'Stripe')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <>
      {/* Period and refresh button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-700">
          Periodo: <span className="text-gray-900">{periodTitle}</span>
        </h2>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>
      
      {/* Cache information */}
      <CacheStats 
        dateRange={dateRange}
        onRefresh={onRefresh}
      />

      {/* Warning message when no transactions exist */}
      {financialData.transactions.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
          <p className="font-medium">No hay transacciones para el periodo seleccionado.</p>
          <p className="mt-1 text-sm">Intenta seleccionar un periodo diferente o verificar la configuración de Zoho Books.</p>
        </div>
      )}

      {/* Monthly Balance Editor */}
      <div className="mb-6">
        <MonthlyBalanceEditor 
          currentDate={currentMonthDate}
          onBalanceChange={onBalanceChange}
        />
      </div>

      {/* Salary Calculator */}
      <div className="mb-6">
        <SalaryCalculator 
          key={`salary-calculator-${calculatorRefreshKey}`}
          zohoIncome={regularIncome}
          stripeIncome={stripeNet}
          opexAmount={opexAmount}
          itbmAmount={itbmAmount}
          profitPercentage={profitPercentage}
          startingBalance={startingBalance || 0}
          totalZohoExpenses={totalZohoExpenses}
        />
      </div>

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
      />

      {/* Listado de transacciones */}
      <div className="mt-6">
        <TransactionList 
          transactions={financialData.transactions} 
          onRefresh={onRefresh}
          isLoading={false}
        />
      </div>
    </>
  );
};

export default FinanceDashboard;
