
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Info } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CacheStatusDisplayProps {
  lastRefresh: Date | null;
  onRefreshClick: () => void;
  isRefreshing: boolean;
  refreshCount?: number;
}

export const CacheStatusDisplay: React.FC<CacheStatusDisplayProps> = ({
  lastRefresh,
  onRefreshClick,
  isRefreshing,
  refreshCount
}) => {
  // Calculate time since last refresh
  const lastRefreshTime = lastRefresh 
    ? formatDistanceToNow(new Date(lastRefresh), { addSuffix: true, locale: es }) 
    : "Nunca";
  
  // Handler with anti-bounce protection
  const handleRefreshClick = () => {
    if (!isRefreshing) {
      onRefreshClick();
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center">
            Estado del Datos
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-1 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Información sobre cuándo se actualizaron por última vez los datos.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center" 
            onClick={handleRefreshClick}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refrescando...' : 'Refrescar'}
          </Button>
        </CardTitle>
        <CardDescription className="text-xs">
          Última actualización: {lastRefreshTime}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs space-y-1">
          {typeof refreshCount === 'number' && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-gray-600">
              <div>Refrescos en esta sesión: {refreshCount}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheStatusDisplay;
