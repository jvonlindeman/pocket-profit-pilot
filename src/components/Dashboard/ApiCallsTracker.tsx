
import React from 'react';
import { useApiCalls } from '@/contexts/ApiCallsContext';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ApiCallsTrackerProps {
  className?: string;
}

const ApiCallsTracker: React.FC<ApiCallsTrackerProps> = ({ className = "" }) => {
  const { zohoApiCalls, stripeApiCalls, getTotalApiCalls } = useApiCalls();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-gray-100 rounded-md px-2 py-1 flex items-center gap-1 text-sm">
              <RefreshCw className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700 font-medium">
                {getTotalApiCalls()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="w-auto">
            <div className="flex flex-col gap-1 p-1">
              <div className="flex justify-between gap-4">
                <span className="text-xs font-medium text-gray-600">Zoho:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {zohoApiCalls}
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-xs font-medium text-gray-600">Stripe:</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  {stripeApiCalls}
                </Badge>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ApiCallsTracker;
