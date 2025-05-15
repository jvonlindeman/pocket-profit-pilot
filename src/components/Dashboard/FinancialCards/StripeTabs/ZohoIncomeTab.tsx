
import React from 'react';
import { ArrowUpIcon } from 'lucide-react';
import SummaryCard from '../SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';

const ZohoIncomeTab: React.FC = () => {
  const { regularIncome, formatCurrency } = useFinance();

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Ingresos Totales"
          value={formatCurrency(regularIncome)}
          icon={ArrowUpIcon}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
        />
        
        {/* Additional info or placeholder cards could go here */}
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
