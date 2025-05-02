
import React, { useState } from 'react';
import { format } from 'date-fns';
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

  return (
    <div className="relative">
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
              <Button variant="outline" onClick={resetToCurrentMonth}>
                Mes Actual
              </Button>
              <Button onClick={handleRangeChange}>
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DateRangePicker;
