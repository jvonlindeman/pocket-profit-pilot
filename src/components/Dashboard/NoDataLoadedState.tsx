import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Database, Info } from 'lucide-react';

interface NoDataLoadedStateProps {
  onLoadCache: () => void;
  onLoadFresh: () => void;
  hasCachedData: boolean;
  isLoading: boolean;
}

const NoDataLoadedState: React.FC<NoDataLoadedStateProps> = ({
  onLoadCache,
  onLoadFresh,
  hasCachedData,
  isLoading
}) => {
  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Sin Datos Cargados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">
          Haz clic en "Llamar API" para cargar los datos financieros del período seleccionado.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onLoadCache}
            variant="outline"
            disabled={isLoading || !hasCachedData}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {hasCachedData ? 'Cargar desde Cache' : 'Sin Cache Disponible'}
          </Button>
          
          <Button
            onClick={onLoadFresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Cloud className="h-4 w-4" />
            Cargar Datos Frescos
          </Button>
        </div>
        
        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p><strong>Cache:</strong> Datos previamente guardados (más rápido)</p>
          <p><strong>Frescos:</strong> Datos directos de las APIs (más actualizado)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoDataLoadedState;