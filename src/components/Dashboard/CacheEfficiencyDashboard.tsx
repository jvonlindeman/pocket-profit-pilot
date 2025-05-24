
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Database, Zap, TrendingUp, RefreshCw, CheckCircle, AlertTriangle, Settings, Brain, Clock } from 'lucide-react';
import { useRealCacheMetrics } from '@/hooks/useRealCacheMetrics';
import { toast } from '@/hooks/use-toast';

interface CacheEfficiencyDashboardProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

const CacheEfficiencyDashboard: React.FC<CacheEfficiencyDashboardProps> = ({ dateRange }) => {
  const { metrics, loading, refresh } = useRealCacheMetrics(dateRange);
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);

  const handleRefresh = useCallback(async () => {
    console.log("🔄 CacheEfficiencyDashboard: Manual refresh requested");
    toast({
      title: "Actualizando métricas de caché",
      description: "Analizando estado actual del caché..."
    });
    
    await refresh();
    
    toast({
      title: "Métricas actualizadas",
      description: `Eficiencia: ${Math.round(metrics.overallEfficiency * 100)}%`
    });
  }, [refresh, metrics.overallEfficiency]);

  const handleToggleOptimization = useCallback(() => {
    setOptimizationEnabled(!optimizationEnabled);
    toast({
      title: optimizationEnabled ? "Optimización desactivada" : "Optimización activada",
      description: optimizationEnabled ? 
        "El sistema usará configuración estándar" : 
        "El sistema priorizará uso de caché"
    });
  }, [optimizationEnabled]);

  const getStatusIcon = (status: { cached: boolean; partial: boolean }) => {
    if (status.cached && !status.partial) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status.cached && status.partial) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: { cached: boolean; partial: boolean }) => {
    if (status.cached && !status.partial) {
      return 'Completamente en caché ✅';
    } else if (status.cached && status.partial) {
      return 'Parcialmente en caché ⚠️';
    } else {
      return 'No en caché ❌';
    }
  };

  const getRecommendationText = (action: string) => {
    switch (action) {
      case 'use_cache':
        return '✅ Usar datos del caché';
      case 'refresh_partial':
        return '⚠️ Actualización parcial recomendada';
      case 'refresh_full':
        return '🔄 Actualización completa recomendada';
      default:
        return '🔍 Analizando...';
    }
  };

  const getRecommendationVariant = (action: string) => {
    switch (action) {
      case 'use_cache':
        return 'default' as const;
      case 'refresh_partial':
        return 'secondary' as const;
      case 'refresh_full':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  if (loading && !metrics.lastCacheCheck) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Analizando Eficiencia del Caché...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Efficiency Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-blue-500" />
              Cache Inteligente Optimizado
              {optimizationEnabled && (
                <Badge variant="default" className="ml-2 text-xs">
                  Activo
                </Badge>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleToggleOptimization}
              >
                <Settings className="h-4 w-4 mr-1" />
                {optimizationEnabled ? 'Desactivar' : 'Activar'} Optimización
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Sistema inteligente que prioriza base de datos local antes que APIs externas
          </CardDescription>
        </CardHeader>
        <CardContent>
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

            {/* Optimization Recommendations */}
            {metrics.optimizationRecommendations.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-green-900">Recomendaciones</h4>
                <ul className="text-xs space-y-1">
                  {metrics.optimizationRecommendations.map((rec, index) => (
                    <li key={index} className="text-green-800">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Zoho Books</h4>
                  {getStatusIcon(metrics.zohoStatus)}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {getStatusText(metrics.zohoStatus)}
                </p>
                <Badge 
                  variant={getRecommendationVariant(metrics.zohoStatus.recommendedAction)} 
                  className="text-xs"
                >
                  {getRecommendationText(metrics.zohoStatus.recommendedAction)}
                </Badge>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Stripe</h4>
                  {getStatusIcon(metrics.stripeStatus)}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {getStatusText(metrics.stripeStatus)}
                </p>
                <Badge 
                  variant={getRecommendationVariant(metrics.stripeStatus.recommendedAction)} 
                  className="text-xs"
                >
                  {getRecommendationText(metrics.stripeStatus.recommendedAction)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CacheEfficiencyDashboard;
