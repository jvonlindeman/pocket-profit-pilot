
import React from 'react';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { CacheEvent } from '@/types/cache';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CacheEventsListProps {
  events: CacheEvent[];
  filter?: string; // Optional filter by source
}

const CacheEventsList: React.FC<CacheEventsListProps> = ({ events, filter }) => {
  // Filter events if a filter is provided
  const filteredEvents = filter 
    ? events.filter(e => e.source === filter)
    : events;

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
      case 'clear':
        return <RefreshCw className="h-4 w-4 text-red-500" />;
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
      case 'clear':
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
    <div className="space-y-2 max-h-[300px] overflow-auto">
      {filteredEvents.map(event => (
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
      
      {filteredEvents.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          No cache events recorded for {filter || 'any source'}
        </div>
      )}
    </div>
  );
};

export default React.memo(CacheEventsList);
