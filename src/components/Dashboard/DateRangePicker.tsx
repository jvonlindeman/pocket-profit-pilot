
import React, { useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, subDays, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DateRangePickerProps {
  dateRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  getCurrentMonthRange: () => DateRange;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onRangeChange,
  getCurrentMonthRange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: dateRange.startDate,
    to: dateRange.endDate
  });

  // Formato para mostrar el rango de fechas
  const formatDateRange = () => {
    return `${format(dateRange.startDate, 'd MMM yyyy', { locale: es })} - ${format(dateRange.endDate, 'd MMM yyyy', { locale: es })}`;
  };

  // Handler para aplicar el cambio de rango de fechas
  const handleRangeChange = () => {
    if (tempRange.from && tempRange.to) {
      onRangeChange({
        startDate: tempRange.from,
        endDate: tempRange.to
      });
      setIsOpen(false);
    }
  };

  // Resetear al mes actual
  const resetToCurrentMonth = () => {
    const currentMonth = getCurrentMonthRange();
    onRangeChange(currentMonth);
    setTempRange({
      from: currentMonth.startDate,
      to: currentMonth.endDate
    });
    setIsOpen(false);
  };

  // Mes pasado
  const setLastMonth = () => {
    const today = new Date();
    const firstDayLastMonth = startOfMonth(subMonths(today, 1));
    const lastDayLastMonth = endOfMonth(subMonths(today, 1));
    
    const newRange = {
      startDate: firstDayLastMonth,
      endDate: lastDayLastMonth
    };
    
    onRangeChange(newRange);
    setTempRange({
      from: firstDayLastMonth,
      to: lastDayLastMonth
    });
    setIsOpen(false);
  };

  // Últimos 30 días
  const setLast30Days = () => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    
    const newRange = {
      startDate: thirtyDaysAgo,
      endDate: today
    };
    
    onRangeChange(newRange);
    setTempRange({
      from: thirtyDaysAgo,
      to: today
    });
    setIsOpen(false);
  };

  // Este año
  const setThisYear = () => {
    const today = new Date();
    const firstDayOfYear = startOfYear(today);
    
    const newRange = {
      startDate: firstDayOfYear,
      endDate: today
    };
    
    onRangeChange(newRange);
    setTempRange({
      from: firstDayOfYear,
      to: today
    });
    setIsOpen(false);
  };

  // Último mes completo hasta mes actual
  const setPreviousAndCurrentMonth = () => {
    const today = new Date();
    const firstDayLastMonth = startOfMonth(subMonths(today, 1));
    const lastDayCurrentMonth = endOfMonth(today);
    
    const newRange = {
      startDate: firstDayLastMonth,
      endDate: lastDayCurrentMonth
    };
    
    onRangeChange(newRange);
    setTempRange({
      from: firstDayLastMonth,
      to: lastDayCurrentMonth
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-full",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>{formatDateRange()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Seleccionar rango</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLastMonth()}>
                      Mes pasado
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPreviousAndCurrentMonth()}>
                      Mes anterior + actual
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => resetToCurrentMonth()}>
                      Mes actual
                    </Button>
                  </div>
                </div>
              </div>
              <Calendar
                mode="range"
                defaultMonth={dateRange.startDate}
                selected={{
                  from: tempRange.from,
                  to: tempRange.to,
                }}
                onSelect={(range) => {
                  setTempRange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
              <div className="flex justify-end gap-2 p-3 border-t">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="outline" onClick={() => setThisYear()}>
                  Este año
                </Button>
                <Button onClick={handleRangeChange}>
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            <DropdownMenuItem onClick={resetToCurrentMonth}>Mes actual</DropdownMenuItem>
            <DropdownMenuItem onClick={setLastMonth}>Mes pasado</DropdownMenuItem>
            <DropdownMenuItem onClick={setPreviousAndCurrentMonth}>Mes anterior + actual</DropdownMenuItem>
            <DropdownMenuItem onClick={setLast30Days}>Últimos 30 días</DropdownMenuItem>
            <DropdownMenuItem onClick={setThisYear}>Este año</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default DateRangePicker;
