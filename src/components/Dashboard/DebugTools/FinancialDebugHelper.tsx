
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';

const FinancialDebugHelper: React.FC = () => {
  const [showDebug, setShowDebug] = useState(false);
  const { summary, collaboratorExpenses } = useFinance();
  
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
            <CardTitle className="text-md">Financial Debug Information</CardTitle>
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
              </div>
              
              <div className="text-xs text-gray-500">
                <p>Total Collaborator Expense: {summary.collaboratorExpense}</p>
                <p>Other Expenses: {summary.otherExpense}</p>
                <p>Sum Check: {summary.collaboratorExpense + summary.otherExpense} = {summary.totalExpense}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialDebugHelper;
