
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MonthlyCacheSync } from '@/services/cache/syncMonthlyCache';

export default function MonthlyCacheSyncTool() {
  const [diagnosing, setDiagnosing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    missingEntries: Array<{ source: string; year: number; month: number; transactionCount: number }>;
    totalMissing: number;
    errors: number;
    timestamp: string;
  } | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number;
    errors: number;
    timestamp: string;
  } | null>(null);
  const { toast } = useToast();

  const handleDiagnostic = async () => {
    setDiagnosing(true);
    console.log("🔍 MonthlyCacheSyncTool: Starting READ-ONLY diagnostic (NO WEBHOOKS)");
    
    try {
      const result = await MonthlyCacheSync.diagnoseMissingEntries();
      
      setDiagnosticResult({
        ...result,
        timestamp: new Date().toISOString()
      });
      
      if (result.totalMissing > 0) {
        toast({
          title: "Diagnostic completado",
          description: `Se encontraron ${result.totalMissing} entradas faltantes en caché mensual`,
          variant: "default"
        });
      } else if (result.errors > 0) {
        toast({
          title: "Diagnostic completado con errores",
          description: `${result.errors} errores durante el diagnóstico`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Diagnostic completado",
          description: "No se encontraron entradas faltantes en caché mensual",
          variant: "default"
        });
      }
      
      console.log("✅ MonthlyCacheSyncTool: Diagnostic completed (NO WEBHOOKS CALLED)", result);
    } catch (error) {
      console.error("❌ MonthlyCacheSyncTool: Diagnostic failed:", error);
      toast({
        title: "Error en diagnóstico",
        description: "No se pudo completar el diagnóstico de caché",
        variant: "destructive"
      });
    } finally {
      setDiagnosing(false);
    }
  };

  const handleActualSync = async () => {
    setSyncing(true);
    console.warn("⚠️ MonthlyCacheSyncTool: Starting ACTUAL sync - WEBHOOKS MAY BE CALLED");
    
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
      
      console.log("✅ MonthlyCacheSyncTool: Actual sync completed", result);
      
      // Refresh diagnostic after sync
      setTimeout(() => handleDiagnostic(), 1000);
    } catch (error) {
      console.error("❌ MonthlyCacheSyncTool: Actual sync failed:", error);
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
          Diagnóstico de Caché Mensual
        </CardTitle>
        <CardDescription>
          Herramientas para diagnosticar y sincronizar entradas de caché mensuales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Diagnostic Section */}
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
          <div>
            <h4 className="font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              Diagnóstico (Solo Lectura)
            </h4>
            <p className="text-sm text-gray-600">
              Revisa qué entradas faltan sin hacer cambios (NO llama webhooks)
            </p>
          </div>
          <Button
            onClick={handleDiagnostic}
            disabled={diagnosing}
            variant="outline"
            size="sm"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Eye className={`h-4 w-4 mr-2 ${diagnosing ? 'animate-spin' : ''}`} />
            {diagnosing ? 'Diagnosticando...' : 'Diagnosticar'}
          </Button>
        </div>

        {/* Diagnostic Results */}
        {diagnosticResult && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Resultado del diagnóstico:</span>
              <span className="text-xs text-gray-500">
                {new Date(diagnosticResult.timestamp).toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Faltantes: {diagnosticResult.totalMissing}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Errores: {diagnosticResult.errors}</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-500" />
                <span>Total: {diagnosticResult.missingEntries.length}</span>
              </div>
            </div>

            {diagnosticResult.missingEntries.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">Entradas faltantes:</div>
                <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                  {diagnosticResult.missingEntries.map((entry, index) => (
                    <div key={index} className="flex justify-between bg-white p-1 rounded">
                      <span>{entry.source} {entry.year}/{entry.month}</span>
                      <span>{entry.transactionCount} txns</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actual Sync Section - Only show if there are missing entries */}
        {diagnosticResult && diagnosticResult.totalMissing > 0 && (
          <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Sincronización Real (¡PELIGRO!)
              </h4>
              <p className="text-sm text-orange-700">
                Sincroniza realmente las entradas faltantes (PUEDE llamar webhooks)
              </p>
            </div>
            <Button
              onClick={handleActualSync}
              disabled={syncing}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
        )}

        {/* Sync Results */}
        {lastSyncResult && (
          <div className="p-3 bg-gray-50 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Último resultado de sincronización:</span>
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
              <strong>Uso seguro:</strong> Usa siempre "Diagnosticar" primero (solo lectura, sin webhooks). 
              Solo usa "Sincronizar" si realmente necesitas escribir a la base de datos.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
