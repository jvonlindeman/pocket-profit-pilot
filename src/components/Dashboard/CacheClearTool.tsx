
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from "react-day-picker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DateRangePicker from "@/components/Dashboard/DateRangePicker";
import { Trash } from 'lucide-react';
import { formatDateYYYYMMDD } from "@/utils/dateUtils";
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { useCacheAdmin } from "@/hooks/cache/useCacheAdmin";

const CacheClearTool: React.FC = () => {
  const [source, setSource] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Use our new hook for cache administration
  const { 
    cacheStats, 
    isLoadingStats, 
    isClearingCache, 
    loadCacheStats, 
    clearCache 
  } = useCacheAdmin();
  
  // Set default date range to last 3 months
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
  const threeMonthsAgo = subMonths(today, 3);
  
  // Create a DayPicker compatible DateRange for the UI component
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(threeMonthsAgo),
    to: endOfMonth(today)
  });
  
  // Handle date range updates from the picker
  const handleDateRangeUpdate = (range: DateRange) => {
    if (range.from && range.to) {
      setDateRange(range);
    }
  };
  
  // Load stats when component mounts
  useEffect(() => {
    loadCacheStats();
  }, [loadCacheStats]);
  
  const handleClearCache = async () => {
    if (!dateRange.from || !dateRange.to) {
      return;
    }
    
    // Prepare options for cache clearing
    const options = {
      source: source !== "all" ? source as 'Zoho' | 'Stripe' : 'all',
      startDate: dateRange.from,
      endDate: dateRange.to
    };
    
    await clearCache(options);
    setIsDialogOpen(false);
  };
  
  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trash className="mr-2 h-5 w-5" />
          Cache Clear Tool
        </CardTitle>
        <CardDescription>
          Clear cached transactions for testing purposes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data Source</label>
            <Select 
              value={source} 
              onValueChange={setSource}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Zoho">Zoho Only</SelectItem>
                <SelectItem value="Stripe">Stripe Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <DateRangePicker 
              dateRange={dateRange} 
              onRangeChange={handleDateRangeUpdate}
              getCurrentMonthRange={() => ({
                from: startOfMonth(new Date()),
                to: endOfMonth(new Date())
              })}
            />
          </div>
          
          {cacheStats && (
            <div className="bg-muted p-4 rounded-md mt-4">
              <h4 className="text-sm font-semibold mb-2">Current Cache Status:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  {cacheStats.transactions && cacheStats.transactions.length > 0 ? (
                    cacheStats.transactions.map((item: any) => (
                      <p key={item.source} className="text-sm">
                        {item.source}: <span className="font-medium">{item.count}</span>
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No cached transactions</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cache Segments</p>
                  {cacheStats.segments && cacheStats.segments.length > 0 ? (
                    cacheStats.segments.map((item: any) => (
                      <p key={item.source} className="text-sm">
                        {item.source}: <span className="font-medium">{item.count}</span>
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No cache segments</p>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadCacheStats} 
                  disabled={isLoadingStats}
                >
                  {isLoadingStats ? "Loading..." : "Refresh Stats"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={loadCacheStats} disabled={isLoadingStats}>
          Refresh Stats
        </Button>
        <Button 
          variant="destructive"
          onClick={() => setIsDialogOpen(true)}
          disabled={isClearingCache}
        >
          Clear Cache
        </Button>
      </CardFooter>
      
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              {source === 'all' ? 'all cached data' : `cached ${source} data`}
              {dateRange.from && dateRange.to
                ? ` from ${formatDateYYYYMMDD(dateRange.from)} to ${formatDateYYYYMMDD(dateRange.to)}`
                : ''}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearingCache}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleClearCache();
              }}
              disabled={isClearingCache}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isClearingCache ? "Clearing..." : "Clear Cache"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CacheClearTool;
