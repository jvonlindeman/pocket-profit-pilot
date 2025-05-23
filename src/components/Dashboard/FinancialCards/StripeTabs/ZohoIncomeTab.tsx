
import React from 'react';
import { ArrowUpIcon } from 'lucide-react';
import SummaryCard from '../SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';

const ZohoIncomeTab: React.FC = () => {
  const { regularIncome, formatCurrency, transactions } = useFinance();
  
  // Calculate total Zoho income from transactions
  const zohoIncome = transactions
    .filter(tx => tx.type === 'income' && tx.source === 'Zoho')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  // Use the calculated income or fall back to regularIncome
  const displayedIncome = zohoIncome > 0 ? zohoIncome : regularIncome;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Ingresos Totales"
          value={formatCurrency(displayedIncome)}
          icon={ArrowUpIcon}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
        />
        
        {/* Debug information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400">
            <p>Direct calc: {formatCurrency(zohoIncome)}</p>
            <p>From context: {formatCurrency(regularIncome)}</p>
            <p>Zoho income tx count: {
              transactions.filter(tx => tx.type === 'income' && tx.source === 'Zoho').length
            }</p>
          </div>
        )}
        
        {/* Information panel */}
        <div className="col-span-3 flex items-center justify-center py-8">
          <p className="text-gray-500 italic">
            Todos los ingresos registrados directamente en Zoho Books.
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ZohoIncomeTab);
