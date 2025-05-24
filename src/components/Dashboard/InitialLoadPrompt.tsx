
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Download, Clock } from 'lucide-react';

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
    console.log("🚀 InitialLoadPrompt: User clicked 'Cargar Datos' - triggering explicit data load");
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

  // Don't show prompt if we have cached data
  if (hasCachedData) {
    return null;
  }

  // Show prompt only if no cached data is available
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm mb-6">
      <Download className="h-16 w-16 text-blue-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Bienvenido al Analizador Financiero</h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        No se encontraron datos en caché para el periodo seleccionado. Haz clic en el botón para cargar los datos desde Zoho Books y Stripe.
      </p>
      <Button onClick={handleLoadClick} className="gap-2" size="lg">
        <Play className="h-4 w-4" /> Cargar Datos Financieros
      </Button>
      <p className="text-xs text-gray-400 mt-2">
        Se verificará primero si hay datos en caché antes de hacer llamadas API
      </p>
    </div>
  );
};

export default InitialLoadPrompt;
