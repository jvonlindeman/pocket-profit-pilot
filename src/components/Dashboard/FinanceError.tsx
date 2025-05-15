
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface FinanceErrorProps {
  error: string;
  onRetry: () => void;
}

const FinanceError: React.FC<FinanceErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
      <p>{error}</p>
      <Button variant="outline" className="mt-2" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
      </Button>
    </div>
  );
};

export default FinanceError;
