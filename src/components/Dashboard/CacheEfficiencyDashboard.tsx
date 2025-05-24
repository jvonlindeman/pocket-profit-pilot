
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, Settings } from 'lucide-react';
import { useRealCacheMetrics } from '@/hooks/useRealCacheMetrics';
import { toast } from '@/hooks/use-toast';
import CacheAnalysisPrompt from './Cache/CacheAnalysisPrompt';
import CacheLoadingState from './Cache/CacheLoadingState';
import CacheEfficiencyMetrics from './Cache/CacheEfficiencyMetrics';
import CacheSourceStatus from './Cache/CacheSourceStatus';
import CacheRecommendations from './Cache/CacheRecommendations';

interface CacheEfficiencyDashboardProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

const CacheEfficiencyDashboard: React.FC<CacheEfficiencyDashboardProps> = ({ dateRange }) => {
  const { metrics, loading, refresh } = useRealCacheMetrics(dateRange);
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = useCallback(async () => {
    console.log("🔄 CacheEfficiencyDashboard: Manual cache analysis requested");
    toast({
      title: "Analizando caché",
      description: "Verificando estado actual del caché..."
    });
    
    await refresh();
    setHasAnalyzed(true);
    
    toast({
      title: "Análisis completo",
      description: `Eficiencia: ${Math.round(metrics.overallEfficiency * 100)}%`
    });
  }, [refresh, metrics.overallEfficiency]);

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

  // Show initial analyze prompt if not analyzed yet
  if (!hasAnalyzed && !loading && !metrics.lastCacheCheck) {
    return <CacheAnalysisPrompt onAnalyze={handleAnalyze} />;
  }

  // Show loading state
  if (loading) {
    return <CacheLoadingState />;
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
            <CacheEfficiencyMetrics metrics={metrics} />
            
            <CacheRecommendations recommendations={metrics.optimizationRecommendations} />

            {/* Source Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CacheSourceStatus 
                name="Zoho Books" 
                status={metrics.zohoStatus} 
              />
              <CacheSourceStatus 
                name="Stripe" 
                status={metrics.stripeStatus} 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CacheEfficiencyDashboard;
