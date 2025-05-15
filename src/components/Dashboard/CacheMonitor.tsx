
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import CacheService from '@/services/cache';
import { formatDateForDisplay } from '@/utils/dateUtils';

// Types for monitoring cache events
interface CacheEvent {
  id: string;
  type: 'check' | 'hit' | 'miss' | 'store' | 'api_call' | 'force_refresh';
  source: 'Zoho' | 'Stripe' | 'memory' | 'system';
  timestamp: Date;
  dateRange?: { startDate: Date; endDate: Date };
  details?: any;
  durationMs?: number;
}

// Global tracker for cache events
let cacheEvents: CacheEvent[] = [];

// Add event to the tracker
export const logCacheEvent = (
  type: CacheEvent['type'], 
  source: CacheEvent['source'], 
  details?: any,
  dateRange?: CacheEvent['dateRange'],
  durationMs?: number
) => {
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    source,
    timestamp: new Date(),
    dateRange,
    details,
    durationMs
  };
  
  cacheEvents = [event, ...cacheEvents].slice(0, 100); // Keep last 100 events
  
  // If it's an API call, show a toast notification
  if (type === 'api_call') {
    toast({
      title: `${source} API Call`,
      description: `Calling external ${source} API${dateRange ? ` for ${formatDateForDisplay(dateRange.startDate)} - ${formatDateForDisplay(dateRange.endDate)}` : ''}`,
      variant: "default"
    });
  }
  
  console.log(`CacheMonitor: ${type} (${source})`, details || '');
  
  // Notify any active monitors via custom event
  const customEvent = new CustomEvent('cache-event', { detail: event });
  window.dispatchEvent(customEvent);
  
  return event;
};

// Clear all events (for testing)
export const clearCacheEvents = () => {
  cacheEvents = [];
  const customEvent = new CustomEvent('cache-events-cleared');
  window.dispatchEvent(customEvent);
};

