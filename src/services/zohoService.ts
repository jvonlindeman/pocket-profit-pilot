
// Re-export functionality from the repository
import { zohoRepository } from '../repositories/zohoRepository';

// Export functions from repository to maintain backward compatibility
export const getTransactions = zohoRepository.getTransactions.bind(zohoRepository);
export const getLastRawResponse = zohoRepository.getLastRawResponse.bind(zohoRepository);
export const getRawResponse = zohoRepository.getRawResponse.bind(zohoRepository);
export const checkApiConnectivity = zohoRepository.checkApiConnectivity.bind(zohoRepository);
export const repairCache = zohoRepository.repairCache.bind(zohoRepository);
export const checkAndRefreshCache = zohoRepository.checkAndRefreshCache.bind(zohoRepository);
export const getUnpaidInvoices = zohoRepository.getUnpaidInvoices.bind(zohoRepository);
