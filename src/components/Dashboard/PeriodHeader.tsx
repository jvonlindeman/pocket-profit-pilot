
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PeriodHeaderProps {
  periodTitle: string;
  onRefresh: () => void;
}

const PeriodHeader: React.FC<PeriodHeaderProps> = ({ periodTitle, onRefresh }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-700">
        Periodo: <span className="text-gray-900">{periodTitle}</span>
      </h2>
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
      </Button>
    </div>
  );
};

export default PeriodHeader;
