
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeSelectorProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChanged: (startDate: Date, endDate: Date) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onDateRangeChanged,
}) => {
  const [date, setDate] = React.useState<Date>(startDate);
  const [isStartDate, setIsStartDate] = React.useState<boolean>(true);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    if (isStartDate) {
      setDate(selectedDate);
      setIsStartDate(false);
      // If selecting start date after end date, reset end date too
      if (selectedDate > endDate) {
        onDateRangeChanged(selectedDate, selectedDate);
      } else {
        onDateRangeChanged(selectedDate, endDate);
      }
    } else {
      setIsStartDate(true);
      // Ensure end date is not before start date
      if (selectedDate < startDate) {
        onDateRangeChanged(selectedDate, selectedDate);
      } else {
        onDateRangeChanged(startDate, selectedDate);
      }
    }
  };

  const buttonText = isStartDate 
    ? `${format(startDate, 'dd/MM/yyyy', { locale: es })} - ${format(endDate, 'dd/MM/yyyy', { locale: es })}`
    : `Seleccione fecha final`;

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {buttonText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={isStartDate ? startDate : endDate}
            onSelect={handleSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangeSelector;
