
import React from 'react';
import PeriodHeader from './PeriodHeader';
import CacheMonitor from './CacheMonitor';
import NoTransactionsWarning from './NoTransactionsWarning';
import MonthlyBalanceEditor from './MonthlyBalanceEditor';
import SalaryCalculator from './SalaryCalculator';
import FinanceSummary from './FinanceSummary';
import TransactionList from './TransactionList';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { FinancialSummary, Transaction, UnpaidInvoice } from '@/types/financial';

// --- TYPE DEFINITIONS ---
interface CoreData {
  periodTitle: string;
  dateRange: { startDate: Date; endDate: Date };
  financialData: {
    summary: FinancialSummary;
    transactions: Transaction[];
    expenseByCategory: any[];
  };
  currentMonthDate: Date;
  monthlyBalance: any;
  totalZohoExpenses: number;
  unpaidInvoices?: UnpaidInvoice[];
  startingBalance: number;
  regularIncome: number;
}

interface StripeData {
  stripeIncome: number;
  stripeFees: number;
  stripeTransactionFees: number;
  stripePayoutFees: number;
  stripeAdditionalFees: number;
  stripeNet: number;
  stripeFeePercentage: number;
}

interface ActionHandlers {
  refreshData: (force: boolean) => void;
  handleBalanceChange: (
    balance: number,
    opexAmount?: number,
    itbmAmount?: number,
    profitPercentage?: number,
    taxReservePercentage?: number,
    includeZohoFiftyPercent?: boolean
  ) => void;
  handleRefresh: () => void;
}

