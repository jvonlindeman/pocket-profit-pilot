
import { FinancialData } from '@/types/financial';

// API timeout in milliseconds
export const API_TIMEOUT_MS = 30000; // 30 seconds

// Empty financial data object to use as initial state
export const emptyFinancialData: FinancialData = {
  summary: {
    totalIncome: 0,
    totalExpense: 0,
    collaboratorExpense: 0,
    otherExpense: 0,
    profit: 0,
    profitMargin: 0
  },
  transactions: [],
  incomeBySource: [],
  expenseByCategory: [],
  dailyData: {
    income: { labels: [], values: [] },
    expense: { labels: [], values: [] }
  },
  monthlyData: {
    income: { labels: [], values: [] },
    expense: { labels: [], values: [] },
    profit: { labels: [], values: [] }
  }
};

// Create a simplified version of the CacheStatusDisplay component for direct integration
<lov-write file_path="src/components/Dashboard/SimpleStatusDisplay.tsx">
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { RefreshStatus } from '@/types/finance-hooks';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SimpleStatusDisplayProps {
  lastRefresh: Date;
  onRefreshClick: () => void;
  isRefreshing: boolean;
  refreshAttempts: number;
}

const SimpleStatusDisplay: React.FC<SimpleStatusDisplayProps> = ({
  lastRefresh,
  onRefreshClick,
  isRefreshing,
  refreshAttempts
}) => {
  // Calculate time since last refresh
  const lastRefreshTime = formatDistanceToNow(new Date(lastRefresh), { addSuffix: true, locale: es });
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div>Estado de los Datos</div>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center" 
            onClick={onRefreshClick}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refrescando...' : 'Refrescar'}
          </Button>
        </CardTitle>
        <CardDescription className="text-xs">
          Última actualización: {lastRefreshTime}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs space-y-1">
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-gray-600">
            <div>Actualizaciones en esta sesión: {refreshAttempts}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleStatusDisplay;
