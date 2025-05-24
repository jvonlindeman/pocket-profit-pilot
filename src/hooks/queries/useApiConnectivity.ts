
import { useQuery } from "@tanstack/react-query";
import { dataFetcherService } from "@/services/dataFetcherService";

export const apiConnectivityKeys = {
  all: ["api-connectivity"] as const,
};

export function useApiConnectivity(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: apiConnectivityKeys.all,
    queryFn: async () => {
      return await dataFetcherService.checkApiConnectivity();
    },
    // Connectivity checks should be fairly fresh
    staleTime: 30 * 1000, // 30 seconds
    // Cache it for a bit longer (formerly cacheTime)
    gcTime: 2 * 60 * 1000, // 2 minutes
    enabled: options.enabled !== false,
  });
}
