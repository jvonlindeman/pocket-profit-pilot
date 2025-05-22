
import React from 'react';
import DateRangePicker from '@/components/Dashboard/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DateRange as DayPickerDateRange } from 'react-day-picker';
import { toDayPickerDateRange, toFinancialDateRange } from '@/utils/dateRangeAdapter';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardHeaderProps {
  dateRange: { startDate: Date; endDate: Date };
  onDateRangeChange: (newRange: DayPickerDateRange) => void;
  getCurrentMonthRange: () => DayPickerDateRange;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  dateRange,
  onDateRangeChange,
  getCurrentMonthRange
}) => {
  const isMobile = useIsMobile();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>Analizador Financiero</h1>
            <p className="mt-1 text-sm text-gray-500">Análisis de ingresos y gastos para tu agencia</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-3">
            <Button variant="outline" size={isMobile ? "sm" : "sm"} asChild className={isMobile ? "w-full" : ""}>
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Link>
            </Button>
            <div className={isMobile ? "w-full" : "w-64"}>
              <DateRangePicker
                dateRange={toDayPickerDateRange(dateRange)}
                onRangeChange={onDateRangeChange}
                getCurrentMonthRange={getCurrentMonthRange}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
