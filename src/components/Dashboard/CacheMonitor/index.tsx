
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useCacheMonitoring } from '@/hooks/useCacheMonitoring';
import { useCacheContext } from '@/contexts/CacheContext';
import CacheEventsList from './CacheEventsList';
import CacheSummary from './CacheSummary';

const CacheMonitor: React.FC = () => {
  // Use the monitoring hook
  const { events, stats, clearLogs } = useCacheMonitoring();
  const { refreshStats } = useCacheContext();
  
  const [activeTab, setActiveTab] = useState<string>('summary');

  // Fetch detailed stats from Supabase
  const fetchCacheStats = async () => {
    try {
      await refreshStats();
      toast({
        title: "Cache Stats Loaded",
        description: "Cache statistics have been refreshed",
      });
    } catch (err) {
      console.error("Error fetching cache stats:", err);
      toast({
        title: "Error",
        description: "Failed to load cache statistics",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Cache Monitor</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              Hit Rate: {stats.hits > 0 ? 
                Math.round((stats.hits / (stats.hits + stats.misses)) * 100) : 0}%
            </Badge>
            <Badge variant="outline" className={stats.apiCalls > 0 ? 'bg-red-50' : ''}>
              API Calls: {stats.apiCalls}
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
            <CacheSummary metrics={stats} />
          </TabsContent>
          
          <TabsContent value="events">
            <CacheEventsList events={events} />
          </TabsContent>
          
          <TabsContent value="zoho">
            <CacheEventsList events={events} filter="Zoho" />
          </TabsContent>
          
          <TabsContent value="stripe">
            <CacheEventsList events={events} filter="Stripe" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CacheMonitor;
