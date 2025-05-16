
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface InitialLoadPromptProps {
  onLoadData: () => void;
}

const InitialLoadPrompt: React.FC<InitialLoadPromptProps> = ({ onLoadData }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm mb-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Bienvenido al Analizador Financiero</h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        Haz clic en el botón para cargar los datos financieros del periodo seleccionado.
      </p>
      <Button onClick={onLoadData} className="gap-2">
        <Play className="h-4 w-4" /> Cargar Datos Financieros
      </Button>
    </div>
  );
};

export default InitialLoadPrompt;
