
import React from 'react';
import { Transaction } from '@/types/financial';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import IncomeTransactions from './Transactions/IncomeTransactions';
import ExpenseTransactions from './Transactions/ExpenseTransactions';
import CollaboratorTransactions from './Transactions/CollaboratorTransactions';
import CacheStats from './CacheStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh?: () => void;
  isLoading?: boolean;
  startDate?: Date;
  endDate?: Date;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onRefresh, 
  isLoading = false,
  startDate,
  endDate
}) => {
  // Filter transactions by type
  const incomeTransactions = transactions.filter(tx => tx.type === 'income');
  const expenseTransactions = transactions.filter(tx => 
    tx.type === 'expense' && tx.category !== 'Pagos a colaboradores'
  );
  const collaboratorTransactions = transactions.filter(tx => 
    tx.type === 'expense' && tx.category === 'Pagos a colaboradores'
  );
  
  // Calculate totals
  const getTotals = () => {
    const incomeTotal = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const expenseTotal = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    return { incomeTotal, expenseTotal, netTotal: incomeTotal - expenseTotal };
  };
  
  const totals = getTotals();
  
  // Count transactions by type
  const incomeCount = incomeTransactions.length;
  const expenseCount = expenseTransactions.length;
  const collaboratorCount = collaboratorTransactions.length;
  
  // Log transaction counts and totals for debugging
  console.log("Transaction List Stats:", { 
    total: transactions.length,
    income: incomeCount, 
    expense: expenseCount, 
    collaborator: collaboratorCount,
    incomeTotal: totals.incomeTotal,
    expenseTotal: totals.expenseTotal,
    netTotal: totals.netTotal
  });
  
  if (expenseTransactions.length > 0) {
    console.log("Sample expense transaction:", expenseTransactions[0]);
  }
  if (collaboratorTransactions.length > 0) {
    console.log("Sample collaborator transaction:", collaboratorTransactions[0]);
  }

  return (
    <>
      {onRefresh && (
        <CacheStats 
          onRefresh={onRefresh} 
          isLoading={isLoading || false} 
          startDate={startDate}
          endDate={endDate}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones</CardTitle>
          <CardDescription>Lista detallada de ingresos y gastos en USD</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">Todos ({transactions.length})</TabsTrigger>
              <TabsTrigger value="income">Ingresos ({incomeCount})</TabsTrigger>
              <TabsTrigger value="expenses">Gastos ({expenseCount})</TabsTrigger>
              <TabsTrigger value="collaborators">Colaboradores ({collaboratorCount})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {transactions.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No hay transacciones para mostrar
                </div>
              ) : (
                <div className="space-y-4">
                  {collaboratorCount > 0 && <CollaboratorTransactions transactions={collaboratorTransactions} />}
                  {incomeCount > 0 && <IncomeTransactions transactions={incomeTransactions} />}
                  {expenseCount > 0 && <ExpenseTransactions transactions={expenseTransactions} />}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="income">
              <IncomeTransactions transactions={incomeTransactions} />
            </TabsContent>
            
            <TabsContent value="expenses">
              <ExpenseTransactions transactions={expenseTransactions} />
            </TabsContent>
            
            <TabsContent value="collaborators">
              <CollaboratorTransactions transactions={collaboratorTransactions} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t text-sm text-gray-500 flex flex-col sm:flex-row sm:justify-between p-4">
          <div className="mb-2 sm:mb-0">
            <span>
              Mostrando {transactions.length} transacciones en total
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="text-blue-600 font-medium">
              Ingresos: {formatCurrency(totals.incomeTotal)} ({incomeCount})
            </div>
            <div className="text-red-600 font-medium">
              Gastos: {formatCurrency(totals.expenseTotal)} ({expenseCount + collaboratorCount})
            </div>
            <div className={`font-semibold ${totals.netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Neto: {formatCurrency(totals.netTotal)}
            </div>
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

// Format currency helper function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export default TransactionList;
