
import { zohoRepository } from "../repositories/zohoRepository";
import { Transaction } from "../types/financial";

/**
 * Get transactions for a specified date range
 */
export async function getTransactions(
  startDate: Date,
  endDate: Date,
  forceRefresh = false
): Promise<Transaction[]> {
  return await zohoRepository.getTransactions(startDate, endDate, forceRefresh);
}

/**
 * Get raw response data for debugging
 */
export async function getRawResponse(
  startDate: Date,
  endDate: Date,
  forceRefresh = false
): Promise<any> {
  return await zohoRepository.getRawResponse(startDate, endDate, forceRefresh);
}

/**
 * Check API connectivity
 */
export async function checkApiConnectivity(): Promise<boolean> {
  return await zohoRepository.checkApiConnectivity();
}
