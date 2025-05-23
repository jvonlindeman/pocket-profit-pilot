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
  requestId?: string;
  cooldownUntil?: number; // Cooldown timestamp
  inProgress: boolean; // Flag to track in-progress requests
}

// Global request lock to prevent concurrent requests with the same key
let globalRequestLocks: Record<string, boolean> = {};

export class ApiRequestManager {
  private static instance: ApiRequestManager;
  private requestCache: Record<string, CachedRequest<any>> = {};
  private DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL
  private DEFAULT_COOLDOWN = 10 * 1000; // 10 seconds cooldown between identical requests
  private pendingRequests = new Set<string>(); // Track pending requests by key
  
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
   * Execute a request with strict deduplication
   * @param cacheKey A unique key for this request
   * @param requestFn The function that performs the actual API request
   * @param ttl Time to live in milliseconds for the cache entry
   * @param cooldown Time in milliseconds to prevent repeat calls with the same parameters
   */
  public async executeRequest<T>(
    cacheKey: string,
    requestFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
    cooldown: number = this.DEFAULT_COOLDOWN
  ): Promise<T> {
    // Generate a unique request ID for tracing
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Check if we have a pending request or a cached response
    const cachedRequest = this.requestCache[cacheKey];
    const now = Date.now();
    
    // Check global lock first - this prevents concurrent identical requests
    if (globalRequestLocks[cacheKey]) {
      console.log(`ApiRequestManager: GLOBAL LOCK active for key "${cacheKey}", waiting for existing request (${requestId})`);
      
      // If there's a cached request with a promise, return it
      if (cachedRequest && cachedRequest.promise) {
        return cachedRequest.promise;
      }
      
      // Otherwise we need to wait a bit and retry - simulating waiting for the lock
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.executeRequest(cacheKey, requestFn, ttl, cooldown);
    }
    
    // If there's a cached request
    if (cachedRequest) {
      // 1. If we're in cooldown period, strictly return the cached data or pending promise
      if (cachedRequest.cooldownUntil && now < cachedRequest.cooldownUntil) {
        console.log(`ApiRequestManager: Request in cooldown for key "${cacheKey}", remaining: ${(cachedRequest.cooldownUntil - now) / 1000}s (${requestId})`);
        if (cachedRequest.data) {
          return cachedRequest.data;
        } else {
          return cachedRequest.promise;
        }
      }
      
      // 2. If the request is still in progress, always return the existing promise
      if (cachedRequest.inProgress) {
        console.log(`ApiRequestManager: Reusing in-progress request for key "${cacheKey}" (${requestId})`);
        return cachedRequest.promise;
      }
      
      // 3. If we have cached data that's still valid
      if (cachedRequest.data && now - cachedRequest.timestamp < ttl) {
        console.log(`ApiRequestManager: Using cached result for key "${cacheKey}", age: ${(now - cachedRequest.timestamp) / 1000}s (${requestId})`);
        return cachedRequest.data;
      }
      
      console.log(`ApiRequestManager: Cache expired for key "${cacheKey}", fetching fresh data (${requestId})`);
    } else {
      console.log(`ApiRequestManager: No cache entry for key "${cacheKey}" (${requestId})`);
    }
    
    // Set the global request lock to prevent concurrent requests with the same key
    globalRequestLocks[cacheKey] = true;
    
    // Remember we're tracking this request in the pending set
    this.pendingRequests.add(cacheKey);
    
    try {
      // If we got here, we need to make a new request
      console.log(`ApiRequestManager: Making new request for key "${cacheKey}" (${requestId})`);
      
      // Create a promise wrapper that will update the cache
      const promise = (async () => {
        try {
          console.log(`ApiRequestManager: Executing request function for key "${cacheKey}" (${requestId})`);
          const result = await requestFn();
          
          // Update the cache
          if (this.requestCache[cacheKey]) {
            this.requestCache[cacheKey].data = result;
            this.requestCache[cacheKey].timestamp = Date.now();
            this.requestCache[cacheKey].error = undefined;
            this.requestCache[cacheKey].inProgress = false;
            // Set cooldown period to prevent rapid duplicate calls
            this.requestCache[cacheKey].cooldownUntil = Date.now() + cooldown;
            console.log(`ApiRequestManager: Updated cache for key "${cacheKey}" with new data, cooldown until: ${new Date(this.requestCache[cacheKey].cooldownUntil!).toISOString()} (${requestId})`);
          }
          
          return result;
        } catch (error) {
          // Store the error in the cache
          console.error(`ApiRequestManager: Error for key "${cacheKey}" (${requestId}):`, error);
          if (this.requestCache[cacheKey]) {
            this.requestCache[cacheKey].error = error;
            this.requestCache[cacheKey].timestamp = Date.now();
            this.requestCache[cacheKey].inProgress = false;
            // Even for errors, set a cooldown to prevent hammering
            this.requestCache[cacheKey].cooldownUntil = Date.now() + Math.min(cooldown, 1000);
          }
          
          throw error;
        } finally {
          // Always clean up - remove from pending and release lock
          this.pendingRequests.delete(cacheKey);
          globalRequestLocks[cacheKey] = false;
        }
      })();
      
      // Store the promise in the cache
      this.requestCache[cacheKey] = {
        promise,
        timestamp: now,
        requestId,
        cooldownUntil: now + cooldown,
        inProgress: true
      };
      
      return promise;
    } catch (err) {
      // If something goes wrong with setting up the promise, clean up
      this.pendingRequests.delete(cacheKey);
      globalRequestLocks[cacheKey] = false;
      throw err;
    }
  }
  
  /**
   * Clear a specific cache entry
   */
  public clearCacheEntry(cacheKey: string): boolean {
    if (this.requestCache[cacheKey]) {
      console.log(`ApiRequestManager: Clearing cache entry for "${cacheKey}"`);
      delete this.requestCache[cacheKey];
      // Also clear any global lock
      globalRequestLocks[cacheKey] = false;
      this.pendingRequests.delete(cacheKey);
      return true;
    }
    console.log(`ApiRequestManager: No cache entry to clear for "${cacheKey}"`);
    return false;
  }
  
  /**
   * Clear all cache entries
   */
  public clearCache(): void {
    console.log(`ApiRequestManager: Clearing entire cache (${Object.keys(this.requestCache).length} entries)`);
    this.requestCache = {};
    // Clear all global locks
    globalRequestLocks = {};
    this.pendingRequests.clear();
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats(): { totalEntries: number, activePromises: number, keys: string[], pendingRequests: string[] } {
    const entries = Object.entries(this.requestCache);
    return {
      totalEntries: entries.length,
      activePromises: entries.filter(([_, entry]) => entry.inProgress).length,
      keys: Object.keys(this.requestCache),
      pendingRequests: Array.from(this.pendingRequests)
    };
  }
  
  /**
   * Check if a request is locked or in progress
   */
  public isRequestLocked(cacheKey: string): boolean {
    return !!globalRequestLocks[cacheKey] || this.pendingRequests.has(cacheKey);
  }
}

// Export a singleton instance
export const apiRequestManager = ApiRequestManager.getInstance();
