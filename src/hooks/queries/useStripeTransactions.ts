
import { useQuery } from "@tanstack/react-query";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";
import { stripeRepository } from "@/repositories/stripeRepository";
import { queryClient } from "@/lib/react-query/queryClient";

export const stripeTransactionsKeys = {
  all: ["stripe-transactions"] as const,
  byDateRange: (startDate: Date, endDate: Date) => 
    [...stripeTransactionsKeys.all, formatDateYYYYMMDD(startDate), formatDateYYYYMMDD(endDate)] as const,
};

interface UseStripeTransactionsOptions {
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
}

export function useStripeTransactions(
  startDate: Date,
  endDate: Date,
  options: UseStripeTransactionsOptions = {}
) {
  return useQuery({
    queryKey: stripeTransactionsKeys.byDateRange(startDate, endDate),
    queryFn: async () => {
      return await stripeRepository.getTransactions(startDate, endDate);
    },
    enabled: options.enabled !== false,
    meta: {
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  });
}

export function useInvalidateStripeTransactions() {
  const invalidateByDateRange = async (startDate: Date, endDate: Date) => {
    await queryClient.invalidateQueries({
      queryKey: stripeTransactionsKeys.byDateRange(startDate, endDate),
    });
  };

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: stripeTransactionsKeys.all,
    });
  };

  return {
    invalidateByDateRange,
    invalidateAll,
  };
}
