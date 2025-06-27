
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MonthlyCacheSync } from '@/services/cache/syncMonthlyCache';

export default function MonthlyCacheSyncTool() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number;
    errors: number;
    timestamp: string;
  } | null>(null);
  const { toast } = useToast();

  const handleManualSync = async () => {
    setSyncing(true);
    console.log("🔄 MonthlyCacheSyncTool: Starting MANUAL monthly cache sync...");
    
    try {
      const result = await MonthlyCacheSync.syncAllMissingEntries();
      
      setLastSyncResult({
        synced: result.synced,
        errors: result.errors,
        timestamp: new Date().toISOString()
      });
      
      if (result.synced > 0) {
        toast({
          title: "Sincronización completada",
          description: `Se sincronizaron ${result.synced} entradas de caché mensuales`,
          variant: "default"
        });
      } else if (result.errors > 0) {
        toast({
          title: "Sincronización completada con errores",
          description: `${result.errors} errores durante la sincronización`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sincronización completada",
          description: "No se encontraron entradas faltantes para sincronizar",
          variant: "default"
        });
      }
      
      console.log("✅ MonthlyCacheSyncTool: Manual sync completed", result);
    } catch (error) {
      console.error("❌ MonthlyCacheSyncTool: Manual sync failed:", error);
      toast({
        title: "Error en sincronización",
        description: "No se pudo completar la sincronización de caché",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          Sincronización Manual de Caché
        </CardTitle>
        <CardDescription>
          Sincroniza manualmente las entradas de caché mensuales sin activar webhooks automáticos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Sincronizar entradas faltantes</h4>
            <p className="text-sm text-gray-500">
              Busca y sincroniza entradas de caché mensuales que faltan en la base de datos
            </p>
          </div>
          <Button
            onClick={handleManualSync}
            disabled={syncing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </div>

        {lastSyncResult && (
          <div className="p-3 bg-gray-50 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Último resultado:</span>
              <span className="text-xs text-gray-500">
                {new Date(lastSyncResult.timestamp).toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Sincronizadas: {lastSyncResult.synced}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Errores: {lastSyncResult.errors}</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <Database className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Nota:</strong> Esta sincronización solo organiza datos ya existentes en caché. 
              No realiza llamadas a webhooks ni APIs externas.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
