
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Database } from 'lucide-react';

interface CacheSourceStatusProps {
  name: string;
  status: {
    cached: boolean;
    partial: boolean;
    recommendedAction: 'use_cache' | 'refresh_partial' | 'refresh_full';
  };
}

const CacheSourceStatus: React.FC<CacheSourceStatusProps> = ({ name, status }) => {
  const getStatusIcon = () => {
    if (status.cached && !status.partial) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status.cached && status.partial) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (status.cached && !status.partial) {
      return 'Completamente en caché ✅';
    } else if (status.cached && status.partial) {
      return 'Parcialmente en caché ⚠️';
    } else {
      return 'No en caché ❌';
    }
  };

  const getRecommendationText = () => {
    switch (status.recommendedAction) {
      case 'use_cache':
        return '✅ Usar datos del caché';
      case 'refresh_partial':
        return '⚠️ Actualización parcial recomendada';
      case 'refresh_full':
        return '🔄 Actualización completa recomendada';
      default:
        return '🔍 Analizando...';
    }
  };

  const getRecommendationVariant = () => {
    switch (status.recommendedAction) {
      case 'use_cache':
        return 'default' as const;
      case 'refresh_partial':
        return 'secondary' as const;
      case 'refresh_full':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="bg-muted/50 p-3 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">{name}</h4>
        {getStatusIcon()}
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {getStatusText()}
      </p>
      <Badge 
        variant={getRecommendationVariant()} 
        className="text-xs"
      >
        {getRecommendationText()}
      </Badge>
    </div>
  );
};

export default CacheSourceStatus;
