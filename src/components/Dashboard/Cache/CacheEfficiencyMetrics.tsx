
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock } from 'lucide-react';
import { RealCacheMetrics } from '@/hooks/useRealCacheMetrics';

interface CacheEfficiencyMetricsProps {
  metrics: RealCacheMetrics;
}

const CacheEfficiencyMetrics: React.FC<CacheEfficiencyMetricsProps> = ({ metrics }) => {
  return (
    <div className="space-y-4">
      {/* Overall Efficiency */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Eficiencia General del Caché</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {Math.round(metrics.overallEfficiency * 100)}%
            </span>
            {metrics.overallEfficiency >= 0.8 && (
              <Badge variant="default" className="text-xs">
                Excelente
              </Badge>
            )}
          </div>
        </div>
        <Progress value={metrics.overallEfficiency * 100} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <TrendingUp className="mr-1 h-3 w-3" />
            {metrics.estimatedApiSavings} llamadas API ahorradas
          </div>
          <div className="flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            {metrics.lastCacheCheck ? 
              `Actualizado: ${metrics.lastCacheCheck.toLocaleTimeString()}` : 
              'No actualizado'
            }
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="text-sm font-semibold mb-2 text-blue-900">Estado de Cache en Tiempo Real</h4>
        <div className="text-xs space-y-1 text-blue-800">
          <div>• Total de fuentes: 2 (Zoho + Stripe)</div>
          <div>• Fuentes con caché: {metrics.estimatedApiSavings}</div>
          <div>• Eficiencia calculada: {(metrics.overallEfficiency * 100).toFixed(1)}%</div>
          <div>• Última verificación: {metrics.lastCacheCheck?.toLocaleString() || 'Nunca'}</div>
        </div>
      </div>
    </div>
  );
};

export default CacheEfficiencyMetrics;
