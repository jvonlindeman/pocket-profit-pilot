import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface InitialLoadPromptProps {
  onLoadData: () => void;
}

const InitialLoadPrompt: React.FC<InitialLoadPromptProps> = ({ onLoadData }) => {
  const handleLoadClick = () => {
    console.log("🚀 InitialLoadPrompt: User clicked 'Cargar Datos' - triggering manual data load");
    onLoadData();
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm mb-6">
      <Download className="h-16 w-16 text-blue-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Cargar Datos Financieros</h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        Haz clic para obtener los datos financieros del periodo seleccionado desde Zoho Books y Stripe.
      </p>
      <Button onClick={handleLoadClick} className="gap-2" size="lg">
        <Download className="h-4 w-4" /> Cargar Datos
      </Button>
      <p className="text-xs text-gray-400 mt-2">
        Se realizarán llamadas API para obtener los datos más recientes
      </p>
    </div>
  );
};

export default InitialLoadPrompt;
