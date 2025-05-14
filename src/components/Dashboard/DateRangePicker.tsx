
import React, { useState } from 'react';
import { format, endOfMonth, subMonths, startOfMonth, subDays, startOfYear } from 'date-fns';
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
import { 
  toPanamaTime, 
  formatInPanamaTimezone, 
  PANAMA_TIMEZONE,
  formatDateForPanamaDisplay
} from '@/utils/timezoneUtils';

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

  // Format for displaying date range using Panama timezone
  const formatDateRange = () => {
    return `${formatDateForPanamaDisplay(dateRange.startDate)} - ${formatDateForPanamaDisplay(dateRange.endDate)}`;
  };

  // Handler for applying date range changes
  const handleRangeChange = () => {
    if (tempRange.from && tempRange.to) {
      // CRITICAL FIX: Ensure we preserve the exact dates in Panama timezone
      // Set time to noon to avoid any timezone shifts
      const startDate = new Date(tempRange.from);
      const endDate = new Date(tempRange.to);
      
      // Explicitly set time to noon to prevent timezone issues
      startDate.setHours(12, 0, 0, 0);
      endDate.setHours(12, 0, 0, 0);
      
      console.log("DateRangePicker - Selected exact dates:", {
        startDate: startDate,
        startDateISO: startDate.toISOString(),
        panamaStartDate: formatInPanamaTimezone(startDate, 'yyyy-MM-dd HH:mm:ss'),
        endDate: endDate,
        endDateISO: endDate.toISOString(),
        panamaEndDate: formatInPanamaTimezone(endDate, 'yyyy-MM-dd HH:mm:ss'),
        timezone: PANAMA_TIMEZONE
      });
      
      onRangeChange({
        startDate: startDate,
        endDate: endDate
      });
      setIsOpen(false);
    }
  };

  // Helper to consistently create dates with noon time to prevent timezone issues
  const createStableDate = (date: Date): Date => {
    const stableDate = new Date(date);
    stableDate.setHours(12, 0, 0, 0);
    return stableDate;
  };

  // Reset to current month
  const resetToCurrentMonth = () => {
    const currentMonth = getCurrentMonthRange();
    const stableDates = {
      startDate: createStableDate(currentMonth.startDate),
      endDate: createStableDate(currentMonth.endDate)
    };
    
    onRangeChange(stableDates);
    setTempRange({
      from: stableDates.startDate,
      to: stableDates.endDate
    });
    setIsOpen(false);
  };

  // Last month
  const setLastMonth = () => {
    const today = new Date();
    const panamaNow = toPanamaTime(today);
    
    // Use date-fns operations but ensure we're working in Panama timezone
    const firstDayLastMonth = createStableDate(startOfMonth(subMonths(panamaNow, 1)));
    const lastDayLastMonth = createStableDate(endOfMonth(subMonths(panamaNow, 1)));
    
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

  // Last 30 days
  const setLast30Days = () => {
    const today = createStableDate(toPanamaTime(new Date()));
    const thirtyDaysAgo = createStableDate(subDays(today, 30));
    
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

  // This year
  const setThisYear = () => {
    const today = createStableDate(toPanamaTime(new Date()));
    const firstDayOfYear = createStableDate(startOfYear(today));
    
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

  // Last day of previous month to last day of current month
  const setPreviousMonthEndToCurrentMonthEnd = () => {
    const today = toPanamaTime(new Date());
    const lastDayPreviousMonth = createStableDate(endOfMonth(subMonths(today, 1)));
    const lastDayCurrMonth = createStableDate(endOfMonth(today));
    
    const newRange = {
      startDate: lastDayPreviousMonth,
      endDate: lastDayCurrMonth
    };
    
    onRangeChange(newRange);
    setTempRange({
      from: lastDayPreviousMonth,
      to: lastDayCurrMonth
    });
    setIsOpen(false);
  };

  // Previous and current month
  const setPreviousAndCurrentMonth = () => {
    const today = toPanamaTime(new Date());
    const firstDayLastMonth = createStableDate(startOfMonth(subMonths(today, 1)));
    const lastDayCurrentMonth = createStableDate(endOfMonth(today));
    
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
                    <Button size="sm" variant="outline" onClick={setLastMonth}>
                      Mes pasado
                    </Button>
                    <Button size="sm" variant="outline" onClick={setPreviousAndCurrentMonth}>
                      Mes anterior + actual
                    </Button>
                    <Button size="sm" variant="outline" onClick={resetToCurrentMonth}>
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
                <Button variant="outline" onClick={setPreviousMonthEndToCurrentMonthEnd}>
                  Fin mes anterior a fin actual
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
            <DropdownMenuItem onClick={setPreviousMonthEndToCurrentMonthEnd}>Fin mes anterior a fin actual</DropdownMenuItem>
            <DropdownMenuItem onClick={setThisYear}>Este año</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default DateRangePicker;
