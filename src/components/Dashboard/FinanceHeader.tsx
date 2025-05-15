
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import DateRangePicker from '@/components/Dashboard/DateRangePicker';
import { DateRange } from 'react-day-picker';

interface FinanceHeaderProps {
  dateRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  getCurrentMonthRange: () => DateRange;
}

const FinanceHeader: React.FC<FinanceHeaderProps> = ({
  dateRange,
  onRangeChange,
  getCurrentMonthRange
}) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analizador Financiero</h1>
            <p className="mt-1 text-sm text-gray-500">Análisis de ingresos y gastos para tu agencia</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Link>
            </Button>
            <div className="w-full md:w-64">
              <DateRangePicker
                dateRange={dateRange}
                onRangeChange={onRangeChange}
                getCurrentMonthRange={getCurrentMonthRange}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default FinanceHeader;
