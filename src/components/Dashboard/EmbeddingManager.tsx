
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Zap, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useEmbeddingManager } from '@/hooks/useEmbeddingManager';

export const EmbeddingManager: React.FC = () => {
  const { progress, generateAllEmbeddings, checkEmbeddingStatus, isRunning } = useEmbeddingManager();
  const [statusChecked, setStatusChecked] = useState(false);

  useEffect(() => {
    // Check status on mount
    const checkStatus = async () => {
      const status = await checkEmbeddingStatus();
      if (status) {
        console.log('Embedding status:', status);
      }
      setStatusChecked(true);
    };
    
    checkStatus();
  }, [checkEmbeddingStatus]);

  const handleGenerateEmbeddings = async () => {
    await generateAllEmbeddings(15); // Process 15 transactions per batch
  };

  const progressPercentage = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
  const embeddingCoverage = progress.total > 0 ? progressPercentage : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Gestión de Embeddings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Transacciones procesadas</p>
            <p className="text-2xl font-bold">
              {progress.processed}
              {progress.total > 0 && <span className="text-sm font-normal text-muted-foreground">/{progress.total}</span>}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Cobertura de búsqueda</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{embeddingCoverage}%</p>
              {embeddingCoverage === 100 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : embeddingCoverage > 80 ? (
                <CheckCircle className="h-5 w-5 text-yellow-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {progress.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de embeddings</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {isRunning && (
            <Badge variant="default" className="animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Procesando...
            </Badge>
          )}
          {progress.errors > 0 && (
            <Badge variant="destructive">
              {progress.errors} errores
            </Badge>
          )}
          {embeddingCoverage === 100 && !isRunning && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completo
            </Badge>
          )}
        </div>

        {/* Description */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            Los embeddings permiten la búsqueda semántica de transacciones. 
            Sin ellos, el asistente no puede realizar búsquedas por descripción.
          </p>
          {embeddingCoverage < 100 && (
            <p className="text-amber-600">
              ⚠️ Búsqueda semántica limitada: solo {embeddingCoverage}% de transacciones están indexadas.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleGenerateEmbeddings}
            disabled={isRunning || !statusChecked}
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isRunning ? 'Generando...' : 'Generar Embeddings'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => checkEmbeddingStatus()}
            disabled={isRunning}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Help Text */}
        {!statusChecked && (
          <div className="text-sm text-muted-foreground">
            Verificando estado de embeddings...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
