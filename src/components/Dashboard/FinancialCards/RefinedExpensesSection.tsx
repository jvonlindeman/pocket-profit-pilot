import React, { useEffect, useState } from 'react';
import { ArrowDownIcon, Users } from 'lucide-react';
import SummaryCard from './SummaryCard';
import TransactionMiniList from './TransactionMiniList';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { useIsMobile } from '@/hooks/use-mobile';
import { isStripeFeeTransaction } from '@/services/financialService';

const RefinedExpensesSection: React.FC = () => {
  const { 
    summary, 
    transactions
  } = useFinance();
  
  const { formatCurrency } = useFinanceFormatter();
  const isMobile = useIsMobile();

  // State to control which cards are expanded
  const [expandedCards, setExpandedCards] = useState<{
    collaborators: boolean;
    other: boolean;
    total: boolean;
  }>({
    collaborators: false,
    other: false,
    total: false
  });

  // FIXED: Calculate expenses excluding Stripe fees (consistent with processTransactionData)
  const operationalExpenseTransactions = transactions?.filter(tx => 
    tx.type === 'expense' && 
    !isStripeFeeTransaction(tx)
  ) || [];

  // Calculate collaborator expenses from operational expenses only
  const collaboratorTransactions = operationalExpenseTransactions.filter(tx => 
    tx.category === 'Pagos a colaboradores'
  );
  
  const totalCollaboratorExpense = collaboratorTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate "Otros Gastos" as operational expenses excluding collaborators
  const otherExpenseTransactions = operationalExpenseTransactions.filter(tx => 
    tx.category !== 'Pagos a colaboradores'
  );
  
  const otherExpense = otherExpenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Use summary.totalExpense (which already excludes Stripe fees from processTransactionData)
  const totalExpenseFromSummary = summary.totalExpense;

  // Group other expenses by category for display
  const otherExpensesByCategory = otherExpenseTransactions.reduce((acc, tx) => {
    const category = tx.category || 'Sin categoría';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tx);
    return acc;
  }, {} as Record<string, typeof otherExpenseTransactions>);

  // Toggle handlers
  const handleToggle = (cardType: keyof typeof expandedCards) => (expanded: boolean) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardType]: expanded
    }));
  };

  // Debug logging (keep existing)
  useEffect(() => {
    const allExpenseTransactions = transactions?.filter(tx => tx.type === 'expense') || [];
    const stripeFeesTransactions = allExpenseTransactions.filter(tx => isStripeFeeTransaction(tx));
    const totalFromAllExpenses = allExpenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalStripeFees = stripeFeesTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const calculatedTotalOperational = totalCollaboratorExpense + otherExpense;
    
    console.log("🔍 RefinedExpensesSection - STRIPE FEE EXCLUSION CALCULATION:", {
      // Raw transaction data
      totalTransactions: transactions?.length || 0,
      allExpenseTransactions: allExpenseTransactions.length,
      totalFromAllExpenses,
      
      // Stripe fees separation
      stripeFeesCount: stripeFeesTransactions.length,
      totalStripeFees,
      operationalExpenseCount: operationalExpenseTransactions.length,
      
      // Collaborator calculation (operational only)
      collaboratorTransactions: collaboratorTransactions.length,
      collaboratorTransactionDetails: collaboratorTransactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        category: tx.category,
        description: tx.description
      })),
      totalCollaboratorExpense,
      
      // Other expenses calculation (operational only)
      otherExpenseTransactions: otherExpenseTransactions.length,
      otherExpenseCategories: [...new Set(otherExpenseTransactions.map(tx => tx.category))],
      otherExpense,
      
      // Mathematical validation
      calculatedTotalOperational,
      summaryTotalExpense: summary.totalExpense,
      difference: calculatedTotalOperational - summary.totalExpense,
      isConsistent: Math.abs(calculatedTotalOperational - summary.totalExpense) < 0.01,
      
      // Verification against processTransactionData logic
      verification: {
        totalExpensesIncludingFees: totalFromAllExpenses,
        stripeFeesExcluded: totalStripeFees,
        operationalExpensesCalculated: calculatedTotalOperational,
        summaryTotalExpenseFromProcessor: summary.totalExpense,
        matchesSummary: Math.abs(calculatedTotalOperational - summary.totalExpense) < 0.01
      }
    });

    // Log collaborator transactions breakdown
    if (collaboratorTransactions.length > 0) {
      console.log("👥 COLLABORATOR TRANSACTIONS FROM ENDPOINT:");
      collaboratorTransactions.forEach(tx => {
        console.log(`  - ${tx.description}: $${tx.amount} (${tx.category})`);
      });
    }

    // Log other expense categories
    if (otherExpenseTransactions.length > 0) {
      console.log("💰 OTHER EXPENSE CATEGORIES:");
      const categoryTotals = otherExpenseTransactions.reduce((acc, tx) => {
        const category = tx.category || 'Sin categoría';
        acc[category] = (acc[category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(categoryTotals).forEach(([category, total]) => {
        console.log(`  - ${category}: $${total}`);
      });
    }

  }, [transactions, operationalExpenseTransactions, collaboratorTransactions, otherExpenseTransactions, totalCollaboratorExpense, otherExpense, summary]);

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-6'}`}>
      {/* Collaborator Expenses - With expandable transaction list */}
      <SummaryCard
        title="Gastos Colaboradores"
        value={formatCurrency(totalCollaboratorExpense)}
        icon={Users}
        iconColor="text-amber-500"
        iconBgColor="bg-amber-50"
        tooltip="Colaboradores que llegan del endpoint de Zoho con categoría 'Pagos a colaboradores'"
        expandable={collaboratorTransactions.length > 0}
        onToggle={handleToggle('collaborators')}
        expandedContent={
          <TransactionMiniList
            transactions={collaboratorTransactions}
            title={`Detalle de Pagos a Colaboradores (${collaboratorTransactions.length})`}
          />
        }
      />

      {/* Other Expenses - With expandable transaction list by category */}
      <SummaryCard
        title="Otros Gastos"
        value={formatCurrency(otherExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
        tooltip="Todos los gastos excepto colaboradores"
        expandable={otherExpenseTransactions.length > 0}
        onToggle={handleToggle('other')}
        expandedContent={
          <div className="mt-3 border-t pt-3">
            <h4 className="text-xs font-medium text-gray-600 mb-3">
              Gastos por Categoría ({Object.keys(otherExpensesByCategory).length} categorías)
            </h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(otherExpensesByCategory).map(([category, txs]) => (
                <div key={category} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-xs font-semibold text-gray-700">{category}</h5>
                    <span className="text-xs font-bold text-red-600">
                      {formatCurrency(txs.reduce((sum, tx) => sum + tx.amount, 0))}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {txs.slice(0, 3).map(tx => (
                      <div key={tx.id} className="flex justify-between text-xs">
                        <span className="truncate pr-2 text-gray-600">{tx.description}</span>
                        <span className="text-red-500">{formatCurrency(tx.amount)}</span>
                      </div>
                    ))}
                    {txs.length > 3 && (
                      <div className="text-xs text-gray-500 text-center pt-1">
                        +{txs.length - 3} transacciones más
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      />

      {/* Total Expenses - With summary breakdown */}
      <SummaryCard
        title="Gastos Totales"
        value={formatCurrency(totalExpenseFromSummary)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
        tooltip="Total de gastos operacionales (excluyendo comisiones de Stripe)"
        expandable={true}
        onToggle={handleToggle('total')}
        expandedContent={
          <div className="mt-3 border-t pt-3">
            <h4 className="text-xs font-medium text-gray-600 mb-3">Resumen de Gastos Totales</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-amber-50 rounded-sm">
                <span className="text-xs text-gray-700">Gastos Colaboradores</span>
                <span className="text-xs font-semibold text-amber-600">
                  {formatCurrency(totalCollaboratorExpense)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-sm">
                <span className="text-xs text-gray-700">Otros Gastos</span>
                <span className="text-xs font-semibold text-red-500">
                  {formatCurrency(otherExpense)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-100 rounded-sm border-t">
                <span className="text-xs font-medium text-gray-800">Total</span>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(totalExpenseFromSummary)}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t">
              <div className="text-xs text-gray-500 text-center">
                * Excluye comisiones de Stripe ({formatCurrency(
                  (transactions?.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0) || 0) - totalExpenseFromSummary
                )})
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default React.memo(RefinedExpensesSection);
