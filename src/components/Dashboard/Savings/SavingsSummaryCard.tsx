import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, TrendingUp, Calendar } from 'lucide-react';
import { MonthlySavings } from '@/types/financial';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SavingsSummaryCardProps {
  savings: MonthlySavings[];
  totalSavings: number;
}

export const SavingsSummaryCard: React.FC<SavingsSummaryCardProps> = ({
  savings,
  totalSavings,
}) => {
  // Calculate current year savings
  const currentYear = new Date().getFullYear();
  const currentYearSavings = savings
    .filter(s => s.month_year.startsWith(currentYear.toString()))
    .reduce((sum, s) => sum + Number(s.amount), 0);

  // Calculate average monthly savings (last 12 months)
  const last12Months = savings.slice(0, 12);
  const avgMonthly = last12Months.length > 0
    ? last12Months.reduce((sum, s) => sum + Number(s.amount), 0) / last12Months.length
    : 0;

  // Get last deposit info
  const lastDeposit = savings.length > 0 ? savings[0] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5" />
          Resumen de Ahorros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Total Ahorrado</div>
            <div className="text-2xl font-bold text-primary">
              ${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-secondary/5 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Este Año ({currentYear})
            </div>
            <div className="text-2xl font-bold text-secondary">
              ${currentYearSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-accent/5 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Promedio Mensual
            </div>
            <div className="text-2xl font-bold text-accent">
              ${avgMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {lastDeposit && (
          <div className="border-t pt-3 text-sm text-muted-foreground">
            Último depósito: ${Number(lastDeposit.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} el{' '}
            {format(parseISO(lastDeposit.deposit_date), "d 'de' MMMM, yyyy", { locale: es })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
