
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Database, Zap, TrendingUp, RefreshCw, CheckCircle, AlertTriangle, Settings, Brain, Clock } from 'lucide-react';
import { smartDataFetcherService } from '@/services/smartDataFetcherService';
import { useQueryOptimization } from '@/hooks/useQueryOptimization';

interface CacheEfficiencyDashboardProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

const CacheEfficiencyDashboard: React.FC<CacheEfficiencyDashboardProps> = ({ dateRange }) => {
  const [cacheAnalysis, setCacheAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const {
    queryPlans,
    optimizationEnabled,
    warmingStatus,
    analyzeQueryPlans,
    toggleOptimization,
    warmCache,
    getCacheEfficiencyMetrics
  } = useQueryOptimization();

  const analyzeCacheStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Get cache analysis from smart service
      const analysis = await smartDataFetcherService.analyzeCacheStatus(dateRange);
      setCacheAnalysis(analysis);
      
      // Also analyze query plans
      await analyzeQueryPlans(dateRange);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error analyzing cache status:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, analyzeQueryPlans]);

  useEffect(() => {
    analyzeCacheStatus();
  }, [analyzeCacheStatus]);

  const handleWarmCache = useCallback(async () => {
    setLoading(true);
    try {
      await warmCache(['Zoho', 'Stripe'], {
        currentMonth: true,
        nextMonth: false,
        previousMonth: true,
        commonRanges: true
      });
      
      // Refresh analysis after warming
      setTimeout(() => {
        analyzeCacheStatus();
      }, 2000);
    } catch (error) {
      console.error('Error warming cache:', error);
    } finally {
      setLoading(false);
    }
  }, [warmCache, analyzeCacheStatus]);

  const getStatusIcon = (analysis: any) => {
    if (!analysis) return <Database className="h-4 w-4" />;
    
    if (analysis.fullyCached) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (analysis.partiallyCached) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (analysis: any) => {
    if (!analysis) return 'Analizando...';
    
    if (analysis.fullyCached) {
      return 'Completamente en caché';
    } else if (analysis.partiallyCached) {
      return 'Parcialmente en caché';
    } else {
      return 'No en caché';
    }
  };

  const getRecommendationText = (action: string) => {
    switch (action) {
      case 'use_cache':
        return 'Usar datos del caché';
      case 'refresh_partial':
        return 'Actualización parcial recomendada';
      case 'refresh_full':
        return 'Actualización completa recomendada';
      default:
        return 'Analizando...';
    }
  };

  const efficiencyMetrics = getCacheEfficiencyMetrics();

  if (!cacheAnalysis) {
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
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => toggleOptimization(!optimizationEnabled)}
              >
                <Settings className="h-4 w-4 mr-1" />
                {optimizationEnabled ? 'Desactivar' : 'Activar'} Optimización
              </Button>
              <Button variant="outline" size="sm" onClick={handleWarmCache} disabled={loading}>
                <Zap className={`h-4 w-4 mr-1 ${loading ? 'animate-pulse' : ''}`} />
                Precalentar Cache
              </Button>
              <Button variant="outline" size="sm" onClick={analyzeCacheStatus} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Optimización inteligente: Base de datos primero, predicción y precalentamiento automático
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Enhanced Overall Efficiency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Eficiencia General Optimizada</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {Math.round(efficiencyMetrics.overallEfficiency * 100)}%
                  </span>
                  {optimizationEnabled && (
                    <Badge variant="default" className="text-xs">
                      Optimizado
                    </Badge>
                  )}
                </div>
              </div>
              <Progress value={efficiencyMetrics.overallEfficiency * 100} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {efficiencyMetrics.estimatedApiSavings} llamadas API ahorradas
                </div>
                <div className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  {warmingStatus.inProgress.length} precalentamientos activos
                </div>
              </div>
            </div>

            {/* Query Plan Information */}
            {queryPlans.zoho && queryPlans.stripe && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Plan de Consulta Inteligente</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-medium">Zoho:</span>
                    <div className="text-muted-foreground">
                      Cache Hit: {Math.round(queryPlans.zoho.estimatedCacheHitRatio * 100)}%
                    </div>
                    <div className="text-muted-foreground">
                      {queryPlans.zoho.useFullCache ? 'Cache completo' : 
                       queryPlans.zoho.usePartialCache ? 'Cache parcial' : 'Requiere API'}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Stripe:</span>
                    <div className="text-muted-foreground">
                      Cache Hit: {Math.round(queryPlans.stripe.estimatedCacheHitRatio * 100)}%
                    </div>
                    <div className="text-muted-foreground">
                      {queryPlans.stripe.useFullCache ? 'Cache completo' : 
                       queryPlans.stripe.usePartialCache ? 'Cache parcial' : 'Requiere API'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Optimization Recommendations */}
            {efficiencyMetrics.optimizationRecommendations.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-blue-900">Recomendaciones de Optimización</h4>
                <ul className="text-xs space-y-1">
                  {efficiencyMetrics.optimizationRecommendations.map((rec, index) => (
                    <li key={index} className="text-blue-800">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source Analysis - Enhanced */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Zoho Books</h4>
                  {getStatusIcon(cacheAnalysis.zoho)}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {getStatusText(cacheAnalysis.zoho)}
                </p>
                <Badge variant={
                  cacheAnalysis.zoho?.recommendedAction === 'use_cache' ? 'default' :
                  cacheAnalysis.zoho?.recommendedAction === 'refresh_partial' ? 'secondary' : 'destructive'
                } className="text-xs">
                  {getRecommendationText(cacheAnalysis.zoho?.recommendedAction)}
                </Badge>
                {cacheAnalysis.zoho?.cacheAge !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Edad: {Math.round(cacheAnalysis.zoho.cacheAge)}h
                  </p>
                )}
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Stripe</h4>
                  {getStatusIcon(cacheAnalysis.stripe)}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {getStatusText(cacheAnalysis.stripe)}
                </p>
                <Badge variant={
                  cacheAnalysis.stripe?.recommendedAction === 'use_cache' ? 'default' :
                  cacheAnalysis.stripe?.recommendedAction === 'refresh_partial' ? 'secondary' : 'destructive'
                } className="text-xs">
                  {getRecommendationText(cacheAnalysis.stripe?.recommendedAction)}
                </Badge>
                {cacheAnalysis.stripe?.cacheAge !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Edad: {Math.round(cacheAnalysis.stripe.cacheAge)}h
                  </p>
                )}
              </div>
            </div>

            {/* Last Update */}
            {lastUpdate && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Última actualización: {lastUpdate.toLocaleTimeString()}
                {optimizationEnabled && (
                  <span className="ml-2 text-blue-600">• Optimización activa</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CacheEfficiencyDashboard;
