
import { useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import StripeService from '@/services/stripeService';

/**
 * Hook to handle Stripe debugging operations
 */
export const useStripeDebug = () => {
  // Function to debug Stripe transactions caching
  const debugStripeCaching = useCallback(async (dateRange: { startDate: Date; endDate: Date }) => {
    try {
      const result = await StripeService.debugCacheProcess(dateRange.startDate, dateRange.endDate);
      
      console.log("Stripe Cache Debug Results:", result);
      
      toast({
        title: "Stripe Cache Debugging Complete",
        description: `Found ${result.transactionCount || 0} transactions. Check console for details.`,
        variant: result.status === 'error' ? 'destructive' : 'default'
      });
      
      return result;
    } catch (err) {
      console.error("Error debugging Stripe cache:", err);
      toast({
        title: "Stripe Cache Debug Error",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive"
      });
      return { status: 'error', error: err };
    }
  }, []);

  return { debugStripeCaching };
};
