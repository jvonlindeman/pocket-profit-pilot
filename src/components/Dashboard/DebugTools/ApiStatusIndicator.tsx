
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useApiConnectivity } from '@/hooks/queries/useApiConnectivity';

interface ApiStatusIndicatorProps {
  className?: string;
}

export function ApiStatusIndicator({ className }: ApiStatusIndicatorProps) {
  const { data: connectivity, isLoading, isError } = useApiConnectivity();
  
  const zohoStatus = connectivity?.zoho;
  const stripeStatus = connectivity?.stripe;
  
  return (
    <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 ${className}`}>
            {isLoading ? (
              <Badge variant="outline" className="bg-gray-100">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Verificando APIs...
              </Badge>
            ) : isError ? (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error de API
              </Badge>
            ) : (
              <>
                <Badge 
                  variant={zohoStatus ? "success" : "destructive"} 
                  className={zohoStatus ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                >
                  {zohoStatus ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  Zoho
                </Badge>
                
                <Badge 
                  variant={stripeStatus ? "success" : "destructive"}
                  className={stripeStatus ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                >
                  {stripeStatus ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  Stripe
                </Badge>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Estado de conexión con APIs externas</p>
        </TooltipContent>
      </Tooltip>
  );
}
