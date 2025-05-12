
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Database } from 'lucide-react';

interface CacheStatsProps {
  onRefresh: () => void;
  isLoading: boolean;
  startDate?: Date;
  endDate?: Date;
}

const CacheStats: React.FC<CacheStatsProps> = ({ onRefresh, isLoading }) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-sm font-medium">Data Status</CardTitle>
          </div>
          <div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 px-2"
            >
              <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Direct fetch mode: All data is loaded directly from the API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 p-3 rounded text-sm">
          <p className="font-medium">Cache system has been disabled</p>
          <p className="text-xs mt-1">All data is now fetched directly from the API for better reliability.</p>
          <p className="text-xs mt-1">Use the Refresh button to reload data from the source.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheStats;
