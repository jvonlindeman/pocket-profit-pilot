
import React from 'react';
import { CacheMetrics } from '@/types/cache';

interface CacheSummaryProps {
  metrics: CacheMetrics;
}

const CacheSummary: React.FC<CacheSummaryProps> = ({ metrics }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm font-medium mb-2">Zoho Cache</div>
          <div className="flex justify-between items-center">
            <div className="text-3xl font-bold">
              {metrics.zohoHits > 0 ? 
                Math.round((metrics.zohoHits / (metrics.zohoHits + metrics.zohoMisses)) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">
              {metrics.zohoHits} hits / {metrics.zohoMisses} misses
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <div className="text-sm font-medium mb-2">Stripe Cache</div>
          <div className="flex justify-between items-center">
            <div className="text-3xl font-bold">
              {metrics.stripeHits > 0 ? 
                Math.round((metrics.stripeHits / (metrics.stripeHits + metrics.stripeMisses)) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">
              {metrics.stripeHits} hits / {metrics.stripeMisses} misses
            </div>
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg p-4">
        <div className="text-sm font-medium mb-2">API Calls</div>
        <div className="text-3xl font-bold">{metrics.apiCalls}</div>
        <div className="text-sm text-muted-foreground mt-2">
          Average Request Duration: {Math.round(metrics.averageDuration)}ms
        </div>
      </div>
    </div>
  );
};

export default React.memo(CacheSummary);
