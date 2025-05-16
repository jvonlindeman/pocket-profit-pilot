
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';

interface InitialBalanceSectionProps {
  startingBalance?: number;
}

const InitialBalanceSection: React.FC<InitialBalanceSectionProps> = ({ 
  startingBalance = 0 
}) => {
  const { formatCurrency } = useFinance();
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Balance Inicial</h2>
            <p className="text-sm text-gray-500">Saldo al inicio del período</p>
          </div>
          <div className="flex items-center bg-blue-50 p-3 rounded-lg">
            <Wallet className="h-5 w-5 text-blue-600 mr-3" />
            <div 
              className="text-lg font-bold text-blue-600 animate-value"
              // Adding key based on the balance value forces React to re-render when value changes
              key={`balance-${startingBalance}`}
            >
              {formatCurrency(startingBalance)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(InitialBalanceSection);
