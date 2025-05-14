
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  RefreshCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import CacheService from '@/services/cacheService';

interface CacheInfoProps {
  dateRange: { startDate: Date; endDate: Date };
  cacheStatus: {
    zoho: { hit: boolean; partial: boolean };
    stripe: { hit: boolean; partial: boolean };
  };
  isUsingCache: boolean;
  onRefresh: () => void;
}

const CacheInfo: React.FC<CacheInfoProps> = ({ 
  dateRange, 
  cacheStatus, 
  isUsingCache, 
  onRefresh 
}) => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("status");

  // Fetch cache stats
  const fetchCacheStats = async () => {
    setLoading(true);
    try {
      const stats = await CacheService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error("Error fetching cache stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on mount and tab change
  useEffect(() => {
    if (activeTab === "stats" && !cacheStats) {
      fetchCacheStats();
    }
  }, [activeTab, cacheStats]);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge based on cache status
  const getCacheBadge = (hit: boolean, partial: boolean) => {
    if (hit) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-4 h-4 mr-1" />
          Caché
        </Badge>
      );
    } else if (partial) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <AlertCircle className="w-4 h-4 mr-1" />
          Parcial
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-4 h-4 mr-1" />
          API
        </Badge>
      );
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center text-lg">
              <Database className="h-5 w-5 text-muted-foreground mr-2" />
              Sistema de Caché
            </CardTitle>
            <CardDescription>
              Optimiza el rendimiento almacenando datos localmente
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Forzar actualización
          </Button>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mx-6 mb-2">
          <TabsTrigger value="status">Estado actual</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="p-0">
          <CardContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zoho cache status */}
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm">Zoho Books</h3>
                  {getCacheBadge(cacheStatus.zoho.hit, cacheStatus.zoho.partial)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Periodo: {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                </p>
                <div className="flex flex-col space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Fuente de datos:</span>
                    <span className="font-medium">
                      {cacheStatus.zoho.hit ? 'Caché local' : 'API externa'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Última actualización:</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" />
                          Hace unos minutos
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>La hora exacta se muestra en la pestaña de estadísticas</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              
              {/* Stripe cache status */}
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm">Stripe</h3>
                  {getCacheBadge(cacheStatus.stripe.hit, cacheStatus.stripe.partial)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Periodo: {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                </p>
                <div className="flex flex-col space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Fuente de datos:</span>
                    <span className="font-medium">
                      {cacheStatus.stripe.hit ? 'Caché local' : 'API externa'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Última actualización:</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" />
                          Hace unos minutos
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>La hora exacta se muestra en la pestaña de estadísticas</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
              <p>El sistema de caché almacena transacciones para mejorar el rendimiento. 
              Los datos se actualizan automáticamente según la frecuencia de uso.</p>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="stats" className="p-0">
          <CardContent className="pt-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                <p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
              </div>
            ) : cacheStats ? (
              <div className="space-y-4">
                {/* Cache Hit Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Tasa de aciertos</h4>
                    <span className="text-sm font-bold">{cacheStats.hitRate || '0%'}</span>
                  </div>
                  <Progress 
                    value={parseFloat(cacheStats.hitRate) || 0}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Aciertos: {cacheStats.hits || 0}</span>
                    <span>Fallos: {cacheStats.misses || 0}</span>
                  </div>
                </div>
                
                {/* Transaction Counts */}
                <div className="border rounded-md p-3">
                  <h4 className="text-sm font-medium mb-2">Transacciones en caché</h4>
                  <div className="text-2xl font-bold">
                    {cacheStats.transactionCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Actualizado: {new Date(cacheStats.lastUpdated).toLocaleString()}
                  </p>
                </div>
                
                {/* Recent Cache Access */}
                {cacheStats.recentMetrics && cacheStats.recentMetrics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Accesos recientes</h4>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Fuente</TableHead>
                            <TableHead>Periodo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Tiempo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cacheStats.recentMetrics.slice(0, 5).map((metric: any) => (
                            <TableRow key={metric.id}>
                              <TableCell className="font-medium">{metric.source}</TableCell>
                              <TableCell className="text-xs">
                                {new Date(metric.start_date).toLocaleDateString()} - {new Date(metric.end_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {metric.cache_hit ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Acierto
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    Fallo
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {metric.fetch_duration_ms ? `${metric.fetch_duration_ms}ms` : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No hay estadísticas disponibles</p>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          <span>Estado del caché:</span>
          {isUsingCache ? (
            <span className="text-green-600 font-medium">Activo</span>
          ) : (
            <span className="text-amber-600 font-medium">Inactivo</span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={fetchCacheStats}>
          Actualizar estadísticas
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CacheInfo;
