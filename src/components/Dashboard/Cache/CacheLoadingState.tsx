
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, RefreshCw } from 'lucide-react';

const CacheLoadingState: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Analizando Eficiencia del Caché...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-20">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheLoadingState;
