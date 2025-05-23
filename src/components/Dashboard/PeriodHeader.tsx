
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ApiCallsTracker from './ApiCallsTracker';

interface PeriodHeaderProps {
  periodTitle: string;
  onRefresh: () => void;
}

const PeriodHeader: React.FC<PeriodHeaderProps> = ({ periodTitle, onRefresh }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-700">
          Periodo: <span className="text-gray-900">{periodTitle}</span>
        </h2>
        <ApiCallsTracker />
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
      </Button>
    </div>
  );
};

export default PeriodHeader;
