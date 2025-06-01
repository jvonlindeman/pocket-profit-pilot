
import { CacheService } from "./core/cacheService";
import type { CacheClearOptions, CacheResponse, CacheResult, DetailedCacheStats, CacheSource, CacheStats } from "./types";

/**
 * Main cache service instance - Enhanced with improved collaborator data handling
 */
const cacheServiceInstance = new CacheService();

// Export the service instance as default
export default cacheServiceInstance;

// Use export type for types to fix the isolatedModules issue
export type { CacheClearOptions, CacheResponse, CacheResult, DetailedCacheStats, CacheSource, CacheStats };
