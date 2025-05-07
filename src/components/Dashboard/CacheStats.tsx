
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Database, AlertTriangle } from 'lucide-react';
import ZohoService from '@/services/zohoService';

interface CacheStatsProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const CacheStats: React.FC<CacheStatsProps> = ({ onRefresh, isLoading }) => {
  const [stats, setStats] = React.useState<any>({
    hits: 0,
    misses: 0,
    errors: 0,
    hitRate: 'N/A',
    lastRefreshRelative: 'never'
  });

  React.useEffect(() => {
    // Update stats when component mounts
    setStats(ZohoService.getCacheStats());
    
    // Update stats every 30 seconds
    const interval = setInterval(() => {
      setStats(ZohoService.getCacheStats());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Refresh</span>
          </Button>
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
            <Badge variant={stats.hitRate === 'N/A' || parseInt(stats.hitRate) < 50 ? "outline" : "default"} className="font-mono">
              {stats.hitRate}
            </Badge>
          </div>
          <div>
            <span className="text-gray-500 mr-1">Last refresh:</span>
            <span className="font-mono">{stats.lastRefreshRelative}</span>
          </div>
        </div>
        
        {stats.errors > 0 && (
          <div className="flex items-center mt-3 text-amber-600 text-xs bg-amber-50 p-2 rounded">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            <span>API errors detected. Using cached data as fallback.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CacheStats;
