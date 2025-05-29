
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EmbeddingProgress {
  processed: number;
  total: number;
  errors: number;
  isRunning: boolean;
  hasMore: boolean;
}

export const useEmbeddingManager = () => {
  const [progress, setProgress] = useState<EmbeddingProgress>({
    processed: 0,
    total: 0,
    errors: 0,
    isRunning: false,
    hasMore: false
  });

  const generateAllEmbeddings = useCallback(async (batchSize: number = 20) => {
    console.log('Starting mass embedding generation...');
    setProgress(prev => ({ ...prev, isRunning: true }));

    try {
      let totalProcessed = 0;
      let totalErrors = 0;
      let hasMore = true;
      let iterations = 0;
      const maxIterations = 50; // Safety limit

      while (hasMore && iterations < maxIterations) {
        console.log(`Embedding generation iteration ${iterations + 1}`);
        
        const { data, error } = await supabase.functions.invoke('generate-embeddings', {
          body: {
            batchSize,
            forceRegenerate: false
          },
        });

        if (error) {
          console.error('Error generating embeddings:', error);
          throw new Error(error.message || 'Error generating embeddings');
        }

        if (data) {
          totalProcessed += data.processed || 0;
          totalErrors += data.errors || 0;
          hasMore = data.hasMore || false;

          setProgress({
            processed: totalProcessed,
            total: data.total || 0,
            errors: totalErrors,
            isRunning: hasMore,
            hasMore
          });

          console.log(`Batch completed: ${data.processed} processed, ${data.errors} errors, ${data.hasMore ? 'more batches needed' : 'completed'}`);

          // Small delay between iterations to avoid overwhelming the system
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        iterations++;
      }

      if (iterations >= maxIterations) {
        console.warn('Mass embedding generation stopped due to iteration limit');
        toast({
          title: 'Advertencia',
          description: 'Generación de embeddings pausada por límite de seguridad. Puede continuar manualmente.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Embeddings generados',
          description: `Se procesaron ${totalProcessed} transacciones exitosamente con ${totalErrors} errores.`,
        });
      }

    } catch (error) {
      console.error('Error in mass embedding generation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error generando embeddings',
        variant: 'destructive',
      });
    } finally {
      setProgress(prev => ({ ...prev, isRunning: false }));
    }
  }, []);

  const checkEmbeddingStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          batchSize: 0, // Just check status
          forceRegenerate: false
        },
      });

      if (error) {
        console.error('Error checking embedding status:', error);
        return null;
      }

      return {
        processed: data?.processed || 0,
        total: data?.total || 0,
        errors: data?.errors || 0,
        hasMore: data?.hasMore || false
      };
    } catch (error) {
      console.error('Error checking embedding status:', error);
      return null;
    }
  }, []);

  return {
    progress,
    generateAllEmbeddings,
    checkEmbeddingStatus,
    isRunning: progress.isRunning
  };
};
