
import { useQuery } from "@tanstack/react-query";
import { dataFetcherService } from "@/services/dataFetcherService";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";

export const cacheStatusKeys = {
  all: ["cache-status"] as const,
  byDateRange: (startDate: Date, endDate: Date) => 
    [...cacheStatusKeys.all, formatDateYYYYMMDD(startDate), formatDateYYYYMMDD(endDate)] as const,
};

export interface CacheStatusData {
  zoho: {
    cached: boolean;
    partial: boolean;
  };
  stripe: {
    cached: boolean;
    partial: boolean;
  };
}

export function useCacheStatus(
  startDate: Date,
  endDate: Date,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: cacheStatusKeys.byDateRange(startDate, endDate),
    queryFn: async (): Promise<CacheStatusData> => {
      // Get the cache status from the service
      const result = await dataFetcherService.checkCacheStatus({
        startDate,
        endDate,
      });
      
      // Ensure we return a valid data structure even if the service returns incomplete data
      return {
        zoho: result?.zoho || { cached: false, partial: false },
        stripe: result?.stripe || { cached: false, partial: false }
      };
    },
    // Cache status checks can be a bit stale since they don't change that often
    staleTime: 30 * 1000, // 30 seconds
    enabled: options.enabled !== false,
  });
}
