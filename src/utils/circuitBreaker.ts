
/**
 * Circuit breaker utility to prevent excessive refresh calls
 */

// Global circuit breaker state to persist across rerenders
interface CircuitBreakerState {
  isRefreshing: boolean;
  lastRefreshTime: number;
  refreshCount: number;
  maxRefreshes: number;
  minRefreshInterval: number; // in milliseconds
  queuedOperations: Array<() => Promise<void>>;
  isProcessingQueue: boolean;
  lastError: Error | null;
  consecutiveErrorCount: number;
}

// Default configuration
const DEFAULT_MAX_REFRESHES = 5; // Increased from 3
const DEFAULT_MIN_REFRESH_INTERVAL = 5000; // Reduced from 10000 to 5 seconds
const MAX_CONSECUTIVE_ERRORS = 3;

export class CircuitBreaker {
  private static instance: CircuitBreaker;
  private state: CircuitBreakerState;

  private constructor() {
    this.state = {
      isRefreshing: false,
      lastRefreshTime: 0,
      refreshCount: 0,
      maxRefreshes: DEFAULT_MAX_REFRESHES,
      minRefreshInterval: DEFAULT_MIN_REFRESH_INTERVAL,
      queuedOperations: [],
      isProcessingQueue: false,
      lastError: null,
      consecutiveErrorCount: 0
    };
  }

  public static getInstance(): CircuitBreaker {
    if (!CircuitBreaker.instance) {
      CircuitBreaker.instance = new CircuitBreaker();
    }
    return CircuitBreaker.instance;
  }

  /**
   * Check if a refresh operation should be allowed
   * @param forceRefresh Whether to bypass certain checks
   * @returns Object indicating if refresh is allowed and reason if not
   */
  public canRefresh(forceRefresh = false): { allowed: boolean; reason?: string } {
    // Check if refresh is already in progress
    if (this.state.isRefreshing) {
      return { allowed: false, reason: 'Refresh already in progress' };
    }
    
    // Check circuit is open due to too many errors
    if (!forceRefresh && this.state.consecutiveErrorCount >= MAX_CONSECUTIVE_ERRORS) {
      return { 
        allowed: false, 
        reason: `Circuit breaker open after ${this.state.consecutiveErrorCount} consecutive errors` 
      };
    }
    
    // Check refresh count limit (bypass if forced)
    if (!forceRefresh && this.state.refreshCount >= this.state.maxRefreshes) {
      return { allowed: false, reason: `Maximum refresh limit (${this.state.maxRefreshes}) reached` };
    }
    
    // Check refresh interval (bypass if forced)
    const now = Date.now();
    if (!forceRefresh && this.state.lastRefreshTime > 0) {
      const timeSinceLastRefresh = now - this.state.lastRefreshTime;
      if (timeSinceLastRefresh < this.state.minRefreshInterval) {
        return { 
          allowed: false, 
          reason: `Too soon for another refresh (${Math.round(timeSinceLastRefresh / 1000)}s ago)` 
        };
      }
    }
    
    return { allowed: true };
  }

  /**
   * Start a refresh operation
   * @param forceRefresh Whether this is a forced refresh
   * @returns Whether the operation was allowed to start
   */
  public startRefresh(forceRefresh = false): boolean {
    const check = this.canRefresh(forceRefresh);
    if (!check.allowed) {
      return false;
    }
    
    this.state.isRefreshing = true;
    this.state.refreshCount++;
    this.state.lastRefreshTime = Date.now();
    return true;
  }

  /**
   * End a refresh operation
   * @param error Optional error if the operation failed
   */
  public endRefresh(error: Error | null = null): void {
    this.state.isRefreshing = false;
    
    if (error) {
      this.state.lastError = error;
      this.state.consecutiveErrorCount++;
      console.error(`Circuit breaker recorded error (${this.state.consecutiveErrorCount}):`, error);
    } else {
      // Reset error count on successful operation
      this.state.consecutiveErrorCount = 0;
      this.state.lastError = null;
    }
    
    // Process any queued operations
    this.processQueue();
  }

  /**
   * Queue an operation to be executed when possible
   * @param operation The function to execute
   * @returns Promise that resolves when the operation completes
   */
  public queueOperation(operation: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const wrappedOperation = async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      this.state.queuedOperations.push(wrappedOperation);
      
      // Try to process the queue immediately
      this.processQueue();
    });
  }

  /**
   * Process the operation queue
   */
  private processQueue(): void {
    if (this.state.isProcessingQueue || this.state.isRefreshing || this.state.queuedOperations.length === 0) {
      return;
    }
    
    this.state.isProcessingQueue = true;
    
    const nextOperation = this.state.queuedOperations.shift();
    if (nextOperation) {
      nextOperation().finally(() => {
        this.state.isProcessingQueue = false;
        // Try to process the next item in queue
        this.processQueue();
      });
    } else {
      this.state.isProcessingQueue = false;
    }
  }

  /**
   * Reset the circuit breaker state
   */
  public reset(): void {
    console.log('🔄 Resetting circuit breaker completely');
    this.state.isRefreshing = false;
    this.state.refreshCount = 0;
    this.state.lastRefreshTime = 0;
    this.state.lastError = null;
    this.state.consecutiveErrorCount = 0;
    this.state.queuedOperations = [];
    this.state.isProcessingQueue = false;
  }

  /**
   * Get the current state of the circuit breaker
   */
  public getState(): Readonly<CircuitBreakerState> {
    return { ...this.state };
  }
}

export const getCircuitBreaker = CircuitBreaker.getInstance;
