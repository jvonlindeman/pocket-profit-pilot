
/**
 * ApiRequestManager handles request deduplication and caching at the application level
 * This ensures that identical requests are not made multiple times and provides
 * a consistent caching layer across all API operations.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RequestState {
  promise: Promise<any>;
  timestamp: number;
}

export class ApiRequestManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private inFlightRequests: Map<string, RequestState> = new Map();
  private requestCooldowns: Map<string, number> = new Map();

  /**
   * Execute a request with deduplication and caching
   */
  async executeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 5 * 60 * 1000, // 5 minutes default TTL
    cooldownMs: number = 1000 // 1 second default cooldown
  ): Promise<T> {
    console.log(`🔧 ApiRequestManager: Executing request for key: ${key}`);
    
    // Check if there's a valid cached entry
    const cachedEntry = this.cache.get(key);
    const now = Date.now();
    
    if (cachedEntry && (now - cachedEntry.timestamp) < cachedEntry.ttl) {
      console.log(`💾 ApiRequestManager: Cache HIT for ${key} (age: ${Math.round((now - cachedEntry.timestamp) / 1000)}s)`);
      return cachedEntry.data;
    }

    // Check if there's already an in-flight request
    const inFlight = this.inFlightRequests.get(key);
    if (inFlight) {
      console.log(`✈️ ApiRequestManager: Request already in-flight for ${key}, waiting for completion`);
      return await inFlight.promise;
    }

    // Check cooldown period
    const lastRequestTime = this.requestCooldowns.get(key) || 0;
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < cooldownMs) {
      const remainingCooldown = cooldownMs - timeSinceLastRequest;
      console.log(`⏰ ApiRequestManager: Request ${key} is in cooldown, waiting ${remainingCooldown}ms`);
      
      // Return cached data if available during cooldown
      if (cachedEntry) {
        console.log(`💾 ApiRequestManager: Returning stale cache during cooldown for ${key}`);
        return cachedEntry.data;
      }
      
      // Wait for cooldown to complete
      await new Promise(resolve => setTimeout(resolve, remainingCooldown));
    }

    // Create and execute the request
    console.log(`🚀 ApiRequestManager: Making fresh request for ${key}`);
    const requestPromise = requestFn();
    
    // Store in-flight request
    this.inFlightRequests.set(key, {
      promise: requestPromise,
      timestamp: now
    });

    // Update request time for cooldown tracking
    this.requestCooldowns.set(key, now);

    try {
      const result = await requestPromise;
      
      // Cache the successful result
      if (ttl > 0) {
        this.cache.set(key, {
          data: result,
          timestamp: now,
          ttl
        });
        console.log(`💾 ApiRequestManager: Cached result for ${key} (TTL: ${Math.round(ttl / 1000)}s)`);
      }

      return result;
    } catch (error) {
      console.error(`❌ ApiRequestManager: Request failed for ${key}:`, error);
      throw error;
    } finally {
      // Clean up in-flight request
      this.inFlightRequests.delete(key);
    }
  }

  /**
   * Clear a specific cache entry (useful for force refresh)
   */
  clearCacheEntry(key: string): void {
    const cleared = this.cache.delete(key);
    if (cleared) {
      console.log(`🗑️ ApiRequestManager: Cleared cache entry for ${key}`);
    }
    
    // Also clear any cooldown for immediate refresh
    this.requestCooldowns.delete(key);
    console.log(`🔄 ApiRequestManager: Cleared cooldown for ${key}`);
  }

  /**
   * Clear all cache entries (useful for global refresh)
   */
  clearAllCache(): void {
    const cacheSize = this.cache.size;
    this.cache.clear();
    this.requestCooldowns.clear();
    console.log(`🗑️ ApiRequestManager: Cleared all cache (${cacheSize} entries)`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    totalInFlight: number;
    entries: Array<{
      key: string;
      age: number;
      ttl: number;
      isExpired: boolean;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
      isExpired: (now - entry.timestamp) >= entry.ttl
    }));

    return {
      totalEntries: this.cache.size,
      totalInFlight: this.inFlightRequests.size,
      entries
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredEntries(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 ApiRequestManager: Cleaned up ${cleanedCount} expired cache entries`);
    }

    return cleanedCount;
  }
}

// Export a singleton instance
export const apiRequestManager = new ApiRequestManager();

// Auto-cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiRequestManager.cleanupExpiredEntries();
  }, 5 * 60 * 1000);
}
