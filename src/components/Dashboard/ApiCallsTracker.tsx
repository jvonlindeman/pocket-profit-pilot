
import React from 'react';
import { useApiCalls } from '@/contexts/ApiCallsContext';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap } from 'lucide-react';
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
  const { zohoApiCalls, stripeApiCalls, webhookCallsCount, getTotalApiCalls } = useApiCalls();

  // Determine if there are duplicate webhook calls
  const hasDuplicateCalls = webhookCallsCount > 1;

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
              <div className="flex justify-between gap-4">
                <span className="text-xs font-medium text-gray-600">Webhook Calls:</span>
                <Badge 
                  variant="outline" 
                  className={hasDuplicateCalls 
                    ? "bg-red-50 text-red-700 border-red-200" 
                    : "bg-orange-50 text-orange-700"
                  }
                >
                  {webhookCallsCount}
                </Badge>
              </div>
              {hasDuplicateCalls && (
                <div className="mt-1 text-xs text-red-600 font-medium">
                  ⚠️ Duplicate calls detected!
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Show webhook calls indicator when there are calls */}
        {webhookCallsCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`rounded-md px-2 py-1 flex items-center gap-1 text-sm ${
                hasDuplicateCalls 
                  ? "bg-red-100 border border-red-200" 
                  : "bg-orange-100"
              }`}>
                <Zap className={`h-4 w-4 ${
                  hasDuplicateCalls ? "text-red-600" : "text-orange-600"
                }`} />
                <span className={`font-medium ${
                  hasDuplicateCalls ? "text-red-700" : "text-orange-700"
                }`}>
                  {webhookCallsCount}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {hasDuplicateCalls 
                  ? `⚠️ ${webhookCallsCount} webhook calls in this load (duplicates detected!)`
                  : `${webhookCallsCount} webhook call${webhookCallsCount > 1 ? 's' : ''} in this load`
                }
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};

export default ApiCallsTracker;