interface DashboardContentProps {
  coreData: CoreData;
  stripeData: StripeData;
  actions: ActionHandlers;
  loading: boolean;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  coreData,
  stripeData,
  actions,
  loading,
}) => {
  console.log("💼 DashboardContent: Rendering started with enhanced safety checks:", {
    coreDataExists: !!coreData,
    stripeDataExists: !!stripeData,
    actionsExists: !!actions,
    loading
  });

  // CRITICAL SAFETY CHECKS: Prevent rendering if essential data is missing
  if (!coreData) {
    console.error("❌ DashboardContent: coreData is missing!");
    return (
      <div className="p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error de datos principales</h3>
          <p className="text-red-600">Los datos principales no están disponibles. Intenta refrescar la página.</p>
        </div>
      </div>
    );
  }

  if (!stripeData) {
    console.error("❌ DashboardContent: stripeData is missing!");
    return (
      <div className="p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error de datos de Stripe</h3>
          <p className="text-red-600">Los datos de Stripe no están disponibles. Intenta refrescar la página.</p>
        </div>
      </div>
    );
  }

  if (!actions) {
    console.error("❌ DashboardContent: actions are missing!");
    return (
      <div className="p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error de funciones</h3>
          <p className="text-red-600">Las funciones de acción no están disponibles. Intenta refrescar la página.</p>
        </div>
      </div>
    );
  }

  // SAFE DATA EXTRACTION with additional validation
  const {
    periodTitle,
    dateRange,
    financialData,
    currentMonthDate,
    monthlyBalance,
    totalZohoExpenses,
    unpaidInvoices = [],
    startingBalance,
    regularIncome,
  } = coreData;

  // VALIDATE CRITICAL DATA
  if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
    console.error("❌ DashboardContent: Invalid date range:", dateRange);
    return (
      <div className="p-4 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-yellow-800 font-semibold mb-2">Rango de fechas inválido</h3>
          <p className="text-yellow-600">El rango de fechas no es válido. Selecciona un rango válido.</p>
        </div>
      </div>
    );
  }

  if (!currentMonthDate || isNaN(currentMonthDate.getTime())) {
    console.error("❌ DashboardContent: Invalid current month date:", currentMonthDate);
    return (
      <div className="p-4 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-yellow-800 font-semibold mb-2">Fecha actual inválida</h3>
          <p className="text-yellow-600">La fecha actual no es válida. Intenta refrescar la página.</p>
        </div>
      </div>
    );
  }

  const {
    stripeIncome,
    stripeFees,
    stripeTransactionFees,
    stripePayoutFees,
    stripeAdditionalFees,
    stripeNet,
    stripeFeePercentage,
  } = stripeData;
  
  const { refreshData, handleBalanceChange, handleRefresh } = actions;

  // Enhanced debugging and improved value extraction logic
  console.log("💼 DashboardContent: Monthly balance data received:", monthlyBalance);
  
  // IMMEDIATE VALUES: Use the most current values with better defaults
  const opexAmount = monthlyBalance?.opex_amount ?? 35;
  const itbmAmount = monthlyBalance?.itbm_amount ?? 0;
  const profitPercentage = monthlyBalance?.profit_percentage ?? 1;
  const taxReservePercentage = monthlyBalance?.tax_reserve_percentage ?? 5;
  const includeZohoFiftyPercent = monthlyBalance?.include_zoho_fifty_percent ?? true;
  
  console.log("💼 DashboardContent: IMMEDIATE VALUES for calculator:", { 
    opexAmount, 
    itbmAmount, 
    profitPercentage, 
    taxReservePercentage,
    includeZohoFiftyPercent,
    startingBalance,
    monthlyBalanceId: monthlyBalance?.id,
    monthlyBalanceTimestamp: monthlyBalance?.updated_at,
    timestamp: new Date().toISOString()
  });
  
  // REACTIVE KEY: Forces complete re-render when ANY value changes
  const calculatorKey = `calculator-${monthlyBalance?.id || 'default'}-${monthlyBalance?.updated_at || Date.now()}-${startingBalance}-${opexAmount}-${itbmAmount}-${profitPercentage}-${taxReservePercentage}-${includeZohoFiftyPercent}`;
  
  console.log("💼 DashboardContent: Calculator key (forces re-render):", calculatorKey);
  console.log("💼 DashboardContent: Transaction count:", financialData?.transactions?.length || 0);
  console.log("💼 DashboardContent: Unpaid invoices:", unpaidInvoices?.length || 0);
  console.log("💼 DashboardContent: PASSING includeZohoFiftyPercent to SalaryCalculator:", includeZohoFiftyPercent);

  // SAFE COLLABORATOR EXPENSES: Add defensive checks
  const collaboratorExpenses = financialData?.expenseByCategory?.filter(
    category => category?.category && (
      category.category.toLowerCase().includes('colaborador') ||
      category.category.toLowerCase().includes('collaborator') ||
      category.category === 'Colaboradores' ||
      category.category === 'Collaborators'
    )
  ) || [];

  console.log("💼 DashboardContent: Filtered collaborator expenses:", collaboratorExpenses.length);

  // ENSURE SAFE FINANCIAL DATA with comprehensive fallbacks
  const safeFinancialData = financialData || {
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      collaboratorExpense: 0,
      otherExpense: 0,
      profit: 0,
      profitMargin: 0,
      grossProfit: 0,
      grossProfitMargin: 0,
    },
    transactions: [],
    expenseByCategory: []
  };

  // ENSURE SAFE DATE RANGE
  const safeDateRange = {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  };

  console.log("💼 DashboardContent: About to render FinanceProvider with validated data");

  try {
    return (
      <FinanceProvider
        summary={safeFinancialData.summary}
        transactions={safeFinancialData.transactions}
        dateRange={safeDateRange}
        stripeIncome={stripeIncome}
        stripeFees={stripeFees}
        stripeTransactionFees={stripeTransactionFees}
        stripePayoutFees={stripePayoutFees}
        stripeAdditionalFees={stripeAdditionalFees}
        stripeNet={stripeNet}
        stripeFeePercentage={stripeFeePercentage}
        regularIncome={regularIncome}
        collaboratorExpenses={collaboratorExpenses}
        unpaidInvoices={unpaidInvoices}
      >
        <>
          {/* Period and refresh button */}
          <PeriodHeader periodTitle={periodTitle} onRefresh={handleRefresh} />
          
          {/* Use our new CacheMonitor component */}
          <CacheMonitor 
            dateRange={dateRange}
            onRefresh={() => refreshData(true)}
          />

          {/* Warning message when no transactions exist */}
          {safeFinancialData.transactions.length === 0 && <NoTransactionsWarning />}

          {/* Monthly Balance Editor moved up to be above FinanceSummary */}
          <div className="mb-6">
            <MonthlyBalanceEditor 
              currentDate={currentMonthDate}
              onBalanceChange={handleBalanceChange}
            />
          </div>

          {/* Salary Calculator with IMMEDIATE REACTIVE UPDATES */}
          <div className="mb-6">
            <SalaryCalculator 
              key={calculatorKey}
              zohoIncome={regularIncome}
              stripeIncome={stripeNet}
              opexAmount={opexAmount}
              itbmAmount={itbmAmount}
              profitPercentage={profitPercentage}
              taxReservePercentage={taxReservePercentage}
              includeZohoFiftyPercent={includeZohoFiftyPercent}
              startingBalance={startingBalance}
              totalZohoExpenses={totalZohoExpenses}
            />
          </div>

          {/* Financial Summary with improved organization */}
          <FinanceSummary 
            summary={safeFinancialData.summary} 
            expenseCategories={safeFinancialData.expenseByCategory}
            stripeIncome={stripeIncome}
            stripeFees={stripeFees}
            stripeTransactionFees={stripeTransactionFees}
            stripePayoutFees={stripePayoutFees}
            stripeAdditionalFees={stripeAdditionalFees}
            stripeNet={stripeNet}
            stripeFeePercentage={stripeFeePercentage}
            regularIncome={regularIncome}
            dateRange={dateRange}
            transactions={safeFinancialData.transactions}
            unpaidInvoices={unpaidInvoices}
          />

          {/* Listado de transacciones */}
          <div className="mt-6">
            <TransactionList 
              transactions={safeFinancialData.transactions} 
              onRefresh={handleRefresh}
              isLoading={loading}
            />
          </div>
        </>
      </FinanceProvider>
    );
  } catch (err) {
    console.error("🚨 DashboardContent: Critical render error:", err);
    return (
      <div className="p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error de renderizado</h3>
          <p className="text-red-600">Ocurrió un error al mostrar el contenido. Intenta refrescar la página.</p>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-red-700">Detalles técnicos</summary>
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
              {err instanceof Error ? err.message : String(err)}
            </pre>
          </details>
        </div>
      </div>
    );
  }
};

export default DashboardContent;
