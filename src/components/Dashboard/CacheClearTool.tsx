
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange as DayPickerDateRange } from "react-day-picker";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DateRangePicker from "@/components/Dashboard/DateRangePicker";
import { Trash } from 'lucide-react';
import { formatDateYYYYMMDD } from "@/utils/dateUtils";
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import CacheService from "@/services/cache";
import type { DateRange } from '@/types/financial';

const CacheClearTool: React.FC = () => {
  const [source, setSource] = useState<string>("all");
  const [isClearing, setIsClearing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Set default date range to last 3 months
  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);
  
  // Create a properly typed DateRange object
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: startOfMonth(threeMonthsAgo),
    endDate: endOfMonth(today)
  });
  
  // Create a DayPicker compatible DateRange for the UI component
  const [pickerDateRange, setPickerDateRange] = useState<DayPickerDateRange>({
    from: dateRange.startDate,
    to: dateRange.endDate
  });
  
  // Handle date range updates from the picker
  const handleDateRangeUpdate = (range: DayPickerDateRange) => {
    if (range.from && range.to) {
      // Update both the picker state and the actual date range
      setPickerDateRange(range);
      setDateRange({
        startDate: range.from,
        endDate: range.to
      });
    }
  };
  
  const loadCacheStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await CacheService.getCacheDetailedStats();
      setCacheStats(stats);
    } catch (error) {
      console.error("Error loading cache stats:", error);
      toast({
        title: "Error",
        description: "Failed to load cache statistics",
        variant: "destructive"
      });
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      // Prepare options for cache clearing
      const options: {
        source?: 'Zoho' | 'Stripe' | 'all';
        startDate?: Date;
        endDate?: Date;
      } = {};
      
      // Add source filter if selected
      if (source !== "all") {
        options.source = source as 'Zoho' | 'Stripe';
      }
      
      // Add date range if selected
      if (dateRange.startDate && dateRange.endDate) {
        options.startDate = dateRange.startDate;
        options.endDate = dateRange.endDate;
      }
      
      // Clear the cache
      const result = await CacheService.clearCache(options);
      
      if (result) {
        toast({
          title: "Cache Cleared",
          description: "The selected cache data has been successfully cleared",
          variant: "success"
        });
        
        // Refresh cache stats
        await loadCacheStats();
      } else {
        toast({
          title: "Failed to Clear Cache",
          description: "There was an error clearing the cache data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while clearing the cache",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
      setIsDialogOpen(false);
    }
  };
  
  // Load cache stats on component mount
  React.useEffect(() => {
    loadCacheStats();
  }, []);
  
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
              dateRange={pickerDateRange} 
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
                  {cacheStats.transactions.map((item: any) => (
                    <p key={item.source} className="text-sm">
                      {item.source}: <span className="font-medium">{item.count}</span>
                    </p>
                  ))}
                  {cacheStats.transactions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No cached transactions</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cache Segments</p>
                  {cacheStats.segments.map((item: any) => (
                    <p key={item.source} className="text-sm">
                      {item.source}: <span className="font-medium">{item.count}</span>
                    </p>
                  ))}
                  {cacheStats.segments.length === 0 && (
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
        <Button variant="outline" onClick={() => loadCacheStats()}>
          Refresh Stats
        </Button>
        <Button 
          variant="destructive"
          onClick={() => setIsDialogOpen(true)}
          disabled={isClearing}
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
              {dateRange.startDate && dateRange.endDate
                ? ` from ${formatDateYYYYMMDD(dateRange.startDate)} to ${formatDateYYYYMMDD(dateRange.endDate)}`
                : ''}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleClearCache();
              }}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isClearing ? "Clearing..." : "Clear Cache"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CacheClearTool;
