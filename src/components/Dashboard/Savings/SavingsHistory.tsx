import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { History, Pencil, Trash2 } from 'lucide-react';
import { MonthlySavings } from '@/types/financial';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SavingsHistoryProps {
  savings: MonthlySavings[];
  onEdit: (saving: MonthlySavings) => void;
  onDelete: (id: string) => void;
}

export const SavingsHistory: React.FC<SavingsHistoryProps> = ({
  savings,
  onEdit,
  onDelete,
}) => {
  if (savings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Ahorros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay ahorros registrados aún
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Ahorros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mes</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha de Depósito</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {savings.map((saving) => (
              <TableRow key={saving.id}>
                <TableCell className="font-medium">
                  {format(parseISO(saving.month_year + '-01'), 'MMMM yyyy', { locale: es })}
                </TableCell>
                <TableCell className="text-green-600 font-semibold">
                  ${Number(saving.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  {format(parseISO(saving.deposit_date), "d 'de' MMMM, yyyy", { locale: es })}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {saving.notes || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(saving)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(saving.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
