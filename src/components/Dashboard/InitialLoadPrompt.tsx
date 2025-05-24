
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Download } from 'lucide-react';

interface InitialLoadPromptProps {
  onLoadData: () => void;
}

const InitialLoadPrompt: React.FC<InitialLoadPromptProps> = ({ onLoadData }) => {
  const handleLoadClick = () => {
    console.log("🚀 InitialLoadPrompt: User clicked 'Cargar Datos' - triggering explicit data load");
    onLoadData();
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm mb-6">
      <Download className="h-16 w-16 text-blue-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Bienvenido al Analizador Financiero</h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        Los datos financieros no se cargan automáticamente. Haz clic en el botón para cargar los datos del periodo seleccionado desde Zoho Books y Stripe.
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
