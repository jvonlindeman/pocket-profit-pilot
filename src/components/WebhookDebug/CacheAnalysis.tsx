
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ZohoService from '@/services/zohoService';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format as formatDate } from 'date-fns';

export default function CacheAnalysis() {
  const [cachingStats, setCachingStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load initial cache stats
  useEffect(() => {
    const stats = ZohoService.getCacheStats();
    setCachingStats(stats);
  }, []);

  // Function to refresh cache stats
  const refreshStats = () => {
    setLoading(true);
    setTimeout(() => {
      const stats = ZohoService.getCacheStats();
      setCachingStats(stats);
      setLoading(false);
    }, 100);
  };

  // Format date for display
  const formatCachedDate = (date: Date | string) => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDate(dateObj, 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return String(date);
    }
  };

  // Calculate how long ago the cache was refreshed
  const getTimeAgo = (date: Date | string) => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const seconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);
      
      if (seconds < 60) return `${seconds} seconds ago`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
      return `${Math.floor(seconds / 86400)} days ago`;
    } catch (e) {
      return 'Unknown';
    }
  };

  // Get list of cached date ranges
  const getCachedRanges = () => {
    if (!cachingStats?.cachedRanges) return [];
    
    return Object.entries(cachingStats.cachedRanges).map(([rangeKey, timestamp]) => {
      const [startDate, endDate] = rangeKey.split('_');
      return {
        startDate,
        endDate,
        timestamp: formatCachedDate(timestamp as Date | string),
        timeAgo: getTimeAgo(timestamp as Date | string)
      };
    });
  };

  const cachedRanges = getCachedRanges();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Cache Analysis</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshStats}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Refresh Stats
        </Button>
      </div>
      
      {cachingStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cache Performance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">Hit Rate:</div>
              <div>{cachingStats.hitRate || '0%'}</div>
              
              <div className="font-semibold">Cache Hits:</div>
              <div>{cachingStats.hits || 0}</div>
              
              <div className="font-semibold">Cache Misses:</div>
              <div>{cachingStats.misses || 0}</div>
              
              <div className="font-semibold">Errors:</div>
              <div>{cachingStats.errors || 0}</div>
              
              <div className="font-semibold">Last Refresh:</div>
              <div>{formatCachedDate(cachingStats.lastRefresh)}</div>
              
              <div className="font-semibold">Time Since Refresh:</div>
              <div>{getTimeAgo(cachingStats.lastRefresh)}</div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {cachedRanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cached Date Ranges</CardTitle>
          </CardHeader>
          <CardContent className="text-sm p-0">
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Start Date</th>
                    <th className="px-4 py-2 text-left">End Date</th>
                    <th className="px-4 py-2 text-left">Last Updated</th>
                    <th className="px-4 py-2 text-left">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {cachedRanges.map((range, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2">{range.startDate}</td>
                      <td className="px-4 py-2">{range.endDate}</td>
                      <td className="px-4 py-2">{range.timestamp}</td>
                      <td className="px-4 py-2">{range.timeAgo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {(!cachingStats || cachedRanges.length === 0) && !loading && (
        <div className="text-center py-8 text-gray-500">
          No cache statistics available
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading cache statistics...</span>
        </div>
      )}
    </div>
  );
}
