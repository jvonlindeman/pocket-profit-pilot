import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Info } from 'lucide-react';

interface NoDataLoadedStateProps {
  onLoadData: () => void;
  isLoading: boolean;
}

const NoDataLoadedState: React.FC<NoDataLoadedStateProps> = ({
  onLoadData,
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
          Haz clic en el botón para cargar los datos financieros del período seleccionado.
        </p>
        
        <div className="flex justify-center">
          <Button
            onClick={onLoadData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Cloud className="h-4 w-4" />
            {isLoading ? 'Cargando...' : 'Cargar Datos'}
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          Los datos se obtendrán directamente desde las APIs de Zoho Books y Stripe
        </p>
      </CardContent>
    </Card>
  );
};

export default NoDataLoadedState;
