
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { Transaction } from '@/types/financial';

interface CollaboratorDebugHelperProps {
  transactions: Transaction[];
  rawResponse?: any;
  onForceRefresh?: () => void;
}

const CollaboratorDebugHelper: React.FC<CollaboratorDebugHelperProps> = ({
  transactions,
  rawResponse,
  onForceRefresh
}) => {
  const { collaboratorExpenses } = useFinance();

  // Analyze all expense transactions
  const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
  
  // Get all unique categories from expenses
  const expenseCategories = [...new Set(expenseTransactions.map(tx => tx.category))];
  
  // Analyze collaborator-related transactions
  const collaboratorTransactions = expenseTransactions.filter(tx => 
    tx.category === 'Pagos a colaboradores' || 
    tx.description?.toLowerCase().includes('colaborador') ||
    tx.description?.toLowerCase().includes('freelancer') ||
    tx.description?.toLowerCase().includes('contractor')
  );

  // Analyze raw response collaborator data
  const rawCollaborators = rawResponse?.colaboradores || [];
  
  // Calculate totals
  const totalExpenses = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalCollaboratorExpenses = collaboratorTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const collaboratorPercentage = totalExpenses > 0 ? (totalCollaboratorExpenses / totalExpenses) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Debug de Gastos de Colaboradores
            {onForceRefresh && (
              <Button variant="outline" size="sm" onClick={onForceRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Forzar Actualización
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-600">Total Gastos</p>
              <p className="font-bold text-blue-800">${totalExpenses.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-green-600">Gastos Colaboradores</p>
              <p className="font-bold text-green-800">${totalCollaboratorExpenses.toFixed(2)}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <p className="text-sm text-purple-600">% Colaboradores</p>
              <p className="font-bold text-purple-800">{collaboratorPercentage.toFixed(1)}%</p>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <p className="text-sm text-orange-600">Raw Colaboradores</p>
              <p className="font-bold text-orange-800">{rawCollaborators.length}</p>
            </div>
          </div>

          {/* Raw Response Analysis */}
          {rawCollaborators.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Colaboradores en Raw Response ({rawCollaborators.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {rawCollaborators.map((collab: any, index: number) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                    <span>{collab.vendor_name || 'Sin nombre'}</span>
                    <span className="font-mono">${collab.total || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processed Collaborator Transactions */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Transacciones de Colaboradores Procesadas ({collaboratorTransactions.length})
            </h4>
            {collaboratorTransactions.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {collaboratorTransactions.map((tx, index) => (
                  <div key={index} className="text-xs bg-blue-50 p-2 rounded flex justify-between">
                    <span>{tx.description}</span>
                    <span className="font-mono">${tx.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No se encontraron transacciones de colaboradores</p>
            )}
          </div>

          {/* All Expense Categories */}
          <div>
            <h4 className="font-semibold mb-2">Todas las Categorías de Gastos ({expenseCategories.length})</h4>
            <div className="flex flex-wrap gap-1">
              {expenseCategories.map((category, index) => {
                const isCollaborator = category === 'Pagos a colaboradores';
                const count = expenseTransactions.filter(tx => tx.category === category).length;
                return (
                  <Badge 
                    key={index} 
                    variant={isCollaborator ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {category} ({count})
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Finance Context Collaborator Expenses */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Gastos de Colaboradores (Finance Context) ({collaboratorExpenses.length})
            </h4>
            {collaboratorExpenses.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {collaboratorExpenses.map((expense, index) => (
                  <div key={index} className="text-xs bg-green-50 p-2 rounded flex justify-between">
                    <span>{expense.category}</span>
                    <span className="font-mono">${expense.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">No hay gastos de colaboradores en el contexto financiero</span>
              </div>
            )}
          </div>

          {/* Potential Issues */}
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <h4 className="font-semibold text-red-800 mb-2">Posibles Problemas Detectados:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {rawCollaborators.length > collaboratorTransactions.length && (
                <li>• Raw response tiene {rawCollaborators.length} colaboradores pero solo {collaboratorTransactions.length} fueron procesados</li>
              )}
              {collaboratorTransactions.length > collaboratorExpenses.length && (
                <li>• Se procesaron {collaboratorTransactions.length} transacciones pero solo {collaboratorExpenses.length} llegaron al contexto</li>
              )}
              {totalCollaboratorExpenses === 0 && rawCollaborators.length > 0 && (
                <li>• Hay colaboradores en raw response pero no se calcularon gastos</li>
              )}
              {expenseCategories.filter(cat => cat.toLowerCase().includes('colabor')).length === 0 && (
                <li>• No se encontraron categorías que contengan "colabor"</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaboratorDebugHelper;
