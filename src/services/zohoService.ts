
import { zohoRepository } from '../repositories/zohoRepository';

// Export functions from repository to maintain backward compatibility
export const getTransactions = (startDate: Date, endDate: Date, forceRefresh: boolean = false) => 
  zohoRepository.fetchTransactions(startDate, endDate, forceRefresh);

export const getLastRawResponse = () => zohoRepository.getLastRawResponse();

export const getRawResponse = (startDate: Date, endDate: Date, forceRefresh: boolean = false) =>
  zohoRepository.getRawResponse(startDate, endDate, forceRefresh);

export const checkApiConnectivity = () => zohoRepository.checkConnectivity();

export const getUnpaidInvoices = (startDate?: Date, endDate?: Date) => 
  zohoRepository.getUnpaidInvoices(startDate, endDate);

// Provide dummy implementations for backward compatibility
export const repairCache = () => Promise.resolve(true);
export const checkAndRefreshCache = () => Promise.resolve(true);
