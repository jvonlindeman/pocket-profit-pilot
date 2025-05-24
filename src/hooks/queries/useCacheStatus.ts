
import { useQuery } from "@tanstack/react-query";
import { dataFetcherService } from "@/services/dataFetcherService";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";

export const cacheStatusKeys = {
  all: ["cache-status"] as const,
  byDateRange: (startDate: Date, endDate: Date) => 
    [...cacheStatusKeys.all, formatDateYYYYMMDD(startDate), formatDateYYYYMMDD(endDate)] as const,
};

export function useCacheStatus(
  startDate: Date,
  endDate: Date,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: cacheStatusKeys.byDateRange(startDate, endDate),
    queryFn: async () => {
      return await dataFetcherService.checkCacheStatus({
        startDate,
        endDate,
      });
    },
    // Cache status checks can be a bit stale since they don't change that often
    staleTime: 30 * 1000, // 30 seconds
    enabled: options.enabled !== false,
  });
}
