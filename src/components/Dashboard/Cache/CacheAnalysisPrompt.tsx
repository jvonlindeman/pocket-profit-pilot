
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Play } from 'lucide-react';

interface CacheAnalysisPromptProps {
  onAnalyze: () => void;
}

const CacheAnalysisPrompt: React.FC<CacheAnalysisPromptProps> = ({ onAnalyze }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-blue-500" />
          Cache Inteligente Optimizado
        </CardTitle>
        <CardDescription>
          Sistema inteligente que prioriza base de datos local antes que APIs externas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-gray-600 mb-4 text-center">
            Haz clic para analizar el estado actual del caché
          </p>
          <Button onClick={onAnalyze} className="gap-2">
            <Play className="h-4 w-4" />
            Analizar Caché
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheAnalysisPrompt;
