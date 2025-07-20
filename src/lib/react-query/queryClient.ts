import { QueryClient, keepPreviousData } from "@tanstack/react-query";

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Only refetch when window regains focus if data is older than 5 minutes
      staleTime: 5 * 60 * 1000,
      // Automatically try to refetch 3 times on failure
      retry: 3,
      // Don't retry if the error is a 404 or 403
      retryOnMount: true,
      // Show previous data while new data is being fetched (formerly keepPreviousData)
      placeholderData: keepPreviousData,
    },
  },
});
