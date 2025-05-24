
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/types/financial";
import { zohoRepository } from "@/repositories/zohoRepository";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";
import { queryClient } from "@/lib/react-query/queryClient";

export const zohoTransactionsKeys = {
  all: ["zoho-transactions"] as const,
  byDateRange: (startDate: Date, endDate: Date) => 
    [...zohoTransactionsKeys.all, formatDateYYYYMMDD(startDate), formatDateYYYYMMDD(endDate)] as const,
};

interface UseZohoTransactionsOptions {
  enabled?: boolean;
  onSuccess?: (data: Transaction[]) => void;
  onError?: (error: unknown) => void;
}

export function useZohoTransactions(
  startDate: Date,
  endDate: Date,
  options: UseZohoTransactionsOptions = {}
) {
  return useQuery({
    queryKey: zohoTransactionsKeys.byDateRange(startDate, endDate),
    queryFn: async () => {
      return await zohoRepository.getTransactions(startDate, endDate);
    },
    enabled: options.enabled !== false,
    meta: {
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  });
}

export function useInvalidateZohoTransactions() {
  const invalidateByDateRange = async (startDate: Date, endDate: Date) => {
    await queryClient.invalidateQueries({
      queryKey: zohoTransactionsKeys.byDateRange(startDate, endDate),
    });
  };

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: zohoTransactionsKeys.all,
    });
  };

  return {
    invalidateByDateRange,
    invalidateAll,
  };
}
