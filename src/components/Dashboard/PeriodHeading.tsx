
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PeriodHeadingProps {
  periodTitle: string;
  handleRefresh: () => void;
}

const PeriodHeading: React.FC<PeriodHeadingProps> = ({
  periodTitle,
  handleRefresh
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-700">
        Periodo: <span className="text-gray-900">{periodTitle}</span>
      </h2>
      <div className="flex space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Actualizar los datos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default PeriodHeading;
