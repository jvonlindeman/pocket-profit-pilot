
import React from 'react';
import { ArrowUpIcon, AlertCircle } from 'lucide-react';
import SummaryCard from '../SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ZohoIncomeTab: React.FC = () => {
  const { regularIncome, formatCurrency, transactions } = useFinance();
  
  // Calculate total Zoho income from transactions
  const zohoIncome = transactions
    .filter(tx => tx.type === 'income' && tx.source === 'Zoho')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  // Use the calculated income or fall back to regularIncome
  const displayedIncome = zohoIncome > 0 ? zohoIncome : regularIncome;
  
  // Count of Zoho income transactions
  const zohoIncomeTransactionCount = transactions
    .filter(tx => tx.type === 'income' && tx.source === 'Zoho').length;
    
  // Determine if we have a data issue
  const hasDataIssue = zohoIncomeTransactionCount === 0 && regularIncome === 0;

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
        
        {hasDataIssue && (
          <div className="col-span-3">
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No hay datos de ingresos</AlertTitle>
              <AlertDescription>
                No se encontraron transacciones de ingreso de Zoho Books. Posibles causas:
                <ul className="list-disc pl-5 mt-1">
                  <li>No hay datos para el período seleccionado</li>
                  <li>El webhook de Make.com no está configurado correctamente</li>
                  <li>Hay un problema con la conexión a Zoho Books</li>
                </ul>
                Intenta usar las herramientas de depuración para diagnosticar el problema.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {!hasDataIssue && (
          <>
            {/* Debug information */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400">
                <p>Cálculo directo: {formatCurrency(zohoIncome)}</p>
                <p>Del contexto: {formatCurrency(regularIncome)}</p>
                <p>Cantidad de tx de ingreso Zoho: {zohoIncomeTransactionCount}</p>
              </div>
            )}
            
            {/* Information panel */}
            <div className="col-span-3 flex items-center justify-center py-8">
              <p className="text-gray-500 italic">
                Todos los ingresos registrados directamente en Zoho Books.
                {zohoIncomeTransactionCount > 0 ? 
                  ` (${zohoIncomeTransactionCount} transacciones encontradas)` : 
                  ' Usando datos de respaldo.'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(ZohoIncomeTab);
