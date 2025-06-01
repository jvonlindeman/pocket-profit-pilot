
import React from 'react';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MonthlyBalance } from '@/types/financial';

interface BalanceDialogHeaderProps {
  currentBalance?: MonthlyBalance | null;
  currentDate: Date;
}

const BalanceDialogHeader: React.FC<BalanceDialogHeaderProps> = ({
  currentBalance,
  currentDate,
}) => {
  const formattedMonth = (() => {
    try {
      if (currentDate && !isNaN(currentDate.getTime())) {
        return format(currentDate, 'MMMM yyyy', { locale: es });
      }
      return format(new Date(), 'MMMM yyyy', { locale: es });
    } catch (err) {
      return format(new Date(), 'MMMM yyyy', { locale: es });
    }
  })();
  
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  return (
    <DialogHeader>
      <DialogTitle>
        {currentBalance ? 'Editar' : 'Configurar'} Balance Inicial - {capitalizedMonth}
      </DialogTitle>
      <DialogDescription>
        Configure el balance inicial y parámetros para {capitalizedMonth}.
      </DialogDescription>
    </DialogHeader>
  );
};

export default BalanceDialogHeader;
