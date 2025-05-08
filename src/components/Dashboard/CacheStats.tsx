
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Database, AlertTriangle, Trash2, Calendar } from 'lucide-react';
import ZohoService from '@/services/zohoService';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CacheStatsProps {
  onRefresh: () => void;
  isLoading: boolean;
  startDate?: Date;
  endDate?: Date;
}

interface DateRange {
  earliestDate: string | null;
  latestDate: string | null;
  transactionCount: number;
}

const CacheStats: React.FC<CacheStatsProps> = ({ onRefresh, isLoading, startDate, endDate }) => {
  const [stats, setStats] = useState<any>({
    hits: 0,
    misses: 0,
    errors: 0,
    hitRate: 'N/A',
    lastRefreshRelative: 'never',
    cachedRangeCount: 0
  });
  
  const [cachedCount, setCachedCount] = useState<number | null>(null);
  const [isCacheLoading, setIsCacheLoading] = useState<boolean>(false);
  const [globalDateRange, setGlobalDateRange] = useState<DateRange | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Update stats when component mounts
    setStats(ZohoService.getCacheStats());
    fetchGlobalDateRange();
    
    // Update stats every 15 seconds
    const interval = setInterval(() => {
      setStats(ZohoService.getCacheStats());
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Check if we have cached data for the current date range
  useEffect(() => {
    if (startDate && endDate) {
      checkCachedCount();
    }
  }, [startDate, endDate]);

  // Function to fetch the global date range of cached transactions
  const fetchGlobalDateRange = async () => {
    setIsCacheLoading(true);
    try {
      // Get the earliest and latest dates in the entire cache
      const { data: earliest, error: earliestError } = await supabase
        .from("cached_transactions")
        .select("date")
        .order("date", { ascending: true })
        .limit(1);

      const { data: latest, error: latestError } = await supabase
        .from("cached_transactions")
        .select("date")
        .order("date", { ascending: false })
        .limit(1);

      const { count, error: countError } = await supabase
        .from("cached_transactions")
        .select("*", { count: 'exact', head: true });

      if (earliestError || latestError || countError) {
        console.error("Error fetching global date range:", earliestError || latestError || countError);
        return;
      }

      if (earliest && earliest.length > 0 && latest && latest.length > 0) {
        setGlobalDateRange({
          earliestDate: earliest[0].date,
          latestDate: latest[0].date,
          transactionCount: count || 0
        });
      }
    } catch (err) {
      console.error("Error fetching global date range:", err);
    } finally {
      setIsCacheLoading(false);
    }
  };
  
  // Function to load the cached transaction count
  const checkCachedCount = async () => {
    if (!startDate || !endDate) return;
    
    setIsCacheLoading(true);
    try {
      const count = await ZohoService.getCachedTransactionCount(startDate, endDate);
      setCachedCount(count);
    } catch (err) {
      console.error("Error checking cached count:", err);
      setCachedCount(null);
    } finally {
      setIsCacheLoading(false);
    }
  };
  
  // Function to clear the cache for the current date range
  const handleClearCache = async () => {
    if (!startDate || !endDate) return;
    
    setIsCacheLoading(true);
    try {
      await ZohoService.clearCacheForDateRange(startDate, endDate);
      toast({
        title: "Cache cleared",
        description: `Cache cleared for ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        variant: "default"
      });
      // Set count to 0 and trigger a refresh
      setCachedCount(0);
      onRefresh(); // Refresh to fetch fresh data
      
      // Also update the global date range
      fetchGlobalDateRange();
    } catch (err) {
      console.error("Error clearing cache:", err);
      toast({
        title: "Error clearing cache",
        description: "There was a problem clearing the cache",
        variant: "destructive"
      });
    } finally {
      setIsCacheLoading(false);
    }
  };
  
  // Calculate appropriate variant for the hit rate badge
  const getHitRateVariant = () => {
    if (stats.hitRate === 'N/A') return "outline";
    const hitRateNum = parseFloat(stats.hitRate);
    if (hitRateNum >= 80) return "default"; // Changed from "success" to "default"
    if (hitRateNum >= 50) return "default";
    return "secondary";
  };

  // Format dates for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {startDate && endDate && cachedCount !== null && cachedCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearCache}
                    disabled={isLoading || isCacheLoading}
                    className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Clear Cache</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear cached data for current date range</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                onRefresh();
                fetchGlobalDateRange();
              }}
              disabled={isLoading || isCacheLoading}
              className="h-8 px-2"
            >
              <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Using cached data reduces API calls and speeds up the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-sm font-semibold">{stats.hits}</div>
            <div className="text-xs text-gray-500">Cache Hits</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm font-semibold">{stats.misses}</div>
            <div className="text-xs text-gray-500">Cache Misses</div>
          </div>
          <div className="bg-red-50 p-2 rounded">
            <div className="text-sm font-semibold">{stats.errors}</div>
            <div className="text-xs text-gray-500">API Errors</div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-3 text-xs">
          <div>
            <span className="text-gray-500 mr-1">Cache hit rate:</span>
            <Badge 
              variant={getHitRateVariant()} 
              className={`font-mono ${parseFloat(stats.hitRate) >= 80 ? 'bg-green-100 text-green-800' : ''}`}
            >
              {stats.hitRate}
            </Badge>
          </div>
          <div>
            <span className="text-gray-500 mr-1">Last refresh:</span>
            <span className="font-mono">{stats.lastRefreshRelative}</span>
          </div>
        </div>
        
        {/* Global cache date range */}
        {globalDateRange && (
          <div className="flex items-center mt-3 text-xs bg-blue-50 p-2 rounded">
            <Calendar className="h-3.5 w-3.5 mr-1 text-blue-600" />
            <div className="flex-grow">
              <span className="font-medium">Total cached date range:</span>{' '}
              <span className="ml-1">
                {formatDate(globalDateRange.earliestDate)} - {formatDate(globalDateRange.latestDate)}
              </span>
              <span className="ml-2 text-blue-700 font-medium">
                ({globalDateRange.transactionCount} transactions)
              </span>
            </div>
          </div>
        )}
        
        {/* Current range cache status */}
        {startDate && endDate && (
          <div className="flex items-center justify-between mt-3 text-xs bg-gray-50 p-2 rounded">
            <div className="flex items-center">
              {isCacheLoading ? (
                <div className="animate-spin h-3 w-3 border border-gray-500 rounded-full border-t-transparent mr-1"></div>
              ) : (
                cachedCount !== null && cachedCount > 0 ? (
                  <AlertCircle className="h-3.5 w-3.5 mr-1 text-green-600" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 mr-1 text-amber-500" />
                )
              )}
              <span>Current date range:</span>
            </div>
            <div>
              {isCacheLoading ? (
                <span>Checking cache...</span>
              ) : (
                cachedCount !== null ? (
                  <Badge 
                    variant={cachedCount > 0 ? "default" : "outline"} 
                    className={`${cachedCount > 0 ? 'bg-green-100 text-green-800' : ''}`}
                  >
                    {cachedCount} transactions cached
                  </Badge>
                ) : (
                  <Badge variant="outline">Unknown</Badge>
                )
              )}
            </div>
          </div>
        )}
        
        {stats.errors > 0 && (
          <div className="flex items-center mt-3 text-amber-600 text-xs bg-amber-50 p-2 rounded">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            <span>API errors detected. Using cached data as fallback.</span>
          </div>
        )}
        
        {stats.cachedRangeCount > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            <div className="flex justify-between items-center">
              <span>Date ranges cached:</span>
              <Badge variant="outline" className="font-mono">{stats.cachedRangeCount}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CacheStats;
