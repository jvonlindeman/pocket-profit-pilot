
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { validateFinancialValue } from '@/utils/financialUtils';

const FinancialDebugHelper: React.FC = () => {
  const [showDebug, setShowDebug] = useState(false);
  const { summary, collaboratorExpenses } = useFinance();
  
  // Validate key financial values
  const collaboratorExpense = validateFinancialValue(summary.collaboratorExpense);
  const otherExpense = validateFinancialValue(summary.otherExpense);
  const totalExpense = validateFinancialValue(summary.totalExpense);
  
  // Check if the expense values add up correctly
  const hasExpenseDiscrepancy = Math.abs((collaboratorExpense + otherExpense) - totalExpense) > 0.01;
  
  // Calculate total from collaborator expenses array for verification
  const calculatedCollaboratorExpense = collaboratorExpenses.reduce(
    (sum, item) => sum + validateFinancialValue(item.amount), 0
  );
  
  // Check if there's a discrepancy between the summary and calculated values
  const hasCollaboratorDiscrepancy = 
    Math.abs(calculatedCollaboratorExpense - collaboratorExpense) > 0.01;
  
  // Don't render anything in production
  if (process.env.NODE_ENV === 'production') return null;
  
  return (
    <div className="mt-6">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowDebug(!showDebug)}
        className="mb-2"
      >
        {showDebug ? (
          <>
            <EyeOff className="w-4 h-4 mr-1" />
            Hide Debug Info
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-1" />
            Show Debug Info
          </>
        )}
      </Button>
      
      {showDebug && (
        <Card>
          <CardHeader>
            <CardTitle className="text-md flex items-center">
              Financial Debug Information
              {(hasExpenseDiscrepancy || hasCollaboratorDiscrepancy) && (
                <AlertTriangle className="w-5 h-5 ml-2 text-amber-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Summary Values:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(summary, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Collaborator Expenses:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(collaboratorExpenses, null, 2)}
                </pre>
                <p className="text-xs mt-1">
                  Total from array: {calculatedCollaboratorExpense.toFixed(2)}
                </p>
              </div>
              
              <div className="text-xs bg-gray-100 p-2 rounded">
                <h3 className="font-medium mb-2">Expense Validation:</h3>
                <p>Collaborator Expense: {collaboratorExpense.toFixed(2)}</p>
                <p>Other Expenses: {otherExpense.toFixed(2)}</p>
                <p>Total Expenses: {totalExpense.toFixed(2)}</p>
                <p>Sum Check: {collaboratorExpense + otherExpense} = {totalExpense}</p>
                
                {hasExpenseDiscrepancy && (
                  <div className="text-amber-600 mt-2 p-2 bg-amber-50 rounded">
                    <strong>Warning:</strong> Expense values don't add up correctly.
                    Discrepancy: {((collaboratorExpense + otherExpense) - totalExpense).toFixed(2)}
                  </div>
                )}
                
                {hasCollaboratorDiscrepancy && (
                  <div className="text-amber-600 mt-2 p-2 bg-amber-50 rounded">
                    <strong>Warning:</strong> Collaborator expense mismatch.
                    Summary value: {collaboratorExpense.toFixed(2)}, 
                    Calculated from array: {calculatedCollaboratorExpense.toFixed(2)},
                    Discrepancy: {(collaboratorExpense - calculatedCollaboratorExpense).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialDebugHelper;
