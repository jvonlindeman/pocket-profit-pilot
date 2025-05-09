
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
}

// Default configuration
const DEFAULT_MAX_REFRESHES = 3;
const DEFAULT_MIN_REFRESH_INTERVAL = 10000; // 10 seconds

export class CircuitBreaker {
  private static instance: CircuitBreaker;
  private state: CircuitBreakerState;

  private constructor() {
    this.state = {
      isRefreshing: false,
      lastRefreshTime: 0,
      refreshCount: 0,
      maxRefreshes: DEFAULT_MAX_REFRESHES,
      minRefreshInterval: DEFAULT_MIN_REFRESH_INTERVAL
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
   */
  public endRefresh(): void {
    this.state.isRefreshing = false;
  }

  /**
   * Reset the circuit breaker state
   */
  public reset(): void {
    this.state.isRefreshing = false;
    this.state.refreshCount = 0;
    this.state.lastRefreshTime = 0;
  }

  /**
   * Get the current state of the circuit breaker
   */
  public getState(): Readonly<CircuitBreakerState> {
    return { ...this.state };
  }
}

export const getCircuitBreaker = CircuitBreaker.getInstance;
