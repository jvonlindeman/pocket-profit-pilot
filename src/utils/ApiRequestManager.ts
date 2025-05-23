
/**
 * ApiRequestManager
 * 
 * A utility to deduplicate API requests and provide in-memory caching
 * to prevent redundant API calls for the same data.
 */

interface CachedRequest<T> {
  promise: Promise<T>;
  data?: T;
  timestamp: number;
  error?: any;
}

export class ApiRequestManager {
  private static instance: ApiRequestManager;
  private requestCache: Record<string, CachedRequest<any>> = {};
  private DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get the singleton instance of ApiRequestManager
   */
  public static getInstance(): ApiRequestManager {
    if (!ApiRequestManager.instance) {
      ApiRequestManager.instance = new ApiRequestManager();
    }
    return ApiRequestManager.instance;
  }
  
  /**
   * Execute a request with deduplication
   * @param cacheKey A unique key for this request
   * @param requestFn The function that performs the actual API request
   * @param ttl Time to live in milliseconds for the cache entry
   */
  public async executeRequest<T>(
    cacheKey: string,
    requestFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Check if we have a pending request or a cached response
    const cachedRequest = this.requestCache[cacheKey];
    const now = Date.now();
    
    // If there's a cached request
    if (cachedRequest) {
      // If the request is still in progress, return the existing promise
      if (!cachedRequest.data && !cachedRequest.error) {
        console.log(`ApiRequestManager: Reusing in-progress request for key "${cacheKey}"`);
        return cachedRequest.promise;
      }
      
      // If we have cached data that's still valid
      if (cachedRequest.data && now - cachedRequest.timestamp < ttl) {
        console.log(`ApiRequestManager: Using cached result for key "${cacheKey}", age: ${(now - cachedRequest.timestamp) / 1000}s`);
        return cachedRequest.data;
      }
    }
    
    // If we got here, we need to make a new request
    console.log(`ApiRequestManager: Making new request for key "${cacheKey}"`);
    
    // Create a promise wrapper that will update the cache
    const promise = (async () => {
      try {
        const result = await requestFn();
        
        // Update the cache
        if (this.requestCache[cacheKey]) {
          this.requestCache[cacheKey].data = result;
          this.requestCache[cacheKey].timestamp = Date.now();
          this.requestCache[cacheKey].error = undefined;
        }
        
        return result;
      } catch (error) {
        // Store the error in the cache
        if (this.requestCache[cacheKey]) {
          this.requestCache[cacheKey].error = error;
          this.requestCache[cacheKey].timestamp = Date.now();
        }
        
        throw error;
      }
    })();
    
    // Store the promise in the cache
    this.requestCache[cacheKey] = {
      promise,
      timestamp: now
    };
    
    return promise;
  }
  
  /**
   * Clear a specific cache entry
   */
  public clearCacheEntry(cacheKey: string): boolean {
    if (this.requestCache[cacheKey]) {
      delete this.requestCache[cacheKey];
      return true;
    }
    return false;
  }
  
  /**
   * Clear all cache entries
   */
  public clearCache(): void {
    this.requestCache = {};
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats(): { totalEntries: number, activePromises: number } {
    const entries = Object.values(this.requestCache);
    return {
      totalEntries: entries.length,
      activePromises: entries.filter(entry => !entry.data && !entry.error).length
    };
  }
}

// Export a singleton instance
export const apiRequestManager = ApiRequestManager.getInstance();
