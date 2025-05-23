
// Re-export functionality from the repository
import { zohoRepository } from '../repositories/zohoRepository';

// Export functions from repository to maintain backward compatibility
export const getTransactions = zohoRepository.fetchTransactions.bind(zohoRepository);
export const getLastRawResponse = zohoRepository.getLastRawResponse.bind(zohoRepository);
export const getRawResponse = zohoRepository.getRawResponse.bind(zohoRepository);
export const checkApiConnectivity = zohoRepository.checkConnectivity.bind(zohoRepository);
export const getUnpaidInvoices = zohoRepository.getUnpaidInvoices.bind(zohoRepository);

// Provide dummy implementations for backward compatibility
export const repairCache = () => Promise.resolve(true);
export const checkAndRefreshCache = () => Promise.resolve(true);
