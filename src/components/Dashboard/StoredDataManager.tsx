
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStoredFinancialData } from '@/hooks/useStoredFinancialData';
import { Database, Trash2, RefreshCw, HardDrive, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const StoredDataManager: React.FC = () => {
  const { storageSummary, latestSnapshot, clearStorage, refreshSummary } = useStoredFinancialData();
  const { toast } = useToast();

  const handleClearStorage = () => {
    clearStorage();
    toast({
      title: "Datos eliminados",
      description: "Todos los datos financieros almacenados han sido eliminados",
      variant: "default"
    });
  };

  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Datos Financieros Almacenados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Storage Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {storageSummary?.totalSnapshots || 0}
            </div>
            <div className="text-sm text-blue-600">Snapshots</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              <HardDrive className="h-4 w-4" />
              {formatStorageSize(storageSummary?.storageSize || 0)}
            </div>
            <div className="text-sm text-green-600">Tamaño</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
              <Clock className="h-4 w-4" />
              {latestSnapshot ? 'Sí' : 'No'}
            </div>
            <div className="text-sm text-purple-600">Datos Recientes</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {storageSummary?.availableDateRanges?.length || 0}
            </div>
            <div className="text-sm text-orange-600">Períodos</div>
          </div>
        </div>

        {/* Latest Snapshot Info */}
        {latestSnapshot && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Último Snapshot
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">Período:</span>{' '}
                {formatDate(latestSnapshot.dateRange.startDate)} - {formatDate(latestSnapshot.dateRange.endDate)}
              </div>
              <div>
                <span className="font-medium">Capturado:</span>{' '}
                {formatDate(latestSnapshot.timestamp)}
              </div>
              <div>
                <span className="font-medium">Transacciones:</span>{' '}
                {latestSnapshot.data.transactions?.length || 0}
              </div>
              <div>
                <span className="font-medium">Fuente:</span>{' '}
                <Badge variant={latestSnapshot.metadata.usingCachedData ? "secondary" : "default"}>
                  {latestSnapshot.metadata.dataSource}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Available Date Ranges */}
        {storageSummary?.availableDateRanges && storageSummary.availableDateRanges.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Períodos Disponibles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {storageSummary.availableDateRanges.map((range, index) => (
                <div key={index} className="text-xs p-2 bg-white border rounded">
                  {formatDate(range.start)} - {formatDate(range.end)}
                  <div className="text-gray-500">
                    Guardado: {formatDate(range.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSummary}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearStorage}
            disabled={!storageSummary?.totalSnapshots}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar Datos
          </Button>
        </div>

        {/* GPT Context Info */}
        <div className="text-xs text-gray-600 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
          <strong>💡 Para GPT:</strong> Los datos almacenados se envían automáticamente al asistente financiero para 
          proporcionar contexto completo sobre tu historial financiero, incluso cuando cambias de período o navegas por la aplicación.
        </div>
      </CardContent>
    </Card>
  );
};
