
import { useState, useEffect, useCallback } from 'react';
import { useCacheContext } from '@/contexts/CacheContext';
import { CacheEvent, CacheMetrics } from '@/types/cache';

// Global events array for cache monitoring
let cacheEvents: CacheEvent[] = [];

// Add event to the tracker - exported for direct use in some components
export const logCacheEvent = (
  type: CacheEvent['type'], 
  source: string, 
  details?: any,
  dateRange?: { startDate: Date; endDate: Date },
  durationMs?: number
) => {
  const event: CacheEvent = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    source,
    timestamp: new Date(),
    dateRange,
    details,
    durationMs
  };
  
  // Add to the global array (limited to latest 100)
  cacheEvents = [event, ...cacheEvents].slice(0, 100);
  
  // Notify via custom event
  const customEvent = new CustomEvent('cache-event', { detail: event });
  window.dispatchEvent(customEvent);
  
  console.log(`CacheMonitor: ${type} (${source})`, details || '');
  
  return event;
};

// Clear all monitoring events
export const clearCacheEvents = () => {
  cacheEvents = [];
  const customEvent = new CustomEvent('cache-events-cleared');
  window.dispatchEvent(customEvent);
};

// Hook for monitoring cache events
export const useCacheMonitoring = () => {
  const [events, setEvents] = useState<CacheEvent[]>([]);
  const [stats, setStats] = useState<CacheMetrics>({
    hits: 0,
    misses: 0,
    apiCalls: 0,
    zohoHits: 0,
    zohoMisses: 0,
    stripeHits: 0,
    stripeMisses: 0,
    averageDuration: 0
  });

  // Subscribe to cache events
  useEffect(() => {
    const handleCacheEvent = (e: CustomEvent<CacheEvent>) => {
      setEvents(prev => [e.detail, ...prev].slice(0, 100));
    };

    const handleEventsCleared = () => {
      setEvents([]);
    };

    window.addEventListener('cache-event', handleCacheEvent as EventListener);
    window.addEventListener('cache-events-cleared', handleEventsCleared);
    
    // Initialize with existing events
    setEvents([...cacheEvents]);
    
    return () => {
      window.removeEventListener('cache-event', handleCacheEvent as EventListener);
      window.removeEventListener('cache-events-cleared', handleEventsCleared);
    };
  }, []);

  // Calculate statistics whenever events change
  useEffect(() => {
    const hits = events.filter(e => e.type === 'hit').length;
    const misses = events.filter(e => e.type === 'miss').length;
    const apiCalls = events.filter(e => e.type === 'api_call').length;
    
    const zohoHits = events.filter(e => e.type === 'hit' && e.source === 'Zoho').length;
    const zohoMisses = events.filter(e => e.type === 'miss' && e.source === 'Zoho').length;
    const stripeHits = events.filter(e => e.type === 'hit' && e.source === 'Stripe').length;
    const stripeMisses = events.filter(e => e.type === 'miss' && e.source === 'Stripe').length;
    
    const eventsWithDuration = events.filter(e => e.durationMs !== undefined);
    const averageDuration = eventsWithDuration.length > 0
      ? eventsWithDuration.reduce((sum, e) => sum + (e.durationMs || 0), 0) / eventsWithDuration.length
      : 0;
    
    setStats({
      hits,
      misses,
      apiCalls,
      zohoHits,
      zohoMisses,
      stripeHits,
      stripeMisses,
      averageDuration
    });
  }, [events]);

  // Function to clear logs
  const clearLogs = useCallback(() => {
    clearCacheEvents();
  }, []);

  return {
    events,
    stats,
    clearLogs
  };
};
