
import React from 'react';
import { Transaction } from '@/types/financial';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TransactionMiniListProps {
  transactions: Transaction[];
  title: string;
  maxHeight?: string;
}

const TransactionMiniList: React.FC<TransactionMiniListProps> = ({
  transactions,
  title,
  maxHeight = "200px"
}) => {
  const { formatCurrency } = useFinanceFormatter();

  if (transactions.length === 0) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-500 text-center">No hay transacciones para mostrar</p>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t pt-3">
      <h4 className="text-xs font-medium text-gray-600 mb-2">{title}</h4>
      <div 
        className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{ maxHeight }}
      >
        {transactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className="flex items-center justify-between p-2 bg-gray-50 rounded-sm"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">
                {transaction.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: es })}
                </span>
                {transaction.category && (
                  <span className="text-xs text-gray-400 bg-gray-200 px-1 rounded">
                    {transaction.category}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs font-semibold text-red-600 ml-2">
              {formatCurrency(transaction.amount)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-600">Total:</span>
          <span className="text-sm font-bold text-red-600">
            {formatCurrency(transactions.reduce((sum, tx) => sum + tx.amount, 0))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TransactionMiniList);
