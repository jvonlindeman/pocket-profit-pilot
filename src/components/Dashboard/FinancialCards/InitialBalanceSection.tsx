
import React from 'react';
import { Scale } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface InitialBalanceSectionProps {
  startingBalance?: number;
  formatCurrency: (amount: number) => string;
}

const InitialBalanceSection: React.FC<InitialBalanceSectionProps> = ({ 
  startingBalance,
  formatCurrency
}) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
      <h2 className="text-lg font-semibold text-blue-700 mb-4">Balance Inicial</h2>
      <div className="grid grid-cols-1">
        <Card className="finance-card bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Balance Inicial</h3>
              <div className="p-2 bg-blue-50 rounded-full">
                <Scale className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-500 animate-value">
              {startingBalance !== undefined ? formatCurrency(startingBalance) : "No establecido"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InitialBalanceSection;
