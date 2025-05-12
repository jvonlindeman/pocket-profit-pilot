
import React from 'react';
import { RefreshCw, RotateCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PeriodHeadingProps {
  periodTitle: string;
  handleRefresh: () => void;
  handleForceRefresh?: () => void;
  handleClearCacheAndRefresh?: () => void;
}

const PeriodHeading: React.FC<PeriodHeadingProps> = ({
  periodTitle,
  handleRefresh,
  handleForceRefresh,
  handleClearCacheAndRefresh
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
              <p>Actualizar usando caché cuando esté disponible</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {handleForceRefresh && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleForceRefresh}>
                  <RotateCw className="h-4 w-4 mr-2" /> Forzar actualización
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ignorar caché y obtener datos frescos de la API</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {handleClearCacheAndRefresh && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleClearCacheAndRefresh}>
                  <Trash2 className="h-4 w-4 mr-2" /> Limpiar caché
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Limpiar caché y obtener datos completamente nuevos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default PeriodHeading;
