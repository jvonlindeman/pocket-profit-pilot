
import React, { useState, useCallback } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useCacheAdmin } from '@/hooks/cache/useCacheAdmin';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash, RefreshCw, Database } from 'lucide-react';

const CacheClearTool = () => {
  const { isLoadingStats, isClearingCache, clearCache, loadCacheStats, verifyCacheIntegrity } = useCacheAdmin();

  const [source, setSource] = useState<'Zoho' | 'Stripe' | 'all'>('all');
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: Date | undefined; endDate: Date | undefined }>({
    startDate: undefined,
    endDate: undefined
  });
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Handler for clearing the cache
  const handleClearCache = useCallback(async () => {
    // Build options based on selected values
    const options: {
      source?: 'Zoho' | 'Stripe' | 'all';
      startDate?: Date;
      endDate?: Date;
    } = { source };

    // Only include date range if both dates are set
    if (showDateRangePicker && dateRange.startDate && dateRange.endDate) {
      options.startDate = dateRange.startDate;
      options.endDate = dateRange.endDate;
    }

    const sourceDisplay = source === 'all' ? 'todas las fuentes' : source;
    const dateRangeDisplay = (showDateRangePicker && dateRange.startDate && dateRange.endDate)
      ? `del ${format(dateRange.startDate, 'dd/MM/yyyy')} al ${format(dateRange.endDate, 'dd/MM/yyyy')}`
      : 'todo el período';

    // Ask for confirmation
    if (!window.confirm(
      `¿Estás seguro de que quieres borrar la caché para ${sourceDisplay} ${dateRangeDisplay}?`
    )) {
      return;
    }

    // Perform the clear operation
    const success = await clearCache(options);
    
    if (success) {
      // Reset the date range if it was used
      if (showDateRangePicker) {
        setDateRange({ startDate: undefined, endDate: undefined });
        setShowDateRangePicker(false);
      }
      
      // Refresh the stats
      await loadCacheStats();
    }
  }, [source, showDateRangePicker, dateRange, clearCache, loadCacheStats]);

  const handleVerifyCacheIntegrity = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast({
        title: "Fechas requeridas",
        description: "Por favor selecciona un rango de fechas para verificar la integridad de la caché",
        variant: "destructive"
      });
      return;
    }
    
    await verifyCacheIntegrity(source, dateRange.startDate, dateRange.endDate);
  }, [source, dateRange, verifyCacheIntegrity]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Administración de caché
        </CardTitle>
        <CardDescription>
          Herramientas para administrar los datos en caché
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="source" className="text-sm font-medium">Fuente de datos</label>
            <Select value={source} onValueChange={(value) => setSource(value as 'Zoho' | 'Stripe' | 'all')}>
              <SelectTrigger id="source" className="w-full">
                <SelectValue placeholder="Seleccionar fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fuentes</SelectItem>
                <SelectItem value="Zoho">Zoho</SelectItem>
                <SelectItem value="Stripe">Stripe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="dateRangeToggle"
              checked={showDateRangePicker}
              onChange={() => setShowDateRangePicker(!showDateRangePicker)}
              className="mr-2"
            />
            <label htmlFor="dateRangeToggle" className="text-sm font-medium">
              Limitar por rango de fechas
            </label>
          </div>

          {showDateRangePicker && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha de inicio</label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.startDate ? format(dateRange.startDate, 'PPP') : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.startDate}
                      onSelect={(date) => {
                        setDateRange(prev => ({ ...prev, startDate: date || undefined }));
                        setStartDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium">Fecha de fin</label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.endDate ? format(dateRange.endDate, 'PPP') : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.endDate}
                      onSelect={(date) => {
                        setDateRange(prev => ({ ...prev, endDate: date || undefined }));
                        setEndDateOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => 
                        dateRange.startDate ? date < dateRange.startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              disabled={isLoadingStats || !showDateRangePicker || !dateRange.startDate || !dateRange.endDate}
              onClick={handleVerifyCacheIntegrity}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar integridad
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleClearCache}
              disabled={isClearingCache}
            >
              {isClearingCache ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Borrar caché
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheClearTool;
