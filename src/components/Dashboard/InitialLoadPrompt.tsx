
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Download, Clock, Database } from 'lucide-react';

interface InitialLoadPromptProps {
  onLoadData: () => void;
  cacheChecked?: boolean;
  hasCachedData?: boolean;
}

const InitialLoadPrompt: React.FC<InitialLoadPromptProps> = ({ 
  onLoadData, 
  cacheChecked = false, 
  hasCachedData = false 
}) => {
  const handleLoadClick = () => {
    console.log("🚀 InitialLoadPrompt: User clicked 'Cargar Datos' - triggering manual data load");
    onLoadData();
  };

  // Show loading state while checking cache
  if (!cacheChecked) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm mb-6">
        <Clock className="h-16 w-16 text-blue-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Verificando Datos en Caché...</h2>
        <p className="text-gray-500 text-center max-w-md">
          Revisando si hay datos financieros disponibles en la base de datos local...
        </p>
      </div>
    );
  }

  // Show prompt for manual loading - whether cache exists or not
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm mb-6">
      {hasCachedData ? (
        <>
          <Database className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Datos en Caché Disponibles</h2>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Se encontraron datos en caché para el periodo seleccionado. Haz clic para cargar los datos guardados localmente.
          </p>
          <Button onClick={handleLoadClick} className="gap-2" size="lg" variant="default">
            <Play className="h-4 w-4" /> Cargar Datos desde Caché
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            Los datos se cargarán desde la base de datos local sin llamadas API
          </p>
        </>
      ) : (
        <>
          <Download className="h-16 w-16 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No hay Datos en Caché</h2>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            No se encontraron datos en caché para el periodo seleccionado. Haz clic para obtener datos desde Zoho Books y Stripe.
          </p>
          <Button onClick={handleLoadClick} className="gap-2" size="lg">
            <Download className="h-4 w-4" /> Obtener Datos desde API
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            Se realizarán llamadas API para obtener los datos más recientes
          </p>
        </>
      )}
    </div>
  );
};

export default InitialLoadPrompt;