// Cache Monitor Component
const CacheMonitor: React.FC = () => {
  const [events, setEvents] = useState<CacheEvent[]>([]);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [cacheStats, setCacheStats] = useState<{
    hits: number;
    misses: number;
    apiCalls: number;
    zohoHits: number;
    zohoMisses: number;
    stripeHits: number;
    stripeMisses: number;
    averageDuration: number;
  }>({
    hits: 0,
    misses: 0,
    apiCalls: 0,
    zohoHits: 0,
    zohoMisses: 0,
    stripeHits: 0,
    stripeMisses: 0,
    averageDuration: 0
  });

  // Listen for cache events
  useEffect(() => {
    const handleCacheEvent = (e: CustomEvent<CacheEvent>) => {
      setEvents(prev => [e.detail, ...prev].slice(0, 100));
    };

    const handleEventsCleared = () => {
      setEvents([]);
    };

    // TypeScript requires this casting for custom events
    window.addEventListener('cache-event', handleCacheEvent as EventListener);
    window.addEventListener('cache-events-cleared', handleEventsCleared);
    
    // Initialize with existing events
    setEvents([...cacheEvents]);
    
    return () => {
      window.removeEventListener('cache-event', handleCacheEvent as EventListener);
      window.removeEventListener('cache-events-cleared', handleEventsCleared);
    };
  }, []);

  // Calculate statistics
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
    
    setCacheStats({
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

  // Fetch detailed stats from Supabase
  const fetchCacheStats = async () => {
    try {
      const stats = await CacheService.getCacheDetailedStats();
      toast({
        title: "Cache Stats Loaded",
        description: `Found ${stats.transactions.reduce((sum, item) => sum + item.count, 0)} cached transactions`,
      });
    } catch (err) {
      console.error("Error fetching cache stats:", err);
    }
  };

  // Clear cache logs (just the UI logs, not the actual cache)
  const clearLogs = () => {
    clearCacheEvents();
  };

  // Helper to render an event indicator icon
  const getEventIcon = (event: CacheEvent) => {
    switch (event.type) {
      case 'hit':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'miss':
        return <XCircle className="h-4 w-4 text-amber-500" />;
      case 'api_call':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'check':
        return <Database className="h-4 w-4 text-blue-500" />;
      case 'store':
        return <Database className="h-4 w-4 text-green-500" />;
      case 'force_refresh':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  // Helper to get badge variant based on event type
  const getBadgeVariant = (event: CacheEvent): "default" | "secondary" | "destructive" | "outline" => {
    switch (event.type) {
      case 'hit':
        return 'default';
      case 'miss':
        return 'secondary';
      case 'api_call':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Format event type for display
  const formatEventType = (type: CacheEvent['type']) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  // Render time ago 
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Cache Monitor</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              Hit Rate: {cacheStats.hits > 0 ? 
                Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100) : 0}%
            </Badge>
            <Badge variant="outline" className={cacheStats.apiCalls > 0 ? 'bg-red-50' : ''}>
              API Calls: {cacheStats.apiCalls}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <button 
            onClick={clearLogs} 
            className="text-xs underline hover:text-primary"
          >
            Clear Logs
          </button>
          <button 
            onClick={fetchCacheStats} 
            className="text-xs underline hover:text-primary ml-4"
          >
            Load DB Stats
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="zoho">Zoho</TabsTrigger>
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-2">Zoho Cache</div>
                <div className="flex justify-between items-center">
                  <div className="text-3xl font-bold">
                    {cacheStats.zohoHits > 0 ? 
                      Math.round((cacheStats.zohoHits / (cacheStats.zohoHits + cacheStats.zohoMisses)) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {cacheStats.zohoHits} hits / {cacheStats.zohoMisses} misses
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-2">Stripe Cache</div>
                <div className="flex justify-between items-center">
                  <div className="text-3xl font-bold">
                    {cacheStats.stripeHits > 0 ? 
                      Math.round((cacheStats.stripeHits / (cacheStats.stripeHits + cacheStats.stripeMisses)) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {cacheStats.stripeHits} hits / {cacheStats.stripeMisses} misses
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium mb-2">API Calls</div>
              <div className="text-3xl font-bold">{cacheStats.apiCalls}</div>
              <div className="text-sm text-muted-foreground mt-2">
                Average Request Duration: {Math.round(cacheStats.averageDuration)}ms
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="events">
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {events.map(event => (
                <div key={event.id} className="flex items-center gap-2 border-b pb-2">
                  {getEventIcon(event)}
                  <Badge variant={getBadgeVariant(event)} className="w-20">
                    {formatEventType(event.type)}
                  </Badge>
                  <Badge variant="outline">{event.source}</Badge>
                  <span className="text-xs text-muted-foreground flex-1">
                    {event.dateRange ? 
                      `${formatDateForDisplay(event.dateRange.startDate)} - ${formatDateForDisplay(event.dateRange.endDate)}` : 
                      ''}
                    {event.durationMs ? ` (${event.durationMs}ms)` : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(event.timestamp)}
                  </span>
                </div>
              ))}
              
              {events.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No cache events recorded yet
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="zoho">
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {events
                .filter(e => e.source === 'Zoho')
                .map(event => (
                  <div key={event.id} className="flex items-center gap-2 border-b pb-2">
                    {getEventIcon(event)}
                    <Badge variant={getBadgeVariant(event)} className="w-20">
                      {formatEventType(event.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex-1">
                      {event.dateRange ? 
                        `${formatDateForDisplay(event.dateRange.startDate)} - ${formatDateForDisplay(event.dateRange.endDate)}` : 
                        ''}
                      {event.durationMs ? ` (${event.durationMs}ms)` : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(event.timestamp)}
                    </span>
                  </div>
                ))}
              
              {events.filter(e => e.source === 'Zoho').length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No Zoho cache events recorded
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="stripe">
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {events
                .filter(e => e.source === 'Stripe')
                .map(event => (
                  <div key={event.id} className="flex items-center gap-2 border-b pb-2">
                    {getEventIcon(event)}
                    <Badge variant={getBadgeVariant(event)} className="w-20">
                      {formatEventType(event.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex-1">
                      {event.dateRange ? 
                        `${formatDateForDisplay(event.dateRange.startDate)} - ${formatDateForDisplay(event.dateRange.endDate)}` : 
                        ''}
                      {event.durationMs ? ` (${event.durationMs}ms)` : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(event.timestamp)}
                    </span>
                  </div>
                ))}
              
              {events.filter(e => e.source === 'Stripe').length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No Stripe cache events recorded
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CacheMonitor;
