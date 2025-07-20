
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

// Helper function to validate if a transaction date is within the expected range
const isTransactionInDateRange = (transaction: Transaction, startDate: Date, endDate: Date): boolean => {
  try {
    const transactionDate = new Date(transaction.date + 'T00:00:00');
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    return transactionDate >= start && transactionDate <= end;
  } catch (error) {
    console.error(`❌ useZohoTransactions: Error validating transaction date: ${transaction.date}`, error);
    return false;
  }
};

export function useZohoTransactions(
  startDate: Date,
  endDate: Date,
  options: UseZohoTransactionsOptions = {}
) {
  return useQuery({
    queryKey: zohoTransactionsKeys.byDateRange(startDate, endDate),
    queryFn: async () => {
      console.log(`🔍 useZohoTransactions: Fetching transactions for range ${formatDateYYYYMMDD(startDate)} to ${formatDateYYYYMMDD(endDate)}`);
      
      const transactions = await zohoRepository.getTransactions(startDate, endDate);
      
      // Enhanced validation: filter transactions that are outside the requested date range
      const filteredTransactions = transactions.filter(transaction => {
        const isInRange = isTransactionInDateRange(transaction, startDate, endDate);
        
        if (!isInRange) {
          console.warn(`⚠️ useZohoTransactions: FILTERING OUT-OF-RANGE TRANSACTION:`, {
            description: transaction.description,
            date: transaction.date,
            amount: transaction.amount,
            requestedRange: `${formatDateYYYYMMDD(startDate)} to ${formatDateYYYYMMDD(endDate)}`,
            source: transaction.source
          });
        }
        
        return isInRange;
      });
      
      if (filteredTransactions.length !== transactions.length) {
        console.warn(`⚠️ useZohoTransactions: FILTERED ${transactions.length - filteredTransactions.length} transactions outside date range:`, {
          originalCount: transactions.length,
          filteredCount: filteredTransactions.length,
          requestedRange: `${formatDateYYYYMMDD(startDate)} to ${formatDateYYYYMMDD(endDate)}`
        });
      }
      
      console.log(`✅ useZohoTransactions: Returning ${filteredTransactions.length} validated transactions for range ${formatDateYYYYMMDD(startDate)} to ${formatDateYYYYMMDD(endDate)}`);
      
      return filteredTransactions;
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
