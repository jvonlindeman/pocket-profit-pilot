
export interface CacheEvent {
  id: string;
  type: 'check' | 'hit' | 'miss' | 'store' | 'api_call' | 'force_refresh' | 'clear';
  source: 'Zoho' | 'Stripe' | 'memory' | 'system' | 'all';
  timestamp: Date;
  dateRange?: { startDate: Date; endDate: Date };
  details?: any;
  durationMs?: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  apiCalls: number;
  zohoHits: number;
  zohoMisses: number;
  stripeHits: number;
  stripeMisses: number;
  averageDuration: number;
}
