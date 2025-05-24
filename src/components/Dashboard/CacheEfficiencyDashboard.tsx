
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Database, Zap, TrendingUp, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { smartDataFetcherService } from '@/services/smartDataFetcherService';
import { cacheIntelligenceService } from '@/services/cacheIntelligence';

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

  const analyzeCacheStatus = useCallback(async () => {
    setLoading(true);
    try {
      const analysis = await smartDataFetcherService.analyzeCacheStatus(dateRange);
      setCacheAnalysis(analysis);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error analyzing cache status:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    analyzeCacheStatus();
  }, [analyzeCacheStatus]);

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-blue-500" />
              Eficiencia del Caché Inteligente
            </div>
            <Button variant="outline" size="sm" onClick={analyzeCacheStatus} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </CardTitle>
          <CardDescription>
            Estrategia inteligente: Base de datos primero, APIs solo cuando es necesario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Efficiency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Eficiencia General</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(cacheAnalysis.overall.efficiency * 100)}%
                </span>
              </div>
              <Progress value={cacheAnalysis.overall.efficiency * 100} className="h-2" />
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3" />
                {cacheAnalysis.overall.fullyCached 
                  ? 'Óptimo: Sin llamadas API necesarias'
                  : cacheAnalysis.overall.recommendsApiCall
                  ? 'Llamadas API selectivas recomendadas'
                  : 'Usando datos del caché'
                }
              </div>
            </div>

            {/* Source Analysis */}
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CacheEfficiencyDashboard;
